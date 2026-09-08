const express = require('express');
const { Post, Comment, Sequelize } = require('../models');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = parseInt(req.query.offset, 10) || 0;

    const { rows: posts, count } = await Post.findAndCountAll({
      include: [{ model: Comment, as: 'comments' }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true
    });

    res.json({
      success: true,
      data: posts,
      count,
      limit,
      offset
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const totalPosts = await Post.count();
    const totalComments = await Comment.count();
    const avgRatingResult = await Post.findAll({
      attributes: [[Sequelize.fn('AVG', Sequelize.col('rating')), 'avgRating']],
      raw: true
    });
    const avgRating = parseFloat(avgRatingResult[0].avgRating) || 0;
    const popularPosts = await Post.findAll({
      order: [['rating', 'DESC']],
      limit: 3,
      attributes: ['id', 'title', 'author', 'rating']
    });

    res.json({
      success: true,
      data: {
        totalPosts,
        totalComments,
        averageRating: avgRating,
        popularPosts
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const post = await Post.findByPk(id, {
      include: [{ model: Comment, as: 'comments' }]
    });
    if (!post) {
      return res.status(404).json({ success: false, error: 'Пост не найден' });
    }

    await post.increment('views');
    await post.reload({ include: [{ model: Comment, as: 'comments' }] });

    res.json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, content, author } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, error: 'Заголовок и содержимое обязательны' });
    }

    const newPost = await Post.create({
      title,
      content,
      author: author || req.user.email
    });

    res.status(201).json({
      success: true,
      data: newPost,
      message: 'Пост создан'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { title, content, author } = req.body;

    if (!title || !content || !author) {
      return res.status(400).json({ success: false, error: 'Все поля обязательны' });
    }

    const post = await Post.findByPk(id);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Пост не найден' });
    }

    await post.update({ title, content, author });
    res.json({
      success: true,
      data: post,
      message: 'Пост обновлён'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const deleted = await Post.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Пост не найден' });
    }
    res.json({ success: true, message: 'Пост удалён' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const { text, author } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, error: 'Текст комментария обязателен' });
    }

    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Пост не найден' });
    }

    const comment = await Comment.create({
      text,
      author: author || req.user.email,
      postId
    });

    res.status(201).json({
      success: true,
      data: comment,
      message: 'Комментарий добавлен'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id/comments', async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const comments = await Comment.findAll({
      where: { postId },
      order: [['createdAt', 'ASC']]
    });
    res.json({
      success: true,
      data: comments,
      count: comments.length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id/rate', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const post = await Post.findByPk(id);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Пост не найден' });
    }
    res.json({
      success: true,
      data: {
        averageRating: Math.round(post.rating * 100) / 100,
        ratingCount: post.ratingCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:id/rate', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rating } = req.body;
    const value = Number(rating);

    if (!Number.isFinite(value) || value < 1 || value > 5) {
      return res.status(400).json({ success: false, error: 'Рейтинг должен быть числом от 1 до 5' });
    }

    const post = await Post.findByPk(id);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Пост не найден' });
    }

    const totalRating = (post.rating * post.ratingCount) + value;
    post.ratingCount += 1;
    post.rating = totalRating / post.ratingCount;
    await post.save();

    res.json({
      success: true,
      data: {
        averageRating: Math.round(post.rating * 100) / 100,
        ratingCount: post.ratingCount
      },
      message: 'Оценка добавлена'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
