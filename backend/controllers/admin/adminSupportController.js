const SupportTicket = require("../../models/SupportTicket");
const SupportChannel = require("../../models/SupportChannel");

// @desc    Get All Support Tickets
// @route   GET /api/admin/support/tickets
exports.getSupportTickets = async (req, res) => {
  try {
    const { status, priority, category, search, page = 1, limit = 20 } = req.query;
    let query = {};

    if (status && status !== "all") query.status = status;
    if (priority && priority !== "all") query.priority = priority;
    if (category && category !== "all") query.category = category;

    if (search) {
      query.$or = [
        { ticketId: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
        { userName: { $regex: search, $options: "i" } },
        { customId: { $regex: search, $options: "i" } },
        { userEmail: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await SupportTicket.countDocuments(query);
    const tickets = await SupportTicket.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const openCount = await SupportTicket.countDocuments({ status: "Open" });
    const inProgressCount = await SupportTicket.countDocuments({ status: "In Progress" });
    const resolvedCount = await SupportTicket.countDocuments({ status: { $in: ["Resolved", "Closed"] } });

    res.status(200).json({
      success: true,
      total,
      openCount,
      inProgressCount,
      resolvedCount,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      tickets,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Single Support Ticket with Conversation Thread
// @route   GET /api/admin/support/tickets/:id
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Support ticket not found." });
    }
    res.status(200).json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const { uploadToCloudinary, deleteFromCloudinary } = require("../../utils/cloudinary");

// @desc    Reply to Support Ticket (User or Internal Note)
// @route   POST /api/admin/support/tickets/:id/reply
exports.replyTicket = async (req, res) => {
  try {
    const { text, isInternalNote, attachments } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Reply message text is required." });
    }

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Support ticket not found." });
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

    const newMessage = {
      sender: isInternalNote ? "internal" : "admin",
      senderName: isInternalNote ? "Internal Admin Note" : req.admin?.name || "Senior Support Officer",
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      attachments: processedAttachments,
    };

    ticket.messages.push(newMessage);
    if (!isInternalNote && ticket.status === "Open") {
      ticket.status = "In Progress";
    }
    ticket.lastUpdated = "Just now";
    await ticket.save();

    res.status(200).json({
      success: true,
      message: isInternalNote ? "Internal note added." : "Reply dispatched to investor.",
      ticket,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Ticket Status / Priority
// @route   PUT /api/admin/support/tickets/:id/status
exports.updateTicketStatus = async (req, res) => {
  try {
    const { status, priority } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Support ticket not found." });
    }

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    ticket.lastUpdated = "Just now";
    await ticket.save();

    res.status(200).json({
      success: true,
      message: "Ticket updated successfully.",
      ticket,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Ticket (Cleans up attachments from Cloudinary)
// @route   DELETE /api/admin/support/tickets/:id
exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndDelete(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Support ticket not found." });
    }

    // Clean up all Cloudinary attachments in this ticket
    if (Array.isArray(ticket.messages)) {
      ticket.messages.forEach((msg) => {
        if (Array.isArray(msg.attachments)) {
          msg.attachments.forEach((att) => {
            const attUrl = typeof att === "string" ? att : att?.url;
            if (attUrl && attUrl.includes("cloudinary.com")) {
              deleteFromCloudinary(attUrl).catch((err) =>
                console.warn("[Cloudinary] Ticket attachment delete failed:", err.message)
              );
            }
          });
        }
      });
    }

    res.status(200).json({
      success: true,
      message: "Support ticket deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────── SUPPORT CHANNELS MANAGEMENT ────────

// @desc    Get All Support Channels
// @route   GET /api/admin/support/channels
exports.getChannels = async (req, res) => {
  try {
    const channels = await SupportChannel.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: channels.length, channels });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create Support Channel
// @route   POST /api/admin/support/channels
exports.createChannel = async (req, res) => {
  try {
    const { platform, title, handle, url, department, hours, category, status, stats } = req.body;

    if (!platform || !title || !url) {
      return res.status(400).json({
        success: false,
        message: "Platform, channel title, and destination URL are required.",
      });
    }

    const newChannel = await SupportChannel.create({
      platform,
      title,
      handle: handle || "",
      url,
      department: department || "24/7 VIP Escrow Support",
      hours: hours || "24/7 Live Coverage",
      category: category || "Instant Chat",
      status: status || "Active",
      stats: stats || "Avg. Reply < 2 mins",
      icon: platform.toLowerCase().replace(/[^a-z0-9]/g, ""),
    });

    res.status(201).json({
      success: true,
      message: "Support channel created successfully.",
      channel: newChannel,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Support Channel
// @route   PUT /api/admin/support/channels/:id
exports.updateChannel = async (req, res) => {
  try {
    const channel = await SupportChannel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ success: false, message: "Support channel not found." });
    }

    const updated = await SupportChannel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.status(200).json({
      success: true,
      message: "Support channel updated successfully.",
      channel: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Support Channel
// @route   DELETE /api/admin/support/channels/:id
exports.deleteChannel = async (req, res) => {
  try {
    const channel = await SupportChannel.findByIdAndDelete(req.params.id);
    if (!channel) {
      return res.status(404).json({ success: false, message: "Support channel not found." });
    }
    res.status(200).json({
      success: true,
      message: "Support channel deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
