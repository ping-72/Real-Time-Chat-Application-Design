const mongoose = require("mongoose");

// Call Schema (for voice and video calls)
const CallSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["audio", "video"],
    required: true,
  },
  status: {
    type: String,
    enum: [
      "initiated",
      "ringing",
      "ongoing",
      "completed",
      "missed",
      "rejected",
      "failed",
    ],
    default: "initiated",
  },
  initiator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recipients: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
  },
  startedAt: Date,
  endedAt: Date,
  duration: Number, // in seconds
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Create indexes for call lookups
CallSchema.index({ initiator: 1, createdAt: -1 });
CallSchema.index({ recipients: 1, createdAt: -1 });
CallSchema.index({ conversation: 1, createdAt: -1 });

const Call = mongoose.model("Call", CallSchema);

module.exports = Call;
