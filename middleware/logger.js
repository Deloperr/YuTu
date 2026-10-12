// Журнал запросов: консоль и таблица request_logs
const Log = require('../models/logModel');

// Текст ошибки (у ошибок подключения сообщение бывает пустым)
const errorText = (err) => err.message || err.code || String(err);

// Создание таблицы журнала при запуске; при сбое – сообщение об ошибке
async function initRequestLog() {
  try {
    await Log.ensureTable();
    console.log('Журнал запросов: таблица request_logs готова');
  } catch (err) {
    console.error(
      `Журнал запросов: не удалось создать таблицу – ${errorText(err)}`,
    );
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

    // Запись в БД; сбой записи не прерывает работу сервера
    Log.create({
      method,
      url: originalUrl,
      status: res.statusCode,
      durationMs: ms.toFixed(1),
      ip: req.ip,
      error: res.locals.logError,
    }).catch((err) => {
      console.error(`[${time}] Не удалось записать журнал в БД: ${errorText(err)}`);
    });
  });

  next();
}

module.exports = { logger, initRequestLog };
