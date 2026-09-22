const Transaction = require("../../models/Transaction");
const PaymentMethod = require("../../models/PaymentMethod");
const DepositVideo = require("../../models/DepositVideo");
const AdminSettings = require("../../models/AdminSettings");
const User = require("../../models/User");
const UserInvestment = require("../../models/UserInvestment");
const { notifyUser, notifyAdmin } = require("../../utils/notificationService");

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
        message: "Please enter a valid deposit amount.",
      });
    }

    if (!gateway) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid deposit gateway/channel.",
      });
    }

    // Dynamic Payment Method Limit Validation
    const isObjectId = typeof gateway === "string" && /^[0-9a-fA-F]{24}$/.test(gateway);
    const paymentMethod = await PaymentMethod.findOne({
      $or: [
        { name: gateway },
        ...(isObjectId ? [{ _id: gateway }] : [])
      ],
      status: { $ne: "Inactive" }
    });

    if (paymentMethod) {
      const parseNumeric = (str) => {
        if (!str && str !== 0) return null;
        if (typeof str === "number") return str;
        const cleaned = str.toString().replace(/,/g, "").trim();
        const m = cleaned.match(/(\d+(\.\d+)?)/);
        return m ? parseFloat(m[1]) : null;
      };

      const minLimitNum = parseNumeric(paymentMethod.minLimit);
      const maxLimitNum = parseNumeric(paymentMethod.maxLimit);

      if (minLimitNum !== null && depositAmount < minLimitNum) {
        return res.status(400).json({
          success: false,
          message: `Minimum deposit for ${paymentMethod.name} is ${paymentMethod.minLimit || minLimitNum}.`,
        });
      }

      if (maxLimitNum !== null && depositAmount > maxLimitNum) {
        return res.status(400).json({
          success: false,
          message: `Maximum deposit for ${paymentMethod.name} is ${paymentMethod.maxLimit || maxLimitNum}.`,
        });
      }
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

    const userEnteredTid = referenceNo && referenceNo.trim() ? referenceNo.trim() : null;
    const assignedCustomId = userEnteredTid || `TRX-${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;

    const newTrx = await Transaction.create({
      customId: assignedCustomId,
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
      referenceNo: userEnteredTid || assignedCustomId,
      slipUrl: slipUrl || "",
      senderName: senderName || user.name,
      senderAccount: senderAccount || "",
      senderPhone: senderPhone || user.phone || "",
      cryptoNetwork: cryptoNetwork || "",
      selectedToken: selectedToken || "",
      status: "Pending",
      note: `Deposit via ${gateway} submitted for verification. TID / Hash: ${userEnteredTid || assignedCustomId}`,
    });

    // Notify Admin regarding the new deposit
    await notifyAdmin({
      title: "New Fund Deposit Submitted",
      message: `${user.name} (${user.customId || user.email}) submitted a deposit of $${depositAmount.toLocaleString()} USD via ${gateway || "Manual Transfer"}. TID: ${userEnteredTid || assignedCustomId}`,
      category: "FINANCIAL",
      type: "deposit_submitted",
      priority: "HIGH",
      actionUrl: "/deposits",
      metadata: {
        transactionId: newTrx._id,
        customId: newTrx.customId,
        referenceNo: newTrx.referenceNo,
        amount: depositAmount,
        userId: user._id,
        userName: user.name,
        gateway: gateway || "Manual Transfer",
      },
      settingKey: "adminDepositAlerts",
    });

    // Notify User confirmation
    await notifyUser({
      userId: user._id,
      title: "Deposit Submitted for Review",
      message: `Your deposit of $${depositAmount.toLocaleString()} USD via ${gateway} (TID: ${userEnteredTid || assignedCustomId}) has been received and is pending treasury verification.`,
      category: "FINANCIAL",
      type: "deposit_pending",
      priority: "NORMAL",
      actionUrl: "/transactions",
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

// @desc    Get Dynamic Withdrawal Settings & Charges (Public / User)
// @route   GET /api/user/withdrawals/settings
exports.getWithdrawalSettings = async (req, res) => {
  try {
    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = await AdminSettings.create({});
    }

    const ws = settings.withdrawalSettings || {};
    res.status(200).json({
      success: true,
      withdrawalSettings: {
        feeType: ws.feeType || "percentage",
        feePercentage: ws.feePercentage !== undefined ? ws.feePercentage : 5,
        fixedFee: ws.fixedFee !== undefined ? ws.fixedFee : 0,
        minWithdrawal: ws.minWithdrawal !== undefined ? ws.minWithdrawal : 5,
        maxWithdrawal: ws.maxWithdrawal !== undefined ? ws.maxWithdrawal : 50000,
        processingTime: ws.processingTime || "12 - 24 Hours",
        feeEnabled: ws.feeEnabled !== undefined ? ws.feeEnabled : true,
        singleIdMaxWithdrawal: ws.singleIdMaxWithdrawal || "3X + Capital Maximum Withdrawal Allowed",
        singleIdMaxWithdrawalMultiplier: ws.singleIdMaxWithdrawalMultiplier || 4,
        termsNotice:
          ws.termsNotice ||
          "Automated clearance turnaround within 12-24 hours. Standard platform protocol fee is applied upon withdrawal submission. Single ID maximum withdrawal allowed is 3X + Capital.",
      },
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

    // Fetch dynamic withdrawal charges from admin settings
    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = await AdminSettings.create({});
    }
    const ws = settings.withdrawalSettings || {};
    const minWithdrawal = ws.minWithdrawal !== undefined ? Number(ws.minWithdrawal) : 5;
    const maxWithdrawal = ws.maxWithdrawal !== undefined ? Number(ws.maxWithdrawal) : 50000;
    const feeEnabled = ws.feeEnabled !== undefined ? !!ws.feeEnabled : true;
    const feeType = ws.feeType || "percentage";
    const feePercentage = ws.feePercentage !== undefined ? Number(ws.feePercentage) : 5;
    const fixedFee = ws.fixedFee !== undefined ? Number(ws.fixedFee) : 0;
    const singleIdMultiplier = ws.singleIdMaxWithdrawalMultiplier || 4;

    if (!withdrawAmount || withdrawAmount < minWithdrawal) {
      return res.status(400).json({
        success: false,
        message: `Minimum withdrawal amount is $${minWithdrawal} USD.`,
      });
    }

    if (withdrawAmount > maxWithdrawal) {
      return res.status(400).json({
        success: false,
        message: `Maximum withdrawal limit is $${maxWithdrawal.toLocaleString()} USD per request.`,
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Investor account not found." });
    }

    // Check Single ID Maximum Withdrawal Allowed (3X + Capital = 4X total invested)
    if (user.totalInvested && user.totalInvested > 0) {
      const maxAllowedTotalWithdrawal = user.totalInvested * singleIdMultiplier;
      const currentTotalWithdrawn = user.totalWithdrawn || 0;
      if (currentTotalWithdrawn + withdrawAmount > maxAllowedTotalWithdrawal) {
        const remainingLimit = Math.max(0, maxAllowedTotalWithdrawal - currentTotalWithdrawn);
        return res.status(400).json({
          success: false,
          message: `Withdrawal exceeds Single ID maximum limit: 3X + Capital ($${maxAllowedTotalWithdrawal.toLocaleString()} USD max allowed for $${user.totalInvested.toLocaleString()} USD invested). You have already withdrawn $${currentTotalWithdrawn.toLocaleString()} USD (Remaining allowed: $${remainingLimit.toLocaleString()} USD).`,
        });
      }
    }

    if ((user.earningWallet || 0) < withdrawAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient Earning Wallet balance ($${(user.earningWallet || 0).toLocaleString()} USD).`,
      });
    }

    // Dynamic fee calculation
    let fee = 0;
    if (feeEnabled) {
      if (feeType === "fixed") {
        fee = parseFloat(fixedFee.toFixed(2));
      } else {
        fee = parseFloat(((withdrawAmount * feePercentage) / 100).toFixed(2));
      }
    }
    const netAmount = parseFloat(Math.max(0, withdrawAmount - fee).toFixed(2));

    // Deduct from earning wallet immediately to prevent double spending
    user.earningWallet -= withdrawAmount;
    user.totalWithdrawn = (user.totalWithdrawn || 0) + withdrawAmount;

    // Check if user has or had a 3X Cap plan
    const has3XCap = await UserInvestment.exists({
      user: user._id,
      $or: [
        { isLocked: true },
        { lockInPeriod: "3X Cap" },
        { lockInPeriod: { $regex: "3X", $options: "i" } },
      ],
    });

    let accountBlocked = false;
    // 3X Cap Rule: When client withdraws their full capital, their account is blocked
    if (has3XCap && user.totalInvested > 0 && user.totalWithdrawn >= user.totalInvested) {
      user.status = "Blocked";
      user.dailyEarning = 0;
      user.perSecondRate = 0;
      accountBlocked = true;

      // Mark all active investments as Completed & zero out streaming rates
      await UserInvestment.updateMany(
        { user: user._id, status: "Active" },
        { $set: { status: "Completed", dailyEarning: 0, perSecondRate: 0 } }
      );

      // Automated alert to user
      await notifyUser({
        userId: user._id,
        title: "Account Blocked - 3X Cap Full Capital Withdrawn",
        message: `You have successfully withdrawn your full capital ($${user.totalWithdrawn.toLocaleString()} USD / $${user.totalInvested.toLocaleString()} USD invested) under the 3X Cap Plan. As per platform policy, your account has been blocked. Please create a new account to continue investing.`,
        category: "SYSTEM",
        type: "account_blocked",
        priority: "HIGH",
        actionUrl: "/login",
      });

      // Automated alert to admin
      await notifyAdmin({
        title: "Investor Account Blocked (3X Cap Full Capital Withdrawn)",
        message: `${user.name} (${user.customId || user.email}) has withdrawn their full capital ($${user.totalWithdrawn.toLocaleString()} USD). Account automatically blocked.`,
        category: "SECURITY",
        type: "user_blocked",
        priority: "HIGH",
        actionUrl: "/users",
      });
    }

    await user.save();

    const userEnteredDest =
      (walletAddress && walletAddress.trim()) ||
      (bankDetails?.accountNumber && bankDetails.accountNumber.trim()) ||
      null;
    const assignedCustomId = `WD-${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;

    const newTrx = await Transaction.create({
      customId: assignedCustomId,
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
      referenceNo: userEnteredDest || assignedCustomId,
      status: "Pending",
      note:
        note ||
        `Withdrawal request to ${gateway || "designated destination"} (${userEnteredDest || "Standard Payout"}). Fee: $${fee} (Net: $${netAmount})`,
    });

    // Notify Admin regarding withdrawal request
    await notifyAdmin({
      title: "New Withdrawal Request",
      message: `${user.name} requested a withdrawal of $${withdrawAmount.toLocaleString()} USD (Fee: $${fee}, Net: $${netAmount.toLocaleString()}) via ${gateway || "Crypto Wallet"}. Destination: ${userEnteredDest || "Standard Payout"}`,
      category: "FINANCIAL",
      type: "withdrawal_requested",
      priority: "HIGH",
      actionUrl: "/withdrawals",
      metadata: {
        transactionId: newTrx._id,
        customId: newTrx.customId,
        referenceNo: newTrx.referenceNo,
        amount: withdrawAmount,
        fee,
        netAmount,
        userId: user._id,
        userName: user.name,
      },
      settingKey: "adminWithdrawalAlerts",
    });

    // Notify User confirmation
    await notifyUser({
      userId: user._id,
      title: "Withdrawal Request Received",
      message: `Your withdrawal request of $${withdrawAmount.toLocaleString()} USD (Net payout: $${netAmount.toLocaleString()} after $${fee} protocol fee) has been submitted and is currently being processed by treasury desk.`,
      category: "FINANCIAL",
      type: "withdrawal_pending",
      priority: "NORMAL",
      actionUrl: "/transactions",
    });

    res.status(201).json({
      success: true,
      accountBlocked,
      message: accountBlocked
        ? `Withdrawal request for $${withdrawAmount.toLocaleString()} USD submitted. Note: You have withdrawn your full capital under the 3X Cap plan; your account has now been blocked as per platform terms. Please create a new account to continue.`
        : `Withdrawal request for $${withdrawAmount.toLocaleString()} USD submitted successfully. Net payout: $${netAmount.toLocaleString()}.`,
      transaction: newTrx,
      user: {
        earningWallet: user.earningWallet,
        totalWithdrawn: user.totalWithdrawn,
        status: user.status,
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
