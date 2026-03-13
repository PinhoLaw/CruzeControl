/**
 * Migration script: Lincoln CDJR — Mail Tracking ONLY
 * Reads reference/LINCOLN_CDJR_FEB_MARCH_26__7_.xlsx and inserts mail tracking
 * into the existing Lincoln CDJR event in Supabase.
 *
 * Usage: npx tsx scripts/migrate-lincoln-cdjr-mail.ts
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

const FILE = path.resolve(__dirname, "../reference/LINCOLN_CDJR_FEB_MARCH_26__7_.xlsx");

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
  // ── Step 1: Find Lincoln CDJR event ───────────────────────────────────
  console.log("Step 1: Looking up Lincoln CDJR event...");
  const { data: event, error: evErr } = await sb
    .from("events")
    .select("id, dealer_name")
    .eq("dealer_name", "LINCOLN CDJR")
    .single();

  if (evErr || !event) {
    console.error("Failed to find Lincoln CDJR event:", evErr?.message);
    process.exit(1);
  }
  const eventId = event.id;
  console.log(`  Found: ${event.dealer_name} (${eventId})`);

  // ── Step 2: Delete existing mail tracking ─────────────────────────────
  console.log("\nStep 2: Deleting existing mail tracking rows...");
  const { error: delErr } = await sb
    .from("mail_tracking")
    .delete()
    .eq("event_id", eventId);

  if (delErr) {
    console.error("Failed to delete existing mail tracking:", delErr.message);
    process.exit(1);
  }
  console.log("  Cleared existing rows");

  // ── Step 3: Parse and insert mail tracking ────────────────────────────
  console.log("\nStep 3: Inserting mail tracking...");
  const wb = XLSX.readFile(FILE);
  const mt = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets["MAIL TRACKING"], {
    header: 1,
    defval: null,
  });

  // Rows 5–54 (indices 4–53), where col D (index 3) has a town name
  // (not empty, not "TOTAL")
  // B(1)=pieces_sent, D(3)=town, E(4)=zip_code,
  // G(6)=day_1, H(7)=day_2, I(8)=day_3, J(9)=day_4,
  // K(10)=day_5, L(11)=day_6, M(12)=day_7
  const mailRows: Record<string, unknown>[] = [];
  for (let i = 4; i <= 53; i++) {
    const r = mt[i] as unknown[];
    if (!r) continue;
    const town = safeStr(r[3]);
    if (!town || town === "TOTAL") continue;

    mailRows.push({
      event_id: eventId,
      pieces_sent: safeInt(r[1]) || 0,
      town,
      zip_code: safeStr(r[4]),
      drop_num: 1,
      day_1: safeInt(r[6]) || 0,
      day_2: safeInt(r[7]) || 0,
      day_3: safeInt(r[8]) || 0,
      day_4: safeInt(r[9]) || 0,
      day_5: safeInt(r[10]) || 0,
      day_6: safeInt(r[11]) || 0,
      day_7: safeInt(r[12]) || 0,
      day_8: 0,
      day_9: 0,
      day_10: 0,
      day_11: 0,
    });
  }

  const { error: mailErr } = await sb.from("mail_tracking").insert(mailRows);
  if (mailErr) {
    console.error("Mail tracking insert failed:", mailErr.message);
    process.exit(1);
  }

  console.log(`  Inserted ${mailRows.length} mail tracking rows`);

  // ── Summary ───────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════");
  console.log("Done! Lincoln CDJR mail tracking migration complete.");
  console.log(`  Event:  ${event.dealer_name} (${eventId})`);
  console.log(`  Mail:   ${mailRows.length} ZIP rows`);
  console.log("══════════════════════════════════════════════");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
