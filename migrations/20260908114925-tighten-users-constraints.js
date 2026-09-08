'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Users', 'email', {
      type: Sequelize.STRING,
      allowNull: false
    });
    await queryInterface.changeColumn('Users', 'passwordHash', {
      type: Sequelize.STRING,
      allowNull: false
    });
    await queryInterface.changeColumn('Users', 'role', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'user'
    });
    await queryInterface.addIndex('Users', ['email'], {
      unique: true,
      name: 'users_email_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('Users', 'users_email_unique');
    await queryInterface.changeColumn('Users', 'email', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.changeColumn('Users', 'passwordHash', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.changeColumn('Users', 'role', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }
};
