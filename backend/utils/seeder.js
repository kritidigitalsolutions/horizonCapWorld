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
    const plansCount = await InvestmentPlan.countDocuments();
    if (plansCount === 0) {
      const defaultPlans = [
        {
          name: "Solar Eco Farm Yield",
          category: "Renewable Energy",
          roi: 18,
          duration: "12 Months",
          durationDays: 365,
          minAmount: 1000,
          maxAmount: 50000,
          payoutInterval: "Per Second (Live)",
          status: "Active",
          investors: 428,
          description: "Utility-scale photovoltaic generation farms in high-irradiance desert zones with 25-year sovereign power purchase agreements.",
        },
        {
          name: "Physical Gold Bullion Vault",
          category: "Precious Metal",
          roi: 14,
          duration: "6 Months",
          durationDays: 180,
          minAmount: 5000,
          maxAmount: 150000,
          payoutInterval: "Daily Payout",
          status: "Active",
          investors: 312,
          description: "Allocated 99.99% pure LBMA-certified bullion bars stored in Zurich and Singapore ultra-secure custody facilities.",
        },
        {
          name: "Wind Turbine Clean Power",
          category: "Renewable Energy",
          roi: 22,
          duration: "24 Months",
          durationDays: 730,
          minAmount: 10000,
          maxAmount: 500000,
          payoutInterval: "Daily Payout",
          status: "Active",
          investors: 185,
          description: "Offshore deep-water wind turbine syndicate generating stable institutional cash flows with guaranteed base yields.",
        },
        {
          name: "Platinum Reserve Vault",
          category: "Precious Metal",
          roi: 26,
          duration: "18 Months",
          durationDays: 540,
          minAmount: 25000,
          maxAmount: 1000000,
          payoutInterval: "Per Second (Live)",
          status: "Active",
          investors: 94,
          description: "Institutional physical platinum sponge and ingots insured by Lloyd's of London with monthly third-party audit reports.",
        },
        {
          name: "Green Hydrogen Catalyst",
          category: "Renewable Energy",
          roi: 12,
          duration: "3 Months",
          durationDays: 90,
          minAmount: 500,
          maxAmount: 20000,
          payoutInterval: "Per Second (Live)",
          status: "Active",
          investors: 560,
          description: "Commercial zero-emission electrolyzer clusters producing green hydrogen for industrial maritime transport fleets.",
        },
      ];

      for (const p of defaultPlans) {
        const secRate = ((p.minAmount * (p.roi / 100)) / (365 * 86400)).toFixed(6);
        await InvestmentPlan.create({
          ...p,
          roiPerSec: `$${secRate} / sec`,
        });
      }
      console.log("Default Investment Plans seeded.");
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

    // 5. Seed 5-Tier Referral Commission Settings
    const refCount = await ReferralSetting.countDocuments();
    if (refCount === 0) {
      const defaultRefSettings = [
        { level: "L1", levelNumber: 1, name: "Direct Referrals (Level 1)", investCommission: "5%", investCommissionRate: 5, earningsCommission: "5%", earningsCommissionRate: 5, activePromoters: 3420, totalVolume: "$1,250,000" },
        { level: "L2", levelNumber: 2, name: "Sub-Referrals (Level 2)", investCommission: "4%", investCommissionRate: 4, earningsCommission: "4%", earningsCommissionRate: 4, activePromoters: 2180, totalVolume: "$890,000" },
        { level: "L3", levelNumber: 3, name: "Network Tier (Level 3)", investCommission: "3%", investCommissionRate: 3, earningsCommission: "3%", earningsCommissionRate: 3, activePromoters: 1420, totalVolume: "$520,000" },
        { level: "L4", levelNumber: 4, name: "Network Tier (Level 4)", investCommission: "2%", investCommissionRate: 2, earningsCommission: "2%", earningsCommissionRate: 2, activePromoters: 840, totalVolume: "$310,000" },
        { level: "L5", levelNumber: 5, name: "Global Depth (Level 5)", investCommission: "1%", investCommissionRate: 1, earningsCommission: "1%", earningsCommissionRate: 1, activePromoters: 490, totalVolume: "$185,000" },
      ];
      await ReferralSetting.insertMany(defaultRefSettings);
      console.log("Default 5-Tier Referral Settings seeded.");
    }

    // 6. Seed 10-Tier Rank Ladder
    const rankCount = await Rank.countDocuments();
    if (rankCount === 0) {
      const defaultRanks = [
        { level: 1, name: "Bronze Explorer", minInvest: 100, reward: 7.5, achievers: 4890, desc: "Entry leadership rank unlocked upon team initiation." },
        { level: 2, name: "Silver Vanguard", minInvest: 500, reward: 35, achievers: 2340, desc: "Proven team builder with active direct network." },
        { level: 3, name: "Gold Sovereign", minInvest: 2500, reward: 175, achievers: 1210, desc: "Established regional network promoter." },
        { level: 4, name: "Platinum Luminary", minInvest: 10000, reward: 700, achievers: 680, desc: "Senior network leader commanding high turnover." },
        { level: 5, name: "Sapphire Viceroy", minInvest: 50000, reward: 3500, achievers: 340, desc: "Elite portfolio leader with multi-tier downlines." },
        { level: 6, name: "Emerald Chancellor", minInvest: 150000, reward: 10500, achievers: 160, desc: "Continental executive commanding six-figure volume." },
        { level: 7, name: "Ruby High Commander", minInvest: 500000, reward: 35000, achievers: 72, desc: "Global leadership council member." },
        { level: 8, name: "Diamond Archon", minInvest: 1500000, reward: 105000, achievers: 28, desc: "Institutional syndicate director." },
        { level: 9, name: "Crown Imperator", minInvest: 5000000, reward: 350000, achievers: 11, desc: "Supreme network architect with multi-million turnover." },
        { level: 10, name: "Apex Zenith Titan", minInvest: 10000000, reward: 700000, achievers: 8, desc: "Pinnacle summit partner with permanent revenue share." },
      ];
      await Rank.insertMany(defaultRanks);
      console.log("Default 10-Tier Rank Ladder seeded.");
    }

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
