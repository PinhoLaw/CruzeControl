/**
 * Refresh Tacoma Nissan event data from the latest Excel spreadsheet.
 * Deletes and re-inserts: deals, inventory, mail_tracking.
 *
 * Usage: npx tsx scripts/update-tacoma-nissan.ts
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

const FILE = path.resolve(
  __dirname,
  "../reference/TACOMA_NISSAN_MARCH_26___8_.xlsx"
);

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

  // ── Step 1: Find the Tacoma Nissan event ────────────────────────────────
  console.log("Step 1: Finding Tacoma Nissan event...");
  const { data: events, error: evErr } = await sb
    .from("events")
    .select("id")
    .eq("dealer_name", "TACOMA NISSAN");

  if (evErr || !events || events.length === 0) {
    console.error("Could not find TACOMA NISSAN event:", evErr?.message);
    process.exit(1);
  }
  const EVENT_ID = events[0].id;
  console.log(`  Found event: ${EVENT_ID}`);

  // ── Step 2: Load salespeople for name→id mapping ────────────────────────
  console.log("\nStep 2: Loading salespeople...");
  const { data: spData } = await sb
    .from("salespeople")
    .select("id, name")
    .eq("event_id", EVENT_ID);

  const nameToId: Record<string, string> = {};
  for (const sp of spData || []) {
    nameToId[sp.name.toUpperCase()] = sp.id;
  }
  console.log(`  ${Object.keys(nameToId).length} salespeople loaded`);

  // ── Step 3: Delete existing data ────────────────────────────────────────
  console.log("\nStep 3: Deleting existing data...");

  const { count: delDeals } = await sb
    .from("deals")
    .delete({ count: "exact" })
    .eq("event_id", EVENT_ID);
  console.log(`  Deleted ${delDeals ?? 0} deals`);

  const { count: delInv } = await sb
    .from("inventory")
    .delete({ count: "exact" })
    .eq("event_id", EVENT_ID);
  console.log(`  Deleted ${delInv ?? 0} inventory rows`);

  const { count: delMail } = await sb
    .from("mail_tracking")
    .delete({ count: "exact" })
    .eq("event_id", EVENT_ID);
  console.log(`  Deleted ${delMail ?? 0} mail tracking rows`);

  // ── Step 4: Insert deals from "DEAL LOG" sheet ──────────────────────────
  console.log("\nStep 4: Inserting deals...");
  const dealSheet = wb.Sheets["DEAL LOG"];
  if (!dealSheet) {
    console.error("  Sheet 'DEAL LOG' not found! Available:", wb.SheetNames);
    process.exit(1);
  }

  const dealRows: unknown[][] = XLSX.utils.sheet_to_json(dealSheet, {
    header: 1,
    defval: null,
  });

  // Find salesperson ID by name (case-insensitive fuzzy match)
  function findSp(name: unknown): string | null {
    if (name == null) return null;
    const n = String(name).trim().toUpperCase();
    if (!n) return null;
    // Direct match
    if (nameToId[n]) return nameToId[n];
    // Partial match
    for (const [key, id] of Object.entries(nameToId)) {
      if (key.includes(n) || n.includes(key)) return id;
    }
    console.warn(`    SP not found: "${n}"`);
    return null;
  }

  // Sale starts March 9, 2026. Each time day deal# resets to 1 = new day.
  const SALE_START = new Date("2026-03-09");
  const deals: Record<string, unknown>[] = [];
  let currentDay = 0;
  let prevDayDealNum = 0;
  let totalDealNum = 0;

  for (let i = 9; i < dealRows.length; i++) {
    const r = dealRows[i];
    if (!r || r.length === 0) continue;

    // col E (index 4) must be a number 1-500
    const dayDealNum = safeInt(r[4]);
    if (dayDealNum == null || dayDealNum < 1 || dayDealNum > 500) continue;

    // Detect day boundary: deal# resets (goes to 1 or drops below previous)
    if (dayDealNum <= prevDayDealNum) {
      currentDay++;
    }
    if (currentDay === 0) currentDay = 1;
    prevDayDealNum = dayDealNum;
    totalDealNum++;

    // Calculate deal_date from day offset
    const dealDate = new Date(SALE_START);
    dealDate.setDate(dealDate.getDate() + (currentDay - 1));
    const dateStr = dealDate.toISOString().slice(0, 10); // YYYY-MM-DD

    deals.push({
      event_id: EVENT_ID,
      deal_num: String(totalDealNum),
      deal_date: dateStr,
      store: safeStr(r[6]),
      customer_name: safeStr(r[8]),
      customer_zip: safeStr(r[9]),
      new_used: safeStr(r[10]),
      year: safeInt(r[11]),
      make: safeStr(r[12]),
      model: safeStr(r[13]),
      cost: safeNum(r[14]),
      age: safeInt(r[15]),
      trade_year: safeStr(r[16]),
      trade_make: safeStr(r[17]),
      trade_model: safeStr(r[18]),
      trade_miles: safeStr(r[19]),
      acv: safeInt(r[20]),
      payoff: safeInt(r[21]),
      salesperson_id: findSp(r[23]),
      salesperson2_id: findSp(r[24]),
      front_gross: safeNum(r[25]),
      lender: safeStr(r[26]),
      rate: safeNum(r[27]),
      reserve: safeNum(r[28]),
      warranty: safeNum(r[29]),
      aft1: safeNum(r[30]),
      gap: safeNum(r[31]),
      fi_total: safeNum(r[32]),
      total_gross: safeNum(r[33]),
      notes: safeStr(r[45]),
    });
  }
  console.log(`  ${currentDay} sale days detected (Mar 9 – Mar ${8 + currentDay})`);

  if (deals.length > 0) {
    // Insert in batches of 50
    for (let i = 0; i < deals.length; i += 50) {
      const batch = deals.slice(i, i + 50);
      const { error } = await sb.from("deals").insert(batch);
      if (error) {
        console.error(`  Deal insert error (batch ${i}):`, error.message);
      }
    }
  }
  console.log(`  Inserted ${deals.length} deals`);

  // ── Step 5: Insert inventory from "REDO INVENTORY" sheet ────────────────
  console.log("\nStep 5: Inserting inventory...");
  const invSheet = wb.Sheets["REDO INVENTORY"];
  if (!invSheet) {
    console.error(
      "  Sheet 'REDO INVENTORY' not found! Available:",
      wb.SheetNames
    );
    process.exit(1);
  }

  const invRows: unknown[][] = XLSX.utils.sheet_to_json(invSheet, {
    header: 1,
    defval: null,
  });

  const inventory: Record<string, unknown>[] = [];
  for (let i = 1; i < invRows.length; i++) {
    const r = invRows[i];
    if (!r || r.length === 0) continue;

    // col D (index 3) = Stock# must not be empty
    const stockNum = safeStr(r[3]);
    if (!stockNum) continue;

    inventory.push({
      event_id: EVENT_ID,
      hat_num: safeStr(r[0]),
      notes: safeStr(r[1]),
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
      drivetrain: safeStr(r[13]),
      kbb_trade: safeInt(r[14]),
      kbb_retail: safeInt(r[15]),
      cost: safeInt(r[16]),
    });
  }

  if (inventory.length > 0) {
    for (let i = 0; i < inventory.length; i += 50) {
      const batch = inventory.slice(i, i + 50);
      const { error } = await sb.from("inventory").insert(batch);
      if (error) {
        console.error(`  Inventory insert error (batch ${i}):`, error.message);
      }
    }
  }
  console.log(`  Inserted ${inventory.length} inventory rows`);

  // ── Step 6: Insert mail tracking from "MAIL TRACKING" sheet ─────────────
  console.log("\nStep 6: Inserting mail tracking...");
  const mailSheet = wb.Sheets["MAIL TRACKING"];
  if (!mailSheet) {
    console.error(
      "  Sheet 'MAIL TRACKING' not found! Available:",
      wb.SheetNames
    );
    process.exit(1);
  }

  const mailRows: unknown[][] = XLSX.utils.sheet_to_json(mailSheet, {
    header: 1,
    defval: null,
  });

  const mailTracking: Record<string, unknown>[] = [];
  for (let i = 3; i < mailRows.length; i++) {
    const r = mailRows[i];
    if (!r || r.length === 0) continue;

    // col D (index 3) = ZIP must be a 5-digit number (skip junk like 0, TOTAL, etc.)
    const zip = safeStr(r[3]);
    if (!zip || isNaN(Number(zip)) || zip.length < 4) continue;
    // Skip rows without pieces_sent (summary/junk rows)
    if (safeInt(r[1]) == null) continue;

    mailTracking.push({
      event_id: EVENT_ID,
      drop_num: safeInt(r[0]),
      pieces_sent: safeInt(r[1]),
      town: safeStr(r[2]),
      zip_code: zip,
      day_1: safeInt(r[5]) ?? 0,
      day_2: safeInt(r[6]) ?? 0,
      day_3: safeInt(r[7]) ?? 0,
      day_4: safeInt(r[8]) ?? 0,
      day_5: safeInt(r[9]) ?? 0,
      day_6: safeInt(r[10]) ?? 0,
      day_7: safeInt(r[11]) ?? 0,
      day_8: safeInt(r[12]) ?? 0,
      day_9: safeInt(r[13]) ?? 0,
      day_10: safeInt(r[14]) ?? 0,
      day_11: safeInt(r[15]) ?? 0,
    });
  }

  if (mailTracking.length > 0) {
    const { error } = await sb.from("mail_tracking").insert(mailTracking);
    if (error) {
      console.error("  Mail tracking insert error:", error.message);
    }
  }
  console.log(`  Inserted ${mailTracking.length} mail tracking rows`);

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════");
  console.log("Done! Tacoma Nissan refresh complete.");
  console.log(`  Deals:         ${deals.length}`);
  console.log(`  Inventory:     ${inventory.length}`);
  console.log(`  Mail Tracking: ${mailTracking.length}`);
  console.log("══════════════════════════════════════════════");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
