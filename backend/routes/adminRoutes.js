const express = require("express");
const router = express.Router();
const { protectAdmin } = require("../middlewares/auth");

// Controllers
const {
  loginAdmin,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  getAdminSettings,
  updateAdminSettings,
} = require("../controllers/admin/adminAuthController");

const {
  getDashboardKPIs,
  getDashboardCharts,
  getRecentActivities,
} = require("../controllers/admin/adminDashboardController");

const {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
} = require("../controllers/admin/adminPlansController");

const {
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  getDepositVideo,
  updateDepositVideo,
} = require("../controllers/admin/adminPaymentSettingsController");

const {
  getTransactions,
  getTransactionById,
  approveTransaction,
  rejectTransaction,
  deleteTransaction,
  clearAllTransactions,
} = require("../controllers/admin/adminTransactionsController");

const {
  getAllUsers,
  getUserById,
  updateUserStatus,
  adjustUserWallet,
  deleteUser,
} = require("../controllers/admin/adminUsersController");

const {
  getReferralSettings,
  updateReferralSetting,
  getPromotersNetwork,
} = require("../controllers/admin/adminReferralsController");

const {
  getAllRanks,
  createRank,
  updateRank,
  deleteRank,
  getAchieversLeaderboard,
} = require("../controllers/admin/adminRanksController");

const {
  getAllArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
} = require("../controllers/admin/adminNewsController");

const {
  getSupportTickets,
  getTicketById,
  replyTicket,
  updateTicketStatus,
  deleteTicket,
  getChannels,
  createChannel,
  updateChannel,
  deleteChannel,
} = require("../controllers/admin/adminSupportController");

// ──────── 1. AUTHENTICATION & PROFILE ────────
router.post("/auth/login", loginAdmin);
router.get("/auth/profile", protectAdmin, getAdminProfile);
router.put("/auth/profile", protectAdmin, updateAdminProfile);
router.put("/auth/change-password", protectAdmin, changeAdminPassword);
router.get("/auth/settings", protectAdmin, getAdminSettings);
router.put("/auth/settings", protectAdmin, updateAdminSettings);

// ──────── 2. DASHBOARD & KPIS ────────
router.get("/dashboard/kpis", protectAdmin, getDashboardKPIs);
router.get("/dashboard/charts", protectAdmin, getDashboardCharts);
router.get("/dashboard/activities", protectAdmin, getRecentActivities);

// ──────── 3. INVESTMENT PLANS ────────
router.get("/plans", protectAdmin, getAllPlans);
router.get("/plans/:id", protectAdmin, getPlanById);
router.post("/plans", protectAdmin, createPlan);
router.put("/plans/:id", protectAdmin, updatePlan);
router.delete("/plans/:id", protectAdmin, deletePlan);

// ──────── 4. PAYMENT SETTINGS & GATEWAYS ────────
router.get("/payment-methods", protectAdmin, getPaymentMethods);
router.post("/payment-methods", protectAdmin, createPaymentMethod);
router.put("/payment-methods/:id", protectAdmin, updatePaymentMethod);
router.delete("/payment-methods/:id", protectAdmin, deletePaymentMethod);
router.get("/payment-methods/video/tutorial", protectAdmin, getDepositVideo);
router.put("/payment-methods/video/tutorial", protectAdmin, updateDepositVideo);

// ──────── 5. TRANSACTIONS ────────
router.get("/transactions", protectAdmin, getTransactions);
router.delete("/transactions/clear/all", protectAdmin, clearAllTransactions);
router.get("/transactions/:id", protectAdmin, getTransactionById);
router.put("/transactions/:id/approve", protectAdmin, approveTransaction);
router.put("/transactions/:id/reject", protectAdmin, rejectTransaction);
router.delete("/transactions/:id", protectAdmin, deleteTransaction);

// ──────── 6. USERS MANAGEMENT ────────
router.get("/users", protectAdmin, getAllUsers);
router.get("/users/:id", protectAdmin, getUserById);
router.put("/users/:id/status", protectAdmin, updateUserStatus);
router.put("/users/:id/adjust-wallet", protectAdmin, adjustUserWallet);
router.delete("/users/:id", protectAdmin, deleteUser);

// ──────── 7. REFERRAL PLANS & PROMOTERS ────────
router.get("/referrals/settings", protectAdmin, getReferralSettings);
router.put("/referrals/settings/:id", protectAdmin, updateReferralSetting);
router.get("/referrals/promoters", protectAdmin, getPromotersNetwork);

// ──────── 8. RANKS PROGRESSION LADDER ────────
router.get("/ranks", protectAdmin, getAllRanks);
router.post("/ranks", protectAdmin, createRank);
router.put("/ranks/:id", protectAdmin, updateRank);
router.delete("/ranks/:id", protectAdmin, deleteRank);
router.get("/ranks/leaderboard", protectAdmin, getAchieversLeaderboard);

// ──────── 9. NEWS & BROADCASTS ────────
router.get("/news", protectAdmin, getAllArticles);
router.get("/news/:id", protectAdmin, getArticleById);
router.post("/news", protectAdmin, createArticle);
router.put("/news/:id", protectAdmin, updateArticle);
router.delete("/news/:id", protectAdmin, deleteArticle);

// ──────── 10. SUPPORT TICKETS & CHANNELS ────────
router.get("/support/tickets", protectAdmin, getSupportTickets);
router.get("/support/tickets/:id", protectAdmin, getTicketById);
router.post("/support/tickets/:id/reply", protectAdmin, replyTicket);
router.put("/support/tickets/:id/status", protectAdmin, updateTicketStatus);
router.delete("/support/tickets/:id", protectAdmin, deleteTicket);

router.get("/support/channels", protectAdmin, getChannels);
router.post("/support/channels", protectAdmin, createChannel);
router.put("/support/channels/:id", protectAdmin, updateChannel);
router.delete("/support/channels/:id", protectAdmin, deleteChannel);

// ──────── 11. MEDIA & FILE UPLOAD ────────
const upload = require("../middlewares/upload");
const { uploadFile, deleteFile } = require("../controllers/uploadController");
router.post("/upload", protectAdmin, upload.single("file"), uploadFile);
router.post("/upload/delete", protectAdmin, deleteFile);

module.exports = router;
