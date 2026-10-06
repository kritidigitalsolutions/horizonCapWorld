const mongoose = require('mongoose');
require('dotenv').config();
const PaymentMethod = require('../models/PaymentMethod');

async function clean() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const res = await PaymentMethod.updateMany(
    {
      $or: [
        { category: 'Smart Contract Vault' },
        { name: /smart contract/i }
      ]
    },
    {
      $set: {
        qrCodeUrl: '',
        category: 'Smart Contract Vault'
      }
    }
  );

  console.log('Cleared static QR on smart contract gateways:', res);
  const updated = await PaymentMethod.find({});
  console.log('Updated PaymentMethods:', updated.map(u => ({ name: u.name, category: u.category, qrCodeUrl: u.qrCodeUrl })));
  process.exit(0);
}

clean().catch(err => {
  console.error(err);
  process.exit(1);
});
