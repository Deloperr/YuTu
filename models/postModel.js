// Посты
const { pool } = require('../config/db');

// Средний рейтинг = ROUND(AVG(rating), 1), число комментариев = COUNT(comments)
const SELECT_WITH_STATS = `
  SELECT p.*,
         COUNT(c.id)::int                      AS comments_count,
         ROUND(AVG(c.rating)::numeric, 1)::float AS avg_rating
  FROM posts p
  LEFT JOIN comments c ON c.post_id = p.id`;

async function findAll() {
  const { rows } = await pool.query(`${SELECT_WITH_STATS} GROUP BY p.id ORDER BY p.created_at DESC, p.id DESC`);
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(`${SELECT_WITH_STATS} WHERE p.id = $1 GROUP BY p.id`, [id]);
  return rows[0] || null;
}

async function incrementViews(id) {
  await pool.query('UPDATE posts SET views = views + 1 WHERE id = $1', [id]);
}

// Поиск повторного поста за последнюю минуту
async function existsRecentDuplicate({ title, author }) {
  const { rows } = await pool.query(
    "SELECT title, author FROM posts WHERE created_at > now() - interval '1 minute'",
  );
  const key = (s) => s.toLocaleLowerCase('ru');
  return rows.some((row) => key(row.title) === key(title) && key(row.author) === key(author));
}

async function create({ title, author, category, read_time, content }) {
  const { rows } = await pool.query(
    `INSERT INTO posts (title, author, category, read_time, content)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [title, author, category, read_time, content],
  );
  return rows[0];
}

module.exports = { findAll, findById, incrementViews, existsRecentDuplicate, create };
