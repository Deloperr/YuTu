// Функции для шаблонов

// Формат даты
const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZone: process.env.TZ || 'Europe/Minsk',
});

function formatDate(date) {
  return dateFormatter.format(new Date(date));
}

// Склонение: n % 10 = 1 (кроме 11) → форма 1;
// n % 10 = 2..4 (кроме 12..14) → форма 2; иначе → форма 3
function plural(n, forms) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

function locals(req, res, next) {
  res.locals.formatDate = formatDate;
  res.locals.plural = plural;
  res.locals.currentPath = req.path;
  res.locals.pageTitle = 'Блог';
  next();
}

module.exports = locals;
