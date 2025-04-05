const mongoose = require("mongoose");

// Message Schema
const MessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
    index: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  content: {
    type: String,
    required: function () {
      return this.contentType === "text" && !this.attachments?.length;
    },
  },
  contentType: {
    type: String,
    enum: [
      "text",
      "image",
      "video",
      "audio",
      "file",
      "location",
      "contact",
      "system",
    ],
    default: "text",
  },
  attachments: [
    {
      type: {
        type: String,
        enum: ["image", "video", "audio", "file"],
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      name: String,
      size: Number,
      mimeType: String,
      width: Number,
      height: Number,
      duration: Number, // For audio/video
      thumbnailUrl: String,
      previewUrl: String,
    },
  ],
  readBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  deliveredTo: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
  },
  forwardedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
  },
  mentions: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      startIndex: Number,
      endIndex: Number,
    },
  ],
  reactions: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reaction: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  isEdited: {
    type: Boolean,
    default: false,
  },
  editHistory: [
    {
      content: String,
      editedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: Date,
  deletedFor: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  expiresAt: Date,
  systemAction: {
    type: String,
    enum: [
      "member_joined",
      "member_left",
      "member_added",
      "member_removed",
      "group_created",
      "group_renamed",
      "group_icon_changed",
      "message_pinned",
      "message_unpinned",
      "call_started",
      "call_ended",
      "admin_added",
      "admin_removed",
    ],
  },
  systemData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Create indexes for message lookups
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ sender: 1, createdAt: -1 });
MessageSchema.index({ "mentions.user": 1 });
MessageSchema.index({ "reactions.user": 1 });
MessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save hook to update conversation's lastMessage
MessageSchema.pre("save", async function (next) {
  if (this.isNew && !this.isDeleted) {
    try {
      await mongoose
        .model("Conversation")
        .findByIdAndUpdate(this.conversationId, {
          lastMessage: this._id,
          updatedAt: this.createdAt || new Date(),
        });
    } catch (error) {
      next(error);
    }
  }
  next();
});

const Message = mongoose.model("Message", MessageSchema);

module.exports = Message;
