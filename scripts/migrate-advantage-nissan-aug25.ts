/**
 * Migration script: Advantage Nissan August 2025
 * Reads reference/Advantage_Nissan_August_2025.xlsx and inserts into Supabase.
 *
 * Usage: npx tsx scripts/migrate-advantage-nissan-aug25.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

const FILE = path.resolve(__dirname, "../reference/Advantage_Nissan_August_2025.xlsx");

const DEFAULT_LENDERS = [
  "BECU", "KITSAP", "HARBORSTONE", "GESA", "GLOBAL", "ALLY", "NMAC", "CPS",
  "ICCU", "WHATCOM", "CASH", "OTHER", "FIRST TEC EXP 09",
  "TRULIANT EQUI VANTAGE", "SHARONVIEW TRANS 08", "CINCH TRANS 08",
  "AXOS EQUIFAX 08", "PENN FED EQUI 08 NON AUTO", "US BANK EQUIFAX 09",
  "EXETER EXP", "ALLY EXP", "SANT EXP", "MID AMER CU (9YR OLD MAX)",
];

function safeInt(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return isNaN(n) ? null : Math.round(n);
}

function safeNum(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function safeStr(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
}

/** Parse combined vehicle string like "2025 NISSAN KICKS" */
function parseVehicle(v: unknown): { year: number | null; make: string | null; model: string | null } {
  const s = safeStr(v);
  if (!s) return { year: null, make: null, model: null };
  const parts = s.split(/\s+/);
  const year = parts.length > 0 ? safeInt(parts[0]) : null;
  const make = parts.length > 1 ? parts[1] : null;
  const model = parts.length > 2 ? parts.slice(2).join(" ") : null;
  return { year, make, model };
}

/** Parse trade string — "NT" or empty means no trade */
function parseTrade(v: unknown): { trade_year: string | null; trade_make: string | null; trade_model: string | null } {
  const s = safeStr(v);
  if (!s || s === "NT") return { trade_year: null, trade_make: null, trade_model: null };
  const parts = s.split(/\s+/);
  const trade_year = parts.length > 0 ? parts[0] : null;
  const trade_make = parts.length > 1 ? parts[1] : null;
  const trade_model = parts.length > 2 ? parts.slice(2).join(" ") : null;
  return { trade_year, trade_make, trade_model };
}

async function main() {
  const wb = XLSX.readFile(FILE);

  // ── Step 1: Create Event ──────────────────────────────────────────────
  console.log("Step 1: Creating Advantage Nissan August 2025 event...");
  const { data: event, error: evErr } = await sb
    .from("events")
    .insert({
      dealer_name: "ADVANTAGE NISSAN",
      franchise: "NISSAN",
      street: "5101 AUTO CENTER BLVD",
      city: "BREMERTON",
      state: "WA",
      zip: "98312",
      start_date: "2025-08-15",
      end_date: "2025-08-25",
      status: "completed",
      jde_pct: 25,
    })
    .select("*")
    .single();

  if (evErr) {
    console.error("Failed to create event:", evErr.message);
    process.exit(1);
  }
  const eventId = event.id;
  console.log(`  Created: ${event.dealer_name} (${eventId})`);

  // ── Step 2: Salespeople ───────────────────────────────────────────────
  console.log("\nStep 2: Inserting salespeople...");
  const roster = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets["Roster & Tables"], {
    header: 1,
    defval: null,
  });

  // Rows 1–18, col C(2) = name, col E(4) for role
  // Row 6 Hannah Green = team_leader
  // Row 8 "Derwyn Doc McCoy" — skip (duplicate of row 14)
  // Row 14 "Derwyn Mccoy" = manager
  // Skip HOUSE and blank rows
  const spRows: { name: string; type: string }[] = [];
  for (let i = 1; i <= 18; i++) {
    const r = roster[i] as unknown[];
    const name = safeStr(r?.[2]);
    if (!name) continue;
    if (name === "HOUSE") continue;
    // Skip duplicate Derwyn at row 8
    if (i === 8 && name.toLowerCase().includes("derwyn")) continue;

    const colE = safeStr(r?.[4]);
    let type = "rep";
    if (colE === "Team Leader") type = "team_leader";
    else if (colE === "F&I Manager") type = "manager";

    spRows.push({ name, type });
  }

  const spInsert = spRows.map((s) => ({
    event_id: eventId,
    name: s.name,
    type: s.type,
    confirmed: true,
  }));

  // Add HOUSE as rep
  spInsert.push({
    event_id: eventId,
    name: "HOUSE",
    type: "rep",
    confirmed: true,
  });

  const { data: insertedSp, error: spErr } = await sb
    .from("salespeople")
    .insert(spInsert)
    .select("id, name");

  if (spErr) {
    console.error("Failed to insert salespeople:", spErr.message);
    process.exit(1);
  }
  console.log(`  Inserted ${insertedSp!.length} salespeople`);

  // Build case-insensitive name lookup
  const nameToId: Record<string, string> = {};
  const nameLowerToId: Record<string, string> = {};
  for (const sp of insertedSp!) {
    nameToId[sp.name] = sp.id;
    nameLowerToId[sp.name.toLowerCase()] = sp.id;
  }

  function matchSp(raw: string | null): string | null {
    if (!raw) return null;
    if (nameToId[raw]) return nameToId[raw];
    const lower = raw.toLowerCase();
    if (nameLowerToId[lower]) return nameLowerToId[lower];
    // Try matching "Derwyn Doc McCoy" → "Derwyn Mccoy"
    for (const [key, id] of Object.entries(nameLowerToId)) {
      if (lower.includes("derwyn") && key.includes("derwyn")) return id;
    }
    return null;
  }

  // ── Step 3: Inventory ─────────────────────────────────────────────────
  console.log("\nStep 3: Inserting inventory...");
  const inv = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets["INVENTORY LOG"], {
    header: 1,
    defval: null,
  });

  // Row 2+ (index 1+)
  // A(0)=hat_num, B(1)=notes, C(2)=location, D(3)=stock_num,
  // E(4)=year, F(5)=make, G(6)=model, H(7)=color, I(8)=odometer,
  // J(9)=vin, K(10)=trim, L(11)=age, M(12)=drivetrain,
  // N(13)=kbb_trade, O(14)=kbb_retail, P(15)=cost
  const invRows: Record<string, unknown>[] = [];
  for (let i = 1; i < inv.length; i++) {
    const r = inv[i] as unknown[];
    const stockNum = safeStr(r[3]);
    if (!stockNum) continue;

    invRows.push({
      event_id: eventId,
      hat_num: safeStr(r[0]),
      location: safeStr(r[2]),
      stock_num: stockNum,
      year: safeInt(r[4]),
      make: safeStr(r[5]),
      model: safeStr(r[6]),
      color: safeStr(r[7]),
      odometer: safeInt(r[8]),
      vin: safeStr(r[9]),
      trim: safeStr(r[10]),
      age: safeInt(r[11]),
      drivetrain: safeStr(r[12]),
      kbb_trade: safeInt(r[13]),
      kbb_retail: safeInt(r[14]),
      cost: safeInt(r[15]),
      notes: safeStr(r[1]),
    });
  }

  let invInserted = 0;
  for (let i = 0; i < invRows.length; i += 50) {
    const batch = invRows.slice(i, i + 50);
    const { error } = await sb.from("inventory").insert(batch);
    if (error) {
      console.error(`Inventory batch at ${i} failed:`, error.message);
      process.exit(1);
    }
    invInserted += batch.length;
  }
  console.log(`  Inserted ${invInserted} inventory items`);

  // ── Step 4: Deals ─────────────────────────────────────────────────────
  console.log("\nStep 4: Inserting deals...");
  const dl = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets["DEAL LOG"], {
    header: 1,
    defval: null,
  });

  // Data starts row 9 (index 8), deal# in col B (index 1)
  // B(1)=deal_num, E(4)=stock_num, F(5)=customer_name,
  // G(6)=customer_zip, H(7)=new_used, I(8)=vehicle (combined),
  // J(9)=age, K(10)=cost, L(11)=trade (combined),
  // O(14)=trade_miles, P(15)=acv, Q(16)=salesperson, R(17)=sp2,
  // S(18)=front_gross, T(19)=lender, U(20)=rate, V(21)=reserve,
  // W(22)=warranty, X(23)=aft1, Y(24)=gap, Z(25)=fi_total,
  // AA(26)=total_gross, AE(30)=notes
  const dealRows: Record<string, unknown>[] = [];
  const skippedSp = new Set<string>();

  for (let i = 8; i < dl.length; i++) {
    const r = dl[i] as unknown[];
    const dealNum = r[1];
    if (typeof dealNum !== "number") continue;
    if (dealNum < 1 || dealNum > 500) continue;

    const spName = safeStr(r[16]);
    const sp2Name = safeStr(r[17]);
    const spId = matchSp(spName);
    const sp2Id = matchSp(sp2Name);

    if (spName && !spId) skippedSp.add(spName);
    if (sp2Name && !sp2Id) skippedSp.add(sp2Name);

    // Parse combined vehicle field
    const vehicle = parseVehicle(r[8]);

    // Normalize new_used
    const rawNewUsed = safeStr(r[7]);
    const newUsed = rawNewUsed?.toUpperCase() === "NEW" ? "New" : "Used";

    // Parse trade info
    const trade = parseTrade(r[11]);

    dealRows.push({
      event_id: eventId,
      deal_num: String(dealNum),
      deal_date: null,
      store: null,
      customer_name: safeStr(r[5]),
      customer_zip: safeStr(r[6]),
      new_used: newUsed,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      cost: safeInt(r[10]),
      age: safeInt(r[9]),
      trade_year: trade.trade_year,
      trade_make: trade.trade_make,
      trade_model: trade.trade_model,
      trade_miles: safeStr(r[14]),
      acv: safeInt(r[15]) || 0,
      payoff: 0,
      salesperson_id: spId,
      salesperson2_id: sp2Id,
      closer_id: null,
      closer_type: null,
      front_gross: safeInt(r[18]) || 0,
      lender: safeStr(r[19]),
      rate: safeNum(r[20]),
      reserve: safeInt(r[21]) || 0,
      warranty: safeInt(r[22]) || 0,
      aft1: safeInt(r[23]) || 0,
      gap: safeInt(r[24]) || 0,
      funded: false,
      notes: safeStr(r[30]),
    });
  }

  if (skippedSp.size > 0) {
    console.log(`  Warning: unmatched salesperson names: ${Array.from(skippedSp).join(", ")}`);
  }

  let dealsInserted = 0;
  for (let i = 0; i < dealRows.length; i += 25) {
    const batch = dealRows.slice(i, i + 25);
    const { error } = await sb.from("deals").insert(batch);
    if (error) {
      console.error(`Deals batch at ${i} failed:`, error.message);
      console.error("First row of batch:", JSON.stringify(batch[0], null, 2));
      process.exit(1);
    }
    dealsInserted += batch.length;
    console.log(`  Inserted ${dealsInserted} / ${dealRows.length} deals`);
  }

  // ── Step 5: Mail Tracking ─────────────────────────────────────────────
  console.log("\nStep 5: Inserting mail tracking...");
  const mt = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets["MAIL TRACKING"], {
    header: 1,
    defval: null,
  });

  // Row 4+ (index 3+), where col F(5) is a ZIP, not "TOTAL", not "NON FLYER"
  // C(2)=pieces_sent, E(4)=town, F(5)=zip_code,
  // H(7)=day_1 through O(14)=day_8
  const mailRows: Record<string, unknown>[] = [];
  for (let i = 3; i < mt.length; i++) {
    const r = mt[i] as unknown[];
    if (!r) continue;
    const zip = safeStr(r[5]);
    if (!zip || zip === "TOTAL" || zip === "NON FLYER") continue;

    mailRows.push({
      event_id: eventId,
      pieces_sent: safeInt(r[2]) || 0,
      town: safeStr(r[4]),
      zip_code: zip,
      drop_num: 1,
      day_1: safeInt(r[7]) || 0,
      day_2: safeInt(r[8]) || 0,
      day_3: safeInt(r[9]) || 0,
      day_4: safeInt(r[10]) || 0,
      day_5: safeInt(r[11]) || 0,
      day_6: safeInt(r[12]) || 0,
      day_7: safeInt(r[13]) || 0,
      day_8: safeInt(r[14]) || 0,
      day_9: 0,
      day_10: 0,
      day_11: 0,
    });
  }

  const { error: mailErr } = await sb.from("mail_tracking").insert(mailRows);
  if (mailErr) {
    console.error("Mail tracking failed:", mailErr.message);
    process.exit(1);
  }
  console.log(`  Inserted ${mailRows.length} mail tracking rows`);

  // ── Step 6: Default Lenders ───────────────────────────────────────────
  console.log("\nStep 6: Inserting default lenders...");
  const lenderRows = DEFAULT_LENDERS.map((name) => ({ event_id: eventId, name }));
  const { error: lErr } = await sb.from("lenders").insert(lenderRows);
  if (lErr) {
    console.error("Lenders failed:", lErr.message);
    process.exit(1);
  }
  console.log(`  Inserted ${DEFAULT_LENDERS.length} lenders`);

  // ── Summary ───────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════");
  console.log("Done! Advantage Nissan August 2025 migration complete.");
  console.log(`  Event:     ${event.dealer_name} (${eventId})`);
  console.log(`  Roster:    ${insertedSp!.length} salespeople`);
  console.log(`  Inventory: ${invInserted} vehicles`);
  console.log(`  Deals:     ${dealsInserted}`);
  console.log(`  Mail:      ${mailRows.length} ZIP rows`);
  console.log(`  Lenders:   ${DEFAULT_LENDERS.length}`);
  console.log("══════════════════════════════════════════════");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
