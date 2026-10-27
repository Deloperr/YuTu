const mongoose = require('mongoose');
const toJSON = require('./toJSON');

// Комментарий – вложенный документ: хранится в массиве comments поста
const commentSchema = new mongoose.Schema(
  {
    author: { type: String, required: true, trim: true },
    text: {
      type: String,
      required: [true, 'Текст комментария обязателен'],
      trim: true,
      maxlength: 1000
    },
    likes: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true, toJSON }
);

// Оценка пользователя: одна на пользователя, хранится в массиве ratings
const ratingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    value: { type: Number, required: true, min: 1, max: 5 }
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Заголовок обязателен'],
      trim: true,
      maxlength: 200
    },
    content: {
      type: String,
      required: [true, 'Содержимое обязательно'],
      trim: true
    },
    author: { type: String, required: true, trim: true },
    // Ссылка на документ другой коллекции (раскрывается через populate)
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
    tags: [{ type: String, lowercase: true, trim: true }],
    comments: [commentSchema],
    ratings: [ratingSchema],
    rating: { type: Number, default: 0 },
    views: { type: Number, default: 0 }
  },
  { timestamps: true, toJSON }
);

// Индексы для частых запросов: лента по дате, фильтр по тегу и автору
postSchema.index({ createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ authorId: 1 });

// Метод экземпляра: поставить или изменить оценку и пересчитать средний рейтинг
postSchema.methods.rate = function (userId, value) {
  const existing = this.ratings.find((r) => r.userId.equals(userId));
  if (existing) {
    existing.value = value;
  } else {
    this.ratings.push({ userId, value });
  }
  const sum = this.ratings.reduce((acc, r) => acc + r.value, 0);
  this.rating = Math.round((sum / this.ratings.length) * 100) / 100;
  return this.save();
};

// Статический метод модели: посты с указанным тегом
postSchema.statics.findByTag = function (tag) {
  return this.find({ tags: tag.toLowerCase() }).sort({ createdAt: -1 });
};

// Виртуальное поле: число комментариев (не хранится в базе)
postSchema.virtual('commentCount').get(function () {
  // Если комментарии исключены проекцией (select), поле не выводится
  if (!this.isSelected('comments')) return undefined;
  return this.comments.length;
});

module.exports = mongoose.model('Post', postSchema);
