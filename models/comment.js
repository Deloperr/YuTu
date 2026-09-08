'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Comment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
  Comment.belongsTo(models.Post, { foreignKey: 'postId', as: 'post' });
    }
  }
  Comment.init({
    text: DataTypes.TEXT,
    author: DataTypes.STRING,
    rating: DataTypes.FLOAT,
    postId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Comment',
  });
  return Comment;
};