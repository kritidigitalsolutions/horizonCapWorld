const { verifyToken } = require("../utils/jwt");
const Admin = require("../models/Admin");
const User = require("../models/User");

// Protect Super Admin Routes
const protectAdmin = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No authorization token provided.",
      });
    }

    const decoded = verifyToken(token);
    const admin = await Admin.findById(decoded.id).select("-password");

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin account not found or token invalid.",
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired admin token.",
      error: error.message,
    });
  }
};

// Protect Investor / User Routes
const protectUser = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Investor authentication required.",
      });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Investor account not found or token invalid.",
      });
    }

    if (user.status === "Suspended") {
      return res.status(403).json({
        success: false,
        message: "Account is suspended. Please contact customer support.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired investor session token.",
      error: error.message,
    });
  }
};

// Optional User Auth (proceeds even if no token, but populates req.user if valid)
const optionalUserAuth = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id).select("-password");
      if (user) req.user = user;
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = { protectAdmin, protectUser, optionalUserAuth };
