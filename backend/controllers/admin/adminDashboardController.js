const User = require("../../models/User");
const Transaction = require("../../models/Transaction");
const InvestmentPlan = require("../../models/InvestmentPlan");
const UserInvestment = require("../../models/UserInvestment");
const SupportTicket = require("../../models/SupportTicket");
const Notification = require("../../models/Notification");

// @desc    Get Sidebar Dot Counters (Unseen Users, Unseen Transactions, Unread Alerts, Open Tickets)
// @route   GET /api/admin/sidebar/counters
exports.getSidebarCounters = async (req, res) => {
  try {
    const [unseenUsers, unseenTransactions, unreadNotifications, openTickets] = await Promise.all([
      User.countDocuments({ isSeenByAdmin: false }),
      Transaction.countDocuments({ isSeenByAdmin: false }),
      Notification.countDocuments({ recipientType: "ADMIN", read: false }),
      SupportTicket.countDocuments({ status: "Open" }),
    ]);

    res.status(200).json({
      success: true,
      counters: {
        users: unseenUsers,
        transactions: unseenTransactions,
        notifications: unreadNotifications,
        tickets: openTickets,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Admin Dashboard KPI Totals
// @route   GET /api/admin/dashboard/kpis
exports.getDashboardKPIs = async (req, res) => {
  try {
    const [
      totalUsers,
      activeInvestors,
      approvedDeposits,
      approvedWithdrawals,
      totalRoiInvestments,
      totalRoiTransactions,
      userTotalProfitAgg,
      totalReferralAgg,
      depositedTxUsers,
      usersWithInvestOrWallet,
      roiWithdrawnUsersList,
      usersWithWithdrawnBalance,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: "Active" }),
      Transaction.aggregate([
        { $match: { type: "Deposit", status: { $in: ["Approved", "Completed"] } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        { $match: { type: "Withdrawal", status: { $in: ["Approved", "Completed"] } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      UserInvestment.aggregate([
        { $group: { _id: null, total: { $sum: "$totalProfitEarned" } } },
      ]),
      Transaction.aggregate([
        { $match: { type: { $in: ["ROI Return", "ROI Earning"] } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      User.aggregate([
        { $group: { _id: null, total: { $sum: "$totalProfit" }, totalPvRoi: { $sum: "$pvRoiBalance" } } },
      ]),
      Transaction.aggregate([
        { $match: { type: { $in: ["Referral Bonus", "Rank Bonus"] } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.distinct("user", { type: "Deposit", status: { $in: ["Approved", "Completed"] } }),
      User.find({
        $or: [
          { totalInvested: { $gt: 0 } },
          { depositWallet: { $gt: 0 } },
          { hasDeposited: true },
        ],
      }).select("_id"),
      Transaction.distinct("user", { type: "Withdrawal", status: { $in: ["Approved", "Completed"] } }),
      User.countDocuments({ totalWithdrawn: { $gt: 0 } }),
    ]);

    const grossDeposits = approvedDeposits[0]?.total || 0;
    const totalWithdrawals = approvedWithdrawals[0]?.total || 0;

    // Accurate Total ROI: take highest of UserInvestment cumulative yield, User totalProfit, or Transaction ROI
    const investmentRoi = totalRoiInvestments[0]?.total || 0;
    const userProfit = userTotalProfitAgg[0]?.total || 0;
    const txRoi = totalRoiTransactions[0]?.total || 0;
    const totalYieldDistributed = Math.max(investmentRoi, userProfit, txRoi);

    // Platform Total AUM
    const totalAUM = grossDeposits;
    const platformReserve = Math.max(0, grossDeposits - totalWithdrawals);

    // Calculate unique Money Deposited Clients
    const depositedUserIdSet = new Set([
      ...depositedTxUsers.filter(Boolean).map((id) => String(id)),
      ...usersWithInvestOrWallet.map((u) => String(u._id)),
    ]);
    const moneyDepositedClients = depositedUserIdSet.size;

    // ROI Disbursed / Users who withdrew ROI
    const distinctWithdrawnUsers = roiWithdrawnUsersList.filter(Boolean).length;
    const roiDisbursedUsers = Math.max(distinctWithdrawnUsers, usersWithWithdrawnBalance);
    const roiDisbursedAmount = totalWithdrawals;

    res.status(200).json({
      success: true,
      kpis: {
        totalAUM: Math.round(totalAUM),
        registeredClients: totalUsers,
        totalUsers,
        moneyDepositedClients,
        activeInvestors,
        totalYieldDistributed: Math.round(totalYieldDistributed),
        roiDisbursedAmount: Number(roiDisbursedAmount.toFixed(2)),
        roiDisbursedUsers,
        platformReserve: Math.round(platformReserve),
        grossDeposits: Math.round(grossDeposits),
        totalWithdrawals: Number(totalWithdrawals.toFixed(2)),
        totalReferralPaid: Math.round(totalReferralAgg[0]?.total || 0),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Admin Dashboard Chart Data (Yield & Volume)
// @route   GET /api/admin/dashboard/charts
exports.getDashboardCharts = async (req, res) => {
  try {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();

    const monthRanges = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthLabel = monthNames[d.getMonth()];
      monthRanges.push({ d, nextD, monthLabel });
    }

    // 1. Monthly Trends & User Growth
    const monthlyDataPromise = Promise.all(
      monthRanges.map(async ({ d, nextD, monthLabel }) => {
        const [depositsAgg, yieldAgg, usersCount] = await Promise.all([
          Transaction.aggregate([
            { $match: { type: "Deposit", status: { $in: ["Approved", "Completed"] }, createdAt: { $gte: d, $lt: nextD } } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ]),
          Transaction.aggregate([
            { $match: { type: { $in: ["ROI Return", "ROI Earning"] }, createdAt: { $gte: d, $lt: nextD } } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ]),
          User.countDocuments({
            createdAt: { $gte: d, $lt: nextD },
          }),
        ]);

        return {
          month: monthLabel,
          deposits: depositsAgg[0]?.total || 0,
          yieldPaid: yieldAgg[0]?.total || 0,
          newUsers: usersCount,
        };
      })
    );

    // 2. Dynamic Portfolio Asset Allocation by Investment Sector
    const sectorAggPromise = UserInvestment.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      {
        $group: {
          _id: { $ifNull: ["$planCategory", "$planName"] },
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    const [monthlyData, sectorAgg] = await Promise.all([
      monthlyDataPromise,
      sectorAggPromise,
    ]);

    const palette = ['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#C8A200', '#6366F1'];
    const totalSectorVolume = sectorAgg.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

    const assetDistribution = sectorAgg.map((s, idx) => {
      const percentage = totalSectorVolume > 0 ? Math.round((s.totalAmount / totalSectorVolume) * 100) : 0;
      return {
        name: s._id || 'Diversified Assets',
        value: percentage,
        amount: `$${Number(s.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        rawAmount: s.totalAmount || 0,
        color: palette[idx % palette.length],
        count: s.count || 0,
      };
    });

    res.status(200).json({
      success: true,
      charts: monthlyData,
      assetDistribution,
      totalSectorVolume,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Recent Activities (Recent transactions, users, open tickets)
// @route   GET /api/admin/dashboard/activities
exports.getRecentActivities = async (req, res) => {
  try {
    const [recentTransactions, recentUsers, openTicketsCount] = await Promise.all([
      Transaction.find().sort({ createdAt: -1 }).limit(5).lean(),
      User.find().sort({ createdAt: -1 }).limit(5).select("-password").lean(),
      SupportTicket.countDocuments({ status: "Open" }),
    ]);

    res.status(200).json({
      success: true,
      recentTransactions,
      recentUsers,
      openTicketsCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
