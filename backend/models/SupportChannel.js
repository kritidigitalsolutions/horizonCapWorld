const mongoose = require("mongoose");

const supportChannelSchema = new mongoose.Schema(
  {
    platform: {
      type: String, // 'WhatsApp', 'Telegram', 'Email', 'Phone', 'Discord', etc.
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    handle: {
      type: String,
      default: "",
    },
    url: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      default: "24/7 VIP Escrow Support",
    },
    hours: {
      type: String,
      default: "24/7 Live Coverage",
    },
    category: {
      type: String,
      default: "Instant Chat",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Busy"],
      default: "Active",
    },
    stats: {
      type: String,
      default: "Avg. Reply < 2 mins",
    },
    icon: {
      type: String,
      default: "whatsapp",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupportChannel", supportChannelSchema);
