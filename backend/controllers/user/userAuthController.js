const bcrypt = require("bcrypt");
const User = require("../../models/User");
const PendingRegistration = require("../../models/PendingRegistration");
const AdminSettings = require("../../models/AdminSettings");
const { generateToken } = require("../../utils/jwt");
const { syncUserStreamingEarnings } = require("../../utils/yieldAndAffiliateEngine");
const { sendOtpEmail, sendWelcomeEmail, sendPasswordResetConfirmation } = require("../../utils/emailService");
const { notifyUser } = require("../../utils/notificationService");

// Helper to escape regex special characters
const escapeRegex = (str) => {
  return (str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Helper to build flexible phone query matching formatted or unformatted phone numbers
const buildPhoneQuery = (phone) => {
  if (!phone || typeof phone !== "string") return null;
  const digits = phone.replace(/[^\d]/g, "");
  if (!digits || digits.length < 7) return null;

  const exactDigitsPattern = digits
    .split("")
    .map((d) => escapeRegex(d))
    .join("[\\s\\-\\(\\)\\.]*");

  const conditions = [
    { phone: { $regex: exactDigitsPattern, $options: "i" } },
  ];

  if (digits.length >= 10) {
    const last10 = digits.slice(-10);
    const last10Pattern =
      last10
        .split("")
        .map((d) => escapeRegex(d))
        .join("[\\s\\-\\(\\)\\.]*") + "$";
    conditions.push({ phone: { $regex: last10Pattern, $options: "i" } });
  }

  return { $or: conditions };
};

// Comprehensive duplicate checker for username, email, and phone number
const checkUserDuplicates = async ({ userName, email, phone, excludeUserId = null }) => {
  const duplicates = {
    userName: false,
    email: false,
    phone: false,
    hasDuplicates: false,
    messages: [],
    details: {},
  };

  const baseQuery = excludeUserId ? { _id: { $ne: excludeUserId } } : {};

  // 1. Check Username (against both 'name' and 'userName')
  const cleanUserName = (userName || "").trim().replace(/\s+/g, " ");
  if (cleanUserName && cleanUserName.length >= 2) {
    const escapedName = escapeRegex(cleanUserName);
    const existingName = await User.findOne({
      ...baseQuery,
      $or: [
        { name: { $regex: `^${escapedName}$`, $options: "i" } },
        { userName: { $regex: `^${escapedName}$`, $options: "i" } },
      ],
    });
    if (existingName) {
      duplicates.userName = true;
      const msg = "This username is already taken. Please choose another username.";
      duplicates.messages.push(msg);
      duplicates.details.userName = msg;
    }
  }

  // 2. Check Email Address
  const cleanEmail = (email || "").toLowerCase().trim();
  if (cleanEmail && cleanEmail.includes("@")) {
    const existingEmail = await User.findOne({
      ...baseQuery,
      email: cleanEmail,
    });
    if (existingEmail) {
      duplicates.email = true;
      const msg = "An account with this email address already exists. Please log in or use a different email.";
      duplicates.messages.push(msg);
      duplicates.details.email = msg;
    }
  }

  // 3. Check Mobile / Phone Number
  const cleanPhone = (phone || "").trim();
  const phoneQuery = buildPhoneQuery(cleanPhone);
  if (phoneQuery) {
    const existingPhone = await User.findOne({
      ...baseQuery,
      ...phoneQuery,
    });
    if (existingPhone) {
      duplicates.phone = true;
      const msg = "This mobile number is already registered with another account.";
      duplicates.messages.push(msg);
      duplicates.details.phone = msg;
    }
  }

  duplicates.hasDuplicates = duplicates.userName || duplicates.email || duplicates.phone;
  return duplicates;
};

// @desc    Check if username, email, or phone is already taken
// @route   POST /api/user/auth/check-availability
exports.checkAvailability = async (req, res) => {
  try {
    const { userName, name, fullName, email, phone } = req.body;
    const checkName = (userName || name || fullName || "").trim();

    const duplicateCheck = await checkUserDuplicates({
      userName: checkName,
      email,
      phone,
    });

    return res.status(200).json({
      success: true,
      available: !duplicateCheck.hasDuplicates,
      duplicates: {
        userName: duplicateCheck.userName,
        email: duplicateCheck.email,
        phone: duplicateCheck.phone,
      },
      errors: duplicateCheck.details,
      message: duplicateCheck.hasDuplicates
        ? duplicateCheck.messages.join(" ")
        : "All fields available.",
    });
  } catch (error) {
    console.error("[checkAvailability Error]:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send OTP for User Registration (2FA Verification)
// @route   POST /api/user/auth/send-register-otp
exports.sendRegisterOtp = async (req, res) => {
  try {
    const { name: rawName, fullName, userName, email, phone, password, country, sponsorId } = req.body;
    const name = (userName || rawName || fullName || "").trim();

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide your username / full name, email, and password.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check for duplicate username, email, phone
    const duplicateCheck = await checkUserDuplicates({
      userName: name,
      email: cleanEmail,
      phone,
    });

    if (duplicateCheck.hasDuplicates) {
      return res.status(400).json({
        success: false,
        message: duplicateCheck.messages.join(" "),
        errors: duplicateCheck.details,
        duplicates: {
          userName: duplicateCheck.userName,
          email: duplicateCheck.email,
          phone: duplicateCheck.phone,
        },
      });
    }

    // Hash Password for safe pending storage
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    // Store in PendingRegistration
    await PendingRegistration.findOneAndUpdate(
      { email: cleanEmail },
      {
        name,
        userName: name,
        email: cleanEmail,
        phone: phone ? phone.trim().slice(0, 16) : "",
        password: hashedPassword,
        plainPassword: password,
        country: country || "United States",
        sponsorId: sponsorId ? sponsorId.trim() : "HORIZON-HQ",
        otp,
        otpExpires,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Send 6-digit verification code to the email the user provided
    await sendOtpEmail({
      to: cleanEmail,
      name,
      otp,
      purpose: "Account Registration & Email Verification",
    });

    res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${cleanEmail}.`,
      email: cleanEmail,
    });
  } catch (error) {
    console.error("[sendRegisterOtp Error]:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register a new User (Verifies OTP from PendingRegistration or creates user)
// @route   POST /api/user/auth/register
exports.register = async (req, res) => {
  try {
    const { name: rawName, fullName, userName, email, phone, password, country, sponsorId, otp } = req.body;
    const cleanEmail = (email || "").toLowerCase().trim();

    if (!cleanEmail) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    let finalName = (userName || rawName || fullName || "").trim();
    let finalPhone = phone ? phone.trim().slice(0, 16) : "";
    let finalHashedPassword = "";
    let finalPlainPassword = "";
    let finalCountry = country || "United States";
    let finalSponsorId = sponsorId ? sponsorId.trim() : "HORIZON-HQ";

    const adminSettings = await AdminSettings.findOne();
    const signupOtpRequired = adminSettings?.userSecurity?.signupOtpRequired === true;

    // If OTP is provided, check PendingRegistration
    if (otp) {
      const pending = await PendingRegistration.findOne({ email: cleanEmail });
      if (!pending) {
        return res.status(400).json({
          success: false,
          message: "Registration session expired or not found. Please request a new OTP.",
        });
      }

      if (pending.otp !== otp.trim()) {
        return res.status(400).json({
          success: false,
          message: "Invalid 6-digit verification code. Please check your email inbox.",
        });
      }

      if (pending.otpExpires && new Date() > pending.otpExpires) {
        return res.status(400).json({
          success: false,
          message: "Verification code has expired. Please request a new code.",
        });
      }

      finalName = pending.userName || pending.name || finalName;
      finalPhone = pending.phone || finalPhone;
      finalHashedPassword = pending.password;
      finalPlainPassword = pending.plainPassword || "";
      finalCountry = pending.country || finalCountry;
      finalSponsorId = pending.sponsorId || finalSponsorId;

      // Delete pending record
      await PendingRegistration.deleteOne({ _id: pending._id });
    } else {
      // If no OTP provided, check if Admin requires Email OTP
      if (signupOtpRequired) {
        return res.status(400).json({
          success: false,
          message: "Email OTP verification is required to complete registration. Please verify the code sent to your email.",
        });
      }

      if (!finalName || !password) {
        return res.status(400).json({
          success: false,
          message: "Please provide all required registration details including password.",
        });
      }
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long.",
        });
      }
      const salt = await bcrypt.genSalt(10);
      finalHashedPassword = await bcrypt.hash(password, salt);
      finalPlainPassword = password;
    }

    // Comprehensive Duplicate Check (Username, Email, Phone)
    const duplicateCheck = await checkUserDuplicates({
      userName: finalName,
      email: cleanEmail,
      phone: finalPhone,
    });

    if (duplicateCheck.hasDuplicates) {
      return res.status(400).json({
        success: false,
        message: duplicateCheck.messages.join(" "),
        errors: duplicateCheck.details,
        duplicates: {
          userName: duplicateCheck.userName,
          email: duplicateCheck.email,
          phone: duplicateCheck.phone,
        },
      });
    }

    // Auto-generate Unique Custom ID (e.g. HORIZON-USR-428)
    const count = await User.countDocuments();
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const customId = `HORIZON-USR-${String(count + 1).padStart(2, "0")}${randomSuffix}`;

    // Verify or default sponsor
    let verifiedSponsorId = "HORIZON-HQ";
    if (finalSponsorId && finalSponsorId.trim()) {
      const cleanSponsor = finalSponsorId.trim();
      const sponsor = await User.findOne({
        $or: [
          { customId: { $regex: `^${cleanSponsor}$`, $options: "i" } },
          { email: cleanSponsor.toLowerCase() },
          ...(/^[0-9a-fA-F]{24}$/.test(cleanSponsor) ? [{ _id: cleanSponsor }] : []),
        ],
      });
      if (sponsor) {
        verifiedSponsorId = sponsor.customId;
        sponsor.totalReferrals = (sponsor.totalReferrals || 0) + 1;
        sponsor.directReferrals = (sponsor.directReferrals || 0) + 1;
        await sponsor.save();

        // Automated downline join alert to sponsor
        notifyUser({
          userId: sponsor._id,
          title: "New Downline Partner Joined",
          message: `Investor ${finalName} (${cleanEmail}) has joined your direct affiliate team!`,
          category: "REFERRAL",
          type: "downline_join",
          priority: "NORMAL",
          actionUrl: "/referrals",
          metadata: { newUserName: finalName, newUserCustomId: customId },
          settingKey: "autoDownlineJoins",
        }).catch((err) => console.warn("[Notify Sponsor Warning]:", err.message));
      }
    }

    const initial2FA = adminSettings?.userSecurity?.require2FAForAllUsers ?? false;

    const newUser = await User.create({
      customId,
      name: finalName,
      userName: finalName,
      email: cleanEmail,
      phone: finalPhone,
      password: finalHashedPassword,
      plainPassword: finalPlainPassword,
      country: finalCountry,
      sponsorId: verifiedSponsorId,
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
      is2FAEnabled: initial2FA,
      status: "Active",
    });

    // Welcome notification to new user
    notifyUser({
      userId: newUser._id,
      title: "Welcome to Horizon Capital Worlds",
      message: "Your investor portfolio has been initialized. Fund your wallet or activate an investment plan to start streaming live returns.",
      category: "SYSTEM",
      type: "welcome_notice",
      priority: "HIGH",
      actionUrl: "/plans",
    }).catch((err) => console.warn("[Notify User Warning]:", err.message));

    // Send Welcome Email via Nodemailer SMTP
    sendWelcomeEmail({
      to: newUser.email,
      name: newUser.name,
      customId: newUser.customId,
      sponsorId: newUser.sponsorId,
    }).catch((err) => console.warn("[Welcome Email Warning]:", err.message));

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
    console.error("[register Error]:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    User Login (Mandatory 2FA Email OTP Verification)
// @route   POST /api/user/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password, otp } = req.body;

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

    // Auto-capture plaintext password if not already recorded
    if (!user.plainPassword) {
      user.plainPassword = password;
      await user.save();
    }

    if (user.status === "Suspended") {
      return res.status(403).json({
        success: false,
        message: "Your account is suspended. Please contact support.",
      });
    }

    if (user.status === "Blocked") {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked as you have withdrawn your full capital under the 3X Cap Plan. Please create a new account to continue.",
      });
    }

    // ──────── 2FA CHECK (CONFIGURED GLOBALLY BY ADMIN IN SETTINGS) ────────
    const adminSettings = await AdminSettings.findOne();
    const isGlobal2FAEnforced = adminSettings?.userSecurity?.require2FAForAllUsers === true;
    const is2FARequired = isGlobal2FAEnforced;

    if (is2FARequired) {
      if (!otp) {
        // Generate and dispatch OTP to user's registered email
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = code;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        user.otpPurpose = "2FA_LOGIN";
        await user.save();

        await sendOtpEmail({
          to: user.email,
          name: user.name,
          otp: code,
          purpose: "Investor Portal 2-Step Login Verification",
        });

        return res.status(200).json({
          success: true,
          require2FA: true,
          message: `A 6-digit security code has been sent to ${user.email}.`,
          email: user.email,
        });
      } else {
        // Validate OTP
        if (!user.otp || user.otp !== otp.trim()) {
          return res.status(400).json({
            success: false,
            message: "Invalid 6-digit 2FA code entered. Please check your email.",
          });
        }
        if (user.otpExpires && new Date() > user.otpExpires) {
          return res.status(400).json({
            success: false,
            message: "2FA code has expired. Please request a new code.",
          });
        }

        user.otp = null;
        user.otpExpires = null;
        user.otpPurpose = null;
        await user.save();
      }
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

// @desc    Resend 2FA Login OTP (Public)
// @route   POST /api/user/auth/resend-2fa-otp
exports.sendLogin2FAOtp = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.otpPurpose = "2FA_LOGIN";
    await user.save();

    await sendOtpEmail({
      to: user.email,
      name: user.name,
      otp,
      purpose: "Investor Portal 2-Step Login Verification",
    });

    res.status(200).json({
      success: true,
      message: `A new 6-digit code has been dispatched to ${user.email}.`,
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
    const { name, email, phone, country, city, address, dob, timezone, avatar } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (name) user.name = name.trim();
    if (email && typeof email === "string" && email.trim()) {
      const cleanEmail = email.toLowerCase().trim();
      if (cleanEmail !== user.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
          return res.status(400).json({ success: false, message: "Please provide a valid email address." });
        }
        const existing = await User.findOne({ email: cleanEmail, _id: { $ne: user._id } });
        if (existing) {
          return res.status(400).json({
            success: false,
            message: "This email address is already in use by another investor account.",
          });
        }
        user.email = cleanEmail;
      }
    }
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

// @desc    Change Password (with current password and/or OTP)
// @route   PUT /api/user/profile/password
exports.changePassword = async (req, res) => {
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

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (currentPassword) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Current password does not match our records.",
        });
      }
    } else if (otp) {
      if (!user.otp || user.otp !== otp.trim()) {
        return res.status(400).json({ success: false, message: "Invalid OTP code entered." });
      }
      if (user.otpExpires && new Date() > user.otpExpires) {
        return res.status(400).json({ success: false, message: "OTP code has expired. Please request a new code." });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Current password or valid verification code is required.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.plainPassword = newPassword;
    user.otp = "";
    user.otpExpires = null;
    user.otpPurpose = null;
    await user.save();

    // Send confirmation email
    sendPasswordResetConfirmation({ to: user.email, name: user.name }).catch((err) =>
      console.warn("[Email Service] Password update confirmation failed:", err.message)
    );

    res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send Email OTP for Verification / 2FA / Password Change
// @route   POST /api/user/profile/send-otp
exports.sendOtp = async (req, res) => {
  try {
    const { purpose } = req.body || {};
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    user.otpPurpose = purpose || "PROFILE_SECURITY";
    await user.save();

    // Send genuine email via Nodemailer
    await sendOtpEmail({
      to: user.email,
      name: user.name,
      otp,
      purpose: purpose === "CHANGE_PASSWORD" ? "Account Password Update" : "Profile Security Verification",
    });

    res.status(200).json({
      success: true,
      message: `A 6-digit OTP has been dispatched to ${user.email}.`,
      expiresIn: "10 minutes",
    });
  } catch (error) {
    console.error("[User Auth] sendOtp error:", error);
    res.status(500).json({ success: false, message: "Failed to send OTP: " + error.message });
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

// @desc    Send Forgot Password OTP for User (Public)
// @route   POST /api/user/auth/forgot-password/send-otp
exports.userForgotPasswordSendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Please provide your registered email address." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user account found matching this email address.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.otpPurpose = "FORGOT_PASSWORD";
    await user.save();

    // Send genuine email via Nodemailer
    await sendOtpEmail({
      to: user.email,
      name: user.name,
      otp,
      purpose: "Investor Password Recovery",
    });

    res.status(200).json({
      success: true,
      message: `A 6-digit password recovery code has been sent to ${user.email}.`,
      expiresIn: "10 minutes",
    });
  } catch (error) {
    console.error("[User Auth] forgotPasswordSendOtp error:", error);
    res.status(500).json({ success: false, message: "Failed to dispatch recovery email: " + error.message });
  }
};

// @desc    Verify Forgot Password OTP for User (Public)
// @route   POST /api/user/auth/forgot-password/verify-otp
exports.userForgotPasswordVerifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP code are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ success: false, message: "User account not found." });
    }

    if (!user.otp || user.otp !== otp.trim()) {
      return res.status(400).json({ success: false, message: "Invalid OTP code entered." });
    }

    if (user.otpExpires && new Date() > user.otpExpires) {
      return res.status(400).json({ success: false, message: "OTP code has expired. Please request a new code." });
    }

    res.status(200).json({
      success: true,
      message: "Recovery OTP verified successfully. You may now enter your new password.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset User Password using OTP (Public)
// @route   POST /api/user/auth/forgot-password/reset
exports.userForgotPasswordReset = async (req, res) => {
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

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ success: false, message: "User account not found." });
    }

    if (!user.otp || user.otp !== otp.trim()) {
      return res.status(400).json({ success: false, message: "Invalid OTP code entered." });
    }

    if (user.otpExpires && new Date() > user.otpExpires) {
      return res.status(400).json({ success: false, message: "OTP code has expired. Please request a new code." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.plainPassword = newPassword;
    user.otp = "";
    user.otpExpires = null;
    user.otpPurpose = null;
    await user.save();

    // Send confirmation email
    sendPasswordResetConfirmation({ to: user.email, name: user.name }).catch((err) =>
      console.warn("[Email Service] Password reset confirmation notice error:", err.message)
    );

    res.status(200).json({
      success: true,
      message: "Your password has been reset successfully. You can now login with your new credentials.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get public security and registration settings (whether 2FA or Signup OTP is required)
// @route   GET /api/user/auth/security-settings
exports.getPublicSecuritySettings = async (req, res) => {
  try {
    const adminSettings = await AdminSettings.findOne();
    const require2FAForAllUsers = adminSettings?.userSecurity?.require2FAForAllUsers === true;
    const signupOtpRequired = adminSettings?.userSecurity?.signupOtpRequired === true;

    res.status(200).json({
      success: true,
      require2FAForAllUsers,
      signupOtpRequired,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

