const Notification = require("../../models/Notification");
const User = require("../../models/User");

// Helper to get user's active rank name
const getUserRankName = async (userId) => {
  try {
    const user = await User.findById(userId).populate("rank");
    return user?.rank?.name || "Bronze";
  } catch {
    return "Bronze";
  }
};

// @desc    Get all notifications applicable to the authenticated user
// @route   GET /api/user/notifications
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRank = await getUserRankName(userId);
    const { category, isRead, page = 1, limit = 20 } = req.query;

    // Match conditions for user:
    // 1. Direct user alerts
    // 2. All-users broadcasts
    // 3. Rank broadcasts matching user's rank
    const matchCriteria = {
      $or: [
        { recipientType: "USER", userId: userId },
        { recipientType: "ALL_USERS" },
        { recipientType: "RANK", targetRank: { $regex: new RegExp(`^${userRank}$`, "i") } },
      ],
    };

    if (category && category !== "ALL") {
      matchCriteria.category = category.toUpperCase();
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Fetch notifications
    const allMatching = await Notification.find(matchCriteria).sort({ createdAt: -1 });

    // Compute virtual 'read' flag per notification for this user
    const formatted = allMatching.map((doc) => {
      const isItemRead =
        doc.recipientType === "USER"
          ? Boolean(doc.read)
          : Array.isArray(doc.readBy) && doc.readBy.some((id) => id.toString() === userId.toString());

      return {
        _id: doc._id,
        title: doc.title,
        message: doc.message,
        category: doc.category,
        type: doc.type,
        priority: doc.priority,
        actionUrl: doc.actionUrl,
        metadata: doc.metadata,
        isBroadcast: doc.isBroadcast,
        read: isItemRead,
        createdAt: doc.createdAt,
      };
    });

    // Filter by read status if query param provided
    let filteredList = formatted;
    if (isRead !== undefined && isRead !== "ALL") {
      const readBool = isRead === "true";
      filteredList = formatted.filter((item) => item.read === readBool);
    }

    const unreadCount = formatted.filter((item) => !item.read).length;
    const total = filteredList.length;
    const paginatedNotifications = filteredList.slice(skip, skip + limitNum);

    // Category breakdown counts
    const categoryCounts = formatted.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      total,
      unreadCount,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      categoryCounts,
      notifications: paginatedNotifications,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get unread notification count for header badge
// @route   GET /api/user/notifications/unread-count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRank = await getUserRankName(userId);

    const notifications = await Notification.find({
      $or: [
        { recipientType: "USER", userId: userId },
        { recipientType: "ALL_USERS" },
        { recipientType: "RANK", targetRank: { $regex: new RegExp(`^${userRank}$`, "i") } },
      ],
    }).select("recipientType read readBy");

    const unreadCount = notifications.filter((doc) => {
      if (doc.recipientType === "USER") return !doc.read;
      return !doc.readBy || !doc.readBy.some((id) => id.toString() === userId.toString());
    }).length;

    res.status(200).json({ success: true, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark single notification as read
// @route   PUT /api/user/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }

    if (notification.recipientType === "USER") {
      if (notification.userId.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized access." });
      }
      notification.read = true;
      await notification.save();
    } else {
      // Broadcast - push userId to readBy if not already present
      if (!notification.readBy.some((id) => id.toString() === userId.toString())) {
        notification.readBy.push(userId);
        await notification.save();
      }
    }

    res.status(200).json({ success: true, message: "Notification marked as read." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark all applicable notifications as read
// @route   PUT /api/user/notifications/mark-all-read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRank = await getUserRankName(userId);

    // 1. Mark personal notifications
    await Notification.updateMany(
      { recipientType: "USER", userId: userId, read: false },
      { $set: { read: true } }
    );

    // 2. Add userId to readBy for all matching broadcasts
    await Notification.updateMany(
      {
        $or: [
          { recipientType: "ALL_USERS" },
          { recipientType: "RANK", targetRank: { $regex: new RegExp(`^${userRank}$`, "i") } },
        ],
        readBy: { $ne: userId },
      },
      { $addToSet: { readBy: userId } }
    );

    res.status(200).json({ success: true, message: "All notifications marked as read." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete / dismiss single notification
// @route   DELETE /api/user/notifications/:id
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }

    if (notification.recipientType === "USER") {
      if (notification.userId.toString() !== userId.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized access." });
      }
      await Notification.findByIdAndDelete(req.params.id);
    } else {
      // For broadcasts, mark as read so it won't trigger unread counts
      if (!notification.readBy.some((id) => id.toString() === userId.toString())) {
        notification.readBy.push(userId);
        await notification.save();
      }
    }

    res.status(200).json({ success: true, message: "Notification removed." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clear all user notifications
// @route   DELETE /api/user/notifications/clear-all
exports.clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRank = await getUserRankName(userId);

    // 1. Delete personal notifications
    await Notification.deleteMany({ recipientType: "USER", userId: userId });

    // 2. Mark all broadcasts as read
    await Notification.updateMany(
      {
        $or: [
          { recipientType: "ALL_USERS" },
          { recipientType: "RANK", targetRank: { $regex: new RegExp(`^${userRank}$`, "i") } },
        ],
      },
      { $addToSet: { readBy: userId } }
    );

    res.status(200).json({ success: true, message: "All notifications cleared." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
