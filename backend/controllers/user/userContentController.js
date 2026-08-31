const NewsArticle = require("../../models/NewsArticle");
const DepositVideo = require("../../models/DepositVideo");
const SupportChannel = require("../../models/SupportChannel");
const SupportTicket = require("../../models/SupportTicket");
const User = require("../../models/User");

// @desc    Get Published News & Media Articles
// @route   GET /api/user/news
exports.getNews = async (req, res) => {
  try {
    const { category, search } = req.query;
    const query = { status: "Published" };

    if (category && category !== "all") {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { subtitle: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    const articles = await NewsArticle.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: articles.length,
      articles,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Single News Article & Increment Views
// @route   GET /api/user/news/:id
exports.getNewsArticle = async (req, res) => {
  try {
    const article = await NewsArticle.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, message: "Article not found." });
    }

    article.views = (article.views || 0) + 1;
    await article.save();

    res.status(200).json({
      success: true,
      article,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Deposit Video Tutorial & Instructions
// @route   GET /api/user/deposits/video
exports.getDepositVideo = async (req, res) => {
  try {
    let video = await DepositVideo.findOne({ status: "Published" });
    if (!video) {
      video = {
        title: "Official Deposit Guide: How to deposit via EasyPaisa, JazzCash, Bank Transfer & Crypto",
        subtitle: "Watch this 2-minute step-by-step video before transferring funds to ensure instant auto-credit and zero delays.",
        videoType: "url",
        videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
        instructions: [
          "Choose your preferred deposit channel from the list (EasyPaisa, JazzCash, Bank Transfer, or Crypto).",
          "Copy the official account number, IBAN or wallet address, or scan the verified QR code.",
          "Complete the transfer through your banking or crypto app.",
          "Enter the amount sent and your Transaction ID (TID / Hash) or upload the bank transfer slip.",
          "Click 'Submit Deposit' — deposits are verified and auto-credited promptly.",
        ],
      };
    }

    res.status(200).json({
      success: true,
      video,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Official Verified Support Channels
// @route   GET /api/user/support/channels
exports.getSupportChannels = async (req, res) => {
  try {
    const channels = await SupportChannel.find({ status: "Active" }).sort({ createdAt: 1 });
    res.status(200).json({
      success: true,
      count: channels.length,
      channels,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const { uploadToCloudinary } = require("../../utils/cloudinary");

// @desc    Create Support Ticket
// @route   POST /api/user/support/tickets
exports.createSupportTicket = async (req, res) => {
  try {
    const { subject, category, priority, message, attachments: rawAttachments } = req.body;
    const userId = req.user._id;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Ticket subject and message body are required.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Process attachments to Cloudinary if base64
    let processedAttachments = [];
    if (Array.isArray(rawAttachments)) {
      for (const att of rawAttachments) {
        if (typeof att === "string" && att.startsWith("data:")) {
          const up = await uploadToCloudinary(att, { folder: "horizoncap/tickets" });
          processedAttachments.push(up.secure_url);
        } else if (typeof att === "object" && att.dataUrl && att.dataUrl.startsWith("data:")) {
          const up = await uploadToCloudinary(att.dataUrl, { folder: "horizoncap/tickets" });
          processedAttachments.push(up.secure_url);
        } else if (typeof att === "string" && att) {
          processedAttachments.push(att);
        }
      }
    }

    const ticketId = `TICK-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTicket = await SupportTicket.create({
      ticketId,
      user: user._id,
      userName: user.name,
      customId: user.customId,
      userEmail: user.email,
      subject: subject.trim(),
      category: category || "General Support",
      priority: priority || "Medium",
      status: "Open",
      messages: [
        {
          sender: "user",
          senderName: user.name,
          text: message.trim(),
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          attachments: processedAttachments,
        },
      ],
      lastUpdated: "Just now",
    });

    res.status(201).json({
      success: true,
      message: "Support ticket submitted successfully.",
      ticket: newTicket,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get User's Tickets History
// @route   GET /api/user/support/tickets
exports.getMyTickets = async (req, res) => {
  try {
    const userId = req.user._id;
    const userCustomId = req.user.customId;

    const tickets = await SupportTicket.find({
      $or: [{ user: userId }, { customId: userCustomId }],
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Ticket Details by ID
// @route   GET /api/user/support/tickets/:id
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({
      $or: [{ _id: req.params.id }, { ticketId: req.params.id }],
      $or: [{ user: req.user._id }, { customId: req.user.customId }],
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found." });
    }

    res.status(200).json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reply to an Existing Support Ticket
// @route   POST /api/user/support/tickets/:id/reply
exports.replyToTicket = async (req, res) => {
  try {
    const { text, attachments } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Reply message text is required." });
    }

    const ticket = await SupportTicket.findOne({
      $or: [{ _id: req.params.id }, { ticketId: req.params.id }],
      $or: [{ user: req.user._id }, { customId: req.user.customId }],
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found." });
    }

    // Process attachments to Cloudinary if base64
    let processedAttachments = [];
    if (Array.isArray(attachments)) {
      for (const att of attachments) {
        if (typeof att === "string" && att.startsWith("data:")) {
          const up = await uploadToCloudinary(att, { folder: "horizoncap/tickets" });
          processedAttachments.push(up.secure_url);
        } else if (typeof att === "object" && att.dataUrl && att.dataUrl.startsWith("data:")) {
          const up = await uploadToCloudinary(att.dataUrl, { folder: "horizoncap/tickets" });
          processedAttachments.push(up.secure_url);
        } else if (typeof att === "string" && att) {
          processedAttachments.push(att);
        }
      }
    }

    ticket.messages.push({
      sender: "user",
      senderName: req.user.name || "Investor",
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      attachments: processedAttachments,
    });

    if (ticket.status === "Resolved" || ticket.status === "Closed") {
      ticket.status = "In Progress";
    }

    ticket.lastUpdated = "Just now";
    await ticket.save();

    res.status(200).json({
      success: true,
      message: "Reply sent successfully.",
      ticket,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

