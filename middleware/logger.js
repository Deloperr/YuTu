// Журнал запросов: консоль и таблица request_logs
const Log = require('../models/logModel');
const { dbMessage } = require('./dbMessages');

// Текст ошибки для консоли: понятное сообщение и системный код
function errorText(err) {
  const system = err.code || err.message || String(err);
  const text = dbMessage(err);
  return text ? `${text} (${system})` : system;
}

// Создание таблицы журнала при запуске; при сбое – сообщение об ошибке
async function initRequestLog() {
  try {
    await Log.ensureTable();
    console.log('Журнал запросов: таблица request_logs готова');
  } catch (err) {
    console.error(`Журнал запросов: не удалось создать таблицу. ${errorText(err)}`);
  }
}

function logger(req, res, next) {
  const start = process.hrtime.bigint();
  const time = new Date().toLocaleString('ru-RU');

  console.log(`[${time}] → ${req.method} ${req.originalUrl} (IP: ${req.ip})`);

  // Длительность: (время окончания − время начала) / 10^6, мс
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    const { method, originalUrl } = req;
    console.log(
      `[${time}] ← ${method} ${originalUrl} ${res.statusCode} — ${ms.toFixed(1)} мс`,
    );

    // Запись в БД; сбой записи не прерывает просмотр сайта
    Log.create({
      method,
      url: originalUrl,
      status: res.statusCode,
      durationMs: ms.toFixed(1),
      ip: req.ip,
      error: res.locals.logError,
    }).catch((err) => {
      console.error(`[${time}] Не удалось записать журнал в БД. ${errorText(err)}`);
    });
  });

  next();
}

// Проверка журнала перед изменением данных: без журнала добавление запрещено
async function requireLog(req, res, next) {
  try {
    await Log.check();
  } catch (err) {
    const reason = dbMessage(err) || 'Сбой записи в таблицу журнала.';
    const error = new Error(err.message || err.code || 'Сбой журнала');
    error.code = err.code;
    error.status = 503;
    error.userMessage =
      `Журнал запросов недоступен, поэтому добавление записей временно запрещено. ${reason}`;
    return next(error);
  }
  next();
}

module.exports = { logger, initRequestLog, requireLog };
