const bcrypt = require("bcrypt");
const User = require("../../models/User");
const { generateToken } = require("../../utils/jwt");
const { syncUserStreamingEarnings } = require("../../utils/yieldAndAffiliateEngine");

// @desc    Register a new User
// @route   POST /api/user/auth/register
exports.register = async (req, res) => {
  try {
    const { name: rawName, fullName, email, phone, password, country, sponsorId } = req.body;
    const name = (rawName || fullName || "").trim();

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide your full name, email, and password.",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email address already exists.",
      });
    }

    // Auto-generate Unique Custom ID (e.g. HORIZON-USR-428)
    const count = await User.countDocuments();
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const customId = `HORIZON-USR-${String(count + 1).padStart(2, "0")}${randomSuffix}`;

    // Verify or default sponsor
    let finalSponsorId = sponsorId ? sponsorId.trim() : "HORIZON-HQ";
    if (sponsorId) {
      const sponsor = await User.findOne({ customId: sponsorId.trim() });
      if (sponsor) {
        sponsor.totalReferrals = (sponsor.totalReferrals || 0) + 1;
        sponsor.directReferrals = (sponsor.directReferrals || 0) + 1;
        await sponsor.save();
      }
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      customId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : "",
      password: hashedPassword,
      country: country || "United States",
      sponsorId: finalSponsorId,
      currentRank: "Starter",
      rankLevel: 1,
      depositWallet: 0,
      earningWallet: 0,
      totalInvested: 0,
      totalProfit: 0,
      totalWithdrawn: 0,
      totalReferrals: 0,
      directReferrals: 0,
      teamTurnover: 0,
      dailyEarning: 0,
      perSecondRate: 0,
      payoutType: "Per Second (Live)",
      status: "Active",
    });

    const token = generateToken(newUser._id, "USER");

    res.status(201).json({
      success: true,
      message: "Registration successful! Welcome to Horizon Capital.",
      token,
      user: {
        id: newUser._id,
        customId: newUser.customId,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        country: newUser.country,
        avatar: newUser.avatar,
        sponsorId: newUser.sponsorId,
        currentRank: newUser.currentRank,
        rankLevel: newUser.rankLevel,
        depositWallet: newUser.depositWallet,
        earningWallet: newUser.earningWallet,
        totalInvested: newUser.totalInvested,
        totalProfit: newUser.totalProfit,
        totalWithdrawn: newUser.totalWithdrawn,
        totalReferrals: newUser.totalReferrals,
        directReferrals: newUser.directReferrals,
        dailyEarning: newUser.dailyEarning,
        perSecondRate: newUser.perSecondRate,
        is2FAEnabled: newUser.is2FAEnabled,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    User Login
// @route   POST /api/user/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide your email and password.",
      });
    }

    let user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (user.status === "Suspended") {
      return res.status(403).json({
        success: false,
        message: "Your account is suspended. Please contact support.",
      });
    }

    // Synchronize latest per-second streaming ROI earnings upon login
    user = await syncUserStreamingEarnings(user);

    const token = generateToken(user._id, "USER");

    res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        customId: user.customId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        country: user.country,
        city: user.city,
        address: user.address,
        dob: user.dob,
        timezone: user.timezone,
        avatar: user.avatar,
        sponsorId: user.sponsorId,
        currentRank: user.currentRank,
        rankLevel: user.rankLevel,
        depositWallet: user.depositWallet,
        earningWallet: user.earningWallet,
        totalInvested: user.totalInvested,
        totalProfit: user.totalProfit,
        totalWithdrawn: user.totalWithdrawn,
        totalReferrals: user.totalReferrals,
        directReferrals: user.directReferrals,
        teamTurnover: user.teamTurnover,
        dailyEarning: user.dailyEarning,
        perSecondRate: user.perSecondRate,
        is2FAEnabled: user.is2FAEnabled,
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Authenticated User Profile
// @route   GET /api/user/profile or GET /api/user/auth/me
exports.getProfile = async (req, res) => {
  try {
    let user = await User.findById(req.user._id).select("-password -otp -otpExpires");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Sync streaming earnings
    user = await syncUserStreamingEarnings(user);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const {
  uploadToCloudinary,
  deleteFromCloudinary,
  replaceCloudinaryAsset,
} = require("../../utils/cloudinary");

// @desc    Update User Profile Details & Avatar
// @route   PUT /api/user/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, country, city, address, dob, timezone, avatar } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (country) user.country = country;
    if (city !== undefined) user.city = city;
    if (address !== undefined) user.address = address;
    if (dob !== undefined) user.dob = dob;
    if (timezone !== undefined) user.timezone = timezone;

    if (avatar !== undefined) {
      const oldAvatar = user.avatar;
      if (avatar && avatar.startsWith("data:")) {
        // Base64 image uploaded: store in Cloudinary and clean up old avatar
        const uploadRes = await replaceCloudinaryAsset(avatar, oldAvatar, {
          folder: "horizoncap/avatars/users",
        });
        user.avatar = uploadRes.secure_url;
      } else {
        // If avatar changed to a different URL or cleared, delete previous Cloudinary asset
        if (oldAvatar && oldAvatar !== avatar && oldAvatar.includes("cloudinary.com")) {
          deleteFromCloudinary(oldAvatar).catch((err) =>
            console.warn("[Cloudinary] User avatar removal failed:", err.message)
          );
        }
        user.avatar = avatar;
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        customId: user.customId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        country: user.country,
        city: user.city,
        address: user.address,
        dob: user.dob,
        timezone: user.timezone,
        avatar: user.avatar,
        sponsorId: user.sponsorId,
        currentRank: user.currentRank,
        rankLevel: user.rankLevel,
        depositWallet: user.depositWallet,
        earningWallet: user.earningWallet,
        totalInvested: user.totalInvested,
        totalProfit: user.totalProfit,
        totalWithdrawn: user.totalWithdrawn,
        is2FAEnabled: user.is2FAEnabled,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change Password
// @route   PUT /api/user/profile/password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long.",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password does not match our records.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send Email OTP for Verification / 2FA
// @route   POST /api/user/profile/send-otp
exports.sendOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    await user.save();

    res.status(200).json({
      success: true,
      message: `A 6-digit OTP has been dispatched to ${user.email}.`,
      otp, // included for development & testing
      expiresIn: "10 minutes",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify OTP
// @route   POST /api/user/profile/verify-otp
exports.verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ success: false, message: "Please provide the 6-digit OTP code." });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (!user.otp || user.otp !== otp.trim()) {
      return res.status(400).json({ success: false, message: "Invalid OTP code entered." });
    }

    if (user.otpExpires && new Date() > user.otpExpires) {
      return res.status(400).json({ success: false, message: "OTP code has expired. Please request a new code." });
    }

    user.otp = "";
    user.otpExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle Email 2FA Status
// @route   PUT /api/user/profile/2fa
exports.toggle2FA = async (req, res) => {
  try {
    const { enabled } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    user.is2FAEnabled = typeof enabled === "boolean" ? enabled : !user.is2FAEnabled;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Email 2FA security has been ${user.is2FAEnabled ? "enabled" : "disabled"}.`,
      is2FAEnabled: user.is2FAEnabled,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

