// Вход и выход
const { AUTH_COOKIE } = require('../middleware/auth');

// Адрес возврата после входа
function safeNext(raw) {
  return typeof raw === 'string' && /^\/(?![/\\])/.test(raw) ? raw : '/';
}

// GET /login
function login(req, res) {
  const next = safeNext(req.query.next);

  if (req.query.auth === '1') {
    res.cookie(AUTH_COOKIE, '1', {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });
    return res.redirect(next);
  }

  res.render('login', { pageTitle: 'Вход', next });
}

// GET /logout
function logout(req, res) {
  res.clearCookie(AUTH_COOKIE);
  res.redirect('/');
}

module.exports = { login, logout };
