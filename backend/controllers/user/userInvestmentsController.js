const InvestmentPlan = require("../../models/InvestmentPlan");
const UserInvestment = require("../../models/UserInvestment");
const User = require("../../models/User");
const Transaction = require("../../models/Transaction");

// @desc    Get All Active Investment Plans
// @route   GET /api/user/plans
exports.getPlans = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = { status: "Active" };

    if (category && category !== "all") {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const plans = await InvestmentPlan.find(query).sort({ minAmount: 1 });
    res.status(200).json({ success: true, count: plans.length, plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Single Plan by ID
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

// @desc    Invest in a Plan
// @route   POST /api/user/investments
exports.investInPlan = async (req, res) => {
  try {
    const { planId, amount } = req.body;
    const investAmount = Number(amount);

    if (!planId || !investAmount || investAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid plan ID and investment amount are required.",
      });
    }

    const plan = await InvestmentPlan.findById(planId);
    if (!plan || plan.status !== "Active") {
      return res.status(404).json({
        success: false,
        message: "Selected investment plan is currently unavailable or inactive.",
      });
    }

    // Validate minimum and maximum amounts
    if (investAmount < plan.minAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum investment for this plan is $${plan.minAmount.toLocaleString()} USD.`,
      });
    }

    if (!plan.noMaxLimit && plan.maxAmount && investAmount > plan.maxAmount) {
      return res.status(400).json({
        success: false,
        message: `Maximum investment for this plan is $${plan.maxAmount.toLocaleString()} USD.`,
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Investor account not found." });
    }

    // Check wallet balance
    if ((user.depositWallet || 0) < investAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient Deposit Wallet balance ($${(user.depositWallet || 0).toLocaleString()} USD). Please deposit funds first.`,
      });
    }

    // Deduct from depositWallet and increase totalInvested
    user.depositWallet -= investAmount;
    user.totalInvested = (user.totalInvested || 0) + investAmount;

    // Monthly ROI % to daily & per second calculations
    const dailyEarning = (investAmount * (plan.roi / 100)) / 30;
    const perSecondRate = dailyEarning / 86400;

    user.dailyEarning = parseFloat(((user.dailyEarning || 0) + dailyEarning).toFixed(4));
    user.perSecondRate = parseFloat(((user.perSecondRate || 0) + perSecondRate).toFixed(8));

    // Create User Investment Record
    const newInvestment = await UserInvestment.create({
      user: user._id,
      userName: user.name,
      userEmail: user.email,
      plan: plan._id,
      planName: plan.name,
      planCategory: plan.category,
      amount: investAmount,
      roi: plan.roi,
      payoutInterval: plan.payoutInterval,
      duration: plan.duration,
      durationDays: plan.durationDays,
      isInfinite: plan.isInfinite,
      dailyEarning,
      perSecondRate,
      status: "Active",
      startDate: new Date(),
    });

    // Create Transaction Record
    const newTrx = await Transaction.create({
      user: user._id,
      userName: user.name,
      userCustomId: user.customId || "HORIZON-USR-01",
      userEmail: user.email,
      country: user.country,
      type: "ROI Return",
      amount: investAmount,
      rawAmount: investAmount,
      fee: 0,
      netAmount: investAmount,
      gateway: "Deposit Wallet",
      referenceNo: newInvestment.customId,
      status: "Approved",
      note: `Active contract allocated in ${plan.name} (${plan.category})`,
    });

    // Increment plan investors count
    plan.investors = (plan.investors || 0) + 1;
    await plan.save();
    await user.save();

    res.status(201).json({
      success: true,
      message: `Successfully invested $${investAmount.toLocaleString()} USD in ${plan.name}.`,
      investment: newInvestment,
      transaction: newTrx,
      user: {
        depositWallet: user.depositWallet,
        earningWallet: user.earningWallet,
        totalInvested: user.totalInvested,
        dailyEarning: user.dailyEarning,
        perSecondRate: user.perSecondRate,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Current User's Active & Historical Investments
// @route   GET /api/user/investments
exports.getMyInvestments = async (req, res) => {
  try {
    const { status, category } = req.query;
    let query = { user: req.user._id };

    if (status && status !== "all") {
      query.status = status;
    }

    if (category && category !== "all") {
      query.planCategory = category;
    }

    const investments = await UserInvestment.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: investments.length, investments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Single Investment Contract Details
// @route   GET /api/user/investments/:id
exports.getInvestmentById = async (req, res) => {
  try {
    const investment = await UserInvestment.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate("plan");

    if (!investment) {
      return res.status(404).json({ success: false, message: "Investment contract not found." });
    }

    res.status(200).json({ success: true, investment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
