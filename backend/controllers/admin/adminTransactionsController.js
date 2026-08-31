const Transaction = require("../../models/Transaction");
const User = require("../../models/User");

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

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // KPI Aggregations
    const totalDeposits = await Transaction.aggregate([
      { $match: { type: "Deposit", status: "Approved" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalWithdrawals = await Transaction.aggregate([
      { $match: { type: "Withdrawal", status: "Approved" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalRoi = await Transaction.aggregate([
      { $match: { type: "ROI Return" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalReferral = await Transaction.aggregate([
      { $match: { type: "Referral Bonus" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.status(200).json({
      success: true,
      total,
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

    // If Deposit, credit user depositWallet
    if (transaction.type === "Deposit" && transaction.user) {
      await User.findByIdAndUpdate(transaction.user, {
        $inc: { depositWallet: transaction.amount },
      });
    }

    // If Withdrawal, increment totalWithdrawn
    if (transaction.type === "Withdrawal" && transaction.user) {
      await User.findByIdAndUpdate(transaction.user, {
        $inc: { totalWithdrawn: transaction.amount },
      });
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

    // If pending withdrawal was rejected, refund earningWallet
    if (transaction.type === "Withdrawal" && transaction.status === "Pending" && transaction.user) {
      await User.findByIdAndUpdate(transaction.user, {
        $inc: { earningWallet: transaction.amount },
      });
    }

    transaction.status = "Rejected";
    transaction.rejectReason = reason || "Verification failed / Invalid receipt.";
    await transaction.save();

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
