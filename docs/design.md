# design.md
## University Higher Education ERP: Frontend Design System and Page Specification

**Status:** Design source of truth for the frontend team
**Functional authority:** the PID / `Educational_ERP_PRD.md` (page IDs C-, A-, E-, F-, H-, S-, R- are reused here)
**Visual authority:** the five reference screenshots, interpreted as a design system (not copied)
**Stack context:** React web application, role-based (Admin, Faculty, Student). Responsive web only; no native mobile app.

> **Scope guard.** The references contain features that do not exist in our PID (AI lesson planner, AI quiz builder, premium upsell, "download our mobile app" banner, community, library, homework, messaging, timetable, store/e-commerce data). These are **not** to be built or imitated. Only their *design patterns* are inherited. Every screen below is derived from PID modules: Core Platform, Academics and Enrollment, Attendance and Exams, Finance, HR/Leave/Payroll, Hostel, Analytics/Audit.

---

# 1. Design Philosophy

## 1.1 Visual direction
A **calm, light, structured enterprise interface** with one confident accent color (indigo-blue). Large neutral surfaces, soft tinted background, white rounded cards with hairline borders, small pastel icon chips for semantic categories, and compact pill statuses. Data is the hero; chrome stays quiet.

## 1.2 Emotional feel
Trustworthy (money, grades and hostel allocation are consequential), organised, calm, and capable. A registrar, a lecturer and a first-year student should all feel "this is clearly made for me and I know where I am".

## 1.3 Product personality
Competent, friendly, unshowy. Greets people by name and states what needs attention, but never uses decoration for its own sake. Language is plain ("Pay dues", "Mark attendance"), never jargon-heavy.

## 1.4 Principles
1. **Answer "what needs me now?" first.** Every landing screen leads with actionable items before history.
2. **One system.** Every page is composed from the same shell, cards, tables, forms and status components.
3. **Density with air.** Tables are compact; surrounding cards and sections are generous. Density lives inside containers, whitespace lives between them.
4. **Structure beats ornament.** Hierarchy is created with type weight, grouping and spacing, not extra colors or shadows.
5. **Rules must be visible.** Business rules from the PID (75% attendance, due dates and late fees, bed availability, leave balance) are surfaced *before* the user hits an error.
6. **Authority of the database.** When a DB trigger/procedure rejects an action, the UI shows its reason in plain language, in context.
7. **Role-first design.** Each role gets a purpose-built home and navigation, not a trimmed copy of the admin app.

## 1.5 Managing complexity
- **Progressive disclosure:** summary → list → detail → audit. Advanced filters hide behind "All filters"; secondary row actions hide behind a `⋯` menu.
- **Grouped navigation** (Main menu / Administration style) with expandable module trees.
- **Consistent page anatomy** (title, supporting line, primary action on the right, toolbar, content) so users never relearn a page.
- **Tabs on detail pages** (Overview, Academics, Fees, Hostel…) instead of one long scroll.

## 1.6 Density vs. whitespace
- Dashboards: medium density (6–9 widgets above and below the fold), 16–24 px gaps.
- Tables: high density (44 px rows, 13–14 px text) inside a 12 px-radius container with ample outer padding.
- Forms: low density, single/two-column, grouped into labeled sections.

## 1.7 What makes it feel premium
Consistent 8 px rhythm; one radius family; hairline borders instead of heavy shadows; tabular numerals in all numeric columns; tinted icon chips; precise alignment of avatars/labels/pills; skeletons that match final layout; restrained motion; zero orphan styles.

## 1.8 Visual philosophy derived from the references
| Reference | DNA inherited |
|---|---|
| **Ref 1** (teacher dashboard) | Greeting banner with context line and one primary CTA; row of pastel KPI cards with sparklines; "Quick Links" tile row; right rail with calendar + schedule + reminders; small "View All" links on every widget; notification list with unread dots. |
| **Ref 2** (student result portal) | Solid, simple sidebar + top header with profile (name + program/year); KPI row of five equal cards with tinted icon chips; compact "recent results" table with grade pills; notice list with icon chips; donut with percentage in center and legend with percentages; quick-access grid; calendar with weekend coloring. |
| **Ref 3** (Untitled-UI style nav) | Two-tier navigation: icon rail + expanding section tree with `+`/`−` toggles, indented child list with a connecting rule and bullet on current item; profile popover with shortcuts; headline stat card; search + checkbox table. |
| **Ref 4** (Owlee students list) | The canonical **list page**: title + total count, outlined "Export data" and filled primary "Add" at top-right; filter chips row (select filters + "All filters"); icon toolbar for bulk actions; checkbox table with avatar rows; row action icons + `⋯` menu; footer with "1 to 10 of 2000" and pager; grouped sidebar with section labels and count badges. |
| **Ref 5** (Eduplex) | Friendly greeting headline; card-based "continue" list with circular progress; bar chart with highlighted current bar and tooltip; schedule list with chevrons; compact month calendar with highlighted day; assignments list with status pills (In progress / Completed / Upcoming); `+` quick add buttons; large soft radii. We take its *warmth and card rhythm*, **not** its dark sidebar or lime accent. |

**Common DNA:** soft grey-blue canvas, white cards, 12–16 px radii, hairline borders, tiny status pills, pastel icon chips, uppercase micro-labels for nav groups, blue/indigo as the single action color, and "View all →" micro-links.

---

# 2. Reference Analysis

## 2.1 Layout philosophy
Fixed left navigation + sticky top header + scrolling content canvas. Content composed of **rows of cards on a 12-column grid**: a KPI strip, then a two-thirds/one-third split, then a bottom row of three widgets. Dashboards use a **right rail** (calendar, schedule, reminders) for time-based context (Ref 1, 2, 5). List pages are single-column, full-width tables (Ref 3, 4).

## 2.2 Navigation philosophy
- Persistent sidebar with grouped sections and small uppercase group labels (Ref 4).
- Two modes: full labelled tree and a narrow icon rail (Ref 3).
- Active item = filled pill with high contrast (Ref 2, 4: solid blue/indigo; Ref 3: dark chip in rail; Ref 1: soft tint).
- Expandable parents with nested children, rule line and dot for current child (Ref 3).
- Count badges for pending items (Ref 4 "Assignment 2"; Ref 5 "Notifications 2").
- Logout/profile anchored to bottom (Ref 2, 3).

## 2.3 Sidebar behavior
Collapsible via a dedicated toggle (Ref 4 header arrow; Ref 2 hamburger). Collapsed state shows icons only with tooltips. Hover and active states clear but quiet.

## 2.4 Header behavior
Slim (≈64 px), contains page context (title or breadcrumb), a prominent search field with shortcut hint (`⌘K`), notification bell with numeric badge, optional settings icon, and a profile block (avatar, name, role/program line, chevron).

## 2.5 Grid system
12-column fluid grid, 16–24 px gutters. KPI rows are 4–5 equal columns. Main + rail pattern uses 9 + 3 columns (≈ 70/30).

## 2.6 Card architecture
White surface, 12–16 px radius, 1 px soft border, almost no shadow. Structure: **header row** (title left, "View all"/menu/select right) → **body** → optional footer. KPI card: tinted icon chip left, label small, value large, support text colored, optional sparkline.

## 2.7 Typography hierarchy
Geometric/neutral sans (Inter-like; Ref 5 is more playful but still sans). Large page title (semi-bold, ~24 px), card titles ~15–16 px semi-bold, labels 12 px muted, KPI numbers 28–32 px bold. Greeting uses two weights on one line.

## 2.8 Color usage
Light cool-grey background, white surfaces, **one saturated accent** for primary actions/active nav/charts, and pastel tints (blue, green, violet, amber, rose) *only* in icon chips and soft widget backgrounds. Status colors: green (success/active), amber (pending/medium), red (high risk/overdue), blue (info/in progress).

## 2.9 Spacing
8 px base. 16 px inside compact cards, 20–24 px inside primary cards, 16–24 px between cards, 32 px between page sections.

## 2.10 Border radius
Cards 12–16, inputs/buttons 8–10, pills fully round, large containers 16–20 (Ref 5 uses the largest radii).

## 2.11 Shadows
Nearly flat. A very soft ambient shadow on cards or none; stronger shadow only on popovers (Ref 3 profile menu, Ref 4 row menu, Ref 5 chart tooltip).

## 2.12 Tables
Light header band with small muted uppercase/regular labels and sort carets; checkbox column; avatar+name cell; secondary text muted; fixed-width numeric columns; row action icons right-aligned; subtle row hover and selected-row tint; pager in a footer card (Ref 2, 3, 4).

## 2.13 Charts
Simple and legible: vertical grouped bars with rounded tops and two series (Ref 1), single highlighted bar with tooltip (Ref 5), donut with center KPI and side legend with percentages (Ref 1, 2), sparklines inside KPI cards (Ref 1), circular progress rings in lists (Ref 5). Light axes, no heavy gridlines.

## 2.14 Forms
Not shown directly; inferred conventions: rounded inputs with leading icons (search), selects as outlined chips with chevrons (Ref 4), clear primary/secondary buttons.

## 2.15 Buttons
Primary: filled accent, white text, 8–10 px radius, optional leading `+`. Secondary: white with border and leading icon (Export). Icon buttons: bordered squares with tooltip (Ref 4 "Edit" tooltip). Tertiary text links with arrow ("View All →").

## 2.16 Status badges
Small pills with tinted background and same-hue text: grade pills (A / A+ / B+), priority (High / Medium / Low risk), assignment status (In progress / Completed / Upcoming), "Now" tag, unread dots.

## 2.17 Filters and search
Global search in header; table-level search above lists; filter row of select-chips and an "All filters" entry; chips highlight when active (Ref 4 "Age" focused).

## 2.18 Notifications
Bell with red count badge (Ref 1, 2, 4); in-dashboard notification list with icon chip, title, sub-line, relative time, unread dot (Ref 1).

## 2.19 Calendars
Compact month grid with prev/next arrows, weekday header, today as filled circle in primary, weekends tinted, event dots below dates, with a "Today's schedule" list beneath (Ref 1, 2, 5).

## 2.20 Empty / loading states
Not depicted; infer: same card frames retained, with muted illustration-free messaging and a single call-to-action. Skeletons should reproduce card and table geometry.

## 2.21 Modal / drawer patterns
Popover menus (profile, row actions) with icon + label rows, a danger item in red, and a divider before it (Ref 3, 4). Larger flows use drawers/modals following the same radius and border system.

## 2.22 Responsive behavior
Inferred: sidebar collapses to rail then to overlay; KPI rows wrap 5→3→2→1; right rail drops below main column; tables scroll horizontally or switch to card rows.

---

# 3. Design Tokens

Token names are semantic. Implementation maps them to CSS variables/theme objects; **no raw hex in components**.

## 3.1 Colors

### Brand and action
| Token | Value | Use |
|---|---|---|
| `color.primary` | `#3B4FE0` | Primary buttons, active nav pill, links, selected states, main chart series |
| `color.primary.hover` | `#2F40C4` | Hover |
| `color.primary.active` | `#2634A6` | Pressed |
| `color.primary.subtle` | `#EEF1FE` | Tinted backgrounds (selected row, active tab backgrounds, info chips) |
| `color.primary.subtle-border` | `#D5DBFB` | Borders on tinted surfaces |
| `color.secondary` | `#0F172A` | Deep ink: dark tooltips, avatar fallbacks, strong text on pills, optional dark elements |
| `color.secondary.soft` | `#334155` | Secondary strong text |
| `color.focus-ring` | `#3B4FE0` @ 40% | Focus outline |

### Neutrals
| Token | Value | Use |
|---|---|---|
| `color.bg` | `#F6F7FB` | App canvas |
| `color.surface` | `#FFFFFF` | Cards, sidebar, header, tables |
| `color.surface.muted` | `#F9FAFC` | Table header band, input disabled, inset panels |
| `color.surface.elevated` | `#FFFFFF` + shadow | Popovers, menus, modals, drawers |
| `color.border` | `#E6E8F0` | Default hairline |
| `color.border.strong` | `#D3D7E3` | Inputs, emphasised dividers |
| `color.text.primary` | `#111827` | Titles, values |
| `color.text.secondary` | `#4B5563` | Body, table cells |
| `color.text.muted` | `#8A93A6` | Captions, placeholders, helper text |
| `color.text.inverse` | `#FFFFFF` | On primary/dark |

### Semantic
| Token | Solid | Tint (bg) | Use |
|---|---|---|---|
| `color.success` | `#16A34A` | `#E8F7EE` | Paid, Active, Approved, Eligible, Published |
| `color.warning` | `#D97706` | `#FEF3E2` | Pending, Due soon, Partial, Draft |
| `color.error` | `#DC2626` | `#FDECEC` | Rejected, Overdue, Ineligible, Failed, Blocked |
| `color.info` | `#0EA5E9` | `#E6F5FD` | Informational, In progress, Open |
| `color.neutral` | `#64748B` | `#EEF1F5` | Inactive, Closed, Withdrawn, Vacated |

### Icon-chip tints (category colors, used **only** in icon chips and soft widget backgrounds)
| Family | Chip bg | Icon |
|---|---|---|
| Blue (academic) | `#E8EEFF` | `#3B4FE0` |
| Green (success/people) | `#E5F6EC` | `#16A34A` |
| Violet (exams/results) | `#F0EAFE` | `#7C3AED` |
| Amber (finance/pending) | `#FEF0DC` | `#D97706` |
| Rose (attendance/alerts) | `#FDE8EC` | `#E11D48` |
| Teal (hostel) | `#E0F5F3` | `#0D9488` |

Module → chip family: Academics = Blue, Exams/Results = Violet, Attendance = Rose, Finance = Amber, HR = Green, Hostel = Teal.

### Chart colors (ordered)
`chart.1 #3B4FE0` · `chart.2 #9DAAF5` · `chart.3 #14B8A6` · `chart.4 #F59E0B` · `chart.5 #F43F5E` · `chart.6 #94A3B8`.
Semantic overrides: positive `#16A34A`, negative `#DC2626`, threshold line `#F43F5E` dashed, benchmark `#94A3B8`.

### Status color map
| Status family | Statuses → color |
|---|---|
| Enrollment | Enrolled → success · Withdrawn → neutral · Pending → warning |
| Exam registration | Registered → success · Blocked/Ineligible → error · Open → info · Closed → neutral |
| Results | Published → success · Draft → warning · Processing → info |
| Fees | Paid → success · Partial → warning · Due → info · Overdue → error |
| Leave / Hostel requests | Pending → warning · Approved → success · Rejected → error · Cancelled → neutral |
| Payroll | Draft → warning · Finalized → success |
| Hostel allocation | Active → success · Vacated → neutral |
| Accounts | Active → success · Inactive → neutral · Locked → error |
| Attendance | ≥ 75% → success · 75–80% (at risk) → warning · < 75% → error |

## 3.2 Typography
**Font family:** `Inter` (fallback: system UI sans). **Numerals:** tabular figures for all tables, KPI values, money, and percentages. **Mono** (`JetBrains Mono`/system mono) only for IDs when copy-paste clarity matters (receipt no., Student_ID in detail headers).

| Style | Size / Weight / Line height | Usage |
|---|---|---|
| Display | 32 / 700 / 40 | KPI hero numbers, dashboard stat values |
| Page title | 24 / 600 / 32 | Page H1 (as "Students", with total count caption) |
| Greeting | 24 / 600 / 32 (name in primary or 700) | Dashboard greeting |
| Section heading | 18 / 600 / 28 | Major page sections |
| Card heading | 15 / 600 / 22 | Card titles |
| Body | 14 / 400 / 22 | Default text |
| Body strong | 14 / 600 / 22 | Emphasis |
| Table text | 13 / 400 / 20 | Cells (tabular numerals) |
| Table header | 12 / 500 / 16, muted, slight letter-spacing | Column headers |
| Label | 12 / 500 / 16 | Form labels, field captions |
| Caption | 12 / 400 / 16 | Helper text, timestamps |
| Micro label | 11 / 600 / 16, uppercase, +0.04em | Sidebar group labels ("MAIN MENU") |
| Button | 14 / 500 / 20 (small: 13) | Buttons |
| Navigation | 14 / 500 / 20 | Sidebar items |

## 3.3 Spacing scale (4 px base)
`space.0 0` · `1 4` · `2 8` · `3 12` · `4 16` · `5 20` · `6 24` · `8 32` · `10 40` · `12 48` · `16 64`.
Usage: icon-to-label 8; input padding 12×10; card padding 16 (compact) / 20–24 (standard); card gap 16 (dense), 24 (standard); section gap 32; page padding 24 (desktop), 16 (tablet/mobile).

## 3.4 Border radius
| Token | px | Use |
|---|---|---|
| `radius.xs` | 4 | Checkbox, tooltip |
| `radius.sm` | 8 | Buttons, inputs, selects, small chips, nav items |
| `radius.md` | 12 | Cards, table containers, popovers, banners |
| `radius.lg` | 16 | Modals, drawers (inner), hero cards, large containers |
| `radius.xl` | 20 | Dashboard greeting banner only |
| `radius.pill` | 999 | Badges, status pills, avatars, progress |

## 3.5 Borders
`border.hairline 1 px solid color.border` (cards, tables, dividers) · `border.input 1 px solid color.border.strong` · `border.focus 2 px color.focus-ring` · `border.danger 1 px error@40%`.

## 3.6 Shadows (restrained)
| Token | Value | Use |
|---|---|---|
| `shadow.none` | none | Default cards (rely on border) |
| `shadow.xs` | `0 1px 2px rgba(16,24,40,.04)` | Cards that float over tinted bg, buttons |
| `shadow.sm` | `0 2px 8px rgba(16,24,40,.06)` | Hovered cards, sticky header on scroll |
| `shadow.md` | `0 8px 24px rgba(16,24,40,.10)` | Dropdowns, popovers, tooltips |
| `shadow.lg` | `0 16px 48px rgba(16,24,40,.16)` | Modals, drawers |

## 3.7 Sizing tokens
Control heights: `sm 32`, `md 40` (default), `lg 48`. Icon sizes: 16 (inline), 20 (nav, buttons), 24 (chips), 32 (empty-state). Avatars: 24, 32, 40, 64. Min touch target: 44 px on touch devices.

---

# 4. Layout System

## 4.1 Application shell
```
┌───────────────┬──────────────────────────────────────────────┐
│ Sidebar       │ Header (64)                                  │
│ 248 / 72      ├──────────────────────────────────────────────┤
│               │ Page canvas (bg), padding 24                 │
│               │  ┌ Page header ─────────────────────────┐    │
│               │  └──────────────────────────────────────┘    │
│               │  Content grid (12 col)                       │
└───────────────┴──────────────────────────────────────────────┘
```
- **Sidebar:** 248 px expanded; 72 px collapsed rail; overlay drawer below 1024 px.
- **Header:** 64 px, sticky, white surface, bottom hairline; gains `shadow.sm` on scroll.
- **Canvas:** `color.bg`, scrolls independently; sidebar/header fixed.
- **Content max width:** fluid up to **1440 px** content area, centered on large displays; data tables may extend to 1600 px.
- **Page padding:** 24 px (≥1280), 20 px (768–1279), 16 px (<768).

## 4.2 Grid
12 columns, gutter 24 px (≥1280), 16 px (<1280). Common spans: KPI cards 3/12 (4 per row) or 2.4 (5 per row via 5-col variant); main 8–9/12 + rail 3–4/12; three-up widgets 4/12 each; forms 8/12 centered or two 6/12 columns.

## 4.3 Spacing rules
Card-to-card 16 (dashboard dense rows) / 24 (standard). Between page header and content 24. Between sections 32. Card internal padding 20; compact cards 16.

## 4.4 Layouts by device
| Size | Layout |
|---|---|
| **Large desktop ≥1536** | Sidebar expanded; dashboards show 5-up KPI strip and 9+3 main/rail; tables show all columns. |
| **Standard desktop 1280–1535** | Sidebar expanded; 4–5 KPIs (5 if label allows, else 4+wrap); main/rail 8+4. |
| **Tablet 768–1279** | Sidebar collapsed to rail (icons) by default, expandable as overlay; KPI 2–3 per row; rail widgets move below main; tables hide low-priority columns and gain horizontal scroll; forms single column. |
| **Mobile <768** | Sidebar hidden behind hamburger drawer; header compact (hamburger, title, search icon, bell, avatar); KPIs 2×N or horizontal snap scroll; widgets stack; tables become stacked card rows; drawers/modals become bottom sheets; sticky bottom action bar for primary form actions. |

---

# 5. Navigation System

## 5.1 Sidebar structure
Top: **Product mark + name** and collapse toggle. Below: **Academic term switcher** (current term chip: "Term 2025-26 · Sem 5") that scopes data, shown as a compact card-select (similar to Ref 1's workspace card but functional). Then grouped navigation with micro-labels. Bottom: Help/shortcuts link and the **profile block** (avatar, name, role) opening the profile popover.

States:
- **Default:** icon (20) + label, `text.secondary`.
- **Hover:** `surface.muted` background.
- **Active:** solid `color.primary` pill with white text/icon (leaf item); parent of an active child shows `primary.subtle` background with primary text.
- **Focus:** 2 px focus ring.
- **Badge:** small count pill (warning amber or primary) at right, e.g., pending leave approvals.
- **Collapsed:** icon-only 72 px rail; active shows filled rounded square; tooltips on hover/focus; parents open a flyout menu listing children.
- **Nested:** parents with chevron or `+`/`−`; children indented 16 px with a 1 px vertical rule; the current child has a leading dot (Ref 3).

Icons: single consistent line-icon set, 20 px, 1.5 px stroke. One icon per top-level item; no custom illustrated icons.

## 5.2 Navigation by role (from PID §8.1)

### Admin
**MAIN MENU:** Dashboard
**ACADEMICS:** Students · Courses (Catalog, Curriculum, Offerings) · Enrollment (Records, Individual, Bulk Enrollment)
**ATTENDANCE & EXAMS:** Attendance (Shortage Report, Overrides) · Exams (Exam Management, Registration Monitor) · Results (Processing & Publishing, Course Summaries, Grade Scale)
**FINANCE:** Fee Structures · Fee Assignment · Payments (Ledger, Receipts) · Late Fee Rules · Defaulters · Fee Audit Log
**HR:** Employees · Designations · Leave (Policy, Approvals) · Salary Structures · Payroll (Run, Register)
**HOSTEL:** Hostels & Rooms · Allocation · Requests · Occupancy
**ADMINISTRATION:** Users & Access · Departments · Programs · Terms · Reports · Audit Log · Integrity Status
Footer: Help · Profile.
*Permission sets filter groups: a Finance Admin sees Finance + Reports; Super Admin sees all.*

### Faculty
**MAIN MENU:** Dashboard · My Courses
**TEACHING:** Attendance · Marks Entry · Course Results
**ME:** Leave (Apply, My Leave) · Payslips · Profile

### Student
**MAIN MENU:** Dashboard · My Courses
**ACADEMICS:** Attendance · Exam Registration · Results
**FINANCE:** Fees & Dues · Receipts
**CAMPUS:** Hostel (My Hostel, Requests)
**ME:** Profile

## 5.3 Breadcrumbs
Shown above the page title on detail/edit/nested pages: `Academics / Students / Aarav Mehta`. Last crumb is plain text; previous are links; truncates middle on small screens. Top-level pages show only the title (no crumbs).

## 5.4 Header
Left: hamburger/collapse (as needed) + page context. Center/left-of-right: **Global search** (pill input, magnifier, placeholder "Search students, courses, receipts…", `⌘K` hint). Right: **Term chip** (compact, tablet+), **Notification bell** with red count, optional **Help**, **Profile block**.

### Global search (command palette)
Opens a centered overlay (`radius.lg`, `shadow.lg`). Groups results by type: Pages, Students, Employees, Courses, Receipts (role-filtered). Keyboard: `↑↓` navigate, `Enter` open, `Esc` close. Recent searches shown when empty. Respects RBAC: Students only search their own pages.

### Profile menu (popover, Ref 3)
Header: avatar (with presence-style dot omitted), full name, email, role chip. Items: **View profile**, **Change password**, **Keyboard shortcuts**, divider, **Log out** (danger). Shortcut hints right-aligned in muted text.

### Notification center
Bell → popover/drawer listing recent events (see §13).

## 5.5 Navigation rules
- Active module is always visible and expanded in the sidebar.
- No more than 2 levels of nesting.
- Page-level secondary navigation uses **tabs**, not sidebar nesting.
- The browser title mirrors "Page · ERP Name".

---

# 6. Global Components

General: default control height 40 px; radius `sm` 8; label above field; helper text below in caption; transitions 120–160 ms.

## 6.1 Buttons
| Variant | Appearance | Use |
|---|---|---|
| **Primary** | Filled `primary`, white text, 40 px, padding 16, radius 8, optional leading icon (`+`) | One per view: Add, Save, Pay, Publish |
| **Secondary** | White bg, 1 px `border.strong`, text primary, leading icon | Export, Cancel, Filter |
| **Tertiary / Link** | No bg, primary text, optional trailing `→` | "View all →" |
| **Danger** | Filled `error` (confirm dialogs) or outlined red | Delete, Deactivate, Vacate |
| **Subtle** | `surface.muted` bg | Toolbar utilities |
States: hover darker/tint, active deeper, focus ring, disabled 40% opacity + not-allowed, **loading** (spinner replaces icon, width stays fixed, label retained). Sizes: sm 32 / md 40 / lg 48. Rule: **one primary action per page region**.

## 6.2 Icon buttons
32/36/40 px square, 1 px border (toolbar) or borderless (rows), radius 8, tooltip on hover/focus (dark tooltip, `radius.xs`). Used in table toolbars (edit, assign, delete) and rows (view, `⋯`).

## 6.3 Inputs
40 px height, 1 px `border.strong`, radius 8, padding 12, placeholder `text.muted`. States: hover (border darker), focus (primary border + ring), filled, disabled (`surface.muted`), error (red border + message), success (optional green check). Leading icon slot (search), trailing slot (clear, unit, show-password). Textarea min 96 px. Numeric fields right-aligned with units (₹, %, days).

## 6.4 Select / Combobox
Looks like an input with chevron. List: popover, 8 px padding, max-height 280, selected item with check, keyboard typeahead. **Searchable select** if options > 8 (student, course, offering pickers). **Filter-chip select** variant (Ref 4): outlined pill-like 36 px control with label + value + chevron; highlights with `primary.subtle` when active.

## 6.5 Multi-select
Same as select; selected values shown as removable tags (`radius.sm`, `primary.subtle`); "N selected" summary when > 3; "Select all / Clear" row.

## 6.6 Search field
36–40 px, leading magnifier, `⌘K` hint only in global; table search has clear (×) button, debounced 300 ms, shows result count; searches highlight matches in rows.

## 6.7 Date picker
Input with calendar icon; popover month grid (same visual as dashboard calendar): prev/next arrows, weekday header, today ring, selected filled primary, disabled days muted. Supports typing. Min/max enforced (e.g., leave dates, exam windows).

## 6.8 Date range picker
Two inputs + shared dual-month popover (single month on mobile); range fill `primary.subtle`, endpoints filled primary; presets (This month, This term, Last 30 days) in left column on desktop.

## 6.9 Dropdown / Action menu
Popover `radius.md`, `shadow.md`, 8 px padding, items 36 px with 16 px icon + label; danger item red, preceded by divider (Ref 4). Triggered by `⋯`. Keyboard accessible with arrow keys.

## 6.10 Tabs
Underline tabs for page-level (label 14/500, active primary text + 2 px underline, count badges allowed); segmented/pill tabs for in-card switching (`surface.muted` track, white active thumb with `shadow.xs`).

## 6.11 Cards
White, `radius.md`, hairline border, padding 20. Header: title (card heading) left; right slot for "View all →", select, or `⋯`. Optional footer divider. Hover elevation only if clickable. Variants: **Standard**, **Compact** (16 padding), **Tinted** (`chip family` 6–8% bg for highlighted widgets), **Banner** (`radius.xl`, `primary.subtle` gradient to white).

## 6.12 Stat (KPI) cards
Height ~104–120. Left: 40 px **icon chip** (module tint, radius 12). Right/top: label (12 muted), **value** (28–32 bold tabular), support line (12, colored: success/neutral/error) like "This semester", optional **trend pill** (↑ 4% in success/↓ in error) and optional 56×24 sparkline in module color. Entire card clickable to the detail page when applicable (hover `shadow.sm`).

## 6.13 Tables
See §11.

## 6.14 Pagination
Footer bar inside table card: left summary "1 to 10 of 2,000"; right: first/prev/page-of-N/next/last icon buttons and page-size select (10/25/50/100). Disabled arrows muted. Keyboard accessible.

## 6.15 Filters
Row of filter-chip selects + **All filters** button (opens right drawer with grouped fields), active filter count badge, **Clear** link. Applied filters are also shown as removable chips when ≥ 3 are active.

## 6.16 Badges and status pills
Pill, height 22–24, padding 8 px, 12/500 text, tinted bg + same-hue text, optional 6 px leading dot. **Count badge:** 18 px min circle, red for notifications, primary/amber for nav counts. **Grade pill:** compact, A/A+ green, B blue, C amber, F red.

## 6.17 Tooltips
Dark (`secondary`) bg, white 12 px text, radius 4–6, 8 px padding, max-width 240, delay 300 ms, appears on hover and keyboard focus. Never contains essential-only information.

## 6.18 Alerts (inline)
Full-width within a card/page: tinted bg of semantic color, 1 px tinted border, leading icon, title (600) + message, optional action link and dismiss. Variants info/success/warning/error. Used for rule explanations, e.g., "You are below 75% attendance in 2 courses and cannot register for those exams."

## 6.19 Toasts
Bottom-right (top-center on mobile), 360 px, white card with colored left icon, `shadow.md`, auto-dismiss 5 s (errors persist until closed), stacked max 3, optional Undo/View action.

## 6.20 Modals
Centered, `radius.lg`, `shadow.lg`, width 480 (confirm) / 640 (form) / 880 (wide), backdrop `secondary` @ 40%. Header (title + close), body, footer right-aligned (secondary left of primary). Focus trapped; `Esc` closes unless destructive in-flight.

## 6.21 Drawers
Right-side panel 420 (filters, quick view) / 560 (forms) / 720 (large detail), full height, `shadow.lg`, sticky header and footer with actions. Used for: All filters, create/edit of lightweight entities, request review, receipt preview.

## 6.22 Confirmation dialogs
Modal 440 px with semantic icon chip (warning/danger), concise title, consequence sentence, summary of the target, Cancel + confirm (danger for destructive). High-impact actions (finalize payroll, publish results, vacate bed, deactivate user) require typing nothing extra but must restate *what will happen and whether it can be undone*.

## 6.23 Avatars
Circular, sizes 24/32/40/64; photo or initials on soft tint chosen deterministically from the name; optional status ring. Name+secondary-line pair used in tables (name 14/500, ID 12 muted).

## 6.24 Breadcrumbs
12–13 px, muted links separated by `/`, current page in `text.primary`.

## 6.25 Progress indicators
- **Linear:** 6 px height pill, track `border`, fill primary (or semantic color); label right.
- **Circular ring:** 36–48 px with centered %, stroke 4; used for course completion/attendance mini.
- **Stepper:** numbered steps with connectors for multi-step flows.
- **Spinner:** 16/20/32 px for inline loading.

## 6.26 Charts
See §10.

## 6.27 Calendar
Month calendar widget (compact 7×6 grid): header month/year with prev/next; weekday initials; cells 32–36 px; today filled primary circle; weekends muted-red tint (Ref 2); event dots (1–3) beneath date colored by module; selected date outlined; clicking a date filters the "Upcoming" list below. Full-page calendar variant is not required; the widget feeds from PID dates only (exam dates, registration windows, fee due dates, leave periods, term milestones).

## 6.28 Empty states
Centered within the existing card/table frame: 32 px line icon in a tinted chip, headline (15/600), one sentence explanation, one primary action (when the user can act). No decorative illustrations required.

## 6.29 Loading skeletons
Skeleton blocks reproduce the final geometry: KPI cards, table rows (avatar circle + two lines), chart frame, list items. Shimmer 1.2 s, subtle (`surface.muted` ↔ `border`). Skeleton replaces content region only; header and filters stay interactive where meaningful.

## 6.30 Error states
Inline within the failing region: warning icon chip, "Couldn't load {thing}", a short reason, **Retry** button, and a muted error reference ID. Page-level 403/404/session-expired use full-canvas centered layout (see C-13).

---

# 7. Dashboard Design

Common structure for all three role dashboards (C-02, C-03, C-04):
1. **Page header row** (title "Dashboard" + date/term chip, quick primary action on the right where appropriate).
2. **Greeting banner** (`radius.xl`, `primary.subtle` soft gradient): "Good morning, *Name* 👋" in two weights, a one-line context ("You have 3 sessions to mark today and 2 approvals pending"), and **one** primary CTA button. No mascot or stock imagery. Optional subtle abstract line art on the right at ≥1280 px. Height 128–144.
3. **KPI strip** (4–5 stat cards).
4. **Priority row:** the single most important actionable widget (what needs attention).
5. **Analytics row:** one or two charts.
6. **Lists row:** recent activity, notifications, and a quick-links tile row.
7. **Right rail** (≥1280): calendar → upcoming dates → reminders.

Above the fold at 1440×900: banner, KPI strip, and priority row begin. Visual priority: (1) greeting+CTA, (2) KPI strip, (3) priority actionable list, (4) charts, (5) rail.

## 7.1 Admin Dashboard (C-02)
| Zone | Widget | Spec |
|---|---|---|
| Banner | Greeting + context: pending leave requests, pending hostel requests | CTA: **Review approvals** |
| KPI strip (5) | **Active students** (blue) · **Active enrollments** (violet) · **Fees collected vs due** (amber, shows % collected) · **Hostel beds available** (teal) · **Students below 75% attendance** (rose, red when > threshold) | Each with sparkline/trend where data exists; clickable. |
| Priority row (8/12) | **Needs attention** table-card: Pending leave requests, pending hostel requests, blocked exam registrations today, overdue fee accounts. Each row: icon chip, count, "Review →" | Tabbed by type (segmented). |
| Priority row (4/12 within main) | **Fee collection** donut: Paid / Partial / Due / Overdue with center % collected | Legend with amounts. |
| Analytics row | **Collection trend** (line/bars, monthly this term vs previous) · **Enrollment by department** (horizontal bars) | 6/12 each. |
| Lists row | **Recent activity** (audit-backed: fee structure change, payroll run, results published) · **Hostel occupancy** (stacked bars per hostel) · **Quick links** tile row (Add Student, Bulk Enrollment, Fee Assignment, Run Payroll, Allocate Room, Reports) | 4/12 each; quick links are chip-icon tiles (Ref 1, 2) with "Customize" omitted. |
| Rail | **Calendar** (exam dates, fee due dates, term milestones) · **Upcoming** list · **Alerts** (e.g., payroll for month not yet run, term ends in 7 days) | |

## 7.2 Faculty Dashboard (C-03)
| Zone | Widget |
|---|---|
| Banner | "Good morning, Prof. *Name*" · "You have N sessions to mark today and M mark-entry tasks due" · CTA **Mark attendance** |
| KPI strip (4) | **My offerings** (blue) · **Students across offerings** (green) · **Pending marks entry** (violet) · **Leave balance** (green; days remaining by type) |
| Priority row | **Today: sessions to mark** list (offering, section, time slot if present in data, status pill "Pending / Marked", button **Mark**) — derived from offerings and attendance sessions, not a timetable module |
| Analytics row | **Attendance by offering** (grouped bar: average % vs 75% threshold line) · **Result snapshot** (donut/histogram of grade distribution for the latest published offering) |
| Lists row | **Students below 75%** (top 5 across offerings, red risk pills) · **Recent leave activity** · **Latest payslip** summary card (month, net pay, "View payslip →") |
| Rail | Calendar (exam dates for own offerings, leave periods) · Upcoming (marks deadlines) · Reminders |

## 7.3 Student Dashboard (C-04)
| Zone | Widget |
|---|---|
| Banner | "Good morning, *Name*" · "CGPA 8.45 · 87% attendance · ₹12,500 due" (live) · CTA depends on state: **Pay dues** if overdue, otherwise **View results** |
| KPI strip (5, like Ref 2) | **CGPA** (blue) · **Courses enrolled** (green) · **Attendance (overall)** (rose) · **Dues outstanding** (amber) · **Hostel** (teal, "Block-Room" or "Not allocated") |
| Priority row | **Exam registration** card: per enrolled course eligibility chip (Eligible / Ineligible – attendance 68%) with **Register** CTA, and registration window countdown |
| Left main row | **Recent results** compact table (course, exam, grade pill, score, date) with "View all results" · **Attendance by course** horizontal bars with 75% marker |
| Lower row | **Fees & dues** mini-list with due dates and status pills + **Pay** · **Quick access** grid (My Results, My Courses, Attendance, Fees, Receipts, Hostel Request) · **Performance overview** donut (grade distribution of own courses) |
| Rail | Calendar (exam dates, fee due dates, registration windows) · Upcoming list · Notifications |

## 7.4 Dashboard rules
- Max **9** widgets above/below the first scroll on desktop; no widget without a clear action or insight.
- Every widget has a "View all →" or clickable destination.
- Alerts are factual and rule-based (attendance <75%, overdue dues), never decorative.
- Dashboard widgets load independently (skeleton per widget); a failed widget shows its own error state without breaking the page.

---

# 8. Every Frontend Page

## 8.0 Page templates and shared defaults

All pages are built from a small set of templates. **Unless a page states otherwise, these defaults apply** to Layout, Loading, Empty, Error and Responsive behavior.

| Template | Anatomy |
|---|---|
| **T-DASH** | Dashboard (§7) |
| **T-LIST** | Breadcrumb (if nested) → Title + count caption + right actions (Export data secondary, Add primary) → Filter row (search, filter chips, All filters, bulk-icon toolbar when rows selected) → Table card with footer pager |
| **T-DETAIL** | Breadcrumb → Header card (avatar, name, ID, status pills, actions) → Tabs → tab content in cards (key facts, tables, activity) |
| **T-FORM** | Breadcrumb → Title → centered 8/12 form column with sectioned cards; sticky footer bar with Cancel / Save (and Save draft where applicable) |
| **T-DRAWER-FORM** | List page + right drawer (560) for create/edit lightweight entities |
| **T-WIZARD** | Stepper header → step card → sticky footer (Back / Next / Confirm) |
| **T-WORKSPACE** | Tool-like page (e.g., mark attendance, marks entry): context bar (offering/exam selectors) → editable grid → sticky save bar |
| **T-REPORT** | Title + parameters bar (filters) → summary KPIs → chart(s) → data table → export |
| **T-CONFIG** | Stacked section cards or list with inline row edit + Add drawer |
| **T-AUTH / T-STATUS** | Full-canvas centered cards |

**Shared states**
- **Loading:** skeletons matching the template (KPI/table rows/cards); table keeps header and filters; buttons disabled while loading.
- **Empty (no data ever):** frame + icon chip + "No {items} yet" + primary action (if permitted). **Empty (no results for filters):** "No results match your filters" + **Clear filters** link.
- **Error:** region-level error state with Retry; failed actions show toast + inline field errors; business-rule rejections show an inline **alert** with the reason from the backend (e.g., "Registration blocked: attendance 68% is below 75%").
- **Responsive:** desktop per §4; tablet hides low-priority columns, filter row wraps, rail widgets stack; mobile converts tables to stacked cards, forms single-column with sticky action bar, drawers become bottom sheets, wizards show compact step indicator "Step 2 of 4".
- **Interaction baseline:** row click opens detail (or quick-view drawer); `⋯` hosts secondary actions; destructive actions need confirmation; successful saves show toast and return to list or stay with "Saved" state; unsaved changes prompt on exit.

Each page below lists only what is specific. Fields marked **Role** state who uses it.

---

## 8.1 M1 Core Platform

### C-01 Login
- **Purpose:** secure entry. **Primary user:** all roles.
- **Layout (T-AUTH):** centered 420 px card on `bg`; product mark, "Sign in to your account", fields, primary full-width button. Optional split layout ≥1280 with a calm brand panel (tinted, abstract, no stock photos).
- **Forms:** Username/email, Password (show/hide), "Forgot password?" link only if supported by backend (otherwise "Contact administrator").
- **Actions:** Sign in. **Status:** inline error alert for invalid credentials, inactive account, or locked account (with unlock guidance, no sensitive detail).
- **States:** loading button; error alert; session-expired variant message at top.
- **Responsive:** card full-width with 16 px margin on mobile. **Interaction:** Enter submits; success redirects to role dashboard; focus starts in the first field.

### C-02 / C-03 / C-04 Dashboards
Specified in §7. Role-specific. Skeleton per widget; per-widget errors.

### C-05 My Profile / Change Password
- **Purpose:** view personal info, edit allowed contact fields, change password. **User:** all.
- **Layout (T-DETAIL light):** header card (avatar 64, name, ID in mono, role chip, program/department chip) → tabs: **Overview**, **Security**.
- **Overview cards:** Personal details, Contact (editable inline), Academic/Employment summary (read-only).
- **Security tab:** change-password form (current, new with strength meter + rule checklist, confirm) and last-login info.
- **Actions:** Edit contact (inline → Save/Cancel), Update password. **States:** field-level validation; success toast.
- **Responsive:** tabs scroll horizontally. **Interaction:** password change signs out other sessions only if backend supports; otherwise toast confirms.

### C-06 User Management (T-LIST + drawer)
- **Purpose:** manage accounts. **User:** Admin.
- **Table:** User (avatar+name+email), Linked record (Student/Employee ID), Role chip, Admin scope tags, Status pill, Last login, actions.
- **Filters:** Role, Status, Department, Admin scope; **Search:** name/ID/email.
- **Actions:** Add user (drawer), Activate/Deactivate (bulk), Reset password (row), Export data.
- **Form (drawer):** Link to person (searchable student/employee), Username/email, Role, Admin scopes (checkbox group visible only when role = Admin), Temporary password option.
- **Interactions:** deactivate → confirm dialog stating the user loses access; reset password → confirm + one-time display toast.

### C-07 Roles & Permissions (T-CONFIG)
- **Purpose:** view three roles and assign admin permission sets. **User:** Super Admin.
- **Layout:** left list of roles (Admin, Faculty, Student) → right panel showing role summary and, for Admin, a matrix of permission sets × admins.
- **Components:** matrix table with checkboxes; "Who has this scope" avatars list. Faculty/Student roles read-only with a "System role" tag.
- **Actions:** Save changes (sticky bar), Discard. **Safeguard:** cannot remove the last Super Admin (inline alert).

### C-08 Department Management (T-DRAWER-FORM)
- **Table:** Code, Name, Head, #Programs, #Courses, #Employees, Status. **Filters:** Status. **Search:** name/code.
- **Form:** Code, Name, Head (employee select). **Actions:** Add, Edit, Deactivate (blocked with explanation if active dependants exist).
- **Empty:** "No departments yet. Create one to start organising programs."

### C-09 Program Management (T-DRAWER-FORM)
- **Table:** Program, Department, Duration, Credits required, #Students, Status. **Filters:** Department, Status.
- **Form:** Name, Department, Duration (years/semesters), Credits required.
- **Interaction:** row click opens program detail drawer with curriculum summary link to A-02.

### C-10 Academic Year / Term Management (T-CONFIG)
- **Layout:** timeline-style list of terms (cards) with Current term highlighted (primary subtle + "Current" pill). 
- **Form:** Year, Term label, Start date, End date, Registration/exam windows (if modeled), **Mark as current**.
- **Safeguards:** only one current term; changing it shows a confirmation explaining effects (dashboards, enrollment scope).
- **Status:** Upcoming (info), Current (success), Closed (neutral).

### C-11 Student Master
- **List (T-LIST, Ref 4 reference):** Title "Students" + "Total: 2,000"; **Export data** + **Add student**. Toolbar chips: Program, Department, Batch/Year, Status, **All filters**. Bulk icon toolbar (Edit, Assign/Enroll, Deactivate) appears when rows selected.
- **Table columns:** checkbox · ID (mono) · Student (avatar+name+email) · Program · Year · CGPA · Attendance % (mini bar + pill) · Dues (amount, red if overdue) · Status · actions (view, `⋯`: Edit, Enroll in courses, Allocate hostel, Deactivate).
- **Search:** name, Student_ID, email.
- **Create/Edit (T-FORM):** sections **Identity** (name, DOB, gender, photo), **Contact** (email, phone, address), **Academic** (program, batch, year, admission date), **Guardian** (if modeled). Student_ID is generated and shown read-only with explanation of the format.
- **Detail (T-DETAIL):** header card with avatar, name, Student_ID, program, status pills; tabs: **Overview, Academics (enrollments, attendance, results/CGPA), Fees, Hostel, Activity**.
- **Empty:** "No students yet" with Add student and Bulk enrollment links. **Responsive:** columns collapse to ID, Student, Status on mobile.

### C-12 Faculty/Staff Master
Same as H-01 (single implementation, linked from both nav groups).

### C-13 Unauthorized / Not Found / Session Expired (T-STATUS)
- Centered card with icon chip, headline, short explanation, primary action ("Go to dashboard" / "Sign in again"). 403 mentions the role without exposing permissions detail. No illustrations required.

---

## 8.2 M2 Academics & Enrollment

### A-01 Course Catalog (T-LIST + drawer)
- **Table:** Code (mono), Title, Department, Credits, Type (Core/Elective pill), #Offerings (current term), Status.
- **Filters:** Department, Type, Credits, Status. **Search:** code/title.
- **Form (drawer):** Code (unique, validated live), Title, Credits, Department, Type, Description.
- **Actions:** Add course, Edit, Retire (blocked if active offerings, explained inline).

### A-02 Curriculum Mapping
- **Purpose:** map courses to program-semester. **User:** Admin.
- **Layout:** Program selector at top → **semester columns** (cards per semester) listing course rows with Core/Elective pill and credits; right panel for "Add course to semester" (searchable list).
- **Interactions:** add via button (drag-and-drop optional enhancement, never required); credit total per semester shown in card footer; warning alert when program credit totals do not match "credits required".

### A-03 Course Offerings (T-LIST + drawer)
- **Table:** Course, Term, Faculty (avatar+name), Section, Capacity bar (enrolled/capacity with progress and % pill), Status.
- **Filters:** Term (default current), Department, Faculty, Section, Fill level (Full/Available). **Search:** course/faculty.
- **Form:** Course (searchable), Term, Faculty (searchable, shows load), Section, Capacity.
- **Interaction:** capacity bar turns amber ≥ 90% and red at 100%; row click → offering detail (roster, attendance summary, exams).

### A-04 Individual Enrollment (T-FORM compact / drawer)
- **Form:** Student (searchable with ID), Term, Offering(s) (multi-select showing seats left). **Live validation panel** (right) checking: term open, capacity, duplicate, curriculum mapping, with green/red check rows.
- **Actions:** Enroll (primary), Cancel. **Errors:** rule failures appear in the validation panel and as alert after submit.

### A-05 Bulk Enrollment (T-WIZARD) — flagship workflow
- **Steps:** (1) **Source** — choose *Cohort* (program + semester + term) or *Upload file* (JSON / XML / CSV, drag-drop zone with format hints and downloadable template). (2) **Validate & preview** — summary KPIs (Total rows, Valid, Rejected) and table with row-level status pills and reasons; filter "Show only rejected". (3) **Options** — transaction policy (all-or-nothing vs skip invalid rows, as defined by the team's agreed policy), confirmation checkbox. (4) **Run & result** — progress indicator, then result summary cards (Enrolled, Skipped, Failed) + downloadable error report.
- **Interactions:** Next disabled until the step is valid; leaving mid-flow prompts confirmation; result page links to Enrollment Records filtered by this batch.
- **Errors:** file-format error alert with line/field reference; server rejection reasons per row.
- **Responsive:** step indicator compact; tables scroll.

### A-06 Enrollment Records (T-LIST)
- **Table:** Student, Course, Section, Term, Status pill (Enrolled/Withdrawn), Enrolled on, Batch ref, actions.
- **Filters:** Term, Program, Course, Status, Batch. **Search:** student ID/name, course.
- **Actions:** Withdraw (confirm, reason optional), Export data. **Bulk:** withdraw selected.

### A-07 My Courses (Student; card grid + list toggle)
- **Layout:** header "My Courses" with term selector; **card grid** (Ref 5 course-card rhythm): Course title, code, credits, faculty (avatar), attendance ring with %, latest grade pill, "View" link.
- **Detail drawer/page:** course info, faculty, attendance sessions summary, marks and exam registration status for that course.
- **Empty:** "You're not enrolled in any courses this term."

### A-08 My Teaching / Course Roster (Faculty)
- **Layout:** offerings as cards (course, section, enrolled count, avg attendance ring, next exam date) → click opens **roster table** (Student, ID, Attendance %, Marks status, flags) with search and filters (Below 75%).
- **Actions:** Mark attendance (jump to E-01), Enter marks (jump to E-08), Export roster.

---

## 8.3 M3 Attendance & Examinations

### E-01 Mark Attendance (T-WORKSPACE)
- **Purpose:** record a session quickly and accurately. **User:** Faculty (Admin override).
- **Layout:** Context bar: Offering select, Date picker (default today), Session/slot select, summary pills (Total, Present, Absent). Below: roster table with avatar+name, ID, running attendance % (pill; red < 75%), and a **Present/Absent segmented toggle** per row (default Present). Sticky footer: "Mark all present", "Mark all absent", **Save attendance**.
- **Status:** Already-marked session shows "Editing existing session" info alert.
- **Interactions:** keyboard: `P`/`A` on focused row, `↓` next; toggles update counts live; Save → success toast with counts; duplicate session conflict shown inline.
- **Responsive:** rows as compact cards with large toggles (≥44 px).

### E-02 Attendance History / Edit Session (T-LIST)
- **Table:** Date, Offering, Section, Present/Absent counts, % present bar, Marked by, Status. **Filters:** Offering, Date range, Marked by. **Actions:** View/Edit session (opens E-01 prefilled), Export. Edit window rule shown in alert if locked.

### E-03 My Attendance (Student)
- **Top:** overall attendance KPI + ring; legend with the 75% rule explained in a single info alert.
- **Main:** **per-course cards/rows**: Course, sessions held, attended, **horizontal bar with 75% marker**, % pill (green/amber/red), eligibility chip (Eligible / At risk / Ineligible for exams). Row expands to a session-by-session mini calendar or list (Present/Absent pills).
- **Chart:** bar chart across courses with threshold line.
- **Empty:** "No attendance recorded yet."

### E-04 Attendance Shortage Report (T-REPORT)
- **Parameters:** Term, Department, Program, Course, threshold (default 75%).
- **KPIs:** Students below threshold, Courses affected, Average shortage.
- **Table:** Student, Course, Held, Attended, %, Gap to 75% (classes needed), actions (View student).
- **Chart:** bar of shortage counts by course. **Export:** CSV. Faculty view limited to own offerings.

### E-05 Exam Management (T-LIST + drawer)
- **Table:** Exam, Course/Offering, Type, Date, Max marks, Registration window, Registered count, Status pill (Draft/Open/Closed/Marks entry/Published).
- **Form:** Offering, Type, Date, Max marks, Registration open/close dates.
- **Actions:** Create exam, Open/Close registration (confirm), Edit. **Rule:** edit locked after marks exist (explained).

### E-06 Exam Registration (Student)
- **Purpose:** register without surprises. 
- **Layout:** top info alert with window and rule; **eligibility summary** (X of Y exams eligible). List of exam cards: course, exam type/date, attendance % and eligibility chip, status (Open/Registered/Blocked/Closed), **Register** primary button (disabled with tooltip + inline reason when ineligible).
- **Interactions:** Register → confirmation dialog listing selected exams; **if the database rejects**, the card shows an error alert: "Not registered: attendance 68% < 75%." Success shows "Registered" pill and toast.
- **Bulk:** "Register for all eligible" action with preview.

### E-07 Exam Registration Monitor (T-LIST/REPORT)
- **KPIs:** Registered, Blocked attempts, Eligible not registered. **Table:** Student, Exam, Attendance %, Status, Timestamp, Reason (for blocked). **Filters:** Exam, Course, Status, Date. **Chart:** registrations over time per exam. **Export:** CSV.

### E-08 Marks Entry (T-WORKSPACE)
- **Context bar:** Offering, Exam; progress "Entered 42/60", state pill (Draft/Submitted).
- **Grid:** Student, ID, Marks input (numeric, max displayed, red on violation), Absent/Not-eligible flags, remark. Keyboard-first (Tab/Enter advance). Row validation inline.
- **Actions:** Save draft, **Submit** (confirm: cannot edit after publish). Import marks (CSV) as secondary.
- **Responsive:** row cards with big numeric field.

### E-09 Result Processing & Publishing (T-WIZARD/REPORT)
- **Steps:** Select term & scope → **Validation checklist** (marks complete, grade scale present, pending exams) with green/red rows → **Preview** (grade distribution chart, pass %, table of computed grades/SGPA) → **Publish** (confirm dialog; irreversible except via audited revision).
- **Status:** Draft/Processing/Published. **Errors:** blocking issues listed with links to fix.

### E-10 My Results / Grade Card (Student)
- **Header:** term selector, **CGPA card** and **SGPA card**, credits earned.
- **Main:** results table (Course, Credits, Exam type, Marks, Grade pill, Grade points) grouped by term; **trend chart** (SGPA per term line) and grade-distribution donut.
- **Actions:** Print/Download grade card (print-optimized view). **Empty:** "Results will appear once published."

### E-11 Grade Scale & Credit Configuration (T-CONFIG)
- **Layout:** editable table: Marks range (from–to), Grade, Grade points, Pass flag; credit rules card. Inline validation prevents gaps/overlaps (shows a visual range bar).
- **Actions:** Save, Reset (confirm). Lock banner if results are published.

### E-12 Course Result Summary (T-REPORT)
- **KPIs:** Pass %, Average, Highest, Lowest. **Chart:** grade distribution bars. **Table:** student rank list with grade pills (ranking via report). **Filters:** Term, Course, Section. Faculty: own offerings.

---

## 8.4 M4 Finance & Fees

### F-01 Fee Structure Management (T-LIST + drawer)
- **Table:** Program, Term, Components (count + total), Due date, Version, Status. Row expands to components.
- **Form:** Program, Term, Due date, **Components repeater** (name, amount, mandatory), live **total** card.
- **Interaction:** editing amounts shows a **"This change is audited"** info note and a diff preview (old → new) before save (links to F-10).

### F-02 Fee Assignment / Invoice Generation (T-WIZARD)
- Steps: **Scope** (single student / cohort by program, term) → **Preview** (students count, total amount, any already-assigned skipped) → **Generate** → **Result**. Warnings for duplicate assignments.

### F-03 Late Fee Rule Configuration (T-CONFIG)
- Rule card: type (flat / per-day), amount/percentage, grace days, cap; **live example calculator** ("If paid 10 days late on ₹50,000 → ₹X"). Save with audit note. Status pill Active/Inactive.

### F-04 My Fees and Dues (Student)
- **Top KPIs:** Total payable, Paid, Outstanding, Late fee accrued (amber/red).
- **Main:** dues table (Component, Term, Amount, Due date, Late fee, Paid, Balance, Status pill) with checkboxes; selected-total bar docked at the bottom with **Pay selected**.
- **Alerts:** overdue alert with total late fee. **Empty:** "No dues. You're all clear." with success tint.

### F-05 Pay Fee (T-WIZARD, 3 steps)
1. **Select dues** (pre-selected from F-04, editable amounts if partial allowed). 2. **Review & mode** (breakdown: base, late fee, total; payment mode radio cards). 3. **Confirm** (summary, "Pay ₹X"). Processing state locks UI with spinner, prevents double-submit; failure shows retry with preserved selection.
- **Admin on behalf:** same flow with a student picker first and a "Recorded by" note.

### F-06 Payment Confirmation & Receipt
- **Layout:** success banner (green tint) with check icon, amount, receipt number (mono, copy button), date, mode; **receipt document view** (print-friendly white sheet with institution header, student details, line items, totals, receipt no.).
- **Actions:** Print, Download PDF, Back to fees.

### F-07 Receipt / Payment History (T-LIST)
- **Table:** Receipt no., Date, Amount, Mode, Items, Status. **Filters:** Date range, Mode, Term. Row → F-06 view. Student sees own; Admin sees filtered per student.

### F-08 Payment Ledger (T-LIST + summary)
- **KPI strip:** Collected today, This month, Outstanding, Reversals (if any). **Table:** Receipt, Student, Program, Amount, Mode, Date, Recorded by, Status. **Filters:** Date range, Program, Term, Mode, Status. **Search:** receipt/student. **Export:** CSV with totals row.

### F-09 Fee Defaulters
- **Parameters:** Term, Program, Minimum outstanding amount, Overdue days. **KPIs:** Defaulters, Total outstanding, Oldest overdue. **Table:** Student, Program, Outstanding, Overdue days, Late fee, last payment, actions (View student, Record payment). **Chart:** outstanding by program. **Export.**

### F-10 Fee Change Audit Log (T-LIST, read-only)
- **Table:** Timestamp, Changed by, Entity (Fee structure/Component), Field, Old value → New value (diff styling: red strike/green), Reason/Context.
- **Filters:** Date range, User, Entity. **Row click:** drawer with full record. No edit actions; clear "Read-only record" caption.

---

## 8.5 M5 HR, Leave & Payroll

### H-01 Employee / Faculty Master
- **List:** columns Employee (avatar+name), ID, Department, Designation, Type (Faculty/Staff), Joining date, Status, actions. **Filters:** Department, Designation, Type, Status. **Search:** name/ID.
- **Create/Edit (T-FORM):** Personal, Employment (department, designation, type, joining date), Account link, Salary structure link.
- **Detail (T-DETAIL):** tabs **Overview, Teaching (offerings), Leave, Payroll, Activity**.

### H-02 Designation Management (T-DRAWER-FORM)
- Table: Title, Level, #Employees, Status. Form: Title, Level. Deactivate blocked when employees assigned.

### H-03 Leave Types & Policy (T-CONFIG)
- Cards per leave type: name, annual entitlement, carry-forward rule, applicability. Add/Edit drawer. Info note: "Balances are calculated from entitlement minus approved leave."

### H-04 Apply for Leave (Faculty, T-FORM compact)
- **Form:** Leave type (select shows **remaining balance** under each option), Date range (picker, shows computed days), Reason, optional attachment if supported.
- **Live panel:** balance before → after; overlap check. **Blocking alert** if balance insufficient or overlap. **Actions:** Submit, Cancel.

### H-05 My Leave (Faculty)
- **KPIs:** balance per leave type (ring or number cards). **Table:** Type, Dates, Days, Status pill, Decision remark. **Actions:** Apply leave, Cancel pending (confirm). Chart: leave taken by month (small bar).

### H-06 Leave Approvals (Admin)
- **Table (T-LIST):** Employee, Type, Dates, Days, Balance impact, Overlap flag, Submitted, Status. **Segmented tabs:** Pending (count) / Approved / Rejected.
- **Review (drawer):** employee summary, balance table, calendar of colleague leave in the department, **Approve / Reject** with remark (required on reject). Bulk approve for simple cases with confirmation.

### H-07 Salary Structure Management (T-LIST + drawer)
- Table: Name/Designation, Components (earnings, deductions), Gross, Status. Form: component repeater (earning/deduction, fixed/percentage), live gross/net preview. Audit notice on change.

### H-08 Payroll Run (T-WIZARD)
- **Steps:** (1) **Month selection** (shows run status; block if finalized) → (2) **Pre-checks** (employees included, leave adjustments, missing salary structures with links) → (3) **Run & review** (KPIs: total gross, deductions, net; table per employee with expandable breakdown; flagged rows) → (4) **Finalize** (confirm dialog: immutable after finalize).
- **Status:** Draft (warning) / Finalized (success). **Actions:** Re-run (only before finalize), Finalize, Export.

### H-09 Payroll Register (T-REPORT)
- Parameters: Month, Department. KPIs: Net payout, Gross, Deductions, Headcount. Chart: payout by department (bar). Table with totals row. Export.

### H-10 My Payslips (Faculty)
- **List:** month cards/rows with net pay and status; clicking opens a **payslip document view** (earnings, deductions, net, leave adjustments) with Print/Download. Latest payslip highlighted.

---

## 8.6 M6 Hostel

### S-01 Hostel & Room Management
- **Layout:** left list of hostels (cards with total beds, occupied %, ring) → right **room table** (Room no., Bed capacity, Occupied, Available, Status) or room grid view with occupancy chips. **Forms (drawers):** Hostel (name, type/gender, capacity), Room (number, capacity). **Filters:** Hostel, Availability (Full/Available/Empty). Deactivate room blocked if allocated.

### S-02 Room Allocation
- **Purpose:** allocate or vacate with live bed counts.
- **Layout:** two-pane: **Student picker** (search; shows current allocation status) and **Room picker** (hostel filter → rooms with available-bed chips). Footer summary: "Student → Hostel-Room (Beds left after: N)". **Actions:** Allocate (primary), Vacate (separate tab/flow, confirm).
- **Errors:** inline reason when no beds or student already allocated. **After success:** toast + refreshed bed counts (confirm that availability changed).

### S-03 Hostel Occupancy Dashboard (T-REPORT)
- KPIs: Total beds, Occupied, Available, Occupancy %. Charts: stacked bar per hostel (occupied/available), room-fill distribution. Table by hostel/room with drill-down. Threshold alert when a hostel > 95% full.

### S-04 My Hostel (Student)
- Card: Hostel, Room, Bed, From date, Warden/contact if modeled, status pill. Actions: Raise request (room change / vacate). **Empty:** "You don't have a hostel allocation" with **Request hostel** button.

### S-05 New Hostel Request (Student, T-FORM compact)
- Fields: Request type (Allocation / Room change / Vacate — radio cards), Preferred hostel (optional), Reason/notes, Effective date. Shows current allocation context. Submit → confirmation toast and redirect to S-06.

### S-06 My Hostel Requests (Student)
- Tracker list: request card with type, submitted date, **status stepper** (Submitted → Under review → Approved/Rejected → Allocated), admin remark. Filter by status. Cancel pending request (confirm).

### S-07 Hostel Request Review (Admin)
- **Table (T-LIST):** Student, Type, Hostel pref, Submitted, Status. Tabs: Pending/Approved/Rejected. **Review drawer:** student summary, current allocation, availability snapshot, Approve (with **Proceed to allocate** shortcut to S-02), Reject (remark required).

---

## 8.7 M7 Analytics & Audit

### R-01 Reports Hub
- **Layout:** search + category tabs (Academic, Attendance, Finance, HR, Hostel); **report cards** grid (icon chip by module, title, one-line description, "Open"). Includes ranking, attendance, fee, payroll, leave, pass-percentage and occupancy reports from the PID.
- **Access:** cards filtered by permission set; Faculty sees only own-course reports.

### R-02 Report Pages (T-REPORT) — shared spec
Applies to every report: **Parameters bar** (term, department/program, date range, thresholds as relevant) with **Apply** and **Reset**; **KPI strip** (2–4 summary metrics); **Primary chart** (type per §10); **Data table** (sortable, paginated, totals row where meaningful); **Export** (CSV, Print view). Shows "Last generated at" caption and a **Refresh** icon button. Examples and their charts:
| Report | Primary visual |
|---|---|
| Department-wise CGPA ranking | Ranked table with rank column and medal-free numeric badge; top-N bar |
| Top N students per program per term | Horizontal bars |
| Courses with low average attendance | Bars with 75% threshold line |
| Fee collection summary / defaulters | Stacked bars + donut |
| Students above average dues | Table with comparison-to-average bar |
| Hostel occupancy | Stacked bars |
| Payroll summary | Bars by department |
| Faculty leave utilisation | Bullet/progress bars (used vs entitlement) |
| Course pass percentage and grade distribution | Distribution bars |
| Exam registration ineligible list | Table + KPI |
**Empty:** "No data for these parameters." **Error:** retry + reduce date range hint for heavy queries. **Loading:** KPI + chart + table skeletons.

### R-03 System Audit Log Viewer (T-LIST)
- Table: Timestamp, Actor (avatar+name+role), Action, Entity, Summary, Source module chip. **Filters:** Date range, Actor, Module, Entity type, Action. Row → drawer with before/after JSON-like readable diff. Read-only, no delete actions. Export.

### R-04 Data Integrity / Integration Status
- **Layout:** summary KPIs (Checks passed / Warnings / Failed) → grouped **check list** by module (e.g., "All enrollments reference existing students", "ID format consistency", "Bed counts match allocations") with pass/warn/fail pills, last run time, **Run checks** button. Failed check expands to affected record counts and sample rows with deep links. Intended for Team Leaders and Super Admin.

---

# 9. Role-Based Experience

## 9.1 Admin
- **Sees:** institution-wide state; permission sets shape which modules are present. Dashboard prioritizes **approvals and exceptions**: pending leave/hostel requests, overdue fees, attendance shortages, payroll due.
- **Navigation:** full grouped tree (§5.2). Counts on Approvals, Requests.
- **Key workflows:** term setup → offerings → bulk enrollment → fee assignment → payments oversight → results publishing → payroll run → hostel allocation → reports/audit.
- **Emphasis:** totals, trends, exceptions, audit trails. Dense tables and filters.
- **Restricted:** Finance Admin does not see payroll/HR pages, etc. Super Admin only for roles/permissions and integrity.

## 9.2 Faculty
- **Sees:** only own offerings, rosters, marks, own leave, own payslips. Dashboard prioritizes **today's teaching tasks** (sessions to mark, marks pending) and **at-risk students**.
- **Navigation:** compact (My Courses, Attendance, Marks Entry, Course Results, Leave, Payslips).
- **Key workflows:** mark attendance (fast, keyboard-friendly), enter marks, review course results, apply for leave.
- **Emphasis:** speed for repetitive tasks; roster clarity; threshold flags.
- **Hidden:** other faculty's data, finance, hostel, institution-wide reports, student fee details.

## 9.3 Student
- **Sees:** own academic progress, eligibility, dues, hostel. Dashboard prioritizes **"what do I need to do?"**: register for exams, pay dues, check attendance risk; and **"how am I doing?"**: CGPA, results, attendance.
- **Navigation:** short, friendly (Dashboard, My Courses, Attendance, Exam Registration, Results, Fees & Dues, Receipts, Hostel, Profile).
- **Key workflows:** check attendance → register for exams → view results → pay fees/download receipt → raise hostel requests.
- **Emphasis:** clarity, reassurance, explicit reasons for blocked actions; larger cards, fewer tables, more explanation.
- **Hidden:** all admin/HR data, other students, internal audit information.

**Rule:** role experiences share components and tokens but differ in information architecture, dashboard composition, language ("My…" prefix for self-service) and default density.

---

# 10. Data Visualization

## 10.1 Principles
Charts answer a question; each has a title that states it, a primary insight, and a way to view exact numbers. Prefer tables when exact values matter; prefer charts when comparison, trend, or proportion matters.

## 10.2 Chart styles
- **Bar (vertical, grouped):** compare categories (average attendance per course, class vs top performers). Rounded top radius 4, bar width 16–24, gap 8; two series max (primary + `chart.2`). Axes: light `border` gridlines horizontal only; labels 11–12 muted.
- **Horizontal bar:** long labels, rankings, per-department values. Sorted descending.
- **Line:** trends over time (collection trend, SGPA per term). 2 px stroke, round caps, 8 px dots on hover only, soft area fill under single series (primary at 8%).
- **Donut:** part-to-whole with ≤ 5 slices (fee status, grade distribution). Thickness ~18% of diameter, **center KPI** (value + label), side **legend with values/percentages** (Ref 2). Slice gaps 2 px.
- **Stacked bar:** occupancy (occupied vs available), fee status per program.
- **Progress bars/rings:** single metric vs target (attendance %, capacity fill, course progress).
- **Sparklines:** inside KPI cards; no axes, 1.5 px line, end dot.
- **Histogram/distribution:** grade/marks distribution.
- **No** pie with > 5 slices, 3D charts, gauges, radar charts, or dual-axis charts.

## 10.3 KPI cards and trend indicators
KPI value + context line + optional **trend pill**: ↑ green when better, ↓ red when worse; direction color follows *meaning* (lower overdue dues = good = green). Include comparison basis ("vs last term").

## 10.4 Comparison charts
Highlight the relevant series with `chart.1`, comparison/benchmark with `chart.6`; threshold lines (75% attendance) dashed rose with label.

## 10.5 Color semantics
Primary = main subject; teal/amber/rose only when mapped to module or status; semantic green/red only for good/bad. Never use color alone: add labels, patterns or icons.

## 10.6 Tooltips
Dark rounded tooltip (Ref 5): bold value line + muted context line (date/category), follows cursor/hover target, appears on focus for keyboard users. Highlight the hovered bar (accent) and soften others.

## 10.7 Legends
Top or right-aligned, 12 px, dot + label (+ value). Clickable to toggle series where multiple series exist.

## 10.8 Empty and loading
Empty: keep axes frame with centered "No data for this period". Loading: skeleton bars/line placeholders. Partial data: show "Incomplete data" caption.

## 10.9 Entrance
Subtle 400 ms ease-out draw (bars grow from baseline, lines draw, donut sweeps); disabled with reduced motion.

## 10.10 Tables vs charts rule of thumb
- Ranking, compliance lists, financial ledgers → **tables** (with optional mini bar in cell).
- Trends, composition, distributions → **charts** with a "View as table" toggle.

---

# 11. Tables & Data-Heavy Screens

## 11.1 Container and density
Table sits in a card (`radius.md`, hairline border). **Default density: 48 px rows** (comfortable) with **compact option 40 px** toggled via a density icon button. Cell padding 12×16. Text 13–14 px, tabular numerals, right-aligned for numeric/money columns, left for text, center for status only if narrow.

## 11.2 Column hierarchy
1. Selection checkbox (40 px). 2. Identifier (ID, mono, 80–100 px). 3. **Primary entity** (avatar + name + secondary line) — widest, sticky on horizontal scroll. 4. Descriptive attributes. 5. Metrics (right-aligned, with mini bars/pills). 6. Status pill. 7. Actions (sticky right, icon buttons + `⋯`).

## 11.3 Header
`surface.muted` band, 12/500 muted text, sort caret appears on hover and stays on the active sorted column (primary color), tri-state sort (asc/desc/none), resize/reorder not required. Sticky below page header while scrolling (offset 64 px).

## 11.4 Toolbar
Above the table: search, filter chips, **All filters**, active filter count, **Clear**, spacer, density toggle, columns visibility menu (icon), **Export data**. When rows are selected the toolbar swaps to a **selection bar**: "3 selected" + bulk icon buttons (with tooltips) + "Clear selection".

## 11.5 Sorting, filtering, search
Sorting/filtering/search are server-side with URL-synced query params (shareable views). Search debounced; filters apply immediately for selects and on **Apply** within the filters drawer. Persisted view per page per user (last filters/density) optional.

## 11.6 Pagination
Footer inside card (§6.14). Default page size 25; options 10/25/50/100. Total count always visible. Page resets to 1 on filter/sort change.

## 11.7 Bulk selection and actions
Header checkbox: select page; banner offers "Select all N results" for cross-page selection. Bulk actions are limited to safe/idempotent ones per module (deactivate, withdraw, approve) and always confirm with counts.

## 11.8 Row actions
Hover reveals icon buttons (View, primary quick action) and `⋯` menu (Edit, contextual actions, divider, red Delete/Deactivate). Whole-row click opens detail except in selectable/inline-edit contexts; checkbox/buttons stop propagation.

## 11.9 Row states
Hover `surface.muted`; selected `primary.subtle` with left 2 px primary accent; error rows (e.g., rejected import) with `error` tint and message in a sub-row; disabled rows muted.

## 11.10 Cells
Status pills; money with currency symbol and two decimals; dates in a single format (DD MMM YYYY), relative time for recency in activity tables; percentages with mini bar; long text truncates with tooltip; empty cell shows "–" muted.

## 11.11 Responsive
≥1280 full columns; 768–1279 hide tertiary columns (user can restore via column menu) and enable horizontal scroll with sticky first and last columns; <768 render as **stacked cards**: primary line (entity + status), 2–3 key fields, `⋯` action; filters in a bottom sheet.

## 11.12 Empty / loading / error
Empty variants per §8.0. Loading shows 8 skeleton rows with avatar placeholder. Error shows region error with Retry and keeps toolbar.

## 11.13 Export
**Export data** (secondary button, download icon): menu with CSV (current filters), CSV (all), Print view. Toast shows "Preparing export…" then download; large exports run asynchronously with a notification.

## 11.14 Editable grids (attendance, marks)
Inline controls inside cells (segmented toggle, numeric input) with focus ring on the cell; keyboard navigation; unsaved-change indicator (amber dot in header + sticky save bar); validation inline per cell.

---

# 12. Forms & Workflows

## 12.1 Principles
One column by default; two columns only for short related fields; labels above inputs; group fields into titled cards (e.g., Identity, Contact, Academic); defaults pre-filled wherever possible; ask only what the PID needs.

## 12.2 Create / Edit
- **Page forms (T-FORM)** for entities with many fields (student, employee).
- **Drawer forms** for lightweight entities (department, course, offering, designation, hostel).
- Edit = same form prefilled; changed fields subtly marked; **Save** disabled until dirty and valid.

## 12.3 Multi-step forms (T-WIZARD)
Stepper at top (numbered circles, connectors; completed steps show check). Back/Next in a sticky footer. Validation per step; summary/confirmation step before irreversible actions. Used for bulk enrollment, fee assignment, payment, result publishing, payroll run.

## 12.4 Validation
- **Required** fields marked with a subtle asterisk in the label; optional fields say "(optional)" only when the majority are required.
- Validate on blur and on submit; show inline error text (12 px, red, with icon) below the field and focus the first invalid field on submit failure.
- Cross-field and server rules show as **alerts** at the top of the relevant section.
- Live helpers: ID format hints, balance-after calculators, capacity left, seat counts.

## 12.5 Success states
Toast "Saved" plus navigation to the list/detail with the new item highlighted for 2 s (subtle tint fade). For critical outputs (payment, publish, payroll) a dedicated success screen/card with next steps.

## 12.6 Confirmation
Required for: delete/deactivate, vacate, withdraw, publish results, finalize payroll, make term current, record payment on behalf, bulk operations. Dialog states consequence and reversibility.

## 12.7 Save / Cancel behavior
Primary on right, secondary left of it. Cancel with dirty form → "Discard changes?" dialog. Navigating away with unsaved data triggers browser/in-app guard.

## 12.8 Draft states
Marks entry, payroll run and fee assignment support **Draft** (amber pill "Draft", auto-save indicator "Saved just now") before Submit/Finalize. Final states show locked inputs with a lock icon and explanation.

## 12.9 Destructive actions
Red styling, separated in menus by divider, confirmation with explicit target name, and where applicable the dependent-record impact ("12 enrollments will remain as history"). Prefer deactivate over delete.

## 12.10 Double-submit and concurrency
Buttons enter loading state and disable on submit. If the backend returns a concurrency/conflict error (bed taken, capacity reached, already paid), show a clear alert with a **Refresh data** action and keep user input where possible.

## 12.11 Rule-aware forms
Where the PID has database-enforced rules, the form shows the rule beforehand (hint/alert) and presents the backend's rejection message verbatim in a friendly container. Rules: attendance ≥ 75% for exam registration, payment ≤ outstanding, leave days ≤ balance, one active hostel allocation, capacity limits, one finalized payroll per month.

---

# 13. Notifications & Feedback

> Scope note: the PID has no external notification engine. The in-app notification center is a **read-only feed of system events already produced by modules** (e.g., leave decision, hostel request decision, results published, payment receipt issued, exam registration blocked, fee assigned). No email/SMS/push design.

## 13.1 Toasts
Success (3–5 s), info (5 s), warning (7 s), error (persist). Content: bold title + one-line detail + optional action ("View receipt"). Never used for information the user must act on later.

## 13.2 Inline alerts
For persistent context: rule explanations, validation summaries, locked states, overdue notices. Dismissible only when informational.

## 13.3 Notification center
Bell popover (desktop, 380 px) / full-screen sheet (mobile): header with "Notifications", **Mark all as read**, tabs **All / Unread**. Items: icon chip by module, bold title, one-line description, relative time, unread dot; click navigates to the related page and marks read. Footer "View all notifications →" opens a full list page with filters (module, date). Empty: "You're all caught up."
Dashboards also embed a compact **Notifications widget** (Ref 1).

## 13.4 Success messages
Specific ("Receipt R-2026-0412 issued"), concise, with next step.

## 13.5 Warnings
Amber alerts for at-risk conditions (attendance 75–80%, dues due soon, hostel > 95% full, payroll not run).

## 13.6 Errors
Plain language, state what failed and what to do. Include backend-provided rule reason. Technical detail (error ID) in muted text, copyable.

## 13.7 Confirmation states
Dialogs (§6.22) and post-action summary cards.

## 13.8 System announcements
Optional top-of-page **banner** (full width under header, tinted info/warning, dismissible per user) for maintenance windows or term-level notices (registration open/close). One banner at a time; critical (payment downtime) uses warning tint and is non-dismissible.

---

# 14. Responsive Design

## 14.1 Breakpoints
Large desktop ≥1536 · Standard 1280–1535 · Tablet 768–1279 · Mobile <768 (design down to 360 px).

## 14.2 Behavior matrix
| Element | Large desktop | Standard desktop | Tablet | Mobile |
|---|---|---|---|---|
| **Sidebar** | Expanded 248 | Expanded 248 (user may collapse) | Rail 72 by default; overlay when expanded | Hidden; drawer via hamburger (full-height, 280) |
| **Header** | Breadcrumb/title, wide search, term chip, bell, profile name | Same; search narrower | Search collapses to icon expanding on tap; profile avatar only | Hamburger, title, search icon, bell, avatar |
| **Dashboard grid** | 5 KPI + 9/3 rail | 4–5 KPI + 8/4 rail | 3-per-row KPI; rail moves below main | KPI 2-per-row or horizontal snap; widgets stacked |
| **Cards** | Fixed paddings 20 | Same | Padding 16 | Padding 16; full-bleed edge margin 16 |
| **Tables** | All columns | All columns (some hidden by priority) | Hide tertiary; sticky first/last; h-scroll | Stacked cards |
| **Charts** | Full with legends right | Same | Legends below | Simplified (fewer labels), horizontal scroll for wide bar charts, tap for tooltip |
| **Forms** | 2 col where short fields | 2 col | 1 col | 1 col; sticky bottom action bar |
| **Modals** | Centered | Centered | Centered (max 90% width) | Bottom sheet / full-screen for forms |
| **Drawers** | Right 420–720 | Right | Right 90% | Full-screen sheet |
| **Filters** | Inline chips | Inline chips | Inline + overflow "All filters" | "Filters" button → bottom sheet |
| **Calendar widget** | Rail | Rail | Below main | Collapsible card |

## 14.3 Priority rules
Primary action remains reachable: on mobile it becomes a sticky bottom button or floating "+" (single per page). Critical tasks must be fully completable on mobile web: student attendance view, exam registration, fee payment, hostel request, results; faculty attendance marking and leave application; admin approvals.

## 14.4 Touch
Controls ≥ 44×44 px; row actions accessible via `⋯` with bigger hit area; no hover-only functionality.

---

# 15. Accessibility

Target: **WCAG 2.2 AA**.

- **Keyboard:** full operability; logical tab order; `⌘K` search; `Esc` closes overlays; arrow keys in menus, tabs, calendars and attendance grids; skip-to-content link; visible shortcuts list (profile menu).
- **Focus states:** 2 px `focus-ring` + 2 px offset on all interactive elements; never removed; focus moves into modals/drawers and returns to trigger on close.
- **Contrast:** text ≥ 4.5:1 (body), ≥ 3:1 for large text and UI boundaries. `text.muted` only for non-essential text; status pills use dark-enough text on tint (≥ 4.5:1).
- **Semantics:** landmarks (`header`, `nav`, `main`, `aside`), single H1 per page, ordered headings, real `table` markup with `th scope`, lists for lists, buttons vs links used correctly.
- **Forms:** programmatic labels, `aria-describedby` for helper/error text, required indicated textually, error summary focused on failed submit, autocomplete attributes.
- **Errors:** announced via `aria-live="polite"` (toasts) or `assertive` for blocking errors; not conveyed by color alone (icon + text).
- **Screen readers:** icon-only buttons have labels; status pills include text; progress rings expose value text; breadcrumbs `aria-label`; sortable headers expose `aria-sort`; selected counts announced.
- **Charts:** every chart has a title, textual summary (insight), "View as table" alternative, patterns/labels in addition to color, keyboard-focusable data points with tooltip content readable by AT.
- **Motion:** respects `prefers-reduced-motion` (disable entrance/skeleton shimmer to static).
- **Touch targets:** ≥ 44 px on touch devices; spacing between adjacent targets ≥ 8 px.
- **Time-based:** toasts pausable on hover/focus; session timeout warns before expiry.
- **Zoom/reflow:** usable at 200% zoom and 320 px width without 2-D scrolling (except data tables).

---

# 16. Motion & Interaction

| Interaction | Spec |
|---|---|
| **Hover (buttons, rows, nav)** | 120 ms ease-out color/background change; no scaling. |
| **Card hover (clickable)** | 160 ms to `shadow.sm`, border `border.strong`; no translate. |
| **Focus** | Instant ring, 80 ms fade. |
| **Page transition** | 160 ms fade of content (opacity 0.6 → 1) with 4 px upward settle; sidebar and header static. |
| **Dropdowns/popovers** | 140 ms fade + 4 px slide, origin at trigger. |
| **Modals** | 180 ms fade + scale 0.98 → 1; backdrop 150 ms. |
| **Drawers** | 220 ms slide from right, ease-out; closing 160 ms. |
| **Sidebar collapse** | 200 ms width transition; labels fade out first. |
| **Skeleton loading** | Gentle shimmer 1.2 s loop; replace with content via 120 ms fade. |
| **Chart entrance** | 400 ms ease-out grow/draw once on first render; hover highlight 100 ms. |
| **Success feedback** | Check icon draw (240 ms) in confirmation cards; toast slide-in 180 ms; saved-row tint fade 2 s. |
| **Progress** | Indeterminate bar for unknown durations; determinate for bulk operations. |
| **Reduced motion** | All of the above become opacity-only or instant. |

Never: bouncing, parallax, looping decorative animation, long (> 300 ms) transitions on frequent actions.

---

# 17. Visual Consistency Rules

1. **No random colors.** Only tokens in §3; new colors require design-system approval.
2. **Radius family only:** 4 / 8 / 12 / 16 / 20 / pill. No arbitrary values.
3. **One card style per purpose** (Standard, Compact, Tinted, Banner). No new card variants per module.
4. **No one-off buttons.** Use the five button variants; one primary per region.
5. **Shadows:** cards flat/hairline; shadows only for overlays and hover. No colored shadows, no glows.
6. **Spacing from the scale only** (multiples of 4); no pixel-nudging.
7. **Charts must answer a question** and follow §10; no decorative charts; max one accent color unless categories demand more.
8. **Status:** use the status map; the same status uses the same color in every module.
9. **Icons:** one set, one stroke weight, one size per context.
10. **Typography:** only the defined styles; no new font sizes or weights.
11. **Module parity:** Finance, HR, Hostel, Academics look identical in structure; module identity expressed only through the icon-chip tint.
12. **Do not overcrowd:** dashboards limited per §7.4; tables limited to what the task needs; hide the rest behind column menu/filters.
13. **No imitation of reference-only features** (AI tools, premium upsell, mobile-app promo, community, store).
14. **Content tone:** sentence case, verbs for buttons, no exclamation spam, consistent terms ("Enrollment", "Offering", "Receipt", "Payroll run").
15. **Reuse before create:** every new screen must be built from templates (§8.0) and existing components; deviations documented.
16. **Dark mode** is not in scope for v1; tokens remain themable so it can be added without redesign.

---

# 18. UX Principles

- **Discoverability:** features reachable in ≤ 2 clicks from the sidebar; labels are task-oriented; command palette; consistent location of primary actions (top-right).
- **Efficiency:** keyboard shortcuts, remembered filters, bulk operations, defaults (current term, today, all present), jump links between related pages (e.g., Roster → Mark attendance).
- **Feedback:** every action produces immediate visible feedback (loading, toast, state change); long operations show progress and a result summary.
- **Error prevention:** show rules and live calculations *before* submit; disable impossible actions with an explanation; confirm destructive operations; prevent double-submit.
- **Consistency:** same patterns for filtering, exporting, approving, auditing across modules; same names and icons.
- **Progressive disclosure:** summary first, details on demand (drawers, tabs, expanders, "All filters").
- **Information hierarchy:** one hero per page (greeting, primary KPI, or primary table), supported by cards; type and spacing reflect importance.
- **Minimal cognitive load:** group related fields, limit choices per screen, plain language, avoid jargon (translate database errors).
- **Fast navigation:** persistent sidebar, breadcrumbs, global search, back to the previous filtered list state.
- **Data clarity:** units, currency and date formats consistent; tabular numerals; "as of" timestamps on aggregated data; no ambiguous abbreviations; empty cell "–".
- **Trust:** show audit information (who/when) on sensitive records; receipts and payslips are stable, printable documents.
- **Recoverability:** drafts, undo where safe (toast Undo for deactivation), withdraw instead of delete.

---

# 19. Frontend Design Architecture

## 19.1 Layers
1. **Foundation / Design tokens:** colors, type, spacing, radius, shadow, motion, z-index scales (single source, themable).
2. **Primitives:** Box/Stack/Grid/Divider, Text, Icon, Button, IconButton, Input, Select, Checkbox, Radio, Switch, Tooltip, Badge, Avatar, Spinner, Skeleton.
3. **Composite components:** Card family (Standard/Stat/Banner), Tabs, Dropdown/Menu, Popover, Modal, Drawer, ConfirmDialog, Toast, Alert, EmptyState, ErrorState, Stepper, DateRangePicker, CalendarWidget, FilterBar, Pagination, ProgressRing/Bar.
4. **Layout primitives:** AppShell, Sidebar (+ NavGroup, NavItem, NavTree), Header (+ GlobalSearch, ProfileMenu, NotificationBell, TermSwitcher), PageContainer, PageHeader, Section, TwoColumn/RailLayout, StickyActionBar.
5. **Data components:** DataTable (toolbar, selection bar, columns, row actions, pager, density), EditableGrid, StatusPill (with status map), Metric/KPI components.
6. **Data-viz components:** BarChart, LineChart, DonutChart, StackedBar, Sparkline, ThresholdLine, ChartCard (title, insight, legend, view-as-table).
7. **Form components:** FormSection, Field (label/help/error), SearchableSelect (Student/Course/Employee pickers), RepeaterField (fee components, salary components), FileDropzone, ValidationPanel (live rule checks).
8. **Page templates (§8.0):** DashboardPage, ListPage, DetailPage, FormPage, WizardPage, WorkspacePage, ReportPage, ConfigPage, AuthPage, StatusPage.
9. **Feature components (module-specific, built only from the above):**
   - Core: UserForm, RoleMatrix, TermTimeline.
   - Academics: CurriculumBoard, CapacityBar, BulkEnrollmentWizard, ImportPreviewTable.
   - Attendance/Exams: AttendanceRosterGrid, EligibilityChip, ExamRegistrationCard, MarksGrid, ResultPublishChecklist, GradeScaleEditor.
   - Finance: FeeComponentRepeater, DuesTable, PaymentWizard, ReceiptDocument, LateFeeCalculator, AuditDiffRow.
   - HR: LeaveBalanceCards, LeaveRequestPanel, PayrollRunWizard, PayslipDocument.
   - Hostel: RoomPicker, BedAvailabilityChip, RequestStatusStepper.
   - Analytics: ReportCard, ReportParametersBar, IntegrityCheckList.
10. **Services/state (design-relevant):** role/permission context controls nav and component visibility; global term context; consistent API error → UI message mapping (including DB rule rejection messages); shared query-param filter state for tables.

## 19.2 Governance
- Components documented with states and usage guidelines (Storybook or equivalent).
- Page-level code consumes templates and components only; no ad-hoc styling.
- Design tokens are the only place styling values live.
- Changes to shared components are reviewed by both leads before merge, mirroring the project's cross-team integration discipline.
- Each sub-team (per PRD §15) builds its **feature components** on top of the shared layers; Team 1 owns the shared shell, tokens and primitives, and other teams request additions rather than forking.

---

# 20. Final Design Quality Bar

## 20.1 The frontend must NOT look like
- A basic college project or default admin-template theme.
- A generic Bootstrap dashboard with default blue buttons and heavy shadows.
- A template with random cards and mismatched radii.
- An AI-generated collection of pages with inconsistent patterns.
- A collection of unrelated screens where each module has its own look.
- An over-decorated dashboard (gradients everywhere, mascots, stock imagery, glow effects).

## 20.2 The frontend MUST look like
- A real enterprise SaaS product with a clear, quiet, structured interface.
- A cohesive design system: one shell, one token set, one component library.
- A product designed by a professional UI/UX team: precise alignment, rhythm, hierarchy.
- A mature higher-education platform that registrars, lecturers and students can use confidently.
- Something deployable to universities today.

## 20.3 Release checklist (every page must pass)
- [ ] Built from an approved template (§8.0); no one-off layout.
- [ ] Uses only tokens (color, type, spacing, radius, shadow).
- [ ] Page header follows anatomy: title, supporting text, primary action top-right, one primary action.
- [ ] Tables follow §11 (density, sorting, filters, pagination, row actions, export, states).
- [ ] Forms follow §12 (labels, validation, required, sticky actions, confirmation).
- [ ] Loading, empty, error and "no results" states implemented.
- [ ] Status colors from the status map; pills consistent across modules.
- [ ] Business rules from the PID surfaced before and after submit; DB rejections shown clearly.
- [ ] Role-based visibility verified; role-specific language and defaults applied.
- [ ] Responsive at 1536, 1280, 1024, 768, 390 px; mobile tasks completable.
- [ ] Keyboard-only walkthrough passes; focus visible; labels present; contrast verified.
- [ ] Charts have titles, insights, threshold markers where relevant, accessible alternatives.
- [ ] Motion limited to §16 and respects reduced motion.
- [ ] No feature from the reference screenshots that is outside the PID (AI tools, premium upsell, app promotion, etc.).
- [ ] Visual side-by-side with the other modules shows no stylistic drift.
- [ ] Copy is concise, consistent, sentence-case, and free of jargon.
- [ ] Performance: first meaningful content with skeleton < 1 s on typical network; table interactions < 200 ms perceived.

**Pass criterion:** a person familiar with the five references should recognise the same design DNA (soft canvas, white rounded cards, one confident accent, pastel icon chips, pill statuses, structured sidebar, refined tables) while every screen, label, field and workflow is unmistakably *this* ERP, as defined by the PID.
