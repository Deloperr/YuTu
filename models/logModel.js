// Журнал запросов в таблице request_logs
const { pool } = require('../config/db');

// Код ошибки PostgreSQL «таблица не существует»
const TABLE_MISSING = '42P01';

const INSERT_SQL = `INSERT INTO request_logs (method, url, status, duration_ms, ip, error)
     VALUES ($1, $2, $3, $4, $5, $6)`;

// Создание таблицы, если её нет
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS request_logs (
      id           SERIAL PRIMARY KEY,
      created_at   TIMESTAMPTZ   NOT NULL DEFAULT clock_timestamp(),
      method       VARCHAR(10)   NOT NULL,
      url          VARCHAR(2048) NOT NULL,
      status       SMALLINT      NOT NULL,
      duration_ms  NUMERIC(10,1) NOT NULL CHECK (duration_ms >= 0),
      ip           VARCHAR(64),
      error        TEXT
    )`);
}

// Повтор операции, если таблицу удалили или переименовали
async function withTable(action) {
  try {
    return await action();
  } catch (err) {
    if (err.code !== TABLE_MISSING) throw err;
    await ensureTable();
    console.warn('Журнал запросов: таблица request_logs не найдена и создана заново');
    return action();
  }
}

async function create({ method, url, status, durationMs, ip, error }) {
  const params = [method, url.slice(0, 2048), status, durationMs, ip, error || null];
  await withTable(() => pool.query(INSERT_SQL, params));
}

// Пробная запись с откатом: журнал доступен для записи
async function check() {
  await withTable(async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(INSERT_SQL, ['CHECK', '/', 200, 0, null, null]);
    } finally {
      await client.query('ROLLBACK').catch(() => {});
      client.release();
    }
  });
}

async function findRecent(limit) {
  const { rows } = await withTable(() =>
    pool.query('SELECT * FROM request_logs ORDER BY id DESC LIMIT $1', [limit]),
  );
  return rows;
}

module.exports = { ensureTable, create, check, findRecent };
