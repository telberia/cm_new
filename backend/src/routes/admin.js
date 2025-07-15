import express from 'express';
import { db } from '../index.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const prefix = process.env.DB_TABLE_PREFIX || '';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

function isAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  try {
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Thêm plugin
router.post('/plugins', isAdmin, async (req, res) => {
  const { name, description, price, file_url } = req.body;
  if (!name || !price || !file_url) return res.status(400).json({ error: 'Missing fields' });
  try {
    await db.query(`INSERT INTO ${prefix}plugins (name, description, price, file_url) VALUES (?, ?, ?, ?)`, [name, description, price, file_url]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sửa plugin
router.put('/plugins/:id', isAdmin, async (req, res) => {
  const { name, description, price, file_url } = req.body;
  try {
    await db.query(`UPDATE ${prefix}plugins SET name=?, description=?, price=?, file_url=? WHERE id=?`, [name, description, price, file_url, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Xóa plugin
router.delete('/plugins/:id', isAdmin, async (req, res) => {
  try {
    await db.query(`DELETE FROM ${prefix}plugins WHERE id=?`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router; 