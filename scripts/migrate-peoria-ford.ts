/**
 * Migration script: Peoria Ford Dec 2025
 * Reads reference/Peoria_Ford_Dec_25__8_.xlsx and inserts into Supabase.
 *
 * Usage: npx tsx scripts/migrate-peoria-ford.ts
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

const FILE = path.resolve(__dirname, "../reference/Peoria_Ford_Dec_25__8_.xlsx");

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
  console.log("Step 1: Creating Ford of Peoria event...");
  const { data: event, error: evErr } = await sb
    .from("events")
    .insert({
      dealer_name: "FORD OF PEORIA",
      franchise: "FORD",
      street: "2211 W Pioneer Pkwy",
      city: "PEORIA",
      state: "IL",
      zip: "61615",
      start_date: "2025-12-03",
      end_date: "2025-12-13",
      status: "completed",
      jde_pct: 25,
      mail_quantity: 90000,
      marketing_cost: 50310,
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

  // Rows 2–21 (indices 1–20), col B(1) = name
  // Row 6 (index 5) BRYANT ROGERS = team_leader
  // Row 13 (index 12) MAKOTO = manager
  // Row 17 (index 16) ABDUL AL TABBAH = manager
  // Skip HOUSE
  const spRows: { name: string; type: string }[] = [];
  for (let i = 1; i <= 20; i++) {
    const r = roster[i] as unknown[];
    const name = safeStr(r?.[1]);
    if (!name) continue;
    if (name === "HOUSE") continue;

    let type = "rep";
    if (i === 5) type = "team_leader"; // BRYANT ROGERS
    else if (i === 12) type = "manager"; // MAKOTO
    else if (i === 16) type = "manager"; // ABDUL AL TABBAH

    spRows.push({ name, type });
  }

  const spInsert = spRows.map((s) => ({
    event_id: eventId,
    name: s.name,
    type: s.type,
    confirmed: true,
  }));

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
  const inv = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets["FORD"], {
    header: 1,
    defval: null,
  });

  // Row 2+ (index 1+), col 5=stock_num, 6=year, 7=make, 8=model,
  // 9=color, 10=odometer, 11=vin, 12=trim, 13=age, 14=drivetrain,
  // 15=kbb_trade, 16=kbb_retail, 17=cost, 4=location
  const invRows: Record<string, unknown>[] = [];
  for (let i = 1; i < inv.length; i++) {
    const r = inv[i] as unknown[];
    const stockNum = safeStr(r[5]);
    if (!stockNum) continue;

    invRows.push({
      event_id: eventId,
      stock_num: stockNum,
      year: safeInt(r[6]),
      make: safeStr(r[7]),
      model: safeStr(r[8]),
      color: safeStr(r[9]),
      odometer: safeInt(r[10]),
      vin: safeStr(r[11]),
      trim: safeStr(r[12]),
      age: safeInt(r[13]),
      drivetrain: safeStr(r[14]),
      kbb_trade: safeInt(r[15]),
      kbb_retail: safeInt(r[16]),
      cost: safeInt(r[17]),
      location: safeStr(r[4]),
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
  const dl = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets["FORD DEAL LOG"], {
    header: 1,
    defval: null,
  });

  // Data starts row 9 (index 8), deal number in col E (index 4)
  // Col mapping:
  // 4=deal_num, 6=store, 7=stock_num, 8=customer_name, 9=customer_zip,
  // 10=new_used, 11=year, 12=make, 13=model, 14=cost, 15=age,
  // 16=trade_year, 17=trade_make, 18=trade_model, 19=trade_miles,
  // 20=acv, 21=payoff, 22=salesperson, 23=sp2, 24=front_gross,
  // 25=lender, 26=rate, 27=reserve, 28=warranty, 29=aft1, 30=gap,
  // 31=fi_total, 32=total_gross
  const dealRows: Record<string, unknown>[] = [];
  const skippedSp = new Set<string>();

  for (let i = 8; i < dl.length; i++) {
    const r = dl[i] as unknown[];
    const dealNum = r[4];
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
      notes: null,
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

  // Row 5+ (index 4+), col 0=pieces_sent, 2=town, 3=zip_code,
  // col 6=day_1 through col 14=day_9. Skip where zip is empty.
  const mailRows: Record<string, unknown>[] = [];
  for (let i = 4; i < mt.length; i++) {
    const r = mt[i] as unknown[];
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

  // ── Summary ───────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════");
  console.log("Done! Ford of Peoria migration complete.");
  console.log(`  Event:     ${event.dealer_name} (${eventId})`);
  console.log(`  Roster:    ${insertedSp!.length} salespeople`);
  console.log(`  Inventory: ${invInserted} vehicles`);
  console.log(`  Deals:     ${dealsInserted}`);
  console.log(`  Mail:      ${mailRows.length} ZIP rows`);
  console.log("══════════════════════════════════════════════");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
