'use strict';

const posts = [
  ['Как начать вести блог', 'Выбор темы и регулярность публикаций', 'Анна', 4.2],
  ['Обзор React 19', 'Новые хуки и серверные компоненты', 'Дмитрий', 4.8],
  ['PostgreSQL для начинающих', 'Таблицы, индексы и простые запросы', 'Ольга', 4.0],
  ['JWT простыми словами', 'Как устроен токен и где его хранить', 'Сергей', 3.9],
  ['Оптимистичный интерфейс', 'Почему пользователю не нужно ждать сервер', 'Анна', 4.6],
  ['Express и middleware', 'Цепочка обработчиков запроса', 'Иван', 3.5],
  ['Пагинация на сервере', 'Параметры limit и offset в REST API', 'Мария', 4.1],
  ['Debounce в поиске', 'Меньше запросов при наборе текста', 'Дмитрий', 4.4]
];

module.exports = {
  async up(queryInterface) {
    const now = Date.now();
    await queryInterface.bulkInsert('Posts', posts.map(
      ([title, content, author, rating], i) => ({
        title,
        content,
        author,
        rating,
        ratingCount: 3,
        createdAt: new Date(now - (posts.length - i) * 3600000),
        updatedAt: new Date(now - (posts.length - i) * 3600000)
      })
    ));
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Posts', {
      title: posts.map(([title]) => title)
    });
  }
};
