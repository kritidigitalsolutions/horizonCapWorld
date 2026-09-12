const bcrypt = require("bcrypt");
const Admin = require("../models/Admin");
const User = require("../models/User");
const InvestmentPlan = require("../models/InvestmentPlan");
const UserInvestment = require("../models/UserInvestment");
const PaymentMethod = require("../models/PaymentMethod");
const ReferralSetting = require("../models/ReferralSetting");
const Rank = require("../models/Rank");
const DepositVideo = require("../models/DepositVideo");
const SupportChannel = require("../models/SupportChannel");
const SupportTicket = require("../models/SupportTicket");
const NewsArticle = require("../models/NewsArticle");
const Transaction = require("../models/Transaction");
const AdminSettings = require("../models/AdminSettings");

const seedInitialData = async () => {
  try {
    // 1. Seed Super Admin
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin123", salt);

      await Admin.create({
        name: "Super Admin",
        email: "admin@gmail.com",
        password: hashedPassword,
        avatar: "",
        recoveryEmail: "recovery@horizoncap.com",
        role: "SUPER_ADMIN",
        twoFactorEnabled: true,
      });
      console.log("Default Super Admin created: admin@gmail.com / admin123");
    }

    // 2. Seed Admin Platform Settings
    const settingsCount = await AdminSettings.countDocuments();
    if (settingsCount === 0) {
      await AdminSettings.create({});
      console.log("Default Admin Settings seeded.");
    }

    // 3. Seed Investment Plans
    const standardSlabs = [
      { minAmount: 10, maxAmount: 100, noMaxLimit: false, dailyRoi: 0.3, lockInDailyRoi: 0.4, monthlyRoi: 9.0, lockInMonthlyRoi: 12.0, annualRoi: 108.0, lockInAnnualRoi: 144.0 },
      { minAmount: 101, maxAmount: 500, noMaxLimit: false, dailyRoi: 0.5, lockInDailyRoi: 0.6, monthlyRoi: 15.0, lockInMonthlyRoi: 18.0, annualRoi: 180.0, lockInAnnualRoi: 216.0 },
      { minAmount: 501, maxAmount: 5000, noMaxLimit: false, dailyRoi: 0.8, lockInDailyRoi: 0.9, monthlyRoi: 24.0, lockInMonthlyRoi: 27.0, annualRoi: 288.0, lockInAnnualRoi: 324.0 },
      { minAmount: 5001, maxAmount: null, noMaxLimit: true, dailyRoi: 1.0, lockInDailyRoi: 1.1, monthlyRoi: 30.0, lockInMonthlyRoi: 33.0, annualRoi: 360.0, lockInAnnualRoi: 396.0 },
    ];

    const plansCount = await InvestmentPlan.countDocuments();
    if (plansCount === 0) {
      const defaultPlans = [
        {
          name: "Solar Eco Farm Yield",
          category: "Renewable Energy",
          roiType: "slab",
          roi: 9.0,
          dailyRoi: 0.3,
          roiSlabs: standardSlabs,
          hasLockInOption: true,
          lockInPeriodDays: 90,
          minDepositAmount: 10,
          minWithdrawalAmount: 5,
          duration: "12 Months",
          durationDays: 365,
          minAmount: 10,
          maxAmount: null,
          noMaxLimit: true,
          payoutInterval: "Per Second (Live)",
          status: "Active",
          investors: 428,
          description: "Utility-scale photovoltaic generation farms with sovereign power agreements and amount-wise daily ROI return slabs.",
        },
        {
          name: "Physical Gold Bullion Vault",
          category: "Precious Metal",
          roiType: "slab",
          roi: 9.0,
          dailyRoi: 0.3,
          roiSlabs: standardSlabs,
          hasLockInOption: true,
          lockInPeriodDays: 90,
          minDepositAmount: 10,
          minWithdrawalAmount: 5,
          duration: "6 Months",
          durationDays: 180,
          minAmount: 10,
          maxAmount: null,
          noMaxLimit: true,
          payoutInterval: "Daily Payout",
          status: "Active",
          investors: 312,
          description: "Allocated 99.99% pure LBMA-certified bullion bars stored in Zurich and Singapore custody vaults.",
        },
        {
          name: "Wind Turbine Clean Power",
          category: "Renewable Energy",
          roiType: "slab",
          roi: 9.0,
          dailyRoi: 0.3,
          roiSlabs: standardSlabs,
          hasLockInOption: true,
          lockInPeriodDays: 90,
          minDepositAmount: 10,
          minWithdrawalAmount: 5,
          duration: "24 Months",
          durationDays: 730,
          minAmount: 10,
          maxAmount: null,
          noMaxLimit: true,
          payoutInterval: "Daily Payout",
          status: "Active",
          investors: 185,
          description: "Offshore deep-water wind turbine syndicate generating stable institutional cash flows.",
        },
        {
          name: "Platinum Reserve Vault",
          category: "Precious Metal",
          roiType: "slab",
          roi: 9.0,
          dailyRoi: 0.3,
          roiSlabs: standardSlabs,
          hasLockInOption: true,
          lockInPeriodDays: 90,
          minDepositAmount: 10,
          minWithdrawalAmount: 5,
          duration: "18 Months",
          durationDays: 540,
          minAmount: 10,
          maxAmount: null,
          noMaxLimit: true,
          payoutInterval: "Per Second (Live)",
          status: "Active",
          investors: 94,
          description: "Institutional physical platinum sponge and ingots insured by Lloyd's of London with audited reserves.",
        },
        {
          name: "Green Hydrogen Catalyst",
          category: "Renewable Energy",
          roiType: "slab",
          roi: 9.0,
          dailyRoi: 0.3,
          roiSlabs: standardSlabs,
          hasLockInOption: true,
          lockInPeriodDays: 90,
          minDepositAmount: 10,
          minWithdrawalAmount: 5,
          duration: "3 Months",
          durationDays: 90,
          minAmount: 10,
          maxAmount: null,
          noMaxLimit: true,
          payoutInterval: "Per Second (Live)",
          status: "Active",
          investors: 560,
          description: "Commercial zero-emission electrolyzer clusters producing green hydrogen for industrial transport fleets.",
        },
      ];

      for (const p of defaultPlans) {
        await InvestmentPlan.create(p);
      }
      console.log("Default Investment Plans seeded with 4-Tier Daily ROI Slabs & Lock-In.");
    } else {
      // Sync any existing plans to the new 4 standard slabs if they have old 5 slabs or missing lockIn
      const existingPlans = await InvestmentPlan.find();
      for (const plan of existingPlans) {
        if (!plan.roiSlabs || plan.roiSlabs.length !== 4 || plan.roiSlabs[0].dailyRoi !== 0.3) {
          plan.roiType = "slab";
          plan.roiSlabs = standardSlabs;
          plan.dailyRoi = 0.3;
          plan.roi = 9.0;
          plan.minAmount = 10;
          plan.minDepositAmount = 10;
          plan.minWithdrawalAmount = 5;
          plan.hasLockInOption = true;
          plan.lockInPeriodDays = 90;
          plan.noMaxLimit = true;
          plan.maxAmount = null;
          await plan.save();
        }
      }
      console.log(`Synced existing investment plans with new 4-tier ROI slabs and lock-in options.`);
    }

    // 4. Seed Payment Methods
    const methodsCount = await PaymentMethod.countDocuments();
    if (methodsCount === 0) {
      const defaultMethods = [
        {
          type: "fiat",
          category: "Mobile E-Wallet",
          name: "EasyPaisa",
          subtitle: "Rs 1.00 – Rs 100,000,000.00",
          currency: "PKR",
          accountHolder: "Mashooq Ali",
          accountNumber: "03493588941",
          network: "EasyPaisa Mobile Banking",
          networkCode: "EASYPAISA",
          confirmationTime: "Instant (< 1 Min)",
          minLimit: "Rs 1.00",
          maxLimit: "Rs 100,000,000.00",
          instructions: "Send money to EasyPaisa account 03493588941. Save your 11-digit TRX ID for instant auto-verification.",
        },
        {
          type: "fiat",
          category: "Mobile E-Wallet",
          name: "Jazzcash",
          subtitle: "Rs 1.00 – Rs 5,000,000.00",
          currency: "PKR",
          accountHolder: "Sathi Communication",
          accountNumber: "988164873",
          network: "JazzCash Mobile Banking",
          networkCode: "JAZZCASH",
          confirmationTime: "Instant (< 1 Min)",
          minLimit: "Rs 1.00",
          maxLimit: "Rs 5,000,000.00",
          instructions: "Send payment via JazzCash App to Mobile/Till 988164873 or scan official QR code.",
        },
        {
          type: "bank",
          category: "Indian Bank Account",
          name: "Indian Bank (HDFC & UPI)",
          subtitle: "₹100.00 – ₹5,000,000.00 INR",
          currency: "INR",
          bankName: "HDFC Bank Ltd",
          accountNumber: "50200084920194",
          ifsc: "HDFC0000128",
          accountHolder: "Horizon Capital India Pvt Ltd",
          upiId: "horizoncapital@hdfcbank",
          network: "Indian Domestic (IMPS / NEFT / UPI)",
          networkCode: "INR/UPI",
          confirmationTime: "Instant (~2 Minutes)",
          minLimit: "₹100.00",
          maxLimit: "₹5,000,000.00",
          instructions: "Transfer via IMPS / NEFT or scan UPI QR code. Enter User ID in remarks.",
        },
        {
          type: "crypto",
          category: "Crypto Digital Wallet",
          name: "Solana High-Speed Treasury",
          subtitle: "SOL · USDC · USDT",
          currency: "USD / SOL",
          tokens: ["SOL", "USDC", "USDT"],
          network: "Solana Network (SPL)",
          networkCode: "SOL",
          confirmationTime: "Instant (< 1 Second)",
          address: "BpXCs5H9A14LZ6yC62d6wVF6RJhdzFY9KoNPYBjPsRyq",
          minLimit: "$25 USD (0.02 SOL)",
          instructions: "Only send SOL, USDC, USDT on Solana network (SPL).",
        },
        {
          type: "crypto",
          category: "Crypto Digital Wallet",
          name: "TRON Primary Treasury",
          subtitle: "TRX · USDT · USDD",
          currency: "USD / TRX",
          tokens: ["TRX", "USDT", "USDD"],
          network: "TRON (TRC-20)",
          networkCode: "TRC20",
          confirmationTime: "Instant (~1 Block)",
          address: "TX78rQw9pL29Ym82K1vNx4B8zQc12aE9mP",
          minLimit: "$10 USD (20 TRX)",
          instructions: "Only send TRX, USDT on TRC-20 network to this address.",
        },
        {
          type: "crypto",
          category: "Crypto Digital Wallet",
          name: "BNB Smart Chain Depository",
          subtitle: "BNB · USDT · USDC · FDUSD",
          currency: "USD / BNB",
          tokens: ["BNB", "USDT", "USDC", "FDUSD"],
          network: "BNB Smart Chain (BEP-20)",
          networkCode: "BSC",
          confirmationTime: "Instant (~3 Seconds)",
          address: "0x71C8395B28b07d9f7832B4FaE2429676644B294",
          minLimit: "$10 USD (0.01 BNB)",
          instructions: "Only send BEP-20 tokens on BNB Smart Chain to this address.",
        },
      ];

      await PaymentMethod.insertMany(defaultMethods);
      console.log("Default Payment Methods seeded.");
    }

    // 5. Seed 11-Tier Level ROI Referral Commission Settings
    const defaultRefSettings = [
      { level: "L1", levelNumber: 1, name: "Level 1", depositAmount: 0, profitAmount: 0, roiPerDay: 0.08, eligibleConditions: "Group Volume Min.25,000$, 11 Direct Clients", groupVolumeMin: 25000, directClientsMin: 11, investCommission: "5%", investCommissionRate: 5, earningsCommission: "5%", earningsCommissionRate: 5, activePromoters: 3420, totalVolume: "$1,250,000" },
      { level: "L2", levelNumber: 2, name: "Level 2", depositAmount: 0, profitAmount: 0, roiPerDay: 0.08, eligibleConditions: "Group Volume Min. 20,000$, 11 Direct Clients", groupVolumeMin: 20000, directClientsMin: 11, investCommission: "4%", investCommissionRate: 4, earningsCommission: "4%", earningsCommissionRate: 4, activePromoters: 2180, totalVolume: "$890,000" },
      { level: "L3", levelNumber: 3, name: "Level 3", depositAmount: 0, profitAmount: 0, roiPerDay: 0.08, eligibleConditions: "Group Volume Min. 15,000$, 11 Direct Clients", groupVolumeMin: 15000, directClientsMin: 11, investCommission: "3%", investCommissionRate: 3, earningsCommission: "3%", earningsCommissionRate: 3, activePromoters: 1420, totalVolume: "$520,000" },
      { level: "L4", levelNumber: 4, name: "Level 4", depositAmount: 0, profitAmount: 0, roiPerDay: 0.16, eligibleConditions: "Group Volume Min. 10,000$, 11 Direct Clients", groupVolumeMin: 10000, directClientsMin: 11, investCommission: "2%", investCommissionRate: 2, earningsCommission: "2%", earningsCommissionRate: 2, activePromoters: 840, totalVolume: "$310,000" },
      { level: "L5", levelNumber: 5, name: "Level 5", depositAmount: 0, profitAmount: 0, roiPerDay: 0.24, eligibleConditions: "Group Volume Min. 5,000$, 10 Direct Clients", groupVolumeMin: 5000, directClientsMin: 10, investCommission: "1.5%", investCommissionRate: 1.5, earningsCommission: "1.5%", earningsCommissionRate: 1.5, activePromoters: 490, totalVolume: "$185,000" },
      { level: "L6", levelNumber: 6, name: "Level 6", depositAmount: 0, profitAmount: 0, roiPerDay: 0.40, eligibleConditions: "Group Volume Min. 4000$, 5 Direct Clients", groupVolumeMin: 4000, directClientsMin: 5, investCommission: "1%", investCommissionRate: 1, earningsCommission: "1%", earningsCommissionRate: 1, activePromoters: 280, totalVolume: "$95,000" },
      { level: "L7", levelNumber: 7, name: "Level 7", depositAmount: 0, profitAmount: 0, roiPerDay: 0.48, eligibleConditions: "Group Volume Min. 3000$, 4 Direct Clients", groupVolumeMin: 3000, directClientsMin: 4, investCommission: "0.8%", investCommissionRate: 0.8, earningsCommission: "0.8%", earningsCommissionRate: 0.8, activePromoters: 160, totalVolume: "$55,000" },
      { level: "L8", levelNumber: 8, name: "Level 8", depositAmount: 0, profitAmount: 0, roiPerDay: 0.64, eligibleConditions: "Group Volume Min. 2000$, 3 Direct Clients", groupVolumeMin: 2000, directClientsMin: 3, investCommission: "0.6%", investCommissionRate: 0.6, earningsCommission: "0.6%", earningsCommissionRate: 0.6, activePromoters: 95, totalVolume: "$30,000" },
      { level: "L9", levelNumber: 9, name: "Level 9", depositAmount: 0, profitAmount: 0, roiPerDay: 0.80, eligibleConditions: "Group Volume Min. 1000$, 2 Direct Clients", groupVolumeMin: 1000, directClientsMin: 2, investCommission: "0.5%", investCommissionRate: 0.5, earningsCommission: "0.5%", earningsCommissionRate: 0.5, activePromoters: 50, totalVolume: "$15,000" },
      { level: "L10", levelNumber: 10, name: "Level 10", depositAmount: 0, profitAmount: 0, roiPerDay: 1.20, eligibleConditions: "No Condition", groupVolumeMin: 0, directClientsMin: 0, investCommission: "0.4%", investCommissionRate: 0.4, earningsCommission: "0.4%", earningsCommissionRate: 0.4, activePromoters: 25, totalVolume: "$8,000" },
      { level: "L11", levelNumber: 11, name: "Level 11", depositAmount: 1000, profitAmount: 8, roiPerDay: 0.80, eligibleConditions: "Deposit $1000 => Profit $8", groupVolumeMin: 0, directClientsMin: 0, investCommission: "0.3%", investCommissionRate: 0.3, earningsCommission: "0.3%", earningsCommissionRate: 0.3, activePromoters: 10, totalVolume: "$5,000" },
    ];

    const refCount = await ReferralSetting.countDocuments();
    if (refCount === 0) {
      await ReferralSetting.insertMany(defaultRefSettings);
      console.log("Default 11-Tier Level ROI Referral Settings seeded.");
    } else {
      for (const tierData of defaultRefSettings) {
        await ReferralSetting.findOneAndUpdate(
          { level: tierData.level },
          { $set: tierData },
          { upsert: true, new: true }
        );
      }
      console.log("Synchronized 11-Tier Level ROI Referral Settings.");
    }

    // 6. Seed 9-Tier Rank Ladder (Spreadsheet Specification)
    const defaultRanks = [
      {
        level: 1,
        name: "Associate",
        ownDeposit: 50,
        totalClientDeposit: 5000,
        minInvest: 5000,
        reward: 100,
        condition: "1 Leg should not be more than 40% of the GV",
        companyProfitSharing: "0",
        downlineStructureRequired: "2 Active Direct Client",
        achievers: 4890,
        desc: "Entry leadership milestone unlocked with active direct network.",
        status: "Active",
      },
      {
        level: 2,
        name: "Senior Associate",
        ownDeposit: 100,
        totalClientDeposit: 10000,
        minInvest: 10000,
        reward: 300,
        condition: "1 Leg should not be more than 40% of the GV",
        companyProfitSharing: "0",
        downlineStructureRequired: "3 Active Direct Clients",
        achievers: 2340,
        desc: "Demonstrated network volume builder.",
        status: "Active",
      },
      {
        level: 3,
        name: "Team Leader",
        ownDeposit: 250,
        totalClientDeposit: 25000,
        minInvest: 25000,
        reward: 875,
        condition: "1 Leg should not be more than 40% of the GV",
        companyProfitSharing: "0",
        downlineStructureRequired: "3 Active Direct Clients ( Min. 1 Associate )",
        achievers: 1210,
        desc: "Regional leadership leader managing team turnover.",
        status: "Active",
      },
      {
        level: 4,
        name: "Director",
        ownDeposit: 500,
        totalClientDeposit: 50000,
        minInvest: 50000,
        reward: 2000,
        condition: "1 Leg should not be more than 40% of the GV",
        companyProfitSharing: "0",
        downlineStructureRequired: "4 Active Direct Clients ( Min 2 Sr. Associate )",
        achievers: 680,
        desc: "Executive director supervising multi-tier syndicates.",
        status: "Active",
      },
      {
        level: 5,
        name: "Regional Director",
        ownDeposit: 1000,
        totalClientDeposit: 100000,
        minInvest: 100000,
        reward: 5000,
        condition: "1 Leg should not be more than 40% of the GV",
        companyProfitSharing: "0",
        downlineStructureRequired: "4 Active Direct Clients ( Min. 2 Team Leaders )",
        achievers: 340,
        desc: "Senior regional executive commanding six-figure volume.",
        status: "Active",
      },
      {
        level: 6,
        name: "Executive Director",
        ownDeposit: 1500,
        totalClientDeposit: 200000,
        minInvest: 200000,
        reward: 10000,
        condition: "1 Leg should not be more than 40% of the GV",
        companyProfitSharing: "0.20% of the total company Profit + 500$ Per Month Salary",
        downlineStructureRequired: "5 Active Direct Clients ( Min. 2 Directors )",
        achievers: 160,
        desc: "Corporate syndicate leader receiving monthly salary and profit share.",
        status: "Active",
      },
      {
        level: 7,
        name: "Diamond",
        ownDeposit: 2000,
        totalClientDeposit: 300000,
        minInvest: 300000,
        reward: 15000,
        condition: "1 Leg should not be more than 40% of the GV",
        companyProfitSharing: "0.50% of the Total Company Profit + 1000$ Per Month Salary",
        downlineStructureRequired: "6 Active Direct Clients ( Min. 2 Regional Directors )",
        achievers: 72,
        desc: "High-tier executive with expanded profit share and salary.",
        status: "Active",
      },
      {
        level: 8,
        name: "Crown Diamond",
        ownDeposit: 3000,
        totalClientDeposit: 600000,
        minInvest: 600000,
        reward: 35000,
        condition: "1 Leg should not be more than 40% of the GV",
        companyProfitSharing: "0.75% of the Total Company Profit + 1500$ Per Month Salary",
        downlineStructureRequired: "8 Active Direct Clients ( Min. 2 Executive Directors )",
        achievers: 28,
        desc: "Elite summit council member with premier dividends.",
        status: "Active",
      },
      {
        level: 9,
        name: "Global Ambassador",
        ownDeposit: 5000,
        totalClientDeposit: 1000000,
        minInvest: 1000000,
        reward: 60000,
        condition: "1 Leg should not be more than 40% of the GV",
        companyProfitSharing: "1% of the Total Company Profit + 3000$ Per Month Salary",
        downlineStructureRequired: "10 Active Direct Clients ( Min. 2 Diamonds )",
        achievers: 11,
        desc: "Apex global ambassador commanding global network volume.",
        status: "Active",
      },
    ];

    // Clear obsolete ranks above level 9 if any exist
    await Rank.deleteMany({ level: { $gt: 9 } });

    for (const r of defaultRanks) {
      await Rank.findOneAndUpdate(
        { level: r.level },
        { $set: r },
        { upsert: true, new: true }
      );
    }
    console.log("Synchronized 9-Tier Rank Ladder (Spreadsheet Specification).");

    // 7. Seed Deposit Video Tutorial
    const videoCount = await DepositVideo.countDocuments();
    if (videoCount === 0) {
      await DepositVideo.create({
        title: "Official Deposit Guide: How to deposit via EasyPaisa, JazzCash, Bank Transfer & Crypto",
        subtitle: "Watch this 2-minute step-by-step video before transferring funds to ensure instant auto-credit and zero delays.",
        videoType: "url",
        videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
        youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        uploadedVideoName: "horizon_official_deposit_tutorial.mp4",
        instructions: [
          "Choose your preferred deposit channel from the menu (EasyPaisa, JazzCash, Bank Transfer, or Crypto).",
          "Copy the official account number, IBAN or wallet address, or scan the verified QR code.",
          "Complete the transfer through your banking or crypto app.",
          "Enter the amount sent and your Transaction ID (TID / Hash) or upload the bank transfer slip.",
          "Click Submit deposit — deposits are verified and auto-credited.",
        ],
        status: "Published",
      });
      console.log("Default Deposit Tutorial Video seeded.");
    }

    // 8. Seed Support Channels
    const channelsCount = await SupportChannel.countDocuments();
    if (channelsCount === 0) {
      const defaultChannels = [
        { platform: "WhatsApp", title: "VIP Client Desk (WhatsApp)", handle: "+44 7911 123456", url: "https://wa.me/447911123456", department: "24/7 VIP Escrow Support", hours: "24/7 Live Coverage", category: "Instant Chat", status: "Active", stats: "Avg. Reply < 2 mins", icon: "whatsapp" },
        { platform: "Telegram", title: "Official Community & Broadcast", handle: "@HorizonCapOfficial", url: "https://t.me/HorizonCapOfficial", department: "Global Announcements", hours: "24/7 Live Coverage", category: "Instant Chat", status: "Active", stats: "Avg. Reply < 5 mins", icon: "telegram" },
        { platform: "Email", title: "Institutional Support Desk", handle: "support@horizoncap.com", url: "mailto:support@horizoncap.com", department: "Compliance & Audits", hours: "Mon-Fri 08:00-20:00 UTC", category: "Email Support", status: "Active", stats: "Avg. Reply < 1 hour", icon: "mail" },
      ];
      await SupportChannel.insertMany(defaultChannels);
      console.log("Default Support Channels seeded.");
    }

    // 9. Seed Demo Investor / User
    const userCount = await User.countDocuments();
    let demoUser;
    if (userCount === 0) {
      const salt = await bcrypt.genSalt(10);
      const userPassword = await bcrypt.hash("user123", salt);

      demoUser = await User.create({
        customId: "HORIZON-USR-07",
        name: "William Max",
        email: "william@horizoncap.com",
        phone: "+91 98765 43210",
        password: userPassword,
        country: "India",
        city: "New Delhi",
        address: "14 Connaught Place, Block B",
        dob: "1992-06-15",
        timezone: "Asia/Kolkata (UTC+05:30)",
        sponsorId: "HORIZON-USR-01",
        currentRank: "Gold Sovereign",
        rankLevel: 3,
        depositWallet: 15400,
        earningWallet: 8940.5,
        totalInvested: 16000,
        totalProfit: 4520,
        totalWithdrawn: 3200,
        totalReferrals: 14,
        directReferrals: 8,
        teamTurnover: 15750,
        dailyEarning: 68.7,
        perSecondRate: 0.0007951,
        payoutType: "Per Second (Live)",
        status: "Active",
      });
      console.log("Default Demo User created: william@horizoncap.com / user123 (HORIZON-USR-07)");
    } else {
      demoUser = await User.findOne({ email: "william@horizoncap.com" }) || await User.findOne();
    }

    // 10. Seed News Articles
    const newsCount = await NewsArticle.countDocuments();
    if (newsCount === 0) {
      const defaultArticles = [
        {
          title: "Horizon Capital Expands Renewable Portfolio with 250MW Desert Solar Syndicate",
          subtitle: "Institutional investors unlock stable 18% APY backed by sovereign power purchase contracts in North Africa.",
          category: "Renewable Energy",
          authorName: "Horizon Research Desk",
          authorRole: "Senior Energy Analyst",
          bannerUrl: "https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=800&auto=format&fit=crop",
          readTime: "3 min read",
          views: 342,
          isFeatured: true,
          tags: ["Solar", "CleanEnergy", "InstitutionalYield"],
          content: "Horizon Capital has finalized the acquisition and syndication of a 250MW photovoltaic solar farm cluster. Operating with real-time per-second streaming ROI infrastructure, investors earn predictable returns directly into their digital vaults.",
          status: "Published",
        },
        {
          title: "Physical Bullion Vault Security Protocol 2026 Audit Report",
          subtitle: "Annual physical verification completed with 100% LBMA-standard bars allocated in Zurich and Singapore custody.",
          category: "Precious Metals",
          authorName: "Compliance Division",
          authorRole: "Head of Custody & Escrow",
          bannerUrl: "https://images.unsplash.com/photo-1610375461246-83df859d849d?q=80&w=800&auto=format&fit=crop",
          readTime: "4 min read",
          views: 218,
          isFeatured: false,
          tags: ["Gold", "Bullion", "Audits"],
          content: "Independent audit firms have concluded the 2026 physical bar weight and serial inspection for Horizon Capital vault holdings. Total precious metals backing investor contracts remain fully allocated with zero hypothecation.",
          status: "Published",
        },
      ];
      await NewsArticle.insertMany(defaultArticles);
      console.log("Default News Articles seeded.");
    }

    // 11. Seed Support Tickets
    const ticketCount = await SupportTicket.countDocuments();
    if (ticketCount === 0 && demoUser) {
      await SupportTicket.create({
        ticketId: "TICK-9841",
        user: demoUser._id,
        userName: demoUser.name,
        customId: demoUser.customId,
        userEmail: demoUser.email,
        subject: "USDT TRC20 Deposit Confirmation Query",
        category: "Deposit & Funding",
        priority: "High",
        status: "Resolved",
        messages: [
          {
            sender: "user",
            senderName: demoUser.name,
            text: "I have deposited 1,000 USDT on TRC20 network. Please verify transaction reference #0x99281a...",
            time: "02:30 PM",
          },
          {
            sender: "admin",
            senderName: "VIP Helpdesk Agent",
            text: "Your deposit of $1,000 USDT has been verified and credited directly to your deposit wallet.",
            time: "02:34 PM",
          },
        ],
        lastUpdated: "Just now",
      });
      console.log("Default Support Ticket seeded.");
    }
  } catch (error) {
    console.error("Seeder Error:", error.message);
  }
};

module.exports = seedInitialData;
