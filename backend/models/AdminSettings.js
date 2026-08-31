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
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminSettings", adminSettingsSchema);
