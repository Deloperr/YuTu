require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

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
    message: 'Blog API работает',
    endpoints: {
      auth: '/auth/register, /auth/login',
      posts: '/posts?search=&sort=date|rating&page=1&limit=10',
      stats: '/posts/stats',
      postById: '/posts/:id',
      comments: '/posts/:id/comments',
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
  console.error('Ошибка:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Внутренняя ошибка сервера'
  });
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
  console.log(`http://localhost:${port}`);
});