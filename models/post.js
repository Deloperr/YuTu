'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Post extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
  Post.hasMany(models.Comment, { foreignKey: 'postId', as: 'comments' });
    }
  }
  Post.init({
    title: DataTypes.STRING,
    content: DataTypes.TEXT,
    author: DataTypes.STRING,
    rating: DataTypes.FLOAT,
    ratingCount: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Post',
  });
  return Post;
};