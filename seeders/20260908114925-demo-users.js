'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const [adminHash, userHash] = await Promise.all([
      bcrypt.hash('Admin123!', 10),
      bcrypt.hash('User123!', 10)
    ]);

    await queryInterface.bulkInsert('Users', [
      {
        email: 'admin@yutu.local',
        passwordHash: adminHash,
        role: 'admin',
        createdAt: now,
        updatedAt: now
      },
      {
        email: 'user@yutu.local',
        passwordHash: userHash,
        role: 'user',
        createdAt: now,
        updatedAt: now
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('Users', {
      email: ['admin@yutu.local', 'user@yutu.local']
    });
  }
};
