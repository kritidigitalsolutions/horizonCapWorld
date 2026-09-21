require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const InvestmentPlan = mongoose.model('InvestmentPlan', new mongoose.Schema({}, { strict: false }));
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const PaymentMethod = mongoose.model('PaymentMethod', new mongoose.Schema({}, { strict: false }));

  const plans = await InvestmentPlan.find({});
  console.log('--- PLANS ---');
  console.log(JSON.stringify(plans.map(p => ({ id: p._id, name: p.name, category: p.category, dailyRoi: p.dailyRoi, roi: p.roi, roiSlabs: p.roiSlabs })), null, 2));

  const users = await User.find({}).select('name email customId sponsorId totalInvested earningWallet depositWallet');
  console.log('--- USERS ---');
  console.log(JSON.stringify(users, null, 2));

  const gateways = await PaymentMethod.find({});
  console.log('--- PAYMENT METHODS ---');
  console.log(JSON.stringify(gateways.map(g => ({ name: g.name, category: g.category, type: g.type, network: g.network })), null, 2));

  await mongoose.disconnect();
}

check().catch(console.error);
