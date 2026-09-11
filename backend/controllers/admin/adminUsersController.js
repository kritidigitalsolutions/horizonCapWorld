const User = require("../../models/User");
const Transaction = require("../../models/Transaction");
const UserInvestment = require("../../models/UserInvestment");
const SupportTicket = require("../../models/SupportTicket");
const Notification = require("../../models/Notification");

// @desc    Get All Users (Search, Status Filter, Pagination)
// @route   GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    let query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { customId: { $regex: search, $options: "i" } },
        { country: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const total = await User.countDocuments(query);
    const activeCount = await User.countDocuments({ status: "Active" });
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      total,
      activeCount,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      users,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Single User Details with Transactions
// @route   GET /api/admin/users/:id
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const recentTransactions = await Transaction.find({
      $or: [{ user: user._id }, { userCustomId: user.customId }],
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      user,
      recentTransactions,
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

// @desc    Adjust User Wallet Balance (Credit / Debit)
// @route   PUT /api/admin/users/:id/adjust-wallet
exports.adjustUserWallet = async (req, res) => {
  try {
    const { walletType, action, amount, reason } = req.body; // walletType: 'depositWallet' | 'earningWallet', action: 'credit' | 'debit'

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

    if (walletType === "depositWallet") {
      user.depositWallet = Math.max(0, (user.depositWallet || 0) + adjustment);
    } else if (walletType === "earningWallet") {
      user.earningWallet = Math.max(0, (user.earningWallet || 0) + adjustment);
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
      type: action === "credit" ? "Deposit" : "Withdrawal",
      amount: numAmount,
      gateway: "Admin Adjustment",
      referenceNo: reason || "Manual Admin Adjustment",
      status: "Approved",
    });

    res.status(200).json({
      success: true,
      message: `Successfully ${action}ed $${numAmount} to ${walletType}.`,
      user: {
        id: user._id,
        name: user.name,
        depositWallet: user.depositWallet,
        earningWallet: user.earningWallet,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
