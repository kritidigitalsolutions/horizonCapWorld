const Transaction = require("../../models/Transaction");
const PaymentMethod = require("../../models/PaymentMethod");
const User = require("../../models/User");

// @desc    Get all active receiving deposit payment gateways
// @route   GET /api/user/deposits/gateways
exports.getDepositGateways = async (req, res) => {
  try {
    const gateways = await PaymentMethod.find({ status: "Active" }).sort({ type: 1 });
    res.status(200).json({
      success: true,
      count: gateways.length,
      gateways,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const { uploadToCloudinary } = require("../../utils/cloudinary");

// @desc    Submit Deposit Proof / TID Request
// @route   POST /api/user/deposits/submit
exports.createDeposit = async (req, res) => {
  try {
    const { amount, gateway, referenceNo, slipUrl: rawSlipUrl } = req.body;
    const userId = req.user._id;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Please specify a valid deposit amount.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Investor not found." });
    }

    let slipUrl = rawSlipUrl || "";
    if (slipUrl && slipUrl.startsWith("data:")) {
      const uploadRes = await uploadToCloudinary(slipUrl, {
        folder: "horizoncap/deposits",
      });
      slipUrl = uploadRes.secure_url;
    }

    const numAmount = parseFloat(amount);
    const customId = `TXN-DP-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const transaction = await Transaction.create({
      customId,
      user: user._id,
      userName: user.name,
      userCustomId: user.customId,
      userEmail: user.email,
      country: user.country || "Global",
      type: "Deposit",
      amount: numAmount,
      rawAmount: numAmount,
      fee: 0,
      netAmount: numAmount,
      gateway: gateway || "Direct Deposit",
      referenceNo: referenceNo || `REF-${Date.now().toString().slice(-6)}`,
      slipUrl,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString("en-US", { hour12: false }),
      status: "Pending",
    });

    res.status(201).json({
      success: true,
      message: "Deposit proof submitted successfully. Pending compliance verification.",
      transaction,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit Withdrawal Request
// @route   POST /api/user/withdrawals/submit
exports.createWithdrawal = async (req, res) => {
  try {
    const { amount, gateway, address } = req.body;
    const userId = req.user._id;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Please specify a valid withdrawal amount.",
      });
    }

    if (!address || !address.trim()) {
      return res.status(400).json({
        success: false,
        message: "Recipient wallet address or bank account coordinates are required.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Investor not found." });
    }

    const numAmount = parseFloat(amount);

    if ((user.earningWallet || 0) < numAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient available earning wallet balance ($${(user.earningWallet || 0).toLocaleString()} USD).`,
      });
    }

    // Deduct from earning wallet
    user.earningWallet = (user.earningWallet || 0) - numAmount;
    user.totalWithdrawn = (user.totalWithdrawn || 0) + numAmount;
    await user.save();

    const customId = `TXN-WD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const transaction = await Transaction.create({
      customId,
      user: user._id,
      userName: user.name,
      userCustomId: user.customId,
      userEmail: user.email,
      country: user.country || "Global",
      type: "Withdrawal",
      amount: numAmount,
      rawAmount: numAmount,
      fee: 0,
      netAmount: numAmount,
      gateway: gateway || "USDT (TRC20)",
      referenceNo: address.trim(),
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString("en-US", { hour12: false }),
      status: "Pending",
    });

    res.status(201).json({
      success: true,
      message: "Withdrawal request submitted successfully. Processing within 12-24 hours.",
      transaction,
      remainingEarningWallet: user.earningWallet,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get User Transaction History
// @route   GET /api/user/transactions
exports.getTransactions = async (req, res) => {
  try {
    const { type, status, search, limit = 50, page = 1 } = req.query;
    const userId = req.user._id;

    // Strict user isolation — only records belonging to this specific user
    const query = { user: userId };

    if (type && type !== "all") {
      query.type = type;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { customId: { $regex: s, $options: "i" } },
        { referenceNo: { $regex: s, $options: "i" } },
        { gateway: { $regex: s, $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      transactions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Single Transaction by ID
// @route   GET /api/user/transactions/:id
exports.getTransactionById = async (req, res) => {
  try {
    const idParam = req.params.id;
    const query = {
      user: req.user._id,
      $or: [
        { customId: idParam },
      ],
    };

    // If param is a valid 24-hex ObjectId, also check _id
    if (/^[0-9a-fA-F]{24}$/.test(idParam)) {
      query.$or.push({ _id: idParam });
    }

    const transaction = await Transaction.findOne(query);

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction record not found." });
    }

    res.status(200).json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

