// Авторизация.
// Пользователь считается авторизованным, если в запросе есть ?auth=1
// или cookie auth=1 (её выставляет страница /login, чтобы не передавать
// параметр в каждой ссылке).

const AUTH_COOKIE = 'auth';

// Глобальное middleware: определяет req.user для всех запросов.
function identifyUser(req, res, next) {
  const byQuery = req.query.auth === '1';
  const byCookie = req.cookies?.[AUTH_COOKIE] === '1';

  req.user = byQuery || byCookie
    ? { name: 'Автор блога', isAuthenticated: true }
    : { name: 'Гость', isAuthenticated: false };

  res.locals.user = req.user; // доступно во всех шаблонах, включая partials
  next();
}

// Middleware для защищённых маршрутов: без авторизации — редирект на /login.
function requireAuth(req, res, next) {
  if (req.user?.isAuthenticated) return next();
  const nextUrl = encodeURIComponent(req.originalUrl);
  res.redirect(`/login?next=${nextUrl}`);
}

module.exports = { identifyUser, requireAuth, AUTH_COOKIE };
