const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Не задан JWT_SECRET в переменных окружения');
  }
  return secret;
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ success: false, error: 'Токен не предоставлен' });
  }

  try {
    req.user = jwt.verify(token, getJwtSecret());
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Недействительный или истёкший токен' });
  }
};

const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Требуются права администратора' });
  }
  next();
};

module.exports = { authenticateToken, isAdmin, getJwtSecret };
