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
| **Poppins** | Brand headers, tables, user credentials, badges | `font-poppins` | 300–900 |

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
| Sidebar width (expanded) | 268px | Custom CSS |
| Sidebar width (collapsed) | 74px | Custom CSS |
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
| Modals / Drawers | 20px | `rounded-[20px]` |
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

---

## Icon Usage

### Remix Icons (react-icons/ri)
- Used for: Navigation, action buttons, status indicators, form icons
- Import: `import { RiIconName } from 'react-icons/ri'`
- Size: 16px (small), 18px (medium), 20-22px (standard), 24-28px (large)

### Iconscout Unicons (@iconscout/react-unicons)
- Used for: Supplementary icons, directional arrows, money icons
- Import: `import { UilIconName } from '@iconscout/react-unicons'`

---

## Design Rules (Follow Strictly)

1. **No plain colors** — Always use the curated palette above
2. **Gold accents everywhere** — Active states, focus rings, hover effects must use gold
3. **Cards must have hover effect** — Elevated shadow on hover
4. **Skeleton first** — Every page shows skeleton before content
5. **Stagger animations** — Cards appear with delay-based stagger
6. **Inter for body, Outfit for headings, Poppins for branding & tables**
7. **Border radius consistency** — Cards 16px, buttons 10px, badges pill, inputs 10px
8. **Right-Side Slide-Over Drawers** with Light Smoky Gold Blur overlay for all interactive dialogs and calculators
9. **Sidebar active state** — Gold left bar + gold background gradient

---

## Change Log

| Date | Design Change | Affected Components |
|------|--------------|-------------------|
| 2026-08-20 | Initial build of User Platform | All |
| 2026-08-20 | Replaced all dark themes with official White & Gold Premium Light Theme matching Admin DESIGN.md | All pages, Sidebar, Header, Drawer |
| 2026-08-20 | Built Right-Side Slide-Over Drawer with Profit Calculator, Smoky Gold Backdrop, and Taskbar-Safe Footer | Modal.jsx, Plans.jsx, UserDashboard.jsx |

---

*Last Updated: 2026-08-20*
