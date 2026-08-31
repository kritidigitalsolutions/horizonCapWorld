const User = require("../../models/User");
const UserInvestment = require("../../models/UserInvestment");
const Transaction = require("../../models/Transaction");
const { syncUserStreamingEarnings } = require("../../utils/yieldAndAffiliateEngine");

// @desc    Get Comprehensive User Dashboard Overview & Real-time Metrics
// @route   GET /api/user/dashboard/overview
exports.getDashboardOverview = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Sync live streaming ROI per second
    let user = await syncUserStreamingEarnings(userId);
    if (!user) {
      user = await User.findById(userId).select("-password -otp -otpExpires");
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User account not found." });
    }

    // 2. Fetch User Investments
    const activeInvestments = await UserInvestment.find({
      user: userId,
      status: "Active",
    }).sort({ createdAt: -1 });

    const completedInvestmentsCount = await UserInvestment.countDocuments({
      user: userId,
      status: "Completed",
    });

    // 3. Fetch Recent Transactions (strictly for this user)
    const recentTransactions = await Transaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(8);

    // 4. Calculate dynamic stats
    const totalInvested = activeInvestments.reduce((sum, inv) => sum + (inv.amount || 0), 0) || user.totalInvested || 0;
    const totalDailyEarning = activeInvestments.reduce((sum, inv) => sum + (inv.dailyEarning || 0), 0) || user.dailyEarning || 0;
    const totalPerSecondRate = activeInvestments.reduce((sum, inv) => sum + (inv.perSecondRate || 0), 0) || user.perSecondRate || 0;

    // 5. Next daily payout timestamp (Next UTC midnight)
    const now = new Date();
    const nextPayout = new Date(now);
    nextPayout.setUTCHours(24, 0, 0, 0);
    const msUntilNextPayout = Math.max(0, nextPayout.getTime() - now.getTime());

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          customId: user.customId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          country: user.country,
          city: user.city,
          sponsorId: user.sponsorId,
          currentRank: user.currentRank || "Bronze Explorer",
          rankLevel: user.rankLevel || 1,
          teamTurnover: user.teamTurnover || 0,
          totalReferrals: user.totalReferrals || 0,
          directReferrals: user.directReferrals || 0,
          is2FAEnabled: user.is2FAEnabled || false,
          status: user.status,
        },
        wallets: {
          depositWallet: user.depositWallet || 0,
          earningWallet: user.earningWallet || 0,
          totalInvested: user.totalInvested || totalInvested,
          totalProfit: user.totalProfit || 0,
          totalWithdrawn: user.totalWithdrawn || 0,
        },
        streaming: {
          dailyEarning: totalDailyEarning,
          perSecondRate: totalPerSecondRate,
          payoutType: "Per Second (Live)",
          lastYieldSync: user.lastYieldSync || now,
          nextPayoutInMs: msUntilNextPayout,
        },
        investments: {
          activeCount: activeInvestments.length,
          completedCount: completedInvestmentsCount,
          contracts: activeInvestments,
        },
        recentTransactions,
      },
    });
  } catch (error) {
    console.error("Error in getDashboardOverview:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

