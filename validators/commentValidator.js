// Проверка комментария
const { validate } = require('./rules');
const { NAME_PATTERN, NAME_MESSAGE } = require('./postValidator');
const limits = require('../config/limits.json');

// Правила полей (ограничения – из config/limits.json)
const { author, text, rating } = limits.comment;
const commentSchema = {
  author: {
    type: 'text',
    label: 'Имя',
    ...author,
    pattern: NAME_PATTERN,
    patternMessage: NAME_MESSAGE,
  },
  text: { type: 'text', label: 'Комментарий', ...text, multiline: true },
  rating: { type: 'integer', label: 'Оценка', ...rating },
};

const validateComment = (body) => validate(commentSchema, body);

module.exports = { validateComment, commentSchema };
