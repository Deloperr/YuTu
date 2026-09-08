require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const postsRoutes = require('./routes/posts');
const profileRoutes = require('./routes/profile');

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/posts', postsRoutes);
app.use('/profile', profileRoutes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Blog API работает',
    endpoints: {
      auth: '/auth/register, /auth/login',
      posts: '/posts',
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