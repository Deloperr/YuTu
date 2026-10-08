// Сервер
require('dotenv').config({ quiet: true });
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');

const logger = require('./middleware/logger');
const securityHeaders = require('./middleware/securityHeaders');
const locals = require('./middleware/locals');
const { identifyUser } = require('./middleware/auth');
const { notFound, errorHandler } = require('./middleware/errorHandlers');
const routes = require('./routes');
const { pool } = require('./config/db');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Шаблонизатор EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Работа за прокси
app.set('trust proxy', 'loopback');
app.disable('x-powered-by');

// Middleware
app.use(logger);
app.use(securityHeaders);
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1h' }));
app.use(locals);
app.use(cookieParser());
app.use(identifyUser);
app.use(express.urlencoded({ extended: false, limit: '20kb', parameterLimit: 20 }));

// Маршруты
app.use(routes);

// Обработка ошибок
app.use(notFound);
app.use(errorHandler);

// Запуск
const server = app.listen(PORT, (err) => {
  if (err) {
    console.error(`Не удалось запустить сервер на порту ${PORT}: ${err.message}`);
    process.exit(1);
  }
  console.log(`Сервер запущен: http://localhost:${PORT} (через nginx: http://localhost:8088)`);
});

// Остановка
function shutdown(signal) {
  console.log(`${signal}: остановка сервера...`);
  server.close(() => pool.end().then(() => process.exit(0)));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

process.on('unhandledRejection', (reason) => {
  console.error('Необработанный rejected-промис:', reason);
});
