const Transaction = require("../../models/Transaction");
const PaymentMethod = require("../../models/PaymentMethod");
const DepositVideo = require("../../models/DepositVideo");
const User = require("../../models/User");

// @desc    Get Active Deposit Gateways (Fiat, Bank, Crypto)
// @route   GET /api/user/deposits/gateways
exports.getDepositGateways = async (req, res) => {
  try {
    const { category, type } = req.query;
    let query = { status: { $ne: "Inactive" } };

    if (category && category !== "all") {
      query.category = category;
    }
    if (type && type !== "all") {
      query.type = type;
    }

    const gateways = await PaymentMethod.find(query).sort({ type: 1, name: 1 });
    res.status(200).json({ success: true, count: gateways.length, gateways });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Official Deposit Tutorial Video
// @route   GET /api/user/deposits/tutorial-video
exports.getDepositVideo = async (req, res) => {
  try {
    let video = await DepositVideo.findOne({ status: "Published" });
    if (!video) {
      video = await DepositVideo.findOne();
    }
    res.status(200).json({ success: true, video });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit New Deposit Request
// @route   POST /api/user/deposits
exports.createDeposit = async (req, res) => {
  try {
    const { amount, rawAmount, gateway, referenceNo, slipUrl, senderName, senderAccount, senderPhone, cryptoNetwork, selectedToken } = req.body;
    const depositAmount = Number(amount);

    if (!depositAmount || depositAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid deposit amount is required.",
      });
    }

    if (!gateway) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid deposit gateway/channel.",
      });
    }

    if (!slipUrl || !slipUrl.trim()) {
      return res.status(400).json({
        success: false,
        message: "Proof of payment / deposit slip document is mandatory required.",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Investor account not found." });
    }

    const newTrx = await Transaction.create({
      customId: `TRX-${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`,
      user: user._id,
      userName: user.name,
      userCustomId: user.customId || "HORIZON-USR-01",
      userEmail: user.email,
      country: user.country,
      type: "Deposit",
      amount: depositAmount,
      rawAmount: Number(rawAmount) || depositAmount,
      fee: 0,
      netAmount: depositAmount,
      gateway: gateway || "Manual Transfer",
      referenceNo: referenceNo || `DEP-${Date.now().toString().slice(-6)}`,
      slipUrl: slipUrl || "",
      senderName: senderName || user.name,
      senderAccount: senderAccount || "",
      senderPhone: senderPhone || user.phone || "",
      cryptoNetwork: cryptoNetwork || "",
      selectedToken: selectedToken || "",
      status: "Pending",
      note: `Deposit via ${gateway} submitted for verification.`,
    });

    res.status(201).json({
      success: true,
      message: "Deposit submitted successfully. Our treasury desk is reviewing your transfer.",
      transaction: newTrx,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit Withdrawal Request
// @route   POST /api/user/withdrawals
exports.createWithdrawal = async (req, res) => {
  try {
    const { amount, gateway, walletAddress, bankDetails, note } = req.body;
    const withdrawAmount = Number(amount);

    if (!withdrawAmount || withdrawAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid withdrawal amount is required.",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Investor account not found." });
    }

    if ((user.earningWallet || 0) < withdrawAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient Earning Wallet balance ($${(user.earningWallet || 0).toLocaleString()} USD).`,
      });
    }

    // 5% standard protocol withdrawal fee or 0
    const fee = parseFloat((withdrawAmount * 0.05).toFixed(2));
    const netAmount = parseFloat((withdrawAmount - fee).toFixed(2));

    // Deduct from earning wallet immediately to prevent double spending
    user.earningWallet -= withdrawAmount;
    user.totalWithdrawn = (user.totalWithdrawn || 0) + withdrawAmount;
    await user.save();

    const newTrx = await Transaction.create({
      customId: `TRX-${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`,
      user: user._id,
      userName: user.name,
      userCustomId: user.customId || "HORIZON-USR-01",
      userEmail: user.email,
      country: user.country,
      type: "Withdrawal",
      amount: withdrawAmount,
      rawAmount: withdrawAmount,
      fee,
      netAmount,
      gateway: gateway || "Crypto Wallet",
      referenceNo: walletAddress || bankDetails?.accountNumber || `WD-${Date.now().toString().slice(-6)}`,
      status: "Pending",
      note: note || `Withdrawal request to ${gateway || "designated destination"}.`,
    });

    res.status(201).json({
      success: true,
      message: `Withdrawal request for $${withdrawAmount.toLocaleString()} USD submitted successfully.`,
      transaction: newTrx,
      user: {
        earningWallet: user.earningWallet,
        totalWithdrawn: user.totalWithdrawn,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get User Transaction History
// @route   GET /api/user/transactions
exports.getTransactions = async (req, res) => {
  try {
    const { type, status, search, page = 1, limit = 20 } = req.query;
    let query = { user: req.user._id };

    if (type && type !== "all") {
      query.type = type;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { referenceNo: { $regex: search, $options: "i" } },
        { gateway: { $regex: search, $options: "i" } },
        { customId: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      transactions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Single Transaction Details
// @route   GET /api/user/transactions/:id
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction record not found." });
    }

    res.status(200).json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
