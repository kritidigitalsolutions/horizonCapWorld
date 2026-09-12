const mongoose = require("mongoose");

const rankSchema = new mongoose.Schema(
  {
    level: {
      type: Number, // 1 to 10
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    ownDeposit: {
      type: Number, // Own Deposit in $
      default: 0,
    },
    totalClientDeposit: {
      type: Number, // Total Client Deposit in $
      default: 0,
    },
    minInvest: {
      type: Number, // Turnover required in $ (alias/backwards compatibility)
      default: 0,
    },
    reward: {
      type: Number, // One Time Cash Reward in $
      required: true,
    },
    condition: {
      type: String, // e.g. "1 Leg should not be more than 40% of the GV"
      default: "1 Leg should not be more than 40% of the GV",
    },
    companyProfitSharing: {
      type: String, // Company Profit %ge (e.g. "0" or "0.20% of the total company Profit + 500$ Per Month Salary")
      default: "0",
    },
    downlineStructureRequired: {
      type: String, // Downline Structure required (e.g. "2 Active Direct Client")
      default: "",
    },
    achievers: {
      type: Number,
      default: 0,
    },
    desc: {
      type: String,
      default: "",
    },
    badge: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "Active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Rank", rankSchema);
