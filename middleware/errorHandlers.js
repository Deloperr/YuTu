// Обработчики ошибок. Подключаются В САМОМ КОНЦЕ цепочки — после всех маршрутов,
// иначе Express не дойдёт до них или отдаст стандартную текстовую страницу.

// 404: сюда доходит запрос, который не обработал ни один маршрут.
function notFound(req, res) {
  res.status(404).render('404', { pageTitle: 'Страница не найдена', url: req.originalUrl });
}

// Запасная страница на случай, если упадёт даже рендеринг шаблона ошибки.
function fallbackHtml(status) {
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Ошибка ${status}</title>
<link rel="stylesheet" href="/css/style.css"></head><body><main class="container">
<div class="error-page"><div class="error-code">${status}</div><h1>Внутренняя ошибка сервера</h1>
<p><a class="btn" href="/">На главную</a></p></div></main></body></html>`;
}

// Ошибки, которые возникают до маршрутов (express.urlencoded, разбор URL),
// приходят со статусом 4xx — это ошибка клиента, а не сервера.
const CLIENT_ERROR_MESSAGES = {
  'entity.too.large': 'Слишком большой объём отправленных данных.',
  'parameters.too.many': 'Слишком много полей в форме.',
  'entity.parse.failed': 'Не удалось разобрать отправленные данные.',
};

// 4 параметра — так Express понимает, что это обработчик ошибок.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 600 ? err.status : 500;
  const isDev = process.env.NODE_ENV !== 'production';

  // Если ответ уже начал отправляться, отрендерить страницу нельзя —
  // передаём ошибку встроенному обработчику Express, он закроет соединение.
  if (res.headersSent) return next(err);

  if (status === 404) return notFound(req, res);

  const time = new Date().toLocaleString('ru-RU');
  if (status >= 500) {
    console.error(`[${time}] ✖ ОШИБКА ${status} при ${req.method} ${req.originalUrl}`);
    console.error(err.stack || err);
  } else {
    console.warn(`[${time}] ⚠ Ошибка клиента ${status} при ${req.method} ${req.originalUrl}: ${err.message}`);
  }

  const view = status >= 500 ? '500' : '400';
  const locals = {
    pageTitle: status >= 500 ? 'Ошибка сервера' : 'Некорректный запрос',
    status,
    message: status >= 500
      ? 'На сервере произошла непредвиденная ошибка. Мы уже записали её в журнал.'
      : CLIENT_ERROR_MESSAGES[err.type] || 'Запрос содержит некорректные данные.',
    // Подробности (тип, текст, стек) показываем только в режиме разработки.
    details: isDev ? { name: err.name, message: err.message, code: err.code, stack: err.stack } : null,
    user: res.locals.user || { name: 'Гость', isAuthenticated: false },
  };

  res.status(status).render(view, locals, (renderErr, html) => {
    if (renderErr) {
      console.error('Не удалось отрендерить страницу ошибки:', renderErr.message);
      return res.status(status).type('html').send(fallbackHtml(status));
    }
    res.send(html);
  });
}

module.exports = { notFound, errorHandler };
