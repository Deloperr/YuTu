// Проверка комментария
const { validate } = require('./rules');
const { NAME_PATTERN, NAME_MESSAGE } = require('./postValidator');

const commentSchema = {
  author: { type: 'text', label: 'Имя', min: 2, max: 50, pattern: NAME_PATTERN, patternMessage: NAME_MESSAGE },
  text:   { type: 'text', label: 'Комментарий', min: 3, max: 1000, multiline: true },
  rating: { type: 'integer', label: 'Оценка', min: 1, max: 5 },
};

const validateComment = (body) => validate(commentSchema, body);

module.exports = { validateComment, commentSchema };
