const mongoose = require("mongoose");

const contactInquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Institutional / Work email is required"],
      trim: true,
      lowercase: true,
    },
    sector: {
      type: String,
      default: "Renewable Energy",
      trim: true,
    },
    message: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["new", "reviewed", "replied", "archived"],
      default: "new",
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    ip: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContactInquiry", contactInquirySchema);
