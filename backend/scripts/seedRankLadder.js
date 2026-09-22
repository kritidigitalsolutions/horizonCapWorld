require('dotenv').config();
const connectDB = require('../configs/db');
const Rank = require('../models/Rank');

const RANK_LADDER_DATA = [
  {
    level: 1,
    name: "Associate",
    ownDeposit: 50,
    totalClientDeposit: 5000,
    minInvest: 5000,
    reward: 100,
    condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )",
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
    condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )",
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
    condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )",
    companyProfitSharing: "0",
    downlineStructureRequired: "3 Active Direct Clients  ( Min. 1 Associate )",
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
    condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )",
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
    condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )",
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
    condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )",
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
    condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )",
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
    reward: 30000,
    condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )",
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
    reward: 50000,
    condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )",
    companyProfitSharing: "1% of the Total Company Profit + 3000$ Per Month Salary",
    downlineStructureRequired: "10 Active Direct Clients ( Min. 2 Diamonds )",
    achievers: 11,
    desc: "Apex global ambassador commanding global network volume.",
    status: "Active",
  },
  {
    level: 10,
    name: "Titan",
    ownDeposit: 0,
    totalClientDeposit: 5000000,
    minInvest: 5000000,
    reward: 250000,
    condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )",
    companyProfitSharing: "1.25% of the Total Company Profit + 5000$ Per Month Salary",
    downlineStructureRequired: "15 Active Direct Clients ( Min. 2 Crown Diamond )",
    achievers: 5,
    desc: "Titan council leader commanding multi-million network turnover.",
    status: "Active",
  },
  {
    level: 11,
    name: "Crown Titan",
    ownDeposit: 0,
    totalClientDeposit: 10000000,
    minInvest: 10000000,
    reward: 500000,
    condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )",
    companyProfitSharing: "1.50% of the Total Company Profit + 7500$ Per Month Salary",
    downlineStructureRequired: "20 Active Direct Clients ( Min. 2 Global Ambassador )",
    achievers: 2,
    desc: "Crown titan executive with premier corporate profit share.",
    status: "Active",
  },
  {
    level: 12,
    name: "Global Titan",
    ownDeposit: 0,
    totalClientDeposit: 25000000,
    minInvest: 25000000,
    reward: 1250000,
    condition: "Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )",
    companyProfitSharing: "2% of the Total Company Profit + 10000$ Per Month Salary",
    downlineStructureRequired: "25 Active Direct Clients ( Min. 2 Titan )",
    achievers: 1,
    desc: "Pinnacle global titan summit leader commanding worldwide operations.",
    status: "Active",
  },
];

async function seedRankLadder() {
  try {
    await connectDB();
    console.log('[Seed] Connected to MongoDB');

    for (const item of RANK_LADDER_DATA) {
      const updated = await Rank.findOneAndUpdate(
        { level: item.level },
        { $set: item },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(
        `[Seed] Level ${updated.level} (${updated.name}) synced: Own Deposit $${updated.ownDeposit}, Client Deposit $${updated.totalClientDeposit}, Reward $${updated.reward}, Profit Sharing: "${updated.companyProfitSharing}", Downline: "${updated.downlineStructureRequired}"`
      );
    }

    const totalCount = await Rank.countDocuments();
    console.log(`[Seed] Successfully seeded all 12 Rank Ladder tiers. Total in database: ${totalCount}`);
    process.exit(0);
  } catch (err) {
    console.error('[Seed] Error seeding Rank Ladder:', err);
    process.exit(1);
  }
}

seedRankLadder();
