const ContactInquiry = require("../models/ContactInquiry");
const { sendContactInquiryEmail, sendInquiryConfirmationEmail } = require("../utils/emailService");

// @desc    Submit institutional contact inquiry from public website
// @route   POST /api/contact
// @route   POST /api/inquiries
// @access  Public
exports.submitContactInquiry = async (req, res) => {
  try {
    const { name, email, sector, message } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Full name is required.",
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Institutional / Work email is required.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid institutional email address.",
      });
    }

    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    const userAgent = req.headers["user-agent"] || "";

    // Save inquiry to MongoDB for persistent record
    const inquiry = await ContactInquiry.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      sector: (sector || "Renewable Energy").trim(),
      message: (message || "").trim(),
      ip: clientIp,
      userAgent: userAgent,
    });

    // Send email notification to Admin via Nodemailer (tradex615@gmail.com)
    const emailResult = await sendContactInquiryEmail({
      name: inquiry.name,
      email: inquiry.email,
      sector: inquiry.sector,
      message: inquiry.message,
      ip: clientIp,
      createdAt: inquiry.createdAt,
    });

    if (emailResult.success) {
      inquiry.emailSent = true;
      await inquiry.save();
    }

    // Send confirmation to inquirer (non-blocking)
    sendInquiryConfirmationEmail({
      name: inquiry.name,
      email: inquiry.email,
      sector: inquiry.sector,
    }).catch((err) => {
      console.warn("[Contact Controller] User confirmation auto-reply skipped:", err.message);
    });

    return res.status(200).json({
      success: true,
      message: "Your inquiry has been successfully received. Our institutional desk will reach out shortly.",
      inquiryId: inquiry._id,
    });
  } catch (error) {
    console.error("[Contact Controller Error]:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while submitting your inquiry. Please try again later.",
      error: error.message,
    });
  }
};

// @desc    Get all inquiries (for admin review)
// @route   GET /api/contact/all
// @access  Private/Admin
exports.getAllInquiries = async (req, res) => {
  try {
    const inquiries = await ContactInquiry.find().sort({ createdAt: -1 }).limit(100);
    return res.status(200).json({
      success: true,
      count: inquiries.length,
      inquiries,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
