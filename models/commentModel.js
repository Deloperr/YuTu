// Запросы к таблице comments.
const { pool } = require('../config/db');

async function findByPostId(postId) {
  const { rows } = await pool.query(
    'SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at DESC, id DESC',
    [postId],
  );
  return rows;
}

async function create({ post_id, author, text, rating }) {
  const { rows } = await pool.query(
    `INSERT INTO comments (post_id, author, text, rating)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [post_id, author, text, rating],
  );
  return rows[0];
}

module.exports = { findByPostId, create };
