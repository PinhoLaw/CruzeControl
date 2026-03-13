/**
 * One-time seed script: imports Tacoma Nissan March 2026 event data.
 *
 * Creates:
 *  - 1 event (Tacoma Nissan)
 *  - 1 event_config row (packs, JDE commission %)
 *  - 21 roster entries (1 manager, 20 reps)
 *  - 25 deals in sales_deals
 *  - 11 mail_tracking ZIP rows
 *  - 8 lenders
 *
 * Usage:
 *   npx tsx scripts/import-spreadsheet.ts
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// ─── Event ───────────────────────────────────────────────────────────────────

const EVENT = {
  name: "Tacoma Nissan March 2026",
  dealer_name: "Tacoma Nissan",
  franchise: "Nissan",
  address: "4030 S Tacoma Way",
  city: "Tacoma",
  state: "WA",
  zip: "98409",
  start_date: "2026-03-09",
  end_date: "2026-03-17",
  sale_days: 8,
  status: "active",
};

const EVENT_CONFIG = {
  pack_new: 500,
  pack_used: 500,
  jde_commission_pct: 0.25,
  rep_commission_pct: 0.25,
  marketing_cost: 28000,
  misc_expenses: 4500,
  target_units: 80,
  target_gross: 400000,
};

// ─── Roster ──────────────────────────────────────────────────────────────────

const ROSTER: { name: string; role: string; phone?: string; email?: string; confirmed: boolean }[] = [
  { name: "Mike Stopperich", role: "manager", phone: "(555) 867-5309", email: "mike@justdriveevents.com", confirmed: true },
  { name: "ABDUL AL TABBAH", role: "sales", confirmed: false },
  { name: "ANDREW ODEI", role: "sales", confirmed: false },
  { name: "BRYAN ROGERS", role: "sales", confirmed: false },
  { name: "BRYANT ROGERS", role: "sales", confirmed: false },
  { name: "CHRIS MARTIN", role: "sales", confirmed: false },
  { name: "DARRELL ALBERICO", role: "sales", confirmed: false },
  { name: "DREW O'DEI", role: "sales", confirmed: false },
  { name: "HALEY DELUDE", role: "sales", confirmed: false },
  { name: "IGOR PLETNOR", role: "sales", confirmed: false },
  { name: "IRELAND COMBS", role: "sales", confirmed: false },
  { name: "JOSE TORRES", role: "sales", confirmed: false },
  { name: 'MAKOTO "TOKYO" MACHO', role: "sales", confirmed: false },
  { name: "MAYCON MIKE GUIMARAES", role: "sales", confirmed: false },
  { name: "MIKE LASHLEY", role: "sales", confirmed: false },
  { name: "NATE HARDING", role: "sales", confirmed: false },
  { name: "NICK WILEY", role: "sales", confirmed: false },
  { name: "OSSIE SAMPSON", role: "sales", confirmed: false },
  { name: "RJ JOHNSON JR", role: "sales", confirmed: false },
  { name: "TREVON HALL", role: "sales", confirmed: false },
  { name: "RJ", role: "sales", confirmed: false },
];

// ─── Lenders ─────────────────────────────────────────────────────────────────

const LENDERS = [
  { name: "Nissan Motor Acceptance", notes: "Captive lender — best rates on new" },
  { name: "Capital One", notes: "Tier 1-3" },
  { name: "Chase", notes: "Tier 1-2" },
  { name: "Wells Fargo", notes: "Full spectrum" },
  { name: "Santander", notes: "Subprime specialist" },
  { name: "Ally Financial", notes: "Tier 1-3, good on used" },
  { name: "US Bank", notes: "Tier 1" },
  { name: "CASH", notes: "Cash deal — no lender" },
];

// ─── Deals ───────────────────────────────────────────────────────────────────
// 25 deals across 8 sale days, Nissan models, realistic gross/F&I

interface SeedDeal {
  deal_number: number;
  sale_date: string;
  customer_name: string;
  customer_zip: string;
  new_used: "New" | "Used";
  vehicle_year: number;
  vehicle_make: string;
  vehicle_model: string;
  salesperson_idx: number; // index into ROSTER (reps only, 1-20)
  second_sp_idx?: number;
  front_gross: number;
  lender: string;
  rate: number;
  reserve: number;
  warranty: number;
  aftermarket_1: number;
  gap: number;
  funded: boolean;
}

const DEALS: SeedDeal[] = [
  { deal_number: 1, sale_date: "2026-03-09", customer_name: "JAMES WHITFIELD", customer_zip: "98402", new_used: "Used", vehicle_year: 2022, vehicle_make: "Nissan", vehicle_model: "Altima", salesperson_idx: 1, front_gross: 2850, lender: "Capital One", rate: 6.9, reserve: 425, warranty: 1295, aftermarket_1: 0, gap: 399, funded: true },
  { deal_number: 2, sale_date: "2026-03-09", customer_name: "SARAH CHEN", customer_zip: "98405", new_used: "New", vehicle_year: 2026, vehicle_make: "Nissan", vehicle_model: "Rogue", salesperson_idx: 2, front_gross: 1575, lender: "Nissan Motor Acceptance", rate: 4.9, reserve: 650, warranty: 1850, aftermarket_1: 495, gap: 499, funded: true },
  { deal_number: 3, sale_date: "2026-03-09", customer_name: "MICHAEL RODRIGUEZ", customer_zip: "98418", new_used: "New", vehicle_year: 2026, vehicle_make: "Nissan", vehicle_model: "Sentra", salesperson_idx: 3, front_gross: 3200, lender: "Nissan Motor Acceptance", rate: 2.9, reserve: 300, warranty: 995, aftermarket_1: 0, gap: 299, funded: true },
  { deal_number: 4, sale_date: "2026-03-10", customer_name: "PATRICIA JONES", customer_zip: "98444", new_used: "Used", vehicle_year: 2021, vehicle_make: "Nissan", vehicle_model: "Pathfinder", salesperson_idx: 4, front_gross: 4100, lender: "Chase", rate: 5.5, reserve: 800, warranty: 1695, aftermarket_1: 395, gap: 499, funded: true },
  { deal_number: 5, sale_date: "2026-03-10", customer_name: "ROBERT WILLIAMS", customer_zip: "98433", new_used: "New", vehicle_year: 2026, vehicle_make: "Nissan", vehicle_model: "Frontier", salesperson_idx: 5, second_sp_idx: 6, front_gross: 950, lender: "Nissan Motor Acceptance", rate: 5.9, reserve: 550, warranty: 2100, aftermarket_1: 695, gap: 599, funded: true },
  { deal_number: 6, sale_date: "2026-03-10", customer_name: "LINDA THOMPSON", customer_zip: "98498", new_used: "Used", vehicle_year: 2023, vehicle_make: "Nissan", vehicle_model: "Murano", salesperson_idx: 7, front_gross: 3650, lender: "Ally Financial", rate: 7.4, reserve: 375, warranty: 1495, aftermarket_1: 0, gap: 399, funded: true },
  { deal_number: 7, sale_date: "2026-03-11", customer_name: "DAVID MARTINEZ", customer_zip: "98407", new_used: "New", vehicle_year: 2026, vehicle_make: "Nissan", vehicle_model: "Kicks", salesperson_idx: 8, front_gross: 2100, lender: "Capital One", rate: 5.9, reserve: 475, warranty: 895, aftermarket_1: 295, gap: 299, funded: true },
  { deal_number: 8, sale_date: "2026-03-11", customer_name: "JENNIFER ANDERSON", customer_zip: "98421", new_used: "Used", vehicle_year: 2020, vehicle_make: "Nissan", vehicle_model: "Rogue Sport", salesperson_idx: 9, front_gross: 1850, lender: "Santander", rate: 12.9, reserve: 250, warranty: 995, aftermarket_1: 0, gap: 599, funded: false },
  { deal_number: 9, sale_date: "2026-03-11", customer_name: "WILLIAM GARCIA", customer_zip: "98466", new_used: "New", vehicle_year: 2026, vehicle_make: "Nissan", vehicle_model: "Altima", salesperson_idx: 10, front_gross: 2475, lender: "Nissan Motor Acceptance", rate: 3.9, reserve: 725, warranty: 1450, aftermarket_1: 495, gap: 399, funded: true },
  { deal_number: 10, sale_date: "2026-03-11", customer_name: "ELIZABETH TAYLOR", customer_zip: "98402", new_used: "Used", vehicle_year: 2022, vehicle_make: "Nissan", vehicle_model: "Titan", salesperson_idx: 11, front_gross: 5200, lender: "Wells Fargo", rate: 6.4, reserve: 900, warranty: 1895, aftermarket_1: 595, gap: 499, funded: true },
  { deal_number: 11, sale_date: "2026-03-12", customer_name: "CHRISTOPHER LEE", customer_zip: "98405", new_used: "New", vehicle_year: 2026, vehicle_make: "Nissan", vehicle_model: "Pathfinder", salesperson_idx: 12, front_gross: 1200, lender: "US Bank", rate: 4.4, reserve: 600, warranty: 2200, aftermarket_1: 795, gap: 599, funded: true },
  { deal_number: 12, sale_date: "2026-03-12", customer_name: "KAREN WILSON", customer_zip: "98445", new_used: "Used", vehicle_year: 2021, vehicle_make: "Nissan", vehicle_model: "Leaf", salesperson_idx: 13, front_gross: 1600, lender: "Capital One", rate: 7.9, reserve: 200, warranty: 695, aftermarket_1: 0, gap: 0, funded: true },
  { deal_number: 13, sale_date: "2026-03-12", customer_name: "DANIEL BROWN", customer_zip: "98498", new_used: "New", vehicle_year: 2026, vehicle_make: "Nissan", vehicle_model: "Ariya", salesperson_idx: 14, second_sp_idx: 15, front_gross: 850, lender: "Nissan Motor Acceptance", rate: 1.9, reserve: 450, warranty: 1995, aftermarket_1: 0, gap: 499, funded: true },
  { deal_number: 14, sale_date: "2026-03-13", customer_name: "NANCY DAVIS", customer_zip: "98418", new_used: "Used", vehicle_year: 2023, vehicle_make: "Nissan", vehicle_model: "Sentra", salesperson_idx: 16, front_gross: 2950, lender: "Ally Financial", rate: 6.9, reserve: 500, warranty: 1095, aftermarket_1: 295, gap: 399, funded: true },
  { deal_number: 15, sale_date: "2026-03-13", customer_name: "MARK JOHNSON", customer_zip: "98444", new_used: "New", vehicle_year: 2026, vehicle_make: "Nissan", vehicle_model: "Rogue", salesperson_idx: 17, front_gross: 1950, lender: "Nissan Motor Acceptance", rate: 4.9, reserve: 700, warranty: 1695, aftermarket_1: 495, gap: 499, funded: true },
  { deal_number: 16, sale_date: "2026-03-13", customer_name: "SUSAN MOORE", customer_zip: "98433", new_used: "Used", vehicle_year: 2020, vehicle_make: "Nissan", vehicle_model: "Maxima", salesperson_idx: 18, front_gross: 3800, lender: "Chase", rate: 8.4, reserve: 350, warranty: 1295, aftermarket_1: 0, gap: 499, funded: true },
  { deal_number: 17, sale_date: "2026-03-14", customer_name: "JOSEPH JACKSON", customer_zip: "98466", new_used: "New", vehicle_year: 2026, vehicle_make: "Nissan", vehicle_model: "Frontier", salesperson_idx: 19, front_gross: 4500, lender: "Wells Fargo", rate: 5.4, reserve: 850, warranty: 2100, aftermarket_1: 695, gap: 599, funded: true },
  { deal_number: 18, sale_date: "2026-03-14", customer_name: "BETTY WHITE", customer_zip: "98402", new_used: "Used", vehicle_year: 2019, vehicle_make: "Nissan", vehicle_model: "Kicks", salesperson_idx: 20, front_gross: 1250, lender: "Santander", rate: 14.9, reserve: 175, warranty: 595, aftermarket_1: 0, gap: 299, funded: false },
  { deal_number: 19, sale_date: "2026-03-14", customer_name: "THOMAS HARRIS", customer_zip: "98407", new_used: "New", vehicle_year: 2026, vehicle_make: "Nissan", vehicle_model: "Murano", salesperson_idx: 1, front_gross: 2200, lender: "Nissan Motor Acceptance", rate: 3.9, reserve: 625, warranty: 1850, aftermarket_1: 495, gap: 499, funded: true },
  { deal_number: 20, sale_date: "2026-03-15", customer_name: "DOROTHY CLARK", customer_zip: "98421", new_used: "Used", vehicle_year: 2022, vehicle_make: "Nissan", vehicle_model: "Rogue", salesperson_idx: 3, front_gross: 3100, lender: "Capital One", rate: 6.4, reserve: 550, warranty: 1495, aftermarket_1: 395, gap: 399, funded: true },
  { deal_number: 21, sale_date: "2026-03-15", customer_name: "CHARLES LEWIS", customer_zip: "98445", new_used: "New", vehicle_year: 2026, vehicle_make: "Nissan", vehicle_model: "Sentra", salesperson_idx: 5, front_gross: 2700, lender: "Nissan Motor Acceptance", rate: 2.9, reserve: 350, warranty: 995, aftermarket_1: 295, gap: 299, funded: true },
  { deal_number: 22, sale_date: "2026-03-16", customer_name: "MARGARET WALKER", customer_zip: "98498", new_used: "Used", vehicle_year: 2021, vehicle_make: "Nissan", vehicle_model: "Pathfinder", salesperson_idx: 7, second_sp_idx: 8, front_gross: 4800, lender: "Ally Financial", rate: 7.9, reserve: 725, warranty: 1895, aftermarket_1: 595, gap: 499, funded: true },
  { deal_number: 23, sale_date: "2026-03-16", customer_name: "RICHARD HALL", customer_zip: "98418", new_used: "New", vehicle_year: 2026, vehicle_make: "Nissan", vehicle_model: "Ariya", salesperson_idx: 10, front_gross: 1100, lender: "US Bank", rate: 3.4, reserve: 500, warranty: 1995, aftermarket_1: 0, gap: 599, funded: true },
  { deal_number: 24, sale_date: "2026-03-17", customer_name: "BARBARA YOUNG", customer_zip: "98444", new_used: "Used", vehicle_year: 2023, vehicle_make: "Nissan", vehicle_model: "Altima", salesperson_idx: 12, front_gross: 2350, lender: "Chase", rate: 5.9, reserve: 400, warranty: 1295, aftermarket_1: 295, gap: 399, funded: true },
  { deal_number: 25, sale_date: "2026-03-17", customer_name: "STEVEN KING", customer_zip: "98402", new_used: "New", vehicle_year: 2026, vehicle_make: "Nissan", vehicle_model: "Titan", salesperson_idx: 14, front_gross: 6100, lender: "Nissan Motor Acceptance", rate: 5.9, reserve: 950, warranty: 2500, aftermarket_1: 795, gap: 599, funded: true },
];

// ─── Mail Tracking (11 ZIPs in Tacoma area) ──────────────────────────────────

const MAIL_TRACKING = [
  { zip_code: "98402", town: "Tacoma Downtown", pieces_sent: 4200, day_1: 8, day_2: 12, day_3: 6, day_4: 9, day_5: 11, day_6: 14, day_7: 7, day_8: 10, day_9: 0, day_10: 0, day_11: 0 },
  { zip_code: "98405", town: "Tacoma Central", pieces_sent: 3800, day_1: 6, day_2: 9, day_3: 5, day_4: 7, day_5: 8, day_6: 10, day_7: 4, day_8: 6, day_9: 0, day_10: 0, day_11: 0 },
  { zip_code: "98407", town: "Tacoma North End", pieces_sent: 3200, day_1: 5, day_2: 7, day_3: 4, day_4: 6, day_5: 8, day_6: 9, day_7: 3, day_8: 5, day_9: 0, day_10: 0, day_11: 0 },
  { zip_code: "98409", town: "Tacoma South", pieces_sent: 5100, day_1: 10, day_2: 15, day_3: 8, day_4: 12, day_5: 14, day_6: 18, day_7: 9, day_8: 13, day_9: 0, day_10: 0, day_11: 0 },
  { zip_code: "98418", town: "South Tacoma", pieces_sent: 4500, day_1: 7, day_2: 11, day_3: 6, day_4: 8, day_5: 10, day_6: 12, day_7: 5, day_8: 8, day_9: 0, day_10: 0, day_11: 0 },
  { zip_code: "98421", town: "Tacoma Tideflats", pieces_sent: 2100, day_1: 3, day_2: 4, day_3: 2, day_4: 3, day_5: 5, day_6: 4, day_7: 2, day_8: 3, day_9: 0, day_10: 0, day_11: 0 },
  { zip_code: "98433", town: "Fort Lewis", pieces_sent: 3600, day_1: 5, day_2: 8, day_3: 4, day_4: 6, day_5: 7, day_6: 9, day_7: 4, day_8: 6, day_9: 0, day_10: 0, day_11: 0 },
  { zip_code: "98444", town: "Parkland", pieces_sent: 4800, day_1: 9, day_2: 13, day_3: 7, day_4: 10, day_5: 12, day_6: 15, day_7: 8, day_8: 11, day_9: 0, day_10: 0, day_11: 0 },
  { zip_code: "98445", town: "Spanaway", pieces_sent: 3400, day_1: 4, day_2: 7, day_3: 3, day_4: 5, day_5: 6, day_6: 8, day_7: 3, day_8: 5, day_9: 0, day_10: 0, day_11: 0 },
  { zip_code: "98466", town: "University Place", pieces_sent: 3000, day_1: 5, day_2: 6, day_3: 3, day_4: 5, day_5: 7, day_6: 8, day_7: 3, day_8: 4, day_9: 0, day_10: 0, day_11: 0 },
  { zip_code: "98498", town: "Lakewood", pieces_sent: 4100, day_1: 7, day_2: 10, day_3: 5, day_4: 8, day_5: 9, day_6: 11, day_7: 6, day_8: 8, day_9: 0, day_10: 0, day_11: 0 },
];

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Importing Tacoma Nissan March 2026 seed data...\n");

  // 1. Create event
  console.log("Creating event...");
  const { data: event, error: eventErr } = await supabase
    .from("events")
    .insert(EVENT)
    .select("id")
    .single();

  if (eventErr || !event) {
    console.error("Failed to create event:", eventErr);
    process.exit(1);
  }
  const eventId = event.id;
  console.log(`  ✓ Event created: ${eventId}\n`);

  // 2. Create event_config
  console.log("Creating event config...");
  const { error: cfgErr } = await supabase
    .from("event_config")
    .insert({ event_id: eventId, ...EVENT_CONFIG });

  if (cfgErr) {
    console.error("Failed to create event_config:", cfgErr);
    // Non-fatal — continue
  } else {
    console.log("  ✓ Event config created\n");
  }

  // 3. Insert roster
  console.log("Inserting roster...");
  const rosterRows = ROSTER.map((r) => ({
    event_id: eventId,
    name: r.name,
    role: r.role,
    phone: r.phone ?? null,
    email: r.email ?? null,
    confirmed: r.confirmed,
  }));

  const { data: rosterData, error: rosterErr } = await supabase
    .from("roster")
    .insert(rosterRows)
    .select("id, name, role");

  if (rosterErr || !rosterData) {
    console.error("Failed to insert roster:", rosterErr);
    process.exit(1);
  }
  console.log(`  ✓ ${rosterData.length} roster entries inserted\n`);

  // Build lookup: reps only (index 1-20 = ROSTER indices 1-20)
  const reps = rosterData.filter((r) => r.role === "sales");
  // Map our 1-based salesperson_idx to roster IDs
  const repIdByIdx: Record<number, string> = {};
  const salesRoster = ROSTER.filter((r) => r.role === "sales");
  salesRoster.forEach((sr, i) => {
    const match = rosterData.find((rd) => rd.name === sr.name);
    if (match) repIdByIdx[i + 1] = match.id;
  });

  // 4. Insert lenders
  console.log("Inserting lenders...");
  const lenderRows = LENDERS.map((l) => ({
    event_id: eventId,
    name: l.name,
    notes: l.notes,
  }));

  const { error: lenderErr } = await supabase.from("lenders").insert(lenderRows);
  if (lenderErr) {
    console.error("Failed to insert lenders:", lenderErr);
  } else {
    console.log(`  ✓ ${LENDERS.length} lenders inserted\n`);
  }

  // 5. Insert deals
  console.log("Inserting deals...");
  const dealRows = DEALS.map((d) => {
    const fi_total = d.reserve + d.warranty + d.aftermarket_1 + d.gap;
    const total_gross = d.front_gross + fi_total;
    return {
      event_id: eventId,
      deal_number: d.deal_number,
      sale_date: d.sale_date,
      customer_name: d.customer_name,
      customer_zip: d.customer_zip,
      new_used: d.new_used,
      vehicle_year: d.vehicle_year,
      vehicle_make: d.vehicle_make,
      vehicle_model: d.vehicle_model,
      salesperson_id: repIdByIdx[d.salesperson_idx] ?? null,
      salesperson: salesRoster[d.salesperson_idx - 1]?.name ?? null,
      second_sp_id: d.second_sp_idx ? repIdByIdx[d.second_sp_idx] ?? null : null,
      second_salesperson: d.second_sp_idx
        ? salesRoster[d.second_sp_idx - 1]?.name ?? null
        : null,
      front_gross: d.front_gross,
      lender: d.lender,
      rate: d.rate / 100, // store as decimal
      reserve: d.reserve,
      warranty: d.warranty,
      aftermarket_1: d.aftermarket_1,
      gap: d.gap,
      fi_total,
      total_gross,
      funded: d.funded,
      status: d.funded ? "funded" : "pending",
    };
  });

  const { error: dealErr } = await supabase.from("sales_deals").insert(dealRows);
  if (dealErr) {
    console.error("Failed to insert deals:", dealErr);
    process.exit(1);
  }
  console.log(`  ✓ ${dealRows.length} deals inserted\n`);

  // 6. Insert mail tracking
  console.log("Inserting mail tracking...");
  const mailRows = MAIL_TRACKING.map((m) => ({
    event_id: eventId,
    zip_code: m.zip_code,
    town: m.town,
    pieces_sent: m.pieces_sent,
    day_1: m.day_1,
    day_2: m.day_2,
    day_3: m.day_3,
    day_4: m.day_4,
    day_5: m.day_5,
    day_6: m.day_6,
    day_7: m.day_7,
    day_8: m.day_8,
    day_9: m.day_9,
    day_10: m.day_10,
    day_11: m.day_11,
  }));

  const { error: mailErr } = await supabase.from("mail_tracking").insert(mailRows);
  if (mailErr) {
    console.error("Failed to insert mail tracking:", mailErr);
  } else {
    console.log(`  ✓ ${mailRows.length} mail tracking rows inserted\n`);
  }

  // Summary
  const totalGross = dealRows.reduce((s, d) => s + d.total_gross, 0);
  const totalFront = dealRows.reduce((s, d) => s + d.front_gross, 0);
  const totalBack = dealRows.reduce((s, d) => s + d.fi_total, 0);

  console.log("═══════════════════════════════════════════");
  console.log("  SEED COMPLETE — Tacoma Nissan March 2026");
  console.log("═══════════════════════════════════════════");
  console.log(`  Event ID:    ${eventId}`);
  console.log(`  Roster:      ${rosterData.length} (1 mgr, ${reps.length} reps)`);
  console.log(`  Lenders:     ${LENDERS.length}`);
  console.log(`  Deals:       ${dealRows.length}`);
  console.log(`  Front Gross: $${totalFront.toLocaleString()}`);
  console.log(`  Back Gross:  $${totalBack.toLocaleString()}`);
  console.log(`  Total Gross: $${totalGross.toLocaleString()}`);
  console.log(`  Mail ZIPs:   ${mailRows.length}`);
  console.log("═══════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
