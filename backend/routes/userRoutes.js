const express = require("express");
const router = express.Router();

const { protectUser } = require("../middlewares/auth");

// Controllers
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  sendOtp,
  verifyOtp,
  toggle2FA,
} = require("../controllers/user/userAuthController");

const {
  getDashboardOverview,
} = require("../controllers/user/userDashboardController");

const {
  getPlans,
  getPlanById,
  investInPlan,
  getMyInvestments,
  getInvestmentById,
} = require("../controllers/user/userInvestmentsController");

const {
  getDepositGateways,
  createDeposit,
  createWithdrawal,
  getTransactions,
  getTransactionById,
} = require("../controllers/user/userTransactionsController");

const {
  getReferralOverview,
  getReferralCommissions,
  getReferralNetwork,
  getRankLadder,
  getMyRankStatus,
  getLeaderboard,
} = require("../controllers/user/userAffiliateController");

const {
  getNews,
  getNewsArticle,
  getDepositVideo,
  getSupportChannels,
  createSupportTicket,
  getMyTickets,
  getTicketById,
  replyToTicket,
} = require("../controllers/user/userContentController");

// ──────── 1. AUTHENTICATION & PROFILE ────────
router.post("/auth/register", register);
router.post("/auth/login", login);
router.get("/auth/me", protectUser, getProfile);
router.get("/profile", protectUser, getProfile);
router.put("/profile", protectUser, updateProfile);
router.put("/profile/password", protectUser, changePassword);
router.post("/profile/send-otp", protectUser, sendOtp);
router.post("/profile/verify-otp", protectUser, verifyOtp);
router.put("/profile/2fa", protectUser, toggle2FA);

// ──────── 2. DASHBOARD OVERVIEW ────────
router.get("/dashboard/overview", protectUser, getDashboardOverview);

// ──────── 3. PLANS & INVESTMENTS ────────
router.get("/plans", getPlans);
router.get("/plans/:id", getPlanById);
router.post("/investments", protectUser, investInPlan);
router.get("/investments", protectUser, getMyInvestments);
router.get("/investments/:id", protectUser, getInvestmentById);

// ──────── 4. DEPOSITS & WITHDRAWALS ────────
router.get("/deposits/gateways", protectUser, getDepositGateways);
router.get("/deposits/tutorial-video", getDepositVideo);
router.post("/deposits", protectUser, createDeposit);
router.post("/withdrawals", protectUser, createWithdrawal);
router.get("/transactions", protectUser, getTransactions);
router.get("/transactions/:id", protectUser, getTransactionById);

// ──────── 5. REFERRALS & RANKS ────────
router.get("/referrals/overview", protectUser, getReferralOverview);
router.get("/referrals/commissions", getReferralCommissions);
router.get("/referrals/network", protectUser, getReferralNetwork);
router.get("/ranks/ladder", getRankLadder);
router.get("/ranks/my-rank", protectUser, getMyRankStatus);
router.get("/ranks/leaderboard", getLeaderboard);

// ──────── 6. NEWS & MEDIA ────────
router.get("/news", getNews);
router.get("/news/:id", getNewsArticle);

// ──────── 7. SUPPORT HELPDESK ────────
router.get("/support/channels", getSupportChannels);
router.post("/support/tickets", protectUser, createSupportTicket);
router.get("/support/tickets", protectUser, getMyTickets);
router.get("/support/tickets/:id", protectUser, getTicketById);
router.post("/support/tickets/:id/reply", protectUser, replyToTicket);

// ──────── 8. MEDIA & FILE UPLOAD ────────
const upload = require("../middlewares/upload");
const { uploadFile, deleteFile } = require("../controllers/uploadController");
router.post("/upload", protectUser, upload.single("file"), uploadFile);
router.post("/upload/delete", protectUser, deleteFile);

module.exports = router;

