// ===== USER MOCK DATA (SYNCHRONIZED WITH SUPER ADMIN) =====

export const investmentPlans = [
  {
    id: 1,
    name: 'Solar Eco Farm Yield',
    category: 'Renewable Energy',
    roi: '18%',
    roiNumeric: 18,
    roiPerSec: '$0.000057 / sec',
    duration: '12 Months',
    durationDays: 365,
    minAmount: '$1,000',
    minAmountNumeric: 1000,
    maxAmount: '$50,000',
    maxAmountNumeric: 50000,
    payoutInterval: 'Per Second (Live)',
    status: 'Active',
    investors: 428,
  },
  {
    id: 2,
    name: 'Physical Gold Bullion Vault',
    category: 'Precious Metal',
    roi: '14%',
    roiNumeric: 14,
    roiPerSec: '$0.000044 / sec',
    duration: '6 Months',
    durationDays: 180,
    minAmount: '$5,000',
    minAmountNumeric: 5000,
    maxAmount: '$150,000',
    maxAmountNumeric: 150000,
    payoutInterval: 'Daily Payout',
    status: 'Active',
    investors: 312,
  },
  {
    id: 3,
    name: 'Wind Turbine Clean Power',
    category: 'Renewable Energy',
    roi: '22%',
    roiNumeric: 22,
    roiPerSec: '$0.000070 / sec',
    duration: '24 Months',
    durationDays: 730,
    minAmount: '$10,000',
    minAmountNumeric: 10000,
    maxAmount: '$500,000',
    maxAmountNumeric: 500000,
    payoutInterval: 'Daily Payout',
    status: 'Active',
    investors: 185,
  },
  {
    id: 4,
    name: 'Platinum Reserve Vault',
    category: 'Precious Metal',
    roi: '26%',
    roiNumeric: 26,
    roiPerSec: '$0.000082 / sec',
    duration: '18 Months',
    durationDays: 540,
    minAmount: '$25,000',
    minAmountNumeric: 25000,
    maxAmount: '$1,000,000',
    maxAmountNumeric: 1000000,
    payoutInterval: 'Per Second (Live)',
    status: 'Active',
    investors: 94,
  },
  {
    id: 5,
    name: 'Green Hydrogen Catalyst',
    category: 'Renewable Energy',
    roi: '12%',
    roiNumeric: 12,
    roiPerSec: '$0.000038 / sec',
    duration: '3 Months',
    durationDays: 90,
    minAmount: '$500',
    minAmountNumeric: 500,
    maxAmount: '$20,000',
    maxAmountNumeric: 20000,
    payoutInterval: 'Per Second (Live)',
    status: 'Active',
    investors: 560,
  },
];

export const ranks = [
  { level: 1, name: 'Starter', icon: 'star', minReferrals: 0, minTurnover: 0, reward: 0, color: '#94a3b8' },
  { level: 2, name: 'Bronze', icon: 'medal', minReferrals: 5, minTurnover: 1000, reward: 50, color: '#cd7f32' },
  { level: 3, name: 'Silver', icon: 'shield', minReferrals: 15, minTurnover: 5000, reward: 200, color: '#c0c0c0' },
  { level: 4, name: 'Gold', icon: 'trophy', minReferrals: 30, minTurnover: 15000, reward: 500, color: '#FFD700' },
  { level: 5, name: 'Platinum', icon: 'crown', minReferrals: 50, minTurnover: 50000, reward: 1500, color: '#e5e4e2' },
  { level: 6, name: 'Diamond', icon: 'gem', minReferrals: 100, minTurnover: 150000, reward: 5000, color: '#b9f2ff' },
  { level: 7, name: 'Royal', icon: 'crown', minReferrals: 200, minTurnover: 500000, reward: 15000, color: '#8b5cf6' },
  { level: 8, name: 'Ambassador', icon: 'globe', minReferrals: 350, minTurnover: 1000000, reward: 35000, color: '#06b6d4' },
  { level: 9, name: 'Crown Elite', icon: 'crown', minReferrals: 500, minTurnover: 2500000, reward: 75000, color: '#ec4899' },
  { level: 10, name: 'Titan', icon: 'fire', minReferrals: 1000, minTurnover: 5000000, reward: 200000, color: '#ef4444' },
];

export const referralTiers = [
  { level: 1, label: 'Level 1 (Direct)', commission: 8.0 },
  { level: 2, label: 'Level 2', commission: 3.0 },
  { level: 3, label: 'Level 3', commission: 2.0 },
  { level: 4, label: 'Level 4', commission: 1.0 },
  { level: 5, label: 'Level 5', commission: 0.5 },
];

export const userTransactions = [
  { id: 'TXN-78432', type: 'Deposit', amount: 1000, gateway: 'USDT TRC20', status: 'Completed', date: '2026-08-20 14:32' },
  { id: 'TXN-78431', type: 'ROI Earning', amount: 16.20, gateway: 'System', status: 'Completed', date: '2026-08-20 12:00' },
  { id: 'TXN-78430', type: 'Referral Bonus', amount: 80.00, gateway: 'System', status: 'Completed', date: '2026-08-19 18:45' },
  { id: 'TXN-78429', type: 'Withdrawal', amount: 500, gateway: 'Bank Transfer', status: 'Pending', date: '2026-08-19 10:20' },
  { id: 'TXN-78428', type: 'Deposit', amount: 2500, gateway: 'BTC', status: 'Completed', date: '2026-08-18 09:15' },
  { id: 'TXN-78427', type: 'ROI Earning', amount: 40.50, gateway: 'System', status: 'Completed', date: '2026-08-18 12:00' },
  { id: 'TXN-78426', type: 'Rank Bonus', amount: 200, gateway: 'System', status: 'Completed', date: '2026-08-17 00:00' },
  { id: 'TXN-78425', type: 'Withdrawal', amount: 300, gateway: 'USDT TRC20', status: 'Completed', date: '2026-08-16 16:30' },
  { id: 'TXN-78424', type: 'Deposit', amount: 500, gateway: 'SOL', status: 'Completed', date: '2026-08-15 11:00' },
  { id: 'TXN-78423', type: 'ROI Earning', amount: 8.10, gateway: 'System', status: 'Completed', date: '2026-08-15 12:00' },
];

export const userInvestments = [
  { id: 'INV-001', planName: 'Solar Eco Farm Yield', planId: 1, amount: 1000, roi: 18, dailyEarning: 16.20, totalEarned: 243.00, startDate: '2026-08-05', endDate: '2027-08-05', daysRemaining: 350, status: 'Active' },
  { id: 'INV-002', planName: 'Physical Gold Bullion Vault', amount: 5000, planId: 2, roi: 14, dailyEarning: 52.50, totalEarned: 787.50, startDate: '2026-07-20', endDate: '2027-01-20', daysRemaining: 150, status: 'Active' },
  { id: 'INV-003', planName: 'Green Hydrogen Catalyst', amount: 500, planId: 5, roi: 12, dailyEarning: 7.25, totalEarned: 362.50, startDate: '2026-05-10', endDate: '2026-08-10', daysRemaining: 0, status: 'Completed' },
];

export const referralNetwork = [
  { id: 'HORIZON-USR-14', name: 'Aman Verma', email: 'aman@email.com', phone: '+91 98765 43210', level: 1, sponsor: 'HORIZON-USR-07', directRefs: 12, invested: 2000, teamVolume: 45000, directComm: 100, multiTierComm: 180, totalComm: 280, joined: '2026-08-10', status: 'Active' },
  { id: 'HORIZON-USR-22', name: 'Priya Singh', email: 'priya@email.com', phone: '+91 98123 45678', level: 1, sponsor: 'HORIZON-USR-07', directRefs: 18, invested: 5000, teamVolume: 120000, directComm: 250, multiTierComm: 480, totalComm: 730, joined: '2026-08-12', status: 'Active' },
  { id: 'HORIZON-USR-33', name: 'Rahul Gupta', email: 'rahul@email.com', phone: '+91 97654 32109', level: 1, sponsor: 'HORIZON-USR-07', directRefs: 8, invested: 1000, teamVolume: 28000, directComm: 50, multiTierComm: 110, totalComm: 160, joined: '2026-08-14', status: 'Active' },
  { id: 'HORIZON-USR-41', name: 'Sneha Patel', email: 'sneha@email.com', phone: '+91 96543 21098', level: 2, sponsor: 'HORIZON-USR-14', directRefs: 14, invested: 3000, teamVolume: 85000, directComm: 120, multiTierComm: 340, totalComm: 460, joined: '2026-08-15', status: 'Active' },
  { id: 'HORIZON-USR-48', name: 'Karan Mehta', email: 'karan@email.com', phone: '+91 95432 10987', level: 2, sponsor: 'HORIZON-USR-22', directRefs: 6, invested: 750, teamVolume: 15000, directComm: 30, multiTierComm: 60, totalComm: 90, joined: '2026-08-16', status: 'Active' },
  { id: 'HORIZON-USR-55', name: 'Anita Sharma', email: 'anita@email.com', phone: '+91 94321 09876', level: 3, sponsor: 'HORIZON-USR-41', directRefs: 9, invested: 1500, teamVolume: 32000, directComm: 45, multiTierComm: 95, totalComm: 140, joined: '2026-08-17', status: 'Active' },
  { id: 'HORIZON-USR-61', name: 'Vikram Joshi', email: 'vikram@email.com', phone: '+91 93210 98765', level: 3, sponsor: 'HORIZON-USR-41', directRefs: 4, invested: 2500, teamVolume: 18000, directComm: 75, multiTierComm: 50, totalComm: 125, joined: '2026-08-18', status: 'Inactive' },
];

export const quickLinks = [
  { path: '/plans', label: 'Plans', color: '#10b981', bgColor: '#ecfdf5' },
  { path: '/investments', label: 'Investments', color: '#3b82f6', bgColor: '#eff6ff' },
  { path: '/deposit', label: 'Deposit', color: '#8b5cf6', bgColor: '#f5f3ff' },
  { path: '/withdraw', label: 'Withdraw', color: '#f59e0b', bgColor: '#fffbeb' },
  { path: '/referrals', label: 'Referrals', color: '#ec4899', bgColor: '#fdf2f8' },
  { path: '/ranks', label: 'Ranks', color: '#6366f1', bgColor: '#eef2ff' },
  { path: '/transactions', label: 'History', color: '#14b8a6', bgColor: '#f0fdfa' },
  { path: '/referral-plans', label: 'Referral Plans', color: '#06b6d4', bgColor: '#ecfeff' },
  { path: '/profile', label: 'Profile', color: '#84cc16', bgColor: '#f7fee7' },
  { path: '/support', label: 'Support', color: '#eab308', bgColor: '#fefce8' },
];

export const supportCategories = [
  'Investment', 'Deposit Issue', 'Withdrawal Issue', 'Referral Commission',
  'Account Verification', 'Technical Support', 'Other Query'
];

export const countries = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'United Arab Emirates', 'Singapore', 'Germany', 'France', 'Japan',
  'South Africa', 'Brazil', 'Nigeria', 'Pakistan', 'Bangladesh'
];

export const newsArticles = [
  {
    id: 'art-1',
    title: 'Horizon Cap Worlds Expands 500MW Solar Eco Farm in Arizona Desert',
    subtitle: 'Strategic clean-energy infrastructure acquisition boosts investor daily yield off-take rates by +2.4%',
    bannerUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?q=80&w=1200&auto=format&fit=crop',
    category: 'Renewable Energy',
    authorName: 'Alexander Vance',
    authorRole: 'Chief Investment Officer',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    publishDate: '2026-08-18',
    readTime: '4 min read',
    status: 'Published',
    views: 14820,
    tags: ['Solar', 'RenewableEnergy', 'Infrastructure', 'YieldGrowth'],
    content: `## Strategic Infrastructure Acquisition & Off-Take Expansion

Horizon Cap Worlds is proud to announce the successful financial close and phase-one grid interconnection of our **500MW Mojave Sun Solar Array** located across 2,400 acres in the Mojave Valley, Arizona.

> "This clean-energy asset milestone secures an 18-year guaranteed power purchase agreement with municipal utility partners, directly stabilizing our automated per-second yield engine." — *Alexander Vance, CIO*

### Key Strategic Highlights & Capacity Metrics:
- **Total Power Generation**: 500 MegaWatts Peak (MWp) utilizing next-generation bifacial monocrystalline photovoltaic cells.
- **Contracted Power Purchase Agreement (PPA)**: 18-year tier-1 utility escrow backing.
- **Estimated Annual Yield Distribution**: +$42,800,000 in gross institutional off-take dividends.
- **Environmental Impact Offset**: 780,000 metric tons of carbon emissions avoided annually.

### What This Means For Horizon Platform Investors:
Starting this fiscal quarter, daily streaming ROI yields for all active **Solar Eco Farm Yield** plans will reflect the augmented power generation revenue. All distributions continue to be streamed directly to investor Earning Wallets in real-time.`
  },
  {
    id: 'art-2',
    title: 'Physical Gold & Platinum Bullion Vaults Complete Q3 Institutional Escrow Audit',
    subtitle: 'Independent third-party verification confirms 100% physically allocated reserves in Zurich & Singapore',
    bannerUrl: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?q=80&w=1200&auto=format&fit=crop',
    category: 'Precious Metals',
    authorName: 'Marcus Sterling',
    authorRole: 'Head of Bullion Custody',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
    publishDate: '2026-08-15',
    readTime: '5 min read',
    status: 'Published',
    views: 19450,
    tags: ['GoldBullion', 'PlatinumVault', 'EscrowAudit', 'Zurich'],
    content: `## 100% Allocated Bullion Reserves Confirmed by Independent Custodians

We are pleased to publish the official **Q3 2026 Bullion Verification Report** conducted by Swiss Vault Auditing Partners AG across our high-security depositories in **Zurich, Switzerland** and **Le Freeport, Singapore**.

> "Every single gram of physical gold and platinum bullion backing our investor capital is 100% physically vaulted, individually bar-coded, and insured up to $500,000,000." — *Marcus Sterling, Head of Custody*

### Audit Summary & Verified Holdings:
- **Physical Gold Bullion (999.9 Fine)**: 14,850 Troy Ounces across certified London Good Delivery bars.
- **Physical Platinum Reserve Bullion**: 6,200 Troy Ounces held in climate-controlled Swiss vaults.
- **Reserve Ratio**: 104.8% (fully collateralized with capital buffer).
- **Insurance Underwriting**: Underwritten by Lloyd’s of London syndicate underwriters.

### Complete Transparency for All Tokenized Plans:
Investors enrolled in the **Physical Gold Bullion Vault** and **Platinum Reserve Vault** plans can download the certified PDF audit ledger with serial numbers directly from the investor dashboard.`
  },
  {
    id: 'art-3',
    title: 'Wind Turbine Clean Power Phase II Interconnected with Multi-National Smart Grid',
    subtitle: 'North Sea offshore wind assets reach 100% operational throughput generating record off-take rewards',
    bannerUrl: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?q=80&w=1200&auto=format&fit=crop',
    category: 'Renewable Energy',
    authorName: 'Elena Rostova',
    authorRole: 'Director of Clean Infrastructure',
    authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop',
    publishDate: '2026-08-12',
    readTime: '3 min read',
    status: 'Published',
    views: 11200,
    tags: ['WindEnergy', 'OffshorePower', 'SmartGrid', 'GreenROI'],
    content: `## Phase II North Sea Clean Power Interconnection Online

Horizon Cap Worlds infrastructure portfolio has successfully linked all 48 offshore wind turbine units in the North Sea Phase II initiative to the continental European smart grid.

> "Generating 340MW of clean electricity under variable high-wind velocity channels, this deployment marks our largest sovereign green energy footprint to date." — *Elena Rostova*

### Operational Parameters:
- **Turbine Count**: 48 High-Efficiency 8.5MW Siemens Gamesa offshore turbines.
- **Uptime Reliability**: 99.94% over the last 90 days.
- **Average Capacity Factor**: 54.2% (exceeding standard European benchmarks).

Platform participants in the **Wind Turbine Clean Power (24 Months)** plan will observe maximum projected daily returns credited every 24 hours.`
  },
  {
    id: 'art-4',
    title: 'Introducing the 5-Tier Affiliate Partner Network & Leadership Milestone Ladder',
    subtitle: 'Empowering global network leaders with instant turnover bonuses, multi-level rewards and cash milestones',
    bannerUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1200&auto=format&fit=crop',
    category: 'Company',
    authorName: 'Horizon Executive Desk',
    authorRole: 'Community & Growth',
    authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
    publishDate: '2026-08-08',
    readTime: '4 min read',
    status: 'Published',
    views: 26800,
    tags: ['AffiliateNetwork', 'RankLadder', 'Leadership', 'Commissions'],
    content: `## Unlock 5-Tier Commissions and Up to $7,500 in Direct Rank Cash Bonuses

We are thrilled to officially unveil our expanded **5-Tier Affiliate Partner Network** and **Rank Progression Ladder** designed to recognize and reward exceptional promoter leaders worldwide.

> "Our leadership model distributes up to 14% across 5 tiers of downline activity, providing recurring passive yield on every plan activated." — *Executive Desk*

### 5-Tier Commission Structure:
- **Level 1 (Direct Referrals)**: 5% Direct Cash Commission
- **Level 2 (Tier 2 Downline)**: 3% Team Volume Bonus
- **Level 3 (Tier 3 Downline)**: 2% Team Volume Bonus
- **Level 4 (Tier 4 Downline)**: 2% Team Volume Bonus
- **Level 5 (Tier 5 Downline)**: 2% Leadership Dividend

### Rank Milestones & Cash Unlocks:
Promoters who build active downline volume automatically climb from **Genesis (Level 1)** up to **Crown Ambassador (Level 6)**, unlocking cash bonus rewards credited instantly to their Earning Wallet.`
  },
  {
    id: 'art-5',
    title: 'Global Escrow & 256-Bit Cold Transport Security Upgrade Successfully Deployed',
    subtitle: 'Zero-downtime security patch upgrades multi-signature wallet verification and Email 2FA OTP safeguards',
    bannerUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop',
    category: 'Update',
    authorName: 'DevOps & Security Guild',
    authorRole: 'Infrastructure Security',
    authorAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=200&auto=format&fit=crop',
    publishDate: '2026-08-04',
    readTime: '3 min read',
    status: 'Published',
    views: 17300,
    tags: ['Security', '2FA', 'ColdStorage', 'EscrowProtection'],
    content: `## Institutional Grade 256-Bit Encryption & Multi-Sig Cold Storage

In our continued commitment to safeguarding client capital and sensitive identity credentials, Horizon Cap Worlds engineering team has successfully rolled out **Protocol Patch v4.8**.

### Key Security Enhancements:
- **Email 2-Factor Authentication (2FA)**: Mandatory 6-digit OTP verification on all sensitive account updates and login requests.
- **Hardware Security Modules (HSM)**: Multi-signature withdrawal authorization requiring 3-of-5 threshold approvals.
- **Continuous Penetration Auditing**: Automated weekly security audits to prevent unauthorized intrusion.

No action is required by investors. Your accounts and wallet assets remain 100% secure and insulated from external vulnerabilities.`
  }
];
