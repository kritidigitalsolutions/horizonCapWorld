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
      }).select("customId name email phone totalInvested firstInvestmentAmount hasReceivedReferralBonus sponsorId createdAt status");

      levelCounts[`level${lvl}`] = downlines.length;

      const rate = getRateForLevel(lvl);

      downlines.forEach((u) => {
        const invested = u.totalInvested || 0;
        const eligibleBaseAmount = u.firstInvestmentAmount || (u.hasReceivedReferralBonus ? u.firstInvestmentAmount || invested : (invested > 0 ? invested : 0));
        const comm = (eligibleBaseAmount * rate) / 100;
        formattedNetwork.push({
          id: u.customId,
          name: u.name,
          email: u.email,
          phone: u.phone,
          level: lvl,
          sponsor: u.sponsorId,
          invested,
          firstInvestmentAmount: eligibleBaseAmount,
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

const defaultLadderRanks = [
  { level: 1, name: "Associate", ownDeposit: 50, totalClientDeposit: 5000, minInvest: 5000, reward: 100, condition: "1 Leg should not be more than 40% of the GV", companyProfitSharing: "0", downlineStructureRequired: "2 Active Direct Client", achievers: 4890, desc: "Entry leadership milestone unlocked with active direct network." },
  { level: 2, name: "Senior Associate", ownDeposit: 100, totalClientDeposit: 10000, minInvest: 10000, reward: 300, condition: "1 Leg should not be more than 40% of the GV", companyProfitSharing: "0", downlineStructureRequired: "3 Active Direct Clients", achievers: 2340, desc: "Demonstrated network volume builder." },
  { level: 3, name: "Team Leader", ownDeposit: 250, totalClientDeposit: 25000, minInvest: 25000, reward: 875, condition: "1 Leg should not be more than 40% of the GV", companyProfitSharing: "0", downlineStructureRequired: "3 Active Direct Clients ( Min. 1 Associate )", achievers: 1210, desc: "Regional leadership leader managing team turnover." },
  { level: 4, name: "Director", ownDeposit: 500, totalClientDeposit: 50000, minInvest: 50000, reward: 2000, condition: "1 Leg should not be more than 40% of the GV", companyProfitSharing: "0", downlineStructureRequired: "4 Active Direct Clients ( Min 2 Sr. Associate )", achievers: 680, desc: "Executive director supervising multi-tier syndicates." },
  { level: 5, name: "Regional Director", ownDeposit: 1000, totalClientDeposit: 100000, minInvest: 100000, reward: 5000, condition: "1 Leg should not be more than 40% of the GV", companyProfitSharing: "0", downlineStructureRequired: "4 Active Direct Clients ( Min. 2 Team Leaders )", achievers: 340, desc: "Senior regional executive commanding six-figure volume." },
  { level: 6, name: "Executive Director", ownDeposit: 1500, totalClientDeposit: 200000, minInvest: 200000, reward: 10000, condition: "1 Leg should not be more than 40% of the GV", companyProfitSharing: "0.20% of the total company Profit + 500$ Per Month Salary", downlineStructureRequired: "5 Active Direct Clients ( Min. 2 Directors )", achievers: 160, desc: "Corporate syndicate leader receiving monthly salary and profit share." },
  { level: 7, name: "Diamond", ownDeposit: 2000, totalClientDeposit: 300000, minInvest: 300000, reward: 15000, condition: "1 Leg should not be more than 40% of the GV", companyProfitSharing: "0.50% of the Total Company Profit + 1000$ Per Month Salary", downlineStructureRequired: "6 Active Direct Clients ( Min. 2 Regional Directors )", achievers: 72, desc: "High-tier executive with expanded profit share and salary." },
  { level: 8, name: "Crown Diamond", ownDeposit: 3000, totalClientDeposit: 600000, minInvest: 600000, reward: 35000, condition: "1 Leg should not be more than 40% of the GV", companyProfitSharing: "0.75% of the Total Company Profit + 1500$ Per Month Salary", downlineStructureRequired: "8 Active Direct Clients ( Min. 2 Executive Directors )", achievers: 28, desc: "Elite summit council member with premier dividends." },
  { level: 9, name: "Global Ambassador", ownDeposit: 5000, totalClientDeposit: 1000000, minInvest: 1000000, reward: 60000, condition: "1 Leg should not be more than 40% of the GV", companyProfitSharing: "1% of the Total Company Profit + 3000$ Per Month Salary", downlineStructureRequired: "10 Active Direct Clients ( Min. 2 Diamonds )", achievers: 11, desc: "Apex global ambassador commanding global network volume." },
];

// @desc    Get 9-Tier Rank Progression Ladder
// @route   GET /api/user/ranks/ladder
exports.getRankLadder = async (req, res) => {
  try {
    let ranks = await Rank.find({ status: "Active" }).sort({ level: 1 });
    if (!ranks || ranks.length === 0) {
      ranks = defaultLadderRanks;
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
      ranks = defaultLadderRanks;
    }

    const currentRank = ranks.find((r) => r.level === currentLevel) || ranks[0];
    const nextRank = ranks.find((r) => r.level === currentLevel + 1) || currentRank;

    const turnover = user.teamTurnover || user.totalInvested || 0;
    const ownInvested = user.totalInvested || user.wallet || 0;
    const turnoverTarget = nextRank.totalClientDeposit || nextRank.minInvest || 5000;
    const ownDepositTarget = nextRank.ownDeposit || 50;
    const progressPercent = Math.min(100, Math.round((turnover / turnoverTarget) * 100));

    res.status(200).json({
      success: true,
      data: {
        currentLevel,
        currentRankName: user.currentRank || currentRank.name,
        rewardUnlocked: currentRank.reward || 0,
        teamTurnover: turnover,
        ownInvested,
        currentRank,
        nextRank: {
          level: nextRank.level,
          name: nextRank.name,
          ownDepositRequired: ownDepositTarget,
          totalClientDepositRequired: turnoverTarget,
          minInvestRequired: turnoverTarget,
          rewardOnUnlock: nextRank.reward,
          condition: nextRank.condition,
          companyProfitSharing: nextRank.companyProfitSharing,
          downlineStructureRequired: nextRank.downlineStructureRequired,
          progressPercent,
          remainingTurnover: Math.max(0, turnoverTarget - turnover),
          remainingOwnDeposit: Math.max(0, ownDepositTarget - ownInvested),
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

