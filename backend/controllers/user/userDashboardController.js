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
    const activeAssetNames = [];

    activeInvestments.forEach((inv) => {
      totalDailyEarning += inv.dailyEarning || 0;
      totalPerSecondRate += inv.perSecondRate || 0;
      if (inv.planName) activeAssetNames.push(inv.planName);
    });

    // If user's stored rate differs, sync it
    if (activeContracts > 0) {
      user.dailyEarning = Number(totalDailyEarning.toFixed(4));
      user.perSecondRate = Number(totalPerSecondRate.toFixed(8));
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
    const streaming = {
      perSecondRate: user.perSecondRate || 0,
      dailyEarning: user.dailyEarning || 0,
      streamingProfit: user.totalProfit || user.earningWallet || 0,
      payoutType: user.payoutType || "Per Second (Live)",
      lastYieldSync: user.lastYieldSync || new Date(),
      serverTime: new Date().toISOString(),
      activeAssetNames: activeAssetNames.length > 0 ? activeAssetNames.join(" & ") : "",
    };

    // Affiliate Network stats
    const network = {
      totalReferrals: user.totalReferrals || 0,
      directReferrals: user.directReferrals || 0,
      teamTurnover: user.teamTurnover || 0,
      currentRank: user.currentRank || "Bronze Explorer",
      rankLevel: user.rankLevel || 1,
      sponsorId: user.sponsorId || "HORIZON-HQ",
      customId: user.customId || "HORIZON-USR-01",
    };

    // Wallets
    const wallets = {
      depositWallet: user.depositWallet || 0,
      earningWallet: user.earningWallet || 0,
      totalInvested: user.totalInvested || 0,
      totalProfit: user.totalProfit || 0,
      totalWithdrawn: user.totalWithdrawn || 0,
    };

    res.status(200).json({
      success: true,
      user,
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
