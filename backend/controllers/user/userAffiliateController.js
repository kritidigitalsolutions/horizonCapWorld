const User = require("../../models/User");
const Rank = require("../../models/Rank");
const ReferralSetting = require("../../models/ReferralSetting");
const Transaction = require("../../models/Transaction");
const AdminSettings = require("../../models/AdminSettings");

// @desc    Get Referral Overview Stats (Link, Code, Direct & Team Numbers, Earnings, Toggles)
// @route   GET /api/user/referrals/overview
exports.getReferralOverview = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    let adminSettings = await AdminSettings.findOne();
    if (!adminSettings) {
      adminSettings = await AdminSettings.create({});
    }

    // Direct referrals (Level 1)
    const directUsers = await User.find({ sponsorId: user.customId }).select(
      "customId name email phone country totalInvested createdAt status"
    );

    const directInvestedTotal = directUsers.reduce(
      (sum, u) => sum + (u.totalInvested || 0),
      0
    );

    // Fetch referral bonus transactions strictly for this user
    const bonusTxns = await Transaction.find({
      user: user._id,
      type: { $in: ["Referral Bonus", "Rank Bonus"] },
      status: "Approved",
    });

    const totalCommission = bonusTxns.reduce((sum, t) => sum + (t.amount || 0), 0);
    const directCommission = bonusTxns
      .filter((t) => (t.customId || "").includes("L1") || (t.referenceNo || "").includes("L1") || (t.gateway || "").toLowerCase().includes("direct"))
      .reduce((sum, t) => sum + (t.amount || 0), 0) || (totalCommission * 0.6);
    const multiTierCommission = Math.max(0, totalCommission - directCommission);

    const origin = req.headers.origin || (req.headers.referer ? req.headers.referer.replace(/\/$/, "") : "https://horizoncapworlds.com");
    const referralLink = `${origin}/register?ref=${user.customId}`;

    res.status(200).json({
      success: true,
      data: {
        referralCode: user.customId,
        referralLink,
        sponsorId: user.sponsorId,
        directReferralsCount: directUsers.length,
        totalTeamCount: user.totalReferrals || directUsers.length,
        directTeamVolume: directInvestedTotal,
        totalTeamVolume: user.teamTurnover || directInvestedTotal,
        commissions: {
          totalEarned: totalCommission,
          directCommission,
          multiTierCommission,
        },
        toggles: {
          referralDepositCommissionEnabled: adminSettings.referralDepositCommissionEnabled !== false,
          referralRoiShareEnabled: adminSettings.referralRoiShareEnabled !== false,
          referralSystemEnabled: adminSettings.referralSystemEnabled !== false,
        },
        directMembers: directUsers,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Referral Commission Tier Structure (Dynamic Downline Calculation for N Levels)
// @route   GET /api/user/referrals/commissions
exports.getReferralCommissions = async (req, res) => {
  try {
    let tiers = await ReferralSetting.find().sort({ levelNumber: 1 });
    if (!tiers || tiers.length === 0) {
      tiers = [
        { level: "L1", levelNumber: 1, name: "Direct Referrals (Level 1)", investCommission: "5%", earningsCommission: "5%", investCommissionRate: 5, earningsCommissionRate: 5 },
        { level: "L2", levelNumber: 2, name: "Sub-Referrals (Level 2)", investCommission: "4%", earningsCommission: "4%", investCommissionRate: 4, earningsCommissionRate: 4 },
        { level: "L3", levelNumber: 3, name: "Network Tier (Level 3)", investCommission: "3%", earningsCommission: "3%", investCommissionRate: 3, earningsCommissionRate: 3 },
        { level: "L4", levelNumber: 4, name: "Network Tier (Level 4)", investCommission: "2%", earningsCommission: "2%", investCommissionRate: 2, earningsCommissionRate: 2 },
        { level: "L5", levelNumber: 5, name: "Global Depth (Level 5)", investCommission: "1%", earningsCommission: "1%", investCommissionRate: 1, earningsCommissionRate: 1 },
      ];
    }

    let adminSettings = await AdminSettings.findOne();
    if (!adminSettings) {
      adminSettings = await AdminSettings.create({});
    }

    // Dynamic downline statistics calculation across all tiers
    const levelStats = {};
    tiers.forEach((t) => {
      const lvl = t.levelNumber || 1;
      levelStats[lvl] = { count: 0, volume: 0 };
    });

    if (req.user && req.user.customId) {
      let currentParentIds = [req.user.customId];

      for (const tier of tiers) {
        const lvl = tier.levelNumber;
        if (!currentParentIds || currentParentIds.length === 0) {
          levelStats[lvl] = { count: 0, volume: 0 };
          continue;
        }

        const downlineUsers = await User.find({
          sponsorId: { $in: currentParentIds },
        }).select("customId totalInvested");

        const count = downlineUsers.length;
        const volume = downlineUsers.reduce((sum, u) => sum + (u.totalInvested || 0), 0);
        levelStats[lvl] = { count, volume };

        currentParentIds = downlineUsers.map((u) => u.customId).filter(Boolean);
      }
    }

    const dynamicTiers = tiers.map((t) => {
      const plain = t.toObject ? t.toObject() : { ...t };
      const lvl = plain.levelNumber || 1;
      const stats = levelStats[lvl] || { count: 0, volume: 0 };
      return {
        ...plain,
        activePromoters: stats.count,
        totalVolume: `$${Number(stats.volume).toLocaleString()}`,
        volumeRaw: stats.volume,
        status: plain.status || "Active",
      };
    });

    res.status(200).json({
      success: true,
      count: dynamicTiers.length,
      tiers: dynamicTiers,
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

// @desc    Get Multi-Tier Downline Network Tree (Dynamic N-Tier Deep)
// @route   GET /api/user/referrals/network
exports.getReferralNetwork = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    let adminSettings = await AdminSettings.findOne();
    if (!adminSettings) {
      adminSettings = await AdminSettings.create({});
    }

    // Load tiers from DB for exact rates
    let tiers = await ReferralSetting.find().sort({ levelNumber: 1 });
    if (!tiers || tiers.length === 0) {
      tiers = [
        { level: "L1", levelNumber: 1, investCommissionRate: 5 },
        { level: "L2", levelNumber: 2, investCommissionRate: 4 },
        { level: "L3", levelNumber: 3, investCommissionRate: 3 },
        { level: "L4", levelNumber: 4, investCommissionRate: 2 },
        { level: "L5", levelNumber: 5, investCommissionRate: 1 },
      ];
    }

    const getRateForLevel = (lvl) => {
      const found = tiers.find((t) => t.levelNumber === lvl);
      return found?.investCommissionRate ?? Math.max(1, 6 - lvl);
    };

    const formattedNetwork = [];
    const levelCounts = {};

    let currentParentIds = [user.customId];

    for (const tier of tiers) {
      const lvl = tier.levelNumber;
      levelCounts[`level${lvl}`] = 0;

      if (!currentParentIds || currentParentIds.length === 0) continue;

      const downlines = await User.find({
        sponsorId: { $in: currentParentIds },
      }).select("customId name email phone totalInvested sponsorId createdAt status");

      levelCounts[`level${lvl}`] = downlines.length;

      const rate = getRateForLevel(lvl);

      downlines.forEach((u) => {
        const invested = u.totalInvested || 0;
        const comm = (invested * rate) / 100;
        formattedNetwork.push({
          id: u.customId,
          name: u.name,
          email: u.email,
          phone: u.phone,
          level: lvl,
          sponsor: u.sponsorId,
          invested,
          directComm: lvl === 1 ? comm : 0,
          multiTierComm: lvl > 1 ? comm : 0,
          totalComm: comm,
          joined: u.createdAt ? u.createdAt.toISOString().split("T")[0] : "2026-01-01",
          status: u.status || "Active",
        });
      });

      currentParentIds = downlines.map((u) => u.customId).filter(Boolean);
    }

    res.status(200).json({
      success: true,
      levelCounts,
      count: formattedNetwork.length,
      network: formattedNetwork,
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

// @desc    Get 10-Tier Rank Progression Ladder
// @route   GET /api/user/ranks/ladder
exports.getRankLadder = async (req, res) => {
  try {
    let ranks = await Rank.find({ status: "Active" }).sort({ level: 1 });
    if (!ranks || ranks.length === 0) {
      ranks = [
        { level: 1, name: "Bronze Explorer", minInvest: 100, reward: 7.5, achievers: 4890, desc: "Entry leadership rank unlocked upon team initiation." },
        { level: 2, name: "Silver Vanguard", minInvest: 500, reward: 35, achievers: 2340, desc: "Proven team builder with active direct network." },
        { level: 3, name: "Gold Sovereign", minInvest: 2500, reward: 175, achievers: 1210, desc: "Established regional network promoter." },
        { level: 4, name: "Platinum Luminary", minInvest: 10000, reward: 700, achievers: 680, desc: "Senior network leader commanding high turnover." },
        { level: 5, name: "Sapphire Viceroy", minInvest: 50000, reward: 3500, achievers: 340, desc: "Elite portfolio leader with multi-tier downlines." },
        { level: 6, name: "Emerald Chancellor", minInvest: 150000, reward: 10500, achievers: 160, desc: "Continental executive commanding six-figure volume." },
        { level: 7, name: "Ruby High Commander", minInvest: 500000, reward: 35000, achievers: 72, desc: "Global leadership council member." },
        { level: 8, name: "Diamond Archon", minInvest: 1500000, reward: 105000, achievers: 28, desc: "Institutional syndicate director." },
        { level: 9, name: "Crown Imperator", minInvest: 5000000, reward: 350000, achievers: 11, desc: "Supreme network architect with multi-million turnover." },
        { level: 10, name: "Apex Zenith Titan", minInvest: 10000000, reward: 700000, achievers: 8, desc: "Pinnacle summit partner with permanent revenue share." },
      ];
    }

    res.status(200).json({
      success: true,
      count: ranks.length,
      ranks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get User's Rank Status & Next Milestone Progress
// @route   GET /api/user/ranks/my-rank
exports.getMyRankStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const currentLevel = user.rankLevel || 1;
    let ranks = await Rank.find({ status: "Active" }).sort({ level: 1 });
    if (!ranks || ranks.length === 0) {
      ranks = [
        { level: 1, name: "Bronze Explorer", minInvest: 100, reward: 7.5 },
        { level: 2, name: "Silver Vanguard", minInvest: 500, reward: 35 },
        { level: 3, name: "Gold Sovereign", minInvest: 2500, reward: 175 },
        { level: 4, name: "Platinum Luminary", minInvest: 10000, reward: 700 },
        { level: 5, name: "Sapphire Viceroy", minInvest: 50000, reward: 3500 },
        { level: 6, name: "Emerald Chancellor", minInvest: 150000, reward: 10500 },
        { level: 7, name: "Ruby High Commander", minInvest: 500000, reward: 35000 },
        { level: 8, name: "Diamond Archon", minInvest: 1500000, reward: 105000 },
        { level: 9, name: "Crown Imperator", minInvest: 5000000, reward: 350000 },
        { level: 10, name: "Apex Zenith Titan", minInvest: 10000000, reward: 700000 },
      ];
    }

    const currentRank = ranks.find((r) => r.level === currentLevel) || ranks[0];
    const nextRank = ranks.find((r) => r.level === currentLevel + 1) || currentRank;

    const turnover = user.teamTurnover || user.totalInvested || 0;
    const turnoverTarget = nextRank.minInvest || 1000;
    const progressPercent = Math.min(100, Math.round((turnover / turnoverTarget) * 100));

    res.status(200).json({
      success: true,
      data: {
        currentLevel,
        currentRankName: user.currentRank || currentRank.name,
        rewardUnlocked: currentRank.reward || 0,
        teamTurnover: turnover,
        nextRank: {
          level: nextRank.level,
          name: nextRank.name,
          minInvestRequired: nextRank.minInvest,
          rewardOnUnlock: nextRank.reward,
          progressPercent,
          remainingTurnover: Math.max(0, turnoverTarget - turnover),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Achievers Global Leaderboard
// @route   GET /api/user/ranks/leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const topUsers = await User.find({ status: "Active" })
      .sort({ teamTurnover: -1, totalInvested: -1 })
      .limit(10)
      .select("customId name email phone currentRank rankLevel totalReferrals teamTurnover createdAt");

    const leaderboard = topUsers.map((u, i) => ({
      rankNumber: i + 1,
      id: u.customId,
      name: u.name,
      email: u.email,
      phone: u.phone,
      rank: u.currentRank || "Gold Sovereign",
      level: u.rankLevel || 3,
      directRefs: u.totalReferrals || 0,
      turnover: u.teamTurnover || 0,
      joined: u.createdAt ? u.createdAt.toISOString().split("T")[0] : "2026-01-01",
    }));

    res.status(200).json({
      success: true,
      count: leaderboard.length,
      leaderboard,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

