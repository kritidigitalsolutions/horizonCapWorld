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
    activePromoters: {
      type: Number,
      default: 0,
    },
    totalVolume: {
      type: String,
      default: "$0",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ReferralSetting", referralSettingSchema);
