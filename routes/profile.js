const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'Пользователь не найден' });
  }
  res.json({ success: true, data: user });
});

// PATCH /profile – изменение полей вложенного документа profile
router.patch('/', authMiddleware, async (req, res) => {
  const update = {};
  for (const field of ['displayName', 'city', 'bio']) {
    if (req.body[field] !== undefined) update[`profile.${field}`] = req.body[field];
  }
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: update },
    { new: true, runValidators: true }
  );
  res.json({ success: true, data: user });
});

module.exports = router;
