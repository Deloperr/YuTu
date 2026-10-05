// Журнал запросов
function logger(req, res, next) {
  const start = process.hrtime.bigint();
  const time = new Date().toLocaleString('ru-RU');

  console.log(`[${time}] → ${req.method} ${req.originalUrl} (IP: ${req.ip})`);

  // Длительность: (время окончания − время начала) / 10^6, мс
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    console.log(`[${time}] ← ${req.method} ${req.originalUrl} ${res.statusCode} — ${ms.toFixed(1)} мс`);
  });

  next();
}

module.exports = logger;
