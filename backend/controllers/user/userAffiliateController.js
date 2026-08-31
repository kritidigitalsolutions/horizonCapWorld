const User = require("../../models/User");
const Rank = require("../../models/Rank");
const ReferralSetting = require("../../models/ReferralSetting");
const Transaction = require("../../models/Transaction");

// @desc    Get Referral Overview Stats (Link, Code, Direct & Team Numbers, Earnings)
// @route   GET /api/user/referrals/overview
exports.getReferralOverview = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
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
      .filter((t) => (t.customId || "").includes("L1") || (t.gateway || "").toLowerCase().includes("direct"))
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
        directMembers: directUsers,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Referral Commission Tier Structure
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

    res.status(200).json({
      success: true,
      count: tiers.length,
      tiers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Multi-Tier Downline Network Tree (5-Tier Deep)
// @route   GET /api/user/referrals/network
exports.getReferralNetwork = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Load tiers from DB for exact rates
    let tiers = await ReferralSetting.find().sort({ levelNumber: 1 });
    const getRateForLevel = (lvl) => {
      const found = tiers?.find((t) => t.levelNumber === lvl);
      return found?.investCommissionRate ?? (6 - lvl);
    };

    // Level 1: Direct Sponsored
    const level1 = await User.find({ sponsorId: user.customId }).select(
      "customId name email phone totalInvested createdAt status"
    );

    // Level 2: Sponsored by Level 1
    const l1Ids = level1.map((u) => u.customId).filter(Boolean);
    const level2 = l1Ids.length > 0 ? await User.find({ sponsorId: { $in: l1Ids } }).select(
      "customId name email phone totalInvested sponsorId createdAt status"
    ) : [];

    // Level 3: Sponsored by Level 2
    const l2Ids = level2.map((u) => u.customId).filter(Boolean);
    const level3 = l2Ids.length > 0 ? await User.find({ sponsorId: { $in: l2Ids } }).select(
      "customId name email phone totalInvested sponsorId createdAt status"
    ) : [];

    // Level 4: Sponsored by Level 3
    const l3Ids = level3.map((u) => u.customId).filter(Boolean);
    const level4 = l3Ids.length > 0 ? await User.find({ sponsorId: { $in: l3Ids } }).select(
      "customId name email phone totalInvested sponsorId createdAt status"
    ) : [];

    // Level 5: Sponsored by Level 4
    const l4Ids = level4.map((u) => u.customId).filter(Boolean);
    const level5 = l4Ids.length > 0 ? await User.find({ sponsorId: { $in: l4Ids } }).select(
      "customId name email phone totalInvested sponsorId createdAt status"
    ) : [];

    const l1Rate = getRateForLevel(1);
    const l2Rate = getRateForLevel(2);
    const l3Rate = getRateForLevel(3);
    const l4Rate = getRateForLevel(4);
    const l5Rate = getRateForLevel(5);

    const formattedNetwork = [
      ...level1.map((u) => ({
        id: u.customId,
        name: u.name,
        email: u.email,
        phone: u.phone,
        level: 1,
        sponsor: user.customId,
        invested: u.totalInvested || 0,
        directComm: ((u.totalInvested || 0) * l1Rate) / 100,
        multiTierComm: 0,
        totalComm: ((u.totalInvested || 0) * l1Rate) / 100,
        joined: u.createdAt ? u.createdAt.toISOString().split("T")[0] : "2026-01-01",
        status: u.status || "Active",
      })),
      ...level2.map((u) => ({
        id: u.customId,
        name: u.name,
        email: u.email,
        phone: u.phone,
        level: 2,
        sponsor: u.sponsorId,
        invested: u.totalInvested || 0,
        directComm: 0,
        multiTierComm: ((u.totalInvested || 0) * l2Rate) / 100,
        totalComm: ((u.totalInvested || 0) * l2Rate) / 100,
        joined: u.createdAt ? u.createdAt.toISOString().split("T")[0] : "2026-01-01",
        status: u.status || "Active",
      })),
      ...level3.map((u) => ({
        id: u.customId,
        name: u.name,
        email: u.email,
        phone: u.phone,
        level: 3,
        sponsor: u.sponsorId,
        invested: u.totalInvested || 0,
        directComm: 0,
        multiTierComm: ((u.totalInvested || 0) * l3Rate) / 100,
        totalComm: ((u.totalInvested || 0) * l3Rate) / 100,
        joined: u.createdAt ? u.createdAt.toISOString().split("T")[0] : "2026-01-01",
        status: u.status || "Active",
      })),
      ...level4.map((u) => ({
        id: u.customId,
        name: u.name,
        email: u.email,
        phone: u.phone,
        level: 4,
        sponsor: u.sponsorId,
        invested: u.totalInvested || 0,
        directComm: 0,
        multiTierComm: ((u.totalInvested || 0) * l4Rate) / 100,
        totalComm: ((u.totalInvested || 0) * l4Rate) / 100,
        joined: u.createdAt ? u.createdAt.toISOString().split("T")[0] : "2026-01-01",
        status: u.status || "Active",
      })),
      ...level5.map((u) => ({
        id: u.customId,
        name: u.name,
        email: u.email,
        phone: u.phone,
        level: 5,
        sponsor: u.sponsorId,
        invested: u.totalInvested || 0,
        directComm: 0,
        multiTierComm: ((u.totalInvested || 0) * l5Rate) / 100,
        totalComm: ((u.totalInvested || 0) * l5Rate) / 100,
        joined: u.createdAt ? u.createdAt.toISOString().split("T")[0] : "2026-01-01",
        status: u.status || "Active",
      })),
    ];

    res.status(200).json({
      success: true,
      levelCounts: {
        level1: level1.length,
        level2: level2.length,
        level3: level3.length,
        level4: level4.length,
        level5: level5.length,
      },
      count: formattedNetwork.length,
      network: formattedNetwork,
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

