const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientType: {
      type: String,
      enum: ["USER", "ADMIN", "ALL_USERS", "RANK"],
      required: true,
      default: "USER",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    targetRank: {
      type: String,
      default: null, // e.g. "Bronze", "Silver", "Gold", "Platinum", "Diamond"
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "FINANCIAL",
        "EARNINGS",
        "REFERRAL",
        "RANK",
        "SUPPORT",
        "SECURITY",
        "SYSTEM",
        "BROADCAST",
        "NEWS",
      ],
      default: "SYSTEM",
    },
    type: {
      type: String,
      default: "general", // e.g. "deposit_approved", "withdrawal_approved", "roi_streaming", "rank_upgrade", "push_notification", etc.
    },
    priority: {
      type: String,
      enum: ["LOW", "NORMAL", "HIGH", "URGENT"],
      default: "NORMAL",
    },
    actionUrl: {
      type: String,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    read: {
      type: Boolean,
      default: false, // For single recipient (USER or ADMIN)
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ], // For broadcast notifications (ALL_USERS or RANK)
    isBroadcast: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Indexes for high performance
notificationSchema.index({ recipientType: 1, userId: 1, createdAt: -1 });
notificationSchema.index({ isBroadcast: 1, createdAt: -1 });
notificationSchema.index({ targetRank: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
