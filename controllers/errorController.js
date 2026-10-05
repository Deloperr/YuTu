// Страницы для проверки обработчика ошибок 500.
const { pool } = require('../config/db');

// Синхронная ошибка: Express перехватывает throw и передаёт в errorHandler.
function syncError() {
  throw new Error('Ошибка при обработке запроса');
}

// Асинхронная ошибка: запрос к несуществующей таблице. Отклонённый промис
// Express 5 сам передаёт в errorHandler (в Express 4 понадобился бы next(err)).
async function dbError() {
  await pool.query('SELECT * FROM table_that_does_not_exist');
}

module.exports = { syncError, dbError };
