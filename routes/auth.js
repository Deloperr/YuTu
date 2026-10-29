const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, password, profile } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, error: 'Пароль – не короче 6 символов' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash, profile });
  res.status(201).json({ success: true, data: user });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() });
  if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) {
    return res.status(401).json({ success: false, error: 'Неверные учётные данные' });
  }
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'defaultsecret',
    { expiresIn: '1h' }
  );
  res.json({ success: true, data: { token, user } });
});

module.exports = router;
