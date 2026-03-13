/**
 * Re-seed Tacoma Nissan inventory from Excel v3 data.
 * Clears existing inventory and inserts fresh from exported JSON.
 *
 * Usage: npx tsx scripts/update-tacoma-inventory.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

const EVENT_ID = "a0000000-0000-0000-0000-000000000001";

async function main() {
  const raw = fs.readFileSync("/tmp/tacoma_inventory_v3.json", "utf-8");
  const vehicles = JSON.parse(raw) as Record<string, unknown>[];

  console.log(`Loaded ${vehicles.length} vehicles from JSON`);

  // Clear existing inventory
  console.log("Clearing existing inventory...");
  const { error: delErr } = await sb
    .from("inventory")
    .delete()
    .eq("event_id", EVENT_ID);
  if (delErr) {
    console.error("Delete failed:", delErr.message);
    process.exit(1);
  }

  // Insert in batches of 50
  let inserted = 0;
  for (let i = 0; i < vehicles.length; i += 50) {
    const batch = vehicles.slice(i, i + 50).map((v) => ({
      event_id: EVENT_ID,
      hat_num: v.hat_num,
      stock_num: v.stock_num,
      vin: v.vin,
      location: v.location,
      year: v.year,
      make: v.make,
      model: v.model,
      trim: v.trim,
      class: v.class,
      color: v.color,
      drivetrain: v.drivetrain,
      odometer: v.odometer,
      age: v.age,
      kbb_trade: v.kbb_trade,
      kbb_retail: v.kbb_retail,
      cost: v.cost,
      notes: v.notes,
    }));

    const { error } = await sb.from("inventory").insert(batch);
    if (error) {
      console.error(`Batch at ${i} failed:`, error.message);
      process.exit(1);
    }
    inserted += batch.length;
    console.log(`  Inserted ${inserted} / ${vehicles.length}`);
  }

  console.log(`\nDone! ${inserted} vehicles inserted.`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
