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
      roi,
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

    if (!name || roi === undefined || !minAmount) {
      return res.status(400).json({
        success: false,
        message: "Plan name, Monthly ROI %, and minimum amount are required.",
      });
    }

    const numMin = Number(minAmount) || 1000;
    const numRoi = Number(roi) || 1.5;
    // Calculate per-second streaming rate from Monthly ROI %
    const secRate = ((numMin * (numRoi / 100)) / (30 * 86400)).toFixed(6);

    const isInf = !!isInfinite || duration === "Infinite / Lifetime";
    const finalDuration = isInf ? "Infinite / Lifetime" : (duration || "12 Months");
    const finalDurationDays = isInf ? 0 : (Number(durationDays) || 365);

    const newPlan = await InvestmentPlan.create({
      name,
      category: category || "Renewable Energy",
      roi: numRoi,
      roiPerSec: `$${secRate} / sec`,
      duration: finalDuration,
      durationDays: finalDurationDays,
      isInfinite: isInf,
      minAmount: numMin,
      maxAmount: noMaxLimit ? null : Number(maxAmount) || 50000,
      noMaxLimit: !!noMaxLimit,
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
      roi,
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
    if (roi !== undefined) plan.roi = Number(roi);
    if (isInfinite !== undefined) plan.isInfinite = !!isInfinite;
    if (duration !== undefined) plan.duration = duration;
    if (durationDays !== undefined) plan.durationDays = plan.isInfinite ? 0 : Number(durationDays);
    if (minAmount !== undefined) plan.minAmount = Number(minAmount);
    if (maxAmount !== undefined) plan.maxAmount = noMaxLimit ? null : Number(maxAmount);
    if (noMaxLimit !== undefined) plan.noMaxLimit = !!noMaxLimit;
    if (payoutInterval !== undefined) plan.payoutInterval = payoutInterval;
    if (status !== undefined) plan.status = status;
    if (description !== undefined) plan.description = description;

    // Recalculate roiPerSec based on monthly ROI
    const secRate = ((plan.minAmount * (plan.roi / 100)) / (30 * 86400)).toFixed(6);
    plan.roiPerSec = `$${secRate} / sec`;

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
