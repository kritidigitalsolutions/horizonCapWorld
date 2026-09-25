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
      "customId name email phone country totalInvested depositWallet firstInvestmentAmount hasDeposited createdAt status"
    );

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
    });

    const isDepositCommEnabled = adminSettings.referralDepositCommissionEnabled !== false && adminSettings.referralSystemEnabled !== false;

    const totalCommission = isDepositCommEnabled ? bonusTxns.reduce((sum, t) => sum + (t.amount || 0), 0) : 0;
    const directCommission = isDepositCommEnabled ? (bonusTxns
      .filter((t) => (t.customId || "").includes("L1") || (t.referenceNo || "").includes("L1") || (t.gateway || "").toLowerCase().includes("direct"))
      .reduce((sum, t) => sum + (t.amount || 0), 0)) : 0;
    const multiTierCommission = Math.max(0, totalCommission - directCommission);

    const origin = req.headers.origin || (req.headers.referer ? req.headers.referer.replace(/\/$/, "") : "https://horizoncapworlds.com");
    const referralLink = `${origin}/register?ref=${user.customId}`;

    // Determine if client has deposited (mandatory deposit for referral link copying)
    const hasDeposited = Boolean(
      (user.totalInvested || 0) > 0 ||
      (user.depositWallet || 0) > 0 ||
      (await Transaction.exists({
        user: user._id,
        type: "Deposit",
        status: { $in: ["Approved", "Completed"] },
      })) !== null
    );

    res.status(200).json({
      success: true,
      data: {
        referralCode: user.customId,
        referralLink,
        hasDeposited,
        sponsorId: user.sponsorId,
        directReferralsCount: activeDirectCount,
        totalRegisteredDirects: directUsers.length,
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
        directMembers: directUsers.map((u) => {
          const hasDeposit = Boolean(u.hasDeposited) || Number(u.totalInvested || 0) > 0 || Number(u.depositWallet || 0) > 0;
          return {
            ...u.toObject(),
            status: u.status === "Blocked" || u.status === "Suspended" ? u.status : (hasDeposit ? "Active" : "Inactive"),
          };
        }),
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

    let tiers = await ReferralSetting.find().sort({ levelNumber: 1 });
    const hasLevel0 = tiers.some(s => s.levelNumber === 0);
    const hasLevel1LegacyDeposit = tiers.some(s => s.levelNumber === 1 && s.depositAmount === 1000);
    const hasLevel11 = tiers.some(s => s.levelNumber > 10);

    if (!hasLevel0 || hasLevel1LegacyDeposit || hasLevel11 || tiers.length !== 11) {
      console.log("[Referrals User] Outdated settings detected. Resyncing Level 0-10 matrix...");
      await ReferralSetting.deleteMany({});
      await ReferralSetting.insertMany(LEVEL_ROI_DATA);
      tiers = await ReferralSetting.find().sort({ levelNumber: 1 });
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

    // Load tiers from DB for exact rates (Levels 1 to 10 for downline network)
    let tiers = await ReferralSetting.find().sort({ levelNumber: 1 });
    if (!tiers || tiers.length === 0) {
      tiers = [
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
    }

    // Downline tiers: strictly Level 1 to Level 10 (Level 0 is Self)
    const downlineTiers = tiers.filter((t) => t.levelNumber >= 1 && t.levelNumber <= 10);

    const isDepositCommEnabled = adminSettings.referralDepositCommissionEnabled !== false && adminSettings.referralSystemEnabled !== false;

    // Fetch actual referral bonus transactions credited to this sponsor
    const bonusTxns = await Transaction.find({
      user: user._id,
      type: "Referral Bonus",
      status: "Approved",
    });

    // Fetch all user ObjectIds that have approved or completed Deposit transactions
    const depositTxnUsers = await Transaction.distinct("user", {
      type: "Deposit",
      status: { $in: ["Approved", "Completed"] },
    });
    const depositedUserIdSet = new Set(depositTxnUsers.map((id) => String(id)));

    // Helper: Downline referral status is ONLY "Active" if user has made a deposit, otherwise "Inactive"
    const getDownlineStatus = (u) => {
      if (!u) return "Inactive";
      if (u.status === "Blocked" || u.status === "Suspended") return u.status;
      const hasDeposit =
        Boolean(u.hasDeposited) ||
        Number(u.totalInvested || 0) > 0 ||
        Number(u.depositWallet || 0) > 0 ||
        Number(u.firstInvestmentAmount || 0) > 0 ||
        depositedUserIdSet.has(String(u._id));
      return hasDeposit ? "Active" : "Inactive";
    };

    const getRateForLevel = (lvl) => {
      const found = tiers.find((t) => t.levelNumber === lvl);
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
      const found = tiers.find((t) => t.levelNumber === lvl);
      return found?.name || `Tier Level ${lvl}`;
    };

    // Load all users to dynamically construct multi-tier downline tree
    const allUsers = await User.find().select(
      "_id customId sponsorId name email phone country avatar currentRank rankLevel totalInvested depositWallet firstInvestmentAmount hasReceivedReferralBonus createdAt status"
    );

    const childrenMap = new Map();
    allUsers.forEach((u) => {
      if (u.sponsorId) {
        if (!childrenMap.has(u.sponsorId)) childrenMap.set(u.sponsorId, []);
        childrenMap.get(u.sponsorId).push(u);
      }
    });

    // Helper to dynamically calculate recursive multi-tier downline structure for any partner
    const getPartnerDownlineBreakdown = (partnerCustomId) => {
      const breakdown = [];
      let currentUsers = childrenMap.get(partnerCustomId) || [];
      let totalTeamVolume = 0;
      let totalTeamCount = 0;

      for (const tier of downlineTiers) {
        const lvl = tier.levelNumber;
        const count = currentUsers.length;
        const volume = currentUsers.reduce((sum, ch) => sum + (ch.totalInvested || 0), 0);
        totalTeamCount += count;
        totalTeamVolume += volume;

        breakdown.push({
          level: `L${lvl}`,
          levelNumber: lvl,
          count,
          volume,
          investCommission: tier.investCommission || `${tier.investCommissionRate || 0}%`,
          members: currentUsers.map((m) => ({
            id: m.customId,
            name: m.name,
            email: m.email,
            phone: m.phone || "—",
            invested: m.totalInvested || 0,
            status: getDownlineStatus(m),
            joined: m.createdAt ? m.createdAt.toISOString().split("T")[0] : "",
          })),
        });

        const nextUsers = [];
        currentUsers.forEach((ch) => {
          const nextKids = childrenMap.get(ch.customId);
          if (nextKids) nextUsers.push(...nextKids);
        });
        currentUsers = nextUsers;
      }

      return {
        directRefs: (childrenMap.get(partnerCustomId) || []).length,
        totalTeamCount,
        teamVolume: totalTeamVolume,
        levelBreakdown: breakdown,
      };
    };

    const formattedNetwork = [];
    const levelCounts = {};
    for (let i = 1; i <= 10; i++) {
      levelCounts[`level${i}`] = 0;
    }

    let currentParentIds = [user.customId, String(user._id)].filter(Boolean);

    for (const tier of downlineTiers) {
      const lvl = tier.levelNumber;
      levelCounts[`level${lvl}`] = 0;

      if (!currentParentIds || currentParentIds.length === 0) continue;

      const downlines = await User.find({
        sponsorId: { $in: currentParentIds },
      }).select("_id customId name email phone country avatar currentRank rankLevel totalInvested depositWallet firstInvestmentAmount hasReceivedReferralBonus sponsorId createdAt status");

      levelCounts[`level${lvl}`] = downlines.length;
      const rate = getRateForLevel(lvl);

      downlines.forEach((u) => {
        const invested = u.totalInvested || 0;
        const depositW = u.depositWallet || 0;
        const eligibleBaseAmount = u.firstInvestmentAmount || (u.hasReceivedReferralBonus ? u.firstInvestmentAmount || invested : (invested > 0 ? invested : depositW));

        let comm = 0;
        if (isDepositCommEnabled) {
          const matchedTxns = bonusTxns.filter((t) =>
            (t.note && (t.note.includes(u.customId) || (u.name && t.note.includes(u.name)))) ||
            (t.referenceNo && t.referenceNo.includes(u.customId))
          );
          if (matchedTxns.length > 0) {
            comm = matchedTxns.reduce((sum, t) => sum + Number(t.amount || 0), 0);
          } else if (eligibleBaseAmount > 0) {
            comm = parseFloat(((eligibleBaseAmount * rate) / 100).toFixed(2));
          }
        }

        const partnerStats = getPartnerDownlineBreakdown(u.customId);

        formattedNetwork.push({
          id: u.customId,
          name: u.name,
          email: u.email,
          phone: u.phone || "—",
          level: lvl,
          tierName: getTierNameForLevel(lvl),
          sponsor: u.sponsorId,
          invested,
          depositWallet: depositW,
          rate,
          teamVolume: partnerStats.teamVolume,
          directRefs: partnerStats.directRefs,
          totalTeamCount: partnerStats.totalTeamCount,
          levelBreakdown: partnerStats.levelBreakdown,
          firstInvestmentAmount: eligibleBaseAmount,
          directComm: lvl === 1 ? comm : 0,
          multiTierComm: lvl > 1 ? comm : 0,
          totalComm: comm,
          commissionEarned: comm,
          joined: u.createdAt ? u.createdAt.toISOString().split("T")[0] : "",
          status: getDownlineStatus(u),
          avatar: u.avatar || "",
          rank: u.currentRank || "Associate",
        });
      });

      currentParentIds = downlines.map((u) => u.customId).filter(Boolean);
    }

    // Build the complete hierarchical referral tree (Root is Level 0, children down to Tier 10)
    let totalTreeCommissionsEarned = 0;
    formattedNetwork.forEach((m) => {
      totalTreeCommissionsEarned += Number(m.totalComm || 0);
    });

    const buildTreeNodes = (parentId, currentLevel, visited) => {
      if (currentLevel > 10) return [];
      const kids = childrenMap.get(parentId) || [];
      const rate = getRateForLevel(currentLevel);

      return kids.map((kid) => {
        if (visited.has(kid.customId)) return null;
        visited.add(kid.customId);

        const invested = kid.totalInvested || 0;
        const depositW = kid.depositWallet || 0;
        const eligibleBaseAmount = kid.firstInvestmentAmount || (kid.hasReceivedReferralBonus ? kid.firstInvestmentAmount || invested : (invested > 0 ? invested : depositW));

        let comm = 0;
        if (isDepositCommEnabled) {
          const matchedTxns = bonusTxns.filter((t) =>
            (t.note && (t.note.includes(kid.customId) || (kid.name && t.note.includes(kid.name)))) ||
            (t.referenceNo && t.referenceNo.includes(kid.customId))
          );
          if (matchedTxns.length > 0) {
            comm = matchedTxns.reduce((sum, t) => sum + Number(t.amount || 0), 0);
          } else if (eligibleBaseAmount > 0) {
            comm = parseFloat(((eligibleBaseAmount * rate) / 100).toFixed(2));
          }
        }

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
          invested,
          depositWallet: depositW,
          status: getDownlineStatus(kid),
          joined: kid.createdAt ? kid.createdAt.toISOString().split("T")[0] : "",
          directCount: (childrenMap.get(kid.customId) || []).length,
          children: childNodes,
        };
      }).filter(Boolean);
    };

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
      depositWallet: user.depositWallet || 0,
      status: getDownlineStatus(user),
      totalEarnedCommission: parseFloat(totalTreeCommissionsEarned.toFixed(2)),
      directCount: (childrenMap.get(user.customId) || []).length,
      totalTeamCount: formattedNetwork.length,
      children: buildTreeNodes(user.customId, 1, new Set([user.customId])),
    };

    res.status(200).json({
      success: true,
      levelCounts,
      count: formattedNetwork.length,
      network: formattedNetwork,
      tree,
      tiers: downlineTiers,
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
  { level: 1, name: "Associate", ownDeposit: 50, totalClientDeposit: 5000, minInvest: 5000, reward: 100, condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )", companyProfitSharing: "0", downlineStructureRequired: "2 Active Direct Client", achievers: 4890, desc: "Entry leadership milestone unlocked with active direct network." },
  { level: 2, name: "Senior Associate", ownDeposit: 100, totalClientDeposit: 10000, minInvest: 10000, reward: 300, condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )", companyProfitSharing: "0", downlineStructureRequired: "3 Active Direct Clients", achievers: 2340, desc: "Demonstrated network volume builder." },
  { level: 3, name: "Team Leader", ownDeposit: 250, totalClientDeposit: 25000, minInvest: 25000, reward: 875, condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )", companyProfitSharing: "0", downlineStructureRequired: "3 Active Direct Clients  ( Min. 1 Associate )", achievers: 1210, desc: "Regional leadership leader managing team turnover." },
  { level: 4, name: "Director", ownDeposit: 500, totalClientDeposit: 50000, minInvest: 50000, reward: 2000, condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )", companyProfitSharing: "0", downlineStructureRequired: "4 Active Direct Clients ( Min 2 Sr. Associate )", achievers: 680, desc: "Executive director supervising multi-tier syndicates." },
  { level: 5, name: "Regional Director", ownDeposit: 1000, totalClientDeposit: 100000, minInvest: 100000, reward: 5000, condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )", companyProfitSharing: "0", downlineStructureRequired: "4 Active Direct Clients ( Min. 2 Team Leaders )", achievers: 340, desc: "Senior regional executive commanding six-figure volume." },
  { level: 6, name: "Executive Director", ownDeposit: 1500, totalClientDeposit: 200000, minInvest: 200000, reward: 10000, condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )", companyProfitSharing: "0.20% of the total company Profit + 500$ Per Month Salary", downlineStructureRequired: "5 Active Direct Clients ( Min. 2 Directors )", achievers: 160, desc: "Corporate syndicate leader receiving monthly salary and profit share." },
  { level: 7, name: "Diamond", ownDeposit: 2000, totalClientDeposit: 300000, minInvest: 300000, reward: 15000, condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )", companyProfitSharing: "0.50% of the Total Company Profit + 1000$ Per Month Salary", downlineStructureRequired: "6 Active Direct Clients ( Min. 2 Regional Directors )", achievers: 72, desc: "High-tier executive with expanded profit share and salary." },
  { level: 8, name: "Crown Diamond", ownDeposit: 3000, totalClientDeposit: 600000, minInvest: 600000, reward: 30000, condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )", companyProfitSharing: "0.75% of the Total Company Profit + 1500$ Per Month Salary", downlineStructureRequired: "8 Active Direct Clients ( Min. 2 Executive Directors )", achievers: 28, desc: "Elite summit council member with premier dividends." },
  { level: 9, name: "Global Ambassador", ownDeposit: 5000, totalClientDeposit: 1000000, minInvest: 1000000, reward: 50000, condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )", companyProfitSharing: "1% of the Total Company Profit + 3000$ Per Month Salary", downlineStructureRequired: "10 Active Direct Clients ( Min. 2 Diamonds )", achievers: 11, desc: "Apex global ambassador commanding global network volume." },
  { level: 10, name: "Titan", ownDeposit: 0, totalClientDeposit: 5000000, minInvest: 5000000, reward: 250000, condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )", companyProfitSharing: "1.25% of the Total Company Profit + 5000$ Per Month Salary", downlineStructureRequired: "15 Active Direct Clients ( Min. 2 Crown Diamond )", achievers: 5, desc: "Titan council leader commanding multi-million network turnover." },
  { level: 11, name: "Crown Titan", ownDeposit: 0, totalClientDeposit: 10000000, minInvest: 10000000, reward: 500000, condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )", companyProfitSharing: "1.50% of the Total Company Profit + 7500$ Per Month Salary", downlineStructureRequired: "20 Active Direct Clients ( Min. 2 Global Ambassador )", achievers: 2, desc: "Crown titan executive with premier corporate profit share." },
  { level: 12, name: "Global Titan", ownDeposit: 0, totalClientDeposit: 25000000, minInvest: 25000000, reward: 1250000, condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )", companyProfitSharing: "2% of the Total Company Profit + 10000$ Per Month Salary", downlineStructureRequired: "25 Active Direct Clients ( Min. 2 Titan )", achievers: 1, desc: "Pinnacle global titan summit leader commanding worldwide operations." },
];

// @desc    Get 12-Tier Rank Progression Ladder
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

    let ranks = await Rank.find({ status: "Active" }).sort({ level: 1 });
    if (!ranks || ranks.length === 0) {
      ranks = defaultLadderRanks;
    }

    // Direct referrals (Level 1)
    const directUsers = await User.find({ sponsorId: user.customId }).select(
      "customId name email totalInvested depositWallet hasDeposited status rankLevel teamTurnover"
    );

    const activeDirectCount = directUsers.filter(
      (u) => Boolean(u.hasDeposited) || Number(u.totalInvested || 0) > 0 || Number(u.depositWallet || 0) > 0
    ).length;

    const legsCount = directUsers.length;

    const turnover = Number(user.teamTurnover || 0);
    const ownInvested = Number(user.totalInvested || 0);

    // Evaluate qualification for each rank
    // Rank qualification strictly requires:
    // 1. Own deposit >= rank.ownDeposit
    // 2. Client turnover >= rank.totalClientDeposit
    // 3. Condition (at least 2 legs and required active direct clients)
    let qualifiedLevel = 0;
    for (const r of ranks) {
      const ownTarget = Number(r.ownDeposit || 0);
      const turnoverTarget = Number(r.totalClientDeposit || r.minInvest || 0);
      const reqDirectsMatch = (r.downlineStructureRequired || '').match(/\d+/);
      const reqDirects = reqDirectsMatch ? parseInt(reqDirectsMatch[0], 10) : 2;

      const ownMet = ownInvested >= ownTarget;
      const turnoverMet = turnover >= turnoverTarget;
      const condMet = (legsCount >= 2 || activeDirectCount >= 2) && activeDirectCount >= reqDirects;

      if (ownMet && turnoverMet && condMet) {
        qualifiedLevel = r.level;
      } else {
        break; // Tiers are progressive
      }
    }

    const isQualified = qualifiedLevel > 0;
    const currentRank = isQualified ? ranks.find((r) => r.level === qualifiedLevel) || ranks[0] : null;
    const targetLevel = qualifiedLevel + 1;
    const nextRank = ranks.find((r) => r.level === targetLevel) || ranks[ranks.length - 1];

    const turnoverTarget = nextRank.totalClientDeposit || nextRank.minInvest || 5000;
    const ownDepositTarget = nextRank.ownDeposit || 50;
    const progressPercent = Math.min(100, Math.round((turnover / turnoverTarget) * 100));

    res.status(200).json({
      success: true,
      data: {
        qualifiedLevel,
        currentLevel: qualifiedLevel,
        isQualified,
        currentRankName: isQualified ? (currentRank.name) : "Unranked (Associate in Progress)",
        rewardUnlocked: isQualified ? (currentRank.reward || 0) : 0,
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
    });
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

    // Har client ko sirf apne niche ke hi log dikhe bas:
    // 1. Build adjacency map to trace all downline members of req.user
    const allUsers = await User.find({}).select("customId sponsorId");
    const childrenMap = new Map();
    allUsers.forEach((u) => {
      if (u.sponsorId) {
        if (!childrenMap.has(u.sponsorId)) childrenMap.set(u.sponsorId, []);
        childrenMap.get(u.sponsorId).push(u.customId);
      }
    });

    // BFS to find all downstream downline customIds
    const downlineCustomIds = [];
    const queue = [user.customId, String(user._id)].filter(Boolean);
    const seen = new Set(queue);

    while (queue.length > 0) {
      const current = queue.shift();
      const kids = childrenMap.get(current) || [];
      for (const kid of kids) {
        if (!seen.has(kid)) {
          seen.add(kid);
          downlineCustomIds.push(kid);
          queue.push(kid);
        }
      }
    }

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
      .select("customId name email phone currentRank rankLevel totalReferrals teamTurnover createdAt");

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

