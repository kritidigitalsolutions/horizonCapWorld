require('dotenv').config();
const mongoose = require('mongoose');

async function setup() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const PM = require('../models/PaymentMethod');
  const contractAddress = (process.env.PAYOUT_POOL_ADDRESS || '0x439DBd3A00E41255e0Bd26d8976E67310aDB7fd3').trim();

  // Delete all non-smart-contract payment methods as requested by user
  const deleted = await PM.deleteMany({
    $and: [
      { address: { $ne: contractAddress } },
      { accountNumber: { $ne: contractAddress } }
    ]
  });
  console.log('Removed old payment methods count:', deleted.deletedCount);

  let scPm = await PM.findOne({
    $or: [{ address: contractAddress }, { accountNumber: contractAddress }]
  });

  if (!scPm) {
    scPm = await PM.create({
      name: 'Smart Contract Depository (BEP-20)',
      type: 'crypto',
      category: 'Smart Contract Vault',
      network: 'BNB Smart Chain (BEP-20)',
      networkCode: 'BSC',
      currency: 'USD',
      address: contractAddress,
      accountNumber: contractAddress,
      minLimit: '10',
      maxLimit: '100000',
      status: 'Active',
      isDefault: true,
      tokens: ['USDT (BEP-20)'],
      minDeposits: [{ token: 'USDT', min: '$10' }],
      warning: 'Send only USDT via BNB Smart Chain (BEP-20) to this official smart contract vault.',
      instructions: 'Send USDT (BEP-20) directly to the smart contract depository address, or scan the dynamic QR code.',
    });
    console.log('Created official Smart Contract Depository payment method');
  } else {
    scPm.name = 'Smart Contract Depository (BEP-20)';
    scPm.type = 'crypto';
    scPm.category = 'Smart Contract Vault';
    scPm.network = 'BNB Smart Chain (BEP-20)';
    scPm.networkCode = 'BSC';
    scPm.currency = 'USD';
    scPm.status = 'Active';
    scPm.isDefault = true;
    scPm.address = contractAddress;
    scPm.accountNumber = contractAddress;
    scPm.tokens = ['USDT (BEP-20)'];
    scPm.minDeposits = [{ token: 'USDT', min: '$10' }];
    scPm.warning = 'Send only USDT via BNB Smart Chain (BEP-20) to this official smart contract vault.';
    scPm.instructions = 'Send USDT (BEP-20) directly to the smart contract depository address, or scan the dynamic QR code.';
    await scPm.save();
    console.log('Updated official Smart Contract Depository payment method');
  }

  const remaining = await PM.find({});
  console.log('Active payment methods in DB:');
  console.log(JSON.stringify(remaining.map(p => ({
    id: p._id,
    name: p.name,
    category: p.category,
    network: p.network,
    address: p.address,
    status: p.status
  })), null, 2));

  await mongoose.disconnect();
}

setup().catch(console.error);
