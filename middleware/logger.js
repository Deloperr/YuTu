// Логирующее middleware: метод, URL, время запроса, IP клиента,
// а после отправки ответа — статус и длительность обработки.
function logger(req, res, next) {
  const start = process.hrtime.bigint();
  const time = new Date().toLocaleString('ru-RU');

  console.log(`[${time}] → ${req.method} ${req.originalUrl} (IP: ${req.ip})`);

  // 'finish' срабатывает, когда ответ полностью отправлен клиенту.
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    console.log(`[${time}] ← ${req.method} ${req.originalUrl} ${res.statusCode} — ${ms.toFixed(1)} мс`);
  });

  next();
}

module.exports = logger;
