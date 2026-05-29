const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const categoryRoutes = require('./routes/category.routes');
const materialRoutes = require('./routes/material.routes');
const quizRoutes = require('./routes/quiz.routes');
const questionRoutes = require('./routes/question.routes');
const attemptRoutes = require('./routes/attempt.routes');
const reportRoutes = require('./routes/report.routes');

const app = express();
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin request tidak diizinkan'));
  },
  credentials: true
}));
app.use((req, res, next) => {
  const unsafe = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  const origin = req.headers.origin;
  if (unsafe && origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ message: 'Origin request tidak diizinkan' });
  }
  next();
});
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 400,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, app: 'Smart Quiz Generator' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/reports', reportRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan' });
});

app.use((error, req, res, next) => {
  console.error(error);
  const status = error.status || 500;
  res.status(status).json({ message: error.message || 'Terjadi kesalahan server' });
});

module.exports = app;
