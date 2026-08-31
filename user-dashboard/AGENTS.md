# Horizon Cap Worlds — User App (Agent Memory)

> **Purpose**: This file is the living memory for the **Horizon Cap Worlds User Platform & Investor Dashboard**. It documents architecture, components, pages, routes, state management, dependencies, patterns, and design decisions. **MUST be updated after every change.**

---

## Project Overview

| Key | Value |
|-----|-------|
| **Project Name** | Horizon Cap Worlds — User Platform |
| **Type** | Investor Dashboard & Wealth Portal |
| **Directory** | `c:\Users\milin\Desktop\horizon of cap\user\` |
| **Framework** | Vite + React 19 |
| **Styling** | Tailwind CSS v3 + Custom Vanilla CSS (White & Gold Light Theme) |
| **Icons** | `react-icons/ri` (Remix Icons) + `@iconscout/react-unicons` (`Uil*`) |
| **Routing** | React Router v7 (`react-router-dom`) with Public & Protected Routes |
| **Fonts** | Poppins (branding & typography), Inter (body), Outfit (headings & numbers) |
| **Theme** | White & Gold Premium Light Theme (`bg-[#FAFAFA]`, `bg-white`, `bg-gold-50`, `border-gold-300`, `text-slate-800`) |
| **State Management** | React Context (`AuthContext`) with `localStorage` persistence |

---

## Dependencies

### Production
| Package | Purpose |
|---------|---------|
| `react` | Core UI library |
| `react-dom` | DOM rendering |
| `react-router-dom` | Client-side routing with protected wrappers |
| `recharts` | Portfolio & Yield Charting |
| `react-icons` | Remix Icons (`Ri*` prefix) |
| `@iconscout/react-unicons` | Unicons (`Uil*` prefix) |

### Dev
| Package | Purpose |
|---------|---------|
| `vite` | Ultra-fast build tool & dev server |
| `tailwindcss` | Utility CSS framework |
| `postcss` | CSS processing |
| `autoprefixer` | CSS vendor prefixes |
| `typescript` | Type checking |

---

## File Structure

```
user/
├── index.html                          # Entry HTML with Poppins, Inter & Outfit fonts
├── package.json                        # Scripts & dependencies
├── vite.config.js                      # Vite config
├── tailwind.config.js                  # White & Gold palette, animations & keyframes
├── postcss.config.js                   # PostCSS plugins
├── tsconfig.json                       # TS build config
├── AGENTS.md                           # THIS FILE — Living memory of User Dashboard
├── DESIGN.md                           # Complete White & Gold design system
├── public/
│   └── admin/
│       ├── icon.png                    # Cropped metallic gold round HC emblem
│       └── logo.png                    # Full logo asset
└── src/
    ├── main.jsx                        # React entry point
    ├── App.jsx                         # Root component with Protected/Public routing
    ├── index.css                       # White & Gold CSS, streaming counter & inputs
    ├── vite-env.d.ts                   # Vite types
    ├── context/
    │   └── AuthContext.jsx             # User auth state, wallet balances, streaming rate & login/register
    ├── data/
    │   └── userMockData.js             # Plans, ranks, transactions, investments & referrals
    ├── components/
    │   └── layout/
    │       ├── UserLayout.jsx          # Shell with white header + responsive sidebar
    │       └── UserSidebar.jsx         # White & Gold 4-section sidebar with mini profile
    └── pages/
        ├── Register.jsx                # /register — Create account matching SunZee1 in White & Gold
        ├── Login.jsx                   # /login — Sign in with Auto-Fill demo credentials
        ├── UserDashboard.jsx           # / — Live streaming ROI ticker & 10 Quick Links in White & Gold
        ├── Plans.jsx                   # /plans — 5 Investment plans with ROI badges
        ├── MyInvestments.jsx           # /investments — Active contracts & progress bars
        ├── Transactions.jsx            # /transactions — Financial ledger with type tabs
        ├── Deposit.jsx                 # /deposit — Crypto & Bank deposit with copy address
        ├── Withdraw.jsx                # /withdraw — Payout request form & balances
        ├── Referrals.jsx               # /referrals — 5-level network tree & link copy
        ├── ReferralPlans.jsx           # /referral-plans — 5-tier commission breakdown
        ├── Ranks.jsx                   # /ranks — 10-tier Rank Ladder & cash rewards
        ├── Profile.jsx                 # /profile — User account credentials & statistics
        └── Support.jsx                 # /support — Tickets desk & WhatsApp/Telegram links
```

---

## Routes & Navigation

| Route | Component | Access | Description |
|-------|-----------|--------|-------------|
| `/register` | `Register.jsx` | Public | Create account with identity, password, contact, and sponsor ID |
| `/login` | `Login.jsx` | Public | Sign in with email and password (with 1-click Demo auto-fill) |
| `/` | `UserDashboard.jsx` | Protected | Live per-second earnings counter (`$0.0000000 /sec`), next payout timer, dual wallets & 10 quick links |
| `/plans` | `Plans.jsx` | Protected | Investment plans with daily ROI, duration, and investment CTA |
| `/investments` | `MyInvestments.jsx` | Protected | Active contracts with animated progress bars & total returns |
| `/transactions` | `Transactions.jsx` | Protected | Tab-filtered financial history with TXN IDs |
| `/deposit` | `Deposit.jsx` | Protected | Deposit gateway (USDT TRC20, BTC, SOL, Bank) with QR code & 1-click address copy |
| `/withdraw` | `Withdraw.jsx` | Protected | Available earnings payout with address/bank field & fee rules |
| `/referrals` | `Referrals.jsx` | Protected | 5-level referral downline tree, referral link generator with copy button |
| `/referral-plans` | `ReferralPlans.jsx` | Protected | 5-tier commission matrix (L1 8%, L2 3%, L3 2%, L4 1%, L5 0.5%) |
| `/ranks` | `Ranks.jsx` | Protected | 10-tier rank progression ladder with instant milestone cash bonuses |
| `/profile` | `Profile.jsx` | Protected | Personal user profile, avatar, and portfolio statistics |
| `/support` | `Support.jsx` | Protected | Support tickets submission form + WhatsApp, Telegram & Email channels |

---

## Change Log

| Date | Change | Files Affected |
|------|--------|---------------|
| 2026-08-20 | Initial build of Horizon Cap Worlds User App | All files in `user/` |
| 2026-08-20 | Converted entire User Platform (11 pages, sidebar, header, auth, and components) to White & Gold Premium light theme matching admin's DESIGN.md | All files in `user/` |

---

*Last Updated: 2026-08-20*
