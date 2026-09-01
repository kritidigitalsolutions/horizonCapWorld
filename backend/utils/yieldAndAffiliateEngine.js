const User = require("../models/User");
const UserInvestment = require("../models/UserInvestment");
const ReferralSetting = require("../models/ReferralSetting");
const Rank = require("../models/Rank");
const Transaction = require("../models/Transaction");
const { notifyUser } = require("./notificationService");

// 10-Tier Rank Milestones (Fallback Defaults)
const defaultRanks = [
  { level: 1, name: "Bronze Explorer", minInvest: 100, reward: 7.5 },
  { level: 2, name: "Silver Vanguard", minInvest: 500, reward: 35 },
  { level: 3, name: "Gold Sovereign", minInvest: 2500, reward: 175 },
  { level: 4, name: "Platinum Luminary", minInvest: 10000, reward: 700 },
  { level: 5, name: "Sapphire Viceroy", minInvest: 50000, reward: 3500 },
  { level: 6, name: "Emerald Chancellor", minInvest: 150000, reward: 10500 },
  { level: 7, name: "Ruby High Commander", minInvest: 500000, reward: 35000 },
  { level: 8, name: "Diamond Archon", minInvest: 1500000, reward: 105000 },
  { level: 9, name: "Crown Imperator", minInvest: 5000000, reward: 350000 },
  { level: 10, name: "Apex Zenith Titan", minInvest: 10000000, reward: 700000 },
];

// 5-Tier Referral Default Rates
const defaultTierRates = [
  { levelNumber: 1, rate: 5 },
  { levelNumber: 2, rate: 4 },
  { levelNumber: 3, rate: 3 },
  { levelNumber: 4, rate: 2 },
  { levelNumber: 5, rate: 1 },
];

/**
 * Synchronize real-time streaming ROI earnings per second
 */
const syncUserStreamingEarnings = async (userIdOrUser) => {
  try {
    const targetId = userIdOrUser?._id || userIdOrUser;
    const user = await User.findById(targetId);
    if (!user) return null;

    const investments = await UserInvestment.find({
      user: user._id,
      status: "Active",
    });

    if (!investments || investments.length === 0) {
      user.dailyEarning = 0;
      user.perSecondRate = 0;
      await user.save();
      return user;
    }

    const now = new Date();
    let totalDailyEarning = 0;
    let totalPerSecondRate = 0;
    let totalIncrementalYield = 0;

    for (const inv of investments) {
      const dailyRate = (inv.amount * (inv.roi / 100)) / 365;
      const perSecRate = dailyRate / 86400;

      totalDailyEarning += dailyRate;
      totalPerSecondRate += perSecRate;

      // Calculate elapsed seconds since last sync
      const lastSync = inv.lastYieldSync ? new Date(inv.lastYieldSync) : new Date(inv.startDate || now);
      const elapsedSec = Math.max(0, Math.floor((now.getTime() - lastSync.getTime()) / 1000));

      if (elapsedSec > 0) {
        const incremental = perSecRate * elapsedSec;
        inv.totalEarned = (inv.totalEarned || 0) + incremental;
        inv.lastYieldSync = now;
        totalIncrementalYield += incremental;
      }

      // Check contract maturity
      const end = new Date(inv.endDate);
      const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      inv.daysRemaining = daysLeft;

      if (now >= end || daysLeft <= 0) {
        inv.status = "Completed";
      }

      await inv.save();
    }

    // Update user aggregates
    user.dailyEarning = parseFloat(totalDailyEarning.toFixed(4));
    user.perSecondRate = parseFloat(totalPerSecondRate.toFixed(7));

    if (totalIncrementalYield > 0) {
      user.earningWallet = (user.earningWallet || 0) + totalIncrementalYield;
      user.totalProfit = (user.totalProfit || 0) + totalIncrementalYield;
    }

    user.lastYieldSync = now;
    await user.save();

    return user;
  } catch (error) {
    console.error("Error in syncUserStreamingEarnings:", error.message);
    return null;
  }
};

/**
 * Distribute 5-Tier Referral Commissions upon plan activation
 */
const distributeReferralCommissions = async (investorUser, planAmount) => {
  try {
    if (!investorUser || !planAmount || planAmount <= 0) return;

    let currentSponsorId = investorUser.sponsorId;
    let currentLevel = 1;

    // Load tiers from DB or fallback
    let tiers = await ReferralSetting.find().sort({ levelNumber: 1 });
    if (!tiers || tiers.length === 0) {
      tiers = defaultTierRates;
    }

    while (currentSponsorId && currentLevel <= 5) {
      // Find sponsor by customId or email
      const sponsor = await User.findOne({
        $or: [{ customId: currentSponsorId }, { email: currentSponsorId }],
      });

      if (!sponsor) break;

      const tierObj = tiers.find((t) => t.levelNumber === currentLevel) || defaultTierRates[currentLevel - 1];
      const rate = tierObj?.investCommissionRate ?? tierObj?.rate ?? (6 - currentLevel);
      const commissionAmount = parseFloat(((planAmount * rate) / 100).toFixed(2));

      if (commissionAmount > 0) {
        sponsor.earningWallet = (sponsor.earningWallet || 0) + commissionAmount;
        sponsor.teamTurnover = (sponsor.teamTurnover || 0) + planAmount;
        await sponsor.save();

        // Create transaction record
        const txnId = `TXN-REF-${Date.now().toString().slice(-6)}-L${currentLevel}`;
        await Transaction.create({
          customId: txnId,
          user: sponsor._id,
          userName: sponsor.name,
          userCustomId: sponsor.customId,
          userEmail: sponsor.email,
          country: sponsor.country || "Global",
          type: "Referral Bonus",
          amount: commissionAmount,
          rawAmount: commissionAmount,
          netAmount: commissionAmount,
          gateway: `L${currentLevel} Direct Bonus (${rate}%)`,
          referenceNo: `REF-COMM-${investorUser.customId}-L${currentLevel}`,
          date: new Date().toISOString().split("T")[0],
          time: new Date().toLocaleTimeString("en-US", { hour12: false }),
          status: "Completed",
        });

        // Automated notification for sponsor
        await notifyUser({
          userId: sponsor._id,
          title: `Level ${currentLevel} Referral Commission Credited`,
          message: `You earned +$${commissionAmount.toLocaleString()} (${rate}%) from downline investor ${investorUser.name}'s plan activation!`,
          category: "REFERRAL",
          type: "referral_commission",
          priority: "NORMAL",
          actionUrl: "/referrals",
          metadata: { amount: commissionAmount, level: currentLevel, investor: investorUser.name },
          settingKey: "autoReferralCommissions",
        });

        // Trigger Rank Qualification check for sponsor
        await checkAndPromoteRank(sponsor);
      }

      currentSponsorId = sponsor.sponsorId;
      currentLevel++;
    }
  } catch (error) {
    console.error("Error in distributeReferralCommissions:", error.message);
  }
};

/**
 * Check and promote user along the 10-Tier Rank Progression Ladder
 */
const checkAndPromoteRank = async (user) => {
  try {
    if (!user) return;

    let rankList = await Rank.find().sort({ level: 1 });
    if (!rankList || rankList.length === 0) {
      rankList = defaultRanks;
    }

    const currentTurnover = user.teamTurnover || 0;
    let highestQualified = null;

    for (const r of rankList) {
      if (currentTurnover >= r.minInvest) {
        highestQualified = r;
      }
    }

    if (highestQualified && highestQualified.level > (user.rankLevel || 1)) {
      const oldRank = user.currentRank;
      user.rankLevel = highestQualified.level;
      user.currentRank = highestQualified.name;

      const cashReward = highestQualified.reward || 0;
      if (cashReward > 0) {
        user.earningWallet = (user.earningWallet || 0) + cashReward;

        // Create Rank Reward Transaction
        const txnId = `TXN-RNK-${Date.now().toString().slice(-6)}`;
        await Transaction.create({
          customId: txnId,
          user: user._id,
          userName: user.name,
          userCustomId: user.customId,
          userEmail: user.email,
          country: user.country || "Global",
          type: "Rank Bonus",
          amount: cashReward,
          rawAmount: cashReward,
          netAmount: cashReward,
          gateway: `Rank Milestone Reward (${highestQualified.name})`,
          referenceNo: `RANK-UP-${highestQualified.level}`,
          date: new Date().toISOString().split("T")[0],
          time: new Date().toLocaleTimeString("en-US", { hour12: false }),
          status: "Completed",
        });
      }

      await user.save();

      // Automated Rank Promotion Alert
      await notifyUser({
        userId: user._id,
        title: `Rank Promoted to ${highestQualified.name}!`,
        message: `Congratulations! You achieved ${highestQualified.name} Rank with team turnover of $${Number(currentTurnover).toLocaleString()} and unlocked a $${Number(cashReward).toLocaleString()} cash reward bonus!`,
        category: "RANK",
        type: "rank_upgrade",
        priority: "HIGH",
        actionUrl: "/ranks",
        metadata: { rankName: highestQualified.name, rankLevel: highestQualified.level, reward: cashReward },
        settingKey: "autoRankMilestones",
      });

      console.log(`User ${user.customId} promoted from ${oldRank} to ${highestQualified.name}!`);
    }
  } catch (error) {
    console.error("Error in checkAndPromoteRank:", error.message);
  }
};

module.exports = {
  syncUserStreamingEarnings,
  distributeReferralCommissions,
  checkAndPromoteRank,
};
