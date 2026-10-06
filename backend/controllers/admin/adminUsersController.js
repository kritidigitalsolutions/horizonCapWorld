const User = require("../../models/User");
const Transaction = require("../../models/Transaction");
const UserInvestment = require("../../models/UserInvestment");
const SupportTicket = require("../../models/SupportTicket");
const Notification = require("../../models/Notification");
const bcrypt = require("bcrypt");

// @desc    Get All Users (Search, Status Filter, Pagination)
// @route   GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const { search, status, page, limit } = req.query;
    let query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (search && typeof search === "string" && search.trim()) {
      const trimmed = search.trim();
      const escaped = trimmed.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      const digitsOnly = trimmed.replace(/\D/g, "");

      const orConditions = [
        { name: { $regex: escaped, $options: "i" } },
        { userName: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
        { customId: { $regex: escaped, $options: "i" } },
        { phone: { $regex: escaped, $options: "i" } },
        { country: { $regex: escaped, $options: "i" } },
        { sponsorId: { $regex: escaped, $options: "i" } },
      ];

      // If search query contains digits, also match stripped digits against phone
      if (digitsOnly.length >= 3) {
        orConditions.push({ phone: { $regex: digitsOnly, $options: "i" } });
      }

      // If search query is a valid MongoDB ObjectId, allow matching _id directly
      const mongoose = require("mongoose");
      if (mongoose.Types.ObjectId.isValid(trimmed)) {
        orConditions.push({ _id: trimmed });
      }

      query.$or = orConditions;
    }

    const pageNum = parseInt(page, 10) || 1;
    // If limit is 'all', '0', 0, or not passed, default to no limit (0) to fetch all users for management table
    let limitNum = 0;
    if (limit && limit !== "all" && limit !== "0") {
      limitNum = parseInt(limit, 10) || 0;
    }

    let userQuery = User.find(query).select("-password").sort({ createdAt: -1 });
    if (limitNum > 0) {
      const skip = (pageNum - 1) * limitNum;
      userQuery = userQuery.skip(skip).limit(limitNum);
    }

    const [total, activeCount, unseenCount, users] = await Promise.all([
      User.countDocuments(query),
      User.countDocuments({ status: "Active" }),
      User.countDocuments({ isSeenByAdmin: false }),
      userQuery.lean(),
    ]);

    // Enhance users with active investment count
    const userIds = users.map((u) => u._id);
    const userEmails = users.map((u) => u.email).filter(Boolean);
    const activeInvestmentsList = await UserInvestment.find({
      $or: [
        { user: { $in: userIds } },
        { userEmail: { $in: userEmails } },
      ],
      status: "Active",
    }).select("user userEmail");

    const activeCountMap = {};
    activeInvestmentsList.forEach((inv) => {
      const uid = String(inv.user);
      activeCountMap[uid] = (activeCountMap[uid] || 0) + 1;
    });

    const enhancedUsers = users.map((u) => ({
      ...u,
      activeInvestments: activeCountMap[String(u._id)] || (u.totalInvested > 0 ? 1 : 0),
    }));

    res.status(200).json({
      success: true,
      total,
      activeCount,
      unseenCount,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      users: enhancedUsers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark All or Selected Users as Seen
// @route   PUT /api/admin/users/mark-seen
exports.markUsersSeen = async (req, res) => {
  try {
    const { userIds } = req.body;
    let query = { isSeenByAdmin: false };
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      query._id = { $in: userIds };
    }
    await User.updateMany(query, { $set: { isSeenByAdmin: true } });
    res.status(200).json({ success: true, message: "Users marked as seen." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Single User Details with Active Investment Plans & Transactions
// @route   GET /api/admin/users/:id
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Fetch active investment plans for this user
    const activeInvestments = await UserInvestment.find({
      $or: [
        { user: user._id },
        ...(user.email ? [{ userEmail: user.email }] : []),
      ],
    }).sort({ createdAt: -1 });

    const activePlans = activeInvestments.map((inv) => ({
      id: inv.customId || inv._id,
      _id: inv._id,
      name: inv.planName,
      category: inv.planCategory || "Renewable Energy",
      roi: `${inv.dailyRoi || 0.3}%/day (${inv.roi || 9.0}%/mo)`,
      payoutMode: inv.payoutInterval || "Per Second (Live)",
      invested: `$${Number(inv.amount || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      streamRate: `+$${Number(inv.perSecondRate || 0).toFixed(8)}/s`,
      duration: inv.duration || "12 Months",
      earned: `${Number(inv.totalProfitEarned || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      status: inv.status,
      startDate: inv.startDate,
    }));

    // Fetch Top 50 Latest transactions (FIFO / latest 50)
    const recentTransactions = await Transaction.find({
      $or: [
        { user: user._id },
        { userCustomId: user.customId },
        ...(user.email ? [{ userEmail: user.email }] : []),
      ],
    })
      .sort({ createdAt: -1 })
      .limit(50);

    const formattedTransactions = recentTransactions.map((tx) => ({
      id: tx.customId || tx._id,
      _id: tx._id,
      type: tx.type,
      amount: `$${Number(tx.amount || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      rawAmount: tx.amount,
      gateway: tx.gateway,
      cryptoNetwork: tx.cryptoNetwork,
      referenceNo: tx.referenceNo,
      date: tx.date || (tx.createdAt ? tx.createdAt.toISOString().split("T")[0] : ""),
      time: tx.time || "",
      status: tx.status,
    }));

    res.status(200).json({
      success: true,
      user,
      activePlans,
      recentTransactions: formattedTransactions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update User Status (Active, Inactive, Suspended)
// @route   PUT /api/admin/users/:id/status
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Active", "Inactive", "Suspended"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value." });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.status(200).json({
      success: true,
      message: `User status changed to ${status}.`,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Adjust User Wallet Balance (Credit / Debit / Disburse Rank Earnings)
// @route   PUT /api/admin/users/:id/adjust-wallet
exports.adjustUserWallet = async (req, res) => {
  try {
    const { walletType, action, amount, reason } = req.body;

    if (!walletType || !action || !amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Wallet type, action ('credit'|'debit'), and valid positive amount are required.",
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const numAmount = Number(amount);
    const adjustment = action === "credit" ? numAmount : -numAmount;

    let transactionType = action === "credit" ? "Deposit" : "Withdrawal";
    let incomeSource = "Main Earning Wallet";
    let friendlyName = walletType;

    if (walletType === "depositWallet") {
      user.depositWallet = Math.max(0, (user.depositWallet || 0) + adjustment);
      friendlyName = "Deposit Wallet";
    } else if (walletType === "earningWallet") {
      user.earningWallet = Math.max(0, (user.earningWallet || 0) + adjustment);
      if (action === "credit") {
        user.totalProfit = Math.max(0, (user.totalProfit || 0) + numAmount);
      }
      friendlyName = "Main Earning Wallet";
      incomeSource = "Main Earning Wallet";
    } else if (walletType === "rankReward" || walletType === "rankRewardBalance") {
      user.rankRewardBalance = Math.max(0, (user.rankRewardBalance || 0) + adjustment);
      user.earningWallet = Math.max(0, (user.earningWallet || 0) + adjustment);
      if (action === "credit") {
        user.totalProfit = Math.max(0, (user.totalProfit || 0) + numAmount);
        transactionType = "Rank Bonus";
      }
      friendlyName = "One Time Cash Reward ($)";
      incomeSource = "Rank Cash Reward";
    } else if (walletType === "companyProfit" || walletType === "companyProfitBalance") {
      user.companyProfitBalance = Math.max(0, (user.companyProfitBalance || 0) + adjustment);
      user.earningWallet = Math.max(0, (user.earningWallet || 0) + adjustment);
      if (action === "credit") {
        user.totalProfit = Math.max(0, (user.totalProfit || 0) + numAmount);
        transactionType = "Company Bonus";
      }
      friendlyName = "Company Profit %ge";
      incomeSource = "Company Profit %ge";
    } else if (walletType === "salary" || walletType === "salaryBalance") {
      user.salaryBalance = Math.max(0, (user.salaryBalance || 0) + adjustment);
      user.earningWallet = Math.max(0, (user.earningWallet || 0) + adjustment);
      if (action === "credit") {
        user.totalProfit = Math.max(0, (user.totalProfit || 0) + numAmount);
        transactionType = "Salary Income";
      }
      friendlyName = "Per Month Salary";
      incomeSource = "Salary";
    } else if (walletType === "pvRoi" || walletType === "pvRoiBalance") {
      user.pvRoiBalance = Math.max(0, (user.pvRoiBalance || 0) + adjustment);
      user.earningWallet = Math.max(0, (user.earningWallet || 0) + adjustment);
      if (action === "credit") {
        user.totalProfit = Math.max(0, (user.totalProfit || 0) + numAmount);
        transactionType = "ROI Return";
      }
      friendlyName = "PV ROI";
      incomeSource = "PV ROI";
    } else if (walletType === "levelIncome" || walletType === "levelIncomeBalance") {
      user.levelIncomeBalance = Math.max(0, (user.levelIncomeBalance || 0) + adjustment);
      user.earningWallet = Math.max(0, (user.earningWallet || 0) + adjustment);
      if (action === "credit") {
        user.totalProfit = Math.max(0, (user.totalProfit || 0) + numAmount);
        transactionType = "Referral Bonus";
      }
      friendlyName = "Level Income";
      incomeSource = "Level Income";
    } else {
      return res.status(400).json({
        success: false,
        message: `Unknown wallet type: ${walletType}`,
      });
    }

    await user.save();

    // Log transaction
    await Transaction.create({
      customId: `TXN-ADJ-${Date.now().toString().slice(-6)}`,
      user: user._id,
      userName: user.name,
      userCustomId: user.customId,
      userEmail: user.email,
      country: user.country,
      type: transactionType,
      incomeSource,
      amount: numAmount,
      rawAmount: numAmount,
      fee: 0,
      netAmount: numAmount,
      gateway: "Admin Disbursal",
      referenceNo: reason || `Manual Admin ${action === "credit" ? "Disbursal" : "Adjustment"}`,
      status: "Approved",
      note: `${action === "credit" ? "Disbursed" : "Debited"} $${numAmount} to ${friendlyName}. ${reason || ""}`.trim(),
    });

    res.status(200).json({
      success: true,
      message: `Successfully ${action}ed $${numAmount} to ${friendlyName}.`,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        depositWallet: user.depositWallet,
        earningWallet: user.earningWallet,
        pvRoiBalance: user.pvRoiBalance || 0,
        levelIncomeBalance: user.levelIncomeBalance || 0,
        rankRewardBalance: user.rankRewardBalance || 0,
        companyProfitBalance: user.companyProfitBalance || 0,
        salaryBalance: user.salaryBalance || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Batch Adjust Multiple User Wallets (Disburse to multiple eligible users in one click)
// @route   POST /api/admin/users/batch-adjust-wallet
exports.batchAdjustWallets = async (req, res) => {
  try {
    const { adjustments, userIds, walletType, action = "credit", amount, reason } = req.body;

    let itemsToProcess = [];

    if (Array.isArray(adjustments) && adjustments.length > 0) {
      itemsToProcess = adjustments;
    } else if (Array.isArray(userIds) && userIds.length > 0 && walletType && Number(amount) > 0) {
      itemsToProcess = userIds.map((uid) => ({
        userId: uid,
        walletType,
        action: action || "credit",
        amount: Number(amount),
        reason,
      }));
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid payload. Provide 'adjustments' array or 'userIds' array with valid walletType and amount.",
      });
    }

    const results = [];
    let totalDisbursed = 0;
    let successfulCount = 0;

    for (const item of itemsToProcess) {
      const { userId, walletType: itemWalletType, action: itemAction = "credit", amount: itemAmount, reason: itemReason } = item;
      const numAmount = Number(itemAmount);

      if (!userId || !itemWalletType || numAmount <= 0) {
        results.push({ userId, success: false, message: "Missing required fields or invalid amount." });
        continue;
      }

      try {
        const user = await User.findById(userId);
        if (!user) {
          results.push({ userId, success: false, message: "User not found." });
          continue;
        }

        const adjustment = itemAction === "credit" ? numAmount : -numAmount;
        let transactionType = itemAction === "credit" ? "Deposit" : "Withdrawal";
        let incomeSource = "Main Earning Wallet";
        let friendlyName = itemWalletType;

        if (itemWalletType === "depositWallet") {
          user.depositWallet = Math.max(0, (user.depositWallet || 0) + adjustment);
          friendlyName = "Deposit Wallet";
        } else if (itemWalletType === "earningWallet") {
          user.earningWallet = Math.max(0, (user.earningWallet || 0) + adjustment);
          if (itemAction === "credit") user.totalProfit = Math.max(0, (user.totalProfit || 0) + numAmount);
          friendlyName = "Main Earning Wallet";
          incomeSource = "Main Earning Wallet";
        } else if (itemWalletType === "rankReward" || itemWalletType === "rankRewardBalance") {
          user.rankRewardBalance = Math.max(0, (user.rankRewardBalance || 0) + adjustment);
          user.earningWallet = Math.max(0, (user.earningWallet || 0) + adjustment);
          if (itemAction === "credit") {
            user.totalProfit = Math.max(0, (user.totalProfit || 0) + numAmount);
            transactionType = "Rank Bonus";
          }
          friendlyName = "One Time Cash Reward ($)";
          incomeSource = "Rank Cash Reward";
        } else if (itemWalletType === "companyProfit" || itemWalletType === "companyProfitBalance") {
          user.companyProfitBalance = Math.max(0, (user.companyProfitBalance || 0) + adjustment);
          user.earningWallet = Math.max(0, (user.earningWallet || 0) + adjustment);
          if (itemAction === "credit") {
            user.totalProfit = Math.max(0, (user.totalProfit || 0) + numAmount);
            transactionType = "Company Bonus";
          }
          friendlyName = "Company Profit %ge";
          incomeSource = "Company Profit %ge";
        } else if (itemWalletType === "salary" || itemWalletType === "salaryBalance") {
          user.salaryBalance = Math.max(0, (user.salaryBalance || 0) + adjustment);
          user.earningWallet = Math.max(0, (user.earningWallet || 0) + adjustment);
          if (itemAction === "credit") {
            user.totalProfit = Math.max(0, (user.totalProfit || 0) + numAmount);
            transactionType = "Salary Income";
          }
          friendlyName = "Per Month Salary";
          incomeSource = "Salary";
        } else {
          results.push({ userId, success: false, message: `Unsupported wallet type: ${itemWalletType}` });
          continue;
        }

        await user.save();

        await Transaction.create({
          customId: `TXN-BULK-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`,
          user: user._id,
          userName: user.name,
          userCustomId: user.customId,
          userEmail: user.email,
          country: user.country,
          type: transactionType,
          incomeSource,
          amount: numAmount,
          rawAmount: numAmount,
          fee: 0,
          netAmount: numAmount,
          gateway: "Admin Disbursal",
          referenceNo: itemReason || `Bulk Admin Disbursal (${friendlyName})`,
          status: "Approved",
          note: `${itemAction === "credit" ? "Disbursed" : "Debited"} $${numAmount} to ${friendlyName}. ${itemReason || ""}`.trim(),
        });

        successfulCount += 1;
        totalDisbursed += numAmount;
        results.push({
          userId: user._id,
          userName: user.name,
          customId: user.customId,
          success: true,
          amount: numAmount,
          walletType: itemWalletType,
          newEarningWallet: user.earningWallet,
        });
      } catch (err) {
        results.push({ userId, success: false, message: err.message });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Batch disbursal completed: ${successfulCount} of ${itemsToProcess.length} processed. Total $${totalDisbursed.toLocaleString()} disbursed.`,
      processedCount: successfulCount,
      totalCount: itemsToProcess.length,
      totalDisbursed,
      results,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete User and Cascade Delete All Associated Data
// @route   DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const userId = user._id;
    const userEmail = user.email;
    const userCustomId = user.customId;

    // 1. Delete all User Investments
    await UserInvestment.deleteMany({
      $or: [
        { user: userId },
        ...(userEmail ? [{ userEmail }] : []),
      ],
    });

    // 2. Delete all Transactions (Deposits, Withdrawals, ROI payouts, Referral Bonuses, etc.)
    await Transaction.deleteMany({
      $or: [
        { user: userId },
        ...(userCustomId ? [{ userCustomId }] : []),
        ...(userEmail ? [{ userEmail }] : []),
      ],
    });

    // 3. Delete all Support Tickets and messages created by the user
    await SupportTicket.deleteMany({
      $or: [
        { user: userId },
        ...(userEmail ? [{ userEmail }] : []),
      ],
    });

    // 4. Delete user-specific Notifications & remove user from broadcast read lists
    await Notification.deleteMany({ userId: userId });
    await Notification.updateMany(
      { readBy: userId },
      { $pull: { readBy: userId } }
    );

    // 5. Clean up referral downlines (reassign downlines to user's upline sponsor or "HORIZON-HQ")
    const fallbackSponsor = user.sponsorId && user.sponsorId !== user.customId ? user.sponsorId : "HORIZON-HQ";
    const sponsorIdentifiers = [userCustomId, String(userId)].filter(Boolean);
    if (sponsorIdentifiers.length > 0) {
      await User.updateMany(
        { sponsorId: { $in: sponsorIdentifiers } },
        { $set: { sponsorId: fallbackSponsor } }
      );
    }

    // 6. Update upline sponsor direct referrals count if applicable
    if (user.sponsorId && user.sponsorId !== "HORIZON-HQ") {
      const sponsor = await User.findOne({
        $or: [
          { customId: user.sponsorId },
          ...(/^[0-9a-fA-F]{24}$/.test(user.sponsorId) ? [{ _id: user.sponsorId }] : []),
        ],
      });
      if (sponsor && typeof sponsor.directReferrals === "number" && sponsor.directReferrals > 0) {
        sponsor.directReferrals = Math.max(0, sponsor.directReferrals - 1);
        await sponsor.save();
      }
    }

    // 7. Finally delete the user document
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: "User and all associated data deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Shift / Reassign User Sponsor (Internal hierarchy adjustment without client notification)
// @route   PUT /api/admin/users/:id/shift-sponsor
exports.shiftUserSponsor = async (req, res) => {
  try {
    const { newSponsorId } = req.body;
    if (!newSponsorId || typeof newSponsorId !== "string") {
      return res.status(400).json({ success: false, message: "Valid new sponsor ID is required." });
    }

    const cleanNewSponsor = newSponsorId.trim();
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Cannot shift under self
    if (user.customId === cleanNewSponsor || String(user._id) === cleanNewSponsor) {
      return res.status(400).json({ success: false, message: "A user cannot be assigned as their own sponsor." });
    }

    let targetSponsorCustomId = "HORIZON-HQ";
    let targetSponsorUser = null;

    if (cleanNewSponsor !== "HORIZON-HQ") {
      targetSponsorUser = await User.findOne({
        $or: [
          { customId: cleanNewSponsor },
          ...(/^[0-9a-fA-F]{24}$/.test(cleanNewSponsor) ? [{ _id: cleanNewSponsor }] : []),
        ],
      });

      if (!targetSponsorUser) {
        return res.status(404).json({ success: false, message: `Target sponsor "${cleanNewSponsor}" not found.` });
      }

      targetSponsorCustomId = targetSponsorUser.customId;

      // Prevent circular hierarchy: Check if targetSponsorUser is currently in user's downline!
      const allUsers = await User.find({}).select("customId sponsorId");
      const childrenMap = new Map();
      allUsers.forEach((u) => {
        if (u.sponsorId) {
          if (!childrenMap.has(u.sponsorId)) childrenMap.set(u.sponsorId, []);
          childrenMap.get(u.sponsorId).push(u.customId);
        }
      });

      // BFS to check if targetSponsorCustomId is downstream of user.customId
      const queue = [user.customId];
      const visited = new Set([user.customId]);
      let isCircular = false;

      while (queue.length > 0) {
        const curr = queue.shift();
        if (curr === targetSponsorCustomId) {
          isCircular = true;
          break;
        }
        const children = childrenMap.get(curr) || [];
        for (const ch of children) {
          if (!visited.has(ch)) {
            visited.add(ch);
            queue.push(ch);
          }
        }
      }

      if (isCircular) {
        return res.status(400).json({
          success: false,
          message: `Cannot shift user under ${targetSponsorCustomId} because ${targetSponsorCustomId} is already in this user's downline (circular hierarchy error).`,
        });
      }
    }

    const oldSponsorId = user.sponsorId;
    user.sponsorId = targetSponsorCustomId;
    await user.save();

    // Recalculate direct referral counts for sponsors
    if (oldSponsorId && oldSponsorId !== "HORIZON-HQ" && oldSponsorId !== targetSponsorCustomId) {
      const oldSponsor = await User.findOne({
        $or: [
          { customId: oldSponsorId },
          ...(/^[0-9a-fA-F]{24}$/.test(oldSponsorId) ? [{ _id: oldSponsorId }] : []),
        ],
      });
      if (oldSponsor) {
        const count = await User.countDocuments({ sponsorId: oldSponsor.customId });
        oldSponsor.directReferrals = count;
        await oldSponsor.save();
      }
    }

    if (targetSponsorUser) {
      const count = await User.countDocuments({ sponsorId: targetSponsorUser.customId });
      targetSponsorUser.directReferrals = count;
      await targetSponsorUser.save();
    }

    res.status(200).json({
      success: true,
      message: `User ${user.name} (${user.customId}) successfully shifted under ${targetSponsorCustomId}.`,
      user: {
        id: user._id,
        customId: user.customId,
        name: user.name,
        sponsorId: user.sponsorId,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin Reset Client Password (Set new password or temporary credentials)
// @route   PUT /api/admin/users/:id/reset-password
exports.resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || typeof newPassword !== "string" || newPassword.trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long.",
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword.trim(), salt);
    await user.save();

    res.status(200).json({
      success: true,
      message: `Password for ${user.name} (${user.customId}) has been successfully updated.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin Toggle User 2FA Security
// @route   PUT /api/admin/users/:id/2fa
exports.toggleUser2FAByAdmin = async (req, res) => {
  try {
    const { is2FAEnabled } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    user.is2FAEnabled = typeof is2FAEnabled === "boolean" ? is2FAEnabled : !user.is2FAEnabled;
    await user.save();

    res.status(200).json({
      success: true,
      message: `2FA Security for ${user.name} (${user.customId}) is now ${user.is2FAEnabled ? "Enabled" : "Disabled"}.`,
      is2FAEnabled: user.is2FAEnabled,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin Update User Details (Email, Phone Number, Name, Country)
// @route   PUT /api/admin/users/:id
exports.updateUserDetails = async (req, res) => {
  try {
    const { name, email, phone, country } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // 1. Update Email
    if (email !== undefined && typeof email === "string" && email.trim()) {
      const cleanEmail = email.toLowerCase().trim();
      if (cleanEmail !== user.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
          return res.status(400).json({ success: false, message: "Please enter a valid email address." });
        }
        const existingEmail = await User.findOne({ email: cleanEmail, _id: { $ne: user._id } });
        if (existingEmail) {
          return res.status(400).json({
            success: false,
            message: "This email address is already assigned to another user account.",
          });
        }
        user.email = cleanEmail;
      }
    }

    // 2. Update Phone Number
    if (phone !== undefined) {
      const cleanPhone = (phone || "").trim().slice(0, 16);
      if (cleanPhone !== (user.phone || "")) {
        const phoneDigits = cleanPhone.replace(/[^\d]/g, "");
        if (phoneDigits && phoneDigits.length >= 7) {
          const last10 = phoneDigits.slice(-10);
          const existingPhone = await User.findOne({
            _id: { $ne: user._id },
            phone: { $regex: last10, $options: "i" },
          });
          if (existingPhone) {
            return res.status(400).json({
              success: false,
              message: "This mobile phone number is already registered with another user account.",
            });
          }
        }
        user.phone = cleanPhone;
      }
    }

    // 3. Update Name
    if (name && typeof name === "string" && name.trim()) {
      user.name = name.trim();
    }

    // 4. Update Country
    if (country && typeof country === "string" && country.trim()) {
      user.country = country.trim();
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.name} (${user.customId}) details updated successfully.`,
      user: {
        _id: user._id,
        id: user.customId || user._id,
        customId: user.customId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        country: user.country,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("[Admin updateUserDetails Error]:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

