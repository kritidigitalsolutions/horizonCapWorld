const SupportTicket = require("../../models/SupportTicket");
const SupportChannel = require("../../models/SupportChannel");
const User = require("../../models/User");
const UserInvestment = require("../../models/UserInvestment");
const Transaction = require("../../models/Transaction");
const { notifyUser } = require("../../utils/notificationService");
const { sendTicketEmail } = require("../../utils/emailService");

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
    const limitNum = parseInt(limit, 10) || 500;
    const skip = (pageNum - 1) * limitNum;

    const total = await SupportTicket.countDocuments(query);
    const tickets = await SupportTicket.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalAll = await SupportTicket.countDocuments();
    const openCount = await SupportTicket.countDocuments({ status: "Open" });
    const inProgressCount = await SupportTicket.countDocuments({ status: "In Progress" });
    const resolvedCount = await SupportTicket.countDocuments({ status: { $in: ["Resolved", "Closed"] } });
    const resolutionRate = totalAll > 0 ? Number(((resolvedCount / totalAll) * 100).toFixed(1)) : 100;

    // Calculate real dynamic first response time from replied tickets
    const ticketsWithReplies = await SupportTicket.find({
      "messages.sender": { $in: ["admin", "support"] },
    }).select("createdAt messages").limit(50);

    let avgResponseTimeMinutes = 12;
    if (ticketsWithReplies.length > 0) {
      let totalMinutes = 0;
      let countWithReplies = 0;
      for (const t of ticketsWithReplies) {
        const adminMsg = t.messages.find((m) => m.sender === "admin" || m.sender === "support");
        if (adminMsg && adminMsg.createdAt && t.createdAt) {
          const diffMs = new Date(adminMsg.createdAt) - new Date(t.createdAt);
          if (diffMs > 0) {
            totalMinutes += diffMs / (1000 * 60);
            countWithReplies++;
          }
        }
      }
      if (countWithReplies > 0) {
        avgResponseTimeMinutes = Math.max(1, Math.round(totalMinutes / countWithReplies));
      }
    } else if (totalAll === 0) {
      avgResponseTimeMinutes = 0;
    }

    // Dynamic weekly trend
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const ticketsLast7Days = await SupportTicket.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const ticketsPrev7Days = await SupportTicket.countDocuments({ createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } });
    let ticketTrend = "0%";
    if (ticketsPrev7Days > 0) {
      const diff = (((ticketsLast7Days - ticketsPrev7Days) / ticketsPrev7Days) * 100).toFixed(1);
      ticketTrend = `${diff >= 0 ? "+" : ""}${diff}%`;
    } else if (ticketsLast7Days > 0) {
      ticketTrend = `+${ticketsLast7Days} this week`;
    }

    res.status(200).json({
      success: true,
      total,
      openCount,
      inProgressCount,
      resolvedCount,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      tickets,
      stats: {
        total: totalAll,
        open: openCount,
        inProgress: inProgressCount,
        pending: openCount + inProgressCount,
        resolved: resolvedCount,
        resolutionRate,
        avgResponseTimeMinutes,
        trend: ticketTrend,
      },
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

    // Automated notification to user (if not internal note)
    if (!isInternalNote && ticket.user) {
      await notifyUser({
        userId: ticket.user,
        title: `Support Reply on Ticket #${ticket.customId || ticket._id}`,
        message: `Support officer replied: "${text.trim().substring(0, 100)}${text.trim().length > 100 ? "..." : ""}"`,
        category: "SUPPORT",
        type: "ticket_reply",
        priority: "NORMAL",
        actionUrl: "/support",
        metadata: { ticketId: ticket.customId, subject: ticket.subject },
        settingKey: "autoTicketReplies",
      });

      const recipientEmail = ticket.userEmail || (await User.findById(ticket.user))?.email;
      if (recipientEmail) {
        sendTicketEmail({
          to: recipientEmail,
          name: ticket.userName || "Investor",
          ticketId: ticket.ticketId || ticket.customId || ticket._id,
          subject: ticket.subject,
          category: ticket.category,
          message: ticket.messages[0]?.text || "",
          status: ticket.status,
          isReply: true,
          replyText: text.trim(),
        }).catch((err) => console.warn("[Support Reply Email Warning]:", err.message));
      }
    }

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

    // Automated notification on resolution / status update
    if (ticket.user && status) {
      await notifyUser({
        userId: ticket.user,
        title: `Ticket #${ticket.customId} Status: ${status}`,
        message: `Your support ticket regarding "${ticket.subject}" has been marked as ${status}.`,
        category: "SUPPORT",
        type: "ticket_status",
        priority: status === "Resolved" ? "NORMAL" : "HIGH",
        actionUrl: "/support",
        metadata: { ticketId: ticket.customId, status },
        settingKey: "autoTicketStatusChange",
      });
    }

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

// @desc    Admin Create Support Ticket on Behalf of User
// @route   POST /api/admin/support/tickets
exports.createTicket = async (req, res) => {
  try {
    const { userId, subject, category, priority, message, attachments } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Subject and message description are required.",
      });
    }

    const User = require("../../models/User");
    let targetUser = null;
    if (userId) {
      targetUser = await User.findOne({
        $or: [
          { _id: /^[0-9a-fA-F]{24}$/.test(userId) ? userId : null },
          { customId: userId },
          { email: userId },
        ].filter(Boolean),
      });
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const randomNum = Math.floor(1000 + Math.random() * 9000);

    const newTicket = await SupportTicket.create({
      ticketId: `TCK-${randomNum}`,
      user: targetUser?._id || null,
      userName: targetUser?.name || "Investor",
      customId: targetUser?.customId || "HORIZON-USR-01",
      userEmail: targetUser?.email || "",
      subject: subject.trim(),
      category: category || "General Support",
      priority: priority || "Medium",
      status: "Open",
      messages: [
        {
          sender: "admin",
          senderName: "Helpdesk Admin",
          text: message.trim(),
          attachments: Array.isArray(attachments) ? attachments : [],
          time: timeStr,
          createdAt: now,
        },
      ],
      lastUpdated: "Just now",
    });

    if (targetUser) {
      try {
        await notifyUser({
          userId: targetUser._id,
          title: "New Support Ticket Created",
          message: `Admin opened support ticket #${newTicket.ticketId}: "${subject}"`,
          type: "Support",
          referenceId: newTicket._id,
        });
      } catch (err) {
        console.warn("Failed to notify user on admin ticket creation:", err.message);
      }
    }

    res.status(201).json({
      success: true,
      message: `Support ticket #${newTicket.ticketId} created successfully.`,
      ticket: newTicket,
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
    const User = require("../../models/User");
    const totalUsers = await User.countDocuments();
    const activeChannelsCount = channels.filter(c => c.status === "Active").length;
    const instantChatCount = channels.filter(c => 
      c.category === "Instant Chat" || 
      c.category === "Telegram" || 
      (c.hours && c.hours.includes("24/7"))
    ).length;
    const distinctPlatforms = new Set(channels.map(c => c.platform)).size;

    res.status(200).json({ 
      success: true, 
      count: channels.length, 
      channels,
      stats: {
        totalChannels: channels.length,
        activeChannels: activeChannelsCount,
        liveChatCoverage: instantChatCount,
        distinctPlatforms,
        totalCommunityMembers: totalUsers,
      }
    });
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

// @desc    Approve and Release Expired 3X ROI from Admin Escrow to User Earning Wallet
// @route   PUT /api/admin/support/tickets/:id/release-roi
exports.releaseExpiredRoi = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Support ticket not found." });
    }

    if (ticket.roiReleaseProcessed) {
      return res.status(400).json({
        success: false,
        message: "This expired ROI release has already been processed and credited.",
      });
    }

    const user = await User.findById(ticket.user);
    if (!user) {
      return res.status(404).json({ success: false, message: "Investor account not found." });
    }

    const releaseAmount = Number(ticket.claimedAmount) || Number(req.body.amount) || Number(user.lockedRoiBalance) || 0;
    if (releaseAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or zero release amount for expired ROI.",
      });
    }

    if ((user.lockedRoiBalance || 0) < releaseAmount) {
      return res.status(400).json({
        success: false,
        message: `Requested release amount ($${releaseAmount}) exceeds user escrow locked balance ($${user.lockedRoiBalance || 0} USD).`,
      });
    }

    // Deduct from lockedRoiBalance and credit back to earningWallet & pvRoiBalance
    user.lockedRoiBalance = Number(Math.max(0, (user.lockedRoiBalance || 0) - releaseAmount).toFixed(2));
    user.earningWallet = Number(((user.earningWallet || 0) + releaseAmount).toFixed(2));
    user.pvRoiBalance = Number(((user.pvRoiBalance || 0) + releaseAmount).toFixed(2));
    await user.save();

    // Update investment status if linked
    if (ticket.claimedInvestment) {
      await UserInvestment.findByIdAndUpdate(ticket.claimedInvestment, {
        roiClaimStatus: "Released",
      });
    }

    // Mark ticket as resolved & release processed
    ticket.roiReleaseProcessed = true;
    ticket.status = "Resolved";
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    ticket.messages.push({
      sender: "admin",
      senderName: "Administrative Financial Desk",
      text: `Administrative Approval: Your expired 3X ROI claim of $${releaseAmount.toLocaleString()} USD has been approved and successfully credited back to your Earning Wallet (PV ROI). You may now withdraw or re-invest these funds.`,
      time: timeStr,
      createdAt: now,
    });
    ticket.lastUpdated = "Just now";
    await ticket.save();

    // Create audit transaction record
    await Transaction.create({
      user: user._id,
      userName: user.name,
      userCustomId: user.customId || "HORIZON-USR-01",
      userEmail: user.email,
      country: user.country,
      type: "ROI Return",
      amount: releaseAmount,
      rawAmount: releaseAmount,
      fee: 0,
      netAmount: releaseAmount,
      gateway: "Administrative Escrow Release",
      incomeSource: "PV ROI",
      referenceNo: ticket.ticketId,
      status: "Approved",
      note: `3X Expired ROI of $${releaseAmount} released from Admin Escrow back to Earning Wallet via Ticket #${ticket.ticketId}.`,
    });

    // Notify user
    await notifyUser({
      userId: user._id,
      title: `3X Expired ROI Released ($${releaseAmount.toLocaleString()} USD)`,
      message: `Your expired 3X ROI claim has been approved by Admin and $${releaseAmount.toLocaleString()} USD is now available in your Earning Wallet.`,
      category: "FINANCIAL",
      type: "roi_released",
      priority: "HIGH",
      actionUrl: "/withdraw",
      metadata: { ticketId: ticket.ticketId, amount: releaseAmount },
    });

    res.status(200).json({
      success: true,
      message: `Successfully released $${releaseAmount.toLocaleString()} USD expired ROI to ${user.name}'s Earning Wallet.`,
      ticket,
      user: {
        _id: user._id,
        earningWallet: user.earningWallet,
        pvRoiBalance: user.pvRoiBalance,
        lockedRoiBalance: user.lockedRoiBalance,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
