const express = require('express');
const { User } = require('../models');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'role', 'createdAt'],
      order: [['id', 'ASC']]
    });

    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
