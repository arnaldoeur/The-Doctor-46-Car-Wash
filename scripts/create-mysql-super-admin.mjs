import process from 'node:process';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

const config = {
  host: process.env.DB_HOST || '72.60.122.110',
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || 'u178468876_carwash46',
  user: process.env.DB_USER || 'u178468876_carwash46',
  password: process.env.DB_PASSWORD || '',
};

const admin = {
  email: (process.env.SUPER_ADMIN_EMAIL || 'geral@carwash46.com').trim().toLowerCase(),
  password: process.env.SUPER_ADMIN_PASSWORD || '',
  fullName: process.env.SUPER_ADMIN_FULL_NAME || 'Super Admin',
  phone: process.env.SUPER_ADMIN_PHONE || '+258 87 412 4865',
};

if (!config.password) {
  throw new Error('DB_PASSWORD is required.');
}

if (!admin.password || admin.password.length < 8) {
  throw new Error('SUPER_ADMIN_PASSWORD must have at least 8 characters.');
}

const connection = await mysql.createConnection({
  ...config,
  charset: 'utf8mb4',
});

try {
  const passwordHash = await bcrypt.hash(admin.password, 12);

  const [superAdmins] = await connection.execute(
    "SELECT id FROM users WHERE role = 'super_admin' LIMIT 1",
  );
  const [emailUsers] = await connection.execute(
    'SELECT id FROM users WHERE email = ? LIMIT 1',
    [admin.email],
  );

  const targetId = superAdmins[0]?.id ?? emailUsers[0]?.id ?? randomUUID();
  const exists = Boolean(superAdmins[0]?.id || emailUsers[0]?.id);

  if (exists) {
    await connection.execute(
      `UPDATE users
       SET full_name = ?, email = ?, phone = ?, password_hash = ?,
           account_type = 'staff', role = 'super_admin',
           job_title = 'Super Admin', status = 'active'
       WHERE id = ?`,
      [admin.fullName, admin.email, admin.phone, passwordHash, targetId],
    );
  } else {
    await connection.execute(
      `INSERT INTO users (
        id, full_name, email, phone, password_hash, account_type, role, job_title, status
      ) VALUES (
        ?, ?, ?, ?, ?, 'staff', 'super_admin', 'Super Admin', 'active'
      )`,
      [targetId, admin.fullName, admin.email, admin.phone, passwordHash],
    );
  }

  await connection.execute(
    `INSERT INTO audit_logs (
      id, module, action, entity_type, entity_id, entity_label, metadata, performed_by
    ) VALUES (?, 'auth', 'Super admin preparado via script', 'user', ?, ?, ?, ?)`,
    [
      randomUUID(),
      targetId,
      admin.email,
      JSON.stringify({ source: 'create-mysql-super-admin' }),
      targetId,
    ],
  );

  console.log(`Super admin ready: ${admin.email}`);
} finally {
  await connection.end();
}
