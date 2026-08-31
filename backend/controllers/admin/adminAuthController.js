const Admin = require("../../models/Admin");
const AdminSettings = require("../../models/AdminSettings");
const { generateToken } = require("../../utils/jwt");
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

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials.",
      });
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

// @desc    Change Admin Password
// @route   PUT /api/admin/auth/change-password
exports.changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    const admin = await Admin.findById(req.admin._id);
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password does not match.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    await admin.save();

    res.status(200).json({
      success: true,
      message: "Admin password updated successfully.",
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
