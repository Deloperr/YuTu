// Посты и комментарии
const Post = require('../models/postModel');
const Comment = require('../models/commentModel');
const {
  validatePost,
  postSchema,
  CATEGORIES,
} = require('../validators/postValidator');
const {
  validateComment,
  commentSchema,
} = require('../validators/commentValidator');

const EMPTY_POST = {
  title: '',
  author: '',
  category: '',
  read_time: '',
  content: '',
};
const EMPTY_COMMENT = { author: '', text: '', rating: '' };

// Разбор ID из адреса
function parseId(raw) {
  if (!/^\d{1,9}$/.test(raw)) return null;
  const id = Number(raw);
  return id > 0 ? id : null;
}

// GET / — список постов
async function list(req, res) {
  const posts = await Post.findAll();
  res.render('index', {
    pageTitle: 'Все посты',
    posts,
    createdId: parseId(String(req.query.created ?? '')),
  });
}

// Вывод страницы поста
async function renderItem(
  res,
  post,
  { status = 200, values = EMPTY_COMMENT, errors = {}, added = false } = {},
) {
  const comments = await Comment.findByPostId(post.id);
  res.status(status).render('item', {
    pageTitle: post.title,
    post,
    comments,
    values,
    errors,
    added,
    schema: commentSchema,
  });
}

// GET /item/:id — детальная страница
async function show(req, res, next) {
  const id = parseId(req.params.id);
  if (!id) return next();

  await Post.incrementViews(id);
  const post = await Post.findById(id);
  if (!post) return next();

  await renderItem(res, post, { added: req.query.added === '1' });
}

// GET /add — форма добавления
function showAddForm(req, res) {
  res.render('add', {
    pageTitle: 'Новый пост',
    values: EMPTY_POST,
    errors: {},
    categories: CATEGORIES,
    schema: postSchema,
  });
}

// POST /add — сохранение поста
async function create(req, res) {
  const { values, errors, isValid } = validatePost(req.body);

  if (isValid && (await Post.existsRecentDuplicate(values))) {
    errors.title =
      'Пост с таким заголовком от этого автора уже опубликован минуту назад';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).render('add', {
      pageTitle: 'Новый пост',
      values,
      errors,
      categories: CATEGORIES,
      schema: postSchema,
    });
  }

  const post = await Post.create(values);
  res.redirect(`/?created=${post.id}`);
}

// POST /item/:id/comments — комментарий с оценкой
async function addComment(req, res, next) {
  const id = parseId(req.params.id);
  if (!id) return next();

  const post = await Post.findById(id);
  if (!post) return next();

  const { values, errors, isValid } = validateComment(req.body);
  if (!isValid) {
    return renderItem(res, post, { status: 400, values, errors });
  }

  await Comment.create({ post_id: id, ...values });
  res.redirect(`/item/${id}?added=1#comments`);
}

module.exports = { list, show, showAddForm, create, addComment };
