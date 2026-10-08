const User = require("../../models/User");
const Rank = require("../../models/Rank");
const ReferralSetting = require("../../models/ReferralSetting");
const Transaction = require("../../models/Transaction");
const AdminSettings = require("../../models/AdminSettings");
const cacheService = require("../../services/cacheService");

// @desc    Get Referral Overview Stats (Link, Code, Direct & Team Numbers, Earnings, Toggles)
// @route   GET /api/user/referrals/overview
exports.getReferralOverview = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const cacheKey = `referral:overview:${user.customId}`;
    const forceRefresh = req.query.refresh === "true";

    if (!forceRefresh) {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return res.status(200).json(cached);
      }
    }

    let adminSettings = await AdminSettings.findOne().lean();
    if (!adminSettings) {
      adminSettings = await AdminSettings.create({});
    }

    // Direct referrals (Level 1)
    const directUsers = await User.find({ sponsorId: user.customId })
      .select("customId name email phone country totalInvested depositWallet firstInvestmentAmount hasDeposited createdAt status")
      .lean();

    const directInvestedTotal = directUsers.reduce(
      (sum, u) => sum + (u.totalInvested || 0),
      0
    );

    const activeDirectCount = directUsers.filter(
      (u) => Boolean(u.hasDeposited) || Number(u.totalInvested || 0) > 0 || Number(u.depositWallet || 0) > 0
    ).length;

    // Fetch referral bonus transactions strictly for this user
    const bonusTxns = await Transaction.find({
      user: user._id,
      type: { $in: ["Referral Bonus", "Rank Bonus"] },
      status: "Approved",
    }).lean();

    const isDepositCommEnabled = adminSettings.referralDepositCommissionEnabled !== false && adminSettings.referralSystemEnabled !== false;

    const totalCommission = isDepositCommEnabled ? bonusTxns.reduce((sum, t) => sum + (t.amount || 0), 0) : 0;
    const directCommission = isDepositCommEnabled
      ? bonusTxns
          .filter((t) => (t.customId || "").includes("L1") || (t.referenceNo || "").includes("L1") || (t.gateway || "").toLowerCase().includes("direct"))
          .reduce((sum, t) => sum + (t.amount || 0), 0)
      : 0;
    const multiTierCommission = Math.max(0, totalCommission - directCommission);

    const origin = req.headers.origin || (req.headers.referer ? req.headers.referer.replace(/\/$/, "") : "https://horizoncapworlds.com");
    const referralLink = `${origin}/register?ref=${user.customId}`;

    // Determine if client has deposited
    const hasDeposited = Boolean(
      (user.totalInvested || 0) > 0 ||
      (user.depositWallet || 0) > 0 ||
      (await Transaction.exists({
        user: user._id,
        type: "Deposit",
        status: { $in: ["Approved", "Completed"] },
      })) !== null
    );

    // Ultra-fast single-pass graphLookup aggregation for infinite downline team metrics
    const downlineAgg = await User.aggregate([
      { $match: { customId: user.customId } },
      {
        $graphLookup: {
          from: "users",
          startWith: "$customId",
          connectFromField: "customId",
          connectToField: "sponsorId",
          as: "downlines",
        },
      },
      {
        $project: {
          totalTeamCount: { $size: "$downlines" },
          totalTeamVolume: { $sum: "$downlines.totalInvested" },
        },
      },
    ]);

    const calculatedTotalTeamCount = downlineAgg[0]?.totalTeamCount || 0;
    const calculatedTotalTeamVolume = downlineAgg[0]?.totalTeamVolume || 0;

    // Async background update on user turnover so response is not delayed
    User.updateOne(
      { _id: user._id },
      {
        $set: {
          teamTurnover: calculatedTotalTeamVolume,
          totalReferrals: calculatedTotalTeamCount,
          directReferrals: directUsers.length,
        },
      }
    ).catch(() => {});

    const responseData = {
      success: true,
      data: {
        referralCode: user.customId,
        referralLink,
        hasDeposited,
        sponsorId: user.sponsorId,
        directReferralsCount: activeDirectCount,
        totalRegisteredDirects: directUsers.length,
        totalTeamCount: calculatedTotalTeamCount,
        directTeamVolume: directInvestedTotal,
        totalTeamVolume: calculatedTotalTeamVolume,
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
        directMembers: directUsers.map((u) => {
          const hasDeposit = Boolean(u.hasDeposited) || Number(u.totalInvested || 0) > 0 || Number(u.depositWallet || 0) > 0;
          return {
            ...u,
            status: u.status === "Blocked" || u.status === "Suspended" ? u.status : (hasDeposit ? "Active" : "Inactive"),
          };
        }),
      },
    };

    // Cache for 120 seconds
    await cacheService.set(cacheKey, responseData, 120);

    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Referral Commission Tier Structure (Dynamic Downline Calculation for N Levels)
// @route   GET /api/user/referrals/commissions
exports.getReferralCommissions = async (req, res) => {
  try {
    const userCustomId = req.user?.customId;
    const cacheKey = `referral:commissions:${userCustomId || "guest"}`;
    const forceRefresh = req.query.refresh === "true";

    if (!forceRefresh) {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return res.status(200).json(cached);
      }
    }

    const LEVEL_ROI_DATA = [
      { level: "L0", levelNumber: 0, name: "Self Investment (Level 0)", depositAmount: 1000, profitAmount: 8, percentage: 0, roiPerDay: 0, eligibleConditions: "NA", groupVolumeMin: 0, directClientsMin: 0, investCommission: "0%", earningsCommission: "0%", investCommissionRate: 0, earningsCommissionRate: 0 },
      { level: "L1", levelNumber: 1, name: "Direct Referrals (Level 1)", depositAmount: 0, profitAmount: 0, percentage: 10, roiPerDay: 10, eligibleConditions: "No Condition", groupVolumeMin: 0, directClientsMin: 0, investCommission: "5%", earningsCommission: "10%", investCommissionRate: 5, earningsCommissionRate: 10 },
      { level: "L2", levelNumber: 2, name: "Sub-Referrals (Level 2)", depositAmount: 0, profitAmount: 0, percentage: 10, roiPerDay: 10, eligibleConditions: "Group Volume Min. 500$, 2 Direct Clients", groupVolumeMin: 500, directClientsMin: 2, investCommission: "4%", earningsCommission: "10%", investCommissionRate: 4, earningsCommissionRate: 10 },
      { level: "L3", levelNumber: 3, name: "Network Tier (Level 3)", depositAmount: 0, profitAmount: 0, percentage: 5, roiPerDay: 5, eligibleConditions: "Group Volume Min. 1500$, 3 Direct Clients", groupVolumeMin: 1500, directClientsMin: 3, investCommission: "3%", earningsCommission: "5%", investCommissionRate: 3, earningsCommissionRate: 5 },
      { level: "L4", levelNumber: 4, name: "Network Tier (Level 4)", depositAmount: 0, profitAmount: 0, percentage: 5, roiPerDay: 5, eligibleConditions: "Group Volume Min. 3000$, 4 Direct Clients", groupVolumeMin: 3000, directClientsMin: 4, investCommission: "2%", earningsCommission: "5%", investCommissionRate: 2, earningsCommissionRate: 5 },
      { level: "L5", levelNumber: 5, name: "Global Depth (Level 5)", depositAmount: 0, profitAmount: 0, percentage: 5, roiPerDay: 5, eligibleConditions: "Group Volume Min. 4000$, 5 Direct Clients", groupVolumeMin: 4000, directClientsMin: 5, investCommission: "1.5%", earningsCommission: "5%", investCommissionRate: 1.5, earningsCommissionRate: 5 },
      { level: "L6", levelNumber: 6, name: "Expansion Tier (Level 6)", depositAmount: 0, profitAmount: 0, percentage: 5, roiPerDay: 5, eligibleConditions: "Group Volume Min. 5,000$, 10 Direct Clients", groupVolumeMin: 5000, directClientsMin: 10, investCommission: "1%", earningsCommission: "5%", investCommissionRate: 1, earningsCommissionRate: 5 },
      { level: "L7", levelNumber: 7, name: "Regional Depth (Level 7)", depositAmount: 0, profitAmount: 0, percentage: 5, roiPerDay: 5, eligibleConditions: "Group Volume Min. 10,000$, 11 Direct Clients", groupVolumeMin: 10000, directClientsMin: 11, investCommission: "0.8%", earningsCommission: "5%", investCommissionRate: 0.8, earningsCommissionRate: 5 },
      { level: "L8", levelNumber: 8, name: "Executive Tier (Level 8)", depositAmount: 0, profitAmount: 0, percentage: 5, roiPerDay: 5, eligibleConditions: "Group Volume Min. 15,000$, 11 Direct Clients", groupVolumeMin: 15000, directClientsMin: 11, investCommission: "0.6%", earningsCommission: "5%", investCommissionRate: 0.6, earningsCommissionRate: 5 },
      { level: "L9", levelNumber: 9, name: "Leadership Tier (Level 9)", depositAmount: 0, profitAmount: 0, percentage: 5, roiPerDay: 5, eligibleConditions: "Group Volume Min. 20,000$, 11 Direct Clients", groupVolumeMin: 20000, directClientsMin: 11, investCommission: "0.5%", earningsCommission: "5%", investCommissionRate: 0.5, earningsCommissionRate: 5 },
      { level: "L10", levelNumber: 10, name: "Ambassador Tier (Level 10)", depositAmount: 0, profitAmount: 0, percentage: 5, roiPerDay: 5, eligibleConditions: "Group Volume Min.25,000$, 11 Direct Clients", groupVolumeMin: 25000, directClientsMin: 11, investCommission: "0.4%", earningsCommission: "5%", investCommissionRate: 0.4, earningsCommissionRate: 5 },
    ];

    let tiers = await ReferralSetting.find().sort({ levelNumber: 1 }).lean();
    if (!tiers || tiers.length !== 11) {
      tiers = LEVEL_ROI_DATA;
    }

    let adminSettings = await AdminSettings.findOne().lean();
    if (!adminSettings) {
      adminSettings = await AdminSettings.create({});
    }

    const levelStats = {};
    tiers.forEach((t) => {
      const lvl = t.levelNumber !== undefined ? t.levelNumber : 1;
      levelStats[lvl] = { count: 0, volume: 0 };
    });

    let totalDownlinesCount = 0;
    let totalDownlinesVolume = 0;
    let directActiveCount = 0;

    if (req.user && req.user.customId) {
      const selfInvested = Number(req.user.totalInvested || 0);
      levelStats[0] = {
        count: selfInvested > 0 ? 1 : 0,
        volume: selfInvested,
      };

      // Single aggregation for all 10 levels downline breakdown
      const [levelsAgg, directActiveUsers] = await Promise.all([
        User.aggregate([
          { $match: { customId: req.user.customId } },
          {
            $graphLookup: {
              from: "users",
              startWith: "$customId",
              connectFromField: "customId",
              connectToField: "sponsorId",
              as: "downlines",
              maxDepth: 9,
              depthField: "depth",
            },
          },
          { $unwind: "$downlines" },
          {
            $group: {
              _id: { $add: ["$downlines.depth", 1] },
              count: { $sum: 1 },
              volume: { $sum: { $ifNull: ["$downlines.totalInvested", 0] } },
            },
          },
        ]),
        User.countDocuments({
          sponsorId: req.user.customId,
          $or: [
            { hasDeposited: true },
            { totalInvested: { $gt: 0 } },
            { depositWallet: { $gt: 0 } },
          ],
        }),
      ]);

      directActiveCount = directActiveUsers;

      levelsAgg.forEach((item) => {
        const lvl = item._id;
        if (levelStats[lvl]) {
          levelStats[lvl] = { count: item.count, volume: item.volume };
        }
        totalDownlinesCount += item.count;
        totalDownlinesVolume += item.volume;
      });
    }

    const dynamicTiers = tiers.map((t) => {
      const lvl = t.levelNumber !== undefined ? t.levelNumber : 1;
      const stats = levelStats[lvl] || { count: 0, volume: 0 };
      return {
        ...t,
        activePromoters: stats.count,
        totalVolume: `$${Number(stats.volume).toLocaleString()}`,
        volumeRaw: stats.volume,
        status: t.status || "Active",
      };
    });

    const responseData = {
      success: true,
      count: dynamicTiers.length,
      tiers: dynamicTiers,
      userStats: {
        activeDirects: directActiveCount,
        totalDirects: levelStats[1]?.count || 0,
        totalDownlines: totalDownlinesCount,
        totalTeamVolume: totalDownlinesVolume,
        directTeamVolume: levelStats[1]?.volume || 0,
        selfInvested: levelStats[0]?.volume || 0,
      },
      toggles: {
        referralDepositCommissionEnabled: adminSettings.referralDepositCommissionEnabled !== false,
        referralRoiShareEnabled: adminSettings.referralRoiShareEnabled !== false,
        referralSystemEnabled: adminSettings.referralSystemEnabled !== false,
      },
    };

    if (userCustomId) {
      await cacheService.set(cacheKey, responseData, 120);
    }

    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Multi-Tier Downline Network Tree (Dynamic N-Tier Deep, Sub-second & Cached)
// @route   GET /api/user/referrals/network
exports.getReferralNetwork = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const cacheKey = `referral:network:${user.customId}`;
    const forceRefresh = req.query.refresh === "true";

    if (!forceRefresh) {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return res.status(200).json(cached);
      }
    }

    // Parallel fetch: admin settings, referral tiers, user's approved bonus txns, and user's downline tree
    const [adminSettings, tiersFromDb, bonusTxns, downlinesAgg] = await Promise.all([
      AdminSettings.findOne().lean(),
      ReferralSetting.find().sort({ levelNumber: 1 }).lean(),
      Transaction.find({
        user: user._id,
        type: "Referral Bonus",
        status: "Approved",
      }).lean(),
      User.aggregate([
        { $match: { customId: user.customId } },
        {
          $graphLookup: {
            from: "users",
            startWith: "$customId",
            connectFromField: "customId",
            connectToField: "sponsorId",
            as: "downlines",
            depthField: "depth",
          },
        },
        {
          $project: {
            "downlines._id": 1,
            "downlines.customId": 1,
            "downlines.sponsorId": 1,
            "downlines.name": 1,
            "downlines.email": 1,
            "downlines.phone": 1,
            "downlines.country": 1,
            "downlines.avatar": 1,
            "downlines.currentRank": 1,
            "downlines.rankLevel": 1,
            "downlines.totalInvested": 1,
            "downlines.depositWallet": 1,
            "downlines.firstInvestmentAmount": 1,
            "downlines.hasReceivedReferralBonus": 1,
            "downlines.hasDeposited": 1,
            "downlines.createdAt": 1,
            "downlines.status": 1,
            "downlines.depth": 1,
          },
        },
      ]),
    ]);

    const activeAdminSettings = adminSettings || {};
    let tiers = tiersFromDb && tiersFromDb.length > 0 ? tiersFromDb : [
      { level: "L1", levelNumber: 1, name: "Direct Referrals (Level 1)", investCommissionRate: 5 },
      { level: "L2", levelNumber: 2, name: "Sub-Referrals (Level 2)", investCommissionRate: 4 },
      { level: "L3", levelNumber: 3, name: "Network Tier (Level 3)", investCommissionRate: 3 },
      { level: "L4", levelNumber: 4, name: "Network Tier (Level 4)", investCommissionRate: 2 },
      { level: "L5", levelNumber: 5, name: "Global Depth (Level 5)", investCommissionRate: 1.5 },
      { level: "L6", levelNumber: 6, name: "Expansion Tier (Level 6)", investCommissionRate: 1 },
      { level: "L7", levelNumber: 7, name: "Regional Depth (Level 7)", investCommissionRate: 0.8 },
      { level: "L8", levelNumber: 8, name: "Executive Tier (Level 8)", investCommissionRate: 0.6 },
      { level: "L9", levelNumber: 9, name: "Leadership Tier (Level 9)", investCommissionRate: 0.5 },
      { level: "L10", levelNumber: 10, name: "Ambassador Tier (Level 10)", investCommissionRate: 0.4 },
    ];

    const downlineTiers = tiers.filter((t) => t.levelNumber >= 1 && t.levelNumber <= 10);
    const tierMap = new Map();
    tiers.forEach((t) => tierMap.set(t.levelNumber, t));

    const isDepositCommEnabled =
      activeAdminSettings.referralDepositCommissionEnabled !== false &&
      activeAdminSettings.referralSystemEnabled !== false;

    const getRateForLevel = (lvl) => {
      const found = tierMap.get(lvl);
      if (found?.investCommissionRate !== undefined) return Number(found.investCommissionRate);
      if (lvl === 1) return 5;
      if (lvl === 2) return 4;
      if (lvl === 3) return 3;
      if (lvl === 4) return 2;
      if (lvl === 5) return 1.5;
      if (lvl === 6) return 1;
      if (lvl === 7) return 0.8;
      if (lvl === 8) return 0.6;
      if (lvl === 9) return 0.5;
      if (lvl === 10) return 0.4;
      return 0;
    };

    const getTierNameForLevel = (lvl) => {
      const found = tierMap.get(lvl);
      return found?.name || `Tier Level ${lvl}`;
    };

    const downlines = downlinesAgg[0]?.downlines || [];

    // Helper: Downline referral status is "Active" if user has made a deposit, otherwise "Inactive"
    const getDownlineStatus = (u) => {
      if (!u) return "Inactive";
      if (u.status === "Blocked" || u.status === "Suspended") return u.status;
      const hasDeposit =
        Boolean(u.hasDeposited) ||
        Number(u.totalInvested || 0) > 0 ||
        Number(u.depositWallet || 0) > 0 ||
        Number(u.firstInvestmentAmount || 0) > 0;
      return hasDeposit ? "Active" : "Inactive";
    };

    // Build children mapping for instantaneous in-memory tree traversal
    const childrenMap = new Map();
    downlines.forEach((u) => {
      if (!childrenMap.has(u.sponsorId)) {
        childrenMap.set(u.sponsorId, []);
      }
      childrenMap.get(u.sponsorId).push(u);
    });

    // Memoized post-order subtree stats computation in O(N) linear time
    const subtreeStats = new Map();
    const computeSubtree = (customId) => {
      if (subtreeStats.has(customId)) return subtreeStats.get(customId);

      const kids = childrenMap.get(customId) || [];
      let totalTeamCount = 0;
      let teamVolume = 0;

      for (const kid of kids) {
        const kidStats = computeSubtree(kid.customId);
        const kidInvested = Number(kid.totalInvested || 0);
        totalTeamCount += 1 + kidStats.totalTeamCount;
        teamVolume += kidInvested + kidStats.teamVolume;
      }

      const res = {
        directRefs: kids.length,
        totalTeamCount,
        teamVolume,
      };
      subtreeStats.set(customId, res);
      return res;
    };

    // Precompute for root
    computeSubtree(user.customId);

    // Helper: Commission calculation for an investor node
    const calcComm = (u, lvl) => {
      if (lvl > 10 || !isDepositCommEnabled) return 0;
      const rate = getRateForLevel(lvl);
      const invested = u.totalInvested || 0;
      const depositW = u.depositWallet || 0;
      const eligibleBase =
        u.firstInvestmentAmount ||
        (u.hasReceivedReferralBonus ? u.firstInvestmentAmount || invested : invested > 0 ? invested : depositW);

      const matchedTxns = bonusTxns.filter(
        (t) =>
          (t.note && (t.note.includes(u.customId) || (u.name && t.note.includes(u.name)))) ||
          (t.referenceNo && t.referenceNo.includes(u.customId))
      );
      if (matchedTxns.length > 0) {
        return matchedTxns.reduce((sum, t) => sum + Number(t.amount || 0), 0);
      }
      if (eligibleBase > 0) {
        return parseFloat(((eligibleBase * rate) / 100).toFixed(2));
      }
      return 0;
    };

    const levelCounts = {};
    for (let i = 1; i <= 10; i++) {
      levelCounts[`level${i}`] = 0;
    }

    // Format tabular network downlines list
    const formattedNetwork = downlines
      .sort((a, b) => a.depth - b.depth)
      .map((u) => {
        const lvl = (u.depth || 0) + 1;
        if (lvl <= 10) {
          levelCounts[`level${lvl}`] = (levelCounts[`level${lvl}`] || 0) + 1;
        }

        const rate = lvl <= 10 ? getRateForLevel(lvl) : 0;
        const comm = calcComm(u, lvl);
        const stats = subtreeStats.get(u.customId) || { totalTeamCount: 0, teamVolume: 0, directRefs: 0 };

        return {
          id: u.customId,
          name: u.name,
          email: u.email,
          phone: u.phone || "—",
          level: lvl,
          tierName: getTierNameForLevel(lvl),
          sponsor: u.sponsorId,
          invested: u.totalInvested || 0,
          depositWallet: u.depositWallet || 0,
          rate,
          teamVolume: stats.teamVolume,
          directRefs: stats.directRefs,
          totalTeamCount: stats.totalTeamCount,
          firstInvestmentAmount: u.firstInvestmentAmount || 0,
          directComm: lvl === 1 ? comm : 0,
          multiTierComm: lvl > 1 && lvl <= 10 ? comm : 0,
          totalComm: comm,
          commissionEarned: comm,
          joined: u.createdAt ? new Date(u.createdAt).toISOString().split("T")[0] : "",
          status: getDownlineStatus(u),
          avatar: u.avatar || "",
          rank: u.currentRank || "Associate",
          rankLevel: u.rankLevel || 1,
        };
      });

    // Build the hierarchical referral tree recursively
    const buildTreeNodes = (parentId, currentLevel, visited) => {
      if (currentLevel > 100) return [];
      const kids = childrenMap.get(parentId) || [];
      const rate = currentLevel <= 10 ? getRateForLevel(currentLevel) : 0;

      return kids
        .map((kid) => {
          if (visited.has(kid.customId)) return null;
          visited.add(kid.customId);

          const comm = calcComm(kid, currentLevel);
          const stats = subtreeStats.get(kid.customId) || { totalTeamCount: 0, teamVolume: 0, directRefs: 0 };
          const childNodes = buildTreeNodes(kid.customId, currentLevel + 1, visited);

          return {
            id: kid.customId,
            name: kid.name,
            email: kid.email,
            phone: kid.phone || "—",
            avatar: kid.avatar || "",
            rank: kid.currentRank || "Associate",
            rankLevel: kid.rankLevel || 1,
            sponsorId: kid.sponsorId || parentId,
            level: currentLevel,
            tierName: getTierNameForLevel(currentLevel),
            commissionRate: rate,
            commissionEarned: comm,
            invested: kid.totalInvested || 0,
            personalVolume: kid.totalInvested || 0,
            groupVolume: stats.teamVolume,
            teamVolume: stats.teamVolume,
            totalTeamCount: stats.totalTeamCount,
            depositWallet: kid.depositWallet || 0,
            status: getDownlineStatus(kid),
            joined: kid.createdAt ? new Date(kid.createdAt).toISOString().split("T")[0] : "",
            directCount: stats.directRefs,
            children: childNodes,
          };
        })
        .filter(Boolean);
    };

    const rootStats = subtreeStats.get(user.customId) || { totalTeamCount: 0, teamVolume: 0 };
    const totalTreeCommissions = formattedNetwork.reduce((sum, m) => sum + Number(m.totalComm || 0), 0);

    const tree = {
      id: user.customId,
      name: user.name,
      email: user.email,
      phone: user.phone || "—",
      avatar: user.avatar || "",
      rank: user.currentRank || "Associate",
      rankLevel: user.rankLevel || 1,
      sponsorId: user.sponsorId || "HORIZON-HQ",
      level: 0,
      tierName: "Level 0 (Self)",
      commissionRate: 0,
      commissionEarned: 0,
      invested: user.totalInvested || 0,
      personalVolume: user.totalInvested || 0,
      groupVolume: rootStats.teamVolume,
      teamVolume: rootStats.teamVolume,
      depositWallet: user.depositWallet || 0,
      status: getDownlineStatus(user),
      totalEarnedCommission: parseFloat(totalTreeCommissions.toFixed(2)),
      directCount: (childrenMap.get(user.customId) || []).length,
      totalTeamCount: formattedNetwork.length,
      children: buildTreeNodes(user.customId, 1, new Set([user.customId])),
    };

    const responseData = {
      success: true,
      levelCounts,
      count: formattedNetwork.length,
      network: formattedNetwork,
      tree,
      tiers: downlineTiers,
      toggles: {
        referralDepositCommissionEnabled: activeAdminSettings.referralDepositCommissionEnabled !== false,
        referralRoiShareEnabled: activeAdminSettings.referralRoiShareEnabled !== false,
        referralSystemEnabled: activeAdminSettings.referralSystemEnabled !== false,
      },
    };

    // Cache the network tree for 120 seconds
    await cacheService.set(cacheKey, responseData, 120);

    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const defaultLadderRanks = [
  { level: 1, name: "Associate", ownDeposit: 50, totalClientDeposit: 5000, minInvest: 5000, reward: 100, condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )", companyProfitSharing: "0", salaryCondition: "", downlineStructureRequired: "2 Active Direct Client", achievers: 4890, desc: "Entry leadership milestone unlocked with active direct network." },
  { level: 2, name: "Senior Associate", ownDeposit: 100, totalClientDeposit: 10000, minInvest: 10000, reward: 300, condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )", companyProfitSharing: "0", salaryCondition: "", downlineStructureRequired: "3 Active Direct Clients", achievers: 2340, desc: "Demonstrated network volume builder." },
  { level: 3, name: "Team Leader", ownDeposit: 250, totalClientDeposit: 25000, minInvest: 25000, reward: 875, condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )", companyProfitSharing: "0", salaryCondition: "", downlineStructureRequired: "3 Active Direct Clients  ( Min. 1 Associate )", achievers: 1210, desc: "Regional leadership leader managing team turnover." },
  { level: 4, name: "Director", ownDeposit: 500, totalClientDeposit: 50000, minInvest: 50000, reward: 2000, condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )", companyProfitSharing: "0", salaryCondition: "", downlineStructureRequired: "4 Active Direct Clients ( Min 2 Sr. Associate )", achievers: 680, desc: "Executive director supervising multi-tier syndicates." },
  { level: 5, name: "Regional Director", ownDeposit: 1000, totalClientDeposit: 100000, minInvest: 100000, reward: 5000, condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )", companyProfitSharing: "0", salaryCondition: "", downlineStructureRequired: "4 Active Direct Clients ( Min. 2 Team Leaders )", achievers: 340, desc: "Senior regional executive commanding six-figure volume." },
  { level: 6, name: "Executive Director", ownDeposit: 1500, totalClientDeposit: 200000, minInvest: 200000, reward: 10000, condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )", companyProfitSharing: "0.20% of the total company Profit + 500$ Per Month Salary", salaryCondition: "Monthly salary requires maintaining active direct clients and team turnover criteria each month.", downlineStructureRequired: "5 Active Direct Clients ( Min. 2 Directors )", achievers: 160, desc: "Corporate syndicate leader receiving monthly salary and profit share." },
  { level: 7, name: "Diamond", ownDeposit: 2000, totalClientDeposit: 300000, minInvest: 300000, reward: 15000, condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )", companyProfitSharing: "0.50% of the Total Company Profit + 1000$ Per Month Salary", salaryCondition: "Monthly salary requires maintaining active direct clients and team turnover criteria each month.", downlineStructureRequired: "6 Active Direct Clients ( Min. 2 Regional Directors )", achievers: 72, desc: "High-tier executive with expanded profit share and salary." },
  { level: 8, name: "Crown Diamond", ownDeposit: 3000, totalClientDeposit: 600000, minInvest: 600000, reward: 30000, condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )", companyProfitSharing: "0.75% of the Total Company Profit + 1500$ Per Month Salary", salaryCondition: "Monthly salary requires maintaining active direct clients and team turnover criteria each month.", downlineStructureRequired: "8 Active Direct Clients ( Min. 2 Executive Directors )", achievers: 28, desc: "Elite summit council member with premier dividends." },
  { level: 9, name: "Global Ambassador", ownDeposit: 5000, totalClientDeposit: 100000, minInvest: 1000000, reward: 50000, condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )", companyProfitSharing: "1% of the Total Company Profit + 3000$ Per Month Salary", salaryCondition: "Monthly salary requires maintaining active direct clients and team turnover criteria each month.", downlineStructureRequired: "10 Active Direct Clients ( Min. 2 Diamonds )", achievers: 11, desc: "Apex global ambassador commanding global network volume." },
  { level: 10, name: "Titan", ownDeposit: 0, totalClientDeposit: 5000000, minInvest: 5000000, reward: 250000, condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )", companyProfitSharing: "1.25% of the Total Company Profit + 5000$ Per Month Salary", salaryCondition: "Monthly salary requires maintaining active direct clients and team turnover criteria each month.", downlineStructureRequired: "15 Active Direct Clients ( Min. 2 Crown Diamond )", achievers: 5, desc: "Titan council leader commanding multi-million network turnover." },
  { level: 11, name: "Crown Titan", ownDeposit: 0, totalClientDeposit: 10000000, minInvest: 10000000, reward: 500000, condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )", companyProfitSharing: "1.50% of the Total Company Profit + 7500$ Per Month Salary", salaryCondition: "Monthly salary requires maintaining active direct clients and team turnover criteria each month.", downlineStructureRequired: "20 Active Direct Clients ( Min. 2 Global Ambassador )", achievers: 2, desc: "Crown titan executive with premier corporate profit share." },
  { level: 12, name: "Global Titan", ownDeposit: 0, totalClientDeposit: 25000000, minInvest: 25000000, reward: 1250000, condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )", companyProfitSharing: "2% of the Total Company Profit + 10000$ Per Month Salary", salaryCondition: "Monthly salary requires maintaining active direct clients and team turnover criteria each month.", downlineStructureRequired: "25 Active Direct Clients ( Min. 2 Titan )", achievers: 1, desc: "Pinnacle global titan summit leader commanding worldwide operations." },
];

// @desc    Get 12-Tier Rank Progression Ladder
// @route   GET /api/user/ranks/ladder
exports.getRankLadder = async (req, res) => {
  try {
    const cached = await cacheService.get("referral:rank:ladder");
    if (cached) {
      return res.status(200).json(cached);
    }

    let ranks = await Rank.find({ status: "Active" }).sort({ level: 1 }).lean();
    if (!ranks || ranks.length === 0) {
      ranks = defaultLadderRanks;
    }

    const responseData = {
      success: true,
      count: ranks.length,
      ranks,
    };

    await cacheService.set("referral:rank:ladder", responseData, 600);
    res.status(200).json(responseData);
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

    const cacheKey = `referral:myrank:${user.customId}`;
    const forceRefresh = req.query.refresh === "true";

    if (!forceRefresh) {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return res.status(200).json(cached);
      }
    }

    let ranks = await Rank.find({ status: "Active" }).sort({ level: 1 }).lean();
    if (!ranks || ranks.length === 0) {
      ranks = defaultLadderRanks;
    }

    // Direct referrals (Level 1)
    const directUsers = await User.find({ sponsorId: user.customId })
      .select("customId name email totalInvested depositWallet hasDeposited status rankLevel teamTurnover")
      .lean();

    const activeDirectCount = directUsers.filter(
      (u) => Boolean(u.hasDeposited) || Number(u.totalInvested || 0) > 0 || Number(u.depositWallet || 0) > 0
    ).length;

    const legsCount = directUsers.length;

    // Single graphLookup aggregation for live downline volume across 10 tiers
    const turnoverAgg = await User.aggregate([
      { $match: { customId: user.customId } },
      {
        $graphLookup: {
          from: "users",
          startWith: "$customId",
          connectFromField: "customId",
          connectToField: "sponsorId",
          as: "downlines",
          maxDepth: 9,
        },
      },
      {
        $project: {
          turnover: { $sum: "$downlines.totalInvested" },
        },
      },
    ]);

    const turnover = turnoverAgg[0]?.turnover || 0;
    const ownInvested = Number(user.totalInvested || 0);

    // Evaluate qualification for each rank
    let qualifiedLevel = 0;
    for (const r of ranks) {
      const ownTarget = Number(r.ownDeposit || 0);
      const turnoverTarget = Number(r.totalClientDeposit || r.minInvest || 0);
      const reqDirectsMatch = (r.downlineStructureRequired || "").match(/\d+/);
      const reqDirects = reqDirectsMatch ? parseInt(reqDirectsMatch[0], 10) : 2;

      const ownMet = ownInvested >= ownTarget;
      const turnoverMet = turnover >= turnoverTarget;
      const condMet = (legsCount >= 2 || activeDirectCount >= 2) && activeDirectCount >= reqDirects;

      if (ownMet && turnoverMet && condMet) {
        qualifiedLevel = r.level;
      } else {
        break;
      }
    }

    const isQualified = qualifiedLevel > 0;
    const currentRank = isQualified ? ranks.find((r) => r.level === qualifiedLevel) || ranks[0] : null;

    // Auto-sync user rank level & currentRank in database if newly qualified
    if (isQualified && (user.rankLevel || 0) < qualifiedLevel) {
      user.currentRank = currentRank.name;
      user.rankLevel = qualifiedLevel;
    }
    user.teamTurnover = turnover;
    await user.save();

    const targetLevel = qualifiedLevel + 1;
    const nextRank = ranks.find((r) => r.level === targetLevel) || ranks[ranks.length - 1];

    const turnoverTarget = nextRank.totalClientDeposit || nextRank.minInvest || 5000;
    const ownDepositTarget = nextRank.ownDeposit || 50;
    const progressPercent = Math.min(100, Math.round((turnover / turnoverTarget) * 100));

    const responseData = {
      success: true,
      data: {
        qualifiedLevel,
        currentLevel: qualifiedLevel,
        isQualified,
        currentRankName: isQualified ? currentRank.name : "Unranked (Associate in Progress)",
        rewardUnlocked: isQualified ? currentRank.reward || 0 : 0,
        teamTurnover: turnover,
        ownInvested,
        activeDirectCount,
        legsCount,
        currentRank: currentRank || ranks[0],
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
    };

    await cacheService.set(cacheKey, responseData, 120);
    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Downline Achievers Leaderboard (Strictly User's Downline Team Only)
// @route   GET /api/user/ranks/leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(200).json({ success: true, count: 0, leaderboard: [] });
    }

    const cacheKey = `referral:leaderboard:${user.customId}`;
    const forceRefresh = req.query.refresh === "true";

    if (!forceRefresh) {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return res.status(200).json(cached);
      }
    }

    // Fast graphLookup to get all downline customIds of req.user
    const downlineAgg = await User.aggregate([
      { $match: { customId: user.customId } },
      {
        $graphLookup: {
          from: "users",
          startWith: "$customId",
          connectFromField: "customId",
          connectToField: "sponsorId",
          as: "downlines",
        },
      },
      {
        $project: {
          downlineIds: "$downlines.customId",
        },
      },
    ]);

    const downlineCustomIds = downlineAgg[0]?.downlineIds || [];

    if (downlineCustomIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        leaderboard: [],
      });
    }

    const topUsers = await User.find({
      customId: { $in: downlineCustomIds },
      status: "Active",
    })
      .sort({ teamTurnover: -1, totalInvested: -1 })
      .limit(10)
      .select("customId name email phone currentRank rankLevel totalReferrals teamTurnover createdAt")
      .lean();

    const leaderboard = topUsers.map((u, i) => ({
      rankNumber: i + 1,
      id: u.customId,
      name: u.name,
      email: u.email,
      phone: u.phone,
      rank: u.currentRank || "Associate",
      level: u.rankLevel || 1,
      directRefs: u.totalReferrals || 0,
      turnover: u.teamTurnover || 0,
      joined: u.createdAt ? new Date(u.createdAt).toISOString().split("T")[0] : "2026-01-01",
    }));

    const responseData = {
      success: true,
      count: leaderboard.length,
      leaderboard,
    };

    await cacheService.set(cacheKey, responseData, 120);
    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
