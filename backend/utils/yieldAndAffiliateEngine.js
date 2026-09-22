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

    // Check user's latest approved withdrawal to determine non-withdrawal holding period
    const latestWithdrawal = await Transaction.findOne({
      user: userDoc._id,
      type: "Withdrawal",
      status: "Approved",
    }).sort({ createdAt: -1 });

    for (const inv of activeInvestments) {
      // Determine non-withdrawal holding period for this contract
      const invStartTime = inv.createdAt || inv.startDate || now;
      const refDate =
        latestWithdrawal && new Date(latestWithdrawal.createdAt) > new Date(invStartTime)
          ? new Date(latestWithdrawal.createdAt)
          : new Date(invStartTime);

      const daysWithoutWithdrawal = Math.max(
        0,
        Math.floor((now.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24))
      );

      const isLocked = Boolean(
        inv.isLocked ||
        inv.lockInPeriod === "3X Cap" ||
        inv.lockInPeriod === "333 Days" ||
        inv.lockInPeriod === "365 Days" ||
        inv.lockInPeriod === "3 Months"
      );

      let dynamicDailyRoi = 0.3;
      if (isLocked) {
        if (daysWithoutWithdrawal >= 60) {
          dynamicDailyRoi = 1.0;
        } else if (daysWithoutWithdrawal >= 30) {
          dynamicDailyRoi = 0.9;
        } else {
          dynamicDailyRoi = Number(inv.slabApplied?.lockInDailyRoi) || 0.8;
        }
      } else {
        if (daysWithoutWithdrawal >= 60) {
          dynamicDailyRoi = 0.4;
        } else if (daysWithoutWithdrawal >= 30) {
          dynamicDailyRoi = 0.35;
        } else {
          dynamicDailyRoi = Number(inv.slabApplied?.dailyRoi) || 0.3;
        }
      }

      inv.dailyRoi = dynamicDailyRoi;
      const invDaily = inv.amount * (dynamicDailyRoi / 100);
      const invPerSec = invDaily / 86400;
      inv.dailyEarning = invDaily;
      inv.perSecondRate = invPerSec;

      currentDailyEarning += invDaily;
      currentPerSecondRate += invPerSec;

      // Calculate accrued yield for this contract using exact elapsed seconds
      const contractYield = elapsedSeconds * invPerSec;
      totalAccruedYield += contractYield;

      inv.totalProfitEarned = Number(((inv.totalProfitEarned || 0) + contractYield).toFixed(8));
      inv.lastSettlementAt = now;

      // Check if 3X Cap contract has reached 300% profit
      if (isLocked) {
        if (inv.totalProfitEarned >= inv.amount * 3) {
          inv.status = "Completed";
          inv.dailyEarning = 0;
          inv.perSecondRate = 0;
        }
      } else if (!inv.isInfinite && inv.endDate && now >= new Date(inv.endDate)) {
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

    // Direct investment referral bonus is ONLY eligible on the user's FIRST investment
    if (commissionType === "investment") {
      if (investor.hasReceivedReferralBonus) {
        console.log(`[Affiliate Engine] Investor ${investor.customId || investor.name} has already received referral bonus for their 1st investment. Skipping subsequent investment.`);
        return;
      }

      // Check if investor already has more than 1 investment or previous referral bonus transactions
      const invCount = await UserInvestment.countDocuments({ user: investor._id });
      const existingRefTxn = await Transaction.findOne({
        type: "Referral Bonus",
        note: { $regex: investor.customId, $options: "i" },
      });

      if (invCount > 1 || existingRefTxn) {
        console.log(`[Affiliate Engine] Investor ${investor.customId || investor.name} already completed their 1st investment previously. Skipping.`);
        investor.hasReceivedReferralBonus = true;
        if (!investor.firstInvestmentAmount) {
          investor.firstInvestmentAmount = amount;
        }
        await investor.save();
        return;
      }
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

      // For Level ROI Earnings Profit Share, enforce eligibility conditions (Group Volume & Direct Clients)
      if (commissionType === "earnings") {
        if (tier.levelNumber === 0 || (tier.percentage === 0 && tier.earningsCommissionRate === 0 && tier.roiPerDay === 0)) {
          // Level 0 has No Downline Commission (Self Investment only)
          currentSponsorId = sponsor.sponsorId;
          continue;
        }

        if (tier.directClientsMin > 0) {
          const directCount = await User.countDocuments({ sponsorId: sponsor.customId });
          if (directCount < tier.directClientsMin) {
            currentSponsorId = sponsor.sponsorId;
            continue;
          }
        }

        if (tier.groupVolumeMin > 0) {
          const turnover = Number(sponsor.teamTurnover || 0);
          if (turnover < tier.groupVolumeMin) {
            currentSponsorId = sponsor.sponsorId;
            continue;
          }
        }
      }

      const rate = commissionType === "investment" ? (tier.investCommissionRate || 5) : (tier.percentage !== undefined && tier.percentage !== null ? tier.percentage : tier.earningsCommissionRate || 0);
      const bonus = parseFloat(((amount * rate) / 100).toFixed(2));

      if (bonus > 0) {
        sponsor.earningWallet = parseFloat(((sponsor.earningWallet || 0) + bonus).toFixed(2));
        sponsor.totalProfit = parseFloat(((sponsor.totalProfit || 0) + bonus).toFixed(2));
        if (commissionType === "investment") {
          sponsor.teamTurnover = parseFloat(((sponsor.teamTurnover || 0) + amount).toFixed(2));
        }
        await sponsor.save();

        const typeLabel = commissionType === "investment" ? "1st Investment Deposit Commission" : "Daily ROI Profit Share";

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

    // Mark that 1st investment referral bonus has been distributed for this investor
    if (commissionType === "investment") {
      investor.hasReceivedReferralBonus = true;
      if (!investor.firstInvestmentAmount) {
        investor.firstInvestmentAmount = amount;
      }
      await investor.save();
    }
  } catch (error) {
    console.error("[Affiliate Engine] distributeReferralCommissions error:", error.message);
  }
};

module.exports = {
  syncUserStreamingEarnings,
  distributeReferralCommissions,
};
