const mongoose = require("mongoose");

const paymentMethodSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["fiat", "bank", "crypto"],
      required: true,
    },
    category: {
      type: String,
      default: "Mobile E-Wallet", // 'Mobile E-Wallet', 'Crypto Digital Wallet', 'Indian Bank Account', 'International Bank Account'
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      default: "",
    },
    currency: {
      type: String,
      default: "USD",
    },
    // Fiat / Mobile fields
    provider: {
      type: String,
      default: "",
    },
    accountNumber: {
      type: String,
      default: "",
    },
    accountHolder: {
      type: String,
      default: "",
    },
    cnic: {
      type: String,
      default: "",
    },
    tillId: {
      type: String,
      default: "",
    },
    // Bank fields
    bankName: {
      type: String,
      default: "",
    },
    ifsc: {
      type: String,
      default: "",
    },
    iban: {
      type: String,
      default: "",
    },
    swiftCode: {
      type: String,
      default: "",
    },
    upiId: {
      type: String,
      default: "",
    },
    branch: {
      type: String,
      default: "",
    },
    accountType: {
      type: String,
      default: "Current Account",
    },
    // Crypto fields
    network: {
      type: String,
      default: "",
    },
    networkCode: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    memo: {
      type: String,
      default: "",
    },
    tokens: [
      {
        type: String,
      },
    ],
    minDeposits: [
      {
        token: String,
        min: String,
      },
    ],
    // Common settings
    minLimit: {
      type: String,
      default: "$10 USD",
    },
    maxLimit: {
      type: String,
      default: "$1,000,000 USD",
    },
    confirmationTime: {
      type: String,
      default: "Instant (< 1 Min)",
    },
    qrCodeUrl: {
      type: String,
      default: "",
    },
    instructions: {
      type: String,
      default: "",
    },
    warning: {
      type: String,
      default: "",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentMethod", paymentMethodSchema);
