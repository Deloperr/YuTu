// Создание БД, таблиц и начальных данных
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { dbConfig } = require('../config/db');

const reset = process.argv.includes('--reset');

// Создание БД
async function ensureDatabase() {
  const admin = new Client({ ...dbConfig, database: 'postgres' });
  await admin.connect();
  try {
    const { rowCount } = await admin.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbConfig.database],
    );
    if (rowCount === 0) {
      await admin.query(
        `CREATE DATABASE "${dbConfig.database.replace(/"/g, '""')}"`,
      );
      console.log(`База данных «${dbConfig.database}» создана`);
    }
  } finally {
    await admin.end();
  }
}

// Таблицы и данные
async function main() {
  await ensureDatabase();

  const client = new Client(dbConfig);
  await client.connect();
  try {
    if (reset) {
      await client.query('DROP TABLE IF EXISTS request_logs, comments, posts CASCADE');
      console.log('Таблицы удалены');
    }
    await client.query(
      fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8'),
    );
    console.log('Схема применена');

    const { rows } = await client.query('SELECT COUNT(*)::int AS n FROM posts');
    if (rows[0].n === 0) {
      await client.query(
        fs.readFileSync(path.join(__dirname, '../db/seed.sql'), 'utf8'),
      );
      console.log('Начальные данные добавлены');
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Ошибка инициализации БД:', err.message);
  process.exit(1);
});
