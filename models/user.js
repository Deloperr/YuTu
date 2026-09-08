'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // Пользователь пока не привязан к постам по FK: автор хранится строкой (ЛР1/ЛР2).
    }

    toSafeJSON() {
      return {
        id: this.id,
        email: this.email,
        role: this.role,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      };
    }
  }

  User.init({
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'user'
    }
  }, {
    sequelize,
    modelName: 'User'
  });

  return User;
};
