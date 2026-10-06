const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("../configs/db");
const InvestmentPlan = require("../models/InvestmentPlan");
const UserInvestment = require("../models/UserInvestment");
const User = require("../models/User");

async function migrate() {
  try {
    await connectDB();
    console.log("Connected to DB for migration...");

    // 1. Update all Investment Plans to Per Second (Live)
    const plansResult = await InvestmentPlan.updateMany({}, {
      $set: { payoutInterval: "Per Second (Live)" }
    });
    console.log(`Updated ${plansResult.modifiedCount} Investment Plans to 'Per Second (Live)'.`);

    // 2. Update all User Investments to Per Second (Live) and ensure valid perSecondRate
    const activeInvestments = await UserInvestment.find({ status: "Active" });
    console.log(`Found ${activeInvestments.length} active user investments.`);

    for (const inv of activeInvestments) {
      const dailyRoi = Number(inv.dailyRoi) || 0.3;
      const dailyEarning = Number(inv.dailyEarning) || (inv.amount * (dailyRoi / 100));
      const perSec = Number((dailyEarning / 86400).toFixed(8));

      inv.payoutInterval = "Per Second (Live)";
      inv.dailyEarning = dailyEarning;
      inv.perSecondRate = perSec;
      await inv.save();
    }
    console.log("All active investments updated with perSecondRate and 'Per Second (Live)' mode.");

    // Also update any completed/past investments
    await UserInvestment.updateMany({ status: { $ne: "Active" } }, {
      $set: { payoutInterval: "Per Second (Live)" }
    });

    // 3. Update all Users to Per Second (Live) and sync perSecondRate
    const users = await User.find();
    for (const u of users) {
      const userActiveInvs = await UserInvestment.find({ user: u._id, status: "Active" });
      let totalDaily = 0;
      let totalPerSec = 0;

      userActiveInvs.forEach((inv) => {
        totalDaily += inv.dailyEarning || 0;
        totalPerSec += inv.perSecondRate || 0;
      });

      u.payoutType = "Per Second (Live)";
      if (userActiveInvs.length > 0) {
        u.dailyEarning = Number(totalDaily.toFixed(4));
        u.perSecondRate = Number(totalPerSec.toFixed(8));
      } else {
        u.dailyEarning = 0;
        u.perSecondRate = 0;
      }
      await u.save();
    }
    console.log(`Updated ${users.length} users: payoutType is now 'Per Second (Live)' and streaming rates synced.`);

    console.log("Migration complete!");
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

migrate();
