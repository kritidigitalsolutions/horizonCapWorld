const InvestmentPlan = require("../../models/InvestmentPlan");

// @desc    Get All Investment Plans (with search & category filter)
// @route   GET /api/admin/plans
exports.getAllPlans = async (req, res) => {
  try {
    const { search, category, status } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    if (category && category !== "all") {
      query.category = category;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    const plans = await InvestmentPlan.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: plans.length, plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Single Plan by ID
// @route   GET /api/admin/plans/:id
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

// @desc    Create New Investment Plan
// @route   POST /api/admin/plans
exports.createPlan = async (req, res) => {
  try {
    const {
      name,
      category,
      roiType,
      roi,
      dailyRoi,
      roiSlabs,
      loyaltyBonusEnabled,
      loyaltyBonusTitle,
      loyaltyBonusDescription,
      loyaltyBonusSlabs,
      duration,
      durationDays,
      isInfinite,
      minAmount,
      maxAmount,
      noMaxLimit,
      payoutInterval,
      status,
      description,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Plan name is required.",
      });
    }

    const type = roiType === "fixed" ? "fixed" : "slab";

    // Process slabs if slab type
    let processedSlabs = [];
    if (type === "slab" && Array.isArray(roiSlabs) && roiSlabs.length > 0) {
      processedSlabs = roiSlabs.map((s) => {
        const d = Number(s.dailyRoi) || 0;
        return {
          minAmount: Number(s.minAmount) || 0,
          maxAmount: s.noMaxLimit ? null : Number(s.maxAmount) || null,
          noMaxLimit: !!s.noMaxLimit || !s.maxAmount,
          dailyRoi: d,
          monthlyRoi: Number((d * 30).toFixed(2)),
          annualRoi: Number((d * 360).toFixed(2)),
        };
      });
    }

    // Process loyalty bonus slabs
    let processedLoyaltySlabs = undefined;
    if (Array.isArray(loyaltyBonusSlabs) && loyaltyBonusSlabs.length > 0) {
      processedLoyaltySlabs = loyaltyBonusSlabs.map((ls) => ({
        days: Number(ls.days) || 30,
        bonusPercentage: Number(ls.bonusPercentage) || 0.5,
        label: ls.label || `${ls.days} Days`,
      }));
    }

    const numMin =
      type === "slab" && processedSlabs.length > 0
        ? processedSlabs[0].minAmount
        : Number(minAmount) || 10;

    const numDailyRoi =
      type === "slab" && processedSlabs.length > 0
        ? processedSlabs[0].dailyRoi
        : dailyRoi !== undefined
        ? Number(dailyRoi)
        : roi !== undefined
        ? Number(roi) / 30
        : 0.25;

    const numMonthlyRoi = Number((numDailyRoi * 30).toFixed(2));

    const isInf = !!isInfinite || duration === "Infinite / Lifetime";
    const finalDuration = isInf ? "Infinite / Lifetime" : (duration || "12 Months");
    const finalDurationDays = isInf ? 0 : (Number(durationDays) || 365);

    const hasNoMaxLimit =
      type === "slab" && processedSlabs.length > 0
        ? processedSlabs[processedSlabs.length - 1].noMaxLimit
        : !!noMaxLimit;

    const finalMaxAmount = hasNoMaxLimit ? null : Number(maxAmount) || null;

    const newPlan = await InvestmentPlan.create({
      name,
      category: category || "Renewable Energy",
      roiType: type,
      roi: numMonthlyRoi,
      dailyRoi: numDailyRoi,
      roiSlabs: processedSlabs.length > 0 ? processedSlabs : undefined,
      loyaltyBonusEnabled: loyaltyBonusEnabled !== undefined ? Boolean(loyaltyBonusEnabled) : true,
      loyaltyBonusTitle: loyaltyBonusTitle || "Reward ( Loyalty Bonus )",
      loyaltyBonusDescription: loyaltyBonusDescription || "Based on Capital not Withdrawn from the Account One time benefit directly given to the wallet",
      loyaltyBonusSlabs: processedLoyaltySlabs,
      duration: finalDuration,
      durationDays: finalDurationDays,
      isInfinite: isInf,
      minAmount: numMin,
      maxAmount: finalMaxAmount,
      noMaxLimit: hasNoMaxLimit,
      payoutInterval: payoutInterval || "Per Second (Live)",
      status: status || "Active",
      description: description || "",
    });

    res.status(201).json({
      success: true,
      message: "Investment plan created successfully.",
      plan: newPlan,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Existing Investment Plan
// @route   PUT /api/admin/plans/:id
exports.updatePlan = async (req, res) => {
  try {
    const plan = await InvestmentPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: "Investment plan not found." });
    }

    const {
      name,
      category,
      roiType,
      roi,
      dailyRoi,
      roiSlabs,
      loyaltyBonusEnabled,
      loyaltyBonusTitle,
      loyaltyBonusDescription,
      loyaltyBonusSlabs,
      duration,
      durationDays,
      isInfinite,
      minAmount,
      maxAmount,
      noMaxLimit,
      payoutInterval,
      status,
      description,
    } = req.body;

    if (name !== undefined) plan.name = name;
    if (category !== undefined) plan.category = category;
    if (roiType !== undefined) plan.roiType = roiType;

    if (roiSlabs !== undefined && Array.isArray(roiSlabs)) {
      plan.roiSlabs = roiSlabs.map((s) => {
        const d = Number(s.dailyRoi) || 0;
        return {
          minAmount: Number(s.minAmount) || 0,
          maxAmount: s.noMaxLimit ? null : Number(s.maxAmount) || null,
          noMaxLimit: !!s.noMaxLimit || !s.maxAmount,
          dailyRoi: d,
          monthlyRoi: Number((d * 30).toFixed(2)),
          annualRoi: Number((d * 360).toFixed(2)),
        };
      });

      if (plan.roiType === "slab" && plan.roiSlabs.length > 0) {
        plan.dailyRoi = plan.roiSlabs[0].dailyRoi;
        plan.roi = plan.roiSlabs[0].monthlyRoi;
        plan.minAmount = plan.roiSlabs[0].minAmount;
        const lastSlab = plan.roiSlabs[plan.roiSlabs.length - 1];
        if (lastSlab?.noMaxLimit) {
          plan.noMaxLimit = true;
          plan.maxAmount = null;
        } else if (lastSlab?.maxAmount) {
          plan.maxAmount = lastSlab.maxAmount;
          plan.noMaxLimit = false;
        }
      }
    }

    if (loyaltyBonusEnabled !== undefined) {
      plan.loyaltyBonusEnabled = Boolean(loyaltyBonusEnabled);
    }
    if (loyaltyBonusTitle !== undefined) {
      plan.loyaltyBonusTitle = loyaltyBonusTitle;
    }
    if (loyaltyBonusDescription !== undefined) {
      plan.loyaltyBonusDescription = loyaltyBonusDescription;
    }
    if (loyaltyBonusSlabs !== undefined && Array.isArray(loyaltyBonusSlabs)) {
      plan.loyaltyBonusSlabs = loyaltyBonusSlabs.map((ls) => ({
        days: Number(ls.days) || 30,
        bonusPercentage: Number(ls.bonusPercentage) || 0.5,
        label: ls.label || `${ls.days} Days`,
      }));
    }

    if (dailyRoi !== undefined) {
      plan.dailyRoi = Number(dailyRoi);
      plan.roi = Number((Number(dailyRoi) * 30).toFixed(2));
    } else if (roi !== undefined) {
      plan.roi = Number(roi);
      plan.dailyRoi = Number((Number(roi) / 30).toFixed(4));
    }

    if (isInfinite !== undefined) plan.isInfinite = !!isInfinite;
    if (duration !== undefined) plan.duration = duration;
    if (durationDays !== undefined) plan.durationDays = plan.isInfinite ? 0 : Number(durationDays);
    if (minAmount !== undefined) plan.minAmount = Number(minAmount);
    if (maxAmount !== undefined) plan.maxAmount = noMaxLimit ? null : Number(maxAmount);
    if (noMaxLimit !== undefined) plan.noMaxLimit = !!noMaxLimit;
    if (payoutInterval !== undefined) plan.payoutInterval = payoutInterval;
    if (status !== undefined) plan.status = status;
    if (description !== undefined) plan.description = description;

    await plan.save();

    res.status(200).json({
      success: true,
      message: "Investment plan updated successfully.",
      plan,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Investment Plan
// @route   DELETE /api/admin/plans/:id
exports.deletePlan = async (req, res) => {
  try {
    const plan = await InvestmentPlan.findByIdAndDelete(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: "Investment plan not found." });
    }
    res.status(200).json({
      success: true,
      message: "Investment plan deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
