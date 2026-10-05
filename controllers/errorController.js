// Страницы ошибки 500
const { pool } = require('../config/db');

// Ошибка в обработчике
function syncError() {
  throw new Error('Ошибка при обработке запроса');
}

// Ошибка запроса к БД
async function dbError() {
  await pool.query('SELECT * FROM table_that_does_not_exist');
}

module.exports = { syncError, dbError };
