// Точка входа: настройка Express, EJS и цепочки middleware.
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

// Приложение работает за nginx: доверяем X-Forwarded-For только от локального прокси,
// чтобы req.ip показывал реальный IP клиента.
app.set('trust proxy', 'loopback');
app.disable('x-powered-by');

// ---- Порядок middleware важен: выполняются сверху вниз ----
app.use(logger);                                     // 1. логирование всех запросов
app.use(securityHeaders);                            // 2. общие заголовки ответа
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1h' })); // 3. статика
app.use(locals);                                     // 4. helper-функции для шаблонов
app.use(cookieParser());                             // 5. cookie
app.use(identifyUser);                               // 6. определение пользователя (имитация)
// 7. данные форм; лимиты защищают от слишком больших запросов (ошибка 413 → страница 400)
app.use(express.urlencoded({ extended: false, limit: '20kb', parameterLimit: 20 }));

app.use(routes);                                     // 8. маршруты

// ---- Обработчики ошибок — строго после маршрутов ----
app.use(notFound);                                   // 404
app.use(errorHandler);                               // 500 и прочие ошибки

const server = app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT} (через nginx: http://localhost:8088)`);
});

// Корректное завершение: закрываем HTTP-сервер и пул соединений с БД.
function shutdown(signal) {
  console.log(`${signal}: остановка сервера...`);
  server.close(() => pool.end().then(() => process.exit(0)));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

process.on('unhandledRejection', (reason) => {
  console.error('Необработанный rejected-промис:', reason);
});
