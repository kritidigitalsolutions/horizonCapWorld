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
    minInvest: {
      type: Number, // Turnover required in $
      required: true,
    },
    reward: {
      type: Number, // Cash bonus reward in $
      required: true,
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
