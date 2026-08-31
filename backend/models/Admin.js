const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "Super Admin",
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    recoveryEmail: {
      type: String,
      default: "recovery@horizoncap.com",
    },
    role: {
      type: String,
      default: "SUPER_ADMIN",
    },
    twoFactorEnabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Method to verify password
adminSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Admin", adminSchema);
