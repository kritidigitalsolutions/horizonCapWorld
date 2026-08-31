const mongoose = require("mongoose");

const depositVideoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "Official Deposit Guide: How to deposit via EasyPaisa, JazzCash, Bank Transfer & Crypto",
    },
    subtitle: {
      type: String,
      default: "Watch this 2-minute step-by-step video before transferring funds to ensure instant auto-credit and zero delays.",
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
      default: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    },
    uploadedVideoName: {
      type: String,
      default: "horizon_official_deposit_tutorial.mp4",
    },
    instructions: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      default: "Published",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DepositVideo", depositVideoSchema);
