const express = require('express');
const { Post, Comment } = require('../models');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const posts = await Post.findAll({
      include: [{ model: Comment, as: 'comments' }],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: posts, count: posts.length });
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

router.post('/', async (req, res) => {
  try {
    const { title, content, author } = req.body;
    const newPost = await Post.create({ title, content, author });
    res.status(201).json({ success: true, data: newPost, message: 'Пост создан' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, content, author } = req.body;
    const post = await Post.findByPk(id);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Пост не найден' });
    }
    await post.update({ title, content, author });
    res.json({ success: true, data: post, message: 'Пост обновлён' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
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