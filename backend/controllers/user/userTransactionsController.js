const Transaction = require("../../models/Transaction");
const PaymentMethod = require("../../models/PaymentMethod");
const DepositVideo = require("../../models/DepositVideo");
const AdminSettings = require("../../models/AdminSettings");
const User = require("../../models/User");
const UserInvestment = require("../../models/UserInvestment");
const { notifyUser, notifyAdmin } = require("../../utils/notificationService");
const { sendDepositEmail, sendWithdrawalEmail, sendOtpEmail } = require("../../utils/emailService");
const { verifyCryptoDeposit, autoDetectCryptoTransfer } = require("../../services/cryptoVerificationService");
const { executeSmartContractWithdrawal } = require("../../services/smartContractPayoutService");

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

// @desc    Generate / rotate dynamic smart contract depository vault for user session
// @route   POST /api/user/deposits/session-vault
// @route   GET /api/user/deposits/session-vault
exports.generateSessionVault = async (req, res) => {
  try {
    const { ethers } = require("ethers");
    const masterPool = (process.env.PAYOUT_POOL_ADDRESS || "0x439DBd3A00E41255e0Bd26d8976E67310aDB7fd3").trim();

    // Unique session reference and nonce for refreshing QR code pattern
    const sessionRef = `DEP-SC-${Math.floor(100000 + Math.random() * 900000)}`;

    res.status(200).json({
      success: true,
      vaultAddress: masterPool,
      sessionRef,
      masterPoolAddress: masterPool,
      network: "BNB Smart Chain (BEP-20)",
      token: "USDT",
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("[generateSessionVault error]:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Auto-Detect recent on-chain crypto transfer from user's registered wallet
// @route   POST /api/user/deposits/auto-detect
exports.autoDetectDeposit = async (req, res) => {
  try {
    const { gateway, network, amount, depositoryAddress } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Investor account not found." });
    }

    const netUpper = (network || gateway || "").toUpperCase();
    const isBsc = netUpper.includes("BNB") || netUpper.includes("BSC") || netUpper.includes("BEP-20") || netUpper.includes("BEP20");
    const isTron = netUpper.includes("TRON") || netUpper.includes("TRC-20") || netUpper.includes("TRC20");

    let registeredSender = "";
    if (isBsc) {
      registeredSender = user.cryptoWallets?.usdtBep20;
    } else if (isTron) {
      registeredSender = user.cryptoWallets?.usdtTrc20;
    }

    if (!registeredSender) {
      return res.status(400).json({
        success: false,
        noAddress: true,
        message: `No ${isBsc ? "USDT (BEP-20)" : isTron ? "USDT (TRC-20)" : "Crypto"} address linked in your profile. Please go to Profile > Crypto Wallets to link your wallet.`,
      });
    }

    // Find payment method
    const isObjectId = typeof gateway === "string" && /^[0-9a-fA-F]{24}$/.test(gateway);
    const paymentMethod = await PaymentMethod.findOne({
      $or: [
        { name: gateway },
        ...(isObjectId ? [{ _id: gateway }] : []),
        { network: network },
      ],
      status: { $ne: "Inactive" },
    });

    const targetRecipient = depositoryAddress || paymentMethod?.address || process.env.PAYOUT_POOL_ADDRESS || "0x439DBd3A00E41255e0Bd26d8976E67310aDB7fd3";

    // Get list of already used tx hashes
    const existingTxs = await Transaction.find(
      { status: { $in: ["Approved", "Completed", "Pending"] } },
      "referenceNo"
    );
    const usedHashes = existingTxs.map((t) => t.referenceNo).filter(Boolean);

    const result = await autoDetectCryptoTransfer({
      network: paymentMethod?.network || network,
      senderAddress: registeredSender,
      expectedRecipient: targetRecipient,
      validRecipients: [
        depositoryAddress,
        paymentMethod?.address,
        process.env.PAYOUT_POOL_ADDRESS || "0x439DBd3A00E41255e0Bd26d8976E67310aDB7fd3",
      ].filter(Boolean),
      expectedAmount: Number(amount) || 0,
      usedTxHashes: usedHashes,
    });

    if (!result.found) {
      return res.status(400).json({
        success: false,
        message: result.reason,
        registeredSender,
      });
    }

    res.status(200).json({
      success: true,
      message: "Transaction detected on blockchain! Ready to credit.",
      detected: result,
      txHash: result.txHash,
      amount: result.amount,
      registeredSender,
    });
  } catch (error) {
    console.error("[Auto-Detect Error]:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit New Deposit Request
// @route   POST /api/user/deposits
exports.createDeposit = async (req, res) => {
  try {
    const { amount, rawAmount, gateway, referenceNo, slipUrl, senderName, senderAccount, senderPhone, cryptoNetwork, selectedToken, depositoryAddress } = req.body;
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

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Investor account not found." });
    }

    const userEnteredTid = referenceNo && referenceNo.trim() ? referenceNo.trim() : null;

    // ──────── AUTOMATED BLOCKCHAIN VERIFICATION FOR CRYPTO GATEWAYS ────────
    const isCrypto = paymentMethod && (paymentMethod.type === "crypto" || paymentMethod.category?.includes("Smart Contract"));

    if (isCrypto) {
      if (!userEnteredTid) {
        return res.status(400).json({
          success: false,
          message: "Please enter the blockchain Transaction Hash (TxID) after sending your USDT.",
        });
      }

      // Check for replay attacks: prevent using the same TxID more than once
      const duplicateTx = await Transaction.findOne({
        referenceNo: userEnteredTid,
        status: { $in: ["Approved", "Completed", "Pending"] },
      });

      if (duplicateTx) {
        return res.status(400).json({
          success: false,
          message: "This blockchain Transaction Hash (TxID) has already been processed on the platform.",
        });
      }

      const networkName = paymentMethod?.network || cryptoNetwork || paymentMethod?.name || "BNB Smart Chain (BEP-20)";
      const targetAddress = depositoryAddress || paymentMethod?.address || process.env.PAYOUT_POOL_ADDRESS || "0x439DBd3A00E41255e0Bd26d8976E67310aDB7fd3";
      const validRecipients = [
        depositoryAddress,
        paymentMethod?.address,
        process.env.PAYOUT_POOL_ADDRESS || "0x439DBd3A00E41255e0Bd26d8976E67310aDB7fd3",
      ].filter(Boolean);

      // Perform real on-chain validation
      const verification = await verifyCryptoDeposit({
        network: networkName,
        txHash: userEnteredTid,
        expectedRecipient: targetAddress,
        validRecipients,
        expectedAmount: depositAmount,
      });

      if (!verification.verified) {
        return res.status(400).json({
          success: false,
          message: verification.reason || "Blockchain verification failed. Please verify your TxID and recipient address.",
          pending: verification.pending || false,
        });
      }

      // On-Chain verification passed! Instant auto-credit
      const creditedAmount = verification.actualAmount || depositAmount;

      const autoTrx = await Transaction.create({
        customId: userEnteredTid,
        user: user._id,
        userName: user.name,
        userCustomId: user.customId || "HORIZON-USR-01",
        userEmail: user.email,
        country: user.country,
        type: "Deposit",
        amount: creditedAmount,
        rawAmount: Number(rawAmount) || creditedAmount,
        fee: 0,
        netAmount: creditedAmount,
        gateway: paymentMethod.name || gateway || "Crypto Deposit",
        referenceNo: userEnteredTid,
        slipUrl: slipUrl || "",
        senderName: senderName || user.name,
        senderAccount: verification.fromAddress || senderAccount || "",
        senderPhone: senderPhone || user.phone || "",
        cryptoNetwork: verification.network || cryptoNetwork || "",
        selectedToken: selectedToken || "USDT",
        status: "Approved",
        note: `Auto-verified on blockchain (${verification.network}, Block #${verification.blockNumber})`,
      });

      // Instantly credit user's deposit wallet
      await User.findByIdAndUpdate(user._id, {
        $inc: { depositWallet: creditedAmount },
      });

      // Dispatch real-time user notification
      await notifyUser({
        userId: user._id,
        title: "Deposit Verified & Vault Credited",
        message: `Your deposit of $${creditedAmount.toLocaleString()} USD has been confirmed on the blockchain and credited directly to your Deposit Wallet.`,
        category: "FINANCIAL",
        type: "deposit_approved",
        priority: "HIGH",
        actionUrl: "/transactions",
        metadata: {
          transactionId: autoTrx._id,
          customId: autoTrx.customId,
          amount: creditedAmount,
          txHash: userEnteredTid,
        },
      });

      // Dispatch admin notification
      await notifyAdmin({
        title: "Auto-Verified Crypto Deposit",
        message: `${user.name} deposited $${creditedAmount.toLocaleString()} USD via ${paymentMethod.name}. Auto-verified on blockchain (TxID: ${userEnteredTid}).`,
        category: "FINANCIAL",
        type: "deposit_approved",
        priority: "NORMAL",
        actionUrl: "/transactions",
        metadata: {
          transactionId: autoTrx._id,
          amount: creditedAmount,
          userId: user._id,
          txHash: userEnteredTid,
        },
      });

      // Send confirmation email
      sendDepositEmail({
        to: user.email,
        name: user.name,
        amount: creditedAmount,
        gateway: paymentMethod.name || gateway,
        transactionId: userEnteredTid,
        status: "Approved",
      }).catch((err) => console.warn("[Deposit Email Warning]:", err.message));

      return res.status(201).json({
        success: true,
        autoApproved: true,
        message: `Blockchain verification successful! $${creditedAmount.toLocaleString()} USD credited to your Deposit Wallet.`,
        transaction: autoTrx,
      });
    }

    // ──────── MANUAL VERIFICATION FLOW FOR FIAT / BANK ────────
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

    // Send Deposit Request Received Email
    sendDepositEmail({
      to: user.email,
      name: user.name,
      amount: depositAmount,
      gateway: gateway || "Manual Transfer",
      transactionId: userEnteredTid || assignedCustomId,
      status: "Pending",
    }).catch((err) => console.warn("[Deposit Email Warning]:", err.message));

    res.status(201).json({
      success: true,
      autoApproved: false,
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
        singleIdMaxWithdrawal: ws.singleIdMaxWithdrawal || "3X Maximum Withdrawal Allowed",
        singleIdMaxWithdrawalMultiplier: ws.singleIdMaxWithdrawalMultiplier || 4,
        termsNotice:
          ws.termsNotice ||
          "Automated clearance turnaround within 12-24 hours. Standard platform protocol fee is applied upon withdrawal submission. Single ID maximum withdrawal allowed is 3X.",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send Email OTP for Withdrawal Authorization
// @route   POST /api/user/withdrawals/send-otp
exports.sendWithdrawalOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Investor account not found." });
    }

    if (user.status === "Blocked" || user.status === "Suspended") {
      return res.status(403).json({
        success: false,
        message: "Your account is currently restricted from submitting withdrawal requests.",
      });
    }

    const { amount, incomeSource } = req.body;
    if (amount !== undefined && amount !== null && amount !== "") {
      const withdrawAmount = Number(amount);
      if (withdrawAmount > 0 && (user.earningWallet || 0) < withdrawAmount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient Earning Wallet balance ($${(user.earningWallet || 0).toLocaleString()} USD).`,
        });
      }

      // Check sub-balance if specific income stream is selected
      const totalAllocated = (user.pvRoiBalance || 0) + (user.levelIncomeBalance || 0) + (user.rankRewardBalance || 0) + (user.companyProfitBalance || 0) + (user.salaryBalance || 0);
      const effectivePvRoi = (user.pvRoiBalance || 0) + Math.max(0, (user.earningWallet || 0) - totalAllocated);

      if ((incomeSource === "rankReward" || incomeSource === "Rank Cash Reward" || incomeSource === "One Time Cash Reward ($)") && (user.rankRewardBalance || 0) < withdrawAmount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient Rank Cash Reward balance ($${(user.rankRewardBalance || 0).toLocaleString()} USD available).`,
        });
      }
      if ((incomeSource === "companyProfit" || incomeSource === "Company Profit %ge" || incomeSource === "Company Percentage") && (user.companyProfitBalance || 0) < withdrawAmount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient Company Profit % balance ($${(user.companyProfitBalance || 0).toLocaleString()} USD available).`,
        });
      }
      if ((incomeSource === "salary" || incomeSource === "Salary" || incomeSource === "Per Month Salary") && (user.salaryBalance || 0) < withdrawAmount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient Monthly Salary balance ($${(user.salaryBalance || 0).toLocaleString()} USD available).`,
        });
      }
      if ((incomeSource === "pvRoi" || incomeSource === "PV ROI") && effectivePvRoi < withdrawAmount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient PV ROI balance ($${effectivePvRoi.toLocaleString()} USD available).`,
        });
      }
      if ((incomeSource === "levelIncome" || incomeSource === "Level Income") && (user.levelIncomeBalance || 0) < withdrawAmount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient Level Income balance ($${(user.levelIncomeBalance || 0).toLocaleString()} USD available).`,
        });
      }
    }

    // Generate 6-digit cryptographic-style numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.otpPurpose = "WITHDRAWAL_REQUEST";
    await user.save();

    // Send email using emailService sendOtpEmail
    await sendOtpEmail({
      to: user.email,
      name: user.name,
      otp,
      purpose: "Withdrawal Authorization",
    });

    // Mask user email for privacy (e.g. j***@gmail.com)
    const maskEmail = (em) => {
      if (!em) return "your registered Gmail";
      const [namePart, domain] = em.split("@");
      if (!domain) return em;
      const visible = namePart.length > 2 ? namePart.slice(0, 2) : namePart.slice(0, 1);
      return `${visible}***@${domain}`;
    };

    res.status(200).json({
      success: true,
      message: `A 6-digit withdrawal verification code has been dispatched to ${maskEmail(user.email)}.`,
      email: maskEmail(user.email),
      expiresIn: "10 minutes",
    });
  } catch (error) {
    console.error("[Withdrawal OTP Error]:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to dispatch email verification code: " + error.message,
    });
  }
};

// @desc    Submit Withdrawal Request
// @route   POST /api/user/withdrawals
exports.createWithdrawal = async (req, res) => {
  try {
    const { amount, gateway, walletAddress, bankDetails, note, otp, incomeSource } = req.body;
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

    // ──────── MANDATORY EMAIL OTP VERIFICATION ────────
    if (!otp || typeof otp !== "string" || !otp.trim()) {
      return res.status(400).json({
        success: false,
        requireOtp: true,
        message: "Email verification required. Please enter the 6-digit OTP sent to your registered Gmail.",
      });
    }

    const cleanOtp = otp.trim();
    if (!user.otp || user.otp !== cleanOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code. Please enter the correct 6-digit OTP sent to your Gmail.",
      });
    }

    if (user.otpExpires && new Date() > user.otpExpires) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new OTP to submit this withdrawal.",
      });
    }

    if (user.otpPurpose && user.otpPurpose !== "WITHDRAWAL_REQUEST") {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP authorization context. Please request a new code for withdrawal verification.",
      });
    }

    // Reset OTP after successful verification
    user.otp = "";
    user.otpExpires = null;
    user.otpPurpose = null;

    // Check Single ID Maximum Withdrawal Allowed (3X Profit + 1X Capital = 4X total invested)
    const maxAllowedTotalWithdrawal = user.totalInvested && user.totalInvested > 0
      ? user.totalInvested * singleIdMultiplier
      : 0;

    if (maxAllowedTotalWithdrawal > 0) {
      const currentTotalWithdrawn = user.totalWithdrawn || 0;
      if (currentTotalWithdrawn + withdrawAmount > maxAllowedTotalWithdrawal) {
        const remainingLimit = Math.max(0, maxAllowedTotalWithdrawal - currentTotalWithdrawn);
        return res.status(400).json({
          success: false,
          message: `Withdrawal exceeds Single ID maximum limit: ${singleIdMultiplier}X ($${maxAllowedTotalWithdrawal.toLocaleString()} USD max allowed for $${user.totalInvested.toLocaleString()} USD invested). You have already withdrawn $${currentTotalWithdrawn.toLocaleString()} USD (Remaining allowed: $${remainingLimit.toLocaleString()} USD).`,
        });
      }
    }

    if ((user.earningWallet || 0) < withdrawAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient Earning Wallet balance ($${(user.earningWallet || 0).toLocaleString()} USD).`,
      });
    }

    // ──────── SUB-BALANCE VALIDATION & DEDUCTION ────────
    const totalAllocated = (user.pvRoiBalance || 0) + (user.levelIncomeBalance || 0) + (user.rankRewardBalance || 0) + (user.companyProfitBalance || 0) + (user.salaryBalance || 0);
    if (totalAllocated < (user.earningWallet || 0)) {
      user.pvRoiBalance = Number(((user.pvRoiBalance || 0) + ((user.earningWallet || 0) - totalAllocated)).toFixed(2));
    }

    let friendlyIncomeSource = "Main Earning Wallet";
    if (incomeSource === "rankReward" || incomeSource === "Rank Cash Reward" || incomeSource === "One Time Cash Reward ($)") {
      friendlyIncomeSource = "One Time Cash Reward ($)";
      if ((user.rankRewardBalance || 0) < withdrawAmount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient Rank Cash Reward balance ($${(user.rankRewardBalance || 0).toLocaleString()} USD available).`,
        });
      }
      user.rankRewardBalance = Math.max(0, (user.rankRewardBalance || 0) - withdrawAmount);
    } else if (incomeSource === "companyProfit" || incomeSource === "Company Profit %ge" || incomeSource === "Company Percentage") {
      friendlyIncomeSource = "Company Profit %ge";
      if ((user.companyProfitBalance || 0) < withdrawAmount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient Company Profit % balance ($${(user.companyProfitBalance || 0).toLocaleString()} USD available).`,
        });
      }
      user.companyProfitBalance = Math.max(0, (user.companyProfitBalance || 0) - withdrawAmount);
    } else if (incomeSource === "salary" || incomeSource === "Salary" || incomeSource === "Per Month Salary") {
      friendlyIncomeSource = "Per Month Salary";
      if ((user.salaryBalance || 0) < withdrawAmount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient Monthly Salary balance ($${(user.salaryBalance || 0).toLocaleString()} USD available).`,
        });
      }
      user.salaryBalance = Math.max(0, (user.salaryBalance || 0) - withdrawAmount);
    } else if (incomeSource === "pvRoi" || incomeSource === "PV ROI") {
      friendlyIncomeSource = "PV ROI";
      if ((user.pvRoiBalance || 0) < withdrawAmount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient PV ROI balance ($${(user.pvRoiBalance || 0).toLocaleString()} USD available).`,
        });
      }
      user.pvRoiBalance = Math.max(0, (user.pvRoiBalance || 0) - withdrawAmount);
    } else if (incomeSource === "levelIncome" || incomeSource === "Level Income") {
      friendlyIncomeSource = "Level Income";
      if ((user.levelIncomeBalance || 0) < withdrawAmount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient Level Income balance ($${(user.levelIncomeBalance || 0).toLocaleString()} USD available).`,
        });
      }
      user.levelIncomeBalance = Math.max(0, (user.levelIncomeBalance || 0) - withdrawAmount);
    } else {
      // Deduct sequentially from sub-balances to keep in sync with total earningWallet
      let rem = withdrawAmount;
      const subFields = ['pvRoiBalance', 'levelIncomeBalance', 'rankRewardBalance', 'companyProfitBalance', 'salaryBalance'];
      for (const field of subFields) {
        if (rem <= 0) break;
        const avail = user[field] || 0;
        const ded = Math.min(avail, rem);
        user[field] = Math.max(0, avail - ded);
        rem -= ded;
      }
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

    const userEnteredDest =
      (walletAddress && walletAddress.trim()) ||
      (req.body.address && req.body.address.trim()) ||
      (bankDetails?.accountNumber && bankDetails.accountNumber.trim()) ||
      null;
    const assignedCustomId = `WD-${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;

    const isCryptoGateway =
      !gateway ||
      gateway.toLowerCase().includes("bep") ||
      gateway.toLowerCase().includes("bsc") ||
      gateway.toLowerCase().includes("crypto") ||
      gateway.toLowerCase().includes("bnb") ||
      gateway.toLowerCase().includes("usdt") ||
      gateway.toLowerCase().includes("wallet");

    const isValidEvmAddress =
      userEnteredDest &&
      typeof userEnteredDest === "string" &&
      userEnteredDest.startsWith("0x") &&
      userEnteredDest.length === 42;

    // Helper to safely apply balance deductions ONLY when funds are confirmed delivered
    const applyWalletDeduction = () => {
      if (incomeSource === "rankReward" || incomeSource === "Rank Cash Reward" || incomeSource === "One Time Cash Reward ($)") {
        user.rankRewardBalance = Math.max(0, (user.rankRewardBalance || 0) - withdrawAmount);
      } else if (incomeSource === "companyProfit" || incomeSource === "Company Profit %ge" || incomeSource === "Company Percentage") {
        user.companyProfitBalance = Math.max(0, (user.companyProfitBalance || 0) - withdrawAmount);
      } else if (incomeSource === "salary" || incomeSource === "Salary" || incomeSource === "Per Month Salary") {
        user.salaryBalance = Math.max(0, (user.salaryBalance || 0) - withdrawAmount);
      } else if (incomeSource === "pvRoi" || incomeSource === "PV ROI") {
        user.pvRoiBalance = Math.max(0, (user.pvRoiBalance || 0) - withdrawAmount);
      } else if (incomeSource === "levelIncome" || incomeSource === "Level Income") {
        user.levelIncomeBalance = Math.max(0, (user.levelIncomeBalance || 0) - withdrawAmount);
      } else {
        let rem = withdrawAmount;
        const subFields = ['pvRoiBalance', 'levelIncomeBalance', 'rankRewardBalance', 'companyProfitBalance', 'salaryBalance'];
        for (const field of subFields) {
          if (rem <= 0) break;
          const avail = user[field] || 0;
          const ded = Math.min(avail, rem);
          user[field] = Math.max(0, avail - ded);
          rem -= ded;
        }
      }

      user.earningWallet = Math.max(0, (user.earningWallet || 0) - withdrawAmount);
      user.totalWithdrawn = (user.totalWithdrawn || 0) + withdrawAmount;
    };

    const handle4XCapCompletion = async () => {
      const has3XCap = await UserInvestment.exists({
        user: user._id,
        $or: [
          { isLocked: true },
          { lockInPeriod: "3X Cap" },
          { lockInPeriod: { $regex: "3X", $options: "i" } },
        ],
      });

      if (has3XCap && maxAllowedTotalWithdrawal > 0 && user.totalWithdrawn >= maxAllowedTotalWithdrawal) {
        user.status = "Blocked";
        user.dailyEarning = 0;
        user.perSecondRate = 0;

        await UserInvestment.updateMany(
          { user: user._id, status: "Active" },
          { $set: { status: "Completed", dailyEarning: 0, perSecondRate: 0 } }
        );

        await notifyUser({
          userId: user._id,
          title: "Account Completed - 4X Maximum Withdrawal Limit Reached",
          message: `You have successfully withdrawn your maximum allowed 4X limit ($${user.totalWithdrawn.toLocaleString()} USD on $${user.totalInvested.toLocaleString()} USD invested). Account contract completed.`,
          category: "SYSTEM",
          type: "account_blocked",
          priority: "HIGH",
          actionUrl: "/login",
        });

        await notifyAdmin({
          title: "Investor Account Completed (4X Max Limit Reached)",
          message: `${user.name} (${user.customId || user.email}) has reached their 4X maximum withdrawal limit. Account contract completed.`,
          category: "SECURITY",
          type: "user_blocked",
          priority: "HIGH",
          actionUrl: "/users",
        });
      }
    };

    // ──────── 100% AUTONOMOUS SMART CONTRACT ON-CHAIN DISPATCH ────────
    if (isCryptoGateway && isValidEvmAddress) {
      // 1. Verify Smart Contract Pool Liquidity BEFORE touching user balance
      const { checkPoolHealth } = require("../../services/smartContractPayoutService");
      const poolHealth = await checkPoolHealth();
      const availablePool = poolHealth?.success ? parseFloat(poolHealth.poolBalanceUsdt || "0") : 0;

      if (availablePool < netAmount) {
        return res.status(400).json({
          success: false,
          message: `Smart Contract payout pool liquidity is temporarily low ($${availablePool.toFixed(2)} USDT available, $${netAmount.toFixed(2)} USDT required). Your dashboard wallet balance was NOT deducted ($0.00 deducted). Please try again shortly or contact support.`,
        });
      }

      // 2. Dispatch real on-chain transaction to Binance Smart Chain
      const scResult = await executeSmartContractWithdrawal({
        recipientAddress: userEnteredDest,
        amountInUsd: netAmount,
        customId: assignedCustomId,
      });

      if (!scResult.success) {
        return res.status(400).json({
          success: false,
          message: `On-chain transfer could not be completed: ${scResult.error || "Transaction reverted"}. Your dashboard balance was NOT deducted.`,
        });
      }

      // 3. Payout confirmed on blockchain! Deduct dashboard balance atomically now
      applyWalletDeduction();
      await handle4XCapCompletion();
      await user.save();

      const newTrx = await Transaction.create({
        customId: assignedCustomId,
        user: user._id,
        userName: user.name,
        userCustomId: user.customId || "HORIZON-USR-01",
        userEmail: user.email,
        country: user.country,
        type: "Withdrawal",
        incomeSource: friendlyIncomeSource,
        amount: withdrawAmount,
        rawAmount: withdrawAmount,
        fee,
        netAmount,
        gateway: gateway || "USDT (BEP20)",
        referenceNo: userEnteredDest,
        senderAccount: userEnteredDest,
        cryptoNetwork: "BEP20",
        status: "Approved",
        txHash: scResult.txHash,
        blockchainExplorerUrl: scResult.blockchainExplorerUrl,
        payoutMethod: "Smart Contract Pool",
        note: `Autonomous Instant Payout Cleared via Smart Contract Pool (Block #${scResult.blockNumber}). TxHash: ${scResult.txHash}`,
      });

      // Dispatch notifications & email
      notifyAdmin({
        title: "Instant Smart Contract Payout Dispatched",
        message: `Instant Smart Contract payout of $${netAmount.toLocaleString()} USD dispatched to ${user.name} (${userEnteredDest}). TxHash: ${scResult.txHash}`,
        category: "FINANCIAL",
        type: "withdrawal_approved",
        priority: "HIGH",
        actionUrl: "/transactions",
      }).catch(() => {});

      notifyUser({
        userId: user._id,
        title: "Withdrawal Cleared On-Chain!",
        message: `Your withdrawal of $${netAmount.toLocaleString()} USD has been cleared instantly on-chain from the Smart Contract Pool. TxHash: ${scResult.txHash}`,
        category: "FINANCIAL",
        type: "withdrawal_approved",
        priority: "HIGH",
        actionUrl: "/transactions",
      }).catch(() => {});

      sendWithdrawalEmail({
        to: user.email,
        name: user.name,
        amount: withdrawAmount,
        netAmount,
        fee,
        gateway: gateway || "BNB Smart Chain Depository (BEP20)",
        destination: userEnteredDest,
        transactionId: assignedCustomId,
        status: "Approved",
        txHash: scResult.txHash,
      }).catch((err) => console.warn("[Withdrawal Email Warning]:", err.message));

      return res.status(200).json({
        success: true,
        isInstantOnChain: true,
        txHash: scResult.txHash,
        blockchainExplorerUrl: scResult.blockchainExplorerUrl,
        message: `Withdrawal of $${netAmount.toFixed(2)} USDT cleared on-chain and sent directly to your Web3 wallet! TxHash: ${scResult.txHash}`,
        transaction: newTrx,
        user: {
          earningWallet: user.earningWallet,
          totalWithdrawn: user.totalWithdrawn,
          status: user.status,
        },
      });
    }

    // ──────── NON-CRYPTO (FIAT/BANK) FALLBACK FLOW ────────
    applyWalletDeduction();
    await handle4XCapCompletion();
    await user.save();

    const newTrx = await Transaction.create({
      customId: assignedCustomId,
      user: user._id,
      userName: user.name,
      userCustomId: user.customId || "HORIZON-USR-01",
      userEmail: user.email,
      country: user.country,
      type: "Withdrawal",
      incomeSource: friendlyIncomeSource,
      amount: withdrawAmount,
      rawAmount: withdrawAmount,
      fee,
      netAmount,
      gateway: gateway || "Bank Transfer",
      referenceNo: userEnteredDest || assignedCustomId,
      senderAccount: userEnteredDest || "",
      cryptoNetwork: "",
      status: "Pending",
      note:
        note ||
        `Withdrawal request of $${withdrawAmount} from ${friendlyIncomeSource} to ${gateway || "designated destination"}. Fee: $${fee} (Net: $${netAmount})`,
    });

    notifyAdmin({
      title: "New Bank Withdrawal Request",
      message: `${user.name} requested a fiat withdrawal of $${withdrawAmount.toLocaleString()} USD via ${gateway || "Bank"}.`,
      category: "FINANCIAL",
      type: "withdrawal_requested",
      priority: "HIGH",
      actionUrl: "/transactions",
    }).catch(() => {});

    notifyUser({
      userId: user._id,
      title: "Withdrawal Request Received",
      message: `Your withdrawal request of $${withdrawAmount.toLocaleString()} USD has been submitted for processing.`,
      category: "FINANCIAL",
      type: "withdrawal_pending",
      priority: "NORMAL",
      actionUrl: "/transactions",
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: `Withdrawal request for $${withdrawAmount.toLocaleString()} USD submitted successfully.`,
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
      if (type === "Investment") {
        query.type = { $regex: "^Investment", $options: "i" };
      } else {
        query.type = type;
      }
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { referenceNo: { $regex: search, $options: "i" } },
        { gateway: { $regex: search, $options: "i" } },
        { customId: { $regex: search, $options: "i" } },
        { type: { $regex: search, $options: "i" } },
        { note: { $regex: search, $options: "i" } },
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
