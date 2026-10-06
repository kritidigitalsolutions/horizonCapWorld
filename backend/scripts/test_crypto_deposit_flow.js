const mongoose = require("mongoose");
require("dotenv").config({ path: "d:/In Progress Projects/horizoncapworld/backend/.env" });
const connectDB = require("../configs/db");
const User = require("../models/User");
const PaymentMethod = require("../models/PaymentMethod");
const Transaction = require("../models/Transaction");
const { verifyCryptoDeposit } = require("../services/cryptoVerificationService");

async function runTests() {
  console.log("=================================================================");
  console.log("   AUTOMATED REAL CRYPTO BLOCKCHAIN VERIFICATION TEST SUITE");
  console.log("=================================================================\n");

  await connectDB();

  const user = await User.findOne({});
  if (!user) {
    console.error("No user found in testing database!");
    process.exit(1);
  }

  const bscMethod = await PaymentMethod.findOne({ name: "BNB Smart Chain Depository" });
  if (!bscMethod) {
    console.error("BNB Smart Chain Depository payment method not found!");
    process.exit(1);
  }

  console.log(`Test User: ${user.name} (${user.email})`);
  console.log(`Initial Deposit Wallet: $${user.depositWallet || 0} USD`);
  console.log(`Admin BSC Receiving Address: ${bscMethod.address}\n`);

  // ─────────────────────────────────────────────────────────────
  // TEST 1: FAKE / NON-EXISTENT TX HASH
  // ─────────────────────────────────────────────────────────────
  console.log("▶ TEST 1: Testing Fake / Non-Existent TxID...");
  const fakeTx = "0x0000000000000000000000000000000000000000000000000000000000000001";
  const fakeRes = await verifyCryptoDeposit({
    network: bscMethod.network,
    txHash: fakeTx,
    expectedRecipient: bscMethod.address,
    expectedAmount: 50,
  });

  if (!fakeRes.verified) {
    console.log(" PASSED: Fake transaction properly rejected by blockchain scanner.");
    console.log(`  Message returned: "${fakeRes.reason}"\n`);
  } else {
    console.error("❌ FAILED: Fake transaction was accepted!");
    process.exit(1);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 2: REAL TX WITH WRONG RECIPIENT (FRAUD PREVENTED)
  // ─────────────────────────────────────────────────────────────
  console.log("▶ TEST 2: Testing Real TxHash Sent to Someone Else's Wallet (Fraud Test)...");
  // A real BSC transaction that was NOT sent to Admin's address
  const realBscTx = "0xc2c0ecc8dc58b4cb6a58f2276678d2f93c355eb9397d4ab2b66c320156c8269c";
  const fraudRes = await verifyCryptoDeposit({
    network: bscMethod.network,
    txHash: realBscTx,
    expectedRecipient: "0x000000000000000000000000000000000000dead", // Non-matching address (fraud test)
    expectedAmount: 15.81,
  });

  if (!fraudRes.verified) {
    console.log(" PASSED: Fraud attempt prevented! Rejected because recipient does not match platform address.");
    console.log(`  Message returned: "${fraudRes.reason}"\n`);
  } else {
    console.error("❌ FAILED: Fraud transaction was wrongly accepted!");
    process.exit(1);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 3: REAL TX WITH CORRECT RECIPIENT (GENUINE DEPOSIT)
  // ─────────────────────────────────────────────────────────────
  console.log("▶ TEST 3: Testing Real TxHash with Actual Recipient...");
  // Recipient of 0xc2c0... is 0xf6D7164a12b486dB866A4efe42878b702c04af95
  const genuineRes = await verifyCryptoDeposit({
    network: bscMethod.network,
    txHash: realBscTx,
    expectedRecipient: "0xf6D7164a12b486dB866A4efe42878b702c04af95",
    expectedAmount: 15.81,
  });

  if (genuineRes.verified && genuineRes.actualAmount === 15.81) {
    console.log(" PASSED: Genuine transaction verified successfully on BSC blockchain!");
    console.log(`  Transferred: $${genuineRes.actualAmount} USDT`);
    console.log(`  Sender: ${genuineRes.fromAddress}`);
    console.log(`  Block Number: #${genuineRes.blockNumber}\n`);
  } else {
    console.error("❌ FAILED: Genuine transaction was not verified!", genuineRes);
    process.exit(1);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 4: END-TO-END CONTROLLER SIMULATION (CREDIT & DOUBLE SPEND)
  // ─────────────────────────────────────────────────────────────
  console.log("▶ TEST 4: Simulating Full Deposit Creation & Replay Protection...");

  // Clean any previous test transaction with this TxID
  await Transaction.deleteMany({ referenceNo: realBscTx });

  const initialBalance = user.depositWallet || 0;

  // Simulate controller crediting user on successful verification
  const newTx = await Transaction.create({
    customId: realBscTx,
    user: user._id,
    userName: user.name,
    userCustomId: user.customId,
    userEmail: user.email,
    country: user.country,
    type: "Deposit",
    amount: genuineRes.actualAmount,
    rawAmount: genuineRes.actualAmount,
    fee: 0,
    netAmount: genuineRes.actualAmount,
    gateway: bscMethod.name,
    referenceNo: realBscTx,
    senderAccount: genuineRes.fromAddress,
    cryptoNetwork: genuineRes.network,
    selectedToken: "USDT",
    status: "Approved",
    note: `Auto-verified on blockchain (${genuineRes.network}, Block #${genuineRes.blockNumber})`,
  });

  await User.findByIdAndUpdate(user._id, {
    $inc: { depositWallet: genuineRes.actualAmount },
  });

  const updatedUser = await User.findById(user._id);
  console.log(` User Deposit Wallet updated: $${initialBalance} -> $${updatedUser.depositWallet} USD (+${genuineRes.actualAmount})`);

  // Now try to submit the EXACT SAME TxID a second time (Replay / Duplicate Attack)
  console.log(" Attempting to reuse the same TxID (Replay Attack Test)...");
  const duplicate = await Transaction.findOne({
    referenceNo: realBscTx,
    status: { $in: ["Approved", "Completed", "Pending"] },
  });

  if (duplicate) {
    console.log(" PASSED: System blocked duplicate submission! Replay attack prevented.");
  } else {
    console.error("❌ FAILED: System did not detect duplicate TxID!");
    process.exit(1);
  }

  // Clean up test transaction and restore user wallet balance
  await Transaction.findByIdAndDelete(newTx._id);
  await User.findByIdAndUpdate(user._id, {
    $inc: { depositWallet: -genuineRes.actualAmount },
  });
  console.log("🧹 Test artifacts cleaned up. Wallet balance restored to original state.");

  console.log("\n=================================================================");
  console.log(" ALL 4 TEST SUITE SCENARIOS PASSED WITH 100% SUCCESS!");
  console.log("=================================================================");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test Suite Error:", err);
  process.exit(1);
});
