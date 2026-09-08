const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { getJwtSecret } = require('../middleware/auth');

const router = express.Router();

const emailLooksValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email и пароль обязательны' });
    }

    if (!emailLooksValid(email)) {
      return res.status(400).json({ success: false, error: 'Некорректный email' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Пароль должен содержать минимум 6 символов' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Пользователь с таким email уже существует' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, role: 'user' });

    res.status(201).json({
      success: true,
      data: user.toSafeJSON(),
      message: 'Пользователь успешно зарегистрирован'
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ success: false, error: 'Пользователь с таким email уже существует' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email и пароль обязательны' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Неверный email или пароль' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: 'Неверный email или пароль' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      getJwtSecret(),
      { expiresIn: '1h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: user.toSafeJSON()
      },
      message: 'Вход выполнен успешно'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
