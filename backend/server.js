const app = require("./app");
const connectDB = require("./configs/db");
const ReferralSetting = require("./models/ReferralSetting");

const PORT = process.env.PORT || 5002;

const LEVEL_ROI_DATA = [
  { level: "L0", levelNumber: 0, name: "Self Investment (Level 0)", depositAmount: 1000, profitAmount: 8, percentage: 0, roiPerDay: 0, eligibleConditions: "NA", groupVolumeMin: 0, directClientsMin: 0, investCommission: "0%", earningsCommission: "0%", investCommissionRate: 0, earningsCommissionRate: 0 },
  { level: "L1", levelNumber: 1, name: "Direct Referrals (Level 1)", depositAmount: 0, profitAmount: 0, percentage: 10, roiPerDay: 10, eligibleConditions: "No Condition", groupVolumeMin: 0, directClientsMin: 0, investCommission: "5%", earningsCommission: "10%", investCommissionRate: 5, earningsCommissionRate: 10 },
  { level: "L2", levelNumber: 2, name: "Sub-Referrals (Level 2)", depositAmount: 0, profitAmount: 0, percentage: 10, roiPerDay: 10, eligibleConditions: "Group Volume Min. 500$, 2 Direct Clients", groupVolumeMin: 500, directClientsMin: 2, investCommission: "4%", earningsCommission: "10%", investCommissionRate: 4, earningsCommissionRate: 10 },
  { level: "L3", levelNumber: 3, name: "Network Tier (Level 3)", depositAmount: 0, profitAmount: 0, percentage: 5, roiPerDay: 5, eligibleConditions: "Group Volume Min. 1500$, 3 Direct Clients", groupVolumeMin: 1500, directClientsMin: 3, investCommission: "3%", earningsCommission: "5%", investCommissionRate: 3, earningsCommissionRate: 5 },
  { level: "L4", levelNumber: 4, name: "Network Tier (Level 4)", depositAmount: 0, profitAmount: 0, percentage: 5, roiPerDay: 5, eligibleConditions: "Group Volume Min. 3000$, 4 Direct Clients", groupVolumeMin: 3000, directClientsMin: 4, investCommission: "2%", earningsCommission: "5%", investCommissionRate: 2, earningsCommissionRate: 5 },
  { level: "L5", levelNumber: 5, name: "Global Depth (Level 5)", depositAmount: 0, profitAmount: 0, percentage: 5, roiPerDay: 5, eligibleConditions: "Group Volume Min. 4000$, 5 Direct Clients", groupVolumeMin: 4000, directClientsMin: 5, investCommission: "1.5%", earningsCommission: "5%", investCommissionRate: 1.5, earningsCommissionRate: 5 },
  { level: "L6", levelNumber: 6, name: "Expansion Tier (Level 6)", depositAmount: 0, profitAmount: 0, percentage: 5, roiPerDay: 5, eligibleConditions: "Group Volume Min. 5,000$, 10 Direct Clients", groupVolumeMin: 5000, directClientsMin: 10, investCommission: "1%", earningsCommission: "5%", investCommissionRate: 1, earningsCommissionRate: 5 },
  { level: "L7", levelNumber: 7, name: "Regional Depth (Level 7)", depositAmount: 0, profitAmount: 0, percentage: 5, roiPerDay: 5, eligibleConditions: "Group Volume Min. 10,000$, 11 Direct Clients", groupVolumeMin: 10000, directClientsMin: 11, investCommission: "0.8%", earningsCommission: "5%", investCommissionRate: 0.8, earningsCommissionRate: 5 },
  { level: "L8", levelNumber: 8, name: "Executive Tier (Level 8)", depositAmount: 0, profitAmount: 0, percentage: 5, roiPerDay: 5, eligibleConditions: "Group Volume Min. 15,000$, 11 Direct Clients", groupVolumeMin: 15000, directClientsMin: 11, investCommission: "0.6%", earningsCommission: "5%", investCommissionRate: 0.6, earningsCommissionRate: 5 },
  { level: "L9", levelNumber: 9, name: "Leadership Tier (Level 9)", depositAmount: 0, profitAmount: 0, percentage: 5, roiPerDay: 5, eligibleConditions: "Group Volume Min. 20,000$, 11 Direct Clients", groupVolumeMin: 20000, directClientsMin: 11, investCommission: "0.5%", earningsCommission: "5%", investCommissionRate: 0.5, earningsCommissionRate: 5 },
  { level: "L10", levelNumber: 10, name: "Ambassador Tier (Level 10)", depositAmount: 0, profitAmount: 0, percentage: 5, roiPerDay: 5, eligibleConditions: "Group Volume Min.25,000$, 11 Direct Clients", groupVolumeMin: 25000, directClientsMin: 11, investCommission: "0.4%", earningsCommission: "5%", investCommissionRate: 0.4, earningsCommissionRate: 5 },
];

const syncReferralSettings = async () => {
  try {
    const existing = await ReferralSetting.find();
    const hasLevel0 = existing.some(s => s.levelNumber === 0);
    const hasLevel1LegacyDeposit = existing.some(s => s.levelNumber === 1 && s.depositAmount === 1000);
    const hasLevel11 = existing.some(s => s.levelNumber > 10);

    if (!hasLevel0 || hasLevel1LegacyDeposit || hasLevel11 || existing.length !== 11) {
      console.log("[Referrals Startup] Resyncing Level 0-10 matrix in MongoDB...");
      await ReferralSetting.deleteMany({});
      await ReferralSetting.insertMany(LEVEL_ROI_DATA);
      console.log("[Referrals Startup] Level 0-10 matrix synced successfully!");
    }
  } catch (err) {
    console.warn("[Referrals Startup] Sync warning:", err.message);
  }
};

const startServer = async () => {
  try {
    await connectDB();
    await syncReferralSettings();
    app.listen(PORT, () => {
      console.log(`Horizon Capital Backend server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failure:", error.message);
    process.exit(1);
  }
};

startServer();