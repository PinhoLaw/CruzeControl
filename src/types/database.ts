import {
  EventStatus,
  NewUsed,
  SalespersonType,
  UserRole,
} from "./enums";

// ─── Users ───────────────────────────────────────────────────────────────────

export interface UserRow {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  active_event_id: string | null;
  created_at: string;
}

export interface UserInsert {
  id: string;
  email?: string | null;
  full_name?: string | null;
  role?: UserRole;
  active_event_id?: string | null;
  created_at?: string;
}

export interface UserUpdate {
  id: string;
  email?: string | null;
  full_name?: string | null;
  role?: UserRole;
  active_event_id?: string | null;
  created_at?: string;
}

// ─── Events ──────────────────────────────────────────────────────────────────

export interface EventRow {
  id: string;
  dealer_name: string;
  franchise: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  start_date: string | null;
  end_date: string | null;
  mail_piece_type: string | null;
  mail_quantity: number | null;
  drop_1: string | null;
  drop_2: string | null;
  drop_3: string | null;
  giveaway_1: string | null;
  giveaway_2: string | null;
  pack_new: number;
  pack_used: number;
  pack_company: number;
  jde_pct: number;
  marketing_cost: number;
  misc_expenses: number;
  status: EventStatus;
  created_at: string;
}

export interface EventInsert {
  id?: string;
  dealer_name: string;
  franchise?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  mail_piece_type?: string | null;
  mail_quantity?: number | null;
  drop_1?: string | null;
  drop_2?: string | null;
  drop_3?: string | null;
  giveaway_1?: string | null;
  giveaway_2?: string | null;
  pack_new?: number;
  pack_used?: number;
  pack_company?: number;
  jde_pct?: number;
  marketing_cost?: number;
  misc_expenses?: number;
  status?: EventStatus;
  created_at?: string;
}

export interface EventUpdate {
  id: string;
  dealer_name?: string;
  franchise?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  mail_piece_type?: string | null;
  mail_quantity?: number | null;
  drop_1?: string | null;
  drop_2?: string | null;
  drop_3?: string | null;
  giveaway_1?: string | null;
  giveaway_2?: string | null;
  pack_new?: number;
  pack_used?: number;
  pack_company?: number;
  jde_pct?: number;
  marketing_cost?: number;
  misc_expenses?: number;
  status?: EventStatus;
  created_at?: string;
}

// ─── Salespeople ─────────────────────────────────────────────────────────────

export interface SalespersonRow {
  id: string;
  event_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  confirmed: boolean;
  type: SalespersonType;
  notes: string | null;
}

export interface SalespersonInsert {
  id?: string;
  event_id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  confirmed?: boolean;
  type: SalespersonType;
  notes?: string | null;
}

export interface SalespersonUpdate {
  id: string;
  event_id?: string;
  name?: string;
  phone?: string | null;
  email?: string | null;
  confirmed?: boolean;
  type?: SalespersonType;
  notes?: string | null;
}

// ─── Inventory ───────────────────────────────────────────────────────────────

export interface InventoryRow {
  id: string;
  event_id: string;
  hat_num: string | null;
  stock_num: string | null;
  vin: string | null;
  location: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  class: string | null;
  color: string | null;
  drivetrain: string | null;
  odometer: number | null;
  age: number | null;
  kbb_trade: number | null;
  kbb_retail: number | null;
  cost: number | null;
  notes: string | null;
}

export interface InventoryInsert {
  id?: string;
  event_id: string;
  hat_num?: string | null;
  stock_num?: string | null;
  vin?: string | null;
  location?: string | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  trim?: string | null;
  class?: string | null;
  color?: string | null;
  drivetrain?: string | null;
  odometer?: number | null;
  age?: number | null;
  kbb_trade?: number | null;
  kbb_retail?: number | null;
  cost?: number | null;
  notes?: string | null;
}

export interface InventoryUpdate {
  id: string;
  event_id?: string;
  hat_num?: string | null;
  stock_num?: string | null;
  vin?: string | null;
  location?: string | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  trim?: string | null;
  class?: string | null;
  color?: string | null;
  drivetrain?: string | null;
  odometer?: number | null;
  age?: number | null;
  kbb_trade?: number | null;
  kbb_retail?: number | null;
  cost?: number | null;
  notes?: string | null;
}

// ─── Deals ───────────────────────────────────────────────────────────────────

export interface DealRow {
  id: string;
  event_id: string;
  vehicle_id: string | null;
  salesperson_id: string | null;
  salesperson2_id: string | null;
  closer_id: string | null;
  closer_type: string | null;
  deal_num: string | null;
  deal_date: string | null;
  store: string | null;
  customer_name: string | null;
  customer_zip: string | null;
  new_used: NewUsed | null;
  year: number | null;
  make: string | null;
  model: string | null;
  cost: number | null;
  age: number | null;
  trade_year: string | null;
  trade_make: string | null;
  trade_model: string | null;
  trade_miles: string | null;
  acv: number;
  payoff: number;
  trade2: string | null;
  front_gross: number;
  lender: string | null;
  rate: number | null;
  reserve: number;
  warranty: number;
  aft1: number;
  gap: number;
  fi_total: number;
  total_gross: number;
  funded: boolean;
  notes: string | null;
}

export interface DealInsert {
  id?: string;
  event_id: string;
  vehicle_id?: string | null;
  salesperson_id?: string | null;
  salesperson2_id?: string | null;
  closer_id?: string | null;
  closer_type?: string | null;
  deal_num?: string | null;
  deal_date?: string | null;
  store?: string | null;
  customer_name?: string | null;
  customer_zip?: string | null;
  new_used?: NewUsed | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  cost?: number | null;
  age?: number | null;
  trade_year?: string | null;
  trade_make?: string | null;
  trade_model?: string | null;
  trade_miles?: string | null;
  acv?: number;
  payoff?: number;
  trade2?: string | null;
  front_gross?: number;
  lender?: string | null;
  rate?: number | null;
  reserve?: number;
  warranty?: number;
  aft1?: number;
  gap?: number;
  fi_total?: number;
  total_gross?: number;
  funded?: boolean;
  notes?: string | null;
}

export interface DealUpdate {
  id: string;
  event_id?: string;
  vehicle_id?: string | null;
  salesperson_id?: string | null;
  salesperson2_id?: string | null;
  closer_id?: string | null;
  closer_type?: string | null;
  deal_num?: string | null;
  deal_date?: string | null;
  store?: string | null;
  customer_name?: string | null;
  customer_zip?: string | null;
  new_used?: NewUsed | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  cost?: number | null;
  age?: number | null;
  trade_year?: string | null;
  trade_make?: string | null;
  trade_model?: string | null;
  trade_miles?: string | null;
  acv?: number;
  payoff?: number;
  trade2?: string | null;
  front_gross?: number;
  lender?: string | null;
  rate?: number | null;
  reserve?: number;
  warranty?: number;
  aft1?: number;
  gap?: number;
  fi_total?: number;
  total_gross?: number;
  funded?: boolean;
  notes?: string | null;
}

// ─── Mail Tracking ───────────────────────────────────────────────────────────

export interface MailTrackingRow {
  id: string;
  event_id: string;
  zip_code: string | null;
  town: string | null;
  drop_num: number | null;
  pieces_sent: number;
  day_1: number;
  day_2: number;
  day_3: number;
  day_4: number;
  day_5: number;
  day_6: number;
  day_7: number;
  day_8: number;
  day_9: number;
  day_10: number;
  day_11: number;
}

export interface MailTrackingInsert {
  id?: string;
  event_id: string;
  zip_code?: string | null;
  town?: string | null;
  drop_num?: number | null;
  pieces_sent?: number;
  day_1?: number;
  day_2?: number;
  day_3?: number;
  day_4?: number;
  day_5?: number;
  day_6?: number;
  day_7?: number;
  day_8?: number;
  day_9?: number;
  day_10?: number;
  day_11?: number;
}

export interface MailTrackingUpdate {
  id: string;
  event_id?: string;
  zip_code?: string | null;
  town?: string | null;
  drop_num?: number | null;
  pieces_sent?: number;
  day_1?: number;
  day_2?: number;
  day_3?: number;
  day_4?: number;
  day_5?: number;
  day_6?: number;
  day_7?: number;
  day_8?: number;
  day_9?: number;
  day_10?: number;
  day_11?: number;
}

// ─── Lenders ─────────────────────────────────────────────────────────────────

export interface LenderRow {
  id: string;
  event_id: string;
  name: string;
  note: string | null;
}

export interface LenderInsert {
  id?: string;
  event_id: string;
  name: string;
  note?: string | null;
}

export interface LenderUpdate {
  id: string;
  event_id?: string;
  name?: string;
  note?: string | null;
}
