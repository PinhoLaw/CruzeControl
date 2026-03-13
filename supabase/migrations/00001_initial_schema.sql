-- JDE Mission Control — Initial Schema
-- No RLS — access control handled at application layer

-- Users table (mirrors Supabase auth.users)
create table public.users (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text,
  full_name       text,
  role            text default 'admin',
  active_event_id uuid,
  created_at      timestamptz default now()
);

-- Events table
create table public.events (
  id              uuid primary key default gen_random_uuid(),
  dealer_name     text not null,
  franchise       text,
  street          text,
  city            text,
  state           text,
  zip             text,
  start_date      date,
  end_date        date,
  mail_piece_type text,
  mail_quantity   int,
  drop_1          date,
  drop_2          date,
  drop_3          date,
  giveaway_1      text,
  giveaway_2      text,
  pack_new        int default 0,
  pack_used       int default 0,
  pack_company    int default 0,
  jde_pct         numeric default 25,
  marketing_cost  int default 0,
  misc_expenses   int default 0,
  status          text default 'draft' check (status in ('active', 'completed', 'draft')),
  created_at      timestamptz default now()
);

-- Add FK from users to events (after events table exists)
alter table public.users
  add constraint users_active_event_fk
  foreign key (active_event_id) references public.events(id) on delete set null;

-- Salespeople / Managers / Team Leaders
create table public.salespeople (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.events(id) on delete cascade,
  name            text not null,
  phone           text,
  email           text,
  confirmed       boolean default false,
  type            text not null check (type in ('rep', 'manager', 'team_leader')),
  notes           text
);

-- Inventory
create table public.inventory (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.events(id) on delete cascade,
  hat_num         text,
  stock_num       text,
  vin             text,
  location        text,
  year            int,
  make            text,
  model           text,
  trim            text,
  class           text,
  color           text,
  drivetrain      text,
  odometer        int,
  age             int,
  kbb_trade       int,
  kbb_retail      int,
  cost            int,
  notes           text
);

-- Deals
create table public.deals (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.events(id) on delete cascade,
  vehicle_id      uuid references public.inventory(id) on delete set null,
  salesperson_id  uuid references public.salespeople(id) on delete set null,
  salesperson2_id uuid references public.salespeople(id) on delete set null,
  closer_id       uuid,
  closer_type     text,
  deal_num        text,
  deal_date       date,
  store           text,
  customer_name   text,
  customer_zip    text,
  new_used        text check (new_used in ('New', 'Used')),
  year            int,
  make            text,
  model           text,
  cost            int,
  age             int,
  trade_year      text,
  trade_make      text,
  trade_model     text,
  trade_miles     text,
  acv             int default 0,
  payoff          int default 0,
  trade2          text,
  front_gross     int default 0,
  lender          text,
  rate            numeric,
  reserve         int default 0,
  warranty        int default 0,
  aft1            int default 0,
  gap             int default 0,
  fi_total        int default 0,
  total_gross     int default 0,
  funded          boolean default false,
  notes           text
);

-- Mail Tracking
create table public.mail_tracking (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.events(id) on delete cascade,
  zip_code        text,
  town            text,
  drop_num        int,
  pieces_sent     int default 0,
  day_1           int default 0,
  day_2           int default 0,
  day_3           int default 0,
  day_4           int default 0,
  day_5           int default 0,
  day_6           int default 0,
  day_7           int default 0,
  day_8           int default 0,
  day_9           int default 0,
  day_10          int default 0,
  day_11          int default 0
);

-- Lenders
create table public.lenders (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null references public.events(id) on delete cascade,
  name            text not null,
  note            text
);

-- Trigger: recalculate fi_total and total_gross on deal insert/update
create or replace function public.recalc_deal_totals()
returns trigger as $$
begin
  new.fi_total := coalesce(new.reserve, 0) + coalesce(new.warranty, 0) + coalesce(new.aft1, 0) + coalesce(new.gap, 0);
  new.total_gross := coalesce(new.front_gross, 0) + new.fi_total;
  return new;
end;
$$ language plpgsql;

create trigger trg_recalc_deal_totals
  before insert or update on public.deals
  for each row execute function public.recalc_deal_totals();

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, 'admin');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
