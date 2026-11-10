const mongoose = require('mongoose');
const toJSON = require('./toJSON');

const messageSchema = new mongoose.Schema(
  {
    author: { type: String, required: true, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: {
      type: String,
      required: [true, 'Текст сообщения обязателен'],
      trim: true,
      maxlength: [500, 'Сообщение – не длиннее 500 символов']
    }
  },
  { timestamps: true, toJSON }
);

messageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
