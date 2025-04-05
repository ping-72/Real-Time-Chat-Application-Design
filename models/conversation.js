const mongoose = require("mongoose");

// Conversation Schema
const ConversationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["private", "group", "broadcast"],
    required: true,
    default: "private",
    index: true,
  },
  name: {
    type: String,
    trim: true,
    required: function () {
      return this.type !== "private";
    },
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  admins: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  avatar: {
    type: String,
    default: "",
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
  },
  pinnedMessages: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  ],
  memberSettings: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      nickname: String,
      muted: {
        type: Boolean,
        default: false,
      },
      mutedUntil: Date,
      pinned: {
        type: Boolean,
        default: false,
      },
      notificationSettings: {
        type: String,
        enum: ["all", "mentions", "none"],
        default: "all",
      },
      lastReadMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
    },
  ],
  groupSettings: {
    joinMethod: {
      type: String,
      enum: ["open", "approval", "invite_only"],
      default: "invite_only",
    },
    whoCanSendMessages: {
      type: String,
      enum: ["everyone", "admins_only"],
      default: "everyone",
    },
    whoCanAddMembers: {
      type: String,
      enum: ["everyone", "admins_only"],
      default: "everyone",
    },
    whoCanEditInfo: {
      type: String,
      enum: ["everyone", "admins_only"],
      default: "admins_only",
    },
  },
  isEncrypted: {
    type: Boolean,
    default: false,
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
  updatedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Create indexes for conversation lookups
ConversationSchema.index({ members: 1 });
ConversationSchema.index({ updatedAt: -1 });
ConversationSchema.index({ "memberSettings.user": 1 });
ConversationSchema.index(
  { type: 1, members: 1 },
  {
    unique: true,
    partialFilterExpression: {
      type: "private",
      "members.2": { $exists: false },
    },
  }
);

// Static method to find or create private conversation
ConversationSchema.statics.findOrCreatePrivate = async function (
  user1Id,
  user2Id
) {
  const members = [user1Id, user2Id].sort(); // Sort for consistent order

  // Find existing private conversation
  const existingConversation = await this.findOne({
    type: "private",
    members: { $all: members, $size: 2 },
  });

  if (existingConversation) {
    return existingConversation;
  }

  // Create new private conversation
  const newConversation = new this({
    type: "private",
    members,
    creator: user1Id,
    memberSettings: [{ user: user1Id }, { user: user2Id }],
  });

  await newConversation.save();
  return newConversation;
};

// Update timestamps
ConversationSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Conversation = mongoose.model("Conversation", ConversationSchema);

module.exports = Conversation;
