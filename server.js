require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./db');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const postsRoutes = require('./routes/posts');
const profileRoutes = require('./routes/profile');

const delay = parseInt(process.env.API_DELAY_MS) || 0;
if (delay > 0) {
  app.use((req, res, next) => setTimeout(next, delay));
}

const api = express.Router();
api.use('/auth', authRoutes);
api.use('/admin', adminRoutes);
api.use('/posts', postsRoutes);
api.use('/profile', profileRoutes);

app.use('/api', api);
app.use('/', api);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Blog API работает (MongoDB)',
    database: mongoose.connection.name,
    endpoints: {
      auth: '/auth/register, /auth/login',
      posts: '/posts?search=&tag=&sort=date|rating&page=1&limit=10',
      stats: '/posts/stats',
      postById: '/posts/:id',
      comments: '/posts/:id/comments',
      like: '/posts/:id/comments/:commentId/like',
      tags: '/posts/:id/tags, /posts/tag/:tag',
      rate: '/posts/:id/rate',
      profile: '/profile',
      admin: '/admin/users'
    }
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: `Маршрут ${req.originalUrl} не найден` });
});

app.use((err, req, res, next) => {
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, error: errors.join('; ') });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ success: false, error: `Некорректное значение поля ${err.path}` });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'поле';
    return res.status(409).json({ success: false, error: `Значение ${field} уже используется` });
  }
  console.error('Ошибка:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Внутренняя ошибка сервера'
  });
});

connectDB()
  .then(() => {
    const server = app.listen(port, () => {
      console.log(`Сервер запущен на порту ${port}`);
      console.log(`http://localhost:${port}`);
    });
    server.on('error', (err) => {
      console.error(err.code === 'EADDRINUSE' ? `Порт ${port} занят` : err.message);
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
