'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Posts', [
      { title: 'Первый пост', content: 'Содержимое', author: 'Иван', rating: 4.5, ratingCount: 10, createdAt: new Date(), updatedAt: new Date() },
      { title: 'Второй пост', content: 'Ещё контент', author: 'Мария', rating: 3.8, ratingCount: 5, createdAt: new Date(), updatedAt: new Date() }
    ], {});
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('Posts', null, {});
  }
};