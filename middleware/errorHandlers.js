// Обработка ошибок
const { dbMessage } = require('./dbMessages');

// 404
function notFound(req, res) {
  res
    .status(404)
    .render('404', { pageTitle: 'Страница не найдена', url: req.originalUrl });
}

// Запасная страница ошибки
function fallbackHtml(status, message) {
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
      <p>${message}</p>
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

// Заголовки страниц ошибок сервера
const SERVER_TITLES = {
  500: 'Внутренняя ошибка сервера',
  503: 'Сервис временно недоступен',
};

// Системный текст: код и сообщение без повторов
function systemText(err) {
  return [...new Set([err.code, err.message].filter(Boolean))].join(' ');
}

// Сообщения по умолчанию
const DEFAULT_CLIENT_MESSAGE = 'Запрос содержит некорректные данные.';
const DEFAULT_SERVER_MESSAGE =
  'На сервере произошла непредвиденная ошибка. Мы уже записали её в журнал.';

// Сообщение для пользователя вместо системного текста ошибки
function userMessage(err, status) {
  if (status < 500) return CLIENT_ERROR_MESSAGES[err.type] || DEFAULT_CLIENT_MESSAGE;
  return err.userMessage || dbMessage(err) || DEFAULT_SERVER_MESSAGE;
}

// 500 и прочие ошибки
function errorHandler(err, req, res, next) {
  const status =
    Number.isInteger(err.status) && err.status >= 400 && err.status < 600
      ? err.status
      : 500;

  if (res.headersSent) return next(err);

  // Системный текст ошибки – только в журнал запросов и консоль
  res.locals.logError = systemText(err);

  if (status === 404) return notFound(req, res);

  const message = userMessage(err, status);

  // Журнал
  const time = new Date().toLocaleString('ru-RU');
  if (status >= 500) {
    console.error(`[${time}] ОШИБКА ${status}: ${req.method} ${req.originalUrl}`);
    console.error(`  Причина: ${message}`);
    console.error(`  Системная ошибка: ${systemText(err)}`);
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
    title: SERVER_TITLES[status] || SERVER_TITLES[500],
    message,
    user: res.locals.user || { name: 'Гость', isAuthenticated: false },
  };

  res.status(status).render(view, locals, (renderErr, html) => {
    if (renderErr) {
      console.error('Не удалось отрендерить страницу ошибки:', renderErr.message);
      return res.status(status).type('html').send(fallbackHtml(status, message));
    }
    res.send(html);
  });
}

module.exports = { notFound, errorHandler };
