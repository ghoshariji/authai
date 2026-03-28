const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    chatRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatRoom',
      required: [true, 'Chat room is required'],
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required'],
    },
    content: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['TEXT', 'IMAGE', 'FILE', 'AUDIO'],
      default: 'TEXT',
    },
    attachments: [
      {
        url: { type: String },
        publicId: { type: String },
        originalName: { type: String },
        mimeType: { type: String },
        size: { type: Number },
      },
    ],
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: [true, 'College ID is required'],
    },
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ chatRoom: 1, createdAt: -1 });
messageSchema.index({ collegeId: 1, sender: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
