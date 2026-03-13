/**
 * Migration script: Ford of Peoria June 2025
 * Reads reference/Peoria_Ford_June_25.xlsx and inserts into Supabase.
 *
 * Usage: npx tsx scripts/migrate-peoria-ford-june.ts
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

const FILE = path.resolve(__dirname, "../reference/Peoria_Ford_June_25.xlsx");

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
  console.log("Step 1: Creating Ford of Peoria June 2025 event...");
  const { data: event, error: evErr } = await sb
    .from("events")
    .insert({
      dealer_name: "FORD OF PEORIA",
      franchise: "FORD",
      street: "2211 W PIONEER PKWY",
      city: "PEORIA",
      state: "IL",
      zip: "61615",
      start_date: "2025-06-04",
      end_date: "2025-06-14",
      status: "completed",
      jde_pct: 25,
      mail_quantity: 70000,
      marketing_cost: 62680,
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

  // Rows 1–22, col B(1) = name
  // Detect team_leader/manager from col D(3)
  // Skip HOUSE (added separately) and blank rows
  const spRows: { name: string; type: string }[] = [];
  for (let i = 1; i <= 22; i++) {
    const r = roster[i] as unknown[];
    const name = safeStr(r?.[1]);
    if (!name) continue;
    if (name === "HOUSE") continue;

    const colD = safeStr(r?.[3]);
    let type = "rep";
    if (colD === "Team Leader") type = "team_leader";
    else if (colD === "F&I Manager") type = "manager";

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

  // Add ALVIN STONEY as rep (appears in deals but not roster)
  spInsert.push({
    event_id: eventId,
    name: "ALVIN STONEY",
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

  const nameToId: Record<string, string> = {};
  for (const sp of insertedSp!) {
    nameToId[sp.name] = sp.id;
  }

  // ── Step 3: Inventory ─────────────────────────────────────────────────
  console.log("\nStep 3: Inserting inventory...");
  const invRows: Record<string, unknown>[] = [];

  // FORD sheet: A(0)=hat_num, B(1)=status, C(2)=location, D(3)=stock_num,
  // E(4)=year, F(5)=make, G(6)=model, H(7)=class, I(8)=color,
  // J(9)=odometer, K(10)=vin, L(11)=trim, M(12)=age,
  // N(13)=kbb_trade, O(14)=kbb_retail, P(15)=cost
  const fordSheet = wb.Sheets["FORD"];
  if (fordSheet) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(fordSheet, { header: 1, defval: null });
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i] as unknown[];
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
    console.log(`  FORD: ${invRows.length} vehicles`);
  }

  // TOYOTA and LEXUS sheets: A(0)=hat_num, B(1)=status, C(2)=stock_num,
  // D(3)=year, E(4)=make, F(5)=model, G(6)=class, H(7)=color,
  // I(8)=odometer, J(9)=vin, K(10)=trim, L(11)=age,
  // M(12)=kbb_trade, N(13)=kbb_retail, O(14)=cost
  for (const sheetName of ["TOYOTA", "LEXUS"]) {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) {
      console.log(`  Warning: sheet "${sheetName}" not found, skipping`);
      continue;
    }
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
    const beforeCount = invRows.length;
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i] as unknown[];
      const stockNum = safeStr(r[2]);
      if (!stockNum) continue;
      invRows.push({
        event_id: eventId,
        hat_num: safeStr(r[0]),
        stock_num: stockNum,
        year: safeInt(r[3]),
        make: safeStr(r[4]),
        model: safeStr(r[5]),
        class: safeStr(r[6]),
        color: safeStr(r[7]),
        odometer: safeInt(r[8]),
        vin: safeStr(r[9]),
        trim: safeStr(r[10]),
        age: safeInt(r[11]),
        kbb_trade: safeInt(r[12]),
        kbb_retail: safeInt(r[13]),
        cost: safeInt(r[14]),
      });
    }
    console.log(`  ${sheetName}: ${invRows.length - beforeCount} vehicles`);
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
  console.log(`  Inserted ${invInserted} total inventory items`);

  // ── Step 4: Deals ─────────────────────────────────────────────────────
  console.log("\nStep 4: Inserting deals...");
  const dl = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets["FORD DEAL LOG"], {
    header: 1,
    defval: null,
  });

  // Data starts row 9 (index 8), deal# in col C (index 2)
  // C(2)=deal_num, G(6)=store, H(7)=stock_num, I(8)=customer_name,
  // J(9)=customer_zip, L(11)=new_used, M(12)=year, N(13)=make,
  // O(14)=model, P(15)=cost, Q(16)=age, R(17)=trade_year,
  // S(18)=trade_make, T(19)=trade_model, U(20)=trade_miles,
  // V(21)=acv, W(22)=payoff, X(23)=salesperson, Y(24)=sp2,
  // Z(25)=front_gross, AA(26)=lender, AB(27)=rate, AC(28)=reserve,
  // AD(29)=warranty, AF(31)=gap, AN(39)=notes
  const dealRows: Record<string, unknown>[] = [];
  const skippedSp = new Set<string>();

  for (let i = 8; i < dl.length; i++) {
    const r = dl[i] as unknown[];
    const dealNum = r[2];
    if (typeof dealNum !== "number") continue;

    const spName = safeStr(r[23]);
    const sp2Name = safeStr(r[24]);
    const spId = spName ? nameToId[spName] || null : null;
    const sp2Id = sp2Name ? nameToId[sp2Name] || null : null;

    if (spName && !spId) skippedSp.add(spName);
    if (sp2Name && !sp2Id) skippedSp.add(sp2Name);

    dealRows.push({
      event_id: eventId,
      deal_num: String(dealNum),
      deal_date: null,
      store: safeStr(r[6]),
      customer_name: safeStr(r[8]),
      customer_zip: safeStr(r[9]),
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
      aft1: 0,
      gap: safeInt(r[31]) || 0,
      funded: false,
      notes: safeStr(r[39]),
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

  // Row 5+ (index 4+), where col A(0) is a number and col D(3) is a zip
  // A(0)=pieces_sent, C(2)=town, D(3)=zip_code,
  // G(6)=day_1 through O(14)=day_9
  const mailRows: Record<string, unknown>[] = [];
  for (let i = 4; i < mt.length; i++) {
    const r = mt[i] as unknown[];
    if (!r) continue;
    if (typeof r[0] !== "number") continue;
    const zip = safeStr(r[3]);
    if (!zip) continue;

    mailRows.push({
      event_id: eventId,
      pieces_sent: safeInt(r[0]) || 0,
      town: safeStr(r[2]),
      zip_code: zip,
      drop_num: 1,
      day_1: safeInt(r[6]) || 0,
      day_2: safeInt(r[7]) || 0,
      day_3: safeInt(r[8]) || 0,
      day_4: safeInt(r[9]) || 0,
      day_5: safeInt(r[10]) || 0,
      day_6: safeInt(r[11]) || 0,
      day_7: safeInt(r[12]) || 0,
      day_8: safeInt(r[13]) || 0,
      day_9: safeInt(r[14]) || 0,
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
  console.log("Done! Ford of Peoria June 2025 migration complete.");
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
