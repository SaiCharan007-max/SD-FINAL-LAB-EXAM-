import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

import pool, { query } from './src/config/db.js';

dotenv.config();

const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

const seedAdmin = async () => {
  const passwordHash = await bcrypt.hash('AdminExam@123', saltRounds);

  const result = await query(
    `INSERT INTO users (full_name, email, username, password_hash, role)
     VALUES ($1, $2, $3, $4, 'admin')
     ON CONFLICT (email)
     DO UPDATE SET
       full_name = EXCLUDED.full_name,
       username = EXCLUDED.username,
       password_hash = EXCLUDED.password_hash,
       role = EXCLUDED.role
     RETURNING id, email, username, role`,
    ['Super Admin', 'admin@adminexam.org', 'AdminExam999', passwordHash]
  );

  return result.rows[0];
};

try {
  const admin = await seedAdmin();
  console.log('Seed completed:', admin);
} catch (error) {
  console.error('Seed failed:', error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
