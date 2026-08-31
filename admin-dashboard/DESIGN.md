# Horizon of Capital — Design System

> **Purpose**: Complete design system documentation — colors, typography, spacing, components, patterns, and responsive rules. **MUST be updated when any design change is made.**

---

## Brand Identity

| Property | Value |
|----------|-------|
| **Brand Name** | Horizon of Capital |
| **Abbreviation** | HC |
| **Theme** | White & Gold Premium |
| **Mood** | Luxury, Trust, Professional, Modern |
| **Logo** | Gold gradient rounded square with "HC" white text |

## Strict Architectural & Aesthetic Rules (MANDATORY)

1. **ZERO EMOJI POLICY — NEVER USE EMOJIS UNDER ANY CIRCUMSTANCES**:
   - Emojis (e.g. 🏆, 🤝, 👑, 🧮, 🪙, 📱, 🇮🇳, 🌐, 💳, ⚡, 🎉, 💡, ℹ️) are STRICTLY FORBIDDEN across all UI components, buttons, tabs, drawers, cards, and labels.
   - ALWAYS use pure SVG icons from `react-icons/ri` (Remix Icons) or `@iconscout/react-unicons` (`Uil*`).
2. **NO DARK COLOR BACKGROUNDS**:
   - Dark gray or black containers (such as `bg-slate-900`, `bg-gray-900`, `bg-black`) must NEVER be used in cards, drawers, boxes, or summaries.
   - Always maintain the crisp, luxurious **White & Gold Light Theme** (`bg-white`, `bg-gold-50`, `bg-slate-50`, `border-gold-300`, `text-slate-800`).
3. **SEPARATE RANK & REFERRAL PAGES**:
   - `/ranks` -> Rank Progression Ladder & Achievers (`Ranks.jsx`)
   - `/referrals` -> Referral Plans & Multi-Level Commissions (`Referrals.jsx`)

---

## Color Palette

### Primary — Gold
| Token | Hex | Tailwind Class | Usage |
|-------|-----|----------------|-------|
| `gold-50` | `#FFF9E6` | `bg-gold-50` | Light backgrounds, hover states |
| `gold-100` | `#FFF0B3` | `bg-gold-100` | Soft accents, selected backgrounds |
| `gold-200` | `#FFE066` | `bg-gold-200` | Borders, decorative elements |
| `gold-300` | `#FFD43B` | `bg-gold-300` | Gradient stops |
| `gold-400` | `#FFD700` | `bg-gold-400` | **Primary gold** — buttons, active tabs |
| `gold-500` | `#C8A200` | `text-gold-500` | Dark gold text, icon accents |
| `gold-600` | `#9A7B00` | `text-gold-600` | Deep gold for strong emphasis |
| `gold-700` | `#6B5600` | `text-gold-700` | Darkest gold |

### Surfaces
| Token | Hex | Tailwind Class | Usage |
|-------|-----|----------------|-------|
| `white` | `#FFFFFF` | `bg-white` | Card backgrounds, modals |
| `surface-primary` | `#FFFFFF` | `bg-surface-primary` | Primary surface |
| `surface-secondary` | `#FAFAFA` | `bg-surface-secondary` | Page background |
| `surface-tertiary` | `#F5F5F5` | `bg-surface-tertiary` | Sidebar, input backgrounds |

### Text
| Token | Hex | Usage |
|-------|-----|-------|
| `gray-800` | `#1F1F1F` | Primary text, headings |
| `gray-700` | — | Secondary text in cards |
| `gray-500` | `#6B7280` | Muted text, labels |
| `gray-400` | `#9CA3AF` | Placeholder text, timestamps |
| `gray-300` | — | Dividers |
| `gray-100` | — | Borders, separators |

### Semantic
| Token | Hex | CSS Variable | Usage |
|-------|-----|-------------|-------|
| Success | `#10B981` | `--success` | Active, verified, approved, positive |
| Danger | `#EF4444` | `--danger` | Error, rejected, inactive, negative |
| Warning | `#F59E0B` | `--warning` | Pending, attention needed |
| Info | `#3B82F6` | `--info` | Informational badges |

### KPI Card Icon Backgrounds
| Type | Background | Text Color |
|------|-----------|------------|
| Users | `bg-blue-50` | `text-blue-500` |
| Investment | `bg-emerald-50` | `text-emerald-500` |
| Withdrawal | `bg-orange-50` | `text-orange-500` |
| Revenue | `bg-purple-50` | `text-purple-500` |

---

## Typography

### Font Families
| Font | Usage | Tailwind | Weight Range |
|------|-------|----------|-------------|
| **Inter** | Body text, inputs, buttons, labels | `font-sans` | 300–800 |
| **Outfit** | Headings, display text, KPI values | `font-display` | 400–800 |

### Type Scale
| Element | Size | Weight | Font | Tailwind |
|---------|------|--------|------|----------|
| Page Title (h1) | 20px | 700 | Outfit | `text-xl font-bold font-display` |
| Section Title (h3) | 16px | 600 | Inter | `text-base font-semibold` |
| Card Title | 18px | 600 | Inter | `text-lg font-semibold` |
| KPI Value | 24px | 700 | Outfit | `text-2xl font-bold font-display` |
| Body Text | 14px | 400 | Inter | `text-sm` |
| Small Text | 13px | 500 | Inter | `text-sm font-medium` |
| Caption | 12px | 400 | Inter | `text-xs` |
| Tiny Label | 10px | 600 | Inter | `text-[10px] font-semibold` |
| Table Header | 12px | 600 | Inter | `text-xs font-semibold uppercase tracking-wider` |

---

## Spacing System

| Use Case | Value | Tailwind |
|----------|-------|----------|
| Card padding | 24px | `p-6` |
| Card padding (compact) | 20px | `p-5` |
| Section gap | 24px | `space-y-6` or `gap-6` |
| Card grid gap (desktop) | 24px | `gap-6` |
| Card grid gap (mobile) | 16px | `gap-4` |
| Form field gap | 16px | `space-y-4` |
| Label to input | 6px | `mb-1.5` |
| Page padding (desktop) | 32px | `p-8` |
| Page padding (tablet) | 24px | `p-6` |
| Page padding (mobile) | 16px | `p-4` |
| Sidebar width (expanded) | 272px | Custom CSS |
| Sidebar width (collapsed) | 80px | Custom CSS |
| Header height | 72px | Custom CSS |

---

## Border Radius

| Element | Radius | Tailwind |
|---------|--------|----------|
| Cards | 16px | `rounded-2xl` (or CSS `.card`) |
| Buttons | 10px | `rounded-[10px]` |
| Inputs | 10px | `rounded-[10px]` |
| Badges | 100px (pill) | `rounded-full` |
| Avatars | 12px (square) or 50% (round) | `rounded-xl` or `rounded-full` |
| Modals | 20px | `rounded-[20px]` |
| Sidebar nav items | 12px | `rounded-xl` |
| Small cards/chips | 8px | `rounded-lg` |

---

## Shadows

| Name | CSS | Usage |
|------|-----|-------|
| `shadow-card` | `0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)` | Default card shadow |
| `shadow-card-hover` | `0 4px 16px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)` | Card hover state |
| `shadow-gold` | `0 4px 20px rgba(255,215,0,0.15)` | Gold-themed elements |
| `shadow-gold-lg` | `0 8px 32px rgba(255,215,0,0.2)` | Large gold elements (avatar) |
| `shadow-sidebar` | `4px 0 24px rgba(0,0,0,0.04)` | Sidebar shadow |

---

## Component Specifications

### Buttons
| Variant | Background | Text | Border | Hover |
|---------|-----------|------|--------|-------|
| `primary` | Gold gradient (135deg, #FFD700 → #C8A200) | `#1F1F1F` | none | Lift + stronger shadow |
| `secondary` | `#FFFFFF` | `#1F1F1F` | 1.5px `#e5e7eb` | Gold border + gold bg |
| `danger` | `#FEE2E2` | `#DC2626` | none | Darker red bg |

| Size | Padding | Font Size |
|------|---------|-----------|
| `sm` | 6px 14px | 13px |
| `md` | 10px 20px | 14px |
| `lg` | 14px 28px | 16px |

### Badges
| Variant | Background | Text |
|---------|-----------|------|
| `success` | `#D1FAE5` | `#065F46` |
| `danger` | `#FEE2E2` | `#991B1B` |
| `warning` | `#FEF3C7` | `#92400E` |
| `info` | `#DBEAFE` | `#1E40AF` |
| `gold` | Gradient `#FFF9E6 → #FFF0B3` | `#9A7B00` + gold border |

### Cards
| Type | Background | Border | Special |
|------|-----------|--------|---------|
| Default (`.card`) | `#FFFFFF` | 1px `#f0f0f0` | Hover: elevated shadow |
| Gold (`.card-gold`) | Gradient white → `#FFF9E6` | 1px gold 25% opacity | Hover: gold shadow |

### Inputs
| State | Border | Shadow |
|-------|--------|--------|
| Default | 1.5px `#e5e7eb` | none |
| Focus | 1.5px `#FFD700` | `0 0 0 3px rgba(255,215,0,0.15)` |

### Right-Side Slide-Over Drawer (`<Modal />` / `.drawer-container`)
| Property | Value |
|----------|-------|
| Overlay Backdrop | Light Smoky Yellow Blur: `radial-gradient` + `blur(14px) saturate(180%)` (`.backdrop-smoky-gold`) |
| Position | Fixed full-height on Right (`right: 0`, `top: 0`, `bottom: 0`, `h-full`) |
| Shadow | Luxury gold glow: `-10px 0 40px rgba(0,0,0,0.12), -2px 0 16px rgba(255,215,0,0.18)` |
| Border | `1.5px solid rgba(255, 215, 0, 0.3)` on left side |
| Sizes | sm: 448px, md: 576px, lg: 672px, xl: 768px (100% on mobile) |
| Header | Gold vertical accent bar + Title + Subtitle + Close button (gold hover) |
| Body | Scrollable `flex-1 overflow-y-auto` with clean spacing |
| Footer | Bottom sticky bar with Cancel + Action buttons |
| Animation | `fadeIn` overlay (0.25s) + `slideInRight` drawer (0.32s cubic-bezier) |
| Keyboard | ESC key close + background scroll lock |

---

## Animations

| Name | Duration | Easing | Usage |
|------|----------|--------|-------|
| `fadeIn` | 0.5s | ease-out | Page transitions |
| `slideUp` | 0.4s | ease-out | Cards appearing, modals |
| `slideInLeft` | 0.3s | ease-out | Sidebar items |
| `shimmer` | 1.5s | ease-in-out (infinite) | Skeleton loading |
| `pulseGold` | 2s | ease-in-out (infinite) | Gold pulse effect |

### Stagger Pattern
- Cards use `animationDelay: ${index * 80}ms`
- Table rows use `animationDelay: ${index * 50}ms`
- CSS classes: `.stagger-1` through `.stagger-6` (50ms increments)

### Transitions
| Speed | Duration | CSS Variable | Usage |
|-------|----------|-------------|-------|
| Fast | 0.2s ease | `--transition-fast` | Hover, focus |
| Normal | 0.3s ease | `--transition-normal` | Layout shifts |
| Slow | 0.4s ease | `--transition-slow` | Page transitions |

---

## Responsive Breakpoints

| Name | Min Width | Tailwind | Layout Changes |
|------|-----------|----------|----------------|
| Mobile | 0px | (default) | Sidebar hidden, single column, hamburger menu |
| Tablet (sm) | 640px | `sm:` | 2-column grids, more table columns visible |
| Medium (md) | 768px | `md:` | Profile name visible in header |
| Desktop (lg) | 1024px | `lg:` | Sidebar fixed, 2-col chart grid, all columns |
| Wide (xl) | 1280px | `xl:` | 4-column KPI grid, 3-col plan grid |

### Sidebar Responsive Behavior
- **Desktop (≥1024)**: Fixed sidebar, toggles between 272px ↔ 80px
- **Mobile (<1024)**: Sidebar hidden, opens as overlay with backdrop blur

### Table Responsive Rules
- Always visible: First column, Status, Action
- Hidden on mobile: KYC, Joined Date, Investment
- Use `hidden sm:table-cell`, `hidden md:table-cell`, `hidden lg:table-cell`

---

## Icon Usage

### Remix Icons (react-icons/ri)
- Used for: Navigation, action buttons, status indicators, form icons
- Import: `import { RiIconName } from 'react-icons/ri'`
- Paired icons: `RiDashboardLine` (outline) / `RiDashboardFill` (filled for active state)
- Size: 16px (small), 18px (medium), 20-22px (standard), 24-28px (large)

### Iconscout Unicons (@iconscout/react-unicons)
- Used for: Supplementary icons, directional arrows, money icons
- Import: `import { UilIconName } from '@iconscout/react-unicons'`
- Common: `UilAngleRight`, `UilAngleDown`, `UilMoneyBill`

---

## Skeleton Loading Specs

| Type | Height | Border Radius | Usage |
|------|--------|---------------|-------|
| `.skeleton-text` | 14px | 4px | Text placeholder |
| `.skeleton-title` | 22px (60% width) | 6px | Title placeholder |
| `.skeleton-avatar` | 40×40px | 50% | Avatar placeholder |
| `.skeleton-card` | 160px | 16px | Full card placeholder |
| `.skeleton-chart` | 280px | 16px | Chart placeholder |
| `.skeleton-row` | 52px | 8px | Table row placeholder |

### Shimmer Animation
```
background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 37%, #f0f0f0 63%);
background-size: 200% 100%;
animation: shimmer 1.5s ease-in-out infinite;
```

---

## News Article Card Categories

| Category | Background | Text Color |
|----------|-----------|------------|
| Company | `bg-blue-100` | `text-blue-700` |
| Plans | `bg-emerald-100` | `text-emerald-700` |
| Market | `bg-purple-100` | `text-purple-700` |
| Update | `bg-orange-100` | `text-orange-700` |

---

## Payment Settings Design

### Quick-Add Button Gradients
| Type | Gradient |
|------|----------|
| Bank Account | `from-blue-500 to-blue-600` |
| QR Code | `from-emerald-500 to-emerald-600` |
| Wallet | `from-purple-500 to-purple-600` |

### Payment Method Icon Mapping
| Type | Icon BG | Icon Color |
|------|---------|------------|
| Bank Account | `bg-blue-50` | `text-blue-500` |
| UPI | `bg-purple-50` | `text-purple-500` |
| QR Code | `bg-emerald-50` | `text-emerald-500` |

---

## Dashboard Activity Icon Mapping

| Activity Type | Icon | BG | Color |
|--------------|------|-----|-------|
| Deposit | `RiArrowRightUpLine` | `bg-emerald-50` | `text-emerald-500` |
| Withdrawal | `RiExchangeDollarLine` | `bg-orange-50` | `text-orange-500` |
| User | `RiUserAddLine` | `bg-blue-50` | `text-blue-500` |
| ROI | `RiFundsLine` | `bg-purple-50` | `text-purple-500` |
| Plan | `RiPieChartLine` | `bg-gold-50` | `text-gold-500` |

---

## Design Rules (Follow Strictly)

1. **No plain colors** — Always use the curated palette above
2. **Gold accents everywhere** — Active states, focus rings, hover effects must use gold
3. **Cards must have hover effect** — Elevated shadow on hover
4. **Skeleton first** — Every page shows skeleton before content
5. **Stagger animations** — Cards appear with delay-based stagger
6. **Inter for body, Outfit for headings** — Never use system fonts directly
7. **Border radius consistency** — Cards 16px, buttons 10px, badges pill, inputs 10px
8. **Responsive tables** — Hide non-essential columns progressively
9. **Sidebar active state** — Gold left bar + gold background gradient
10. **Accessibility** — All interactive elements must have hover/focus states

---

## Change Log

| Date | Design Change | Affected Components |
|------|--------------|-------------------|
| 2026-08-20 | Initial design system — White & Gold theme | All |
| 2026-08-20 | KPI cards: rolling counter animation (cubic ease-out), auto-fit text sizing, $ prefix with gold color, magnitude suffixes (Million/Billion/Thousand) in small uppercase, rollUp keyframe + tabular-nums | KPICard.jsx, index.css |
| 2026-08-20 | KPI cards: full exact numbers with commas ($82,450,000, 12,845), fixed multi-spin rollover odometer strip with smooth cubic-bezier physics, auto-fit container bounds | KPICard.jsx, mockData.js |
| 2026-08-20 | KPI cards: unified 1.25em baseline for commas and zero digits, added auto-calculated magnitude badge (e.g. $82.45M • 82.45 Million Dollars) with pulse indicator | KPICard.jsx |
| 2026-08-20 | Replaced floating centered modals with Right-Side Slide-Over Drawers with full-dashboard Light Smoky Yellow Blur backdrop (`.backdrop-smoky-gold`), gold accent bar, ESC close, and scroll lock | Modal.jsx, Sidebar.jsx, Users.jsx, index.css, DESIGN.md |
| 2026-08-20 | Tuned blur to soft 5px gold smoke; enforced 100dvh flex-column viewport fit with sticky taskbar-safe footer; added Renewable Energy & Precious Metal categories, Min/Max investment fields, and live per-second ROI streaming simulator | InvestmentPlans.jsx, Modal.jsx, mockData.js, index.css, DESIGN.md |
| 2026-08-20 | Zero-emoji policy enforced across all components (pure SVG React Icons only); redesigned dollar prefix input groups to eliminate overlaps; allowed empty clear state for numeric inputs | InvestmentPlans.jsx, DESIGN.md |
| 2026-08-20 | Portalized all drawers to document.body root via React createPortal to guarantee 100% full screen top-to-bottom fit, fixing top clipping and taskbar button obscuration | Modal.jsx, index.css, DESIGN.md |
| 2026-08-20 | Replaced rigid duration select dropdown with flexible numeric count + Days/Months/Years unit selector + smart quick presets with live badge preview | InvestmentPlans.jsx, DESIGN.md |
| 2026-08-20 | Streamlined duration to clean Number input + Days/Months/Years unit selector; added @keyframes slideInRight in CSS for smooth cubic-bezier drawer entry | InvestmentPlans.jsx, index.css, DESIGN.md |
| 2026-08-20 | Implemented DD / MM / YYYY duration input format; integrated dynamic calculator switching between Real-Time Per-Second Stream and Daily Settlement Payout calculators | InvestmentPlans.jsx, DESIGN.md |
| 2026-08-20 | Users management table overhauled: removed KYC; standardized columns to Full Name, Email, Mobile Number, Date of Join, Country, Status; added dual View & Delete action buttons | Users.jsx, mockData.js, DESIGN.md |
| 2026-08-20 | Implemented comprehensive User Investment Portfolio drawer view: financial KPI cards, active holdings cards with streaming ROI metrics, and detailed user transaction table with luxury White & Gold styling | Users.jsx, mockData.js, DESIGN.md |
| 2026-08-20 | Set Top 50 maximum transaction sliding window with FIFO rotation policy for all user account audit feeds | Users.jsx, DESIGN.md |
| 2026-08-20 | Replaced user IDs with clean HORIZON-USR-01 format (no # symbol), added prominent round circle avatars, softened table typography to slate-800, and integrated Payout Mode column | Users.jsx, mockData.js, DESIGN.md |
| 2026-08-20 | Enforced Poppins & Inter typography across user profiles, data tables, and modal metrics with soft light-dark slate color grading | Users.jsx, index.html, tailwind.config.js, DESIGN.md |
| 2026-08-20 | Upgraded Transactions page: rolling odometer KPICards for gross deposits/withdrawals/yields, table aligned with Users styling, and interactive transaction audit drawer with approve/reject handling | Transactions.jsx, mockData.js, DESIGN.md |
| 2026-08-20 | SearchBar component updated with generous !pl-10 icon clearance; enforced whitespace-nowrap on TXN IDs; added row delete, Clear All purge modal, Date Range filter modal, and dual CSV/PDF export buttons | SearchBar.jsx, Header.jsx, Transactions.jsx, DESIGN.md |
| 2026-08-20 | Transactions: eliminated Approve/Reject buttons; created clean standalone Printable Audit Statement & Receipt window generators that print pure vector data tables without app UI clutter | Transactions.jsx, DESIGN.md |
| 2026-08-20 | News & Media: built full Blog Page Studio inside Slide-Over Drawer with H1/H2/H3 headings, WYSIWYG formatting toolbar (bold, italic, blockquotes, callout boxes), live reader preview tab, word/read-time tracker, and full reader drawer modal | NewsMedia.jsx, mockData.js, DESIGN.md |
| 2026-08-20 | News & Media drawer simplified: added dynamic "+ Add New Category" inline tool, removed upper preview/SEO tabs for streamlined single-view writing | NewsMedia.jsx, DESIGN.md |
| 2026-08-20 | Payment Settings redesigned: added Crypto Digital Wallets (USDT TRC20/ERC20, BTC, SOL), dynamic QR generation, 1-click address copy, slide-over drawer with all wallet fields, and scan-to-pay QR modal | PaymentSettings.jsx, mockData.js, DESIGN.md |
| 2026-08-20 | Built Ranks & Referrals page (`/ranks`): 10-tier Rank Ladder (Starter to Titan), 5-tier multi-level referral commissions (L1-L5), rolling odometer KPI cards, and editable threshold drawers | Ranks.jsx, App.jsx, Sidebar.jsx, Header.jsx, Breadcrumb.jsx, mockData.js, DESIGN.md |
| 2026-08-20 | Users management table: added "Referred By (Sponsor)" column with sponsor tags, and enriched User Profile Drawer with downline & rank details | Users.jsx, mockData.js, DESIGN.md |
| 2026-08-20 | Payment Settings: removed Copy Address button to keep only Edit & Delete, added complete Institutional Bank fields with custom Bank QR upload support | PaymentSettings.jsx, DESIGN.md |
| 2026-08-20 | News & Media: added Page Banner / Cover Image URL input with direct URL presets and live banner preview inside Article Studio Drawer and cards | NewsMedia.jsx, DESIGN.md |
| 2026-08-20 | Payment Settings: removed auto-generated QR codes in favor of direct Custom QR Upload with drag-and-drop file support; split banking into 2 dedicated types: 🇮🇳 Indian Domestic Bank (IFSC/UPI) and 🌐 International Institutional Bank (IBAN/SWIFT) | PaymentSettings.jsx, mockData.js, DESIGN.md |
| 2026-08-20 | News & Media: added direct image file upload with drag-and-drop in studio drawer, increased card banner height to h-56 for widescreen view, and replaced default box with clean photo icon upload placeholder | NewsMedia.jsx, mockData.js, DESIGN.md |
| 2026-08-20 | Payment Settings: integrated Mobile E-Wallets (EasyPaisa, JazzCash, SadaPay) with custom mobile, CNIC & Till fields; resolved circle badge overflow by replacing text in circles with centered SVG icons and separate pill tags | PaymentSettings.jsx, mockData.js, DESIGN.md |
| 2026-08-20 | Ranks & Referrals overhaul: separated 4 program pillars (Rank Ladder, 5-Tier Commissions, Leaders Directory & Calculation Simulator); fixed high-contrast sticky table headers; added live Downline Tree Audit Drawer | Ranks.jsx, AGENTS.md, DESIGN.md |
| 2026-08-20 | Added interactive In-Drawer Auto-Calculation Engines to Edit Rank and Edit Commission slide-over drawers with live volume testers, margin metrics, scale projections, and revenue share math | Ranks.jsx, Users.jsx, AGENTS.md, DESIGN.md |
| 2026-08-20 | Split Ranks and Referrals into 2 dedicated pages & routes (`/ranks` Rank Ladder & `/referrals` Referral Plans); enforced strict ZERO EMOJI policy across entire platform in favor of pure SVG icons; eliminated all dark color containers in favor of White & Gold light theme | Ranks.jsx, Referrals.jsx, App.jsx, Sidebar.jsx, Header.jsx, Breadcrumb.jsx, PaymentSettings.jsx, InvestmentPlans.jsx, AGENTS.md, DESIGN.md |
| 2026-08-20 | Removed standalone simulator tab; updated Rank Achievers and Affiliate Promoters tables to 100% match Users.jsx data-table styling with large round avatars, horizontal scrolling, and generous column widths | Ranks.jsx, Referrals.jsx, AGENTS.md, DESIGN.md |
| 2026-08-20 | Replaced all dark weights and font-mono in table cells (Direct Referrals, Turnover, Commissions, Rewards) with soft Poppins typography (slate-600, slate-700, emerald-600, gold-600) exactly matching Users.jsx | Ranks.jsx, Referrals.jsx, AGENTS.md, DESIGN.md |
| 2026-08-20 | Upgraded table amount cells to full vibrant color badges (Blue for Referrals, Amber for Turnover, Emerald for Commissions/Rewards, Emerald gradient for Total Payout) and styled Audit/Audit Tree as prominent gold action buttons | Ranks.jsx, Referrals.jsx, AGENTS.md, DESIGN.md |
| 2026-08-20 | Built Kinetoscope-style Support Tickets Desk (`/support-tickets`) with chronological chat thread drawer, quick macro reply templates, internal admin notes, and full ticket lifecycle management | SupportTickets.jsx, mockData.js, App.jsx, Sidebar.jsx, Header.jsx, Breadcrumb.jsx, AGENTS.md, DESIGN.md |
| 2026-08-20 | Built Official Support Channels & Links Management page (`/support-channels`) with 24/7 WhatsApp VIP desk, Telegram bot, compliance email desks, toll-free lines, social community links, and CRUD drawer | SupportChannels.jsx, mockData.js, App.jsx, Sidebar.jsx, Header.jsx, Breadcrumb.jsx, AGENTS.md, DESIGN.md |
| 2026-08-20 | Upgraded Support Tickets table to 12 spacious horizontal scrolling columns with separate email, phone, category pill, priority badge, message count, created date, and prominent gold View Thread button matching Users.jsx | SupportTickets.jsx, AGENTS.md, DESIGN.md |
| 2026-08-20 | Eliminated all KYC references platform-wide from Support Tickets in favor of Vault Custody & Investment categories; enforced strict whitespace-nowrap & single-line truncation on table cells to prevent any multi-line wrapping or column clipping | SupportTickets.jsx, mockData.js, AGENTS.md, DESIGN.md |
| 2026-08-20 | Fixed Support Drawer user profile header layout to prevent Level 3 (Gold) rank badge overlapping; overhauled Settings page with 4-tab architecture, rolling odometer KPIs, master profile card, password strength meter, email OTP verification, active sessions, and alert preferences | SupportTickets.jsx, Settings.jsx, AGENTS.md, DESIGN.md |
| 2026-08-20 | Support Tickets overhaul: removed quick macros in favor of custom message typing, added Default ON email notification toggle, Super Admin file/doc attachments, client attachment lightbox viewer modal, per-row & in-drawer ticket deletion with confirmation modal, and unlimited table scroll | SupportTickets.jsx, AGENTS.md, DESIGN.md |
| 2026-08-20 | Eliminated double drawer preview popup for client documents in SupportTickets by rendering inline expandable attachment cards with direct download inside message thread bubbles; implemented 20-items-per-page pagination standard across all dashboard tables (SupportTickets, Users, Transactions, Ranks, Referrals) with Pagination component | SupportTickets.jsx, Users.jsx, Transactions.jsx, Ranks.jsx, Referrals.jsx, Pagination.jsx, mockData.js, AGENTS.md, DESIGN.md |
| 2026-08-20 | Built Centered Media Lightbox Viewer Modal (`MediaViewerModal.jsx`) supporting direct Image thumbnails with 1-click popup zoom, interactive 2-page PDF Reader with official letterhead & verification seals, Video player with playback controls & scrub bar, and Document/Spreadsheet inspector cards + Super Admin multi-format media attachment preview bar | MediaViewerModal.jsx, SupportTickets.jsx, mockData.js, AGENTS.md, DESIGN.md |
| 2026-08-20 | Synchronized Super Admin profile photo avatar upload & removal across Admin Profile and Top Header circle via localStorage & event listener; removed Phone Number and Timezone fields from Settings master account form; restored interactive 2FA enforcement toggle switch in Security & Access Control | Settings.jsx, Header.jsx, AGENTS.md, DESIGN.md |
| 2026-08-20 | Completely removed Security & Access Control module from Settings; placed 2FA authentication toggle card directly inside Master Account Details on Admin Profile tab; streamlined Settings to 3 clean tabs (Admin Profile, Change Email & Password OTP, and Automated User Alerts) | Settings.jsx, AGENTS.md, DESIGN.md |
| 2026-08-20 | Completely removed Reports & Analytics page (`/reports`), sidebar nav item, header title, and breadcrumb route from dashboard per user directive | App.jsx, Sidebar.jsx, Header.jsx, Breadcrumb.jsx, Reports.jsx, AGENTS.md, DESIGN.md |
| 2026-08-20 | Fixed Transactions data-table column header alignment by synchronizing thead columns (TXN ID, Investor, Email, Country, Type, Amount, Gateway, Date & Time, Status, Action) with tbody cells to eliminate white unaligned gaps | Transactions.jsx, Referrals.jsx, AGENTS.md, DESIGN.md |
| 2026-08-20 | Refined search filtering across Ranks, Referrals, and Users tables to search members' own account credentials (Custom ID, Full Name, Email, Phone, Rank) instead of matching sponsor tags to prevent downline leakage in search results | Ranks.jsx, Referrals.jsx, Users.jsx, AGENTS.md, DESIGN.md |
| 2026-08-20 | Sidebar complete reorganization: organized 11 nav modules into 3 structured pillars (Core Platform, Financial & Growth, Desk & System), converted collapsed mode to perfectly centered 44px round icon tiles with crisp floating hover tooltips, and added Super Admin mini-profile footer card | Sidebar.jsx, AGENTS.md, DESIGN.md |
| 2026-08-20 | Completely removed all "Master Root" labels platform-wide from Sidebar footer card and Settings profile badges per user request | Sidebar.jsx, Settings.jsx, AGENTS.md, DESIGN.md |
| 2026-08-20 | Fixed Dashboard Portfolio Asset Allocation Donut Chart: resolved dataset prop mismatch (passing category breakdown instead of monthly revenue series), added central AUM total metric ($84.2M), and built responsive category progress allocation breakdown | DonutChart.jsx, Dashboard.jsx, mockData.js, AGENTS.md, DESIGN.md |
| 2026-08-20 | Converted Donut Chart to Solid Pie Chart with slice-colored interactive hover tooltips; fixed collapsed sidebar hover tooltips floating freely with overflow-visible; removed mobile sidebar blur overlay | DonutChart.jsx, Sidebar.jsx, AGENTS.md, DESIGN.md |
| 2026-08-20 | Optimized Sidebar collapsed & expanded mode vertical distribution with flex-1 justify-evenly across Core Platform, Financial & Growth, and Desk & System sections to gracefully cover the full sidebar height without bottom voids | Sidebar.jsx, Layout.jsx, AGENTS.md, DESIGN.md |
| 2026-08-20 | Saved official logo image into `public/admin/logo.png`, extracted crystal-sharp round logo icon to `public/admin/icon.png` & `src/assets/admin/icon.png`; enlarged emblem circle to 48px rendering the actual logo image with seamless full-bleed circular fit; formatted "HORIZON CAP WORLDS" with prominent gold gradient and clean "Super Admin" subtitle | Sidebar.jsx, index.html, AGENTS.md, DESIGN.md |
| 2026-08-20 | Built Horizon Cap Worlds User Platform & Investor Dashboard in `user/` folder with 11 pages, live streaming ROI ticker, dual wallets, 5-tier referrals, 10-tier ranks, dark institutional theme, and dedicated AGENTS.md/DESIGN.md documentation | `user/*`, AGENTS.md, DESIGN.md |

---

*Last Updated: 2026-08-20*






























