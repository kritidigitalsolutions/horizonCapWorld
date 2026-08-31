const mongoose = require("mongoose");

const userInvestmentSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userCustomId: {
      type: String,
      default: "HORIZON-USR-01",
    },
    userName: {
      type: String,
      default: "Investor",
    },
    userEmail: {
      type: String,
      default: "",
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InvestmentPlan",
    },
    planName: {
      type: String,
      required: true,
    },
    planCategory: {
      type: String,
      default: "Renewable Energy",
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    roi: {
      type: Number, // Annual percentage e.g. 18
      required: true,
    },
    dailyEarning: {
      type: Number,
      default: 0,
    },
    perSecondRate: {
      type: Number,
      default: 0,
    },
    totalEarned: {
      type: Number,
      default: 0,
    },
    durationDays: {
      type: Number,
      default: 365,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    daysRemaining: {
      type: Number,
      default: 365,
    },
    payoutInterval: {
      type: String,
      default: "Per Second (Live)",
    },
    status: {
      type: String,
      enum: ["Active", "Completed", "Paused", "Cancelled"],
      default: "Active",
    },
    lastYieldSync: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserInvestment", userInvestmentSchema);

