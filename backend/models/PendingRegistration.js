const mongoose = require("mongoose");

const pendingRegistrationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
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
    phone: {
      type: String,
      default: "",
      trim: true,
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
      default: "United States",
      trim: true,
    },
    sponsorId: {
      type: String,
      default: "HORIZON-HQ",
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    otpExpires: {
      type: Date,
      required: true,
      index: { expires: "15m" }, // Auto-delete document after 15 minutes
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PendingRegistration", pendingRegistrationSchema);
