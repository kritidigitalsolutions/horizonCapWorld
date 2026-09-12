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
      type: Number, // Without Lock In Period Daily ROI % (e.g. 0.3%, 0.5%, 0.8%, 1.0%)
      required: true,
      default: 0.3,
    },
    lockInDailyRoi: {
      type: Number, // 3 Months Lock In Daily ROI % (e.g. 0.4%, 0.6%, 0.9%, 1.1%)
      default: 0.4,
    },
    monthlyRoi: {
      type: Number, // Without lock-in monthly ROI (dailyRoi * 30)
      default: 9.0,
    },
    lockInMonthlyRoi: {
      type: Number, // 3 Months lock-in monthly ROI (lockInDailyRoi * 30)
      default: 12.0,
    },
    annualRoi: {
      type: Number, // Without lock-in annual ROI (dailyRoi * 360)
      default: 108.0,
    },
    lockInAnnualRoi: {
      type: Number, // 3 Months lock-in annual ROI (lockInDailyRoi * 360)
      default: 144.0,
    },
  },
  { _id: false }
);

const defaultRoiSlabs = [
  { minAmount: 10, maxAmount: 100, noMaxLimit: false, dailyRoi: 0.3, lockInDailyRoi: 0.4, monthlyRoi: 9.0, lockInMonthlyRoi: 12.0, annualRoi: 108.0, lockInAnnualRoi: 144.0 },
  { minAmount: 101, maxAmount: 500, noMaxLimit: false, dailyRoi: 0.5, lockInDailyRoi: 0.6, monthlyRoi: 15.0, lockInMonthlyRoi: 18.0, annualRoi: 180.0, lockInAnnualRoi: 216.0 },
  { minAmount: 501, maxAmount: 5000, noMaxLimit: false, dailyRoi: 0.8, lockInDailyRoi: 0.9, monthlyRoi: 24.0, lockInMonthlyRoi: 27.0, annualRoi: 288.0, lockInAnnualRoi: 324.0 },
  { minAmount: 5001, maxAmount: null, noMaxLimit: true, dailyRoi: 1.0, lockInDailyRoi: 1.1, monthlyRoi: 30.0, lockInMonthlyRoi: 33.0, annualRoi: 360.0, lockInAnnualRoi: 396.0 },
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
      type: Number, // Monthly ROI percentage e.g. 9.0
      required: true,
      default: 9.0,
    },
    dailyRoi: {
      type: Number, // Daily ROI percentage e.g. 0.3
      default: 0.3,
    },
    roiSlabs: {
      type: [roiSlabSchema],
      default: defaultRoiSlabs,
    },
    hasLockInOption: {
      type: Boolean,
      default: true,
    },
    lockInPeriodDays: {
      type: Number,
      default: 90, // 3 Months standard lock-in
    },
    minDepositAmount: {
      type: Number,
      default: 10,
    },
    minWithdrawalAmount: {
      type: Number,
      default: 5,
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
  // Ensure each slab has computed monthly and annual ROI for both Standard and Lock-In
  if (this.roiSlabs && this.roiSlabs.length > 0) {
    this.roiSlabs = this.roiSlabs.map((slab) => {
      const daily = Number(slab.dailyRoi) || 0;
      const lockInDaily = slab.lockInDailyRoi !== undefined && slab.lockInDailyRoi !== null
        ? Number(slab.lockInDailyRoi)
        : Number((daily + 0.1).toFixed(4));
      return {
        minAmount: Number(slab.minAmount) || 0,
        maxAmount: slab.noMaxLimit ? null : Number(slab.maxAmount) || null,
        noMaxLimit: !!slab.noMaxLimit || !slab.maxAmount,
        dailyRoi: daily,
        lockInDailyRoi: lockInDaily,
        monthlyRoi: Number((daily * 30).toFixed(2)),
        lockInMonthlyRoi: Number((lockInDaily * 30).toFixed(2)),
        annualRoi: Number((daily * 360).toFixed(2)),
        lockInAnnualRoi: Number((lockInDaily * 360).toFixed(2)),
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
  const baseDailyRoi = this.dailyRoi || (this.roi ? this.roi / 30 : 0.3);
  const baseMin = this.minAmount || 10;
  const secRate = ((baseMin * (baseDailyRoi / 100)) / 86400).toFixed(6);
  this.roiPerSec = `$${secRate} / sec`;
});

module.exports = mongoose.model("InvestmentPlan", investmentPlanSchema);

