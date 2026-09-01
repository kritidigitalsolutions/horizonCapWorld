const Notification = require("../models/Notification");
const AdminSettings = require("../models/AdminSettings");
const User = require("../models/User");
const { sendOtpEmail } = require("./emailService");

/**
 * Fetch current admin automated alert settings
 */
const getAlertSettings = async () => {
  try {
    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = await AdminSettings.create({});
    }
    return settings.automatedAlerts || {};
  } catch (err) {
    console.error("[Notification Service] Error fetching alert settings:", err.message);
    return {};
  }
};

/**
 * Notify a specific user with automated setting check
 */
const notifyUser = async ({
  userId,
  title,
  message,
  category = "SYSTEM",
  type = "general",
  priority = "NORMAL",
  actionUrl = "",
  metadata = {},
  settingKey = null,
  sendEmail = false,
}) => {
  try {
    if (!userId || !title || !message) return null;

    // Check admin automation toggle if settingKey provided
    if (settingKey) {
      const alerts = await getAlertSettings();
      if (alerts[settingKey] === false) {
        // Admin disabled this specific automated notification
        return null;
      }
    }

    const notification = await Notification.create({
      recipientType: "USER",
      userId,
      title,
      message,
      category,
      type,
      priority,
      actionUrl,
      metadata,
      read: false,
      isBroadcast: false,
    });

    // Optionally send transactional email alert
    if (sendEmail) {
      try {
        const user = await User.findById(userId).select("email name");
        if (user && user.email) {
          await sendOtpEmail({
            to: user.email,
            name: user.name,
            otp: metadata.otp || "ALERT",
            purpose: title,
          }).catch(() => {});
        }
      } catch (emailErr) {
        console.warn("[Notification Service] Email dispatch warning:", emailErr.message);
      }
    }

    return notification;
  } catch (error) {
    console.error("[Notification Service] notifyUser error:", error.message);
    return null;
  }
};

/**
 * Notify Admin with activity alert
 */
const notifyAdmin = async ({
  title,
  message,
  category = "SYSTEM",
  type = "admin_alert",
  priority = "NORMAL",
  actionUrl = "",
  metadata = {},
  settingKey = null,
}) => {
  try {
    if (!title || !message) return null;

    if (settingKey) {
      const alerts = await getAlertSettings();
      if (alerts[settingKey] === false) {
        return null;
      }
    }

    const notification = await Notification.create({
      recipientType: "ADMIN",
      title,
      message,
      category,
      type,
      priority,
      actionUrl,
      metadata,
      read: false,
      isBroadcast: false,
    });

    return notification;
  } catch (error) {
    console.error("[Notification Service] notifyAdmin error:", error.message);
    return null;
  }
};

/**
 * Broadcast notification to all users (Push Notification / News)
 */
const broadcastToAll = async ({
  title,
  message,
  category = "BROADCAST",
  type = "push_notification",
  priority = "NORMAL",
  actionUrl = "",
  metadata = {},
  sendEmail = false,
}) => {
  try {
    if (!title || !message) return null;

    const notification = await Notification.create({
      recipientType: "ALL_USERS",
      title,
      message,
      category,
      type,
      priority,
      actionUrl,
      metadata,
      read: false,
      readBy: [],
      isBroadcast: true,
    });

    // Optional email blast to active users
    if (sendEmail) {
      try {
        const users = await User.find({ status: "Active" }).select("email name").limit(500);
        // Dispatch in background without blocking
        (async () => {
          for (const u of users) {
            if (u.email) {
              await sendOtpEmail({
                to: u.email,
                name: u.name,
                otp: "NOTICE",
                purpose: title,
              }).catch(() => {});
            }
          }
        })();
      } catch (err) {
        console.warn("[Notification Service] Broadcast email batch warning:", err.message);
      }
    }

    return notification;
  } catch (error) {
    console.error("[Notification Service] broadcastToAll error:", error.message);
    return null;
  }
};

/**
 * Broadcast notification to specific Rank
 */
const broadcastToRank = async ({
  targetRank,
  title,
  message,
  category = "RANK",
  type = "rank_broadcast",
  priority = "NORMAL",
  actionUrl = "",
  metadata = {},
}) => {
  try {
    if (!targetRank || !title || !message) return null;

    const notification = await Notification.create({
      recipientType: "RANK",
      targetRank,
      title,
      message,
      category,
      type,
      priority,
      actionUrl,
      metadata,
      read: false,
      readBy: [],
      isBroadcast: true,
    });

    return notification;
  } catch (error) {
    console.error("[Notification Service] broadcastToRank error:", error.message);
    return null;
  }
};

module.exports = {
  getAlertSettings,
  notifyUser,
  notifyAdmin,
  broadcastToAll,
  broadcastToRank,
};
