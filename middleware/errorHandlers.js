// Обработка ошибок

// 404
function notFound(req, res) {
  res
    .status(404)
    .render('404', { pageTitle: 'Страница не найдена', url: req.originalUrl });
}

// Запасная страница ошибки
function fallbackHtml(status) {
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>Ошибка ${status}</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <main class="container">
    <div class="error-page">
      <div class="error-code">${status}</div>
      <h1>Внутренняя ошибка сервера</h1>
      <p><a class="btn" href="/">На главную</a></p>
    </div>
  </main>
</body>
</html>`;
}

// Тексты ошибок запроса
const CLIENT_ERROR_MESSAGES = {
  'entity.too.large': 'Слишком большой объём отправленных данных.',
  'parameters.too.many': 'Слишком много полей в форме.',
  'entity.parse.failed': 'Не удалось разобрать отправленные данные.',
};

// 500 и прочие ошибки
function errorHandler(err, req, res, next) {
  const status =
    Number.isInteger(err.status) && err.status >= 400 && err.status < 600
      ? err.status
      : 500;
  const isDev = process.env.NODE_ENV !== 'production';

  if (res.headersSent) return next(err);

  // Текст ошибки для журнала запросов
  res.locals.logError = err.message || err.code;

  if (status === 404) return notFound(req, res);

  // Журнал
  const time = new Date().toLocaleString('ru-RU');
  if (status >= 500) {
    console.error(`[${time}] ОШИБКА ${status}: ${req.method} ${req.originalUrl}`);
    console.error(err.stack || err);
  } else {
    console.warn(
      `[${time}] Ошибка запроса ${status}: ${req.method} ${req.originalUrl}`,
      `— ${err.message}`,
    );
  }

  // Вывод страницы
  const view = status >= 500 ? '500' : '400';
  const locals = {
    pageTitle: status >= 500 ? 'Ошибка сервера' : 'Некорректный запрос',
    status,
    message:
      status >= 500
        ? 'На сервере произошла непредвиденная ошибка. Мы уже записали её в журнал.'
        : CLIENT_ERROR_MESSAGES[err.type] || 'Запрос содержит некорректные данные.',
    details: isDev
      ? { name: err.name, message: err.message, code: err.code, stack: err.stack }
      : null,
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
