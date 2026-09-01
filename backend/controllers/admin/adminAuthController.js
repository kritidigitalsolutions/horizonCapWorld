const Admin = require("../../models/Admin");
const AdminSettings = require("../../models/AdminSettings");
const { generateToken } = require("../../utils/jwt");
const { sendOtpEmail, sendPasswordResetConfirmation } = require("../../utils/emailService");
const bcrypt = require("bcrypt");

// @desc    Login Super Admin
// @route   POST /api/admin/auth/login
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password.",
      });
    }

    let admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      // If no admin exists in DB at all, auto-create default super admin
      const adminCount = await Admin.countDocuments();
      if (adminCount === 0 && email.toLowerCase().trim() === "admin@gmail.com") {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("admin123", salt);
        admin = await Admin.create({
          name: "Super Admin",
          email: "admin@gmail.com",
          password: hashedPassword,
          avatar: "",
          recoveryEmail: "recovery@horizoncap.com",
          role: "SUPER_ADMIN",
          twoFactorEnabled: true,
        });
        console.log("[Auto-Seed] Initialized Super Admin upon first login.");
      } else {
        return res.status(401).json({
          success: false,
          message: "Invalid admin credentials.",
        });
      }
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials.",
      });
    }

    const token = generateToken(admin._id, admin.role);

    res.status(200).json({
      success: true,
      message: "Admin authenticated successfully.",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        avatar: admin.avatar,
        role: admin.role,
        twoFactorEnabled: admin.twoFactorEnabled,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Admin Profile
// @route   GET /api/admin/auth/profile
exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select("-password");
    res.status(200).json({ success: true, admin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const {
  uploadToCloudinary,
  deleteFromCloudinary,
  replaceCloudinaryAsset,
} = require("../../utils/cloudinary");

// @desc    Update Admin Profile (Name, Avatar, Recovery Email)
// @route   PUT /api/admin/auth/profile
exports.updateAdminProfile = async (req, res) => {
  try {
    const { name, avatar, recoveryEmail, twoFactorEnabled } = req.body;
    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found." });
    }

    if (name) admin.name = name.trim();
    if (recoveryEmail) admin.recoveryEmail = recoveryEmail.trim();
    if (twoFactorEnabled !== undefined) admin.twoFactorEnabled = twoFactorEnabled;

    if (avatar !== undefined) {
      const oldAvatar = admin.avatar;
      if (avatar && avatar.startsWith("data:")) {
        // Base64 image payload: upload and remove old asset
        const uploadRes = await replaceCloudinaryAsset(avatar, oldAvatar, {
          folder: "horizoncap/avatars/admin",
        });
        admin.avatar = uploadRes.secure_url;
      } else {
        // If avatar was cleared or changed to a new URL, clean up old Cloudinary asset
        if (oldAvatar && oldAvatar !== avatar && oldAvatar.includes("cloudinary.com")) {
          deleteFromCloudinary(oldAvatar).catch((err) =>
            console.warn("[Cloudinary] Admin avatar removal failed:", err.message)
          );
        }
        admin.avatar = avatar;
      }
    }

    await admin.save();

    res.status(200).json({
      success: true,
      message: "Admin profile updated successfully.",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        avatar: admin.avatar,
        recoveryEmail: admin.recoveryEmail,
        twoFactorEnabled: admin.twoFactorEnabled,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send OTP to Admin (Protected) for Password or Email Change
// @route   POST /api/admin/auth/send-otp
exports.sendAdminOtp = async (req, res) => {
  try {
    const { purpose, newEmail } = req.body;
    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    admin.otp = otp;
    admin.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    admin.otpPurpose = purpose || "CHANGE_PASSWORD";
    if (newEmail) {
      admin.pendingEmail = newEmail.toLowerCase().trim();
    }
    await admin.save();

    // Send genuine email via Nodemailer
    await sendOtpEmail({
      to: admin.email,
      name: admin.name,
      otp,
      purpose: purpose === "CHANGE_EMAIL" ? "Admin Email Change" : "Admin Password Change",
    });

    res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${admin.email}.`,
      expiresIn: "10 minutes",
    });
  } catch (error) {
    console.error("[Admin Auth] sendAdminOtp error:", error);
    res.status(500).json({ success: false, message: "Failed to send OTP: " + error.message });
  }
};

// @desc    Verify Admin OTP (Protected)
// @route   POST /api/admin/auth/verify-otp
exports.verifyAdminOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ success: false, message: "Please provide the 6-digit OTP code." });
    }

    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found." });
    }

    if (!admin.otp || admin.otp !== otp.trim()) {
      return res.status(400).json({ success: false, message: "Invalid OTP code entered." });
    }

    if (admin.otpExpires && new Date() > admin.otpExpires) {
      return res.status(400).json({ success: false, message: "OTP code has expired. Please request a new code." });
    }

    res.status(200).json({
      success: true,
      message: "Admin OTP verified successfully.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change Admin Email after OTP verification (Protected)
// @route   PUT /api/admin/auth/change-email
exports.changeAdminEmail = async (req, res) => {
  try {
    const { newEmail, otp } = req.body;
    if (!newEmail) {
      return res.status(400).json({ success: false, message: "New email is required." });
    }

    const cleanEmail = newEmail.toLowerCase().trim();
    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found." });
    }

    if (otp) {
      if (!admin.otp || admin.otp !== otp.trim()) {
        return res.status(400).json({ success: false, message: "Invalid OTP code." });
      }
      if (admin.otpExpires && new Date() > admin.otpExpires) {
        return res.status(400).json({ success: false, message: "OTP code has expired." });
      }
    }

    const existing = await Admin.findOne({ email: cleanEmail, _id: { $ne: admin._id } });
    if (existing) {
      return res.status(400).json({ success: false, message: "This email address is already in use by another admin." });
    }

    admin.email = cleanEmail;
    admin.otp = null;
    admin.otpExpires = null;
    admin.otpPurpose = null;
    admin.pendingEmail = null;
    await admin.save();

    res.status(200).json({
      success: true,
      message: "Master Admin email updated successfully.",
      email: admin.email,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change Admin Password (Protected)
// @route   PUT /api/admin/auth/change-password
exports.changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, otp } = req.body;
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password is required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long.",
      });
    }

    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found." });
    }

    // Either verify currentPassword or verified OTP
    if (currentPassword) {
      const isMatch = await admin.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Current password does not match.",
        });
      }
    } else if (otp) {
      if (!admin.otp || admin.otp !== otp.trim()) {
        return res.status(400).json({ success: false, message: "Invalid OTP code." });
      }
      if (admin.otpExpires && new Date() > admin.otpExpires) {
        return res.status(400).json({ success: false, message: "OTP code has expired." });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Current password or valid OTP code is required to update password.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    admin.otp = null;
    admin.otpExpires = null;
    admin.otpPurpose = null;
    await admin.save();

    // Send confirmation email
    sendPasswordResetConfirmation({ to: admin.email, name: admin.name }).catch((err) =>
      console.warn("[Email Service] Password update confirmation notice failed:", err.message)
    );

    res.status(200).json({
      success: true,
      message: "Admin password updated successfully.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send Forgot Password OTP for Admin (Public)
// @route   POST /api/admin/auth/forgot-password/send-otp
exports.forgotPasswordSendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Please provide your admin email address." });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "No admin account found matching this email address.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    admin.otp = otp;
    admin.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    admin.otpPurpose = "FORGOT_PASSWORD";
    await admin.save();

    // Send genuine email via Nodemailer
    await sendOtpEmail({
      to: admin.email,
      name: admin.name,
      otp,
      purpose: "Super Admin Password Recovery",
    });

    res.status(200).json({
      success: true,
      message: `A 6-digit password recovery code has been sent to ${admin.email}.`,
      expiresIn: "10 minutes",
    });
  } catch (error) {
    console.error("[Admin Auth] forgotPasswordSendOtp error:", error);
    res.status(500).json({ success: false, message: "Failed to dispatch recovery email: " + error.message });
  }
};

// @desc    Verify Forgot Password OTP for Admin (Public)
// @route   POST /api/admin/auth/forgot-password/verify-otp
exports.forgotPasswordVerifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP code are required." });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin account not found." });
    }

    if (!admin.otp || admin.otp !== otp.trim()) {
      return res.status(400).json({ success: false, message: "Invalid OTP code entered." });
    }

    if (admin.otpExpires && new Date() > admin.otpExpires) {
      return res.status(400).json({ success: false, message: "OTP code has expired. Please request a new code." });
    }

    res.status(200).json({
      success: true,
      message: "Recovery OTP verified successfully. You may now choose a new password.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset Admin Password using OTP (Public)
// @route   POST /api/admin/auth/forgot-password/reset
exports.forgotPasswordReset = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP code, and new password are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin account not found." });
    }

    if (!admin.otp || admin.otp !== otp.trim()) {
      return res.status(400).json({ success: false, message: "Invalid OTP code entered." });
    }

    if (admin.otpExpires && new Date() > admin.otpExpires) {
      return res.status(400).json({ success: false, message: "OTP code has expired. Please request a new code." });
    }

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    admin.otp = null;
    admin.otpExpires = null;
    admin.otpPurpose = null;
    await admin.save();

    // Send confirmation email
    sendPasswordResetConfirmation({ to: admin.email, name: admin.name }).catch((err) =>
      console.warn("[Email Service] Password reset confirmation email error:", err.message)
    );

    res.status(200).json({
      success: true,
      message: "Your admin password has been reset successfully. You can now login with your new credentials.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Admin Automated Alert Settings
// @route   GET /api/admin/auth/settings
exports.getAdminSettings = async (req, res) => {
  try {
    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = await AdminSettings.create({});
    }
    res.status(200).json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Admin Automated Alert Settings
// @route   PUT /api/admin/auth/settings
exports.updateAdminSettings = async (req, res) => {
  try {
    const { automatedAlerts, platformName, supportEmail } = req.body;
    let settings = await AdminSettings.findOne();

    if (!settings) {
      settings = new AdminSettings();
    }

    if (automatedAlerts) settings.automatedAlerts = { ...settings.automatedAlerts, ...automatedAlerts };
    if (platformName) settings.platformName = platformName;
    if (supportEmail) settings.supportEmail = supportEmail;

    await settings.save();

    res.status(200).json({
      success: true,
      message: "Admin platform settings updated successfully.",
      settings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
