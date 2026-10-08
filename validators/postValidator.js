// Проверка поста
const { validate } = require('./rules');

const CATEGORIES = [
  'Технологии',
  'Наука',
  'Путешествия',
  'Личное',
  'Обучение',
  'Другое',
];

// Формат имени
const NAME_PATTERN = /^\p{L}[\p{L} .'’-]*$/u;
const NAME_MESSAGE =
  'Только буквы, пробел, дефис, апостроф или точка; первая — буква';

// Правила полей
const postSchema = {
  title: { type: 'text', label: 'Заголовок', min: 5, max: 120 },
  author: {
    type: 'text',
    label: 'Автор',
    min: 2,
    max: 50,
    pattern: NAME_PATTERN,
    patternMessage: NAME_MESSAGE,
  },
  category: { type: 'choice', label: 'Категория', options: CATEGORIES },
  read_time: { type: 'integer', label: 'Время чтения, мин', min: 1, max: 300 },
  content: {
    type: 'text',
    label: 'Текст поста',
    min: 20,
    max: 5000,
    multiline: true,
  },
};

const validatePost = (body) => validate(postSchema, body);

module.exports = {
  validatePost,
  postSchema,
  CATEGORIES,
  NAME_PATTERN,
  NAME_MESSAGE,
};
