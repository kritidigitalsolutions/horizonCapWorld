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
    dailyRoi: {
      type: Number, // Daily ROI % (e.g. 0.25%, 0.35%, 0.55%, 0.75%, 1.00%)
      default: 0.25,
    },
    roi: {
      type: Number, // Monthly ROI % (e.g. 7.5%, 10.5%, 16.5%, etc.)
      required: true,
    },
    annualRoi: {
      type: Number, // Annual ROI % (e.g. 90%, 126%, 198%, etc.)
      default: 90,
    },
    slabApplied: {
      minAmount: Number,
      maxAmount: Number,
      dailyRoi: Number,
      monthlyRoi: Number,
      annualRoi: Number,
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
  if (this.amount) {
    if (this.dailyRoi) {
      // Daily ROI based
      this.dailyEarning = this.amount * (this.dailyRoi / 100);
      this.roi = this.roi || Number((this.dailyRoi * 30).toFixed(2));
      this.annualRoi = this.annualRoi || Number((this.dailyRoi * 360).toFixed(2));
    } else if (this.roi) {
      // Monthly ROI based
      this.dailyEarning = (this.amount * (this.roi / 100)) / 30;
      this.dailyRoi = Number((this.roi / 30).toFixed(4));
      this.annualRoi = Number((this.roi * 12).toFixed(2));
    }
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
