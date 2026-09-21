require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../configs/db');
const User = require('../models/User');
const UserInvestment = require('../models/UserInvestment');
const Transaction = require('../models/Transaction');

async function verify() {
  await connectDB();
  console.log('Connected to DB');

  const emails = [
    'dreamofworld8901@protonmail.com',
    'dreamofworld8901+1@protonmail.com',
    'hassi.ch12345@gmail.com',
    'hassi.ch12345+1@gmail.com',
    'sanjaymhaskar79@gmail.com',
    'sanjaymhaskar79+1@gmail.com',
  ];

  for (const email of emails) {
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`User ${email} NOT FOUND!`);
      continue;
    }

    const investments = await UserInvestment.find({ user: user._id });
    const transactions = await Transaction.find({ user: user._id }).sort({ createdAt: -1 });

    console.log(`\n======================================================`);
    console.log(`USER: ${user.name} | ${user.email} | ID: ${user.customId}`);
    console.log(`Total Invested: $${user.totalInvested} | Total Profit: $${user.totalProfit} | Total Withdrawn: $${user.totalWithdrawn}`);
    console.log(`Earning Wallet: $${user.earningWallet} | Daily Earning: $${user.dailyEarning}/day | Per Sec: $${user.perSecondRate}/s`);
    console.log(`Downline Referrals: ${user.directReferrals} | Team Volume: $${user.teamTurnover}`);
    console.log(`Investments (${investments.length}):`, investments.map(i => `${i.planName}: $${i.amount} @ ${i.dailyRoi}%/day, Profit Earned: $${i.totalProfitEarned}`));
    console.log(`Transactions (${transactions.length}):`);
    transactions.slice(0, 5).forEach(t => {
      console.log(`  [${t.type}] $${t.amount} via ${t.gateway} (${t.cryptoNetwork}) - Status: ${t.status} - Ref: ${t.referenceNo}`);
    });
  }

  process.exit(0);
}

verify().catch(console.error);
