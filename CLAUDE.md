# JDE Mission Control — CLAUDE.md

## What This Is

JDE Mission Control is an internal dashboard for Just Drive Events (JDE), a traveling automotive sales event company. It manages individual sale events at dealerships — tracking deals, inventory, salespeople, commissions, and direct mail campaign response data.

Each sale event runs 8–10 days. JDE operates ~36 events per year across 8–10 markets. This app replaces a collection of Excel workbooks that were managed per-event.

**Owner:** Mike (Head of Marketing, JDE)
**Dev:** Ethan

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** Supabase (Postgres)
- **Auth:** Supabase Auth
- **Deployment:** Vercel
- **Styling:** Tailwind CSS

---

## UI Conventions

Dark theme throughout. No light mode.

### Color Palette
```
Background:     #0a0f1e  (navy black)
Surface:        #0f172a  (dark navy)
Panel:          #1e293b  (panel bg)
Border:         #334155
Primary accent: #22d3ee  (cyan)
Success:        #34d399  (green)
Purple:         #a78bfa
Warning:        #fbbf24  (amber)
Danger:         #f87171  (red)
Text primary:   #e2e8f0
Text muted:     #94a3b8
Input bg:       #1e3a5f
```

### Font
IBM Plex Mono for data/numbers. System sans for labels and UI.

### Component Patterns
- Stat pills: small rounded badges showing key metrics in the header
- Tables: dark striped rows, cyan column headers, muted border
- Input fields: `#1e3a5f` bg, cyan text for user-entered values
- Flash messages: green for success (`#065f46` bg), red for error (`#7f1d1d` bg), auto-dismiss after 2.4s
- Buttons: transparent bg, cyan border/text for primary actions

### Reference UI
A working single-file React prototype exists at `reference/tacoma_nissan_dashboard.jsx`. Use it as the definitive reference for layout, component structure, business logic, and calculated fields. Do not copy it verbatim — rebuild it properly in Next.js with Supabase, but match the UX.

---

## Database Schema

### Auth & Access
Auth is handled by Supabase Auth. No RLS — access control is handled in the application layer.

All authenticated users start with `role: "admin"`. Role-based permissions are not yet implemented.

### Tables

```sql
-- One row per user account
users (
  id              uuid PK  -- matches Supabase auth.users.id
  email           text
  full_name       text
  role            text     -- "admin" only for now
  active_event_id uuid FK → events.id  -- the event this user is currently working
  created_at      timestamp
)

-- One row per sale event
events (
  id              uuid PK
  dealer_name     text
  franchise       text
  street          text
  city            text
  state           text
  zip             text
  start_date      date
  end_date        date
  mail_piece_type text
  mail_quantity   int
  drop_1          date
  drop_2          date
  drop_3          date
  giveaway_1      text
  giveaway_2      text
  pack_new        int      -- company pack applied to new car deals ($)
  pack_used       int      -- company pack applied to used car deals ($)
  pack_company    int
  status          text     -- "active", "completed", "draft"
  created_at      timestamp
)

-- Salespeople, managers, and team leader — all in one table
-- type: "rep" | "manager" | "team_leader"
salespeople (
  id              uuid PK
  event_id        uuid FK → events.id
  name            text
  phone           text
  email           text
  confirmed       boolean
  type            text     -- "rep", "manager", "team_leader"
  notes           text
)

-- Vehicles on the lot for this event
inventory (
  id              uuid PK
  event_id        uuid FK → events.id
  hat_num         text
  stock_num       text
  vin             text
  location        text
  year            int
  make            text
  model           text
  trim            text
  class           text
  color           text
  drivetrain      text
  odometer        int
  age             int
  kbb_trade       int
  kbb_retail      int
  cost            int
  notes           text
)

-- One row per deal written at the event
deals (
  id              uuid PK
  event_id        uuid FK → events.id
  vehicle_id      uuid FK → inventory.id  -- nullable (vehicle may not be in system)
  salesperson_id  uuid FK → salespeople.id
  salesperson2_id uuid FK → salespeople.id  -- nullable, split deal
  closer_id       uuid     -- no FK constraint — could be manager or rep
  closer_type     text     -- "manager" or "rep"
  deal_num        text
  deal_date       date
  store           text
  customer_name   text
  customer_zip    text
  new_used        text     -- "New" or "Used"
  year            int
  make            text
  model           text
  cost            int
  age             int
  trade_year      text
  trade_make      text
  trade_model     text
  trade_miles     text
  acv             int
  payoff          int
  trade2          text
  front_gross     int
  lender          text
  rate            numeric
  reserve         int
  warranty        int
  aft1            int
  gap             int
  fi_total        int      -- always = reserve + warranty + aft1 + gap
  total_gross     int      -- always = front_gross + fi_total
  funded          boolean
  notes           text
)

-- Mail tracking — one row per ZIP code per event
mail_tracking (
  id              uuid PK
  event_id        uuid FK → events.id
  zip_code        text
  town            text
  drop_num        int      -- which mail drop this ZIP belongs to (1, 2, or 3)
  pieces_sent     int
  day_1           int      -- showroom UPs (foot traffic) from this ZIP on day 1
  day_2           int
  day_3           int
  day_4           int
  day_5           int
  day_6           int
  day_7           int
  day_8           int
  day_9           int
  day_10          int
  day_11          int
)

-- Lenders available for this event
lenders (
  id              uuid PK
  event_id        uuid FK → events.id
  name            text
  note            text
)
```

---

## Business Logic

### Calculated Fields (never store, always derive)

```
fi_total    = reserve + warranty + aft1 + gap
total_gross = front_gross + fi_total
```

Always recalculate on write. Never trust stored values alone.

### Commission Logic (Washout)

```
pack = event.pack_new   (if deal is New)
pack = event.pack_used  (if deal is Used)

is_split = salesperson2_id is not null AND salesperson2_id != salesperson_id

comm_pct  = 0.25   (solo deal)
comm_pct  = 0.125  (split deal — each rep gets 12.5%)

commission_per_rep = max(front_gross - pack, 0) × comm_pct
```

### Event Recap

```
total_commissionable_gross = SUM(total_gross) for all deals in event
jde_commission             = total_commissionable_gross × (jde_pct / 100)   -- default 25%
non_comm_gross             = SUM(pack per deal)  -- pack_new or pack_used per deal
variable_net               = total_gross - jde_commission - marketing_cost + non_comm_gross
reps_commissions           = SUM(commission_per_rep) for all deals
total_net                  = variable_net - reps_commissions - misc_expenses
```

### Closer Lookup

`closer_id` has no FK constraint. Resolve at query time:
```typescript
if (deal.closer_type === "manager") {
  // lookup in salespeople where type = "manager"
} else {
  // lookup in salespeople where type = "rep"
}
```

---

## App Structure

### Pages

```
/                          → redirect to /events
/events                    → list of all events (cards with status, dealer name, dates, deal count)
/events/new                → create new event form
/events/[id]               → event dashboard (tabbed layout — see tabs below)
/events/[id]/settings      → edit event details, packs, marketing info
/login                     → Supabase auth login page
```

### Event Dashboard Tabs

```
Roster        → Salespeople table, Managers table, Team Leader, Lenders
Inventory     → Vehicle list with book values
Deal Log      → All deals for this event, add/edit inline
Washout       → Auto-generated commission breakdown per rep (read-only)
Mail Tracking → ZIP response grid, day 1–11 columns
Recap         → Financial summary — gross, JDE commission, net
Performance   → Leaderboard by gross
```

### Key UX Rules

- Every tab scoped to `active_event_id` from the logged-in user
- Inline editing preferred over modal forms where possible
- Summary stat bar always visible at top of event dashboard (total deals, total gross, JDE commission, total net)
- Flash messages for all save/delete operations
- No confirmation modals for edits — only for destructive deletes

---

## Supabase Query Patterns

Always scope queries to the current event:

```typescript
const { data: deals } = await supabase
  .from('deals')
  .select('*, salesperson:salespeople!salesperson_id(*), vehicle:inventory(*)')
  .eq('event_id', activeEventId)
  .order('deal_date', { ascending: true })
```

Get current user's active event on app load:

```typescript
const { data: profile } = await supabase
  .from('users')
  .select('*, active_event:events(*)')
  .eq('id', user.id)
  .single()
```

---

## Development Notes

- Seed data exists in `reference/tacoma_nissan_dashboard.jsx` — 25 deals, 11 ZIP rows, 20 salespeople, 5 managers for the Tacoma Nissan March 2026 event. Use this to seed the dev database.
- `fi_total` and `total_gross` should be recalculated server-side on every deal upsert via a Supabase database function or trigger, as a safety net.
- The import spreadsheet feature (SheetJS parser) will be ported from the reference file — hold off on this until core CRUD is working.
- Do not implement RLS. All auth is handled at the application layer for now.
- Vercel environment variables needed: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
