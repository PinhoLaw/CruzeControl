/**
 * Migrate Hawkinson Nissan event data into Supabase.
 * Usage: npx tsx scripts/migrate-hawkinson-nissan.ts
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
  "../reference/Hawkinson_Nissan_3_JDE_Mission_Control.xlsx"
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

  // ── Step 1: Create the event ──────────────────────────────────────────
  console.log("Step 1: Creating Hawkinson Nissan event...");

  // Check if already exists
  const { data: existing } = await sb
    .from("events")
    .select("id")
    .eq("dealer_name", "HAWKINSON NISSAN");

  let EVENT_ID: string;

  if (existing && existing.length > 0) {
    EVENT_ID = existing[0].id;
    console.log(`  Event already exists: ${EVENT_ID}, cleaning up...`);

    // Delete existing child data
    const { count: dd } = await sb.from("deals").delete({ count: "exact" }).eq("event_id", EVENT_ID);
    const { count: di } = await sb.from("inventory").delete({ count: "exact" }).eq("event_id", EVENT_ID);
    const { count: dm } = await sb.from("mail_tracking").delete({ count: "exact" }).eq("event_id", EVENT_ID);
    const { count: ds } = await sb.from("salespeople").delete({ count: "exact" }).eq("event_id", EVENT_ID);
    const { count: dl } = await sb.from("lenders").delete({ count: "exact" }).eq("event_id", EVENT_ID);
    console.log(`  Deleted: ${dd} deals, ${di} inventory, ${dm} mail, ${ds} salespeople, ${dl} lenders`);
  } else {
    const dailyUps = {
      "2020-09-23": 121, "2020-09-24": 112, "2020-09-25": 110, "2020-09-26": 138,
      "2020-09-28": 127, "2020-09-29": 96, "2020-09-30": 131,
      "2020-10-01": 126, "2020-10-02": 128, "2020-10-03": 136,
    };

    const { data: evt, error: evErr } = await sb
      .from("events")
      .insert({
        dealer_name: "HAWKINSON NISSAN",
        franchise: "NISSAN",
        street: "5513 MILLER CIR DR",
        city: "MATTESON",
        state: "IL",
        zip: "60443",
        start_date: "2020-09-23",
        end_date: "2020-10-03",
        status: "completed",
        jde_pct: 25,
        pack_new: 0,
        pack_used: 0,
        pack_company: 0,
        mail_quantity: 101608,
        marketing_cost: 74732,
        misc_expenses: 0,
      })
      .select("id")
      .single();

    if (evErr || !evt) {
      console.error("  Failed to create event:", evErr?.message);
      process.exit(1);
    }
    EVENT_ID = evt.id;
  }
  console.log(`  Event ID: ${EVENT_ID}`);

  // ── Step 2: Insert salespeople from ROSTER & TABLES ───────────────────
  console.log("\nStep 2: Inserting salespeople...");
  const rosterSheet = wb.Sheets["ROSTER & TABLES"];
  const rosterRows: unknown[][] = XLSX.utils.sheet_to_json(rosterSheet, { header: 1, defval: null });

  const spInserts: Record<string, unknown>[] = [];
  for (let i = 1; i <= 11; i++) {
    const name = safeStr(rosterRows[i]?.[0]);
    if (!name) continue;
    spInserts.push({
      event_id: EVENT_ID,
      name: name.toUpperCase(),
      type: "rep",
      confirmed: false,
    });
  }

  if (spInserts.length > 0) {
    const { error } = await sb.from("salespeople").insert(spInserts);
    if (error) console.error("  SP insert error:", error.message);
  }
  console.log(`  Inserted ${spInserts.length} salespeople`);

  // Build name→id map
  const { data: spData } = await sb
    .from("salespeople")
    .select("id, name")
    .eq("event_id", EVENT_ID);

  const nameToId: Record<string, string> = {};
  for (const sp of spData || []) {
    nameToId[sp.name.toUpperCase()] = sp.id;
  }

  function findSp(name: unknown): string | null {
    if (name == null) return null;
    const n = String(name).trim().toUpperCase();
    if (!n) return null;
    if (nameToId[n]) return nameToId[n];
    for (const [key, id] of Object.entries(nameToId)) {
      if (key.includes(n) || n.includes(key)) return id;
    }
    console.warn(`    SP not found: "${n}"`);
    return null;
  }

  // ── Step 3: Load back gross from "THINGS NOT IN CURRENT DEAL LOG" ─────
  console.log("\nStep 3: Loading back gross data...");
  const thingsSheet = wb.Sheets["THINGS NOT IN CURRENT DEAL LOG"];
  const thingsRows: unknown[][] = XLSX.utils.sheet_to_json(thingsSheet, { header: 1, defval: null });

  const backGrossMap: Record<number, number> = {};
  for (let i = 1; i < thingsRows.length; i++) {
    const r = thingsRows[i];
    if (!r) continue;
    const dealNum = safeInt(r[0]);
    const bg = safeNum(r[6]);
    if (dealNum && bg != null) {
      backGrossMap[dealNum] = bg;
    }
  }
  console.log(`  Loaded back gross for ${Object.keys(backGrossMap).length} deals`);

  // ── Step 4: Insert deals from DEAL LOG ────────────────────────────────
  console.log("\nStep 4: Inserting deals...");
  const dealSheet = wb.Sheets["DEAL LOG"];
  const dealRows: unknown[][] = XLSX.utils.sheet_to_json(dealSheet, { header: 1, defval: null });

  const deals: Record<string, unknown>[] = [];
  for (let i = 1; i < dealRows.length; i++) {
    const r = dealRows[i];
    if (!r || r.length === 0) continue;

    const dealNum = safeInt(r[0]);
    if (dealNum == null || dealNum <= 100) continue;

    // Rate: multiply by 100 if < 1 (convert decimal to percentage)
    let rate = safeNum(r[28]);
    if (rate != null && rate < 1) {
      rate = Math.round(rate * 10000) / 100; // e.g. 0.0914 → 9.14
    }

    const reserve = safeNum(r[30]) ?? 0;
    const warranty = safeNum(r[31]) ?? 0;
    const gap = safeNum(r[32]) ?? 0;
    const aft1 = safeNum(r[33]) ?? 0;
    const fi_total = reserve + warranty + gap + aft1;
    const front_gross = safeNum(r[26]) ?? 0;
    const total_gross = front_gross + fi_total;

    deals.push({
      event_id: EVENT_ID,
      deal_num: String(dealNum),
      customer_name: safeStr(r[3]),
      customer_zip: safeStr(r[4]),
      new_used: safeStr(r[13]),
      year: safeInt(r[7]),
      make: safeStr(r[8]),
      model: safeStr(r[9]),
      cost: safeNum(r[11]),
      age: safeInt(r[12]),
      trade_year: safeStr(r[14]),
      trade_make: safeStr(r[15]),
      trade_model: safeStr(r[16]),
      trade_miles: safeStr(r[18]),
      acv: safeInt(r[19]),
      payoff: safeInt(r[20]),
      salesperson_id: findSp(r[21]),
      salesperson2_id: findSp(r[23]),
      front_gross,
      lender: safeStr(r[27]),
      rate,
      reserve,
      warranty,
      gap,
      aft1,
      fi_total,
      total_gross,
    });
  }

  if (deals.length > 0) {
    for (let i = 0; i < deals.length; i += 50) {
      const batch = deals.slice(i, i + 50);
      const { error } = await sb.from("deals").insert(batch);
      if (error) console.error(`  Deal insert error (batch ${i}):`, error.message);
    }
  }
  console.log(`  Inserted ${deals.length} deals`);

  // ── Step 5: Insert lenders ────────────────────────────────────────────
  console.log("\nStep 5: Inserting lenders...");
  const lenderSheet = wb.Sheets["LENDERS"];
  const lenderRows: unknown[][] = XLSX.utils.sheet_to_json(lenderSheet, { header: 1, defval: null });

  const lenders: Record<string, unknown>[] = [];
  for (let i = 1; i < lenderRows.length; i++) {
    const name = safeStr(lenderRows[i]?.[0]);
    if (!name) continue;
    lenders.push({
      event_id: EVENT_ID,
      name,
    });
  }

  if (lenders.length > 0) {
    const { error } = await sb.from("lenders").insert(lenders);
    if (error) console.error("  Lender insert error:", error.message);
  }
  console.log(`  Inserted ${lenders.length} lenders`);

  // ── Step 6: Insert mail tracking ──────────────────────────────────────
  console.log("\nStep 6: Inserting mail tracking...");
  const mailSheet = wb.Sheets["MAIL TRACKING"];
  const mailRows: unknown[][] = XLSX.utils.sheet_to_json(mailSheet, { header: 1, defval: null });

  const mailTracking: Record<string, unknown>[] = [];
  for (let i = 1; i < mailRows.length; i++) {
    const r = mailRows[i];
    if (!r) continue;

    const zip = safeStr(r[0]);
    if (!zip || isNaN(Number(zip)) || zip.length < 4) continue;

    mailTracking.push({
      event_id: EVENT_ID,
      zip_code: zip,
      town: safeStr(r[1]),
      pieces_sent: safeInt(r[2]),
      day_1: 0, day_2: 0, day_3: 0, day_4: 0, day_5: 0,
      day_6: 0, day_7: 0, day_8: 0, day_9: 0, day_10: 0, day_11: 0,
    });
  }

  if (mailTracking.length > 0) {
    const { error } = await sb.from("mail_tracking").insert(mailTracking);
    if (error) console.error("  Mail tracking insert error:", error.message);
  }
  console.log(`  Inserted ${mailTracking.length} mail tracking rows`);

  // ── Summary ───────────────────────────────────────────────────────────
  const totalFront = deals.reduce((s, d) => s + (Number(d.front_gross) || 0), 0);
  const totalFi = deals.reduce((s, d) => s + (Number(d.fi_total) || 0), 0);
  const totalGross = deals.reduce((s, d) => s + (Number(d.total_gross) || 0), 0);

  console.log("\n══════════════════════════════════════════════");
  console.log("Done! Hawkinson Nissan migration complete.");
  console.log(`  Event:         ${EVENT_ID}`);
  console.log(`  Salespeople:   ${spInserts.length}`);
  console.log(`  Deals:         ${deals.length}`);
  console.log(`  Lenders:       ${lenders.length}`);
  console.log(`  Mail Tracking: ${mailTracking.length}`);
  console.log(`  Front Gross:   $${totalFront.toFixed(2)}`);
  console.log(`  F&I Total:     $${totalFi.toFixed(2)}`);
  console.log(`  Total Gross:   $${totalGross.toFixed(2)}`);
  console.log("══════════════════════════════════════════════");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
