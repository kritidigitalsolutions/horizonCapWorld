const ReferralSetting = require("../../models/ReferralSetting");
const User = require("../../models/User");
const AdminSettings = require("../../models/AdminSettings");

// @desc    Get All Referral Commission Settings & Global Toggles
// @route   GET /api/admin/referrals/settings
exports.getReferralSettings = async (req, res) => {
  try {
    const settings = await ReferralSetting.find().sort({ levelNumber: 1 });
    const activePromotersCount = await User.countDocuments({ totalReferrals: { $gt: 0 } });
    const totalPlatformVolume = await User.aggregate([
      { $group: { _id: null, total: { $sum: "$totalInvested" } } },
    ]);
    const totalVol = totalPlatformVolume[0]?.total || 0;

    let adminSettings = await AdminSettings.findOne();
    if (!adminSettings) {
      adminSettings = await AdminSettings.create({});
    }

    const dynamicSettings = settings.map((s) => {
      const plain = s.toObject ? s.toObject() : { ...s };
      return {
        ...plain,
        activePromoters: plain.activePromoters > 0 ? plain.activePromoters : activePromotersCount,
        totalVolume: plain.totalVolume && plain.totalVolume !== "$0" ? plain.totalVolume : `$${totalVol.toLocaleString()}`,
        status: plain.status || "Active",
      };
    });

    res.status(200).json({
      success: true,
      settings: dynamicSettings,
      toggles: {
        referralDepositCommissionEnabled: adminSettings.referralDepositCommissionEnabled !== false,
        referralRoiShareEnabled: adminSettings.referralRoiShareEnabled !== false,
        referralSystemEnabled: adminSettings.referralSystemEnabled !== false,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Global Referral Toggles (Deposit Commission, ROI Profit Share, Master System)
// @route   PUT /api/admin/referrals/toggles
exports.updateReferralToggles = async (req, res) => {
  try {
    const { referralDepositCommissionEnabled, referralRoiShareEnabled, referralSystemEnabled } = req.body;

    let adminSettings = await AdminSettings.findOne();
    if (!adminSettings) {
      adminSettings = new AdminSettings();
    }

    if (referralDepositCommissionEnabled !== undefined) {
      adminSettings.referralDepositCommissionEnabled = Boolean(referralDepositCommissionEnabled);
    }
    if (referralRoiShareEnabled !== undefined) {
      adminSettings.referralRoiShareEnabled = Boolean(referralRoiShareEnabled);
    }
    if (referralSystemEnabled !== undefined) {
      adminSettings.referralSystemEnabled = Boolean(referralSystemEnabled);
    }

    await adminSettings.save();

    res.status(200).json({
      success: true,
      message: "Referral commission toggles updated successfully.",
      toggles: {
        referralDepositCommissionEnabled: adminSettings.referralDepositCommissionEnabled,
        referralRoiShareEnabled: adminSettings.referralRoiShareEnabled,
        referralSystemEnabled: adminSettings.referralSystemEnabled,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a New Referral Tier Level (Level 6+)
// @route   POST /api/admin/referrals/tiers
exports.createReferralTier = async (req, res) => {
  try {
    let { levelNumber, name, investCommission, earningsCommission, status } = req.body;

    if (!levelNumber) {
      const highest = await ReferralSetting.findOne().sort({ levelNumber: -1 });
      levelNumber = highest ? highest.levelNumber + 1 : 1;
    } else {
      levelNumber = parseInt(levelNumber, 10);
    }

    const levelCode = `L${levelNumber}`;

    const existing = await ReferralSetting.findOne({
      $or: [{ level: levelCode }, { levelNumber }],
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Referral tier level ${levelCode} (Level ${levelNumber}) already exists.`,
      });
    }

    const investRate = parseFloat(String(investCommission || "1").replace("%", "")) || 1;
    const earnRate = parseFloat(String(earningsCommission || "1").replace("%", "")) || 1;

    const newTier = await ReferralSetting.create({
      level: levelCode,
      levelNumber,
      name: name || `Network Expansion Tier (Level ${levelNumber})`,
      investCommission: `${investRate}%`,
      investCommissionRate: investRate,
      earningsCommission: `${earnRate}%`,
      earningsCommissionRate: earnRate,
      status: status || "Active",
      activePromoters: 0,
      totalVolume: "$0",
    });

    res.status(201).json({
      success: true,
      message: `Referral tier ${newTier.level} (${newTier.name}) created successfully.`,
      tier: newTier,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Referral Commission Setting for a specific Tier
// @route   PUT /api/admin/referrals/settings/:id
exports.updateReferralSetting = async (req, res) => {
  try {
    const { name, investCommission, earningsCommission, status } = req.body;
    let setting = await ReferralSetting.findById(req.params.id);

    if (!setting) {
      // Also allow finding by level code (e.g. 'L1', 'L2')
      setting = await ReferralSetting.findOne({ level: req.params.id });
    }

    if (!setting) {
      return res.status(404).json({ success: false, message: "Referral tier setting not found." });
    }

    if (name) {
      setting.name = name;
    }

    if (investCommission !== undefined) {
      const rate = parseFloat(String(investCommission).replace("%", "")) || 0;
      setting.investCommission = `${rate}%`;
      setting.investCommissionRate = rate;
    }

    if (earningsCommission !== undefined) {
      const rate = parseFloat(String(earningsCommission).replace("%", "")) || 0;
      setting.earningsCommission = `${rate}%`;
      setting.earningsCommissionRate = rate;
    }

    if (status && ["Active", "Inactive"].includes(status)) {
      setting.status = status;
    }

    await setting.save();

    res.status(200).json({
      success: true,
      message: `${setting.name} commission rates updated successfully.`,
      setting,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a Referral Tier (Only Custom Tiers, e.g. Level > 1)
// @route   DELETE /api/admin/referrals/tiers/:id
exports.deleteReferralTier = async (req, res) => {
  try {
    let setting = await ReferralSetting.findById(req.params.id);
    if (!setting) {
      setting = await ReferralSetting.findOne({ level: req.params.id });
    }

    if (!setting) {
      return res.status(404).json({ success: false, message: "Referral tier not found." });
    }

    if (setting.levelNumber <= 1) {
      return res.status(400).json({
        success: false,
        message: "Level 1 (Direct Referral Tier) cannot be deleted as it is the core referral tier.",
      });
    }

    await ReferralSetting.findByIdAndDelete(setting._id);

    res.status(200).json({
      success: true,
      message: `Referral tier ${setting.level} (${setting.name}) deleted successfully.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Promoters Network Matrix & Calculations
// @route   GET /api/admin/referrals/promoters
exports.getPromotersNetwork = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { customId: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query).select("-password").sort({ totalReferrals: -1 });

    const promoters = users.map((u) => {
      const rawInvest = u.totalInvested || 0;
      const teamVolume = rawInvest * (u.totalReferrals > 0 ? u.totalReferrals * 1.8 + 1 : 0);
      const directComm = teamVolume * 0.5 * 0.05; // Level 1 @ 5%
      const multiTierComm = teamVolume * 0.5 * 0.035; // L2-L5 avg 3.5%
      const totalComm = directComm + multiTierComm;

      return {
        id: u._id,
        customId: u.customId || "HORIZON-USR-01",
        name: u.name,
        email: u.email,
        phone: u.phone,
        country: u.country,
        status: u.status,
        totalReferrals: u.totalReferrals || 0,
        directReferrals: u.directReferrals || 0,
        invested: rawInvest,
        teamVolume: Math.round(teamVolume),
        directComm: Math.round(directComm),
        multiTierComm: Math.round(multiTierComm),
        totalComm: Math.round(totalComm),
      };
    });

    res.status(200).json({ success: true, count: promoters.length, promoters });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
