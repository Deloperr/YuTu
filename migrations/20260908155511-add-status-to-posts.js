'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Posts', 'status', {
      type: Sequelize.STRING,
      defaultValue: 'draft'
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('Posts', 'status');
  }
};