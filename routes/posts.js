const express = require('express');
const { Op } = require('sequelize');
const { Post, Comment } = require('../models');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Проверка обязательных полей поста
const validatePost = (req, res, next) => {
  const { title, content } = req.body;
  if (!title || !title.trim() || !content || !content.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Заголовок и содержимое обязательны'
    });
  }
  next();
};

// GET /posts?search=&sort=date|rating&page=1&limit=10
router.get('/', async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    const sort = req.query.sort === 'rating' ? 'rating' : 'createdAt';
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const page = Math.max(parseInt(req.query.page) || 1, 1);

    // Поиск по заголовку, содержимому и автору без учёта регистра
    const where = search
      ? {
          [Op.or]: ['title', 'content', 'author'].map((field) => ({
            [field]: { [Op.iLike]: `%${search}%` }
          }))
        }
      : {};

    const { rows, count } = await Post.findAndCountAll({
      where,
      include: [{ model: Comment, as: 'comments', attributes: ['id'] }],
      order: [[sort, 'DESC NULLS LAST'], ['id', 'DESC']],
      limit,
      offset: (page - 1) * limit,
      distinct: true
    });
    res.json({
      success: true,
      data: rows,
      count: rows.length,
      total: count,
      page,
      pages: Math.ceil(count / limit)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const totalPosts = await Post.count();
    const totalComments = await Comment.count();
    const avgResult = await Post.findOne({
      attributes: [[Post.sequelize.fn('AVG', Post.sequelize.col('rating')), 'avg']]
    });
    const avgRating = parseFloat(avgResult.dataValues.avg) || 0;
    const popular = await Post.findAll({
      order: [['rating', 'DESC']],
      limit: 3,
      attributes: ['id', 'title', 'author', 'rating']
    });
    res.json({
      success: true,
      data: { totalPosts, totalComments, averageRating: avgRating, popularPosts: popular }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const post = await Post.findByPk(id, {
      include: [{ model: Comment, as: 'comments' }]
    });
    if (!post) {
      return res.status(404).json({ success: false, error: 'Пост не найден' });
    }
    res.json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', authMiddleware, validatePost, async (req, res) => {
  try {
    const { title, content, author } = req.body;
    const newPost = await Post.create({
      title: title.trim(),
      content: content.trim(),
      author: (author || '').trim() || req.user.email,
      rating: 0,
      ratingCount: 0
    });
    res.status(201).json({ success: true, data: newPost, message: 'Пост создан' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', authMiddleware, validatePost, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, content, author } = req.body;
    const post = await Post.findByPk(id);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Пост не найден' });
    }
    await post.update({
      title: title.trim(),
      content: content.trim(),
      author: (author || '').trim() || post.author
    });
    res.json({ success: true, data: post, message: 'Пост обновлён' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await Post.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Пост не найден' });
    }
    res.json({ success: true, message: 'Пост удалён' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:id/comments', async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { text, author } = req.body;
    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Пост не найден' });
    }
    const comment = await Comment.create({ text, author, postId });
    res.status(201).json({ success: true, data: comment, message: 'Комментарий добавлен' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id/comments', async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const comments = await Comment.findAll({
      where: { postId },
      order: [['createdAt', 'ASC']]
    });
    res.json({ success: true, data: comments, count: comments.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:id/rate', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { rating } = req.body;
    const post = await Post.findByPk(id);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Пост не найден' });
    }
    const total = post.rating * post.ratingCount + rating;
    post.ratingCount += 1;
    post.rating = total / post.ratingCount;
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