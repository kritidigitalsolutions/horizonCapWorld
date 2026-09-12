const ReferralSetting = require("../../models/ReferralSetting");
const User = require("../../models/User");
const Transaction = require("../../models/Transaction");
const AdminSettings = require("../../models/AdminSettings");

// @desc    Get All Referral Commission Settings & Global Toggles (100% Dynamic Stats)
// @route   GET /api/admin/referrals/settings
exports.getReferralSettings = async (req, res) => {
  try {
    const [settings, allUsers] = await Promise.all([
      ReferralSetting.find().sort({ levelNumber: 1 }),
      User.find().select("customId sponsorId totalInvested totalReferrals"),
    ]);

    let adminSettings = await AdminSettings.findOne();
    if (!adminSettings) {
      adminSettings = await AdminSettings.create({});
    }

    // Map parent to direct children
    const childrenMap = new Map();
    allUsers.forEach((u) => {
      if (u.sponsorId && u.sponsorId !== "HORIZON-HQ") {
        if (!childrenMap.has(u.sponsorId)) {
          childrenMap.set(u.sponsorId, []);
        }
        childrenMap.get(u.sponsorId).push(u);
      }
    });

    // Compute dynamic stats per level across all platform users
    const levelStats = {};
    settings.forEach((s) => {
      levelStats[s.levelNumber] = { activePromoters: new Set(), totalVolume: 0 };
    });

    allUsers.forEach((rootUser) => {
      let currentTierUsers = childrenMap.get(rootUser.customId) || [];
      for (let lvl = 1; lvl <= settings.length; lvl++) {
        if (currentTierUsers.length === 0) break;
        if (levelStats[lvl]) {
          levelStats[lvl].activePromoters.add(rootUser.customId);
          const lvlVol = currentTierUsers.reduce((sum, ch) => sum + (ch.totalInvested || 0), 0);
          levelStats[lvl].totalVolume += lvlVol;
        }
        // Advance to next downline level
        const nextTierUsers = [];
        currentTierUsers.forEach((ch) => {
          const nextKids = childrenMap.get(ch.customId);
          if (nextKids) nextTierUsers.push(...nextKids);
        });
        currentTierUsers = nextTierUsers;
      }
    });

    const dynamicSettings = settings.map((s) => {
      const plain = s.toObject ? s.toObject() : { ...s };
      const stats = levelStats[plain.levelNumber] || { activePromoters: new Set(), totalVolume: 0 };
      const promotersCount = stats.activePromoters.size;
      const volNum = stats.totalVolume;

      return {
        ...plain,
        activePromoters: promotersCount,
        totalVolume: `$${volNum.toLocaleString()}`,
        volumeRaw: volNum,
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
    let {
      levelNumber,
      name,
      investCommission,
      earningsCommission,
      depositAmount,
      profitAmount,
      roiPerDay,
      groupVolumeMin,
      directClientsMin,
      eligibleConditions,
      levelTitle,
      status
    } = req.body;

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
      depositAmount: Number(depositAmount) || 0,
      profitAmount: Number(profitAmount) || 0,
      roiPerDay: Number(roiPerDay) || 0.08,
      groupVolumeMin: Number(groupVolumeMin) || 0,
      directClientsMin: Number(directClientsMin) || 0,
      eligibleConditions: eligibleConditions || (directClientsMin || groupVolumeMin ? `Group Volume Min. ${Number(groupVolumeMin || 0).toLocaleString()}$, ${directClientsMin || 0} Direct Clients` : "No Condition"),
      levelTitle: levelTitle || `Level ${levelNumber}`,
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
    const {
      name,
      investCommission,
      earningsCommission,
      depositAmount,
      profitAmount,
      roiPerDay,
      groupVolumeMin,
      directClientsMin,
      eligibleConditions,
      levelTitle,
      status
    } = req.body;

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

    if (depositAmount !== undefined) {
      setting.depositAmount = Number(depositAmount) || 0;
    }

    if (profitAmount !== undefined) {
      setting.profitAmount = Number(profitAmount) || 0;
    }

    if (roiPerDay !== undefined) {
      setting.roiPerDay = Number(roiPerDay) || 0;
    }

    if (groupVolumeMin !== undefined) {
      setting.groupVolumeMin = Number(groupVolumeMin) || 0;
    }

    if (directClientsMin !== undefined) {
      setting.directClientsMin = Number(directClientsMin) || 0;
    }

    if (eligibleConditions !== undefined) {
      setting.eligibleConditions = String(eligibleConditions);
    }

    if (levelTitle !== undefined) {
      setting.levelTitle = String(levelTitle);
    }

    if (status && ["Active", "Inactive"].includes(status)) {
      setting.status = status;
    }

    await setting.save();

    res.status(200).json({
      success: true,
      message: `${setting.name || setting.level} settings updated successfully.`,
      setting,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Bulk Update All Referral Settings / Level ROI Plans
// @route   PUT /api/admin/referrals/bulk-settings
exports.bulkUpdateReferralSettings = async (req, res) => {
  try {
    const { tiers } = req.body;
    if (!Array.isArray(tiers) || tiers.length === 0) {
      return res.status(400).json({ success: false, message: "Tiers array is required for bulk update." });
    }

    const updated = [];
    for (const item of tiers) {
      const levelId = item._id || item.id;
      let doc;
      if (levelId) {
        doc = await ReferralSetting.findById(levelId);
      }
      if (!doc && item.level) {
        doc = await ReferralSetting.findOne({ level: item.level });
      }
      if (!doc && item.levelNumber) {
        doc = await ReferralSetting.findOne({ levelNumber: item.levelNumber });
      }

      if (doc) {
        if (item.depositAmount !== undefined) doc.depositAmount = Number(item.depositAmount) || 0;
        if (item.profitAmount !== undefined) doc.profitAmount = Number(item.profitAmount) || 0;
        if (item.roiPerDay !== undefined) doc.roiPerDay = Number(item.roiPerDay) || 0;
        if (item.eligibleConditions !== undefined) doc.eligibleConditions = String(item.eligibleConditions);
        if (item.groupVolumeMin !== undefined) doc.groupVolumeMin = Number(item.groupVolumeMin) || 0;
        if (item.directClientsMin !== undefined) doc.directClientsMin = Number(item.directClientsMin) || 0;
        if (item.name) doc.name = item.name;
        if (item.status) doc.status = item.status;
        if (item.investCommission !== undefined) {
          const rate = parseFloat(String(item.investCommission).replace("%", "")) || 0;
          doc.investCommission = `${rate}%`;
          doc.investCommissionRate = rate;
        }
        if (item.earningsCommission !== undefined) {
          const rate = parseFloat(String(item.earningsCommission).replace("%", "")) || 0;
          doc.earningsCommission = `${rate}%`;
          doc.earningsCommissionRate = rate;
        }
        await doc.save();
        updated.push(doc);
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully updated ${updated.length} referral tier settings.`,
      settings: updated,
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

// @desc    Get Promoters Network Matrix & Calculations (100% Dynamic from DB)
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

    const [users, allUsers, allBonusTxns, tiers] = await Promise.all([
      User.find(query).select("-password"),
      User.find().select("customId sponsorId name email phone country totalInvested createdAt status"),
      Transaction.find({ type: "Referral Bonus", status: "Approved" }),
      ReferralSetting.find().sort({ levelNumber: 1 }),
    ]);

    // Build downline adjacency map
    const childrenMap = new Map();
    allUsers.forEach((u) => {
      if (u.sponsorId) {
        if (!childrenMap.has(u.sponsorId)) childrenMap.set(u.sponsorId, []);
        childrenMap.get(u.sponsorId).push(u);
      }
    });

    // Map transactions by user id / customId
    const bonusMap = new Map();
    allBonusTxns.forEach((t) => {
      const uId = String(t.user || t.userCustomId);
      const uCustom = String(t.userCustomId || "");
      const targets = [uId, uCustom].filter(Boolean);

      targets.forEach((key) => {
        if (!bonusMap.has(key)) {
          bonusMap.set(key, { direct: 0, multiTier: 0, total: 0 });
        }
      });

      const b = bonusMap.get(uId) || bonusMap.get(uCustom);
      const amt = Number(t.amount || 0);
      if (b) {
        b.total += amt;
        const ref = String(t.referenceNo || t.note || "");
        if (ref.includes("L1") || ref.includes("Level 1") || (t.gateway && t.gateway.toLowerCase().includes("direct"))) {
          b.direct += amt;
        } else {
          b.multiTier += amt;
        }
      }
    });

    const maxLevels = tiers.length || 11;

    const promoters = users.map((u) => {
      const uIdStr = String(u._id);
      const uCustomId = u.customId || "";
      const directUsers = childrenMap.get(uCustomId) || [];
      const directCount = directUsers.length;

      // Compute multi-tier downline structure for this user
      const levelBreakdown = [];
      let currentLevelUsers = directUsers;
      let totalTeamVolume = 0;
      let totalTeamCount = 0;

      for (let lvl = 1; lvl <= maxLevels; lvl++) {
        const count = currentLevelUsers.length;
        const volume = currentLevelUsers.reduce((sum, ch) => sum + (ch.totalInvested || 0), 0);
        totalTeamCount += count;
        totalTeamVolume += volume;

        levelBreakdown.push({
          level: `L${lvl}`,
          levelNumber: lvl,
          count,
          volume,
          members: currentLevelUsers.map((m) => ({
            id: m.customId,
            name: m.name,
            email: m.email,
            phone: m.phone,
            country: m.country,
            invested: m.totalInvested || 0,
            status: m.status || "Active",
            joined: m.createdAt ? m.createdAt.toISOString().split("T")[0] : "",
          })),
        });

        // Next level
        const nextLevelUsers = [];
        currentLevelUsers.forEach((ch) => {
          const nextKids = childrenMap.get(ch.customId);
          if (nextKids) nextLevelUsers.push(...nextKids);
        });
        currentLevelUsers = nextLevelUsers;
      }

      const bonuses = bonusMap.get(uIdStr) || bonusMap.get(uCustomId) || { direct: 0, multiTier: 0, total: 0 };

      return {
        id: u._id,
        customId: u.customId || "HORIZON-USR-01",
        name: u.name,
        email: u.email,
        phone: u.phone,
        country: u.country,
        status: u.status,
        sponsor: u.sponsorId || "Direct Platform",
        totalReferrals: directCount,
        totalTeamCount,
        directReferrals: directCount,
        invested: u.totalInvested || 0,
        teamVolume: Math.round(totalTeamVolume),
        directComm: Math.round(bonuses.direct),
        multiTierComm: Math.round(bonuses.multiTier),
        totalComm: Math.round(bonuses.total),
        levelBreakdown,
      };
    });

    // Sort by totalReferrals descending or teamVolume
    promoters.sort((a, b) => b.totalReferrals - a.totalReferrals || b.teamVolume - a.teamVolume);

    res.status(200).json({ success: true, count: promoters.length, promoters });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
