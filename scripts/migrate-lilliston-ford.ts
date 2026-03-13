/**
 * Migration script: Lilliston Ford Dec 2025 / Jan 2026
 * Reads reference/Lilliston_Ford_Dec_25_Jan_26__2_.xlsx and inserts into Supabase.
 *
 * Usage: npx tsx scripts/migrate-lilliston-ford.ts
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

const FILE = path.resolve(__dirname, "../reference/Lilliston_Ford_Dec_25_Jan_26__2_.xlsx");

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

function excelDateToISO(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "number") {
    const date = XLSX.SSF.parse_date_code(v);
    if (date) {
      const y = date.y;
      const m = String(date.m).padStart(2, "0");
      const d = String(date.d).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }
  return null;
}

async function main() {
  const wb = XLSX.readFile(FILE);

  // ── Step 1: Create Event ──────────────────────────────────────────────
  console.log("Step 1: Creating Lilliston Ford event...");
  const { data: event, error: evErr } = await sb
    .from("events")
    .insert({
      dealer_name: "LILLISTON FORD",
      franchise: "FORD",
      city: "VINELAND",
      state: "NJ",
      start_date: "2025-12-30",
      end_date: "2026-01-10",
      status: "completed",
      pack_new: 750,
      pack_used: 750,
      jde_pct: 25,
      mail_quantity: 90000,
      marketing_cost: 55332,
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

  // Rows 1–18 (0-indexed), col B(1) = name
  // Index 5 HALEY DELUDE = team_leader
  // Index 12 MIKE GODWIN = manager
  // Index 13 MAKOTO = manager
  // Skip HOUSE and blank rows. Include IRELAND BARE despite "no" in col A.
  const spRows: { name: string; type: string }[] = [];
  for (let i = 1; i <= 18; i++) {
    const r = roster[i] as unknown[];
    const name = safeStr(r?.[1]);
    if (!name) continue;
    if (name === "HOUSE") continue;

    let type = "rep";
    if (i === 5) type = "team_leader"; // HALEY DELUDE
    else if (i === 12) type = "manager"; // MIKE GODWIN
    else if (i === 13) type = "manager"; // MAKOTO

    spRows.push({ name, type });
  }

  const spInsert = spRows.map((s) => ({
    event_id: eventId,
    name: s.name,
    type: s.type,
    confirmed: true,
  }));

  // Add HOUSE as a rep
  spInsert.push({
    event_id: eventId,
    name: "HOUSE",
    type: "rep",
    confirmed: true,
  });

  const { data: insertedSp, error: spErr } = await sb
    .from("salespeople")
    .insert(spInsert)
    .select("id, name, type");

  if (spErr) {
    console.error("Failed to insert salespeople:", spErr.message);
    process.exit(1);
  }
  console.log(`  Inserted ${insertedSp!.length} salespeople`);

  const nameToId: Record<string, string> = {};
  const managerNameToId: Record<string, string> = {};
  for (const sp of insertedSp!) {
    nameToId[sp.name] = sp.id;
    if (sp.type === "manager") {
      managerNameToId[sp.name] = sp.id;
    }
  }

  // ── Step 3: Inventory ─────────────────────────────────────────────────
  console.log("\nStep 3: Inserting inventory...");
  const inv = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets["INVENTORY LOG"], {
    header: 1,
    defval: null,
  });

  // Row 2+ (index 1+)
  // 2=status, 3=stock_num, 4=year, 5=make, 6=model, 7=class,
  // 8=color, 9=odometer, 10=vin, 11=trim, 12=age,
  // 13=kbb_trade, 14=kbb_retail, 15=cost
  const invRows: Record<string, unknown>[] = [];
  for (let i = 1; i < inv.length; i++) {
    const r = inv[i] as unknown[];
    const stockNum = safeStr(r[3]);
    if (!stockNum) continue;

    invRows.push({
      event_id: eventId,
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

  // Data starts row 9 (index 8), deal# in col 2
  // Skip rows where col 5 = "UNWIND"
  // Col mapping:
  // 2=deal_num, 6=deal_date, 7=stock_num, 8=customer_name, 10=customer_zip,
  // 11=new_used, 12=year, 13=make, 14=model, 15=cost, 16=age,
  // 17=trade_year, 18=trade_make, 19=trade_model, 20=trade_miles,
  // 21=acv, 22=payoff, 23=salesperson, 24=sp2, 25=front_gross,
  // 26=lender, 27=rate, 28=reserve, 29=warranty, 30=aft1, 31=aft2,
  // 32=gap, 33=fi_total, 34=total_gross, 36=notes, 38=closer
  const dealRows: Record<string, unknown>[] = [];
  const skippedSp = new Set<string>();

  for (let i = 8; i < dl.length; i++) {
    const r = dl[i] as unknown[];
    const dealNum = r[2];
    if (typeof dealNum !== "number") continue;

    // Skip UNWIND deals
    const col5 = safeStr(r[5]);
    if (col5 === "UNWIND") continue;

    const spName = safeStr(r[23]);
    const sp2Name = safeStr(r[24]);
    const spId = spName ? nameToId[spName] || null : null;
    const sp2Id = sp2Name ? nameToId[sp2Name] || null : null;

    if (spName && !spId) skippedSp.add(spName);
    if (sp2Name && !sp2Id) skippedSp.add(sp2Name);

    // Closer lookup — match by name to managers
    const closerName = safeStr(r[38]);
    let closerId: string | null = null;
    let closerType: string | null = null;
    if (closerName) {
      if (managerNameToId[closerName]) {
        closerId = managerNameToId[closerName];
        closerType = "manager";
      } else if (nameToId[closerName]) {
        closerId = nameToId[closerName];
        closerType = "rep";
      }
    }

    // Handle aft2 by adding to aft1
    const aft1Val = safeInt(r[30]) || 0;
    const aft2Val = safeInt(r[31]) || 0;
    const combinedAft1 = aft1Val + aft2Val || 0;

    dealRows.push({
      event_id: eventId,
      deal_num: String(dealNum),
      deal_date: excelDateToISO(r[6]),
      store: null,
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
      closer_id: closerId,
      closer_type: closerType,
      front_gross: safeInt(r[25]) || 0,
      lender: safeStr(r[26]),
      rate: safeNum(r[27]),
      reserve: safeInt(r[28]) || 0,
      warranty: safeInt(r[29]) || 0,
      aft1: combinedAft1,
      gap: safeInt(r[32]) || 0,
      funded: false,
      notes: safeStr(r[36]),
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

  // Rows 5–22 (indices 4–21), col 0=pieces_sent, 2=town, 3=zip_code,
  // col 5=day_1 through col 14=day_10. Skip where zip is empty or non-numeric.
  const mailRows: Record<string, unknown>[] = [];
  for (let i = 4; i <= 21; i++) {
    const r = mt[i] as unknown[];
    if (!r) continue;
    const zip = String(r[3] || "").trim();
    if (!/^\d{5}$/.test(zip)) continue;

    mailRows.push({
      event_id: eventId,
      pieces_sent: safeInt(r[0]) || 0,
      town: safeStr(r[2]),
      zip_code: zip,
      drop_num: 1,
      day_1: safeInt(r[5]) || 0,
      day_2: safeInt(r[6]) || 0,
      day_3: safeInt(r[7]) || 0,
      day_4: safeInt(r[8]) || 0,
      day_5: safeInt(r[9]) || 0,
      day_6: safeInt(r[10]) || 0,
      day_7: safeInt(r[11]) || 0,
      day_8: safeInt(r[12]) || 0,
      day_9: safeInt(r[13]) || 0,
      day_10: safeInt(r[14]) || 0,
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
  console.log("Done! Lilliston Ford migration complete.");
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
