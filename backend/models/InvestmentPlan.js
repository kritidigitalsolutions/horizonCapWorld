const mongoose = require("mongoose");

const investmentPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: "Renewable Energy",
      trim: true,
    },
    roi: {
      type: Number, // Monthly ROI percentage e.g. 1.5 for 1.5% or 10 for 10%
      required: true,
    },
    roiPerSec: {
      type: String,
      default: "",
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
    minAmount: {
      type: Number,
      required: true,
      default: 1000,
    },
    maxAmount: {
      type: Number,
      default: 50000,
    },
    noMaxLimit: {
      type: Boolean,
      default: false,
    },
    payoutInterval: {
      type: String,
      enum: ["Per Second (Live)", "Daily Payout"],
      default: "Per Second (Live)",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    investors: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Calculate roiPerSec before saving (Monthly ROI based)
investmentPlanSchema.pre("save", function () {
  if (this.roi && this.minAmount) {
    const secRate = ((this.minAmount * (this.roi / 100)) / (30 * 86400)).toFixed(6);
    this.roiPerSec = `$${secRate} / sec`;
  }
});

module.exports = mongoose.model("InvestmentPlan", investmentPlanSchema);
