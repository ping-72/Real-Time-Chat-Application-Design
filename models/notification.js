const mongoose = require("mongoose");

// Notification Schema
const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: [
      "new_message",
      "message_reaction",
      "mention",
      "contact_request",
      "contact_accepted",
      "group_invite",
      "group_added",
      "group_removed",
      "new_admin",
      "announcement",
    ],
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
  },
  message: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
  },
  contactRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ContactRequest",
  },
  title: {
    type: String,
    required: true,
  },
  body: {
    type: String,
  },
  data: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true,
  },
  readAt: Date,
  isDelivered: {
    type: Boolean,
    default: false,
  },
  deliveredAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  expiresAt: {
    type: Date,
    index: true,
  },
});

// Create indexes for notification lookups
NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Notification = mongoose.model("Notification", NotificationSchema);

module.exports = Notification;
