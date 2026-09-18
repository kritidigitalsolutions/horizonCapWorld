const mongoose = require("mongoose");

const withdrawalVideoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "Official Withdrawal Guide: How to withdraw funds to Bank, Crypto or E-Wallet",
    },
    subtitle: {
      type: String,
      default: "Watch this step-by-step video guide before submitting your withdrawal request for fastest clearance and zero rejection.",
    },
    videoType: {
      type: String,
      enum: ["url", "upload", "youtube"],
      default: "url",
    },
    videoUrl: {
      type: String,
      default: "https://www.w3schools.com/html/mov_bbb.mp4",
    },
    youtubeUrl: {
      type: String,
      default: "",
    },
    uploadedVideoName: {
      type: String,
      default: "horizon_official_withdrawal_tutorial.mp4",
    },
    instructions: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ["Published", "Draft"],
      default: "Published",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WithdrawalVideo", withdrawalVideoSchema);
