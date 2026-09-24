const Transaction = require("../../models/Transaction");
const User = require("../../models/User");
const UserInvestment = require("../../models/UserInvestment");
const { notifyUser, notifyAdmin } = require("../../utils/notificationService");
const { sendDepositEmail, sendWithdrawalEmail } = require("../../utils/emailService");

// @desc    Get All Transactions with filters (Tab, Search, Date Range, Pagination)
// @route   GET /api/admin/transactions
exports.getTransactions = async (req, res) => {
  try {
    const { type, status, search, datePreset, startDate, endDate, page = 1, limit = 20 } = req.query;
    let query = {};

    if (type && type !== "all") query.type = type;
    if (status && status !== "all") query.status = status;

    // Search query
    if (search) {
      query.$or = [
        { customId: { $regex: search, $options: "i" } },
        { userName: { $regex: search, $options: "i" } },
        { userCustomId: { $regex: search, $options: "i" } },
        { gateway: { $regex: search, $options: "i" } },
        { referenceNo: { $regex: search, $options: "i" } },
        { country: { $regex: search, $options: "i" } },
      ];
    }

    // Date Filtering
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Run all count, find, and KPI aggregations concurrently in parallel
    const [
      total,
      unseenCount,
      transactions,
      totalDeposits,
      totalWithdrawals,
      totalRoi,
      totalReferral,
    ] = await Promise.all([
      Transaction.countDocuments(query),
      Transaction.countDocuments({ isSeenByAdmin: false }),
      Transaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Transaction.aggregate([
        { $match: { type: "Deposit", status: "Approved" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        { $match: { type: "Withdrawal", status: "Approved" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        { $match: { type: { $in: ["ROI Return", "ROI Earning"] } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        { $match: { type: { $in: ["Referral Bonus", "Rank Bonus"] } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      total,
      unseenCount,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      kpis: {
        totalDeposits: totalDeposits[0]?.total || 0,
        totalWithdrawals: totalWithdrawals[0]?.total || 0,
        totalRoi: totalRoi[0]?.total || 0,
        totalReferral: totalReferral[0]?.total || 0,
      },
      transactions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark All or Selected Transactions as Seen
// @route   PUT /api/admin/transactions/mark-seen
exports.markTransactionsSeen = async (req, res) => {
  try {
    const { transactionIds } = req.body;
    let query = { isSeenByAdmin: false };
    if (transactionIds && Array.isArray(transactionIds) && transactionIds.length > 0) {
      query._id = { $in: transactionIds };
    }
    await Transaction.updateMany(query, { $set: { isSeenByAdmin: true } });
    res.status(200).json({ success: true, message: "Transactions marked as seen." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Single Transaction by ID
// @route   GET /api/admin/transactions/:id
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate("user", "-password");
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found." });
    }
    res.status(200).json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve Transaction (Deposit credits deposit_wallet, Withdrawal settles)
// @route   PUT /api/admin/transactions/:id/approve
exports.approveTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found." });
    }

    if (transaction.status === "Approved") {
      return res.status(400).json({ success: false, message: "Transaction is already approved." });
    }

    transaction.status = "Approved";
    transaction.rejectReason = "";
    await transaction.save();

    // If Deposit, credit user depositWallet & trigger automated notification asynchronously
    if (transaction.type === "Deposit" && transaction.user) {
      const depositUser = await User.findByIdAndUpdate(
        transaction.user,
        { $inc: { depositWallet: transaction.amount } },
        { new: true }
      );
      notifyUser({
        userId: transaction.user,
        title: "Deposit Approved & Vault Credited",
        message: `Your deposit of $${Number(transaction.amount || 0).toLocaleString()} via ${transaction.gateway || "Vault"} has been verified and credited to your Deposit Wallet.`,
        category: "FINANCIAL",
        type: "deposit_approved",
        priority: "HIGH",
        actionUrl: "/transactions",
        metadata: { amount: transaction.amount, transactionId: transaction.customId },
        settingKey: "autoDepositApproval",
      }).catch((err) => console.warn("[Notification] Deposit approved notice warning:", err.message));

      if (depositUser) {
        sendDepositEmail({
          to: depositUser.email,
          name: depositUser.name,
          amount: transaction.amount,
          gateway: transaction.gateway || "Vault",
          transactionId: transaction.customId,
          status: "Approved",
        }).catch((err) => console.warn("[Deposit Approved Email Warning]:", err.message));
      }
    }

    // If Withdrawal, ensure 3X Cap blocking logic is checked & trigger automated notification asynchronously
    if (transaction.type === "Withdrawal" && transaction.user) {
      const user = await User.findById(transaction.user);
      if (user) {
        // Check if user has or had a 3X Cap plan
        const has3XCap = await UserInvestment.exists({
          user: user._id,
          $or: [
            { isLocked: true },
            { lockInPeriod: "3X Cap" },
            { lockInPeriod: { $regex: "3X", $options: "i" } },
          ],
        });

        if (has3XCap && user.totalInvested > 0 && user.totalWithdrawn >= user.totalInvested && user.status !== "Blocked") {
          user.status = "Blocked";
          user.dailyEarning = 0;
          user.perSecondRate = 0;
          await user.save();

          await UserInvestment.updateMany(
            { user: user._id, status: "Active" },
            { $set: { status: "Completed", dailyEarning: 0, perSecondRate: 0 } }
          );

          await notifyUser({
            userId: user._id,
            title: "Account Blocked - 3X Cap Full Capital Withdrawn",
            message: `Your account has been blocked as you have completed full capital withdrawal under the 3X Cap plan. Please register a new account to continue.`,
            category: "SYSTEM",
            type: "account_blocked",
            priority: "HIGH",
            actionUrl: "/login",
          });
        }
      }

      notifyUser({
        userId: transaction.user,
        title: "Withdrawal Approved & Dispatched",
        message: `Your withdrawal of $${Number(transaction.amount || 0).toLocaleString()} via ${transaction.gateway || "Blockchain"} has cleared and the payout was processed.`,
        category: "FINANCIAL",
        type: "withdrawal_approved",
        priority: "HIGH",
        actionUrl: "/transactions",
        metadata: { amount: transaction.amount, transactionId: transaction.customId },
        settingKey: "autoWithdrawalBroadcast",
      }).catch((err) => console.warn("[Notification] Withdrawal approved notice warning:", err.message));

      sendWithdrawalEmail({
        to: user.email,
        name: user.name,
        amount: transaction.amount,
        netAmount: transaction.netAmount,
        fee: transaction.fee,
        gateway: transaction.gateway || "Blockchain",
        destination: transaction.referenceNo || "Designated Destination",
        transactionId: transaction.customId,
        status: "Approved",
      }).catch((err) => console.warn("[Withdrawal Approved Email Warning]:", err.message));
    }

    res.status(200).json({
      success: true,
      message: `Transaction ${transaction.customId || transaction._id} approved successfully.`,
      transaction,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject Transaction (with optional reason & balance refund)
// @route   PUT /api/admin/transactions/:id/reject
exports.rejectTransaction = async (req, res) => {
  try {
    const { reason } = req.body;
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found." });
    }

    // If previously approved deposit is rejected, reverse credit
    if (transaction.status === "Approved" && transaction.type === "Deposit" && transaction.user) {
      await User.findByIdAndUpdate(transaction.user, {
        $inc: { depositWallet: -transaction.amount },
      });
    }

    // If pending withdrawal was rejected, refund earningWallet & restore totalWithdrawn
    if (transaction.type === "Withdrawal" && transaction.status === "Pending" && transaction.user) {
      const user = await User.findById(transaction.user);
      if (user) {
        user.earningWallet = (user.earningWallet || 0) + transaction.amount;
        user.totalWithdrawn = Math.max(0, (user.totalWithdrawn || 0) - transaction.amount);
        // If user was blocked solely due to this withdrawal and totalWithdrawn is now less than totalInvested
        if (user.status === "Blocked" && user.totalWithdrawn < user.totalInvested) {
          user.status = "Active";
        }
        await user.save();
      }
    }

    transaction.status = "Rejected";
    transaction.rejectReason = reason || "Verification failed / Invalid receipt.";
    await transaction.save();

    // Trigger rejection notification asynchronously
    if (transaction.user) {
      notifyUser({
        userId: transaction.user,
        title: `${transaction.type} Request Rejected`,
        message: `Your ${transaction.type.toLowerCase()} request of $${Number(transaction.amount || 0).toLocaleString()} was rejected: ${transaction.rejectReason}`,
        category: "FINANCIAL",
        type: `${transaction.type.toLowerCase()}_rejected`,
        priority: "NORMAL",
        actionUrl: "/transactions",
        metadata: { amount: transaction.amount, reason: transaction.rejectReason },
      }).catch((err) => console.warn("[Notification] Rejection notice warning:", err.message));
    }

    res.status(200).json({
      success: true,
      message: `Transaction ${transaction.customId || transaction._id} rejected.`,
      transaction,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const { deleteFromCloudinary } = require("../../utils/cloudinary");

// @desc    Delete Single Transaction Record
// @route   DELETE /api/admin/transactions/:id
exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found." });
    }

    if (transaction.slipUrl && transaction.slipUrl.includes("cloudinary.com")) {
      deleteFromCloudinary(transaction.slipUrl).catch((err) =>
        console.warn("[Cloudinary] Deleted transaction slip removal failed:", err.message)
      );
    }

    res.status(200).json({
      success: true,
      message: "Transaction deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clear All Transactions
// @route   DELETE /api/admin/transactions/clear/all
exports.clearAllTransactions = async (req, res) => {
  try {
    await Transaction.deleteMany({});
    res.status(200).json({
      success: true,
      message: "All transaction records cleared successfully.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
