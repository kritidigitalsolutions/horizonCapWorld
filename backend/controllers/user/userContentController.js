const NewsArticle = require("../../models/NewsArticle");
const DepositVideo = require("../../models/DepositVideo");
const SupportChannel = require("../../models/SupportChannel");
const SupportTicket = require("../../models/SupportTicket");
const User = require("../../models/User");

// @desc    Get Published News & Media Articles
// @route   GET /api/user/news
exports.getNews = async (req, res) => {
  try {
    const { category, search, tag } = req.query;
    let query = { status: "Published" };

    if (category && category !== "all") {
      query.category = category;
    }

    if (tag) {
      query.tags = { $in: [tag] };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { subtitle: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    const articles = await NewsArticle.find(query).sort({ isFeatured: -1, createdAt: -1 });
    res.status(200).json({ success: true, count: articles.length, articles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Single News Article
// @route   GET /api/user/news/:id
exports.getNewsArticle = async (req, res) => {
  try {
    const article = await NewsArticle.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, message: "News article not found." });
    }

    // Increment view count
    article.views = (article.views || 0) + 1;
    await article.save();

    res.status(200).json({ success: true, article });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Deposit Tutorial Video
// @route   GET /api/user/deposits/tutorial-video
exports.getDepositVideo = async (req, res) => {
  try {
    let video = await DepositVideo.findOne({ status: "Published" });
    if (!video) {
      video = await DepositVideo.findOne();
    }
    res.status(200).json({ success: true, video });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Active Support Channels (WhatsApp, Telegram, Email, Phone)
// @route   GET /api/user/support/channels
exports.getSupportChannels = async (req, res) => {
  try {
    const channels = await SupportChannel.find({ status: "Active" }).sort({ createdAt: 1 });
    res.status(200).json({ success: true, count: channels.length, channels });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create Support Ticket
// @route   POST /api/user/support/tickets
exports.createSupportTicket = async (req, res) => {
  try {
    const { subject, category, priority, message, attachmentUrl } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Subject and message description are required.",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User account not found." });
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newTicket = await SupportTicket.create({
      ticketId: `TICK-${Math.floor(1000 + Math.random() * 9000)}`,
      user: user._id,
      userName: user.name,
      customId: user.customId || "HORIZON-USR-01",
      userEmail: user.email,
      subject,
      category: category || "General Inquiry",
      priority: priority || "Normal",
      status: "Open",
      messages: [
        {
          sender: "user",
          senderName: user.name,
          text: message,
          attachmentUrl: attachmentUrl || "",
          time: timeStr,
          createdAt: now,
        },
      ],
      lastUpdated: "Just now",
    });

    res.status(201).json({
      success: true,
      message: `Support ticket #${newTicket.ticketId} created successfully.`,
      ticket: newTicket,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Current User's Support Tickets
// @route   GET /api/user/support/tickets
exports.getMyTickets = async (req, res) => {
  try {
    const { status } = req.query;
    let query = { user: req.user._id };

    if (status && status !== "all") {
      query.status = status;
    }

    const tickets = await SupportTicket.find(query).sort({ updatedAt: -1 });
    res.status(200).json({ success: true, count: tickets.length, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Single Support Ticket
// @route   GET /api/user/support/tickets/:id
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Support ticket not found." });
    }

    res.status(200).json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reply to Support Ticket
// @route   POST /api/user/support/tickets/:id/reply
exports.replyToTicket = async (req, res) => {
  try {
    const { message, attachmentUrl } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message content is required.",
      });
    }

    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Support ticket not found." });
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    ticket.messages.push({
      sender: "user",
      senderName: req.user.name || "Investor",
      text: message,
      attachmentUrl: attachmentUrl || "",
      time: timeStr,
      createdAt: now,
    });

    ticket.status = "Open";
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
