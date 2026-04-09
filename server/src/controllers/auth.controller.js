import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { query } from '../config/db.js';

const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);

const registerStudent = async (req, res, next) => {
  try {
    const { full_name, email, username, password } = req.body;

    const existingUser = await query(
      'SELECT email, username FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rowCount > 0) {
      if (existingUser.rows.some((row) => row.email === email)) {
        return res.status(409).json({ error: 'Email is already registered' });
      }

      if (existingUser.rows.some((row) => row.username === username)) {
        return res.status(409).json({ error: 'Username is already taken' });
      }
    }

    const passwordHash = await bcrypt.hash(password, saltRounds);
    const result = await query(
      `INSERT INTO users (full_name, email, username, password_hash, role)
       VALUES ($1, $2, $3, $4, 'student')
       RETURNING id, username, role`,
      [full_name, email, username, passwordHash]
    );

    return res.status(201).json({
      message: 'Registration successful',
      user: result.rows[0]
    });
  } catch (error) {
    return next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const result = await query(
      `SELECT id, username, email, full_name, role, password_hash
       FROM users
       WHERE username = $1`,
      [username]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name
      }
    });
  } catch (error) {
    return next(error);
  }
};

export { registerStudent, loginUser };
