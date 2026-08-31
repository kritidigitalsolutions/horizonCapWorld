const User = require("../../models/User");
const Transaction = require("../../models/Transaction");
const InvestmentPlan = require("../../models/InvestmentPlan");
const SupportTicket = require("../../models/SupportTicket");

// @desc    Get Admin Dashboard KPI Totals
// @route   GET /api/admin/dashboard/kpis
exports.getDashboardKPIs = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeInvestors = await User.countDocuments({ status: "Active" });

    // Aggregate Transactions
    const approvedDeposits = await Transaction.aggregate([
      { $match: { type: "Deposit", status: "Approved" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const grossDeposits = approvedDeposits[0]?.total || 0;

    const approvedWithdrawals = await Transaction.aggregate([
      { $match: { type: "Withdrawal", status: "Approved" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalWithdrawals = approvedWithdrawals[0]?.total || 0;

    const totalRoiAgg = await Transaction.aggregate([
      { $match: { type: { $in: ["ROI Return", "ROI Earning"] } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalYieldDistributed = totalRoiAgg[0]?.total || 0;

    const totalReferralAgg = await Transaction.aggregate([
      { $match: { type: "Referral Bonus" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalReferralPaid = totalReferralAgg[0]?.total || 0;

    // Platform Total AUM & Reserve
    const totalAUM = grossDeposits;
    const platformReserve = Math.max(0, grossDeposits - totalWithdrawals);

    res.status(200).json({
      success: true,
      kpis: {
        totalAUM: Math.round(totalAUM),
        activeInvestors,
        totalUsers,
        totalYieldDistributed: Math.round(totalYieldDistributed),
        platformReserve: Math.round(platformReserve),
        grossDeposits: Math.round(grossDeposits),
        totalWithdrawals: Math.round(totalWithdrawals),
        totalReferralPaid: Math.round(totalReferralPaid),
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
    const monthlyData = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthLabel = monthNames[d.getMonth()];

      const depositsAgg = await Transaction.aggregate([
        { $match: { type: "Deposit", status: "Approved", createdAt: { $gte: d, $lt: nextD } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);

      const yieldAgg = await Transaction.aggregate([
        { $match: { type: { $in: ["ROI Return", "ROI Earning"] }, createdAt: { $gte: d, $lt: nextD } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);

      const usersCount = await User.countDocuments({
        createdAt: { $gte: d, $lt: nextD },
      });

      monthlyData.push({
        month: monthLabel,
        deposits: depositsAgg[0]?.total || 0,
        yieldPaid: yieldAgg[0]?.total || 0,
        newUsers: usersCount,
      });
    }

    res.status(200).json({ success: true, charts: monthlyData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Recent Activities (Recent transactions, users, open tickets)
// @route   GET /api/admin/dashboard/activities
exports.getRecentActivities = async (req, res) => {
  try {
    const recentTransactions = await Transaction.find().sort({ createdAt: -1 }).limit(5);
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select("-password");
    const openTicketsCount = await SupportTicket.countDocuments({ status: "Open" });

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
