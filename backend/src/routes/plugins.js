import express from 'express';
import { db } from '../index.js';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import paypal from '@paypal/checkout-server-sdk';

const router = express.Router();
const prefix = process.env.DB_TABLE_PREFIX || '';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const payPalClient = new paypal.core.PayPalHttpClient(
  new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
  )
);

// Lấy danh sách plugin
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT id, name, description, price FROM ${prefix}plugins`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy chi tiết plugin
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT id, name, description, price FROM ${prefix}plugins WHERE id=?`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tải về plugin (nếu đã mua)
router.get('/:id/download', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  try {
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;
    const [orders] = await db.query(`SELECT * FROM ${prefix}orders WHERE user_id=? AND plugin_id=? AND status='paid'`, [userId, req.params.id]);
    if (orders.length === 0) return res.status(403).json({ error: 'Not purchased' });
    const [plugins] = await db.query(`SELECT file_url FROM ${prefix}plugins WHERE id=?`, [req.params.id]);
    if (plugins.length === 0) return res.status(404).json({ error: 'Not found' });
    // Trả về link tải file (hoặc redirect)
    res.json({ url: plugins[0].file_url });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.post('/create-stripe-session', async (req, res) => {
  const { pluginId, email } = req.body;
  try {
    const [rows] = await db.query(`SELECT * FROM ${prefix}plugins WHERE id=?`, [pluginId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Plugin nicht gefunden' });
    const plugin = rows[0];
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: plugin.name,
            description: plugin.description,
          },
          unit_amount: Math.round(plugin.price * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://your-frontend-domain.com/checkout-success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://your-frontend-domain.com/checkout-cancel',
      metadata: { pluginId }
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/verify-stripe-session', async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ success: false, error: 'Fehlende Sitzungs-ID.' });
  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status === 'paid' && session.metadata && session.metadata.pluginId && session.customer_email) {
      // Lấy user_id từ email
      const [users] = await db.query(`SELECT id FROM ${prefix}users WHERE email=?`, [session.customer_email]);
      if (users.length === 0) return res.status(404).json({ success: false, error: 'Benutzer nicht gefunden.' });
      const userId = users[0].id;
      const pluginId = session.metadata.pluginId;
      // Kiểm tra đã có đơn hàng chưa
      const [orders] = await db.query(`SELECT id FROM ${prefix}orders WHERE user_id=? AND plugin_id=? AND status='paid'`, [userId, pluginId]);
      if (orders.length === 0) {
        await db.query(`INSERT INTO ${prefix}orders (user_id, plugin_id, status) VALUES (?, ?, 'paid')`, [userId, pluginId]);
      }
      return res.json({ success: true, pluginId });
    } else {
      return res.status(400).json({ success: false, error: 'Zahlung nicht abgeschlossen.' });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Fehler bei der Stripe-Überprüfung.' });
  }
});

router.post('/create-paypal-order', async (req, res) => {
  const { pluginId } = req.body;
  try {
    const [rows] = await db.query(`SELECT * FROM ${prefix}plugins WHERE id=?`, [pluginId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Plugin nicht gefunden' });
    const plugin = rows[0];
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [{
        amount: {
          currency_code: "EUR",
          value: plugin.price.toString(),
        },
        description: plugin.name,
      }],
      application_context: {
        return_url: "https://your-frontend-domain.com/checkout-paypal-success",
        cancel_url: "https://your-frontend-domain.com/checkout-cancel"
      }
    });
    const order = await payPalClient.execute(request);
    const approveUrl = order.result.links.find(l => l.rel === 'approve').href;
    res.json({ url: approveUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/verify-paypal-order', async (req, res) => {
  const { token } = req.query; // token là orderId của PayPal
  if (!token) return res.status(400).json({ success: false, error: 'Fehlende Order-ID.' });
  try {
    const request = new paypal.orders.OrdersGetRequest(token);
    const order = await payPalClient.execute(request);
    if (order.result.status === 'COMPLETED') {
      const payerEmail = order.result.payer.email_address;
      const pluginName = order.result.purchase_units[0].description;
      const [plugins] = await db.query(`SELECT id FROM ${prefix}plugins WHERE name=?`, [pluginName]);
      if (plugins.length === 0) return res.status(404).json({ success: false, error: 'Plugin nicht gefunden.' });
      const pluginId = plugins[0].id;
      const [users] = await db.query(`SELECT id FROM ${prefix}users WHERE email=?`, [payerEmail]);
      if (users.length === 0) return res.status(404).json({ success: false, error: 'Benutzer nicht gefunden.' });
      const userId = users[0].id;
      const [orders] = await db.query(`SELECT id FROM ${prefix}orders WHERE user_id=? AND plugin_id=? AND status='paid'`, [userId, pluginId]);
      if (orders.length === 0) {
        await db.query(`INSERT INTO ${prefix}orders (user_id, plugin_id, status) VALUES (?, ?, 'paid')`, [userId, pluginId]);
      }
      return res.json({ success: true, pluginId });
    } else {
      return res.status(400).json({ success: false, error: 'Zahlung nicht abgeschlossen.' });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Fehler bei der PayPal-Überprüfung.' });
  }
});

export default router; 