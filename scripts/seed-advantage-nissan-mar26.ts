/**
 * Seed inventory and mail tracking for Advantage Nissan March 2026 event.
 * Usage: npx tsx scripts/seed-advantage-nissan-mar26.ts
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

const FILE = path.resolve(__dirname, "../reference/ADVANTAGE_NISSAN_MARCH_26.xlsx");

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
  const wb = XLSX.readFile(FILE);

  // ── Step 1: Find the event ──────────────────────────────────────────────
  console.log("Step 1: Finding Advantage Nissan March 2026 event...");
  const { data: events, error: evErr } = await sb
    .from("events")
    .select("id")
    .ilike("dealer_name", "%advantage nissan%")
    .eq("start_date", "2026-03-20");

  if (evErr || !events || events.length === 0) {
    console.error("Could not find event:", evErr?.message);
    process.exit(1);
  }
  const EVENT_ID = events[0].id;
  console.log(`  Found event: ${EVENT_ID}`);

  // ── Step 2: Delete existing data ────────────────────────────────────────
  console.log("\nStep 2: Deleting existing data...");

  const { count: delSp } = await sb
    .from("salespeople")
    .delete({ count: "exact" })
    .eq("event_id", EVENT_ID);
  console.log(`  Deleted ${delSp ?? 0} salespeople`);

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

  // ── Step 2b: Insert roster from "Roster & Tables" ──────────────────────
  console.log("\nStep 2b: Inserting roster...");
  const rosterSheet = wb.Sheets["Roster & Tables"];
  if (!rosterSheet) {
    console.error("  Sheet 'Roster & Tables' not found! Available:", wb.SheetNames);
    process.exit(1);
  }

  const rosterRows: unknown[][] = XLSX.utils.sheet_to_json(rosterSheet, {
    header: 1,
    defval: null,
  });

  const salespeople: Record<string, unknown>[] = [];
  // Also grab closers from col D and team leader
  const closers: Record<string, unknown>[] = [];

  for (let i = 1; i <= 13; i++) {
    const r = rosterRows[i];
    if (!r) continue;

    // Col B (index 1) = salesperson name
    const name = safeStr(r[1]);
    if (!name || name === "HOUSE") continue;

    // MIKE LASHLEY (row index 6) is Team Leader per col D
    const colD = safeStr(r[3]);
    const isTeamLeader = name === "MIKE LASHLEY" && colD === "Team Leader";

    salespeople.push({
      event_id: EVENT_ID,
      name,
      type: isTeamLeader ? "team_leader" : "rep",
      phone: null,
      email: null,
      confirmed: true,
      notes: null,
    });

    // Check col D for closers/managers (not Team Leader, not blank, not phone numbers)
    if (colD && colD !== "Team Leader" && colD.trim().length > 2 && !/^\d/.test(colD)) {
      // Only add if not already in salespeople list
      const closerName = colD.trim();
      if (!closers.find((c) => c.name === closerName) && !salespeople.find((s) => s.name === closerName)) {
        closers.push({
          event_id: EVENT_ID,
          name: closerName,
          type: "manager",
          phone: null,
          email: null,
          confirmed: true,
          notes: null,
        });
      }
    }
  }

  const allRoster = [...salespeople, ...closers];
  if (allRoster.length > 0) {
    const { error } = await sb.from("salespeople").insert(allRoster);
    if (error) {
      console.error("  Roster insert error:", error.message);
    }
  }
  console.log(`  Inserted ${salespeople.length} reps/team leaders + ${closers.length} managers = ${allRoster.length} total`);

  // ── Step 3: Insert inventory from "INVENTORY LOG" ───────────────────────
  console.log("\nStep 3: Inserting inventory...");
  const invSheet = wb.Sheets["INVENTORY LOG"];
  if (!invSheet) {
    console.error("  Sheet 'INVENTORY LOG' not found! Available:", wb.SheetNames);
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

  // ── Step 4: Insert mail tracking from "MAIL TRACKING" ───────────────────
  console.log("\nStep 4: Inserting mail tracking...");
  const mailSheet = wb.Sheets["MAIL TRACKING"];
  if (!mailSheet) {
    console.error("  Sheet 'MAIL TRACKING' not found! Available:", wb.SheetNames);
    process.exit(1);
  }

  const mailRows: unknown[][] = XLSX.utils.sheet_to_json(mailSheet, {
    header: 1,
    defval: null,
  });

  const mailTracking: Record<string, unknown>[] = [];
  for (let i = 4; i < mailRows.length; i++) {
    const r = mailRows[i];
    if (!r || r.length === 0) continue;

    // col F (index 5) = ZIP must be a valid zip code
    const zip = safeStr(r[5]);
    if (!zip || isNaN(Number(zip)) || zip.length < 4) continue;

    // Skip rows without pieces_sent
    if (safeInt(r[2]) == null) continue;

    mailTracking.push({
      event_id: EVENT_ID,
      pieces_sent: safeInt(r[2]),
      town: safeStr(r[4]),
      zip_code: zip,
      drop_num: null,
      day_1: 0,
      day_2: 0,
      day_3: 0,
      day_4: 0,
      day_5: 0,
      day_6: 0,
      day_7: 0,
      day_8: 0,
      day_9: 0,
      day_10: 0,
      day_11: 0,
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
  const totalPieces = mailTracking.reduce((s, r) => s + ((r.pieces_sent as number) || 0), 0);
  console.log("\n══════════════════════════════════════════════");
  console.log("Done! Advantage Nissan March 2026 seed complete.");
  console.log(`  Roster:        ${allRoster.length} (${salespeople.length} reps + ${closers.length} managers)`);
  console.log(`  Inventory:     ${inventory.length}`);
  console.log(`  Mail Tracking: ${mailTracking.length} ZIPs, ${totalPieces.toLocaleString()} total pieces`);
  console.log("══════════════════════════════════════════════");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
