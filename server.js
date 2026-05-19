import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MySQL Pool Configuration
const dbConfig = {
  host: process.env.DB_HOST || '72.60.122.110',
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || 'u178468876_carwash46',
  user: process.env.DB_USER || 'u178468876_carwash46',
  password: process.env.DB_PASSWORD || '@Database26',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;
try {
  pool = mysql.createPool(dbConfig);
  console.log('MySQL Database connection pool initialized successfully.');
} catch (err) {
  console.error('Failed to initialize MySQL pool:', err);
}

// API Health Check
app.get('/api/health', async (req, res) => {
  try {
    if (pool) {
      await pool.query('SELECT 1');
      return res.json({ status: 'healthy', database: 'connected', timestamp: new Date().toISOString() });
    }
    return res.status(500).json({ status: 'unhealthy', database: 'disconnected' });
  } catch (err) {
    return res.status(500).json({ status: 'unhealthy', error: err.message });
  }
});

// Authentication Endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  try {
    if (pool) {
      try {
        const [users] = await pool.execute('SELECT * FROM users WHERE email = ? LIMIT 1', [email.trim().toLowerCase()]);
        const user = users[0];
        if (user && await bcrypt.compare(password, user.password_hash)) {
          const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'doctor46-secure-jwt-secret-key-2026-production',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
          );
          return res.json({
            success: true,
            token,
            user: {
              id: user.id,
              email: user.email,
              full_name: user.full_name,
              role: user.role,
              phone: user.phone
            }
          });
        }
      } catch (dbErr) {
        console.warn('MySQL auth query failed, attempting fallback to ENV credentials...', dbErr.message);
      }
    }

    // Fallback/Super Admin check from env if DB fails or user not found
    const adminEmail = process.env.ADMIN_EMAIL || 'geral@carwash46.com';
    const adminPass = process.env.ADMIN_PASSWORD || 'Carwash46@2026';
    if (email.trim().toLowerCase() === adminEmail.toLowerCase() && password === adminPass) {
      const token = jwt.sign(
        { id: 'USR-SUPER-ADMIN', email: adminEmail, role: 'super_admin' },
        process.env.JWT_SECRET || 'doctor46-secure-jwt-secret-key-2026-production',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );
      return res.json({
        success: true,
        token,
        user: {
          id: 'USR-SUPER-ADMIN',
          email: adminEmail,
          full_name: process.env.ADMIN_FULL_NAME || 'Super Admin',
          role: 'super_admin',
          phone: process.env.ADMIN_PHONE || '+258 87 412 4865'
        }
      });
    }

    return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error during login' });
  }
});

// Fallback dynamic API router for remaining endpoints
app.all('/api/*', async (req, res) => {
  return res.status(404).json({
    success: false,
    error: 'Endpoint not implemented in Node.js backend. Fallback to mock API requested.',
    action: req.path.replace('/api/', ''),
    timestamp: new Date().toISOString()
  });
});

// Static files and Single Page App fallback
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`The Doctor 46 Car Wash Production Node.js server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
});
