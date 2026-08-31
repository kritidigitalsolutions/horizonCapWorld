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
    const userCustomId = req.user.customId;

    const query = {
      $or: [{ user: userId }, { userCustomId }],
    };

    if (type && type !== "all") {
      query.type = type;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      query.$and = [
        {
          $or: [
            { customId: { $regex: search, $options: "i" } },
            { referenceNo: { $regex: search, $options: "i" } },
            { gateway: { $regex: search, $options: "i" } },
          ],
        },
      ];
    }

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
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
    const transaction = await Transaction.findOne({
      $or: [{ _id: req.params.id }, { customId: req.params.id }],
      $or: [{ user: req.user._id }, { userCustomId: req.user.customId }],
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction record not found." });
    }

    res.status(200).json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

