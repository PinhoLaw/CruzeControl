/**
 * Migration script: Michigan City Ford Feb 2026
 * Reads reference/Michigan_City_Ford_Feb_26__4_.xlsx and inserts into Supabase.
 *
 * Usage: npx tsx scripts/migrate-michigan-city.ts
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

const FILE = path.resolve(__dirname, "../reference/Michigan_City_Ford_Feb_26__4_.xlsx");

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
  console.log("Step 1: Creating Michigan City Ford event...");
  const { data: event, error: evErr } = await sb
    .from("events")
    .insert({
      dealer_name: "MICHIGAN CITY FORD",
      franchise: "FORD",
      city: "MICHIGAN CITY",
      state: "IN",
      start_date: "2026-02-02",
      end_date: "2026-02-07",
      status: "completed",
      jde_pct: 25,
      mail_quantity: 90000,
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

  // Rows 2–18 (indices 1–17), col B(1) = name
  // Row 6 (index 5) HALEY DELUDE = team_leader
  // Row 12 (index 11) MAYCON MIKE GUIMARAES = manager
  // Row 17 (index 16) MIKE LASHLEY = manager
  // Skip HOUSE and blank rows
  const spRows: { name: string; type: string }[] = [];
  for (let i = 1; i <= 17; i++) {
    const r = roster[i] as unknown[];
    const name = safeStr(r?.[1]);
    if (!name) continue;
    if (name === "HOUSE") continue;

    let type = "rep";
    if (i === 5) type = "team_leader"; // HALEY DELUDE
    else if (i === 11) type = "manager"; // MAYCON MIKE GUIMARAES
    else if (i === 16) type = "manager"; // MIKE LASHLEY

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

  // FORD INVENTORY and HYUNDAI INVENTORY share the same column structure:
  // 0=hat_num, 1=location, 3=stock_num, 4=year, 5=make, 6=model,
  // 7=class, 8=color, 9=odometer, 10=vin, 11=trim, 12=age,
  // 13=kbb_trade, 14=kbb_retail, 15=cost
  for (const sheetName of ["FORD INVENTORY", "HYUNDAI INVENTORY"]) {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) {
      console.log(`  Warning: sheet "${sheetName}" not found, skipping`);
      continue;
    }
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: null,
    });

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i] as unknown[];
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
    console.log(`  ${sheetName}: ${invRows.length} vehicles so far`);
  }

  // KIA sheet — same cols but no hat/location, set location="KIA"
  const kiaSheet = wb.Sheets["KIA"];
  if (kiaSheet) {
    const kiaRows = XLSX.utils.sheet_to_json<unknown[]>(kiaSheet, {
      header: 1,
      defval: null,
    });
    const beforeCount = invRows.length;
    for (let i = 1; i < kiaRows.length; i++) {
      const r = kiaRows[i] as unknown[];
      const stockNum = safeStr(r[3]);
      if (!stockNum) continue;

      invRows.push({
        event_id: eventId,
        hat_num: null,
        location: "KIA",
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
    console.log(`  KIA: ${invRows.length - beforeCount} vehicles`);
  } else {
    console.log("  Warning: sheet \"KIA\" not found, skipping");
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

  // Data starts row 10 (index 9), deal# in col 2
  // Col mapping:
  // 2=deal_num, 6=store, 7=stock_num, 8=customer_name, 9=customer_zip,
  // 10=new_used, 11=year, 12=make, 13=model, 14=cost, 15=age,
  // 16=trade_year, 17=trade_make, 18=trade_model, 19=trade_miles,
  // 20=acv, 21=payoff, 22=salesperson, 23=sp2, 24=front_gross,
  // 25=lender, 26=rate, 27=reserve, 28=warranty, 29=aft1, 30=gap,
  // 31=fi_total, 32=total_gross, 37=notes
  const dealRows: Record<string, unknown>[] = [];
  const skippedSp = new Set<string>();

  for (let i = 9; i < dl.length; i++) {
    const r = dl[i] as unknown[];
    const dealNum = r[2];
    if (typeof dealNum !== "number") continue;

    const spName = safeStr(r[22]);
    const sp2Name = safeStr(r[23]);
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
      new_used: safeStr(r[10]),
      year: safeInt(r[11]),
      make: safeStr(r[12]),
      model: safeStr(r[13]),
      cost: safeInt(r[14]),
      age: safeInt(r[15]),
      trade_year: safeStr(r[16]),
      trade_make: safeStr(r[17]),
      trade_model: safeStr(r[18]),
      trade_miles: safeStr(r[19]),
      acv: safeInt(r[20]) || 0,
      payoff: safeInt(r[21]) || 0,
      salesperson_id: spId,
      salesperson2_id: sp2Id,
      closer_id: null,
      closer_type: null,
      front_gross: safeInt(r[24]) || 0,
      lender: safeStr(r[25]),
      rate: safeNum(r[26]),
      reserve: safeInt(r[27]) || 0,
      warranty: safeInt(r[28]) || 0,
      aft1: safeInt(r[29]) || 0,
      gap: safeInt(r[30]) || 0,
      funded: false,
      notes: safeStr(r[37]),
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

  // Rows 5–8 (indices 4–7), col 0=pieces_sent, 2=town, 3=zip_code,
  // col 5=day_1 through col 10=day_6
  const mailRows: Record<string, unknown>[] = [];
  for (let i = 4; i <= 7; i++) {
    const r = mt[i] as unknown[];
    if (!r) continue;
    const zip = safeStr(r[3]);
    if (!zip) continue;

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
      day_7: 0,
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
  console.log("Done! Michigan City Ford migration complete.");
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
