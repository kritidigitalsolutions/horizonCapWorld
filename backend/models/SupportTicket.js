const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String, // 'user', 'admin', 'internal'
      required: true,
    },
    senderName: {
      type: String,
      default: "Support Agent",
    },
    text: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      default: () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
    attachments: [
      {
        name: String,
        url: String,
        fileType: String,
      },
    ],
  },
  { timestamps: true }
);

const supportTicketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    userName: {
      type: String,
      default: "Investor",
    },
    customId: {
      type: String,
      default: "HORIZON-USR-01",
    },
    userEmail: {
      type: String,
      default: "",
    },
    subject: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: "Deposit & Funding",
    },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low", "Urgent"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Closed"],
      default: "Open",
    },
    messages: [messageSchema],
    lastUpdated: {
      type: String,
      default: "Just now",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
