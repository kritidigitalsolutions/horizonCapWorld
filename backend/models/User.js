const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    password: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      default: "United States",
    },
    city: {
      type: String,
      default: "New York",
    },
    address: {
      type: String,
      default: "",
    },
    dob: {
      type: String,
      default: "1995-01-01",
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    avatar: {
      type: String,
      default: "",
    },
    sponsorId: {
      type: String,
      default: "HORIZON-HQ",
    },
    currentRank: {
      type: String,
      default: "Bronze Explorer",
    },
    rankLevel: {
      type: Number,
      default: 1,
    },
    depositWallet: {
      type: Number,
      default: 0,
    },
    earningWallet: {
      type: Number,
      default: 0,
    },
    totalInvested: {
      type: Number,
      default: 0,
    },
    totalProfit: {
      type: Number,
      default: 0,
    },
    totalWithdrawn: {
      type: Number,
      default: 0,
    },
    totalReferrals: {
      type: Number,
      default: 0,
    },
    directReferrals: {
      type: Number,
      default: 0,
    },
    teamTurnover: {
      type: Number,
      default: 0,
    },
    dailyEarning: {
      type: Number,
      default: 0,
    },
    perSecondRate: {
      type: Number,
      default: 0,
    },
    payoutType: {
      type: String,
      default: "Per Second (Live)",
    },
    is2FAEnabled: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpires: {
      type: Date,
      default: null,
    },
    lastYieldSync: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Suspended"],
      default: "Active",
    },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
