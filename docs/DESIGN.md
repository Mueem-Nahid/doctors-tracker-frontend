# Doctor Tracker — Design Source of Truth

> **Audience:** Codex (and any engineer) implementing the project. **Status:** authoritative. If code and this file disagree, this file wins — update it in the same PR as any design change.
> **Scope:** UX research, visual language, design tokens, component architecture (Atomic Design), page specs, data fetching & state management, data-viz, UI↔API contract, performance and accessibility rules. It complements `Fullstack_Task_Requirment.md` (functional spec); it does not replace it.

---

## 0. How to use this document (rules for Codex)

1. **Never hardcode a color, spacing, radius, shadow or font size.** Use tokens from §4 (Tailwind utilities backed by CSS variables). Hex/OKLCH literals appear only in `globals.css`.
2. **Build the UI with Atomic Design (§6.0):** atoms → molecules → organisms → templates → pages, with one-way imports. Use the shadcn/ui primitives (generated into `components/atoms`), the inventory in §6.2 and the specs in §6.3. Do not install a second UI kit.
3. **Every list screen uses the same Data Table pattern (§7.3):** server-side pagination/search/filter/sort, state in the URL, debounced search, skeleton loading, empty/error states.
4. **Every async surface has 4 states:** loading (skeleton), empty, error (with retry), success. No blank screens, no spinners-only.
5. **Every interactive element:** visible focus ring, ≥ 40×40 px hit area (WCAG 2.2 AA minimum is 24×24), keyboard reachable, accessible name.
6. **Implement in this order:** tokens → app shell → auth → Doctors (list/create/detail) → Patients → Dashboard → polish → README screenshots. Check off §16 as you go.
7. **Stack decision:** Next.js App Router frontend and standalone Express 5 TypeScript backend. The browser uses `/api/*` through a same-origin rewrite to Express `/api/v1/*`. Express owns MongoDB access, validation, authorization, and business rules. See the [backend architecture](https://github.com/Mueem-Nahid/doctors-tracker-backend/blob/main/docs/ARCHITECTURE.md) and [REST contract](https://github.com/Mueem-Nahid/doctors-tracker-backend/blob/main/docs/API_CONTRACT.md) for the authoritative service boundary and endpoint contract.
8. **Don't invent new patterns.** If something is missing here, extend §6 first, then build.
9. **Data & state ownership (§11):** server data → TanStack Query; shareable table/filter state → the URL (`nuqs`); small cross-component UI state → Zustand; everything else stays local. Never copy server data into Zustand or `useState`.
10. **Data hooks, Zustand stores and URL state are used only in organisms** (and in pages for optional prefetch). Atoms, molecules and templates stay presentational.

---

## 1. Product context

**Doctor Tracker** is a secure admin portal for managing doctors and their patients, with an analytics dashboard. One role in v1: **Admin**.

| Spec requirement | Where it is designed |
|---|---|
| Auth, protected routes | §8.1, §10.1 |
| Doctor CRUD-lite (create, list, search, filter, paginate, view/add/delete patients) | §8.3, §8.4 |
| Patient page (list, edit, delete, paginate, search, filter) | §8.5 |
| Dashboard analytics + charts | §8.2, §9 |
| Modern, responsive UI | §3–§5, §12 |
| Query optimization, indexing | §10.3, §10.4 |
| Reusable components, clean structure | §6, §14 |
| README with desktop + mobile screenshots | §15 |

**Design goals (ranked):** 1) Trust & clarity (it's healthcare data) 2) Speed of everyday tasks 3) Scannable data density without clutter 4) Polish that signals craft.

---

## 2. User research (desk research + hypotheses)

> **Honesty note:** No primary interviews were run. Personas and tasks below are synthesized from the spec, published healthcare-dashboard guidance, and a 2026 scoping review of healthcare dashboard design practices. Treat them as **hypotheses**; §2.6 gives a 5-user validation plan.

### 2.1 Primary persona — "Nadia, Clinic Administrator"
- Manages 20–200 doctors and thousands of patient records across hospitals; works on a desktop all day, checks the phone between meetings.
- **Jobs to be done:** (1) *Find* a doctor/patient in seconds. (2) *Register* a new doctor or patient without errors. (3) *Know* the load per doctor and spot imbalances. (4) *Report* weekly/monthly numbers to management.
- **Pains:** dense legacy tables, lost context after filtering, accidental deletes, charts that need explaining.
- **Needs:** persistent filters, safe destructive actions, obvious primary actions, numbers she can trust.

### 2.2 Secondary persona — "Rafi, Operations Lead"
- Reads the dashboard, rarely edits. Wants a 10-second answer to "how many patients this month and who is overloaded?". Uses mobile/tablet. Needs glanceable KPIs and chart tooltips that work on touch.

### 2.3 Top tasks (design the UI around these; measure against §2.6)
| # | Task | Target |
|---|---|---|
| T1 | Find a doctor by name/hospital | ≤ 3 interactions, results ≤ 300 ms perceived |
| T2 | Add a doctor | ≤ 1 dialog/page, ≤ 60 s |
| T3 | Add a patient to a specific doctor from the doctor's page | ≤ 3 clicks |
| T4 | Filter patients by condition + date range, then page through | Filters survive refresh/back (URL state) |
| T5 | Delete a patient safely | Confirm dialog naming the patient; undo toast not required |
| T6 | Read workload per doctor on the dashboard | No interaction needed |

### 2.4 Design principles derived from research
1. **Show less, show the right thing.** Information overload is the main dashboard failure mode — cap the dashboard at 4 KPIs + 4 charts + 1 table.
2. **Progressive disclosure.** Summary first (cards, charts), detail on demand (tables, drawers).
3. **State belongs in the URL.** Admins share and bookmark filtered views.
4. **Destructive actions are slow, constructive actions are fast.**
5. **Accessibility is a requirement, not polish** (WCAG 2.2 AA — §12).
6. **Color is never the only carrier of meaning** (pair with text/icon/pattern).

### 2.5 Journey (Nadia, "morning check")
Login → Dashboard (scan KPIs, spot a doctor with high patient count) → click bar → Doctor detail → add/delete patients → Patients page filtered by condition → done. **Implication:** chart elements deep-link to filtered list views (e.g. clicking a doctor bar → `/doctors/[id]`; donut slice → `/patients?condition=diabetes`).

### 2.6 Validation plan (post-build, optional but recommended)
5 admin-type users, 20-min sessions, tasks T1–T6, metrics: completion, time, errors, SUS. Fix anything that fails for ≥ 2 users.

---

## 3. Visual philosophy — "Clinical Quiet"

*(Written in the canvas-design manner: an aesthetic movement, then rules that express it.)*

**Clinical Quiet** is the visual language of a well-run clinic: calm, bright, exact. Surfaces are cool white and soft slate; one disciplined teal carries action and identity; semantic colors appear only when they mean something. Space does the organizing — generous padding, hairline borders instead of heavy shadows, and a strict 4 px rhythm so everything aligns like instruments on a tray.

Numbers are the heroes. Large tabular figures for KPIs, small uppercase labels, and charts drawn with thin lines, rounded bars and restrained palette. Motion is brief and functional (120–200 ms) — it explains state changes, never decorates. Every pixel should look *deliberately placed*: consistent radii, aligned baselines, no orphaned elements. The finished product should feel meticulously crafted — as if refined over many passes by someone who cares about hospitals running on time.

**Do:** whitespace, hairlines, tabular numerals, one accent, soft tinted badges, subtle skeletons.
**Don't:** gradients-on-everything, neon, glassmorphism overload, drop-shadow stacks, rainbow charts, emoji as icons, more than one accent hue per screen.

**Signature details (use consistently):**
- A small teal "pulse line" mark as the logo (SVG, 24 px) — a heartbeat polyline inside a rounded square.
- KPI cards have a 2 px top accent line only on hover/focus, not by default.
- Section headings: 18 px semibold + 14 px muted description.

---

## 4. Design tokens

### 4.1 Stack
Tailwind CSS **v4** (CSS-first config, no `tailwind.config.js`), shadcn/ui (`components.json` with empty `tailwind.config`), `tw-animate-css`, `lucide-react` icons, `next-themes` for dark mode, **Geist Sans / Geist Mono** via `next/font` (fallback `Inter, system-ui`).

### 4.2 `app/globals.css` (copy verbatim, then extend only here)

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:where(.dark, .dark *));

:root {
  --radius: 0.625rem;

  /* Neutrals (cool slate) */
  --background: oklch(0.985 0.003 247);
  --foreground: oklch(0.21 0.02 255);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.21 0.02 255);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.21 0.02 255);
  --muted: oklch(0.955 0.006 250);
  --muted-foreground: oklch(0.48 0.02 255);        /* ≥ 4.5:1 on background */
  --border: oklch(0.915 0.008 250);
  --input: oklch(0.89 0.01 250);

  /* Brand (clinical teal) */
  --primary: oklch(0.52 0.11 195);                  /* ≥ 4.5:1 with white text */
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.955 0.012 195);
  --secondary-foreground: oklch(0.32 0.07 195);
  --accent: oklch(0.955 0.012 195);
  --accent-foreground: oklch(0.32 0.07 195);
  --ring: oklch(0.6 0.12 195);

  /* Semantic */
  --success: oklch(0.55 0.13 155);
  --success-soft: oklch(0.96 0.03 155);
  --warning: oklch(0.62 0.14 75);
  --warning-soft: oklch(0.97 0.04 85);
  --destructive: oklch(0.55 0.21 27);
  --destructive-foreground: oklch(0.985 0 0);
  --destructive-soft: oklch(0.96 0.03 25);
  --info: oklch(0.55 0.13 250);
  --info-soft: oklch(0.96 0.03 250);

  /* Charts — colorblind-safe, distinct in lightness */
  --chart-1: oklch(0.52 0.11 195);  /* teal   */
  --chart-2: oklch(0.62 0.15 60);   /* amber  */
  --chart-3: oklch(0.5 0.16 290);   /* violet */
  --chart-4: oklch(0.6 0.16 25);    /* coral  */
  --chart-5: oklch(0.6 0.1 140);    /* sage   */
  --chart-6: oklch(0.55 0.02 255);  /* slate (Other) */

  /* Sidebar */
  --sidebar: oklch(0.99 0.003 247);
  --sidebar-foreground: oklch(0.3 0.02 255);
  --sidebar-border: oklch(0.915 0.008 250);
  --sidebar-accent: oklch(0.955 0.012 195);
  --sidebar-accent-foreground: oklch(0.32 0.07 195);

  /* Elevation (use sparingly) */
  --shadow-sm: 0 1px 2px 0 oklch(0.2 0.02 255 / 0.05);
  --shadow-md: 0 4px 12px -2px oklch(0.2 0.02 255 / 0.08);
  --shadow-lg: 0 12px 32px -8px oklch(0.2 0.02 255 / 0.14);
}

.dark {
  --background: oklch(0.17 0.012 255);
  --foreground: oklch(0.96 0.005 250);
  --card: oklch(0.2 0.014 255);
  --card-foreground: oklch(0.96 0.005 250);
  --popover: oklch(0.2 0.014 255);
  --popover-foreground: oklch(0.96 0.005 250);
  --muted: oklch(0.25 0.014 255);
  --muted-foreground: oklch(0.72 0.015 250);
  --border: oklch(1 0 0 / 0.1);
  --input: oklch(1 0 0 / 0.14);

  --primary: oklch(0.74 0.12 195);
  --primary-foreground: oklch(0.2 0.04 195);
  --secondary: oklch(0.27 0.03 195);
  --secondary-foreground: oklch(0.9 0.04 195);
  --accent: oklch(0.27 0.03 195);
  --accent-foreground: oklch(0.9 0.04 195);
  --ring: oklch(0.7 0.12 195);

  --success: oklch(0.74 0.14 155);  --success-soft: oklch(0.27 0.04 155);
  --warning: oklch(0.8 0.14 80);    --warning-soft: oklch(0.3 0.05 80);
  --destructive: oklch(0.7 0.19 25); --destructive-foreground: oklch(0.15 0 0);
  --destructive-soft: oklch(0.29 0.06 25);
  --info: oklch(0.74 0.12 250);     --info-soft: oklch(0.28 0.04 250);

  --chart-1: oklch(0.74 0.12 195);
  --chart-2: oklch(0.8 0.14 70);
  --chart-3: oklch(0.72 0.14 290);
  --chart-4: oklch(0.74 0.14 25);
  --chart-5: oklch(0.76 0.1 140);
  --chart-6: oklch(0.7 0.02 255);

  --sidebar: oklch(0.19 0.013 255);
  --sidebar-foreground: oklch(0.9 0.01 250);
  --sidebar-border: oklch(1 0 0 / 0.1);
  --sidebar-accent: oklch(0.27 0.03 195);
  --sidebar-accent-foreground: oklch(0.9 0.04 195);
}

@theme inline {
  --font-sans: var(--font-geist-sans), Inter, system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, monospace;

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-ring: var(--ring);
  --color-success: var(--success);
  --color-success-soft: var(--success-soft);
  --color-warning: var(--warning);
  --color-warning-soft: var(--warning-soft);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-destructive-soft: var(--destructive-soft);
  --color-info: var(--info);
  --color-info-soft: var(--info-soft);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-chart-6: var(--chart-6);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

@layer base {
  * { @apply border-border outline-ring/50; }
  html { scroll-padding-top: 5rem; }              /* focus never hidden under sticky header (WCAG 2.4.11) */
  body { @apply bg-background text-foreground font-sans antialiased; }
  :focus-visible { @apply outline-2 outline-offset-2 outline-ring; }
  .tabular { font-variant-numeric: tabular-nums; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

> **Pitfall:** semantic tokens live in `:root/.dark` and are bridged with `@theme inline` (this is the shadcn v4 pattern). Do not put literal colors inside `@theme inline`, or dark mode will not switch. Verify dark mode by toggling the `.dark` class on `<html>`.

### 4.3 Typography scale
| Token / class | Size / line | Weight | Use |
|---|---|---|---|
| `text-3xl tabular` | 30/36 | 600 | KPI numbers |
| `text-2xl` | 24/32 | 600 | Page title (`h1`) |
| `text-lg` | 18/28 | 600 | Section / card title (`h2`) |
| `text-sm` | 14/20 | 400/500 | Body, table cells, inputs (default) |
| `text-xs` | 12/16 | 500 | Labels, badges, helper text, chart axes |
| `text-[11px] uppercase tracking-wide` | 11/16 | 600 | Overline labels (KPI caption) |

One `h1` per page. Min body size 14 px; never below 12 px.

### 4.4 Spacing, radius, elevation, motion
- **Spacing:** 4 px base (`1`=4px). Page padding `p-4 md:p-6 lg:p-8`; card padding `p-5`; grid gap `gap-4 md:gap-6`; form field gap `space-y-4`.
- **Radius:** inputs/buttons `rounded-md`; cards/dialogs `rounded-xl`; badges `rounded-full`.
- **Elevation:** cards = border + `shadow-sm`; popovers/menus = `shadow-md`; dialogs/drawers = `shadow-lg`. No other shadows.
- **Motion:** 120 ms (hover/press), 200 ms (dialogs/popovers), ease-out. Charts animate once on mount (≤ 600 ms). Respect `prefers-reduced-motion`.
- **Z-index:** content 0 · sticky header 30 · sidebar 40 · dropdown/popover 50 · dialog 60 · toast 70.

### 4.5 Iconography
`lucide-react`, 16 px in controls, 20 px in nav, stroke 1.75. Icon-only buttons require `aria-label` + tooltip.
Suggested: `LayoutDashboard`, `Stethoscope` (Doctors), `Users` (Patients), `Plus`, `Search`, `SlidersHorizontal`, `Trash2`, `Pencil`, `ChevronLeft/Right`, `CalendarDays`, `LogOut`, `Sun/Moon`.

---

## 5. Layout & navigation

### 5.1 Information architecture
```
/login                      (public)
/                           → redirect to /dashboard
/dashboard                  Dashboard
/doctors                    Doctor list (+ "Add doctor" dialog)
/doctors/[id]               Doctor detail (profile + patients tab)
/patients                   Patient list (+ edit / delete)
```
All routes except `/login` are protected (§10.1). Unknown → `not-found.tsx`; errors → `error.tsx` with retry.

### 5.2 App shell
- **Desktop (≥ 1024 px):** fixed left sidebar 256 px (collapsible to 72 px icon rail, state in `localStorage`), top header 64 px (sticky, `bg-background/80 backdrop-blur`), content `max-w-[1400px] mx-auto`.
- **Tablet (768–1023 px):** icon rail sidebar by default.
- **Mobile (< 768 px):** sidebar becomes a left `Sheet` opened from a hamburger; content full-width; tables degrade to card lists (§12.2).
- **Header contents:** breadcrumb/page title (left) · global theme toggle · user menu (avatar, name, "Sign out") (right).
- **Sidebar:** logo + "Doctor Tracker" · nav: Dashboard, Doctors, Patients · footer: user chip. Active item: `bg-sidebar-accent text-sidebar-accent-foreground` + `aria-current="page"` + 3 px left indicator.
- Include a **"Skip to main content"** link as the first focusable element.

---

## 6. Component system (Atomic Design)

### 6.0 Atomic Design — levels, rules, enforcement

Every UI piece has exactly one home, so it is reused instead of rebuilt. Five levels, **one-way dependencies**:

```
atoms → molecules → organisms → templates → pages
(a level may import only from the levels to its left)
```

| Level | Folder | What it is | May use | Must NOT use |
|---|---|---|---|---|
| **Atoms** | `components/atoms` | Smallest indivisible UI: shadcn primitives + tiny custom ones (`Logo`, `InitialsAvatar`, `DeltaChip`, `Spinner`) | tokens, `cva`, `cn`, Radix, lucide | domain knowledge, data hooks, stores, any higher level |
| **Molecules** | `components/molecules` | A few atoms with one job (`FormField`, `SearchInput`, `KpiCard`, `EmptyState`, `ConfirmDeleteDialog`) | atoms; local `useState`; third-party UI state (`next-themes`) | `lib/queries`, Zustand, `nuqs`, organisms |
| **Organisms** | `components/organisms/<feature>` | Self-contained sections with domain meaning (`DoctorsTable`, `PatientForm`, `AppSidebar`, charts) | atoms, molecules, **query/mutation hooks, Zustand stores, `nuqs`** | templates, pages |
| **Templates** | `components/templates` | Page layout skeletons with named slots (`ListPageTemplate`, `DashboardTemplate`); no real data | atoms, molecules, layout organisms (`AppSidebar`, `AppHeader`); feature organisms arrive via props/children | data hooks, stores |
| **Pages** | `src/app/**/page.tsx` | Route entry: choose a template, drop organisms into its slots, read `params`/`searchParams` | everything above | styling beyond layout glue; business logic |

**Rules**
1. **Controlled and presentational below organisms.** Atoms/molecules take state via props (`value`/`onChange`). All variants use `cva`; every state (default, hover, focus, disabled, loading, error) is implemented once, at the lowest level.
2. **Only organisms talk to data/state** (query hooks, mutations, Zustand, URL state). Generic organisms (`DataTable`, `DataTableToolbar`) are props-driven; feature organisms (`DoctorsTable`, `PatientsTable`) wire them to hooks.
3. **Accessibility is solved once, low:** focus ring, aria attributes, hit areas (§12.3) live in atoms/molecules, so every screen inherits them.
4. **`'use client'` only where needed** (interactive organisms/molecules). Pages and templates stay Server Components.
5. **Rule of two:** build in place first; promote a component to the next shared level when a second consumer appears. Do not pre-abstract.
6. **Reuse before create:** check atoms/molecules first. Adding a variant to an existing atom beats a new component.
7. **Naming:** kebab-case files (`kpi-card.tsx`), PascalCase named exports, one component per file, exported `XxxProps` type. **No barrel `index.ts` files** — import directly (faster dev compile, predictable tree-shaking).
8. **Enforce with ESLint** (built-in rule, no extra plugin) — CI fails on a violation:

```js
// eslint.config.mjs (excerpt)
const up = (...levels) => levels.map((l) => `@/components/${l}/*`);
const data = ['@/lib/queries/*', '@/stores/*', 'nuqs'];
export default [
  { files: ['src/components/atoms/**'],
    rules: { 'no-restricted-imports': ['error', { patterns: [...up('molecules', 'organisms', 'templates'), ...data] }] } },
  { files: ['src/components/molecules/**'],
    rules: { 'no-restricted-imports': ['error', { patterns: [...up('organisms', 'templates'), ...data] }] } },
  { files: ['src/components/organisms/**'],
    rules: { 'no-restricted-imports': ['error', { patterns: up('templates') }] } },
  { files: ['src/components/templates/**'],
    rules: { 'no-restricted-imports': ['error', { patterns: data }] } },
];
```

### 6.1 shadcn/ui primitives to install
```
button input label textarea select checkbox badge card table skeleton
dialog alert-dialog sheet dropdown-menu popover command calendar
form tabs tooltip separator avatar sonner pagination breadcrumb
toggle-group scroll-area chart
```
Also: `@tanstack/react-table`, `@tanstack/react-query`, `zustand`, `react-hook-form`, `zod`, `@hookform/resolvers`, `recharts`, `date-fns`, `nuqs` (URL state), `next-themes`, `lucide-react`, `class-variance-authority`.

**shadcn → atoms.** Point the CLI at the atoms layer in `components.json` so generated primitives land in the right place:
```json
{ "aliases": { "components": "@/components", "ui": "@/components/atoms", "utils": "@/lib/utils", "lib": "@/lib", "hooks": "@/hooks" } }
```
Generated files are ours to edit, but they must stay atoms (no data, no domain logic).

### 6.2 Component inventory by atomic level

| Level | Components to build / install |
|---|---|
| **Atoms** | `Button`, `Input`, `Textarea`, `Label`, `Select`, `Checkbox`, `Badge`, `Avatar`, `Skeleton`, `Separator`, `Tooltip`, `Card` (+ parts), `Table` (+ parts), `Calendar`, `Sonner` toaster, `Spinner`, `Logo`, `InitialsAvatar`, `DeltaChip` |
| **Molecules** | `FormField` (label + control + hint + error), `PasswordInput`, `SearchInput`, `StatusBadge`, `ConditionBadge`, `NavItem`, `PageHeader`, `KpiCard`, `ChartCard`, `EmptyState`, `ErrorState`, `ConfirmDeleteDialog`, `DateRangeFilter`, `FacetFilter`, `DataTablePagination`, `ThemeToggle`, `TableSkeleton` / `CardSkeleton` / `ChartSkeleton` |
| **Organisms** | *layout:* `AppSidebar`, `AppHeader`, `UserMenu` · *auth:* `LoginForm` · *data-table (generic):* `DataTable`, `DataTableToolbar`, `ActiveFilterChips` · *doctors:* `DoctorsTable`, `DoctorForm`, `AddDoctorDialog`, `DoctorProfileCard`, `DoctorPatientsPanel` · *patients:* `PatientsTable`, `PatientForm`, `PatientSheet` · *dashboard:* `KpiGrid`, `PatientsOverTimeChart`, `PatientsByConditionChart`, `PatientsPerDoctorChart`, `DoctorsBySpecializationChart`, `RecentPatientsTable` |
| **Templates** | `AuthTemplate` (split login layout), `AppShellTemplate` (sidebar + header + main + skip link), `ListPageTemplate` (PageHeader + filters + table slots), `DetailPageTemplate` (breadcrumb + profile + tabs/sections), `DashboardTemplate` (header + KPI row + chart grid slots) |
| **Pages** | `/login`, `/dashboard`, `/doctors`, `/doctors/[id]`, `/patients` (§5.1) |

**Worked example — the Doctors page**
```
app/(app)/doctors/page.tsx                       (page)
└─ ListPageTemplate                              (template)
   ├─ PageHeader + AddDoctorDialog               (molecule + organism)
   └─ DoctorsTable                               (organism: owns URL state + useDoctorsQuery)
      ├─ DataTableToolbar                        (generic organism)
      │   └─ SearchInput · FacetFilter · DateRangeFilter · ActiveFilterChips   (molecules)
      ├─ DataTable                               (generic organism)
      │   └─ Table · InitialsAvatar · Badge · StatusBadge · TableSkeleton · EmptyState · ErrorState
      └─ DataTablePagination                     (molecule)
```
`PatientsTable`, `DoctorPatientsPanel` and `RecentPatientsTable` reuse the same generic `DataTable` pieces — that is the payoff of the layering.

### 6.3 Component specs (props, behavior, a11y)

The table below holds the behavior of each component; the level it belongs to is in §6.2. (`AppShell` below = `AppShellTemplate`.)

| Component | Props (TS) | Behavior / states | A11y |
|---|---|---|---|
| `AppShell` | `children` | Sidebar + header + main; responsive per §5.2 | landmarks `nav`, `header`, `main`; skip link |
| `PageHeader` | `title, description?, actions?` | h1 + muted description + right-aligned actions | single `h1` |
| `KpiCard` | `label, value, delta?, icon, href?, loading?` | Big tabular number; delta chip (▲ success / ▼ destructive + text "vs last 30d"); skeleton when loading | whole card is one link if `href`; delta has text, not color only |
| `ChartCard` | `title, description?, toolbar?, children, loading?, empty?, error?` | Card with header, optional range toggle, fixed chart height (`h-72`) to prevent layout shift | `role="figure"`, `aria-labelledby`; "View as table" toggle |
| `DataTable<T>` | `columns, data, pageCount, total, isLoading, toolbar, emptyState, rowActions?` | Server-driven (§7.3). Sticky header, hover row, zebra off, density `comfortable` (row 52 px) | `<table>` semantics, `aria-sort`, `scope="col"`, caption (sr-only) |
| `DataTableToolbar` | `searchPlaceholder, filters[], onReset` | Search input (debounce 300 ms) + filter popovers + "Reset" (visible only if filters active) + active-filter chips | search `role="search"`, labelled |
| `DataTablePagination` | `page, pageSize, total, onChange` | "Showing 1–10 of 248" · page-size select (10/20/50) · Prev/Next + numbered pages (ellipsis) | `nav aria-label="Pagination"`, buttons labelled |
| `DateRangeFilter` | `value, onChange, presets` | Presets: Today, Last 7 days, Last 30 days, This month, Custom (calendar popover) | keyboard operable; text input fallback `YYYY-MM-DD` |
| `FacetFilter` | `title, options, selected, onChange` | Multi-select via `Command` in `Popover`; shows count badge | combobox pattern |
| `StatusBadge` | `variant: success \| warning \| destructive \| info \| neutral` | Soft-tinted bg + colored text + leading dot/icon | text always present |
| `ConditionBadge` | `condition` | Maps condition → neutral/info/warning tint (see §8.5) | — |
| `DoctorForm` | `defaultValues?, onSubmit` | RHF + Zod; fields §8.3; inline errors; disabled+spinner on submit | `aria-invalid`, `aria-describedby` |
| `PatientForm` | `defaultValues?, doctorLocked?, onSubmit` | Same pattern; doctor select (async search combobox) or locked when inside doctor page | same |
| `ConfirmDeleteDialog` | `entityName, entityType, onConfirm, isPending` | `AlertDialog`; title "Delete {name}?", body states consequence, destructive button, default focus on **Cancel** | `role="alertdialog"` |
| `EmptyState` | `icon, title, description, action?` | Centered, dashed border card | — |
| `ErrorState` | `message, onRetry` | Icon + message + "Try again" | `role="alert"` |
| `TableSkeleton` / `CardSkeleton` / `ChartSkeleton` | `rows?` | Shimmer (disabled with reduced motion) | `aria-busy` on container |
| `ThemeToggle`, `UserMenu`, `Logo`, `Avatar initials` | — | — | labelled |

### 6.4 Button & input spec
| Variant | Use |
|---|---|
| `default` (primary teal) | One primary action per view ("Add doctor") |
| `outline` | Secondary (Filters, Export-like) |
| `ghost` | Toolbar/icon actions, row actions |
| `destructive` | Only inside confirm dialogs and "Delete" menu items |

Sizes: `sm` 36 px, `default` 40 px (preferred), `lg` 44 px (login submit, mobile primary). Inputs 40 px high, `rounded-md`, 1 px `--input` border, focus = 2 px `--ring`. Disabled = 50 % opacity + `cursor-not-allowed`. Loading buttons show spinner + keep width.

---

## 7. Interaction patterns

### 7.1 Forms
- Validate with Zod on client **and** server (same schema in `lib/validators`); show errors under the field on blur/submit, summary toast for server errors.
- Label above input, always visible (no placeholder-as-label). Required fields marked with "*" and `aria-required`.
- `autocomplete` attributes: `email`, `tel`, `name`; login password `current-password`; **allow paste** (WCAG 3.3.8).
- Phone: accept `+`, digits, spaces, dashes; normalize on save. Email: lower-cased, unique.
- Success → close dialog, toast "Doctor created", invalidate relevant query keys, focus returns to the trigger.

### 7.2 Feedback
`sonner` toasts bottom-right (top-center on mobile). Success 4 s, error 8 s with action. Toasts must not be the only error signal for form errors.

### 7.3 The Data Table pattern (use everywhere)
1. **State in the URL** via `nuqs`: `?q=&page=1&pageSize=10&sort=createdAt.desc&specialization=cardiology&from=2026-11-01&to=2026-11-12`. Back/forward/refresh restore the view.
2. **Server-side** pagination, sorting, filtering, search. Never fetch whole collections.
3. **Debounce** search 300 ms; reset `page` to 1 whenever `q`/filters change.
4. **TanStack Query** (decision in §11.1) with `placeholderData: keepPreviousData` so the table doesn't flash empty between pages; subtle top progress bar/opacity 0.6 while fetching. `staleTime: 30s`.
5. **Prefetch** next page on pagination hover/idle.
6. Columns defined once with `useMemo`; row component `React.memo`; stable callbacks (`useCallback`) — avoid re-render storms.
7. Active filters shown as removable chips under the toolbar; "Reset" clears all.
8. Empty states differentiate: *no data yet* (CTA: Add) vs *no results for filters* (CTA: Reset filters).
9. Mobile: rows become stacked cards (§12.2); toolbar collapses filters into a `Sheet` ("Filters (2)").

---

## 8. Page specifications

### 8.1 Login (`/login`)
- Split layout ≥ 1024 px: left brand panel (teal gradient `primary → primary/80`, pulse-line pattern, tagline "Care operations, clearly."), right form card (max-w 400). Mobile: form only, logo on top.
- Fields: Email, Password (show/hide toggle, `aria-pressed`). Button "Sign in" (`lg`, full width). Inline error "Invalid email or password" (`role="alert"`, never reveal which). Loading state on button.
- No sign-up (admin-only). Seed credentials documented in README (`admin@doctortracker.dev` / provided in `.env.example` seed vars).
- Already-authenticated visit → redirect to `/dashboard`.

### 8.2 Dashboard (`/dashboard`)
Layout (desktop 12-col grid, gap-6):

```
┌ PageHeader: "Dashboard"  ·  DateRange select (7d / 30d / 90d / 12m)    ┐
├ KPI ×4 (3 cols each) ────────────────────────────────────────────────┤
│ Total doctors │ Total patients │ Avg patients / doctor │ New patients │
├ Row 2 ───────────────────────────────────────────────────────────────┤
│ Patients over time (area, 8 cols)       │ Patients by condition (donut, 4) │
├ Row 3 ───────────────────────────────────────────────────────────────┤
│ Patients per doctor (horiz. bar top 8, 6)│ Doctors by specialization (bar, 6)│
├ Row 4 ───────────────────────────────────────────────────────────────┤
│ Recent patients (table, 5 rows, link "View all →")                    │
└───────────────────────────────────────────────────────────────────────┘
```
- Tablet: KPIs 2×2, charts 1 col wide pairs stack. Mobile: all single column; KPIs 2×2 compact.
- The date-range control drives the time-series, "New patients" KPI and its delta; other KPIs are all-time.
- **One request** (`GET /api/dashboard/summary?range=30d`) feeds the whole page (§10.2). Cache 60 s; skeleton per card.
- Chart click-through links per §2.5.

### 8.3 Doctors list (`/doctors`)
- PageHeader: "Doctors" · description "Manage doctors and their patients" · primary `Add doctor`.
- Toolbar: search (name, hospital, email, phone) · `Specialization` facet · `Hospital` facet · `Created` DateRange · Reset.
- Columns: **Doctor** (avatar initials + name + email below, muted) · **Specialization** (badge) · **Hospital** · **Phone** · **Patients** (count, tabular, right-aligned) · **Created** (relative + absolute title) · **Actions** (⋯ menu: View, Edit*, Delete*).
  *Edit/Delete doctor are not in the spec; ship `View` only unless time allows. Do not add features silently.
- Row click (and name link) → `/doctors/[id]`. Whole row has hover bg; name is the real `<a>`.
- **Add doctor** dialog (`Dialog`, max-w 520): Name*, Specialization* (combobox with suggestions, free text allowed), Hospital*, Phone*, Email*. Primary "Create doctor", secondary "Cancel". Server duplicate-email error maps to the Email field.
- Default sort `createdAt desc`; sortable: name, specialization, hospital, patients, createdAt.

### 8.4 Doctor detail (`/doctors/[id]`)
- Breadcrumb: Doctors / {Name}. Header card: large initials avatar, name (h1), specialization badge, hospital, phone (`tel:` link), email (`mailto:` link), "Joined {date}", patient count KPI.
- **Patients** section (card) with toolbar: search, condition facet, date filter, `Add patient` button.
  - Table columns: Patient · Age/Gender · Condition · Status · Added · Actions (Delete).
  - **Add patient** dialog uses `PatientForm` with `doctorLocked` (doctor shown read-only).
  - **Delete** uses `ConfirmDeleteDialog` ("Remove {patient} from Dr. {doctor}? This deletes the patient record.").
- Same pagination/search/filter pattern (§7.3), scoped by `doctorId`.
- 404 for invalid/unknown id (custom `not-found`).

### 8.5 Patients (`/patients`)
- PageHeader: "Patients" · primary `Add patient` (doctor required — async combobox).
- Toolbar: search (name, phone, email) · `Condition` facet · `Status` facet · `Doctor` facet (async) · `Admitted/Created` DateRange · Reset.
- Columns: **Patient** (initials + name + email) · **Age / Gender** · **Condition** (`ConditionBadge`) · **Status** (`StatusBadge`: Active=success, Under observation=warning, Discharged=neutral) · **Doctor** (link) · **Added** · **Actions** (Edit, Delete).
- **Edit** opens a right-side `Sheet` (max-w 480) with `PatientForm`; on mobile full-screen. **Delete** via `ConfirmDeleteDialog`.
- Conditions (enum, extendable): `Hypertension, Diabetes, Asthma, Cardiac, Orthopedic, Neurological, Dermatological, Respiratory, Other`.
- Patient fields: `name*, age* (0–120), gender* (male/female/other), phone*, email?, condition*, status* (default Active), doctorId*, notes? (≤ 500)`.

### 8.6 Cross-cutting screens
- **Loading:** route-level `loading.tsx` with skeleton matching the page.
- **Error:** `error.tsx` → `ErrorState` with retry; API 401 → redirect to `/login?next=…`; 403 → "You don't have access".
- **404:** friendly illustration-free page with link back to Dashboard.

---

## 9. Data visualization spec

**Library:** Recharts via shadcn `chart` (`ChartContainer`, `ChartTooltip`). Recharts is SVG-based and suited to a dashboard of this size (small aggregated series, not thousands of points) — it is the right fit here; revisit ECharts/Canvas only if series exceed ~5k points.

| Chart | Type | Data | Notes |
|---|---|---|---|
| Patients over time | Area (smooth `monotone`, 12 % fill) | `{date, count}` bucketed by day (≤ 30d), week (90d), month (12m) | Gradient fill from `--chart-1`; 4 horizontal gridlines only; tooltip with date + count; zero-fill missing buckets server-side |
| Patients by condition | Donut (inner radius 60 %) | `{condition, count}` top 5 + "Other" | Center label = total; legend list with counts + % (text carries meaning, not color alone); slice click → `/patients?condition=` |
| Patients per doctor | Horizontal bar, top 8 desc | `{doctorId, name, count}` | Rounded 4 px bar ends; value label at bar end; click → doctor page; "View all doctors" link |
| Doctors by specialization | Vertical bar | `{specialization, count}` | Sorted desc; truncate labels with tooltip |

**Rules**
- Fixed container height (`h-72`, `h-64` on mobile) → zero layout shift. `ResponsiveContainer` width 100 %.
- Colors only from `--chart-*`; single-series charts use `--chart-1`. Max 6 categories; fold the rest into "Other" (`--chart-6`).
- Axes 12 px `--muted-foreground`; no axis lines on Y; no chart borders; legends only where >1 series.
- Tooltips: card style (`bg-popover`, `shadow-md`, `rounded-lg`), tabular numbers, work on touch (tap).
- **Accessibility:** each `ChartCard` has a visible title + `aria-label` summary (e.g. "Bar chart: patients per doctor. Top: Dr. Rahman, 42 patients"), and a **"View as table"** toggle rendering the same data in a semantic table. Color is never the only encoding.
- **Performance:** memoize chart data (`useMemo`) — Recharts re-renders on every reference change; render charts as client components, lazy-load below the fold (`next/dynamic`, `ssr:false` with skeleton).
- Empty: show `EmptyState` inside the card ("No patients in this period"). Error: `ErrorState` per card (one failing chart must not blank the page — but since a single endpoint feeds all, fall back to whole-page error with retry).

---

## 10. UI ↔ API contract

### 10.1 Auth
- Email + password → Argon2id verification → opaque MongoDB session in an **`httpOnly`, `Secure`, `SameSite=Lax` cookie** with a fixed 12-hour expiry. `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
- Express authorizes every protected request. Login is Admin-only with no public signup. Rate-limit login, store only a digest of the session token, check expiry on every request, and revoke the session on logout. Apply the configured public-origin check to browser mutations. See the [backend session and request rules](https://github.com/Mueem-Nahid/doctors-tracker-backend/blob/main/docs/ARCHITECTURE.md#authentication-and-request-handling).

### 10.2 Endpoints (REST, JSON, `/api/v1`-style naming)
| Method & path | Purpose | Notes |
|---|---|---|
| `GET /api/doctors` | List | Query below |
| `POST /api/doctors` | Create | 201 + doctor; 409 on duplicate email |
| `GET /api/doctors/:id` | Detail | includes `patientCount` |
| `GET /api/doctors/:id/patients` | Doctor's patients | Same query as patients list |
| `POST /api/doctors/:id/patients` | Add patient under doctor | 201 |
| `DELETE /api/doctors/:id/patients/:patientId` | Remove | 204 |
| `GET /api/patients` | List | Query below |
| `POST /api/patients` | Create (doctorId in body) | 201 |
| `GET /api/patients/:id` | Patient detail | Includes notes for the edit form |
| `PATCH /api/patients/:id` | Edit | partial, Zod-validated. `doctorId` can change to reassign a patient |
| `DELETE /api/patients/:id` | Delete | 204 |
| `GET /api/meta/filters` | Distinct specializations, hospitals | cached 5 min |
| `GET /api/dashboard/summary?range=30d` | Everything the dashboard needs | one round trip |

**List query params** are defined in the [REST contract](https://github.com/Mueem-Nahid/doctors-tracker-backend/blob/main/docs/API_CONTRACT.md#input-and-list-behavior). Repeated keys represent multi-value free-text facets so values containing commas remain intact.

**List response:**
```json
{ "data": [ ... ], "meta": { "page": 1, "pageSize": 10, "total": 248, "pageCount": 25 } }
```
**Dashboard response:**
```json
{
  "kpis": { "totalDoctors": 42, "totalPatients": 1280, "avgPatientsPerDoctor": 30.5,
            "newPatients": { "value": 96, "previous": 80, "deltaPct": 20 } },
  "patientsOverTime": [{ "date": "2026-10-14", "count": 4 }],
  "patientsByCondition": [{ "condition": "Diabetes", "count": 210 }],
  "patientsPerDoctor": [{ "doctorId": "…", "name": "Dr. A. Rahman", "count": 42 }],
  "doctorsBySpecialization": [{ "specialization": "Cardiology", "count": 9 }]
}
```
**Error shape (all endpoints):**
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid input", "fields": { "email": "Email already in use" } } }
```
Codes: `VALIDATION_ERROR 422`, `UNAUTHENTICATED 401`, `FORBIDDEN 403`, `NOT_FOUND 404`, `CONFLICT 409`, `RATE_LIMITED 429`, `INTERNAL 500`. UI maps `fields` to form errors and everything else to toasts.

### 10.3 Data model (design-relevant)
```ts
Doctor  { _id, name, nameLower, specialization, hospital, phone, email (unique, lower), createdAt, updatedAt }
Patient { _id, doctorId (ref, indexed), name, nameLower, age, gender, phone, email?, condition, status, notes?, createdAt, updatedAt }
User    { _id, email (unique), passwordHash, name, role: 'admin' }
```
Store `*Lower` normalized fields for fast, index-friendly search.

### 10.4 Indexes (ESR: Equality → Sort → Range) & query rules
```js
// doctors
{ email: 1 }                          // unique
{ specialization: 1, createdAt: -1 }  // facet + default sort
{ hospital: 1, createdAt: -1 }
{ nameLower: 1 }                      // prefix search
{ createdAt: -1 }                     // date range + default sort

// patients
{ doctorId: 1, createdAt: -1 }                    // doctor page (E, S)
{ doctorId: 1, condition: 1, createdAt: -1 }      // doctor page + condition filter
{ condition: 1, createdAt: -1 }                   // global condition filter
{ status: 1, createdAt: -1 }
{ nameLower: 1 }
{ createdAt: -1 }
```
- **Search:** anchored prefix match on normalized fields (`{ nameLower: { $regex: '^' + escape(q) } }`) so the index is used; escape user input to avoid regex injection. (If substring/typo-tolerant search is later required: MongoDB Atlas Search.)
- **Pagination:** `skip/limit` + `countDocuments` run in parallel (`Promise.all`) with `.lean()` and field projection (list views never need `notes`). Cap `pageSize`; for deep pages consider keyset (`_id`/`createdAt` cursor) — document as future work.
- **Dashboard:** one summary HTTP response combines all-time summary data with the date-window trend and new-patient KPI. Keep all-time totals independent from the selected date window. Use a `$facet` for compatible all-time patient summaries and a separate indexed date-window aggregation. Zero-fill date buckets in code. Verify query plans and latency with `.explain('executionStats')` on representative data. See the [backend dashboard plan](https://github.com/Mueem-Nahid/doctors-tracker-backend/blob/main/docs/ARCHITECTURE.md#dashboard-reads).
- Validate with Zod at the route boundary; never trust client `sort` field — allow-list it.

---

## 11. Data fetching, state management & performance

### 11.1 Data fetching — decision: **TanStack Query v5**

Server state here is our own REST API (§10), dominated by paginated, filtered tables. Options compared (feature rows follow TanStack's own comparison page, which is vendor-authored — verify against RTK docs if you rely on a single row):

| Criterion | **TanStack Query v5** ✅ | RTK Query |
|---|---|---|
| Keep previous page visible while next loads | `placeholderData: keepPreviousData` | `data` keeps the last result while new args load (`currentData` = current args) |
| Prefetching (next page, hover) | `prefetchQuery` | `usePrefetch` / `util.prefetch` |
| Refetch after a mutation | Explicit `invalidateQueries` by key prefix — extra code, which we centralize (§11.4) | Declarative **tags** — automatic; its main advantage |
| Re-render control | Structural sharing, `select`, `notifyOnChangeProps` | Referential equality |
| Extra infrastructure | None (one `QueryClientProvider`) | Redux store + Provider; per-request store in the App Router |
| Suspense / offline mutations | Supported | Suspense not officially supported; no offline mutations |
| App Router SSR hydration | Documented `HydrationBoundary` pattern | Possible, more ceremony |

SWR is lighter but has weaker mutation/invalidation ergonomics. Plain `fetch` in Server Components has no client cache, so filters and paging would feel slow.

**Why TanStack Query wins for Doctor Tracker**
1. Almost all state is server state, keyed by params (`q`, `page`, filters) — exactly TanStack's key → cache model, and it pairs naturally with the URL as the source of truth.
2. `keepPreviousData` + `prefetchQuery` give flicker-free pagination and snappy filters with a few lines.
3. No Redux store is needed just to cache responses, so the bundle and the setup stay small.
4. Invalidation is the one weak spot; a **single query-key factory plus mutation hooks that own their invalidation** removes it (§11.4).

**When RTK Query would be the better choice:** the team already standardizes on Redux, wants tag-based auto-invalidation or OpenAPI codegen, or wants one store for everything. If you pick it, follow §11.6 and **do not run both libraries**.

### 11.2 State management — decision: **Zustand** (not Redux Toolkit)

| Criterion | **Zustand** ✅ | Redux Toolkit |
|---|---|---|
| Size (approx., per pkgpulse's 2026 guide) | ~3 KB | ~60 KB incl. React-Redux |
| Boilerplate | Minimal (one file per store) | Slices + store + Provider |
| Provider | None | Required (per-request store in App Router) |
| DevTools | Basic middleware | Best-in-class (time travel, action replay) |
| Enforced structure | Light | Strong — valuable for large teams |
| Fit for **our** client state | ✅ ~3 UI flags | Overkill |

Our global client state is tiny: sidebar collapsed, mobile-nav open, optionally preferred table density. Redux Toolkit earns its weight with large teams, deep cross-feature client state or when RTK Query is the data layer — none apply here. **Do not add Redux to hold three booleans.**

**Two coherent stacks — pick one, never mix**
- **Stack A (recommended):** TanStack Query + `nuqs` (URL) + Zustand + `next-themes`.
- **Stack B (all-Redux alternative):** RTK Query + RTK `createSlice` (`ui` slice) + `nuqs` + `next-themes`.
- Never TanStack Query *and* RTK Query; never Redux only for UI flags.

The spec's README example ("Redux over Context API") only shows the *format* of a technical decision. Any well-argued choice satisfies "proper state management and data fetching strategies".

### 11.3 State ownership matrix (source of truth)

| State | Owner | Why |
|---|---|---|
| Doctors, patients, dashboard summary, filter options | **TanStack Query** | Server state, cached, invalidated |
| Current user (`/api/auth/me`) | TanStack Query `['me']` | Server is the truth (httpOnly cookie) |
| Table `q`, `page`, `pageSize`, `sort`, filters, dashboard `range` | **URL via `nuqs`** | Shareable, back/forward, survives refresh |
| Sidebar collapsed, mobile nav open, table density | **Zustand** `useUiStore` (persist only `sidebarCollapsed`) | Cross-component UI state |
| Theme (light/dark) | `next-themes` | Handles the SSR flash |
| Dialog/sheet open, row selected for edit/delete | Local `useState` | Local to one organism |
| Form values and errors | React Hook Form + Zod | Local to the form |
| Toasts | `sonner` (imperative) | No state to own |

Anti-patterns: server data copied into Zustand/`useState`; filters kept in Zustand instead of the URL; one giant "app store".

### 11.4 TanStack Query implementation contract

**Files:** `lib/api.ts` (fetch wrapper), `lib/queries/keys.ts`, `lib/queries/{doctors,patients,dashboard,meta,auth}.ts` (one hook per endpoint), `components/providers/query-provider.tsx`.

```ts
// src/lib/api.ts
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public fields?: Record<string, string>) { super(message); }
}
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...init });
  if (res.status === 401 && typeof window !== 'undefined') {
    window.location.assign(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
  }
  if (!res.ok) {
    const { error = {} } = await res.json().catch(() => ({}));
    throw new ApiError(res.status, error.code ?? 'INTERNAL', error.message ?? 'Something went wrong', error.fields);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}
```

```ts
// src/lib/queries/keys.ts — the ONLY place query keys are written
export const qk = {
  me: ['me'] as const,
  doctors: { all: ['doctors'] as const, list: (p: object) => ['doctors', 'list', p] as const, detail: (id: string) => ['doctors', 'detail', id] as const },
  patients: { all: ['patients'] as const, list: (p: object) => ['patients', 'list', p] as const, byDoctor: (id: string, p: object) => ['patients', 'doctor', id, p] as const },
  dashboard: { all: ['dashboard'] as const, summary: (range: string) => ['dashboard', range] as const },
  meta: { filters: ['meta', 'filters'] as const },
};
```

```ts
// src/lib/queries/patients.ts (pattern for every resource)
export function usePatientsQuery(params: PatientListParams) {
  return useQuery({
    queryKey: qk.patients.list(params),
    queryFn: ({ signal }) => apiFetch<Paginated<PatientRow>>(`/patients?${toSearch(params)}`, { signal }),
    placeholderData: keepPreviousData,
  });
}
export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PatientInput) => apiFetch<Patient>('/patients', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => Promise.all([
      qc.invalidateQueries({ queryKey: qk.patients.all }),
      qc.invalidateQueries({ queryKey: qk.doctors.all }),    // patientCount changed
      qc.invalidateQueries({ queryKey: qk.dashboard.all }),
    ]),
  });
}
```

**Client defaults:** `staleTime 30_000`, `gcTime 300_000`, `refetchOnWindowFocus: false`, `retry`: at most once and never for 4xx (`ApiError.status < 500`). Dashboard `staleTime 60_000`.

**Invalidation matrix (mutation hooks own this; components never call `invalidateQueries`)**

| Mutation | Invalidates |
|---|---|
| Create doctor | `doctors.all`, `meta.filters`, `dashboard.all` |
| Create patient | `patients.all`, `doctors.all`, `dashboard.all` |
| Update patient | `patients.all`, `dashboard.all` |
| Delete patient | `patients.all`, `doctors.all`, `dashboard.all` |

**Optimistic delete:** `onMutate` → `cancelQueries(patients.all)`, snapshot cached lists, remove the row; `onError` → restore the snapshot and show an error toast; `onSettled` → invalidate per the matrix.
**Errors:** `ApiError.fields` → `form.setError` per field; any other error → toast. **Cancellation:** always pass `signal` so superseded searches abort.
**Optional (phase 2) SSR prefetch:** in a Server Component page, call the repository function directly (no HTTP self-call), `prefetchQuery` the first page into a request-scoped `QueryClient`, and wrap the organism in `HydrationBoundary` — removes the first-load skeleton.

### 11.5 Zustand implementation contract

Zustand holds **UI-only** state. Never put server data, the user object or filters in it. Always read with selectors so only the subscribing component re-renders.

```ts
// src/stores/ui-store.ts
'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type UiState = { sidebarCollapsed: boolean; mobileNavOpen: boolean };
type UiActions = { toggleSidebar: () => void; setMobileNavOpen: (open: boolean) => void };

export const useUiStore = create<UiState & UiActions>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileNavOpen: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
    }),
    {
      name: 'dt-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }), // persist only this
      skipHydration: true,                                          // avoid SSR hydration mismatch
    },
  ),
);

// usage: const collapsed = useUiStore((s) => s.sidebarCollapsed);   // selector, never the whole store
```
Rehydrate once on the client: a tiny `UiStoreHydrator` component in the root providers calls `useUiStore.persist.rehydrate()` inside `useEffect`.
**Next.js caveat:** module-level stores are shared across server requests, so never store per-user data in them; they are only read in Client Components after mount.

### 11.6 If you choose Stack B (RTK Query) instead
- Replace `lib/queries/*` with one `createApi` (`baseQuery: fetchBaseQuery({ baseUrl: '/api' })`, `tagTypes: ['Doctor','Patient','Dashboard']`); endpoints map 1:1 to §10.2. Mutations use `invalidatesTags` (e.g. create patient invalidates `Patient`, `Doctor`, `Dashboard`) — this is where RTK Query saves code.
- Create the store per request (`makeStore`) inside a client `StoreProvider` (App Router rule); replace `useUiStore` with a `ui` slice.
- Keep `nuqs` for URL state; keep the atomic layering and the "only organisms touch data/state" rule unchanged.

### 11.7 Rendering & performance
- **Rendering:** Server Components for shells/static layout; Client Components only for interactive tables/charts/forms. `React.memo` rows, `useMemo` columns/chart data, `useCallback` handlers, stable keys (`_id`). No inline object/array props to memoized children.
- **Loading budget:** LCP < 2.5 s on 4G mid-tier; CLS < 0.1 (fixed chart/table heights, `next/font`); INP < 200 ms. Dynamic-import charts and dialogs.
- **Images:** no photos; initials avatars (deterministic color from name hash within `--chart-*` tints) → no image weight.

---

## 12. Responsive & accessibility

### 12.1 Breakpoints (Tailwind defaults)
`sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`. Design mobile-first; verify at **375, 768, 1024, 1440**.

### 12.2 Responsive behavior
| Element | < 768 | ≥ 768 |
|---|---|---|
| Sidebar | Sheet via hamburger | Rail (md) / full (lg) |
| Data tables | Card list: name+badge top row, 2–3 key fields, actions ⋯ | Table; secondary columns hidden at `md` (Phone, Created) |
| Filters | "Filters (n)" button → bottom `Sheet` | Inline toolbar |
| Dialogs | Full-width bottom sheet style (`max-h-[90dvh]`, scrollable) | Centered |
| KPIs | 2×2 grid | 4 in a row |
| Charts | Full width, `h-64`, legend below | Per grid |

### 12.3 Accessibility checklist (target **WCAG 2.2 AA**)
- Contrast: text ≥ 4.5:1, large text/UI ≥ 3:1, in light **and** dark. Check `--primary` on white and `--muted-foreground` on `--background`.
- **Target size (2.5.8):** all pointer targets ≥ 24×24 CSS px (this design uses ≥ 40 px). Dense table icon buttons: 32 px with 8 px spacing minimum.
- **Focus visible & not obscured (2.4.11):** 2 px ring, `scroll-padding-top` for the sticky header; dialogs trap focus and restore it.
- **Dragging (2.5.7):** no drag-only interactions (none planned).
- **Accessible authentication (3.3.8):** paste allowed, no cognitive puzzles, correct `autocomplete`.
- Semantics: landmarks, one `h1`, ordered headings, real `<button>`/`<a>`, table headers with `scope`, `aria-sort`, `aria-live="polite"` region announcing "Showing 10 of 248 results" after filter changes, `aria-busy` while loading.
- Forms: associated labels, `aria-invalid`, `aria-describedby` errors, error summary focus on submit failure.
- Charts: text summary + table alternative (§9). Color never sole carrier.
- Motion: honor `prefers-reduced-motion`. Zoom to 200 % without loss; no horizontal page scroll at 320 px.
- Test: keyboard-only pass on every flow; axe-core in dev (`@axe-core/react` or Playwright + axe); Lighthouse a11y ≥ 95.

---

## 13. Content & microcopy

- Voice: calm, plain, specific. Sentence case everywhere. No exclamation marks, no jargon.
- Buttons are verbs: "Add doctor", "Create doctor", "Save changes", "Delete patient".
- Empty (no data): "No doctors yet — Add your first doctor to start tracking patients." Empty (filtered): "No doctors match your filters." + "Reset filters".
- Delete confirm: "Delete Sara Khan? This permanently removes the patient record and can't be undone."
- Errors: say what happened + what to do: "Couldn't load patients. Check your connection and try again."
- Dates: absolute `12 Nov 2026` in tables with relative in tooltip; times only where needed. Numbers: `Intl.NumberFormat`, tabular figures.

---

## 14. Project structure
```
src/
  app/
    (auth)/login/page.tsx
    (app)/layout.tsx                 # AppShell
    (app)/dashboard/page.tsx
    (app)/doctors/page.tsx
    (app)/doctors/[id]/page.tsx
    (app)/patients/page.tsx
    globals.css  layout.tsx  not-found.tsx  error.tsx
  components/                          # Atomic Design (§6.0): imports flow left → right only
    atoms/                             # shadcn primitives (generated here) + Logo, InitialsAvatar, DeltaChip, Spinner
    molecules/                         # FormField, SearchInput, StatusBadge, ConditionBadge, KpiCard, ChartCard, PageHeader,
                                       # NavItem, EmptyState, ErrorState, ConfirmDeleteDialog, DateRangeFilter, FacetFilter,
                                       # DataTablePagination, ThemeToggle, *Skeleton
    organisms/
      layout/                          # AppSidebar, AppHeader, UserMenu
      auth/                            # LoginForm
      data-table/                      # DataTable, DataTableToolbar, ActiveFilterChips (generic, props-driven)
      dashboard/                       # KpiGrid, PatientsOverTimeChart, PatientsByConditionChart,
                                       # PatientsPerDoctorChart, DoctorsBySpecializationChart, RecentPatientsTable
      doctors/                         # DoctorsTable (+columns), DoctorForm, AddDoctorDialog, DoctorProfileCard, DoctorPatientsPanel
      patients/                        # PatientsTable (+columns), PatientForm, PatientSheet
    templates/                         # AuthTemplate, AppShellTemplate, ListPageTemplate, DetailPageTemplate, DashboardTemplate
    providers/                         # QueryProvider, ThemeProvider, UiStoreHydrator
  lib/
    db.ts (cached connection)  auth.ts  api.ts (fetch wrapper)  utils.ts
    validators/        # zod schemas shared by client & server
    queries/           # query-key factories + hooks (TanStack Query)
  lib/server/          # Session helper and Express auth check, server-only
  stores/              # Zustand: ui-store.ts (sidebar, mobile nav) — UI state only (§11.5)
  hooks/               # generic hooks: useDebounce, useMediaQuery, useTableParams (nuqs)
  types/
scripts/seed.ts        # 25 doctors, ~600 patients, spread over 12 months
backend/.env.example   # Backend connection, origin, reporting timezone and Admin provisioning values
frontend/.env.example  # Server-only BACKEND_ORIGIN
```
Rules: route handlers stay thin (validate → repository → respond); no DB code in components; shared Zod schemas; named exports; strict TypeScript; ESLint + Prettier; component imports obey §6.0 (ESLint-enforced); data hooks, stores and URL state only in organisms; server data never in Zustand.

---

## 15. README & screenshot plan (spec "Visual Evidence")
Seed realistic data first (`npm run seed`) so charts look meaningful (patients spread over 12 months, uneven per-doctor counts, mixed conditions).

**Capture (PNG, 2×, light mode primary; add 1 dark):**
| # | Screen | Desktop 1440×900 | Mobile 390×844 |
|---|---|---|---|
| 1 | Login | ✔ | ✔ |
| 2 | Dashboard (full page) | ✔ | ✔ |
| 3 | Doctors list with filters applied | ✔ | ✔ (card list + filter sheet) |
| 4 | Add doctor dialog | ✔ | ✔ |
| 5 | Doctor detail with patients | ✔ | ✔ |
| 6 | Patients list + edit sheet | ✔ | ✔ |
| 7 | Dark mode dashboard | ✔ | — |

**README "Technical Decisions" (pick two, write the *why* with trade-offs). Candidates, strongest first:**
1. *TanStack Query + URL-as-state + Zustand for UI-only state* (§11.1–§11.3): why not RTK Query / Redux Toolkit / Context; include the ownership matrix, the invalidation matrix and what you'd change if the team already used Redux.
2. *ESR-ordered compound indexes + single `$facet` dashboard aggregation* (measured with `explain()`; include before/after `executionStats` numbers).
3. *Atomic Design with ESLint-enforced one-way imports* (§6.0): how it produced one generic `DataTable` reused by four tables.

Also include: elevator pitch, setup guide (both `.env.example` files, install, index setup, seed, run), architecture diagram (browser → Next.js → Express modules → MongoDB; session check), credentials, live link, repo link.

---

## 16. Definition of done (check before submitting)

**Design fidelity**
- [ ] All colors/spacing/radius from tokens; no literals outside `globals.css`
- [ ] Light + dark verified on every page
- [ ] Matches page specs §8 (columns, filters, dialogs, empty/error/loading states)
- [ ] Verified at 375 / 768 / 1024 / 1440 px

**Spec coverage**
- [ ] Auth + protected pages + API 401s
- [ ] Doctors: create, list, search, filter (date + specialization + hospital), paginate, view patients, add/delete patient
- [ ] Patients: list, edit, delete, search, filter (date + condition + status + doctor), paginate
- [ ] Dashboard: totals, patients per doctor, date-based stats, ≥ 3 charts, one aggregation call

**Architecture**
- [ ] Atomic folders exist; ESLint import rules (§6.0) pass with zero violations
- [ ] Data hooks/stores/`nuqs` appear only in organisms; atoms/molecules/templates are presentational
- [ ] One generic `DataTable` reused by Doctors, Patients, Doctor-patients and Recent-patients tables
- [ ] All query keys come from `qk`; every mutation invalidates per §11.4; components never call `invalidateQueries`
- [ ] No server data in Zustand/`useState`; filters live in the URL; `useUiStore` read only through selectors

**Quality**
- [ ] Zod validation on both sides; consistent error shape
- [ ] Indexes created; `explain()` shows `IXSCAN`, no `COLLSCAN`, no blocking sort
- [ ] No unnecessary re-renders (React Profiler spot check on tables); chart data memoized
- [ ] a11y: keyboard pass, axe clean, Lighthouse a11y ≥ 95, contrast checked
- [ ] README complete with `.env.example`, architecture, 2 technical decisions, screenshots

---

## 17. Sources (research basis)
- W3C / WebAIM — WCAG 2.2 new criteria (2.4.11, 2.5.7, 2.5.8, 3.3.8): https://webaim.org/standards/wcag/wcag22 · https://dequeuniversity.com/resources/wcag-2.2
- Target size & dense tables exception: https://specification.website/spec/accessibility/touch-target-size.md
- MongoDB — query optimization & ESR rule: https://www.mongodb.com/docs/current/core/query-optimization · https://oneuptime.com/blog/post/2026-03-31-mongodb-what-is-the-esr-rule-for-mongodb-index-design/view
- Healthcare dashboard design practices (scoping review, JMIR 2026): https://www.jmir.org/2026/1/e77361
- Healthcare dashboard design guidance: https://fuselabcreative.com/healthcare-dashboard-design-best-practices/ · https://www.aufaitux.com/blog/healthcare-dashboard-ui-ux-design-best-practices/
- Healthcare dashboard examples (shadcn/Tailwind/Recharts stacks): https://adminlte.io/blog/healthcare-dashboard-design-examples/
- Server-side shadcn data tables (TanStack + URL state): https://next.jqueryscript.net/shadcn-ui/data-table-tablecn · https://github.com/sadmann7/shadcn-table
- Recharts for dashboards (memoize data, responsive container): https://ecosire.com/blog/recharts-data-visualization-guide · https://querio.ai/articles/best-react-chart-libraries-data-visualization
- Tailwind v4 + shadcn theming (`@theme inline`, `@custom-variant dark`): https://www.shadcnblocks.com/docs/blocks/theming
- TanStack Query vs RTK Query feature comparison (vendor-authored): https://tanstack.com/query/latest/docs/framework/react/comparison
- Zustand vs Redux Toolkit decision guide (size, boilerplate, when to choose which): https://www.pkgpulse.com/guides/zustand-vs-redux-toolkit-2026-decision-guide
- Atomic Design methodology (Brad Frost): https://atomicdesign.bradfrost.com/ · applied to Next.js: https://medium.com/the-tech-bench/atomic-design-with-next-js-9a6ff2a0df1
- Framework docs worth reading before implementing §11: TanStack Query advanced SSR (https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr), Redux Toolkit with Next.js (https://redux-toolkit.js.org/usage/nextjs), Zustand with Next.js (https://zustand.docs.pmnd.rs/guides/nextjs)
