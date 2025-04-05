const mongoose = require("mongoose");

// ContactRequest Schema
const ContactRequestSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "blocked"],
    default: "pending",
  },
  message: {
    type: String,
    maxlength: 200,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  respondedAt: Date,
});

// Create indexes for contact request lookups
ContactRequestSchema.index({ sender: 1, recipient: 1 }, { unique: true });
ContactRequestSchema.index({ recipient: 1, status: 1 });
ContactRequestSchema.index({ createdAt: -1 });

const ContactRequest = mongoose.model("ContactRequest", ContactRequestSchema);

module.exports = ContactRequest;
