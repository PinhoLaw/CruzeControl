import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

const EVENT_ID = "c72b6d11-797e-477c-a8aa-a4e0de76a22f";

async function main() {
  const { data: sp } = await sb
    .from("salespeople")
    .select("id, name, type")
    .eq("event_id", EVENT_ID)
    .eq("name", "DARRELL ALBERICO");
  console.log("Darrell in salespeople:", JSON.stringify(sp));

  if (!sp || sp.length === 0) return;
  const darId = sp[0].id;
  console.log("Darrell ID:", darId, "type:", sp[0].type);

  const { data: d1 } = await sb
    .from("deals")
    .select("id, customer_name, salesperson_id, salesperson2_id, front_gross, total_gross")
    .eq("event_id", EVENT_ID)
    .eq("salesperson_id", darId);
  console.log("\nDeals as SP1:", d1?.length, JSON.stringify(d1, null, 2));

  const { data: d2 } = await sb
    .from("deals")
    .select("id, customer_name, salesperson_id, salesperson2_id, front_gross, total_gross")
    .eq("event_id", EVENT_ID)
    .eq("salesperson2_id", darId);
  console.log("\nDeals as SP2:", d2?.length, JSON.stringify(d2, null, 2));

  // Check Excel: what salesperson name is on Darrell's deals?
  const XLSX = await import("xlsx");
  const wb = XLSX.readFile(path.resolve(__dirname, "../reference/Lilliston_CDJR_Jan_26__2_.xlsx"));
  const dl = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets["DEAL LOG"], { header: 1, defval: null });

  console.log("\n=== Excel deals mentioning DARRELL or ALBERICO ===");
  for (let i = 8; i < dl.length; i++) {
    const r = dl[i] as unknown[];
    if (typeof r[4] !== "number") continue;
    const sp1 = String(r[23] || "");
    const sp2 = String(r[24] || "");
    if (sp1.includes("DARRELL") || sp1.includes("ALBERICO") || sp2.includes("DARRELL") || sp2.includes("ALBERICO")) {
      console.log(`  Row${i}: #${r[4]} ${r[8]} | SP=${r[23]} | SP2=${r[24]} | FG=${r[25]} | TG=${r[34]}`);
    }
  }
}
main();
