const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      default: () => `TRX-${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`,
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
      enum: ["Deposit", "Withdrawal", "ROI Return", "Referral Bonus", "Rank Bonus"],
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
    senderName: {
      type: String,
      default: "",
    },
    senderAccount: {
      type: String,
      default: "",
    },
    senderPhone: {
      type: String,
      default: "",
    },
    cryptoNetwork: {
      type: String,
      default: "",
    },
    selectedToken: {
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
    note: {
      type: String,
      default: "",
    },
    isSeenByAdmin: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// Auto-generate unique customId if missing before save
transactionSchema.pre("save", function () {
  if (!this.customId) {
    this.customId = `TRX-${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;
  }
});

module.exports = mongoose.model("Transaction", transactionSchema);
