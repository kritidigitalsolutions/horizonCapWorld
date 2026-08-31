const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    customId: {
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
    userCustomId: {
      type: String,
      default: "HORIZON-USR-01",
    },
    userEmail: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "United States",
    },
    type: {
      type: String,
      enum: ["Deposit", "Withdrawal", "ROI Return", "ROI Earning", "Referral Bonus", "Rank Bonus", "Plan Investment"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    rawAmount: {
      type: Number,
      default: 0,
    },
    fee: {
      type: Number,
      default: 0,
    },
    netAmount: {
      type: Number,
      default: 0,
    },
    gateway: {
      type: String,
      default: "System",
    },
    referenceNo: {
      type: String,
      default: "",
    },
    slipUrl: {
      type: String,
      default: "",
    },
    date: {
      type: String,
      default: () => new Date().toISOString().split("T")[0],
    },
    time: {
      type: String,
      default: () => new Date().toLocaleTimeString("en-US", { hour12: false }),
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Completed"],
      default: "Pending",
    },
    rejectReason: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
