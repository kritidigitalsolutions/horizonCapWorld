const mongoose = require("mongoose");

const adminSettingsSchema = new mongoose.Schema(
  {
    automatedAlerts: {
      autoDepositApproval: { type: Boolean, default: true },
      autoRoiStreaming: { type: Boolean, default: true },
      autoDailyPayout: { type: Boolean, default: true },
      autoWithdrawalBroadcast: { type: Boolean, default: true },
      autoPlanMaturity: { type: Boolean, default: true },
      autoRankMilestones: { type: Boolean, default: true },
      autoReferralCommissions: { type: Boolean, default: true },
      autoDownlineJoins: { type: Boolean, default: true },
      autoTicketReplies: { type: Boolean, default: true },
      autoTicketStatusChange: { type: Boolean, default: true },
      autoNewsBroadcasts: { type: Boolean, default: true },
      autoSystemMaintenance: { type: Boolean, default: true },
      autoNewDeviceLogin: { type: Boolean, default: true },
      autoSecurityOtpDispatch: { type: Boolean, default: true },
    },
    platformName: {
      type: String,
      default: "Horizon Capital",
    },
    supportEmail: {
      type: String,
      default: "support@horizoncap.com",
    },
    referralDepositCommissionEnabled: {
      type: Boolean,
      default: true,
    },
    referralRoiShareEnabled: {
      type: Boolean,
      default: true,
    },
    referralSystemEnabled: {
      type: Boolean,
      default: true,
    },
    withdrawalSettings: {
      feeType: {
        type: String,
        enum: ["percentage", "fixed"],
        default: "percentage",
      },
      feePercentage: {
        type: Number,
        default: 5, // 5%
      },
      fixedFee: {
        type: Number,
        default: 0, // $0
      },
      minWithdrawal: {
        type: Number,
        default: 5, // $5 USD
      },
      maxWithdrawal: {
        type: Number,
        default: 50000, // $50,000 USD
      },
      processingTime: {
        type: String,
        default: "12 - 24 Hours",
      },
      feeEnabled: {
        type: Boolean,
        default: true,
      },
      singleIdMaxWithdrawal: {
        type: String,
        default: "3X + Capital Maximum Withdrawal Allowed",
      },
      singleIdMaxWithdrawalMultiplier: {
        type: Number,
        default: 4, // 3X return + 1X capital = 4X
      },
      termsNotice: {
        type: String,
        default:
          "Automated clearance turnaround within 12-24 hours. Standard platform protocol fee is applied upon withdrawal submission. Single ID maximum withdrawal allowed is 3X + Capital.",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminSettings", adminSettingsSchema);
