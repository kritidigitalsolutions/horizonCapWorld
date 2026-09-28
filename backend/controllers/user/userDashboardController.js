const User = require("../../models/User");
const UserInvestment = require("../../models/UserInvestment");
const Transaction = require("../../models/Transaction");
const InvestmentPlan = require("../../models/InvestmentPlan");
const { syncUserStreamingEarnings } = require("../../utils/yieldAndAffiliateEngine");

// @desc    Get Investor Dashboard Overview (Wallets, KPIs, Charts, Streaming Rates, Recent Activity)
// @route   GET /api/user/dashboard/overview
exports.getDashboardOverview = async (req, res) => {
  try {
    let user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "Investor account not found." });
    }

    // Synchronize streaming earnings to accurately accrue yields up to current millisecond
    user = await syncUserStreamingEarnings(user);

    // Active Investments
    const activeInvestments = await UserInvestment.find({
      user: user._id,
      status: "Active",
    }).sort({ createdAt: -1 });

    const activeContracts = activeInvestments.length;

    // Calculate aggregated dynamic daily earnings & streaming per-sec rates from active contracts
    let totalDailyEarning = 0;
    let totalPerSecondRate = 0;
    let hasDailyPlan = false;
    let hasPerSecondPlan = false;
    const activeAssetNames = [];

    activeInvestments.forEach((inv) => {
      totalDailyEarning += inv.dailyEarning || 0;
      const isDaily = (inv.payoutInterval || "").toLowerCase().includes("daily");
      if (isDaily) {
        hasDailyPlan = true;
      } else {
        hasPerSecondPlan = true;
        totalPerSecondRate += inv.perSecondRate || 0;
      }
      if (inv.planName) activeAssetNames.push(inv.planName);
    });

    let derivedPayoutType = "Per Second (Live)";
    if (hasDailyPlan && hasPerSecondPlan) {
      derivedPayoutType = "Hybrid (Per Second & Daily)";
    } else if (hasDailyPlan) {
      derivedPayoutType = "Daily Payout";
    } else if (hasPerSecondPlan) {
      derivedPayoutType = "Per Second (Live)";
    }

    // If user's stored rate differs, sync it
    if (activeContracts > 0) {
      user.dailyEarning = Number(totalDailyEarning.toFixed(4));
      user.perSecondRate = Number(totalPerSecondRate.toFixed(8));
      user.payoutType = derivedPayoutType;
      await user.save();
    } else {
      if (user.dailyEarning !== 0 || user.perSecondRate !== 0) {
        user.dailyEarning = 0;
        user.perSecondRate = 0;
        await user.save();
      }
    }

    // Recent Transactions
    const recentTransactions = await Transaction.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(6);

    // Dynamic Portfolio breakdown
    const portfolioSummary = {
      totalInvested: user.totalInvested || 0,
      activeContracts,
      totalYield: user.totalProfit || 0,
      dailyYieldRate: user.dailyEarning || 0,
    };

    // Live Yield Streaming details
    // 3. Next Daily Settlement Timing: 24 hours rolling from each investment's start/settlement time
    const CYCLE_MS = 24 * 60 * 60 * 1000;
    let nextSettlementTime = null;
    let settlementStartTime = null;
    let settlementRemainingMs = 0;

    if (activeContracts > 0) {
      const nowMs = Date.now();
      const upcomingTimes = [];

      activeInvestments.forEach((inv) => {
        const refTime = new Date(inv.lastSettlementAt || inv.startDate || inv.createdAt || nowMs).getTime();
        if (!isNaN(refTime) && refTime > 0) {
          const elapsedMs = Math.max(0, nowMs - refTime);
          const cycleIndex = Math.floor(elapsedMs / CYCLE_MS);
          upcomingTimes.push(refTime + (cycleIndex + 1) * CYCLE_MS);
        }
      });

      const startDates = activeInvestments
        .map((inv) => new Date(inv.startDate || inv.createdAt).getTime())
        .filter((time) => !isNaN(time) && time > 0);

      const referenceStartTime = startDates.length > 0 ? Math.min(...startDates) : nowMs;
      settlementStartTime = new Date(referenceStartTime).toISOString();

      if (upcomingTimes.length > 0) {
        const earliestNext = Math.min(...upcomingTimes);
        nextSettlementTime = new Date(earliestNext).toISOString();
        settlementRemainingMs = Math.max(0, earliestNext - nowMs);
      }
    }

    const streaming = {
      perSecondRate: user.perSecondRate || 0,
      dailyEarning: user.dailyEarning || 0,
      streamingProfit: user.totalProfit || user.earningWallet || 0,
      earningWallet: user.earningWallet || 0,
      payoutType: derivedPayoutType,
      hasDailyPlan,
      hasPerSecondPlan,
      activeContracts,
      lastYieldSync: user.lastYieldSync || new Date(),
      serverTime: new Date().toISOString(),
      activeAssetNames: activeAssetNames.length > 0 ? activeAssetNames.join(" & ") : "",
      nextSettlementTime,
      settlementStartTime,
      settlementRemainingMs,
    };

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

    // 1. Personal Volume: All deposits made by the user
    const personalDepositAggr = await Transaction.aggregate([
      {
        $match: {
          user: user._id,
          type: "Deposit",
          status: { $in: ["Approved", "Completed"] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);
    const txnPersonalDeposit = personalDepositAggr.length > 0 ? Number(personalDepositAggr[0].total) : 0;
    const fallbackPersonalDeposit = Number(user.depositWallet || 0) + Number(user.totalInvested || 0);
    const personalVolume = Math.max(txnPersonalDeposit, fallbackPersonalDeposit);

    // 2. Group Volume: All deposits made in user's referral tree downline (excluding user's own deposits)
    const allUsers = await User.find({}).select("_id customId sponsorId totalInvested depositWallet");
    const childrenMap = new Map();
    for (const u of allUsers) {
      if (u.sponsorId) {
        if (!childrenMap.has(u.sponsorId)) childrenMap.set(u.sponsorId, []);
        childrenMap.get(u.sponsorId).push(u);
      }
    }

    const downlineUsers = [];
    const queue = [user.customId, String(user._id)].filter(Boolean);
    const seen = new Set([user.customId, String(user._id)]);

    while (queue.length > 0) {
      const currentSponsorId = queue.shift();
      const children = childrenMap.get(currentSponsorId) || [];
      for (const ch of children) {
        const chIdStr = String(ch._id);
        if (!seen.has(chIdStr) && (!ch.customId || !seen.has(ch.customId))) {
          seen.add(chIdStr);
          if (ch.customId) seen.add(ch.customId);
          downlineUsers.push(ch);
          queue.push(ch.customId || chIdStr);
        }
      }
    }

    let groupVolume = 0;
    if (downlineUsers.length > 0) {
      const downlineUserObjectIds = downlineUsers.map((u) => u._id);
      const groupDepositAggr = await Transaction.aggregate([
        {
          $match: {
            user: { $in: downlineUserObjectIds },
            type: "Deposit",
            status: { $in: ["Approved", "Completed"] },
          },
        },
        {
          $group: {
            _id: "$user",
            totalDeposit: { $sum: "$amount" },
          },
        },
      ]);

      const depositMap = new Map();
      groupDepositAggr.forEach((item) => {
        depositMap.set(String(item._id), Number(item.totalDeposit || 0));
      });

      for (const downline of downlineUsers) {
        const txnDeposit = depositMap.get(String(downline._id)) || 0;
        const fallbackDeposit = Number(downline.totalInvested || 0) + Number(downline.depositWallet || 0);
        groupVolume += Math.max(txnDeposit, fallbackDeposit);
      }
    }

    // Affiliate Network stats
    const network = {
      totalReferrals: user.totalReferrals || 0,
      directReferrals: user.directReferrals || 0,
      teamTurnover: user.teamTurnover || 0,
      currentRank: user.currentRank || "Associate",
      rankLevel: user.rankLevel || 1,
      sponsorId: user.sponsorId || "HORIZON-HQ",
      customId: user.customId || "HORIZON-USR-01",
      hasDeposited,
      personalVolume,
      groupVolume,
    };

    // Wallets
    const wallets = {
      depositWallet: user.depositWallet || 0,
      earningWallet: user.earningWallet || 0,
      totalInvested: user.totalInvested || 0,
      totalProfit: user.totalProfit || 0,
      totalWithdrawn: user.totalWithdrawn || 0,
      personalVolume,
      groupVolume,
    };

    res.status(200).json({
      success: true,
      user: {
        ...user.toObject(),
        hasDeposited,
        personalVolume,
        groupVolume,
      },
      personalVolume,
      groupVolume,
      wallets,
      portfolioSummary,
      streaming,
      network,
      recentTransactions,
      activeInvestments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
