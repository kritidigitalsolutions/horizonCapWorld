const cron = require("node-cron");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const { sendMonthlyStatementEmail } = require("../utils/emailService");

/**
 * Helper to delay execution (prevents SMTP rate limiting during batch sending)
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generate and dispatch monthly account transaction statements for all investors
 * @param {Object} options
 * @param {number} [options.month] - 0-indexed month (0 = Jan, 8 = Sept, etc.)
 * @param {number} [options.year] - 4-digit year (e.g. 2026)
 * @param {string} [options.targetUserId] - Optional specific user ID to generate for
 */
const generateMonthlyStatements = async (options = {}) => {
  const { month, year, targetUserId } = options;
  const now = new Date();

  // If month/year not specified, default to previous calendar month
  let targetYear =
    year !== undefined
      ? Number(year)
      : now.getMonth() === 0
      ? now.getFullYear() - 1
      : now.getFullYear();

  let targetMonth =
    month !== undefined
      ? Number(month)
      : now.getMonth() === 0
      ? 11
      : now.getMonth() - 1;

  // Exact start and end bounds of the target month in UTC/Local
  const startOfMonth = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0);
  const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

  const periodName = startOfMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const startDateStr = startOfMonth.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const endDateStr = endOfMonth.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  console.log(
    `[Monthly Statement Service] Starting statement generation for: ${periodName} (${startDateStr} - ${endDateStr})`
  );

  let userQuery = { status: { $ne: "Blocked" } };
  if (targetUserId) {
    userQuery._id = targetUserId;
  }

  const users = await User.find(userQuery).select("name email customId earningWallet status");
  console.log(`[Monthly Statement Service] Found ${users.length} eligible account holders.`);

  let successfulDispatches = 0;
  let failedDispatches = 0;
  const errors = [];

  for (const user of users) {
    try {
      if (!user.email || !user.email.includes("@")) continue;

      // Query all transactions executed by this user during the statement month
      const transactions = await Transaction.find({
        user: user._id,
        $or: [
          { createdAt: { $gte: startOfMonth, $lte: endOfMonth } },
          {
            date: {
              $gte: startOfMonth.toISOString().split("T")[0],
              $lte: endOfMonth.toISOString().split("T")[0],
            },
          },
        ],
      }).sort({ createdAt: -1 });

      let totalDeposits = 0;
      let totalWithdrawals = 0;
      let totalEarnings = 0;

      transactions.forEach((tx) => {
        const amt = Number(tx.amount) || 0;
        if (
          tx.type === "Deposit" &&
          (tx.status === "Approved" || tx.status === "Completed")
        ) {
          totalDeposits += amt;
        } else if (
          tx.type === "Withdrawal" &&
          (tx.status === "Approved" || tx.status === "Completed")
        ) {
          totalWithdrawals += amt;
        } else if (
          tx.type === "ROI Return" ||
          tx.type === "Referral Bonus" ||
          tx.type === "Rank Bonus"
        ) {
          totalEarnings += amt;
        }
      });

      // Dispatch genuine email
      const result = await sendMonthlyStatementEmail({
        to: user.email,
        name: user.name,
        customId: user.customId || "HORIZON-USR",
        periodName,
        startDate: startDateStr,
        endDate: endDateStr,
        summary: {
          totalDeposits,
          totalWithdrawals,
          totalEarnings,
          endingBalance: user.earningWallet || 0,
          transactionCount: transactions.length,
        },
        transactions: transactions.map((t) => ({
          customId: t.customId || String(t._id).slice(-8),
          type: t.type,
          amount: t.amount,
          status: t.status,
          date: t.date || (t.createdAt ? t.createdAt.toISOString().split("T")[0] : ""),
        })),
      });

      if (result?.success) {
        successfulDispatches++;
      } else {
        failedDispatches++;
        errors.push({ email: user.email, error: result?.error });
      }

      // Small delay between sends to ensure SMTP compliance
      await delay(180);
    } catch (err) {
      failedDispatches++;
      errors.push({ email: user.email, error: err.message });
      console.error(
        `[Monthly Statement Service] Error sending statement to ${user.email}:`,
        err.message
      );
    }
  }

  console.log(
    `[Monthly Statement Service] Completed for ${periodName}. Sent: ${successfulDispatches}, Failed: ${failedDispatches}`
  );

  return {
    success: true,
    periodName,
    startDate: startDateStr,
    endDate: endDateStr,
    totalAccounts: users.length,
    successfulDispatches,
    failedDispatches,
    errors,
  };
};

/**
 * Initialize monthly cron schedule:
 * Runs on the 1st day of every month at 00:05 AM (UTC/Local)
 */
const initMonthlyStatementCron = () => {
  // Cron expression: minute 5, hour 0, day-of-month 1, all months, all days
  cron.schedule("5 0 1 * *", async () => {
    console.log(
      "[Monthly Statement Cron] Automated monthly statement trigger executing (1st of month)..."
    );
    try {
      await generateMonthlyStatements();
    } catch (error) {
      console.error(
        "[Monthly Statement Cron] Critical error during monthly statements dispatch:",
        error.message
      );
    }
  });

  console.log(
    "[Monthly Statement Cron] Registered successfully: Scheduled for 1st of every month at 00:05"
  );
};

module.exports = {
  generateMonthlyStatements,
  initMonthlyStatementCron,
};
