const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// User Schema
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  fullName: {
    type: String,
    trim: true,
  },
  avatar: {
    type: String,
    default: "",
  },
  bio: {
    type: String,
    maxlength: 160,
    default: "",
  },
  isOnline: {
    type: Boolean,
    default: false,
    index: true,
  },
  lastSeen: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ["Available", "Busy", "Away", "Offline", "Do Not Disturb"],
    default: "Available",
  },
  contacts: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      nickname: String,
      blocked: {
        type: Boolean,
        default: false,
      },
      muted: {
        type: Boolean,
        default: false,
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  deviceTokens: [
    {
      token: String,
      device: String,
      platform: {
        type: String,
        enum: ["ios", "android", "web"],
        required: true,
      },
      lastUsed: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  settings: {
    notifications: {
      newMessage: {
        type: Boolean,
        default: true,
      },
      messageReactions: {
        type: Boolean,
        default: true,
      },
      groupInvites: {
        type: Boolean,
        default: true,
      },
      contactRequests: {
        type: Boolean,
        default: true,
      },
      sound: {
        type: Boolean,
        default: true,
      },
      vibration: {
        type: Boolean,
        default: true,
      },
    },
    privacy: {
      lastSeen: {
        type: String,
        enum: ["everyone", "contacts", "none"],
        default: "everyone",
      },
      profilePhoto: {
        type: String,
        enum: ["everyone", "contacts", "none"],
        default: "everyone",
      },
      status: {
        type: String,
        enum: ["everyone", "contacts", "none"],
        default: "everyone",
      },
    },
    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "system",
    },
    language: {
      type: String,
      default: "en",
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update timestamps
UserSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Create indexes for user lookups
UserSchema.index({ username: "text", fullName: "text" });
UserSchema.index({ email: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ "contacts.user": 1 });

const User = mongoose.model("User", UserSchema);

module.exports = User;
