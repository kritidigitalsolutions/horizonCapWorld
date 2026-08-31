const ReferralSetting = require("../../models/ReferralSetting");
const User = require("../../models/User");

// @desc    Get All Referral Commission Settings (5 Tiers)
// @route   GET /api/admin/referrals/settings
exports.getReferralSettings = async (req, res) => {
  try {
    const settings = await ReferralSetting.find().sort({ levelNumber: 1 });
    res.status(200).json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Referral Commission Setting for a specific Tier
// @route   PUT /api/admin/referrals/settings/:id
exports.updateReferralSetting = async (req, res) => {
  try {
    const { investCommission, earningsCommission } = req.body;
    const setting = await ReferralSetting.findById(req.params.id);

    if (!setting) {
      return res.status(404).json({ success: false, message: "Referral tier setting not found." });
    }

    if (investCommission) {
      setting.investCommission = investCommission.includes("%") ? investCommission : `${investCommission}%`;
      setting.investCommissionRate = parseFloat(investCommission) || 5;
    }

    if (earningsCommission) {
      setting.earningsCommission = earningsCommission.includes("%") ? earningsCommission : `${earningsCommission}%`;
      setting.earningsCommissionRate = parseFloat(earningsCommission) || 5;
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
