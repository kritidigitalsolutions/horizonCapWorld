const User = require("../models/User");
const UserInvestment = require("../models/UserInvestment");
const ReferralSetting = require("../models/ReferralSetting");
const Rank = require("../models/Rank");
const Transaction = require("../models/Transaction");
const AdminSettings = require("../models/AdminSettings");

/**
 * Synchronize real-time streaming earnings for an investor
 * Calculates accrued yields from all active investment contracts
 * @param {Object} user - Mongoose User Document or plain user object
 * @returns {Object} updated user
 */
const syncUserStreamingEarnings = async (user) => {
  try {
    if (!user || !user._id) return user;

    const userDoc = user._id ? await User.findById(user._id) : user;
    if (!userDoc) return user;

    const now = new Date();
    const lastSync = userDoc.lastYieldSync ? new Date(userDoc.lastYieldSync) : new Date(userDoc.createdAt || now);
    const elapsedSeconds = Math.max(0, (now.getTime() - lastSync.getTime()) / 1000);

    // If less than 0.1 second elapsed, no yield to accrue yet
    if (elapsedSeconds < 0.1) {
      return userDoc;
    }

    const activeInvestments = await UserInvestment.find({
      user: userDoc._id,
      status: "Active",
    });

    if (!activeInvestments || activeInvestments.length === 0) {
      if (userDoc.dailyEarning !== 0 || userDoc.perSecondRate !== 0) {
        userDoc.dailyEarning = 0;
        userDoc.perSecondRate = 0;
      }
      userDoc.lastYieldSync = now;
      await userDoc.save();
      return userDoc;
    }

    let totalAccruedYield = 0;
    let currentDailyEarning = 0;
    let currentPerSecondRate = 0;

    for (const inv of activeInvestments) {
      const invDaily =
        inv.dailyEarning ||
        (inv.dailyRoi
          ? inv.amount * (inv.dailyRoi / 100)
          : (inv.amount * (inv.roi || 7.5) / 100) / 30);
      const invPerSec = inv.perSecondRate || invDaily / 86400;

      currentDailyEarning += invDaily;
      currentPerSecondRate += invPerSec;

      // Calculate accrued yield for this contract using exact elapsed seconds
      const contractYield = elapsedSeconds * invPerSec;
      totalAccruedYield += contractYield;

      inv.totalProfitEarned = Number(((inv.totalProfitEarned || 0) + contractYield).toFixed(8));
      inv.lastSettlementAt = now;

      // Check if non-infinite contract has expired
      if (!inv.isInfinite && inv.endDate && now >= new Date(inv.endDate)) {
        inv.status = "Completed";
      }

      await inv.save();
    }

    // Update user wallets and streaming rates with high precision (8 decimals)
    if (totalAccruedYield > 0) {
      userDoc.earningWallet = Number(((userDoc.earningWallet || 0) + totalAccruedYield).toFixed(8));
      userDoc.totalProfit = Number(((userDoc.totalProfit || 0) + totalAccruedYield).toFixed(8));
    }

    userDoc.dailyEarning = Number(currentDailyEarning.toFixed(4));
    userDoc.perSecondRate = Number(currentPerSecondRate.toFixed(8));
    userDoc.lastYieldSync = now;

    await userDoc.save();
    return userDoc;
  } catch (error) {
    console.error("[Yield Engine] syncUserStreamingEarnings error:", error.message);
    return user;
  }
};

/**
 * Distribute Multi-Tier Referral Commissions upon deposit, investment, or ROI profit
 */
const distributeReferralCommissions = async (userId, amount, commissionType = "investment") => {
  try {
    if (!amount || amount <= 0) return;

    // Check Global Admin Settings Referral Toggles
    const settings = await AdminSettings.findOne();
    if (settings) {
      if (settings.referralSystemEnabled === false) {
        console.log("[Affiliate Engine] Referral system is globally disabled by admin. Skipping distribution.");
        return;
      }
      if (commissionType === "investment" && settings.referralDepositCommissionEnabled === false) {
        console.log("[Affiliate Engine] Direct investment deposit commissions are disabled by admin. Skipping.");
        return;
      }
      if (commissionType === "earnings" && settings.referralRoiShareEnabled === false) {
        console.log("[Affiliate Engine] ROI profit share commissions are disabled by admin. Skipping.");
        return;
      }
    }

    const investor = await User.findById(userId);
    if (!investor || !investor.sponsorId || investor.sponsorId === "HORIZON-HQ") {
      return;
    }

    // Load only active referral tiers ordered by levelNumber
    const refSettings = await ReferralSetting.find({ status: { $ne: "Inactive" } }).sort({ levelNumber: 1 });
    if (!refSettings || refSettings.length === 0) return;

    let currentSponsorId = investor.sponsorId;

    for (const tier of refSettings) {
      if (!currentSponsorId || currentSponsorId === "HORIZON-HQ") break;

      const sponsor = await User.findOne({
        $or: [
          { customId: currentSponsorId },
          ...(/^[0-9a-fA-F]{24}$/.test(currentSponsorId) ? [{ _id: currentSponsorId }] : []),
        ],
      });

      if (!sponsor) break;

      const rate = commissionType === "investment" ? (tier.investCommissionRate || 5) : (tier.earningsCommissionRate || 5);
      const bonus = parseFloat(((amount * rate) / 100).toFixed(2));

      if (bonus > 0) {
        sponsor.earningWallet = parseFloat(((sponsor.earningWallet || 0) + bonus).toFixed(2));
        sponsor.totalProfit = parseFloat(((sponsor.totalProfit || 0) + bonus).toFixed(2));
        if (commissionType === "investment") {
          sponsor.teamTurnover = parseFloat(((sponsor.teamTurnover || 0) + amount).toFixed(2));
        }
        await sponsor.save();

        const typeLabel = commissionType === "investment" ? "Deposit Commission" : "Daily ROI Profit Share";

        await Transaction.create({
          user: sponsor._id,
          userName: sponsor.name,
          userCustomId: sponsor.customId,
          userEmail: sponsor.email,
          country: sponsor.country,
          type: "Referral Bonus",
          amount: bonus,
          rawAmount: bonus,
          fee: 0,
          netAmount: bonus,
          gateway: "Affiliate Engine",
          referenceNo: `REF-${tier.level || 'L' + tier.levelNumber}-${Date.now().toString().slice(-5)}`,
          status: "Approved",
          note: `Tier ${tier.level || 'L' + tier.levelNumber} (${rate}%) ${typeLabel} from downline ${investor.name} (${investor.customId}).`,
        });
      }

      currentSponsorId = sponsor.sponsorId;
    }
  } catch (error) {
    console.error("[Affiliate Engine] distributeReferralCommissions error:", error.message);
  }
};

module.exports = {
  syncUserStreamingEarnings,
  distributeReferralCommissions,
};
