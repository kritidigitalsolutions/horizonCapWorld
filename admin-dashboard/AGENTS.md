# Horizon of Capital — Agent Memory

> **Purpose**: This file is the project's living memory. It tracks architecture, components, pages, routes, dependencies, patterns, and decisions. **MUST be updated after every change.**

---

## Project Overview

| Key | Value |
|-----|-------|
| **Project Name** | Horizon of Capital |
| **Type** | Super Admin Dashboard (Investment Platform) |
| **Framework** | Vite + React 19 |
| **Styling** | Tailwind CSS v3 + Vanilla CSS |
| **Icons** | `react-icons` (Remix Icons — `Ri*`) + `@iconscout/react-unicons` (`Uil*`) |
| **Charts** | Recharts |
| **Routing** | React Router v6 (`react-router-dom`) |
| **Fonts** | Inter (body) + Outfit (headings) via Google Fonts |
| **Theme** | White & Gold Premium |
| **Dev Port** | 5174 (default 5173 if available) |

---

## Dependencies

### Production
| Package | Purpose |
|---------|---------|
| `react` | UI library |
| `react-dom` | DOM rendering |
| `react-router-dom` | Client-side routing |
| `recharts` | Charts (Area, Bar, Pie/Donut) |
| `react-icons` | Icon library (Remix Icons: `Ri*` prefix) |
| `@iconscout/react-unicons` | Icon library (Unicons: `Uil*` prefix) |

### Dev
| Package | Purpose |
|---------|---------|
| `vite` | Build tool & dev server |
| `tailwindcss` | Utility CSS framework |
| `postcss` | CSS processing |
| `autoprefixer` | CSS vendor prefixes |

---

## File Structure

```
horizon-of-cap/
├── index.html                          # Entry HTML (Google Fonts loaded here)
├── vite.config.js                      # Vite configuration
├── tailwind.config.js                  # Tailwind config (custom colors, fonts, animations)
├── postcss.config.js                   # PostCSS config
├── package.json
├── AGENTS.md                           # THIS FILE — Agent memory
├── DESIGN.md                           # Design system documentation
├── src/
│   ├── main.jsx                        # React entry point
│   ├── App.jsx                         # Root component with BrowserRouter + Routes
│   ├── index.css                       # Tailwind directives + custom CSS classes
│   ├── data/
│   │   └── mockData.js                 # All mock data (minimal, realistic)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.jsx              # Main layout wrapper (sidebar + header + content)
│   │   │   ├── Sidebar.jsx             # Collapsible sidebar with nav items
│   │   │   ├── Header.jsx              # Top header (search, notifications, profile)
│   │   │   └── Breadcrumb.jsx          # Auto-generated breadcrumbs
│   │   ├── ui/
│   │   │   ├── KPICard.jsx             # KPI stat card with icon + change indicator
│   │   │   ├── Badge.jsx               # Status badge (success/danger/warning/info/gold)
│   │   │   ├── Button.jsx              # Button (primary/secondary/danger, sm/md/lg)
│   │   │   ├── Modal.jsx               # Overlay modal (sm/md/lg/xl sizes)
│   │   │   ├── SearchBar.jsx           # Search input with icon
│   │   │   ├── TabsBar.jsx             # Tab navigation with optional counts
│   │   │   ├── OTPInput.jsx            # 6-digit OTP input with auto-focus + paste
│   │   │   ├── NotificationDropdown.jsx # Bell icon dropdown with notification list
│   │   │   └── SkeletonLoader.jsx      # Skeleton loading (card/chart/table/article)
│   │   └── charts/
│   │       ├── AreaChart.jsx           # Area chart with gold gradient
│   │       ├── BarChart.jsx            # Bar chart with gold bars
│   │       └── DonutChart.jsx          # Donut/Pie chart with legend
│   └── pages/
│       ├── Dashboard.jsx               # / — KPI cards + 4 chart cards
│       ├── InvestmentPlans.jsx         # /investment-plans — Plan cards + CRUD modal
│       ├── Users.jsx                   # /users — Users table + detail sidebar
│       ├── Ranks.jsx                   # /ranks — 10-level rank ladder & cash bonus rewards
│       ├── Referrals.jsx               # /referrals — 5-tier referral plans & affiliate matrix
│       ├── Transactions.jsx            # /transactions — Tab-based transaction table
│       ├── SupportTickets.jsx          # /support-tickets — Kinetoscope-style Helpdesk & Chat Thread Studio
│       ├── SupportChannels.jsx         # /support-channels — Official WhatsApp, Telegram, Email & Social links
│       ├── NewsMedia.jsx               # /news-media — Article cards + CRUD modal
│       ├── PaymentSettings.jsx         # /payment-settings — Bank, QR, Wallet management
│       └── Settings.jsx                # /settings — Profile, Password (OTP), User Notification Engine
```

---

## Routes

| Route | Page Component | Description |
|-------|---------------|-------------|
| `/` | `Dashboard` | Main dashboard with KPIs and charts |
| `/investment-plans` | `InvestmentPlans` | Manage investment plans |
| `/users` | `Users` | User management with portfolio & sponsor trees |
| `/ranks` | `Ranks` | 10-level rank progression ladder & instant cash bonus rewards |
| `/referrals` | `Referrals` | 5-tier referral plans & multi-level affiliate commission matrix |
| `/transactions` | `Transactions` | All transaction types with PDF statements & receipts |
| `/support-tickets` | `SupportTickets` | Kinetoscope-style CRM ticketing desk with chronological chat thread drawer |
| `/support-channels` | `SupportChannels` | Official WhatsApp VIP desk, Telegram bot, emails, toll-free lines & social channels |
| `/news-media` | `NewsMedia` | Articles, announcements & blog editorial studio |
| `/payment-settings` | `PaymentSettings` | Crypto wallets, QR code, bank settings |
| `/settings` | `Settings` | Profile, password change, 2FA toggle, user notification policies |

---

## Sidebar Navigation Order

1. Dashboard (`/`)
2. Investment Plans (`/investment-plans`)
3. Users (`/users`)
4. Rank Ladder (`/ranks`)
5. Referral Plans (`/referrals`)
6. Transactions (`/transactions`)
7. Support Tickets (`/support-tickets`)
8. Support Channels (`/support-channels`)
9. News & Media (`/news-media`)
10. Payment Settings (`/payment-settings`)
11. Settings (`/settings`)

> **Note**: Sidebar nav items are defined in `Sidebar.jsx` → `navItems` array. New pages MUST be added here.

---

## Component Patterns

### Layout Pattern
- Every page is wrapped in `<Layout>` which renders Sidebar + Header + Breadcrumb
- Pages are rendered as `children` inside Layout's `<main>` tag
- Sidebar width: 272px (expanded), 80px (collapsed)
- Header height: 72px (sticky)

### Skeleton Loading Pattern
- Every page uses `useState(true)` for `loading`
- `useEffect` with `setTimeout(1200-1500ms)` simulates data fetch
- Show `<SkeletonLoader>` during loading state
- Types: `card`, `chart`, `table`, `article`

### Modal / Drawer Pattern
- Forms and detail views use the `<Modal>` Right-Side Slide-Over Drawer component (`isOpen`, `onClose`, `title`, `subtitle`, `footer`, `size`)
- Full dashboard background is covered by a Light Smoky Yellow Blur overlay (`.backdrop-smoky-gold` / `.modal-overlay`)
- Drawer slides in from right (`slideInRight` 0.32s cubic-bezier)
- Footer contains sticky Cancel + Action buttons
- Close on overlay click, close button, or ESC key with body scroll lock

### Data Table Pattern
- Use `.data-table` CSS class on `<table>`
- Wrap in `.table-container` for horizontal scroll
- Use `<Badge>` for status columns
- Hide columns on mobile using `hidden sm:table-cell` / `hidden md:table-cell`

### Animation Pattern
- `animate-fade-in` for page entrance
- `animate-slide-up` with `animationDelay` for stagger effect
- Cards: `style={{ animationDelay: '${i * 80}ms' }}`

---

## Mock Data Structure (src/data/mockData.js)

| Export | Used In | Shape |
|--------|---------|-------|
| `kpiData` | Dashboard | `{ id, title, numericValue, prefix, suffix, decimals, change, positive, icon }` |
| `investmentPlans` | InvestmentPlans | `{ id, name, roi, duration, minAmount, status, investors }` |
| `users` | Users | `{ id, name, email, phone, kyc, joined, investment, status }` |
| `transactions` | Transactions | `{ id, user, type, amount, status, date }` |
| `newsArticles` | NewsMedia | `{ id, title, excerpt, status, date, category }` |
| `paymentMethods` | PaymentSettings | `{ id, type, details, isDefault }` |
| `chartData` | Dashboard, Reports | `{ investment[], userGrowth[], revenue[] }` |
| `notifications` | NotificationDropdown | `{ id, title, message, time, read }` |
| `recentActivity` | Dashboard | `{ id, action, detail, time, type }` |

---

## Key Architecture Decisions

1. **Frontend only** — No backend. Mock data simulates API responses via setTimeout
2. **No state management library** — React useState is sufficient for current scope
3. **Tailwind + Vanilla CSS** — Tailwind for utilities, vanilla CSS for complex components (`.card`, `.btn`, `.badge`, `.data-table`, `.skeleton`, etc.)
4. **BrowserRouter** — Client-side routing (needs server-side fallback for production)
5. **Responsive breakpoints** — Mobile (<640), Tablet (640-1024), Desktop (>1024)
6. **Sidebar collapse** — Desktop: toggle between 272px/80px. Mobile: overlay with backdrop

---

## Important CSS Classes (index.css)

| Class | Purpose |
|-------|---------|
| `.card` | White card with border, shadow, hover effect |
| `.card-gold` | Gold-tinted card variant |
| `.btn` `.btn-primary` `.btn-secondary` `.btn-danger` | Button styles |
| `.badge` `.badge-success` `.badge-danger` `.badge-warning` `.badge-info` `.badge-gold` | Status badges |
| `.input` | Form input with gold focus ring |
| `.data-table` | Table styling with hover rows |
| `.skeleton` | Shimmer animation base class |
| `.glass` `.glass-gold` | Glassmorphism effects |
| `.text-gradient-gold` | Gold gradient text |
| `.modal-overlay` `.modal-content` | Modal styling |
| `.tabs-bar` `.tab-item` | Tab navigation |
| `.page-enter` | Page entrance animation |
| `.tabular-nums` | Tabular number alignment for KPI counters |
| `@keyframes rollUp` | Rolling digit entry animation |

---

## When Adding New Features

### Adding a New Page:
1. Create `src/pages/NewPage.jsx`
2. Add route in `src/App.jsx` inside `<Routes>`
3. Add nav item in `src/components/layout/Sidebar.jsx` → `navItems` array
4. Add page title in `src/components/layout/Header.jsx` → `pageTitles` object
5. Add breadcrumb label in `src/components/layout/Breadcrumb.jsx` → `routeLabels` object
6. Update mock data in `src/data/mockData.js` if needed
7. **UPDATE THIS FILE (AGENTS.md) and DESIGN.md**

### Adding a New Component:
1. Create in appropriate folder (`ui/`, `charts/`, `layout/`)
2. Follow existing patterns (props interface, className approach)
3. **UPDATE THIS FILE (AGENTS.md)**

### Adding New Mock Data:
1. Add to `src/data/mockData.js`
2. Export with named export
3. **UPDATE THIS FILE (AGENTS.md)** → Mock Data Structure table

---

## Change Log

| Date | Change | Files Affected |
|------|--------|---------------|
| 2026-08-20 | Initial build — 8 pages, 16 components, full dashboard | All files |
| 2026-08-20 | KPI cards: dollar values, rolling counter animation, auto-fit text, magnitude suffixes | KPICard.jsx, mockData.js, index.css |
| 2026-08-20 | KPI cards: true odometer/slot-machine rolling digits (0-9 strip with translateY), stagger per digit | KPICard.jsx |
| 2026-08-20 | KPI cards: full formatted numbers with zeros and commas (e.g. $82,450,000, 12,845), fixed multi-spin rollover animation bug using em transforms | KPICard.jsx, mockData.js |
| 2026-08-20 | KPI cards: fixed comma & zero padding/margin baseline alignment, added automatic magnitude calculation (Thousand, Million, Billion) with compact badge and full unit label | KPICard.jsx |
| 2026-08-20 | Replaced floating centered modals with Right-Side Slide-Over Drawers with full-dashboard Light Smoky Yellow Blur backdrop (`.backdrop-smoky-gold`), gold accent bar, ESC close, and scroll lock | Modal.jsx, Sidebar.jsx, Users.jsx, index.css, AGENTS.md, DESIGN.md |
| 2026-08-20 | Fixed drawer top coverage & sticky taskbar-safe footer; softened smoky yellow blur (blur 5px); added Renewable Energy & Precious Metal categories, Min/Max investment fields, and interactive live per-second ROI streaming simulator | InvestmentPlans.jsx, Modal.jsx, mockData.js, index.css, AGENTS.md, DESIGN.md |
| 2026-08-20 | Fixed Dollar sign prefix layout in Min/Max inputs, removed all emojis in favor of pure SVG icons, made ROI simulator test amount fully clearable without fallback sticking | InvestmentPlans.jsx, AGENTS.md, DESIGN.md |
| 2026-08-20 | Teleported drawer directly to document.body using React createPortal, breaking free of parent transform/stacking contexts to ensure 100% top-to-bottom viewport coverage and taskbar-safe footer | Modal.jsx, index.css, AGENTS.md, DESIGN.md |
| 2026-08-20 | Replaced rigid duration dropdown with freeform numeric duration input + Days/Months/Years unit selector + quick preset buttons, auto-computing formatted duration strings | InvestmentPlans.jsx, AGENTS.md, DESIGN.md |
| 2026-08-20 | Streamlined duration field to clean Number input + Days/Months/Years unit selector without preset clutter; added global @keyframes slideInRight for smooth cubic-bezier drawer slide-in | InvestmentPlans.jsx, index.css, AGENTS.md, DESIGN.md |
| 2026-08-20 | Replaced duration tabs with clean DD (Days) / MM (Months) / YYYY (Years) input fields; implemented dynamic calculator switching (Real-Time Per-Second Simulator vs Daily Settlement Calculator) based on selected payout mode | InvestmentPlans.jsx, AGENTS.md, DESIGN.md |
| 2026-08-20 | Redesigned Users page: removed KYC status; added Full Name, Email, Mobile Number, Date of Join, Country, and Status columns; added View and Delete action buttons with confirmation modal | Users.jsx, mockData.js, AGENTS.md, DESIGN.md |
| 2026-08-20 | Upgraded User View drawer with complete investment portfolio breakdown: Total Invested, Total Profit Earned, Wallet Balance, Active Plans with yields, and transaction logs | Users.jsx, mockData.js, AGENTS.md, DESIGN.md |
| 2026-08-20 | Added Top 50 Latest FIFO queue limits on user transaction history, detailing automatic roll-off of oldest records upon new entry additions | Users.jsx, AGENTS.md, DESIGN.md |
| 2026-08-20 | Formatted all user IDs to HORIZON-USR-01 format (no # symbol), added large full-circle avatars, softened table typography, multi-parameter search, and Payout Mode column | Users.jsx, mockData.js, AGENTS.md, DESIGN.md |
| 2026-08-20 | Integrated Poppins Google font across all User elements (Name, ID, Email, Phone, Numbers) with soft light-dark slate colors (slate-700/600/500) | Users.jsx, index.html, tailwind.config.js, AGENTS.md, DESIGN.md |
| 2026-08-20 | Transactions page overhaul: added rolling odometer KPICards for deposits/withdrawals/ROI, table matching Users styling with large round avatars, and interactive transaction audit drawer with approve/reject actions | Transactions.jsx, mockData.js, AGENTS.md, DESIGN.md |
| 2026-08-20 | Fixed SearchBar icon padding collision dashboard-wide; fixed TXN ID multi-line wrapping; added per-row Delete & Clear All purge with confirmation modals; added Date Range filter modal; added dual Export CSV & Print PDF buttons | SearchBar.jsx, Header.jsx, Transactions.jsx, AGENTS.md, DESIGN.md |
| 2026-08-20 | Removed Approve/Reject actions from Transactions; built clean dedicated PDF Statement & Single Receipt print generators containing pure formatted report tables without dashboard UI screenshot chrome | Transactions.jsx, AGENTS.md, DESIGN.md |
| 2026-08-20 | News & Media overhaul: built complete Blog Page Studio inside Slide-Over Drawer featuring H1/H2/H3 headings, WYSIWYG formatting toolbar, quotes, callouts, real-time live reader preview, word/read-time statistics, and full article reader modal | NewsMedia.jsx, mockData.js, AGENTS.md, DESIGN.md |
| 2026-08-20 | News & Media: added dynamic inline Add Category functionality with instant filter pill creation; simplified studio drawer by removing redundant live preview and SEO metadata tab bars | NewsMedia.jsx, AGENTS.md, DESIGN.md |
| 2026-08-20 | Payment Settings overhaul: integrated Crypto Digital Wallets (USDT TRC20/ERC20, BTC, SOL, Wise), interactive QR codes, 1-click address copy, slide-over drawer with full wallet parameters, and high-res scan-to-pay QR modal | PaymentSettings.jsx, mockData.js, AGENTS.md, DESIGN.md |
| 2026-08-20 | Created new Ranks & Referral Rewards Program page (`/ranks`) with 10-Level Rank Ladder (Starter to Titan), 5-Tier Referral Commissions (L1-L5), rolling odometer KPI cards, and editable threshold drawers | Ranks.jsx, App.jsx, Sidebar.jsx, Header.jsx, Breadcrumb.jsx, mockData.js, AGENTS.md, DESIGN.md |
| 2026-08-20 | Users management table: added "Referred By (Sponsor)" column with sponsor tags, and enriched User Profile Drawer with downline & rank details | Users.jsx, mockData.js, AGENTS.md, DESIGN.md |
| 2026-08-20 | Payment Settings: removed Copy Address button to keep only Edit & Delete, added complete Institutional Bank fields with custom Bank QR upload support | PaymentSettings.jsx, AGENTS.md, DESIGN.md |
| 2026-08-20 | News & Media: added Page Banner / Cover Image URL input with direct URL presets and live banner preview inside Article Studio Drawer and cards | NewsMedia.jsx, AGENTS.md, DESIGN.md |
| 2026-08-20 | Payment Settings: removed auto-generated QR codes in favor of direct Custom QR Upload with drag-and-drop file support; split banking into 2 dedicated types: 🇮🇳 Indian Domestic Bank (IFSC/UPI) and 🌐 International Institutional Bank (IBAN/SWIFT) | PaymentSettings.jsx, mockData.js, AGENTS.md, DESIGN.md |
| 2026-08-20 | News & Media: added direct image file upload with drag-and-drop in studio drawer, increased card banner height to h-56 for widescreen view, and replaced default box with clean photo icon upload placeholder | NewsMedia.jsx, mockData.js, AGENTS.md, DESIGN.md |
| 2026-08-20 | Payment Settings: integrated Mobile E-Wallets (EasyPaisa, JazzCash, SadaPay) with custom mobile, CNIC & Till fields; resolved circle badge overflow by replacing text in circles with centered SVG icons and separate pill tags | PaymentSettings.jsx, mockData.js, AGENTS.md, DESIGN.md |
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






























