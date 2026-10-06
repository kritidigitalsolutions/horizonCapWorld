const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');

async function testProfileWalletFlow() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB:", mongoose.connection.name);

    // Find test user
    const user = await User.findOne({ $or: [{ email: 'kumar041232@gmail.com' }, { userName: 'kumar041232' }, { customId: 'HORIZON-USR-84924' }] });
    if (!user) {
      console.error("Test user kumar041232 not found!");
      process.exit(1);
    }

    console.log(`Current User: ${user.name} (${user.customId})`);
    console.log("Current cryptoWallets in DB:", user.cryptoWallets);

    // Update cryptoWallets with realistic test addresses
    user.cryptoWallets = {
      usdtBep20: "0xC6AcBEe42E9E323140C1ed060C2F6ea9Cc3B4B75",
      usdtTrc20: "TQ7Nsw3mmtm87DNZ263nPFUfEMYHF3HBsP",
      solana: "",
      polygon: "",
    };
    await user.save();

    // Re-fetch
    const reloaded = await User.findById(user._id).select('-password');
    console.log("\nReloaded cryptoWallets after save:");
    console.log(JSON.stringify(reloaded.cryptoWallets, null, 2));

    if (
      reloaded.cryptoWallets?.usdtBep20 === "0x1234567890abcdef1234567890abcdef12345678" &&
      reloaded.cryptoWallets?.usdtTrc20 === "TXxx1234567890abcdef1234567890abcde"
    ) {
      console.log("\n✅ SUCCESS: Crypto wallets successfully saved & retrieved from DB!");
    } else {
      console.error("\n❌ FAILED: Crypto wallets do not match expected values.");
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Error in testProfileWalletFlow:", err);
    process.exit(1);
  }
}

testProfileWalletFlow();
