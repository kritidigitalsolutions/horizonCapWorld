require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const connectDB = require('../configs/db');
const User = require('../models/User');
const UserInvestment = require('../models/UserInvestment');
const InvestmentPlan = require('../models/InvestmentPlan');
const Transaction = require('../models/Transaction');

// Helper to generate realistic crypto transaction hashes and addresses
function generateCryptoHash(network) {
  const chars = '0123456789abcdef';
  let hash = '';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  if (network === 'TRON') {
    return hash; // TRON txID is 64 hex chars
  }
  return '0x' + hash; // EVM / BSC txID
}

function generateWalletAddress(network) {
  const chars = '0123456789abcdefABCDEF';
  if (network === 'TRON') {
    const base58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let addr = 'T';
    for (let i = 0; i < 33; i++) {
      addr += base58Chars[Math.floor(Math.random() * base58Chars.length)];
    }
    return addr;
  }
  let addr = '0x';
  for (let i = 0; i < 40; i++) {
    addr += chars[Math.floor(Math.random() * chars.length)];
  }
  return addr;
}

// Ensure ONLY the two original investment plans exist, named Green Growth Fund and Gold Growth Fund
async function ensureInvestmentPlans() {
  console.log('[Seed] Ensuring ONLY 2 investment plans exist in the database...');

  // 1. First plan: Green Growth Fund
  let greenPlan = await InvestmentPlan.findOne({
    $or: [
      { _id: new mongoose.Types.ObjectId('6aa2395929b40f4ba85e68d8') },
      { name: { $regex: /Green/i } },
    ],
  });

  if (!greenPlan) {
    greenPlan = await InvestmentPlan.create({
      _id: new mongoose.Types.ObjectId('6aa2395929b40f4ba85e68d8'),
      name: 'Green Growth Fund',
      category: 'Renewable Energy',
      roiType: 'slab',
      dailyRoi: 0.3,
      roi: 9.0,
      annualRoi: 108.0,
      duration: '12 Months',
      durationDays: 365,
      minAmount: 10,
      minDepositAmount: 10,
      minWithdrawalAmount: 5,
      payoutInterval: 'Per Second (Live)',
      status: 'Active',
      description: 'Institutional-grade investment fund allocating to sustainable clean energy infrastructure with continuous daily yield streaming.',
    });
  } else {
    greenPlan.name = 'Green Growth Fund';
    greenPlan.category = 'Renewable Energy';
    greenPlan.dailyRoi = 0.3;
    greenPlan.roi = 9.0;
    greenPlan.annualRoi = 108.0;
    greenPlan.status = 'Active';
    await greenPlan.save();
  }

  // 2. Second plan: Gold Growth Fund
  let goldPlan = await InvestmentPlan.findOne({
    $or: [
      { _id: new mongoose.Types.ObjectId('6aa3dddee40e79422a85660d') },
      { name: { $regex: /Gold|Precious/i } },
    ],
  });

  if (!goldPlan) {
    goldPlan = await InvestmentPlan.create({
      _id: new mongoose.Types.ObjectId('6aa3dddee40e79422a85660d'),
      name: 'Gold Growth Fund',
      category: 'Precious Metal',
      roiType: 'slab',
      dailyRoi: 0.9,
      roi: 27.0,
      annualRoi: 324.0,
      duration: '12 Months',
      durationDays: 365,
      minAmount: 10,
      minDepositAmount: 10,
      minWithdrawalAmount: 5,
      payoutInterval: 'Per Second (Live)',
      status: 'Active',
      description: 'Premier diversified physical gold and precious metal arbitrage strategy delivering accelerated 0.90% daily returns.',
    });
  } else {
    goldPlan.name = 'Gold Growth Fund';
    goldPlan.category = 'Precious Metal';
    goldPlan.dailyRoi = 0.9;
    goldPlan.roi = 27.0;
    goldPlan.annualRoi = 324.0;
    goldPlan.status = 'Active';
    await goldPlan.save();
  }

  // Delete all other plans so that ONLY these 2 plans exist in the entire database
  const deletedExtra = await InvestmentPlan.deleteMany({
    _id: { $nin: [greenPlan._id, goldPlan._id] },
  });
  if (deletedExtra.deletedCount > 0) {
    console.log(`[Seed] Deleted ${deletedExtra.deletedCount} extra plan(s).`);
  }

  const allPlans = await InvestmentPlan.find();
  console.log(`[Seed] Active Plans in DB (${allPlans.length}):`, allPlans.map(p => `${p.name} (${p._id})`));

  return { greenPlan, goldPlan };
}

async function seedClientHistories() {
  try {
    await connectDB();
    console.log('[Seed] Connected to MongoDB');

    const { greenPlan, goldPlan } = await ensureInvestmentPlans();

    const hashedPassword = await bcrypt.hash('123456', 10);
    const now = new Date();

    // The 6 Target Client configurations from user specifications
    const clientConfigs = [
      {
        key: 'sachin_1',
        name: 'Sachin Kesariya',
        email: 'dreamofworld8901@protonmail.com',
        phone: '+91 98200 12345',
        country: 'India',
        customId: 'HORIZON-USR-05453',
        investAmount: 1000,
        dailyRoi: 0.3,
        plan: greenPlan,
        tenureMonths: 7,
        hasWithdrawals: true,
        depositGateway: 'TRON (TRC-20)',
        depositNetwork: 'TRON',
        downlineConfig: null,
      },
      {
        key: 'sachin_2',
        name: 'Sachin Kesariya',
        email: 'dreamofworld8901+1@protonmail.com',
        phone: '+91 98200 54321',
        country: 'India',
        customId: 'HORIZON-USR-06256',
        investAmount: 1000,
        dailyRoi: 0.9,
        plan: goldPlan,
        tenureMonths: 5,
        hasWithdrawals: false, // No withdrawal / NR
        depositGateway: 'BNB Smart Chain (BEP-20)',
        depositNetwork: 'BEP 20',
        downlineConfig: {
          clients: [
            {
              name: 'Rahul Sharma',
              email: 'rahul.sharma89@gmail.com',
              phone: '+91 98201 11223',
              country: 'India',
              customId: 'HORIZON-USR-07891',
              depositAmount: 1500,
              monthsAgo: 4,
            },
          ],
        },
      },
      {
        key: 'amna',
        name: 'Amna',
        email: 'hassi.ch12345@gmail.com',
        phone: '+92 300 1234567',
        country: 'Pakistan',
        customId: 'HORIZON-USR-08123',
        investAmount: 100,
        dailyRoi: 0.3,
        plan: greenPlan,
        tenureMonths: 7,
        hasWithdrawals: true,
        depositGateway: 'TRON (TRC-20)',
        depositNetwork: 'TRON',
        downlineConfig: null,
      },
      {
        key: 'hassan',
        name: 'Hassan',
        email: 'hassi.ch12345+1@gmail.com',
        phone: '+92 300 7654321',
        country: 'Pakistan',
        customId: 'HORIZON-USR-08124',
        investAmount: 100,
        dailyRoi: 0.9,
        plan: goldPlan,
        tenureMonths: 4,
        hasWithdrawals: false, // No withdrawal / NR
        depositGateway: 'BNB Smart Chain (BEP-20)',
        depositNetwork: 'BEP 20',
        downlineConfig: null,
      },
      {
        key: 'sanjay_1',
        name: 'Sanjay Mhaskar',
        email: 'sanjaymhaskar79@gmail.com',
        phone: '+91 98202 33445',
        country: 'India',
        customId: 'HORIZON-USR-04295',
        investAmount: 500,
        dailyRoi: 0.3,
        plan: greenPlan,
        tenureMonths: 8,
        hasWithdrawals: true,
        depositGateway: 'Ethereum (ERC-20)',
        depositNetwork: 'ERC 20',
        downlineConfig: null,
      },
      {
        key: 'sanjay_2',
        name: 'Sanjay Mhaskar',
        email: 'sanjaymhaskar79+1@gmail.com',
        phone: '+91 98202 55667',
        country: 'India',
        customId: 'HORIZON-USR-04296',
        investAmount: 1000,
        dailyRoi: 0.9,
        plan: goldPlan,
        tenureMonths: 5,
        hasWithdrawals: false, // No withdrawal / NR
        depositGateway: 'TRON (TRC-20)',
        depositNetwork: 'TRON',
        downlineConfig: {
          clients: [
            {
              name: 'Rajesh Gupta',
              email: 'rajesh.gupta92@gmail.com',
              phone: '+91 98203 77889',
              country: 'India',
              customId: 'HORIZON-USR-09012',
              depositAmount: 1000,
              monthsAgo: 4,
            },
            {
              name: 'Pooja Sharma',
              email: 'pooja.sharma88@gmail.com',
              phone: '+91 98203 99001',
              country: 'India',
              customId: 'HORIZON-USR-09013',
              depositAmount: 1000,
              monthsAgo: 3,
            },
          ],
        },
      },
    ];

    console.log(`[Seed] Processing ${clientConfigs.length} client accounts...`);

    for (const config of clientConfigs) {
      console.log(`\n-----------------------------------------------------------`);
      console.log(`[Seed] Processing Client: ${config.name} (${config.email})`);

      // 1. Find or create user
      let user = await User.findOne({ email: config.email });
      if (!user) {
        user = new User({
          email: config.email,
          customId: config.customId,
        });
      }

      user.name = config.name;
      user.password = hashedPassword;
      user.phone = config.phone;
      user.country = config.country;
      user.status = 'Active';
      user.payoutType = 'Per Second (Live)';
      user.sponsorId = 'HORIZON-HQ';
      user.currentRank = config.investAmount >= 1000 ? 'Senior Associate' : 'Associate';
      user.rankLevel = config.investAmount >= 1000 ? 2 : 1;
      await user.save();

      // Clean up previous investments and transactions for this user to ensure clean seed
      await UserInvestment.deleteMany({ user: user._id });
      await Transaction.deleteMany({ user: user._id });

      const tenureDays = config.tenureMonths * 30;
      const startDate = new Date(now.getTime() - tenureDays * 24 * 60 * 60 * 1000);
      const dailyEarning = Number((config.investAmount * (config.dailyRoi / 100)).toFixed(4));
      const perSecondRate = Number((dailyEarning / 86400).toFixed(8));
      const totalProfitEarned = Number((dailyEarning * tenureDays).toFixed(4));

      // 2. Create Deposit Transaction backdated to startDate
      const depositTrxId = `TRX-${startDate.getTime().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;
      const depositHash = generateCryptoHash(config.depositNetwork);
      await Transaction.create({
        customId: depositTrxId,
        user: user._id,
        userName: user.name,
        userCustomId: user.customId,
        userEmail: user.email,
        country: user.country,
        type: 'Deposit',
        amount: config.investAmount,
        rawAmount: config.investAmount,
        fee: 0,
        netAmount: config.investAmount,
        gateway: config.depositGateway,
        referenceNo: depositHash,
        cryptoNetwork: config.depositNetwork,
        selectedToken: 'USDT',
        date: startDate.toISOString().split('T')[0],
        time: startDate.toLocaleTimeString('en-US', { hour12: false }),
        status: 'Approved',
        note: `Approved deposit of $${config.investAmount.toLocaleString()} USD via ${config.depositGateway}. TxHash: ${depositHash}`,
        createdAt: startDate,
        updatedAt: startDate,
      });

      // 3. Create Investment Contract
      const invCustomId = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
      const investment = await UserInvestment.create({
        customId: invCustomId,
        user: user._id,
        userName: user.name,
        userEmail: user.email,
        plan: config.plan._id,
        planName: config.plan.name,
        planCategory: config.plan.category,
        amount: config.investAmount,
        dailyRoi: config.dailyRoi,
        roi: Number((config.dailyRoi * 30).toFixed(2)),
        annualRoi: Number((config.dailyRoi * 360).toFixed(2)),
        duration: '12 Months',
        durationDays: 365,
        dailyEarning,
        perSecondRate,
        totalProfitEarned,
        payoutInterval: 'Per Second (Live)',
        status: 'Active',
        startDate,
        endDate: new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000),
        lastSettlementAt: now,
        createdAt: startDate,
        updatedAt: now,
      });

      // 4. Create Contract Allocation Transaction ("ROI Return")
      await Transaction.create({
        customId: `TRX-${(startDate.getTime() + 60000).toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`,
        user: user._id,
        userName: user.name,
        userCustomId: user.customId,
        userEmail: user.email,
        country: user.country,
        type: 'ROI Return',
        amount: config.investAmount,
        rawAmount: config.investAmount,
        fee: 0,
        netAmount: config.investAmount,
        gateway: 'Deposit Wallet',
        referenceNo: invCustomId,
        date: startDate.toISOString().split('T')[0],
        time: startDate.toLocaleTimeString('en-US', { hour12: false }),
        status: 'Approved',
        note: `Active contract allocated in ${config.plan.name} (${config.plan.category}) @ ${config.dailyRoi}% daily ROI`,
        createdAt: new Date(startDate.getTime() + 60000),
        updatedAt: new Date(startDate.getTime() + 60000),
      });

      let totalWithdrawn = 0;

      // 5. Generate Weekly & Monthly Withdrawals (if applicable)
      if (config.hasWithdrawals) {
        console.log(`[Seed] Generating weekly and monthly withdrawals for ${config.name}...`);
        const withdrawalSchedule = [];

        if (config.investAmount >= 500) {
          // Weekly for first month: Weeks 1, 2, 3, 4
          const weekAmounts = config.investAmount === 1000
            ? [18.50, 21.00, 19.50, 21.00]
            : [10.00, 10.50, 10.00, 10.50];

          for (let w = 1; w <= 4; w++) {
            withdrawalSchedule.push({
              dayOffset: w * 7,
              amount: weekAmounts[w - 1],
              note: `Week ${w} partial ROI yield payout`,
            });
          }

          // Then Monthly for remaining months (Month 2 to tenureMonths - 1)
          const baseMonthly = config.investAmount === 1000 ? 90 : 45;
          const monthVariations = config.investAmount === 1000
            ? [85, 90, 88, 92, 80]
            : [42, 45, 40, 44, 45, 43];

          for (let m = 2; m < config.tenureMonths; m++) {
            const idx = (m - 2) % monthVariations.length;
            withdrawalSchedule.push({
              dayOffset: m * 30,
              amount: monthVariations[idx],
              note: `Month ${m} regular ROI yield withdrawal`,
            });
          }
        } else {
          // For $100 investment (Amna), daily profit is $0.30.
          // Min withdrawal threshold is $5. So withdrawals every ~18 days, then monthly (~$8 - $9)
          withdrawalSchedule.push({ dayOffset: 18, amount: 5.40, note: 'Initial 18-day accumulated profit payout' });
          withdrawalSchedule.push({ dayOffset: 36, amount: 5.40, note: 'Second cycle accumulated profit payout' });
          withdrawalSchedule.push({ dayOffset: 65, amount: 8.00, note: 'Month 2 regular profit withdrawal' });
          withdrawalSchedule.push({ dayOffset: 95, amount: 8.50, note: 'Month 3 regular profit withdrawal' });
          withdrawalSchedule.push({ dayOffset: 125, amount: 8.00, note: 'Month 4 regular profit withdrawal' });
          withdrawalSchedule.push({ dayOffset: 155, amount: 8.50, note: 'Month 5 regular profit withdrawal' });
          withdrawalSchedule.push({ dayOffset: 185, amount: 7.50, note: 'Month 6 regular profit withdrawal' });
        }

        const gateways = [
          { gateway: 'TRON (TRC-20)', network: 'TRON' },
          { gateway: 'BNB Smart Chain (BEP-20)', network: 'BEP 20' },
          { gateway: 'Ethereum (ERC-20)', network: 'ERC 20' },
        ];

        for (let i = 0; i < withdrawalSchedule.length; i++) {
          const item = withdrawalSchedule[i];
          const wdDate = new Date(startDate.getTime() + item.dayOffset * 24 * 60 * 60 * 1000);
          if (wdDate > now) continue;

          const gw = gateways[i % gateways.length];
          const destAddress = generateWalletAddress(gw.network);
          const fee = Number(((item.amount * 5) / 100).toFixed(2)); // 5% protocol fee
          const netAmount = Number((item.amount - fee).toFixed(2));
          const wdCustomId = `WD-${wdDate.getTime().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;

          await Transaction.create({
            customId: wdCustomId,
            user: user._id,
            userName: user.name,
            userCustomId: user.customId,
            userEmail: user.email,
            country: user.country,
            type: 'Withdrawal',
            amount: item.amount,
            rawAmount: item.amount,
            fee,
            netAmount,
            gateway: gw.gateway,
            cryptoNetwork: gw.network,
            selectedToken: 'USDT',
            referenceNo: destAddress,
            date: wdDate.toISOString().split('T')[0],
            time: wdDate.toLocaleTimeString('en-US', { hour12: false }),
            status: 'Completed',
            note: `${item.note} to ${destAddress} via ${gw.gateway}. Fee: $${fee} (Net: $${netAmount})`,
            createdAt: wdDate,
            updatedAt: wdDate,
          });

          totalWithdrawn += item.amount;
        }

        console.log(`[Seed] Created ${withdrawalSchedule.length} withdrawals for ${config.name}. Total Withdrawn: $${totalWithdrawn.toFixed(2)}`);
      } else {
        console.log(`[Seed] No withdrawals configured for ${config.name} (No Withdrawal / NR). Total Withdrawn: $0`);
      }

      // 6. Handle Downline Network (if configured)
      let directReferralsCount = 0;
      let teamTurnover = 0;
      let totalReferralBonuses = 0;

      if (config.downlineConfig && Array.isArray(config.downlineConfig.clients)) {
        console.log(`[Seed] Creating ${config.downlineConfig.clients.length} downline client(s) for sponsor ${user.customId}...`);

        for (const dl of config.downlineConfig.clients) {
          let downlineUser = await User.findOne({ email: dl.email });
          if (!downlineUser) {
            downlineUser = new User({
              email: dl.email,
              customId: dl.customId,
            });
          }

          downlineUser.name = dl.name;
          downlineUser.password = hashedPassword;
          downlineUser.phone = dl.phone;
          downlineUser.country = dl.country;
          downlineUser.sponsorId = user.customId;
          downlineUser.totalInvested = dl.depositAmount;
          downlineUser.firstInvestmentAmount = dl.depositAmount;
          downlineUser.hasReceivedReferralBonus = true;
          downlineUser.depositWallet = 0;
          downlineUser.earningWallet = 50;
          downlineUser.status = 'Active';
          await downlineUser.save();

          // Downline Deposit Transaction
          const dlStartDate = new Date(now.getTime() - dl.monthsAgo * 30 * 24 * 60 * 60 * 1000);
          const dlTrxId = `TRX-${dlStartDate.getTime().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;
          const dlHash = generateCryptoHash('TRON');

          await Transaction.deleteMany({ user: downlineUser._id });
          await Transaction.create({
            customId: dlTrxId,
            user: downlineUser._id,
            userName: downlineUser.name,
            userCustomId: downlineUser.customId,
            userEmail: downlineUser.email,
            country: downlineUser.country,
            type: 'Deposit',
            amount: dl.depositAmount,
            rawAmount: dl.depositAmount,
            fee: 0,
            netAmount: dl.depositAmount,
            gateway: 'TRON (TRC-20)',
            cryptoNetwork: 'TRON',
            selectedToken: 'USDT',
            referenceNo: dlHash,
            date: dlStartDate.toISOString().split('T')[0],
            time: dlStartDate.toLocaleTimeString('en-US', { hour12: false }),
            status: 'Approved',
            note: `Approved deposit of $${dl.depositAmount.toLocaleString()} USD via TRON (TRC-20)`,
            createdAt: dlStartDate,
            updatedAt: dlStartDate,
          });

          // Downline Investment
          await UserInvestment.deleteMany({ user: downlineUser._id });
          await UserInvestment.create({
            customId: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
            user: downlineUser._id,
            userName: downlineUser.name,
            userEmail: downlineUser.email,
            plan: greenPlan._id,
            planName: greenPlan.name,
            planCategory: greenPlan.category,
            amount: dl.depositAmount,
            dailyRoi: 0.3,
            roi: 9.0,
            annualRoi: 108.0,
            duration: '12 Months',
            durationDays: 365,
            dailyEarning: dl.depositAmount * 0.003,
            perSecondRate: (dl.depositAmount * 0.003) / 86400,
            totalProfitEarned: dl.depositAmount * 0.003 * dl.monthsAgo * 30,
            status: 'Active',
            startDate: dlStartDate,
            endDate: new Date(dlStartDate.getTime() + 365 * 24 * 60 * 60 * 1000),
            createdAt: dlStartDate,
            updatedAt: now,
          });

          // Sponsor Referral Bonus Transaction (5% of 1st investment)
          const bonusAmount = Number(((dl.depositAmount * 5) / 100).toFixed(2));
          totalReferralBonuses += bonusAmount;
          teamTurnover += dl.depositAmount;
          directReferralsCount += 1;

          await Transaction.create({
            customId: `TRX-${(dlStartDate.getTime() + 120000).toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`,
            user: user._id,
            userName: user.name,
            userCustomId: user.customId,
            userEmail: user.email,
            country: user.country,
            type: 'Referral Bonus',
            amount: bonusAmount,
            rawAmount: bonusAmount,
            fee: 0,
            netAmount: bonusAmount,
            gateway: 'Affiliate Engine',
            referenceNo: `REF-L1-${Date.now().toString().slice(-5)}`,
            date: dlStartDate.toISOString().split('T')[0],
            time: dlStartDate.toLocaleTimeString('en-US', { hour12: false }),
            status: 'Approved',
            note: `Tier L1 (5%) 1st Investment Deposit Commission from downline ${downlineUser.name} (${downlineUser.customId}).`,
            createdAt: new Date(dlStartDate.getTime() + 120000),
            updatedAt: new Date(dlStartDate.getTime() + 120000),
          });
        }
      }

      // 7. Update User's Final Aggregated Wallets & Streaming Rates
      const finalEarningWallet = Math.max(0, Number((totalProfitEarned - totalWithdrawn + totalReferralBonuses).toFixed(4)));

      user.depositWallet = 0;
      user.earningWallet = finalEarningWallet;
      user.totalInvested = config.investAmount;
      user.firstInvestmentAmount = config.investAmount;
      user.hasReceivedReferralBonus = true;
      user.totalProfit = totalProfitEarned + totalReferralBonuses;
      user.totalWithdrawn = totalWithdrawn;
      user.dailyEarning = dailyEarning;
      user.perSecondRate = perSecondRate;
      user.totalReferrals = directReferralsCount;
      user.directReferrals = directReferralsCount;
      user.teamTurnover = teamTurnover;
      user.lastYieldSync = now; // Anchored to NOW so real-time streaming visibly advances from this moment
      await user.save();

      console.log(`[Seed] Summary for ${config.name}:`);
      console.log(`       Invested: $${user.totalInvested} (${config.plan.name} @ ${config.dailyRoi}%/day)`);
      console.log(`       Total ROI Profit Earned: $${totalProfitEarned.toFixed(2)} (${config.tenureMonths} Months)`);
      console.log(`       Total Withdrawn: $${totalWithdrawn.toFixed(2)}`);
      console.log(`       Earning Wallet Available: $${user.earningWallet.toFixed(2)}`);
      console.log(`       Streaming Per Second Rate: +$${user.perSecondRate.toFixed(8)}/sec (Daily: $${user.dailyEarning.toFixed(4)}/day)`);
      console.log(`       Downline Team Volume: $${user.teamTurnover} (Direct Referrals: ${user.directReferrals})`);
    }

    console.log('\n===========================================================');
    console.log('[Seed] All 6 client accounts successfully seeded!');
    console.log('Login credentials for all accounts:');
    console.log('  Password: 123456');
    console.log('Accounts:');
    clientConfigs.forEach((c) => {
      console.log(`  - ${c.name} (${c.email}) -> $${c.investAmount} [${c.dailyRoi}%/day]`);
    });
    console.log('===========================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('[Seed] Error during seeding:', err);
    process.exit(1);
  }
}

seedClientHistories();
