// Заполнение MongoDB демонстрационными данными: npm run seed
require('dotenv').config();
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const connectDB = require('./db');
const User = require('./models/User');
const Post = require('./models/Post');

const posts = [
  ['Как начать вести блог', 'Выбор темы и регулярность публикаций', 'Анна', ['блог', 'советы']],
  ['Обзор React 19', 'Новые хуки и серверные компоненты', 'Дмитрий', ['react', 'frontend']],
  ['PostgreSQL для начинающих', 'Таблицы, индексы и простые запросы', 'Ольга', ['sql', 'базы данных']],
  ['JWT простыми словами', 'Как устроен токен и где его хранить', 'Сергей', ['безопасность', 'backend']],
  ['Оптимистичный интерфейс', 'Почему пользователю не нужно ждать сервер', 'Анна', ['react', 'ux']],
  ['Express и middleware', 'Цепочка обработчиков запроса', 'Иван', ['node.js', 'backend']],
  ['Пагинация на сервере', 'Параметры limit и offset в REST API', 'Мария', ['backend', 'api']],
  ['Debounce в поиске', 'Меньше запросов при наборе текста', 'Дмитрий', ['react', 'frontend']],
  ['Документы вместо таблиц', 'Как MongoDB хранит пост вместе с комментариями', 'Артём', ['mongodb', 'базы данных']],
  ['Индексы в MongoDB', 'Ускоряем поиск по тегам и email', 'Ольга', ['mongodb', 'backend']]
];

const comments = [
  ['Алексей', 'Супер, всё понятно!'],
  ['Елена', 'Полезно, жду продолжения'],
  ['Пётр', 'А можно пример с кодом?']
];

(async () => {
  await connectDB();
  await Promise.all([User.deleteMany({}), Post.deleteMany({})]);
  // Индексы создаются заново, чтобы уникальность email работала сразу
  await Promise.all([User.syncIndexes(), Post.syncIndexes()]);

  const [admin, user] = await User.create([
    {
      email: 'admin@yutu.local',
      passwordHash: await bcrypt.hash('Admin123!', 10),
      role: 'admin',
      profile: { displayName: 'Администратор', city: 'Минск' }
    },
    {
      email: 'user@yutu.local',
      passwordHash: await bcrypt.hash('User123!', 10),
      profile: { displayName: 'Артём', city: 'Минск', bio: 'Пишу о веб-разработке' }
    }
  ]);

  const now = Date.now();
  const docs = posts.map(([title, content, author, tags], i) => {
    const values = [5, 4, 3 + (i % 3)];
    return {
      title,
      content,
      author,
      authorId: i % 2 ? user._id : admin._id,
      tags,
      // У части постов сразу есть вложенные комментарии
      comments: comments.slice(0, i % 4).map(([a, text], k) => ({
        author: a,
        text,
        likes: k
      })),
      ratings: [
        { userId: admin._id, value: values[0] },
        { userId: user._id, value: values[i % 3] }
      ],
      rating: (values[0] + values[i % 3]) / 2,
      createdAt: new Date(now - (posts.length - i) * 3600000)
    };
  });
  await Post.insertMany(docs);

  console.log(`Добавлено: пользователей ${await User.countDocuments()}, постов ${await Post.countDocuments()}`);
  await mongoose.disconnect();
})().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
