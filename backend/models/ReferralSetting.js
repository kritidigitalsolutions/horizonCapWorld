const mongoose = require("mongoose");

const referralSettingSchema = new mongoose.Schema(
  {
    level: {
      type: String, // 'L1', 'L2', 'L3', 'L4', 'L5'
      required: true,
      unique: true,
    },
    levelNumber: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    investCommission: {
      type: String, // e.g. "5%"
      required: true,
      default: "5%",
    },
    investCommissionRate: {
      type: Number, // e.g. 5
      default: 5,
    },
    earningsCommission: {
      type: String, // e.g. "5%"
      required: true,
      default: "5%",
    },
    earningsCommissionRate: {
      type: Number, // e.g. 5
      default: 5,
    },
    depositAmount: {
      type: Number,
      default: 0,
    },
    profitAmount: {
      type: Number,
      default: 0,
    },
    roiPerDay: {
      type: Number, // e.g. 0.08, 0.16, 0.24, 0.40, etc.
      default: 0.08,
    },
    groupVolumeMin: {
      type: Number, // e.g. 25000, 20000, etc.
      default: 0,
    },
    directClientsMin: {
      type: Number, // e.g. 11, 10, 5, etc.
      default: 0,
    },
    eligibleConditions: {
      type: String, // e.g. "Group Volume Min.25,000$, 11 Direct Clients"
      default: "No Condition",
    },
    levelTitle: {
      type: String,
      default: "",
    },
    activePromoters: {
      type: Number,
      default: 0,
    },
    totalVolume: {
      type: String,
      default: "$0",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ReferralSetting", referralSettingSchema);
