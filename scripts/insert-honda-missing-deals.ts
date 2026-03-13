/**
 * Fix Honda City deals: delete all existing deals and re-insert all 39 from spreadsheet.
 *
 * The original migration had two bugs:
 * 1. Used col 2 (row counter) instead of col 3 (actual deal_num)
 * 2. Used safeInt (rounding) on monetary fields that have decimal values
 * 3. Skipped 6 rows where col 2 was empty/`.` instead of a number
 *
 * This script replaces all deals with correct data.
 *
 * Usage: npx tsx scripts/insert-honda-missing-deals.ts
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

const EVENT_ID = "3011dd38-2464-4a1c-ac09-a578d7868a32";
const FILE = path.resolve(__dirname, "../reference/HONDA_CITY_FEB_26__4_.xlsx");

function safeNum(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function safeInt(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return isNaN(n) ? null : Math.round(n);
}

function safeStr(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
}

async function main() {
  // Step 1: Get salesperson name -> ID mapping
  console.log("Fetching salespeople for event...");
  const { data: spList, error: spErr } = await sb
    .from("salespeople")
    .select("id, name")
    .eq("event_id", EVENT_ID);

  if (spErr) {
    console.error("Failed to fetch salespeople:", spErr.message);
    process.exit(1);
  }

  const nameToId: Record<string, string> = {};
  for (const sp of spList!) {
    nameToId[sp.name] = sp.id;
  }
  console.log(`  Found ${spList!.length} salespeople`);

  // Step 2: Read spreadsheet
  console.log("Reading spreadsheet...");
  const wb = XLSX.readFile(FILE);
  const dl = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets["DEAL LOG"], {
    header: 1,
    defval: null,
  });

  // Step 3: Delete ALL existing deals for this event
  console.log("\nStep 3: Deleting all existing deals for this event...");
  const { data: existing, error: countErr } = await sb
    .from("deals")
    .select("id")
    .eq("event_id", EVENT_ID);
  if (countErr) {
    console.error("Failed to count existing deals:", countErr.message);
    process.exit(1);
  }
  console.log(`  Found ${existing!.length} existing deals to delete`);

  const { error: delErr } = await sb
    .from("deals")
    .delete()
    .eq("event_id", EVENT_ID);
  if (delErr) {
    console.error("Failed to delete existing deals:", delErr.message);
    process.exit(1);
  }
  console.log("  Deleted successfully");

  // Step 4: Build ALL deal rows from spreadsheet
  console.log("\nStep 4: Building all deal rows from spreadsheet...");
  const dealRows: Record<string, unknown>[] = [];
  const skippedSp = new Set<string>();

  for (let i = 9; i < dl.length; i++) {
    const r = dl[i] as unknown[];
    const dealNum = r[3]; // col 3 = actual deal number
    if (dealNum == null || dealNum === "") continue;

    const spName = safeStr(r[22]);
    const sp2Name = safeStr(r[23]);
    const spId = spName ? nameToId[spName] || null : null;
    const sp2Id = sp2Name ? nameToId[sp2Name] || null : null;

    if (spName && !spId) skippedSp.add(spName);
    if (sp2Name && !sp2Id) skippedSp.add(sp2Name);

    dealRows.push({
      event_id: EVENT_ID,
      deal_num: String(dealNum),
      deal_date: null,
      store: null,
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
      acv: safeNum(r[20]) || 0,
      payoff: safeNum(r[21]) || 0,
      salesperson_id: spId,
      salesperson2_id: sp2Id,
      closer_id: null,
      closer_type: null,
      front_gross: safeNum(r[24]) || 0, // NOT rounded - has decimal cents
      lender: safeStr(r[25]),
      rate: safeNum(r[26]),
      reserve: safeNum(r[27]) || 0, // NOT rounded
      warranty: safeNum(r[28]) || 0, // NOT rounded
      aft1: safeNum(r[29]) || 0, // NOT rounded
      gap: safeNum(r[30]) || 0, // NOT rounded
      funded: false,
      notes: safeStr(r[37]),
      // fi_total and total_gross auto-calculated by DB trigger recalc_deal_totals
    });
  }

  if (skippedSp.size > 0) {
    console.log(
      `  Warning: unmatched salesperson names: ${Array.from(skippedSp).join(", ")}`
    );
  }
  console.log(`  Built ${dealRows.length} deal rows`);

  // Step 5: Insert all deals in batches
  console.log("\nStep 5: Inserting all deals...");
  let inserted = 0;
  for (let i = 0; i < dealRows.length; i += 25) {
    const batch = dealRows.slice(i, i + 25);
    const { error } = await sb.from("deals").insert(batch);
    if (error) {
      console.error(`Batch at ${i} failed:`, error.message);
      console.error(
        "First row of batch:",
        JSON.stringify(batch[0], null, 2)
      );
      process.exit(1);
    }
    inserted += batch.length;
    console.log(`  Inserted ${inserted} / ${dealRows.length} deals`);
  }

  // Step 6: Verify totals
  console.log("\nStep 6: Verifying totals...");
  const { data: allDeals, error: allErr } = await sb
    .from("deals")
    .select("customer_name, deal_num, front_gross, fi_total, total_gross")
    .eq("event_id", EVENT_ID)
    .order("deal_num");

  if (allErr) {
    console.error("Verification query failed:", allErr.message);
    process.exit(1);
  }

  let totalFrontGross = 0;
  let totalFI = 0;
  let totalGross = 0;
  for (const d of allDeals!) {
    totalFrontGross += Number(d.front_gross) || 0;
    totalFI += Number(d.fi_total) || 0;
    totalGross += Number(d.total_gross) || 0;
  }

  console.log(`\n  Total deals: ${allDeals!.length}`);
  console.log(
    `  Total Front Gross: $${totalFrontGross.toFixed(2)}  (expected: $150,056.57)`
  );
  console.log(
    `  Total F&I:         $${totalFI.toFixed(2)}  (expected: $134,958.57)`
  );
  console.log(`  Total Gross:       $${totalGross.toFixed(2)}`);

  const fgMatch = Math.abs(totalFrontGross - 150056.57) < 0.01;
  const fiMatch = Math.abs(totalFI - 134958.57) < 0.01;
  console.log(`\n  Front Gross match: ${fgMatch ? "YES" : "NO"}`);
  console.log(`  F&I match:         ${fiMatch ? "YES" : "NO"}`);

  if (!fgMatch || !fiMatch) {
    console.log("\n  WARNING: Totals do not match expected values!");
  } else {
    console.log("\n  All totals match!");
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
