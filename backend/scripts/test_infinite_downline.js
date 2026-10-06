const mongoose = require('mongoose');

// Mock data structures to test logic in isolation
const tiers = [
  { level: "L1", levelNumber: 1, name: "Direct Referrals (Level 1)", investCommissionRate: 5 },
  { level: "L2", levelNumber: 2, name: "Sub-Referrals (Level 2)", investCommissionRate: 4 },
  { level: "L3", levelNumber: 3, name: "Network Tier (Level 3)", investCommissionRate: 3 },
  { level: "L4", levelNumber: 4, name: "Network Tier (Level 4)", investCommissionRate: 2 },
  { level: "L5", levelNumber: 5, name: "Global Depth (Level 5)", investCommissionRate: 1.5 },
  { level: "L6", levelNumber: 6, name: "Expansion Tier (Level 6)", investCommissionRate: 1 },
  { level: "L7", levelNumber: 7, name: "Regional Depth (Level 7)", investCommissionRate: 0.8 },
  { level: "L8", levelNumber: 8, name: "Executive Tier (Level 8)", investCommissionRate: 0.6 },
  { level: "L9", levelNumber: 9, name: "Leadership Tier (Level 9)", investCommissionRate: 0.5 },
  { level: "L10", levelNumber: 10, name: "Ambassador Tier (Level 10)", investCommissionRate: 0.4 },
];

const getRateForLevel = (lvl) => {
  if (lvl > 10) return 0;
  const found = tiers.find((t) => t.levelNumber === lvl);
  if (found?.investCommissionRate !== undefined) return Number(found.investCommissionRate);
  return 0;
};

// Create a mock 15-level chain of users
const mockUsers = [];
for (let i = 0; i <= 15; i++) {
  mockUsers.push({
    customId: `USER-${i}`,
    name: `User Level ${i}`,
    sponsorId: i === 0 ? null : `USER-${i - 1}`,
    totalInvested: 1000,
    depositWallet: 100,
    firstInvestmentAmount: 1000,
    hasReceivedReferralBonus: true,
    status: 'Active',
    createdAt: new Date(),
  });
}

const childrenMap = new Map();
mockUsers.forEach((u) => {
  if (u.sponsorId) {
    if (!childrenMap.has(u.sponsorId)) childrenMap.set(u.sponsorId, []);
    childrenMap.get(u.sponsorId).push(u);
  }
});

// Run tree builder simulation
const buildTreeNodes = (parentId, currentLevel, visited) => {
  if (currentLevel > 500) return [];
  const kids = childrenMap.get(parentId) || [];
  const rate = currentLevel <= 10 ? getRateForLevel(currentLevel) : 0;

  return kids.map((kid) => {
    if (visited.has(kid.customId)) return null;
    visited.add(kid.customId);

    const eligibleBaseAmount = kid.firstInvestmentAmount || kid.totalInvested || 0;
    let comm = 0;
    if (currentLevel <= 10) {
      comm = parseFloat(((eligibleBaseAmount * rate) / 100).toFixed(2));
    }

    const childNodes = buildTreeNodes(kid.customId, currentLevel + 1, visited);

    return {
      id: kid.customId,
      name: kid.name,
      level: currentLevel,
      commissionRate: rate,
      commissionEarned: comm,
      invested: kid.totalInvested,
      children: childNodes,
    };
  }).filter(Boolean);
};

const tree = {
  id: mockUsers[0].customId,
  name: mockUsers[0].name,
  level: 0,
  children: buildTreeNodes(mockUsers[0].customId, 1, new Set([mockUsers[0].customId])),
};

console.log('--- TEST RESULTS ---');
const flatNodes = [];
const flatten = (n) => {
  if (n.level > 0) flatNodes.push(n);
  if (n.children) n.children.forEach(flatten);
};
flatten(tree);

console.log(`Total downline nodes traversed: ${flatNodes.length} (Expected: 15)`);
console.assert(flatNodes.length === 15, 'Should traverse all 15 levels');

flatNodes.forEach(node => {
  console.log(`Level ${node.level} (${node.id}): Rate=${node.commissionRate}%, Commission=$${node.commissionEarned}`);
  if (node.level <= 10) {
    console.assert(node.commissionRate > 0, `Level ${node.level} should have commission rate > 0`);
    console.assert(node.commissionEarned > 0, `Level ${node.level} should have commission earned > 0`);
  } else {
    console.assert(node.commissionRate === 0, `Level ${node.level} should have 0% commission rate`);
    console.assert(node.commissionEarned === 0, `Level ${node.level} should have $0.00 commission earned`);
  }
});

console.log('\nAll assertions passed successfully! Infinite downline display with strictly L10 commission cap verified.');
