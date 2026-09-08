const express = require('express');
const { authMiddleware, isAdmin } = require('../middleware/auth');
const { User } = require('../models');

const router = express.Router();

router.get('/users', authMiddleware, isAdmin, async (req, res) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ['passwordHash'] } });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;