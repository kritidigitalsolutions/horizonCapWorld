const User = require("../models/User");
const UserInvestment = require("../models/UserInvestment");
const ReferralSetting = require("../models/ReferralSetting");
const Rank = require("../models/Rank");
const Transaction = require("../models/Transaction");

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
    const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - lastSync.getTime()) / 1000));

    // If less than 1 second elapsed, no yield to accrue yet
    if (elapsedSeconds <= 0) {
      return userDoc;
    }

    const activeInvestments = await UserInvestment.find({
      user: userDoc._id,
      status: "Active",
    });

    if (!activeInvestments || activeInvestments.length === 0) {
      userDoc.lastYieldSync = now;
      await userDoc.save();
      return userDoc;
    }

    let totalAccruedYield = 0;
    let currentDailyEarning = 0;
    let currentPerSecondRate = 0;

    for (const inv of activeInvestments) {
      const invPerSec = inv.perSecondRate || (inv.amount * (inv.roi / 100)) / (30 * 86400);
      const invDaily = inv.dailyEarning || (inv.amount * (inv.roi / 100)) / 30;

      currentDailyEarning += invDaily;
      currentPerSecondRate += invPerSec;

      // Calculate accrued yield for this contract
      const contractYield = elapsedSeconds * invPerSec;
      totalAccruedYield += contractYield;

      inv.totalProfitEarned = (inv.totalProfitEarned || 0) + contractYield;
      inv.lastSettlementAt = now;

      // Check if non-infinite contract has expired
      if (!inv.isInfinite && inv.endDate && now >= new Date(inv.endDate)) {
        inv.status = "Completed";
      }

      await inv.save();
    }

    // Update user wallets and streaming rates
    if (totalAccruedYield > 0) {
      userDoc.earningWallet = parseFloat(((userDoc.earningWallet || 0) + totalAccruedYield).toFixed(4));
      userDoc.totalProfit = parseFloat(((userDoc.totalProfit || 0) + totalAccruedYield).toFixed(4));
    }

    userDoc.dailyEarning = parseFloat(currentDailyEarning.toFixed(4));
    userDoc.perSecondRate = parseFloat(currentPerSecondRate.toFixed(8));
    userDoc.lastYieldSync = now;

    await userDoc.save();
    return userDoc;
  } catch (error) {
    console.error("[Yield Engine] syncUserStreamingEarnings error:", error.message);
    return user;
  }
};

/**
 * Distribute Multi-Tier Referral Commissions upon deposit or investment
 */
const distributeReferralCommissions = async (userId, amount, commissionType = "investment") => {
  try {
    const investor = await User.findById(userId);
    if (!investor || !investor.sponsorId || investor.sponsorId === "HORIZON-HQ") {
      return;
    }

    const refSettings = await ReferralSetting.find().sort({ levelNumber: 1 });
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
        sponsor.earningWallet = (sponsor.earningWallet || 0) + bonus;
        sponsor.totalProfit = (sponsor.totalProfit || 0) + bonus;
        sponsor.teamTurnover = (sponsor.teamTurnover || 0) + amount;
        await sponsor.save();

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
          referenceNo: `REF-L${tier.levelNumber}-${Date.now().toString().slice(-5)}`,
          status: "Approved",
          note: `Level ${tier.levelNumber} (${rate}%) affiliate commission from downline ${investor.name} (${investor.customId}).`,
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
