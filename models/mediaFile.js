const mongoose = require("mongoose");

// MediaFile Schema (for tracking uploaded files)
const MediaFileSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ["image", "video", "audio", "document", "other"],
    required: true,
    index: true,
  },
  filename: {
    type: String,
    required: true,
  },
  originalFilename: String,
  mimeType: String,
  size: {
    type: Number, // in bytes
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  thumbnailUrl: String,
  width: Number,
  height: Number,
  duration: Number, // for audio/video
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
  messages: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  ],
  isPublic: {
    type: Boolean,
    default: false,
  },
  expiresAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Create indexes for media file lookups
MediaFileSchema.index({ owner: 1, type: 1 });
MediaFileSchema.index({ messages: 1 });
MediaFileSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const MediaFile = mongoose.model("MediaFile", MediaFileSchema);

module.exports = MediaFile;
