const InvestmentPlan = require("../../models/InvestmentPlan");
const UserInvestment = require("../../models/UserInvestment");
const User = require("../../models/User");
const Transaction = require("../../models/Transaction");
const { distributeReferralCommissions, syncUserStreamingEarnings } = require("../../utils/yieldAndAffiliateEngine");

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
    const { planId, amount, autoRenewal } = req.body;
    const investAmount = Number(amount);
    const isAutoRenewal = Boolean(autoRenewal);

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

    // Determine effective ROI rate (Slab matching or fixed)
    let effectiveDailyRoi = plan.dailyRoi || (plan.roi ? plan.roi / 30 : 0.25);
    let effectiveMonthlyRoi = plan.roi || Number((effectiveDailyRoi * 30).toFixed(2));
    let effectiveAnnualRoi = Number((effectiveDailyRoi * 360).toFixed(2));
    let matchedSlab = null;

    if (plan.roiType === "slab" && Array.isArray(plan.roiSlabs) && plan.roiSlabs.length > 0) {
      matchedSlab = plan.roiSlabs.find((s) => {
        const min = Number(s.minAmount) || 0;
        const max = s.noMaxLimit || !s.maxAmount ? Infinity : Number(s.maxAmount);
        return investAmount >= min && investAmount <= max;
      });

      if (!matchedSlab) {
        const sorted = [...plan.roiSlabs].sort((a, b) => (b.minAmount || 0) - (a.minAmount || 0));
        if (sorted.length > 0 && investAmount >= sorted[0].minAmount) {
          matchedSlab = sorted[0];
        } else {
          matchedSlab = plan.roiSlabs[0];
        }
      }

      if (matchedSlab) {
        effectiveDailyRoi = Number(matchedSlab.dailyRoi);
        effectiveMonthlyRoi = matchedSlab.monthlyRoi || Number((effectiveDailyRoi * 30).toFixed(2));
        effectiveAnnualRoi = matchedSlab.annualRoi || Number((effectiveDailyRoi * 360).toFixed(2));
      }
    }

    // Auto Renewal Mode Incentive: +0.25% monthly boost on each slab
    if (isAutoRenewal) {
      effectiveMonthlyRoi = Number((effectiveMonthlyRoi + 0.25).toFixed(4));
      effectiveDailyRoi = Number((effectiveDailyRoi + (0.25 / 30)).toFixed(6));
      effectiveAnnualRoi = Number((effectiveAnnualRoi + 3.0).toFixed(2));
    }

    // Dynamic daily & per second calculations based on matched slab ROI
    const dailyEarning = investAmount * (effectiveDailyRoi / 100);
    const perSecondRate = dailyEarning / 86400;

    user.dailyEarning = parseFloat(((user.dailyEarning || 0) + dailyEarning).toFixed(4));
    user.perSecondRate = parseFloat(((user.perSecondRate || 0) + perSecondRate).toFixed(8));

    // Create User Investment Record
    const isInfinitePlan = Boolean(
      plan.isInfinite ||
      plan.duration === "Infinite / Lifetime" ||
      plan.duration === "Lifetime" ||
      plan.duration === "∞ Lifetime" ||
      plan.durationDays === 0
    );

    const newInvestment = await UserInvestment.create({
      user: user._id,
      userName: user.name,
      userEmail: user.email,
      plan: plan._id,
      planName: plan.name,
      planCategory: plan.category,
      amount: investAmount,
      dailyRoi: effectiveDailyRoi,
      roi: effectiveMonthlyRoi,
      annualRoi: effectiveAnnualRoi,
      slabApplied: matchedSlab
        ? {
            minAmount: matchedSlab.minAmount,
            maxAmount: matchedSlab.maxAmount,
            dailyRoi: matchedSlab.dailyRoi,
            monthlyRoi: matchedSlab.monthlyRoi,
            annualRoi: matchedSlab.annualRoi,
          }
        : undefined,
      autoRenewal: isAutoRenewal,
      autoRenewalIncentive: 0.25,
      isCompounding: isAutoRenewal,
      payoutInterval: plan.payoutInterval,
      duration: isInfinitePlan ? "Infinite / Lifetime" : (plan.duration || "12 Months"),
      durationDays: isInfinitePlan ? 0 : (plan.durationDays || 365),
      isInfinite: isInfinitePlan,
      dailyEarning,
      perSecondRate,
      status: "Active",
      startDate: new Date(),
      endDate: isInfinitePlan ? null : undefined,
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
      note: `Active contract allocated in ${plan.name} (${plan.category}) @ ${effectiveDailyRoi}% daily ROI${
        isAutoRenewal ? " (Auto Renewal Mode ON: +0.25%/mo Boost & Compounding)" : ""
      }`,
    });

    // Increment plan investors count
    plan.investors = (plan.investors || 0) + 1;
    await plan.save();
    await user.save();

    // Trigger multi-tier referral deposit commissions asynchronously
    distributeReferralCommissions(user._id, investAmount, "investment").catch((err) =>
      console.warn("[Affiliate] Investment commission distribution notice:", err.message)
    );

    res.status(201).json({
      success: true,
      message: `Successfully invested $${investAmount.toLocaleString()} USD in ${plan.name} at ${effectiveDailyRoi}% daily ROI${
        isAutoRenewal ? " with Auto Renewal +0.25%/mo Boost" : ""
      }.`,
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
    // Synchronize latest contract yields
    await syncUserStreamingEarnings(req.user);

    const { status, category } = req.query;
    let query = { user: req.user._id };

    if (status && status !== "all") {
      query.status = status;
    }

    if (category && category !== "all") {
      query.planCategory = category;
    }

    const rawInvestments = await UserInvestment.find(query).sort({ createdAt: -1 });
    
    const investments = rawInvestments.map(inv => {
      const isInf = Boolean(
        inv.isInfinite ||
        inv.duration === "Infinite / Lifetime" ||
        inv.duration === "Lifetime" ||
        inv.duration === "∞ Lifetime" ||
        inv.durationDays === 0
      );

      let daysRemaining = "Lifetime";
      if (!isInf && inv.endDate) {
        const diffMs = new Date(inv.endDate).getTime() - Date.now();
        daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      }

      return {
        ...inv.toObject(),
        isInfinite: isInf,
        daysRemaining,
      };
    });

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

// @desc    Toggle Auto-Renewal on an Active Investment
// @route   PUT /api/user/investments/:id/toggle-auto-renewal
exports.toggleAutoRenewal = async (req, res) => {
  try {
    const investment = await UserInvestment.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: "Active",
    });

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: "Active investment contract not found.",
      });
    }

    const currentAutoRenewal = Boolean(investment.autoRenewal);
    const newAutoRenewal = !currentAutoRenewal;

    // Base slab values
    const baseDailyRoi = investment.slabApplied?.dailyRoi || (currentAutoRenewal ? investment.dailyRoi - (0.25 / 30) : investment.dailyRoi);
    const baseMonthlyRoi = investment.slabApplied?.monthlyRoi || (currentAutoRenewal ? investment.roi - 0.25 : investment.roi);
    const baseAnnualRoi = investment.slabApplied?.annualRoi || (currentAutoRenewal ? investment.annualRoi - 3.0 : investment.annualRoi);

    const oldDailyEarning = investment.dailyEarning || 0;
    const oldPerSecRate = investment.perSecondRate || 0;

    if (newAutoRenewal) {
      investment.autoRenewal = true;
      investment.isCompounding = true;
      investment.autoRenewalIncentive = 0.25;
      investment.roi = Number((baseMonthlyRoi + 0.25).toFixed(4));
      investment.dailyRoi = Number((baseDailyRoi + (0.25 / 30)).toFixed(6));
      investment.annualRoi = Number((baseAnnualRoi + 3.0).toFixed(2));
    } else {
      investment.autoRenewal = false;
      investment.isCompounding = false;
      investment.roi = Number(baseMonthlyRoi.toFixed(4));
      investment.dailyRoi = Number(baseDailyRoi.toFixed(6));
      investment.annualRoi = Number(baseAnnualRoi.toFixed(2));
    }

    const newDailyEarning = investment.amount * (investment.dailyRoi / 100);
    const newPerSecRate = newDailyEarning / 86400;

    investment.dailyEarning = newDailyEarning;
    investment.perSecondRate = newPerSecRate;
    await investment.save();

    // Adjust user totals
    const user = await User.findById(req.user._id);
    if (user) {
      user.dailyEarning = Math.max(0, parseFloat(((user.dailyEarning || 0) - oldDailyEarning + newDailyEarning).toFixed(4)));
      user.perSecondRate = Math.max(0, parseFloat(((user.perSecondRate || 0) - oldPerSecRate + newPerSecRate).toFixed(8)));
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: newAutoRenewal
        ? "Auto Renewal Mode activated! +0.25% monthly boost applied to contract yield."
        : "Auto Renewal Mode deactivated. Standard slab rates restored.",
      investment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
