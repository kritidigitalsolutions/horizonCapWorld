const Notification = require("../../models/Notification");
const User = require("../../models/User");
const {
  broadcastToAll,
  broadcastToRank,
  notifyUser,
} = require("../../utils/notificationService");

// @desc    Get all admin notifications with filters and unread count
// @route   GET /api/admin/notifications
exports.getAdminNotifications = async (req, res) => {
  try {
    const { category, priority, isRead, search, recipientType, page = 1, limit = 20 } = req.query;

    const query = {};

    if (recipientType && recipientType !== "ALL") {
      query.recipientType = recipientType.toUpperCase();
    }

    if (category && category !== "ALL") {
      query.category = category.toUpperCase();
    }
    if (priority && priority !== "ALL") {
      query.priority = priority.toUpperCase();
    }
    if (isRead !== undefined && isRead !== "ALL") {
      query.read = isRead === "true";
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      read: false,
    });

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Summary counts per category
    const categoriesCount = await Notification.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      total,
      unreadCount,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      categoriesCount: categoriesCount.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      notifications,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark single or all admin notifications as read
// @route   PUT /api/admin/notifications/:id/read OR /api/admin/notifications/mark-all-read
exports.markAdminNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === "all" || !id) {
      await Notification.updateMany({ read: false }, { $set: { read: true } });
      return res.status(200).json({ success: true, message: "All notifications marked as read." });
    }

    const notification = await Notification.findByIdAndUpdate(
      id,
      { $set: { read: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }

    res.status(200).json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete single admin notification
// @route   DELETE /api/admin/notifications/:id
exports.deleteAdminNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }
    res.status(200).json({ success: true, message: "Notification removed." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clear all admin notifications
// @route   DELETE /api/admin/notifications/clear-all
exports.clearAllAdminNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({});
    res.status(200).json({ success: true, message: "All notifications cleared from history." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin Push Notification Creator (Broadcast to All, Specific User, or Rank)
// @route   POST /api/admin/notifications/push
exports.sendPushNotification = async (req, res) => {
  try {
    const {
      targetType = "ALL", // 'ALL' | 'USER' | 'RANK'
      targetValue = "",
      title,
      message,
      category = "BROADCAST",
      priority = "NORMAL",
      actionUrl = "",
      sendEmail = false,
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message content are required for push notification.",
      });
    }

    let createdNotification = null;

    if (targetType === "ALL") {
      createdNotification = await broadcastToAll({
        title,
        message,
        category,
        type: "push_notification",
        priority,
        actionUrl,
        metadata: { pushedBy: req.admin?.email || "Admin" },
        sendEmail,
      });
    } else if (targetType === "RANK") {
      if (!targetValue) {
        return res.status(400).json({ success: false, message: "Please specify target rank name." });
      }
      createdNotification = await broadcastToRank({
        targetRank: targetValue,
        title,
        message,
        category,
        type: "rank_push_notification",
        priority,
        actionUrl,
        metadata: { pushedBy: req.admin?.email || "Admin" },
        sendEmail,
      });
    } else if (targetType === "USER") {
      if (!targetValue) {
        return res.status(400).json({
          success: false,
          message: "Please specify target user email, username, or ID.",
        });
      }

      // Search user
      let user = null;
      if (targetValue.match(/^[0-9a-fA-F]{24}$/)) {
        user = await User.findById(targetValue);
      }
      if (!user) {
        user = await User.findOne({
          $or: [
            { email: targetValue.toLowerCase().trim() },
            { customId: targetValue.trim() },
            { name: targetValue.trim() },
          ],
        });
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: `Investor not found matching identifier: ${targetValue}`,
        });
      }

      createdNotification = await notifyUser({
        userId: user._id,
        title,
        message,
        category,
        type: "direct_push_notification",
        priority,
        actionUrl,
        metadata: { pushedBy: req.admin?.email || "Admin" },
        sendEmail,
      });
    } else {
      return res.status(400).json({ success: false, message: "Invalid target type specified." });
    }

    res.status(201).json({
      success: true,
      message: `Push notification dispatched successfully to ${targetType === "ALL" ? "All Investors" : targetValue}.`,
      notification: createdNotification,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
