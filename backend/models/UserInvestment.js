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
      required: true,
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
    },
    roi: {
      type: Number, // Monthly ROI % (e.g. 1.5% or 10%)
      required: true,
    },
    payoutInterval: {
      type: String,
      enum: ["Per Second (Live)", "Daily Payout"],
      default: "Per Second (Live)",
    },
    duration: {
      type: String,
      default: "12 Months",
    },
    durationDays: {
      type: Number,
      default: 365,
    },
    isInfinite: {
      type: Boolean,
      default: false,
    },
    dailyEarning: {
      type: Number,
      default: 0,
    },
    perSecondRate: {
      type: Number,
      default: 0,
    },
    totalProfitEarned: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    lastSettlementAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Active", "Completed", "Cancelled"],
      default: "Active",
    },
  },
  { timestamps: true }
);

// Auto-generate customId & calculate rates before saving
userInvestmentSchema.pre("save", function () {
  if (!this.customId) {
    this.customId = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
  }
  if (this.amount && this.roi) {
    // roi is Monthly ROI % -> Daily return = (amount * (roi / 100)) / 30
    this.dailyEarning = (this.amount * (this.roi / 100)) / 30;
    // Per second = dailyEarning / 86400
    this.perSecondRate = this.dailyEarning / 86400;
  }
  if (!this.endDate && !this.isInfinite && this.durationDays) {
    const end = new Date(this.startDate || Date.now());
    end.setDate(end.getDate() + this.durationDays);
    this.endDate = end;
  }
});

module.exports = mongoose.model("UserInvestment", userInvestmentSchema);
