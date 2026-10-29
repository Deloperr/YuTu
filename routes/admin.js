const express = require('express');
const { authMiddleware, isAdmin } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

router.get('/users', authMiddleware, isAdmin, async (req, res) => {
  const filter = req.query.city ? { 'profile.city': req.query.city } : {};
  const users = await User.find(filter).sort({ createdAt: 1 });
  res.json({ success: true, data: users, count: users.length });
});

router.delete('/users/:id', authMiddleware, isAdmin, async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'Пользователь не найден' });
  }
  res.json({ success: true, data: user, message: 'Пользователь и его посты удалены' });
});

module.exports = router;
