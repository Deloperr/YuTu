const mongoose = require('mongoose');
const toJSON = require('./toJSON');

// Вложенный документ профиля хранится внутри пользователя, без отдельной коллекции
const profileSchema = new mongoose.Schema(
  {
    displayName: { type: String, trim: true, maxlength: 60 },
    city: { type: String, trim: true },
    bio: { type: String, maxlength: 300 }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email обязателен'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Некорректный email']
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    profile: { type: profileSchema, default: () => ({}) }
  },
  {
    timestamps: true,
    toJSON: {
      ...toJSON,
      transform: (doc, ret) => {
        const { passwordHash, ...rest } = toJSON.transform(doc, ret);
        return rest;
      }
    }
  }
);

// Каскадное удаление: вместе с пользователем удаляются его посты
userSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await mongoose.model('Post').deleteMany({ authorId: doc._id });
  }
});

module.exports = mongoose.model('User', userSchema);
