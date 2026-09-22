# 📖 Horizon Capital - Business Logic & Calculation Guide
> **Complete Documentation**: ROI Models, Investment Modes, Live Yield Streaming, Affiliate Commissions, Loyalty Bonuses, Single ID Withdrawal Caps & Rank Progression Ladder.

---

## 📑 Table of Contents (विषय सूची)
1. [Overview & Financial Core (प्रोजेक्ट ओवरव्यू और वॉलेट स्ट्रक्चर)](#1-overview--financial-core)
2. [ROI Calculation Model & The 2 Contract Modes (दोनों टाइप के इन्वेस्टमेंट मोड्स)](#2-roi-calculation-model--the-2-contract-modes)
   - [Mode 1: Without Lock-In Period (0.3% Daily)](#mode-1-without-lock-in-period-03-daily)
   - [Mode 2: Cap is 3X approx. 333 Days (0.9% Daily)](#mode-2-cap-is-3x-approx-333-days-09-daily)
   - [Auto-Renewal Incentive (+0.25% Monthly Boost)](#auto-renewal-incentive-025-monthly-boost)
   - [Admin Models: Slabs vs Fixed ROI](#admin-models-slabs-vs-fixed-roi)
3. [Real-Time Yield Streaming Engine (प्रति-सेकंड प्रॉफिट कैसे स्ट्रीम होता है)](#3-real-time-yield-streaming-engine)
4. [Loyalty Bonus & Withdrawal Rules (लॉयल्टी बोनस और 4X विदड्रॉल कैप)](#4-loyalty-bonus--withdrawal-rules)
   - [Loyalty Bonus Schedule](#loyalty-bonus-schedule)
   - [Single ID Maximum Withdrawal Rule (4X Cap)](#single-id-maximum-withdrawal-rule-4x-cap)
5. [Affiliate & Multi-Tier Referral System (कमीशन और रेफरल लॉजिक)](#5-affiliate--multi-tier-referral-system)
   - [Part A: 1st Investment Deposit Commission (11 Tiers)](#part-a-1st-investment-deposit-commission-11-tiers)
   - [Part B: Daily ROI Profit Share (Level ROI System)](#part-b-daily-roi-profit-share-level-roi-system)
6. [Rank Progression Ladder (रैंक लैडर और लीडरशिप रिवार्ड्स)](#6-rank-progression-ladder)
   - [40% Leg Rule & Downline Structure](#40-leg-rule--downline-structure)
   - [Complete 9-Tier Rank Table](#complete-9-tier-rank-table)
7. [Step-by-Step Investor Simulation: $100 Investment Example (प्रैक्टिकल उदाहरण)](#7-step-by-step-investor-simulation-100-investment-example)

---

## 1. Overview & Financial Core

Platform mein do mukhya wallets hote hain jo user ke fund flow ko separate rakhte hain:

```
                  ┌───────────────────────────────┐
                  │  External Payment Gateways   │
                  │   (Crypto USDT, Bank, etc.)   │
                  └──────────────┬────────────────┘
                                 │ Deposit
                                 ▼
                     ┌───────────────────────┐
                     │    Deposit Wallet     │ ◄─── Capital add hota hai
                     └───────────┬───────────┘
                                 │
                 Investment Active karne par deduct hota hai
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │ Active UserInvestment │ ◄─── Per-second yield generate karta hai
                     └───────────┬───────────┘
                                 │
               Daily Yield / ROI + Referral Bonuses + Rewards
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │    Earning Wallet     │ ◄─── Instant Withdrawal ke liye ready
                     └───────────┬───────────┘
                                 │ Withdrawal Request
                                 ▼
                  ┌───────────────────────────────┐
                  │   User's External Crypto/Bank │
                  └───────────────────────────────┘
```

- **Deposit Wallet**: User jab deposit karta hai, funds yahan aate hain. Is wallet se sirf **Investment Contracts** buy/activate kiye ja sakte hain.
- **Earning Wallet**: Saare daily streaming profits, referral commissions, rank rewards aur loyalty bonuses direct is wallet mein credit hote hain. Isse user **Instant Withdrawal** le sakta hai (Minimum withdrawal: **$5**).
- **Total Invested**: User ke dwara active kiye gaye sabhi contracts ka sum ($).

---

## 2. ROI Calculation Model & The 2 Contract Modes

Admin Dashboard mein har investment plan (jaise *Precious Metal Growth Fund*, *Renewable Energy Growth Fund*) ke andar **ROI Calculation Model** configure hota hai. 

Jab koi user plan choose karke invest karta hai, to use **2 Contract Modes (Plans)** ka option milta hai:

---

### Mode 1: Without Lock-In Period (0.3% Daily)
Yeh mode un investors ke liye hai jo **capital flexibility** chahte hain aur long-term contract mein bandhna nahi chahte.

- **Daily ROI Rate**: **0.30% per day**
- **Monthly Return**: `0.30% × 30 = 9.0% per month`
- **Annual Return**: `0.30% × 365 = 109.5% per year`
- **Lock-in Condition**: 🔓 **Koi Lock-in Period nahi hota**. Capital platform rules ke mutabiq flexible rehta hai.
- **Duration**: Continuous / Open duration jab tak contract active rahe.

#### $100 Investment Calculation (Mode 1):
- **Rozana Profit (Daily)**: `$100 × 0.30%` = **$0.30 / din**
- **Weekly Profit (7 din)**: `$0.30 × 7` = **$2.10**
- **Monthly Profit (30 din)**: `$0.30 × 30` = **$9.00**
- **Yearly Profit (365 din)**: `$0.30 × 365` = **$109.50**

---

### Mode 2: Cap is 3X approx. 333 Days (0.9% Daily)
Yeh mode un investors ke liye hai jo **maximum returns (3X Net Profit)** chahte hain.

- **Daily ROI Rate**: **0.90% per day** *(Mode 1 se poora 3 guna zyada!)*
- **Monthly Return**: `0.90% × 30 = 27.0% per month`
- **Duration**: **Approx. 333 Days**
- **Total Cap Target**: **3X Net Profit (300% ROI)**
  $$\text{Days to reach 3X} = \frac{300\%}{0.9\% \text{ per day}} = 333.33 \text{ Days}$$
- **Lock-in Condition**: 🔒 Capital **333 din** (ya jab tak 3X profit deliver na ho) locked rehta hai.
- **Contract Completion**: Jaise hi 333 din mein 300% (3X) profit deliver ho jata hai, contract **Completed** mark ho jata hai.

#### $100 Investment Calculation (Mode 2):
- **Rozana Profit (Daily)**: `$100 × 0.90%` = **$0.90 / din**
- **Weekly Profit (7 din)**: `$0.90 × 7` = **$6.30**
- **Monthly Profit (30 din)**: `$0.90 × 30` = **$27.00**
- **Total 333 Days Profit**: `333 din × $0.90` = **$299.70 ≈ $300.00 (3X Profit)**
- **Total Return Maturity**: `$100 (Capital) + $300 (Net Profit) = $400.00 (4X Total Return)`

---

### Auto-Renewal Incentive (+0.25% Monthly Boost)
User Dashboard mein invest karte waqt ek **Auto-Renewal** toggle switch hota hai:
- **Agar Auto-Renewal OFF hai**: Base rate apply hota hai (0.3% ya 0.9% daily).
- **Agar Auto-Renewal ON hai**:
  - Investor ko har mahine **+0.25% extra monthly ROI** milta hai.
  - Daily rate mein addition: `+ (0.25% / 30) = +0.00833% daily`.
  - Mode 1 ka rate ban jata hai: `0.30833% / day`.
  - Mode 2 ka rate ban jata hai: `0.90833% / day`.
  - Monthly returns capital wallet mein auto-reinvest/compound hote hain.

---

### Admin Models: Slabs vs Fixed ROI
Admin panel mein do models available hain:
1. **Amount-Wise Daily ROI Slabs (Active)**:
   - Slabs ke hisaab se rate tay hota hai.
   - Example: `$10 – Any Amount`: Without Lock-in `0.3%`, Cap 3X `0.9%`.
   - Agar admin chahe to amount ke multiple slabs bana sakta hai (e.g. $10-$500, $501-$2000, etc.).
2. **% Fixed ROI Percentage**:
   - Flat fixed rate system. Amount chahe $10 ho ya $50,000, sabhi ko ek hi flat percentage milta hai (e.g. 0.5% daily).

---

## 3. Real-Time Yield Streaming Engine

Horizon Capital ka core feature **Live Yield Streaming** hai. User ko profit lene ke liye 24 ghante intezaar nahi karna padta, balki dashboard par balance **har second** badhta hua dikhta hai.

### Mathematical Formula:

$$\text{dailyEarning} = \text{Investment Amount} \times \left(\frac{\text{effectiveDailyRoi}}{100}\right)$$

$$\text{perSecondRate} = \frac{\text{dailyEarning}}{86400 \text{ seconds}}$$

### $100 Investment Example:

| Parameter | Mode 1 (Without Lock-in 0.3%) | Mode 2 (Cap 3X 0.9%) |
|:---|:---|:---|
| **Investment Amount** | $100.00 | $100.00 |
| **Daily Earning** | `$100 × 0.003 = $0.30` | `$100 × 0.009 = $0.90` |
| **Per-Second Streaming Rate** | `$0.30 / 86400 = $0.000003472 / sec` | `$0.90 / 86400 = $0.000010417 / sec` |
| **Har 1 Ghante Ka Profit** | `$0.0125` | `$0.0375` |
| **Har 24 Ghante Ka Profit** | `$0.3000` | `$0.9000` |

### Backend Sync Logic (`yieldAndAffiliateEngine.js`):
Jab bhi user dashboard kholta hai ya API call hoti hai:
1. System pichhle sync timestamp (`lastYieldSync`) aur current time ke beech ke elapsed seconds count karta hai:
   $$\Delta t = \text{now} - \text{lastYieldSync} \quad (\text{seconds mein})$$
2. Accrued yield calculate hota hai:
   $$\text{accruedProfit} = \Delta t \times \text{perSecondRate}$$
3. Yeh amount seedha user ke `earningWallet` aur `totalProfit` mein 8 decimal precision ke sath add ho jata hai.

---

## 4. Loyalty Bonus & Withdrawal Rules

### Loyalty Bonus Schedule (Reward on Capital Not Withdrawn)
Agar investor apna original capital account se withdraw nahi karta, to system use milestone days poore hone par **One-Time Direct Wallet Benefit** deta hai:

| Milestone Duration | One-Time Loyalty Bonus % | $100 Investment Par Extra Reward | $1,000 Investment Par Extra Reward |
|:---:|:---:|:---:|:---:|
| **30 Days** | **+0.50%** | **+$0.50** | **+$5.00** |
| **90 Days** | **+1.00%** | **+$1.00** | **+$10.00** |
| **180 Days** | **+3.00%** | **+$3.00** | **+$30.00** |
| **365 Days** | **+5.00%** | **+$5.00** | **+$50.00** |
| **730 Days (2 Years)** | **+10.00%** | **+$10.00** | **+$100.00** |

*Note: Yeh bonus user ke standard daily ROI ke alawa extra reward hai jo seedha wallet mein credit hota hai.*

---

### Single ID Maximum Withdrawal Rule (4X Cap)
- **Rule Definition**: `"3X + Capital Maximum Withdrawal Allowed"`
- **Total Cap**: `1X Capital + 3X Profit = 4X of Total Deposited Capital`
- **Kaise Kaam Karta Hai**:
  - Agar user ne total **$100** invest kiya hai, to us account se lifetime maximum withdrawal limit **$400** hogi.
  - Agar user ne **$1,000** invest kiya hai, to lifetime maximum withdrawal limit **$4,000** hogi.
  - Limit reach hone ke baad withdrawal karne ke liye user ko capital re-invest ya top-up karna padta hai.

---

## 5. Affiliate & Multi-Tier Referral System

Referral system do alag-alag hisson mein divide hai:

### Part A: 1st Investment Deposit Commission (11 Tiers)
Jab koi naya downline client **apna sabse pehla investment** activate karta hai, to uske upline sponsors ko 11 levels tak instant direct bonus distribute hota hai:

> ⚠️ **CRITICAL RULE**: Yeh referral commission investor ke sirf aur sirf **1st Investment (Pehle Investment)** par distribute hota hai. Investor ke subsequent (doosre, teesre) investments par deposit commission repeat nahi hota.

| Downline Tier | Commission % Rate | Agar Downline $100 Invest Kare | Agar Downline $1,000 Invest Kare |
|:---:|:---:|:---:|:---:|
| **Level 1 (Direct Sponsor)** | **5.0%** | **$5.00** | **$50.00** |
| **Level 2** | **4.0%** | **$4.00** | **$40.00** |
| **Level 3** | **3.0%** | **$3.00** | **$30.00** |
| **Level 4** | **2.0%** | **$2.00** | **$20.00** |
| **Level 5** | **1.5%** | **$1.50** | **$15.00** |
| **Level 6** | **1.0%** | **$1.00** | **$10.00** |
| **Level 7** | **0.8%** | **$0.80** | **$8.00** |
| **Level 8** | **0.6%** | **$0.60** | **$6.00** |
| **Level 9** | **0.5%** | **$0.50** | **$5.00** |
| **Level 10** | **0.4%** | **$0.40** | **$4.00** |
| **Level 11** | **0.3%** | **$0.30** | **$3.00** |

---

### Part B: Daily ROI Profit Share (Level ROI System)
Downline members ko rozana jo daily ROI generate hoti hai, us ROI ke profit se upline ko daily percentage share milta hai.

Iske liye **Eligibility Conditions (Group Volume & Direct Clients)** poori honi zaroori hain:

| Level | Level Name | Daily ROI Share % | Eligibility Conditions (Shart) | Group Volume (GV) | Direct Active Clients |
|:---:|:---|:---:|:---|:---:|:---:|
| **L1** | Direct Referrals | **NR (0%)** | NR (Level 1 par 5% upfront deposit bonus milta hai, daily ROI share nahi) | $0 | 0 |
| **L2** | Sub-Referrals | **20%** | **No Condition** | $0 | 0 |
| **L3** | Network Tier | **15%** | GV Min. $1,000 + 2 Direct Clients | $1,000 | 2 Directs |
| **L4** | Network Tier | **10%** | GV Min. $2,000 + 3 Direct Clients | $2,000 | 3 Directs |
| **L5** | Global Depth | **8%** | GV Min. $3,000 + 4 Direct Clients | $3,000 | 4 Directs |
| **L6** | Expansion Tier | **6%** | GV Min. $4,000 + 5 Direct Clients | $4,000 | 5 Directs |
| **L7** | Regional Depth | **5%** | GV Min. $5,000 + 10 Direct Clients | $5,000 | 10 Directs |
| **L8** | Executive Tier | **3%** | GV Min. $10,000 + 11 Direct Clients | $10,000 | 11 Directs |
| **L9** | Leadership Tier | **1%** | GV Min. $15,000 + 11 Direct Clients | $15,000 | 11 Directs |
| **L10** | Ambassador Tier | **1%** | GV Min. $20,000 + 11 Direct Clients | $20,000 | 11 Directs |
| **L11** | Crown Ambassador | **1%** | GV Min. $25,000 + 11 Direct Clients | $25,000 | 11 Directs |

#### Example of Daily ROI Share:
- Level 2 ka downline member rozana **$10 ROI** earn kar raha hai.
- Upline ko Level 2 ka **20% share** = **$2.00 rozana** milega!

---

## 6. Rank Progression Ladder

Platform mein 12 leadership ranks hain. Har rank unlock hone par **One-Time Instant Cash Reward**, **Monthly Salary**, aur **Company Profit Sharing** milti hai.

### Power Leg Rule (Condition):
$$\text{Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% )}$$
- Kam se kam 2 direct referral legs hona anivarya hai.
- 1 Leg Power Leg honi chahiye jisme maximum 60% required client deposit volume count hoga.
- Baaki ka volume doosri legs se aana zaroori hai. Isse genuine network balancing ensure hoti hai.

### Complete 12-Tier Rank Table:

| Level | Rank Name | Own Deposit ($) | Total Client Deposit ($) | Condition | One Time Cash Reward ($) | Company Profit %ge & Salary | Downline Structure Required |
|:---:|:---|:---:|:---:|:---|:---:|:---|:---|
| **1** | **Associate** | $50 | $5,000 | Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% ) | **+$100** | 0 | 2 Active Direct Client |
| **2** | **Senior Associate** | $100 | $10,000 | Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% ) | **+$300** | 0 | 3 Active Direct Clients |
| **3** | **Team Leader** | $250 | $25,000 | Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% ) | **+$875** | 0 | 3 Active Direct Clients ( Min. 1 Associate ) |
| **4** | **Director** | $500 | $50,000 | Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% ) | **+$2,000** | 0 | 4 Active Direct Clients ( Min 2 Sr. Associate ) |
| **5** | **Regional Director** | $1,000 | $100,000 | Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% ) | **+$5,000** | 0 | 4 Active Direct Clients ( Min. 2 Team Leaders ) |
| **6** | **Executive Director** | $1,500 | $200,000 | Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% ) | **+$10,000** | **0.20% of the total company Profit + 500$ Per Month Salary** | 5 Active Direct Clients ( Min. 2 Directors ) |
| **7** | **Diamond** | $2,000 | $300,000 | Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% ) | **+$15,000** | **0.50% of the Total Company Profit + 1000$ Per Month Salary** | 6 Active Direct Clients ( Min. 2 Regional Directors ) |
| **8** | **Crown Diamond** | $3,000 | $600,000 | Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% ) | **+$30,000** | **0.75% of the Total Company Profit + 1500$ Per Month Salary** | 8 Active Direct Clients ( Min. 2 Executive Directors ) |
| **9** | **Global Ambassador** | $5,000 | $1,000,000 | Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% ) | **+$50,000** | **1% of the Total Company Profit + 3000$ Per Month Salary** | 10 Active Direct Clients ( Min. 2 Diamonds ) |
| **10** | **Titan** | $0 | $5,000,000 | Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% ) | **+$250,000** | **1.25% of the Total Company Profit + 5000$ Per Month Salary** | 15 Active Direct Clients ( Min. 2 Crown Diamond ) |
| **11** | **Crown Titan** | $0 | $10,000,000 | Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% ) | **+$500,000** | **1.50% of the Total Company Profit + 7500$ Per Month Salary** | 20 Active Direct Clients ( Min. 2 Global Ambassador ) |
| **12** | **Global Titan** | $0 | $25,000,000 | Atleast 2 Legs should be there , 1 Leg must be Power Leg ( 60% ) | **+$1,250,000** | **2% of the Total Company Profit + 10000$ Per Month Salary** | 25 Active Direct Clients ( Min. 2 Titan ) |

---

## 7. Step-by-Step Investor Simulation: $100 Investment Example

Aaiye ek naye investor **"Rahul"** ka poora cycle dekhein jo **$100 invest** karta hai:

### Step 1: Registration & Deposit
1. Rahul sponsor link se register karta hai (Sponsor: **Amit**).
2. Rahul apne **Deposit Wallet** mein **$100 USDT** deposit karta hai.

### Step 2: Contract Activation
Rahul *Precious Metal Growth Fund* select karta hai aur **Mode 2 (Cap is 3X approx. 333 Days @ 0.9%/day)** choose karta hai:
- Rahul ke Deposit Wallet se `$100` deduct hote hain.
- Active Contract create hota hai:
  - `Amount`: $100
  - `Daily ROI`: 0.90% ($0.90 / din)
  - `Per Second Rate`: $0.000010417 / second
  - `Status`: Active
  - `Duration`: 333 Days (Cap 3X)

### Step 3: Instant Referral Commission Distribution
Kyunki yeh Rahul ka **1st Investment** hai, isiliye backend referral engine trigger hota hai:
- **Amit (Direct Sponsor - Level 1)** ko Rahul ke $100 ka **5% = $5.00** instant cash bonus uske Earning Wallet mein milta hai.
- Amit ke upline (Level 2) ko **4% = $4.00** milta hai.
- Level 3 upline ko **3% = $3.00** milta hai (aur aage Level 11 tak).

### Step 4: Rahul's Daily Earnings & Streaming
- Rahul jab bhi apna dashboard open karega, uska Earning Wallet har second live badhta hua dikhega.
- **Har din 24 ghante baad**: Rahul ke wallet mein **$0.90** jud chuke honge.
- **30 din baad**: Rahul ka total profit **$27.00** ho jayega.
- **30 din par Loyalty Reward**: Kyunki Rahul ne capital withdraw nahi kiya, use **+$0.50 (0.5%)** loyalty reward alag se milega.

### Step 5: Daily ROI Profit Share to Upline
- Rahul ko rozana **$0.90** ROI mil rahi hai.
- Amit (Level 1) ka Daily ROI share: NR (Level 1 par 0% kyunki Amit ko 5% pehle hi mil chuka).
- Amit ke sponsor (Rahul ke Level 2 upline) ko:
  - Rahul ke $0.90 daily profit ka **20% = $0.18 rozana** passive profit share milega!

### Step 6: 333 Days Maturity & Cap Completion
- 333 din poore hone par:
  $$\text{Total Profit Earned} = 333 \times \$0.90 = \$299.70 \approx \$300.00$$
- Total Returns = **$100 (Capital) + $300 (Net Profit) = $400.00**
- Contract 3X cap reach karke successfully **Completed** ho jata hai.
- Single ID rule ke mutabiq Rahul ne poora 4X ($400) withdraw kar liya.

---

## 📌 Quick Formulas Summary Cheat-Sheet

| Logic | Mathematical Formula |
|:---|:---|
| **Daily Earning ($)** | `amount * (dailyRoi / 100)` |
| **Per Second Rate ($/sec)** | `dailyEarning / 86400` |
| **Elapsed Yield Accrual ($)** | `(currentTime - lastYieldSync) * perSecondRate` |
| **3X Cap Duration (Days)** | `300 / lockInDailyRoi` (e.g. `300 / 0.9 = ~333 Days`) |
| **Auto-Renewal Daily Boost** | `effectiveDailyRoi + (0.25 / 30)` |
| **1st Investment Referral Bonus ($)** | `investAmount * (tierRate / 100)` (L1=5%, L2=4%, L3=3%...) |
| **Daily ROI Share ($)** | `downlineDailyRoiAmount * (tierShareRate / 100)` (L2=20%, L3=15%...) |
| **Maximum Account Withdrawal ($)** | `Total Deposited Capital * 4` (3X Profit + 1X Capital) |
| **Rank 40% Leg Max Volume ($)** | `Total Required Client Deposit * 0.40` |

---
*Created and maintained for Horizon Capital World Platform Architecture.*
