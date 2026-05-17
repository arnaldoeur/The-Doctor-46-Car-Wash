import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import mysql from 'mysql2/promise';

const config = {
  host: process.env.DB_HOST || 'srv2104.hstgr.io',
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || 'u178468876_carwash46',
  user: process.env.DB_USER || 'u178468876_carwash46',
  password: process.env.DB_PASSWORD || '',
};

if (!config.password) {
  throw new Error('DB_PASSWORD is required.');
}

const schemaPath = path.resolve('database/schema.sql');
const schema = await fs.readFile(schemaPath, 'utf8');

const connection = await mysql.createConnection({
  ...config,
  multipleStatements: true,
  charset: 'utf8mb4',
});

try {
  await connection.query(schema);

  const [tables] = await connection.query(
    `SELECT table_name AS tableName
     FROM information_schema.tables
     WHERE table_schema = ?
     ORDER BY table_name`,
    [config.database],
  );

  const [services] = await connection.query('SELECT COUNT(*) AS total FROM service_catalog');

  console.log(`Schema applied to ${config.database} at ${config.host}.`);
  console.log(`Tables: ${tables.map((row) => row.tableName).join(', ')}`);
  console.log(`Service catalog rows: ${services[0]?.total ?? 0}`);
} finally {
  await connection.end();
}
