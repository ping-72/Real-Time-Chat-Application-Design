const mongoose = require("mongoose");

// Session Schema (for tracking user sessions)
const SessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  refreshToken: {
    type: String,
    unique: true,
  },
  deviceInfo: {
    ip: String,
    userAgent: String,
    browser: String,
    os: String,
    device: String,
    deviceId: String,
  },
  isValid: {
    type: Boolean,
    default: true,
    index: true,
  },
  lastActive: {
    type: Date,
    default: Date.now,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create indexes for session lookups
SessionSchema.index({ user: 1, isValid: 1 });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session = mongoose.model("Session", SessionSchema);

module.exports = Session;
