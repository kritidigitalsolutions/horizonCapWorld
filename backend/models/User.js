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
    userName: {
      type: String,
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
    plainPassword: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: " ",
    },
    city: {
      type: String,
      default: " ",
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
    cryptoWallets: {
      usdtBep20: {
        type: String,
        default: "",
        trim: true,
      },
      usdtTrc20: {
        type: String,
        default: "",
        trim: true,
      },
      solana: {
        type: String,
        default: "",
        trim: true,
      },
      polygon: {
        type: String,
        default: "",
        trim: true,
      },
    },
    sponsorId: {
      type: String,
      default: "HORIZON-HQ",
    },
    currentRank: {
      type: String,
      default: "Associate",
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
    // Detailed Income Stream Sub-balances composing Earning Wallet
    pvRoiBalance: {
      type: Number,
      default: 0,
    },
    levelIncomeBalance: {
      type: Number,
      default: 0,
    },
    rankRewardBalance: {
      type: Number,
      default: 0,
    },
    companyProfitBalance: {
      type: Number,
      default: 0,
    },
    salaryBalance: {
      type: Number,
      default: 0,
    },
    // Locked / Expired 3X ROI held in Administrative Escrow after 15-day withdrawal window
    lockedRoiBalance: {
      type: Number,
      default: 0,
    },
    totalInvested: {
      type: Number,
      default: 0,
    },
    firstInvestmentAmount: {
      type: Number,
      default: 0,
    },
    hasReceivedReferralBonus: {
      type: Boolean,
      default: false,
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
    otpPurpose: {
      type: String,
      default: null,
    },
    pendingEmail: {
      type: String,
      default: null,
    },
    lastYieldSync: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Suspended", "Blocked"],
      default: "Active",
    },
    isSeenByAdmin: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

userSchema.index({ sponsorId: 1 });
userSchema.index({ sponsorCustomId: 1 });
userSchema.index({ status: 1 });
userSchema.index({ sponsorId: 1, totalInvested: 1 });

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
