import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../index.js';

const router = express.Router();
const prefix = process.env.DB_TABLE_PREFIX || '';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Đăng ký
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'Missing fields' });
  try {
    const result = await db.query(`SELECT id FROM ${prefix}users WHERE email = $1`, [email]);
    const rows = result.rows;
    if (rows.length > 0) return res.status(409).json({ error: 'Email already exists' });
    const hash = await bcrypt.hash(password, 10);
    await db.query(`INSERT INTO ${prefix}users (email, password, name, role) VALUES ($1, $2, $3, 'user')`, [email, hash, name]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Đăng nhập
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const result = await db.query(`SELECT * FROM ${prefix}users WHERE email = $1`, [email]);
    const rows = result.rows;
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router; 