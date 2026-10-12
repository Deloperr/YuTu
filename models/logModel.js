// Журнал запросов в таблице request_logs
const { pool } = require('../config/db');

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

async function create({ method, url, status, durationMs, ip, error }) {
  await pool.query(
    `INSERT INTO request_logs (method, url, status, duration_ms, ip, error)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [method, url.slice(0, 2048), status, durationMs, ip, error || null],
  );
}

async function findRecent(limit) {
  const { rows } = await pool.query(
    'SELECT * FROM request_logs ORDER BY id DESC LIMIT $1',
    [limit],
  );
  return rows;
}

module.exports = { ensureTable, create, findRecent };
