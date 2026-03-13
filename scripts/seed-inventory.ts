/**
 * One-time seed script: reads the "REDO INVENTORY" sheet from the Tacoma Nissan
 * Excel file and inserts all vehicles into the inventory table.
 *
 * Usage:  npx tsx scripts/seed-inventory.ts
 */

import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  // 1. Find the Tacoma Nissan event
  const { data: events, error: evErr } = await supabase
    .from("events")
    .select("id, dealer_name")
    .ilike("dealer_name", "%TACOMA NISSAN%");

  if (evErr) {
    console.error("Failed to query events:", evErr.message);
    process.exit(1);
  }
  if (!events || events.length === 0) {
    console.error("No event found with dealer_name matching 'TACOMA NISSAN'");
    process.exit(1);
  }

  const eventId = events[0].id;
  console.log(`Found event: ${events[0].dealer_name} (${eventId})`);

  // 2. Read the Excel file
  const xlsxPath = path.resolve(__dirname, "../reference/TACOMA NISSAN MARCH 26  (2).xlsx");
  const workbook = XLSX.readFile(xlsxPath);

  const sheetName = "REDO INVENTORY";
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    console.error(`Sheet "${sheetName}" not found. Available sheets:`, workbook.SheetNames);
    process.exit(1);
  }

  // Parse as array of arrays (no header mapping — we'll map by column index)
  const rows: (string | number | null | undefined)[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
  });

  // Skip header row (row 0)
  const dataRows = rows.slice(1);
  console.log(`Total rows in sheet: ${dataRows.length}`);

  // 3. Map rows to inventory records
  const records: Record<string, unknown>[] = [];

  for (const row of dataRows) {
    const stockNum = row[3]; // Column D = stock_num
    if (!stockNum || String(stockNum).trim() === "") continue;

    const toStr = (v: unknown) => (v != null && String(v).trim() !== "" ? String(v).trim() : null);
    const toNum = (v: unknown) => {
      if (v == null) return null;
      const n = typeof v === "number" ? v : Number(String(v).replace(/[,$]/g, ""));
      return isNaN(n) ? null : n;
    };

    records.push({
      event_id: eventId,
      hat_num: toStr(row[0]),      // A
      notes: toStr(row[1]),        // B
      location: toStr(row[2]),     // C
      stock_num: toStr(row[3]),    // D
      year: toNum(row[4]),         // E
      make: toStr(row[5]),         // F
      model: toStr(row[6]),        // G
      class: toStr(row[7]),        // H
      color: toStr(row[8]),        // I
      odometer: toNum(row[9]),     // J
      vin: toStr(row[10]),         // K
      trim: toStr(row[11]),        // L
      age: toNum(row[12]),         // M
      drivetrain: toStr(row[13]),  // N
      kbb_trade: toNum(row[14]),   // O
      kbb_retail: toNum(row[15]),  // P
      cost: toNum(row[16]),        // Q
    });
  }

  console.log(`Vehicles to insert (with stock#): ${records.length}`);

  if (records.length === 0) {
    console.log("Nothing to insert.");
    return;
  }

  // 4. Clear existing inventory for this event (idempotent re-runs)
  const { error: delErr } = await supabase
    .from("inventory")
    .delete()
    .eq("event_id", eventId);

  if (delErr) {
    console.error("Failed to clear existing inventory:", delErr.message);
    process.exit(1);
  }
  console.log("Cleared existing inventory for this event.");

  // 5. Insert in batches of 50
  const BATCH_SIZE = 50;
  let inserted = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const { error: insErr } = await supabase.from("inventory").insert(batch);

    if (insErr) {
      console.error(`Failed to insert batch starting at row ${i}:`, insErr.message);
      process.exit(1);
    }
    inserted += batch.length;
    console.log(`  Inserted ${inserted} / ${records.length}`);
  }

  console.log(`\nDone! ${inserted} vehicles seeded for ${events[0].dealer_name}.`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
