import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import pluginsRoutes from './routes/plugins.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/plugins', pluginsRoutes);

// MySQL connection pool
export const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: process.env.DB_CHARSET || 'utf8mb4',
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
}); 