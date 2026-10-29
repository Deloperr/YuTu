const express = require('express');
const mongoose = require('mongoose');
const Post = require('../models/Post');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const checkId = (...params) => (req, res, next) => {
  for (const name of params) {
    if (!mongoose.isValidObjectId(req.params[name])) {
      return res.status(400).json({ success: false, error: 'Некорректный id' });
    }
  }
  next();
};

const notFound = (res) =>
  res.status(404).json({ success: false, error: 'Пост не найден' });

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/', async (req, res) => {
  const search = (req.query.search || '').trim();
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const sort = req.query.sort === 'rating'
    ? { rating: -1, createdAt: -1 }
    : { createdAt: -1 };

  const filter = {};
  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: re }, { content: re }, { author: re }];
  }
  if (req.query.tag) filter.tags = req.query.tag.toLowerCase();

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .select('-ratings')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Post.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: posts,
    count: posts.length,
    total,
    page,
    pages: Math.ceil(total / limit)
  });
});

router.get('/stats', async (req, res) => {
  const [totals] = await Post.aggregate([
    {
      $group: {
        _id: null,
        totalPosts: { $sum: 1 },
        totalComments: { $sum: { $size: '$comments' } },
        averageRating: { $avg: '$rating' }
      }
    },
    {
      $project: {
        _id: 0,
        totalPosts: 1,
        totalComments: 1,
        averageRating: { $round: ['$averageRating', 2] }
      }
    }
  ]);

  const popularTags = await Post.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', posts: { $sum: 1 } } },
    { $sort: { posts: -1, _id: 1 } },
    { $limit: 5 },
    { $project: { _id: 0, tag: '$_id', posts: 1 } }
  ]);

  res.json({ success: true, data: { ...totals, popularTags } });
});

router.get('/:id', checkId('id'), async (req, res) => {
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true }
  ).populate('authorId', 'email role profile');
  if (!post) return notFound(res);
  res.json({ success: true, data: post });
});

router.post('/', authMiddleware, async (req, res) => {
  const { title, content, author, tags, status } = req.body;
  const post = await Post.create({
    title,
    content,
    tags,
    status,
    author: (author || '').trim() || req.user.email,
    authorId: req.user.id
  });
  res.status(201).json({ success: true, data: post, message: 'Пост создан' });
});

router.put('/:id', authMiddleware, checkId('id'), async (req, res) => {
  const { title, content, author, tags, status } = req.body;
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { title, content, author: author || undefined, tags, status },
    { new: true, runValidators: true, omitUndefined: true }
  ).select('-ratings');
  if (!post) return notFound(res);
  res.json({ success: true, data: post, message: 'Пост обновлён' });
});

router.delete('/:id', authMiddleware, checkId('id'), async (req, res) => {
  const post = await Post.findByIdAndDelete(req.params.id);
  if (!post) return notFound(res);
  res.json({ success: true, data: post, message: 'Пост удалён' });
});

router.get('/:id/comments', checkId('id'), async (req, res) => {
  const post = await Post.findById(req.params.id).select('comments');
  if (!post) return notFound(res);
  res.json({ success: true, data: post.comments, count: post.comments.length });
});

router.post('/:id/comments', authMiddleware, checkId('id'), async (req, res) => {
  const { text } = req.body;
  const author = (req.body.author || '').trim() || req.user.email;
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $push: { comments: { author, text } } },
    { new: true, runValidators: true }
  );
  if (!post) return notFound(res);
  const comment = post.comments[post.comments.length - 1];
  res.status(201).json({ success: true, data: comment, message: 'Комментарий добавлен' });
});

router.patch(
  '/:id/comments/:commentId/like',
  checkId('id', 'commentId'),
  async (req, res) => {
    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, 'comments._id': req.params.commentId },
      { $inc: { 'comments.$.likes': 1 } },
      { new: true }
    );
    if (!post) {
      return res.status(404).json({ success: false, error: 'Комментарий не найден' });
    }
    const comment = post.comments.id(req.params.commentId);
    res.json({ success: true, data: comment });
  }
);

router.delete(
  '/:id/comments/:commentId',
  authMiddleware,
  checkId('id', 'commentId'),
  async (req, res) => {
    const result = await Post.updateOne(
      { _id: req.params.id },
      { $pull: { comments: { _id: req.params.commentId } } }
    );
    if (!result.modifiedCount) {
      return res.status(404).json({ success: false, error: 'Комментарий не найден' });
    }
    res.json({ success: true, message: 'Комментарий удалён' });
  }
);

router.post('/:id/tags', authMiddleware, checkId('id'), async (req, res) => {
  const tag = (req.body.tag || '').trim().toLowerCase();
  if (!tag) return res.status(400).json({ success: false, error: 'Тег обязателен' });
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { tags: tag } },
    { new: true }
  ).select('title tags');
  if (!post) return notFound(res);
  res.json({ success: true, data: post });
});

router.get('/tag/:tag', async (req, res) => {
  const posts = await Post.findByTag(req.params.tag).select('-ratings');
  res.json({ success: true, data: posts, count: posts.length });
});

router.post('/:id/rate', authMiddleware, checkId('id'), async (req, res) => {
  const value = Number(req.body.rating);
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    return res.status(400).json({ success: false, error: 'Оценка – целое число от 1 до 5' });
  }
  const post = await Post.findById(req.params.id);
  if (!post) return notFound(res);
  await post.rate(req.user.id, value);
  res.json({
    success: true,
    data: { averageRating: post.rating, ratingCount: post.ratings.length },
    message: 'Оценка учтена'
  });
});

module.exports = router;
