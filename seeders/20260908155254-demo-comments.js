'use strict';
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('Comments', [
      { text: 'Супер!', author: 'Алексей', rating: 5, postId: 1, createdAt: new Date(), updatedAt: new Date() },
      { text: 'Полезно', author: 'Елена', rating: 4, postId: 1, createdAt: new Date(), updatedAt: new Date() }
    ], {});
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('Comments', null, {});
  }
};