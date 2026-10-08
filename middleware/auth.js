// Авторизация

const AUTH_COOKIE = 'auth';

// Определение пользователя (?auth=1 или cookie)
function identifyUser(req, res, next) {
  const byQuery = req.query.auth === '1';
  const byCookie = req.cookies?.[AUTH_COOKIE] === '1';

  req.user =
    byQuery || byCookie
      ? { name: 'Автор блога', isAuthenticated: true }
      : { name: 'Гость', isAuthenticated: false };

  res.locals.user = req.user;
  next();
}

// Проверка доступа
function requireAuth(req, res, next) {
  if (req.user?.isAuthenticated) return next();
  const nextUrl = encodeURIComponent(req.originalUrl);
  res.redirect(`/login?next=${nextUrl}`);
}

module.exports = { identifyUser, requireAuth, AUTH_COOKIE };
