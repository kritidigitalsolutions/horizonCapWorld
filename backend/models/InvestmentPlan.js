const mongoose = require("mongoose");

const roiSlabSchema = new mongoose.Schema(
  {
    minAmount: {
      type: Number,
      required: true,
      default: 10,
    },
    maxAmount: {
      type: Number,
      default: null,
    },
    noMaxLimit: {
      type: Boolean,
      default: false,
    },
    dailyRoi: {
      type: Number, // e.g. 0.25 for 0.25% daily
      required: true,
      default: 0.25,
    },
    monthlyRoi: {
      type: Number, // e.g. 7.5 for 7.5% monthly (dailyRoi * 30)
      default: 7.5,
    },
    annualRoi: {
      type: Number, // e.g. 90 for 90% annual (dailyRoi * 360)
      default: 90,
    },
  },
  { _id: false }
);

const defaultRoiSlabs = [
  { minAmount: 10, maxAmount: 49, noMaxLimit: false, dailyRoi: 0.25, monthlyRoi: 7.5, annualRoi: 90 },
  { minAmount: 50, maxAmount: 99, noMaxLimit: false, dailyRoi: 0.35, monthlyRoi: 10.5, annualRoi: 126 },
  { minAmount: 100, maxAmount: 499, noMaxLimit: false, dailyRoi: 0.55, monthlyRoi: 16.5, annualRoi: 198 },
  { minAmount: 500, maxAmount: 1500, noMaxLimit: false, dailyRoi: 0.75, monthlyRoi: 22.5, annualRoi: 270 },
  { minAmount: 1500, maxAmount: null, noMaxLimit: true, dailyRoi: 1.0, monthlyRoi: 30.0, annualRoi: 360 },
];

const loyaltyBonusSlabSchema = new mongoose.Schema(
  {
    days: {
      type: Number,
      required: true,
    },
    bonusPercentage: {
      type: Number,
      required: true,
    },
    label: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const defaultLoyaltyBonusSlabs = [
  { days: 30, bonusPercentage: 0.50, label: "30 Days" },
  { days: 90, bonusPercentage: 1.0, label: "90 Days" },
  { days: 180, bonusPercentage: 3.0, label: "180 Days" },
  { days: 365, bonusPercentage: 5.0, label: "365 Days" },
  { days: 730, bonusPercentage: 10.0, label: "730 Days" },
];

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
    roiType: {
      type: String,
      enum: ["slab", "fixed"],
      default: "slab",
    },
    roi: {
      type: Number, // Monthly ROI percentage e.g. 7.5 or 15
      required: true,
      default: 7.5,
    },
    dailyRoi: {
      type: Number, // Daily ROI percentage e.g. 0.25
      default: 0.25,
    },
    roiSlabs: {
      type: [roiSlabSchema],
      default: defaultRoiSlabs,
    },
    loyaltyBonusEnabled: {
      type: Boolean,
      default: true,
    },
    loyaltyBonusTitle: {
      type: String,
      default: "Reward ( Loyalty Bonus )",
    },
    loyaltyBonusDescription: {
      type: String,
      default: "Based on Capital not Withdrawn from the Account One time benefit directly given to the wallet",
    },
    loyaltyBonusSlabs: {
      type: [loyaltyBonusSlabSchema],
      default: defaultLoyaltyBonusSlabs,
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
      default: 10,
    },
    maxAmount: {
      type: Number,
      default: null,
    },
    noMaxLimit: {
      type: Boolean,
      default: true,
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

// Calculate roiPerSec and sync slabs before saving
investmentPlanSchema.pre("save", function () {
  // Ensure each slab has computed monthly and annual ROI
  if (this.roiSlabs && this.roiSlabs.length > 0) {
    this.roiSlabs = this.roiSlabs.map((slab) => {
      const daily = Number(slab.dailyRoi) || 0;
      return {
        minAmount: Number(slab.minAmount) || 0,
        maxAmount: slab.noMaxLimit ? null : Number(slab.maxAmount) || null,
        noMaxLimit: !!slab.noMaxLimit || !slab.maxAmount,
        dailyRoi: daily,
        monthlyRoi: Number((daily * 30).toFixed(2)),
        annualRoi: Number((daily * 360).toFixed(2)),
      };
    });

    if (this.roiType === "slab") {
      const firstSlab = this.roiSlabs[0];
      const lastSlab = this.roiSlabs[this.roiSlabs.length - 1];
      if (firstSlab) {
        this.dailyRoi = firstSlab.dailyRoi;
        this.roi = firstSlab.monthlyRoi;
        if (!this.minAmount || this.minAmount > firstSlab.minAmount) {
          this.minAmount = firstSlab.minAmount;
        }
      }
      if (lastSlab && lastSlab.noMaxLimit) {
        this.noMaxLimit = true;
        this.maxAmount = null;
      }
    }
  }

  // Calculate base roiPerSec
  const baseDailyRoi = this.dailyRoi || (this.roi ? this.roi / 30 : 0.25);
  const baseMin = this.minAmount || 10;
  const secRate = ((baseMin * (baseDailyRoi / 100)) / 86400).toFixed(6);
  this.roiPerSec = `$${secRate} / sec`;
});

module.exports = mongoose.model("InvestmentPlan", investmentPlanSchema);

