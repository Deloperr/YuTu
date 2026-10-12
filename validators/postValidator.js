// Проверка поста
const { validate } = require('./rules');
const limits = require('../config/limits.json');

const CATEGORIES = limits.categories;

// Формат имени
const NAME_PATTERN = new RegExp(limits.name.pattern, 'u');
const NAME_MESSAGE = limits.name.message;

// Правила полей (ограничения – из config/limits.json)
const { title, author, read_time, content } = limits.post;
const postSchema = {
  title: { type: 'text', label: 'Заголовок', ...title },
  author: {
    type: 'text',
    label: 'Автор',
    ...author,
    pattern: NAME_PATTERN,
    patternMessage: NAME_MESSAGE,
  },
  category: { type: 'choice', label: 'Категория', options: CATEGORIES },
  read_time: { type: 'integer', label: 'Время чтения, мин', ...read_time },
  content: { type: 'text', label: 'Текст поста', ...content, multiline: true },
};

const validatePost = (body) => validate(postSchema, body);

module.exports = {
  validatePost,
  postSchema,
  CATEGORIES,
  NAME_PATTERN,
  NAME_MESSAGE,
};
