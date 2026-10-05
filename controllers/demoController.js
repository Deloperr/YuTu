// Маршруты для демонстрации обработки ошибок 500.
const { pool } = require('../config/db');

// Синхронная ошибка: Express перехватывает throw и передаёт в errorHandler.
function syncError() {
  throw new Error('Демонстрационная синхронная ошибка (throw в контроллере)');
}

// Асинхронная ошибка: запрос к несуществующей таблице — отклонённый промис
// Express 5 сам передаёт в errorHandler (в Express 4 понадобился бы next(err)).
async function asyncError() {
  await pool.query('SELECT * FROM table_that_does_not_exist');
}

module.exports = { syncError, asyncError };
