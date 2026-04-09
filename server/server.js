import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { fileURLToPath } from 'url';

import authMiddleware from './src/middleware/auth.js';
import { requireRole } from './src/middleware/roleGuard.js';
import adminRoutes from './src/routes/admin.routes.js';
import authRoutes from './src/routes/auth.routes.js';
import examRoutes from './src/routes/exam.routes.js';
import facultyRoutes from './src/routes/faculty.routes.js';
import studentRoutes from './src/routes/student.routes.js';

dotenv.config();

const app = express();
const currentFile = fileURLToPath(import.meta.url);

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[ROUTE] ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/', (req, res) => {
  res.json({ message: 'Online Examination Management Portal API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', authMiddleware, requireRole('admin'), adminRoutes);
app.use('/api/faculty', authMiddleware, requireRole('faculty'), facultyRoutes);
app.use('/api/student', authMiddleware, requireRole('student'), studentRoutes);
app.use('/api/exam', authMiddleware, examRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);

  if (err.status) {
    return res.status(err.status).json(err.errors ? { errors: err.errors } : { error: err.message });
  }

  if (err.code === '23505') {
    return res.status(409).json({ error: 'Duplicate record already exists' });
  }

  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced record does not exist' });
  }

  return res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3137;

if (process.argv[1] === currentFile) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
