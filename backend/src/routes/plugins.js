import express from 'express';
import { db } from '../index.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const prefix = process.env.DB_TABLE_PREFIX || '';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

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

export default router; 