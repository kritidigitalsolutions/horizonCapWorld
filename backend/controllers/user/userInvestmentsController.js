const InvestmentPlan = require("../../models/InvestmentPlan");
const UserInvestment = require("../../models/UserInvestment");
const User = require("../../models/User");
const Transaction = require("../../models/Transaction");
const {
  syncUserStreamingEarnings,
  distributeReferralCommissions,
} = require("../../utils/yieldAndAffiliateEngine");

// @desc    Get all active investment plans
// @route   GET /api/user/plans
exports.getPlans = async (req, res) => {
  try {
    const plans = await InvestmentPlan.find({ status: "Active" }).sort({ minAmount: 1 });
    res.status(200).json({
      success: true,
      count: plans.length,
      plans,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single investment plan by ID
// @route   GET /api/user/plans/:id
exports.getPlanById = async (req, res) => {
  try {
    const plan = await InvestmentPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: "Investment plan not found." });
    }
    res.status(200).json({ success: true, plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Execute Plan Investment Contract
// @route   POST /api/user/plans/invest
exports.investInPlan = async (req, res) => {
  try {
    const { planId, amount } = req.body;
    const userId = req.user._id;

    if (!planId || !amount || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Please specify a valid plan ID and investment amount.",
      });
    }

    const numAmount = parseFloat(amount);

    // 1. Fetch Plan
    const plan = await InvestmentPlan.findById(planId);
    if (!plan || plan.status !== "Active") {
      return res.status(404).json({
        success: false,
        message: "Selected investment plan is not active or unavailable.",
      });
    }

    // 2. Validate Limits
    if (numAmount < plan.minAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum investment for ${plan.name} is $${plan.minAmount.toLocaleString()}.`,
      });
    }

    if (!plan.noMaxLimit && plan.maxAmount && numAmount > plan.maxAmount) {
      return res.status(400).json({
        success: false,
        message: `Maximum investment for ${plan.name} is $${plan.maxAmount.toLocaleString()}.`,
      });
    }

    // 3. Fetch User & Validate Deposit Wallet Balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Investor account not found." });
    }

    if ((user.depositWallet || 0) < numAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient deposit wallet balance ($${(user.depositWallet || 0).toLocaleString()} available). Please fund your wallet.`,
      });
    }

    // 4. Calculate Duration & Yield Rates
    const durationDays = plan.durationDays || 365;
    const dailyEarning = parseFloat(((numAmount * (plan.roi / 100)) / 365).toFixed(4));
    const perSecondRate = parseFloat((dailyEarning / 86400).toFixed(7));

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const invCustomId = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // 5. Create User Investment Contract
    const investment = await UserInvestment.create({
      customId: invCustomId,
      user: user._id,
      userCustomId: user.customId,
      userName: user.name,
      userEmail: user.email,
      plan: plan._id,
      planName: plan.name,
      planCategory: plan.category || "Renewable Energy",
      amount: numAmount,
      roi: plan.roi,
      dailyEarning,
      perSecondRate,
      totalEarned: 0,
      durationDays,
      daysRemaining: durationDays,
      startDate,
      endDate,
      payoutInterval: plan.payoutInterval || "Per Second (Live)",
      status: "Active",
      lastYieldSync: startDate,
    });

    // 6. Update User Wallet
    user.depositWallet = (user.depositWallet || 0) - numAmount;
    user.totalInvested = (user.totalInvested || 0) + numAmount;
    await user.save();

    // 7. Increment Plan Investors Count
    plan.investors = (plan.investors || 0) + 1;
    await plan.save();

    // 8. Create Transaction Log
    const txnId = `TXN-INV-${Date.now().toString().slice(-6)}`;
    await Transaction.create({
      customId: txnId,
      user: user._id,
      userName: user.name,
      userCustomId: user.customId,
      userEmail: user.email,
      country: user.country || "Global",
      type: "Plan Investment",
      amount: numAmount,
      rawAmount: numAmount,
      netAmount: numAmount,
      gateway: `${plan.name} (${plan.roi}% APY)`,
      referenceNo: invCustomId,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString("en-US", { hour12: false }),
      status: "Completed",
    });

    // 9. Traversal & Credit 5-Tier Referral Commissions
    await distributeReferralCommissions(user, numAmount);

    // 10. Re-sync user totals
    await syncUserStreamingEarnings(user._id);

    res.status(201).json({
      success: true,
      message: `Successfully invested $${numAmount.toLocaleString()} in ${plan.name}! Real-time yield streaming is active.`,
      investment,
      newDepositWalletBalance: user.depositWallet,
    });
  } catch (error) {
    console.error("Error in investInPlan:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Investor's Portfolio / Active Contracts
// @route   GET /api/user/investments/my-investments
exports.getMyInvestments = async (req, res) => {
  try {
    const userId = req.user._id;

    // Sync streaming ROI
    await syncUserStreamingEarnings(userId);

    const investments = await UserInvestment.find({ user: userId }).sort({ createdAt: -1 });

    const totalInvested = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalEarned = investments.reduce((sum, inv) => sum + (inv.totalEarned || 0), 0);
    const activeContracts = investments.filter((inv) => inv.status === "Active");
    const totalDailyEarning = activeContracts.reduce((sum, inv) => sum + (inv.dailyEarning || 0), 0);

    res.status(200).json({
      success: true,
      count: investments.length,
      summary: {
        totalInvested,
        totalEarned,
        activeContractsCount: activeContracts.length,
        totalDailyEarning,
      },
      investments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single user investment contract details
// @route   GET /api/user/investments/:id
exports.getInvestmentById = async (req, res) => {
  try {
    const investment = await UserInvestment.findOne({
      $or: [{ _id: req.params.id }, { customId: req.params.id }],
      user: req.user._id,
    });

    if (!investment) {
      return res.status(404).json({ success: false, message: "Investment contract not found." });
    }

    res.status(200).json({ success: true, investment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

