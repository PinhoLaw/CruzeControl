/**
 * Migration script: Lilliston CDJR Jan 2026
 * Reads reference/Lilliston_CDJR_Jan_26__2_.xlsx and inserts into Supabase.
 *
 * Usage: npx tsx scripts/migrate-lilliston.ts
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

const FILE = path.resolve(__dirname, "../reference/Lilliston_CDJR_Jan_26__2_.xlsx");

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

async function main() {
  const wb = XLSX.readFile(FILE);

  // ── Step 1: Create Event ──────────────────────────────────────────────
  console.log("Step 1: Creating Lilliston CDJR event...");
  const { data: event, error: evErr } = await sb
    .from("events")
    .insert({
      dealer_name: "LILLISTON CDJR",
      franchise: "CDJR",
      city: "VINELAND",
      state: "NJ",
      start_date: "2026-01-13",
      end_date: "2026-01-20",
      status: "completed",
      pack_used: 750,
      pack_new: 750,
      jde_pct: 25,
      mail_quantity: 50000,
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

  // Rows 0–15 (16 rows), col B(1) = name
  // Row 6 (DARRELL ALBERICO) = team_leader
  // Row 13 (MAKOTO) = manager
  // Row 14 (BRYAN ROGERS, col D = NATE LABRECQUE) = manager
  // Skip HOUSE
  const spRows: { name: string; type: string; notes: string | null }[] = [];
  for (let i = 0; i < 16; i++) {
    const r = roster[i] as unknown[];
    const name = safeStr(r?.[1]);
    if (!name) continue;
    if (name === "HOUSE") continue;

    let type = "rep";
    const colD = safeStr(r?.[3]);
    if (i === 6) type = "team_leader"; // DARRELL ALBERICO
    else if (i === 13) type = "manager"; // MAKOTO
    else if (i === 14) type = "manager"; // BRYAN ROGERS

    spRows.push({ name, type, notes: colD });
  }

  const spInsert = spRows.map((s) => ({
    event_id: eventId,
    name: s.name,
    type: s.type,
    confirmed: true,
    notes: s.notes,
  }));

  // Also add HOUSE as a rep
  spInsert.push({
    event_id: eventId,
    name: "HOUSE",
    type: "rep",
    confirmed: true,
    notes: null,
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

  const nameToId: Record<string, string> = {};
  for (const sp of insertedSp!) {
    nameToId[sp.name] = sp.id;
  }

  // ── Step 3: Inventory ─────────────────────────────────────────────────
  console.log("\nStep 3: Inserting inventory...");
  const inv = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets["INVENTORY LOG"], {
    header: 1,
    defval: null,
  });

  // Row 1 onward (row 0 is header), where col D(3) has a stock#
  const invRows: Record<string, unknown>[] = [];
  for (let i = 1; i < inv.length; i++) {
    const r = inv[i] as unknown[];
    const stockNum = safeStr(r[3]);
    if (!stockNum) continue;

    invRows.push({
      event_id: eventId,
      hat_num: safeStr(r[0]),
      location: safeStr(r[1]),
      stock_num: stockNum,
      year: safeInt(r[4]),
      make: safeStr(r[5]),
      model: safeStr(r[6]),
      class: safeStr(r[7]),
      color: safeStr(r[8]),
      odometer: safeInt(r[9]),
      vin: safeStr(r[10]),
      trim: safeStr(r[11]),
      age: safeInt(r[12]),
      kbb_trade: safeInt(r[13]),
      kbb_retail: safeInt(r[14]),
      cost: safeInt(r[15]),
    });
  }

  // Insert in batches of 50
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

  // Actual column mapping (from header row 6):
  // E(4) = deal sequence number → deal_num
  // G(6) = DEAL# (store deal number) → store
  // H(7) = STOCK# → (link to inventory by stock)
  // I(8) = CUSTOMER → customer_name
  // K(10) = ZIPCODE → customer_zip
  // L(11) = NEW/USED → new_used
  // M(12) = YEAR → year
  // N(13) = MAKE → make
  // O(14) = MODEL → model
  // P(15) = COST → cost
  // Q(16) = AGE → age
  // R(17) = YEAR (trade) → trade_year
  // S(18) = MAKE (trade) → trade_make
  // T(19) = MODEL (trade) → trade_model
  // U(20) = MILES (trade) → trade_miles
  // V(21) = ACV → acv
  // W(22) = PAYOFF → payoff
  // X(23) = SALESPERSON → salesperson
  // Y(24) = 2ND SALESPERSON → sp2
  // Z(25) = FRONT GROSS → front_gross
  // AA(26) = LENDER → lender
  // AB(27) = RATE → rate
  // AC(28) = RESERVE → reserve
  // AD(29) = WARRANTY → warranty
  // AE(30) = AFT 1 → aft1
  // AF(31) = AFT2 → (store in notes or aft1 addition)
  // AG(32) = GAP → gap
  // AH(33) = F&I TOTAL → fi_total (reference, trigger recalculates)
  // AI(34) = TOTAL GROSS → total_gross (reference, trigger recalculates)
  // AK(36) = NOTES TO PATTIE
  // AL(37)/AN(39)/AS(44) = NOTES

  const dealRows: Record<string, unknown>[] = [];
  let skippedSp = new Set<string>();

  for (let i = 8; i < dl.length; i++) {
    const r = dl[i] as unknown[];
    const dealSeq = r[4];
    if (typeof dealSeq !== "number") continue;

    const spName = safeStr(r[23]);
    const sp2Name = safeStr(r[24]);
    const spId = spName ? nameToId[spName] || null : null;
    const sp2Id = sp2Name ? nameToId[sp2Name] || null : null;

    if (spName && !spId) skippedSp.add(spName);
    if (sp2Name && !sp2Id) skippedSp.add(sp2Name);

    // Combine notes from multiple note columns
    const notesParts = [safeStr(r[36]), safeStr(r[37]), safeStr(r[39]), safeStr(r[44])].filter(Boolean);
    const notes = notesParts.length > 0 ? notesParts.join(" | ") : null;

    // Handle aft2 by adding to aft1
    const aft1Val = safeInt(r[30]) || 0;
    const aft2Val = safeInt(r[31]) || 0;
    const combinedAft1 = aft1Val + aft2Val || 0;

    dealRows.push({
      event_id: eventId,
      deal_num: String(dealSeq),
      deal_date: null,
      store: safeStr(r[6]),
      customer_name: safeStr(r[8]),
      customer_zip: safeStr(r[10]),
      new_used: safeStr(r[11]),
      year: safeInt(r[12]),
      make: safeStr(r[13]),
      model: safeStr(r[14]),
      cost: safeInt(r[15]),
      age: safeInt(r[16]),
      trade_year: safeStr(r[17]),
      trade_make: safeStr(r[18]),
      trade_model: safeStr(r[19]),
      trade_miles: safeStr(r[20]),
      acv: safeInt(r[21]) || 0,
      payoff: safeInt(r[22]) || 0,
      salesperson_id: spId,
      salesperson2_id: sp2Id,
      closer_id: null,
      closer_type: null,
      front_gross: safeInt(r[25]) || 0,
      lender: safeStr(r[26]),
      rate: safeNum(r[27]),
      reserve: safeInt(r[28]) || 0,
      warranty: safeInt(r[29]) || 0,
      aft1: combinedAft1,
      gap: safeInt(r[32]) || 0,
      funded: false,
      notes,
    });
  }

  if (skippedSp.size > 0) {
    console.log(`  Warning: unmatched salesperson names: ${Array.from(skippedSp).join(", ")}`);
  }

  // Insert in batches of 25
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

  // Row 4 onward where col D(3) is a 5-digit zip
  const mailRows: Record<string, unknown>[] = [];
  for (let i = 4; i < mt.length; i++) {
    const r = mt[i] as unknown[];
    const zip = String(r[3] || "").trim();
    if (!/^\d{5}$/.test(zip)) continue;

    mailRows.push({
      event_id: eventId,
      pieces_sent: safeInt(r[0]) || 0,
      town: safeStr(r[2]),
      zip_code: zip,
      drop_num: 1, // Single drop event
      day_1: safeInt(r[5]) || 0,
      day_2: safeInt(r[6]) || 0,
      day_3: safeInt(r[7]) || 0,
      day_4: safeInt(r[8]) || 0,
      day_5: safeInt(r[9]) || 0,
      day_6: safeInt(r[10]) || 0,
      day_7: safeInt(r[11]) || 0,
      day_8: 0,
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
  console.log("Done! Lilliston CDJR migration complete.");
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
