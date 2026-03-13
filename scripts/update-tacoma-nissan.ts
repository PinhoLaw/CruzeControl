/**
 * Update Tacoma Nissan event data from Excel spreadsheet (v3).
 * Updates deals, roster, mail tracking, and inventory.
 *
 * Usage: npx tsx scripts/update-tacoma-nissan.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

const EVENT_ID = "a0000000-0000-0000-0000-000000000001";

// ── All 36 deals from Excel v3 ──────────────────────────────────────────────
// "SANDERS" was renamed to "JOHNSON SANDERS" in the new spreadsheet
const DEALS = [
  { customer_name: "CORDOVEZ", customer_zip: null, deal_num: null, new_used: "Used", year: 2024, make: "NISSAN", model: "ROGUE", cost: 21650, store: null, front_gross: 3958, lender: "BECU", rate: 7.24, reserve: 901, warranty: 3160, aft1: 364, gap: 778, funded: false, salesperson: "BRYANT ROGERS", second_salesperson: "HOUSE", notes: null, trade_year: "2011", trade_make: "SUBARU", trade_model: "OUTBACK", trade_miles: "188K", acv: 1200, payoff: 0, age: 7, trade2: null },
  { customer_name: "PARKER", customer_zip: null, deal_num: null, new_used: "Used", year: 2014, make: "FORD", model: "F150", cost: 11158, store: null, front_gross: 4511, lender: "KITSAP", rate: 6.39, reserve: 284, warranty: 0, aft1: 870, gap: 0, funded: false, salesperson: "OSSIE SAMPSON", second_salesperson: null, notes: null, trade_year: null, trade_make: null, trade_model: null, trade_miles: null, acv: 0, payoff: 0, age: 35, trade2: null },
  { customer_name: "AMUIMUIA", customer_zip: null, deal_num: null, new_used: "New", year: 2025, make: "NISSAN", model: "PATHFINDER", cost: 41390, store: null, front_gross: 0, lender: "HARBORSTONE", rate: 8.99, reserve: 1237, warranty: 6495, aft1: 364, gap: 778, funded: false, salesperson: "HOUSE", second_salesperson: null, notes: null, trade_year: "2021", trade_make: "CHEVY", trade_model: "MALIBU", trade_miles: "93519", acv: 8000, payoff: 21251, age: 98, trade2: null },
  { customer_name: "MCMILLIAM", customer_zip: null, deal_num: null, new_used: "Used", year: 2024, make: "HYUNDAI", model: "TUCSON", cost: 21129, store: null, front_gross: 1873, lender: "GLOBAL", rate: 24.2, reserve: 860, warranty: 1601, aft1: 364, gap: 779, funded: false, salesperson: "MIKE LASHLEY", second_salesperson: null, notes: null, trade_year: null, trade_make: null, trade_model: null, trade_miles: null, acv: 0, payoff: 0, age: 89, trade2: null },
  { customer_name: "JOHNSON SANDERS", customer_zip: null, deal_num: null, new_used: "New", year: 2026, make: "NISSAN", model: "ROGUE", cost: 37660, store: null, front_gross: 5357, lender: "HARBORSTONE", rate: 8.99, reserve: 1069, warranty: 5959, aft1: 364, gap: 778, funded: false, salesperson: "MIKE LASHLEY", second_salesperson: null, notes: null, trade_year: "2023", trade_make: "KIA", trade_model: "SOUL", trade_miles: "50155", acv: 12500, payoff: 14018, age: 11, trade2: null },
  { customer_name: "SANABIA", customer_zip: null, deal_num: null, new_used: "Used", year: 2023, make: "VW", model: "TIGUAN", cost: 24656, store: null, front_gross: 2000, lender: "CPS", rate: 20.3, reserve: 2353, warranty: 0, aft1: 0, gap: 0, funded: false, salesperson: "HOUSE", second_salesperson: null, notes: null, trade_year: null, trade_make: null, trade_model: null, trade_miles: null, acv: 0, payoff: 0, age: 31, trade2: null },
  { customer_name: "YONTEFF", customer_zip: null, deal_num: "CDJR", new_used: "Used", year: 2024, make: "RAM", model: "1500", cost: 31332, store: null, front_gross: 7446, lender: "KITSAP", rate: 7.86, reserve: 1780, warranty: 5999, aft1: 364, gap: 578, funded: false, salesperson: "TREVON HALL", second_salesperson: null, notes: null, trade_year: null, trade_make: null, trade_model: null, trade_miles: null, acv: 0, payoff: 0, age: 1, trade2: null },
  { customer_name: "ROSATO", customer_zip: null, deal_num: null, new_used: "Used", year: 2022, make: "NISSAN", model: "PATHFINDER", cost: 30897, store: null, front_gross: 6943, lender: "KITSAP", rate: 9.45, reserve: 1509, warranty: 1150, aft1: 0, gap: 573, funded: false, salesperson: "ABDUL AL TABBAH", second_salesperson: null, notes: null, trade_year: "2010", trade_make: "TOYOTA", trade_model: "COROLLA", trade_miles: "239K", acv: 500, payoff: 0, age: 33, trade2: null },
  { customer_name: "OWENS", customer_zip: null, deal_num: null, new_used: "Used", year: 2020, make: "NISSAN", model: "ALTIMA", cost: 14008, store: null, front_gross: 3797, lender: "ALLY", rate: 18.84, reserve: 2171, warranty: 3135, aft1: 0, gap: 578, funded: false, salesperson: "BRYANT ROGERS", second_salesperson: null, notes: null, trade_year: null, trade_make: null, trade_model: null, trade_miles: null, acv: 0, payoff: 0, age: 2, trade2: null },
  { customer_name: "MCKAY", customer_zip: null, deal_num: null, new_used: "Used", year: 2016, make: "TOYOTA", model: "4RUNNER", cost: 40896, store: null, front_gross: 2000, lender: "GESA", rate: 6.79, reserve: 1470, warranty: 1850, aft1: 364, gap: 1078, funded: false, salesperson: "NATE HARDING", second_salesperson: "JOSE TORRES", notes: null, trade_year: "2018", trade_make: "CHEVY", trade_model: "IMPALA", trade_miles: "108K", acv: 10000, payoff: 21538, age: 148, trade2: "2011 WRANGLER 111K" },
  { customer_name: "HARTFIELD", customer_zip: null, deal_num: null, new_used: "New", year: 2026, make: "NISSAN", model: "ROGUE", cost: 41157, store: null, front_gross: 0, lender: "NMAC", rate: null, reserve: 2009, warranty: 1995, aft1: 0, gap: 0, funded: false, salesperson: "OSSIE SAMPSON", second_salesperson: null, notes: null, trade_year: "2003", trade_make: "INFINITI", trade_model: "Q45", trade_miles: "184235", acv: 500, payoff: 0, age: 167, trade2: null },
  { customer_name: "PECH", customer_zip: null, deal_num: null, new_used: "Used", year: 2022, make: "NISSAN", model: "ALTIMA", cost: 21167, store: null, front_gross: 5033, lender: "GESA", rate: 6.24, reserve: 1136, warranty: 4015, aft1: 0, gap: 1078, funded: false, salesperson: "NATE HARDING", second_salesperson: "JOSE TORRES", notes: null, trade_year: "2015", trade_make: "NISSAN", trade_model: "VERSA", trade_miles: "147413", acv: 1000, payoff: 0, age: 32, trade2: null },
  { customer_name: "KERCHEVAL", customer_zip: null, deal_num: null, new_used: "Used", year: 2023, make: "KIA", model: "SOUL", cost: 14018, store: null, front_gross: 2189, lender: "CPS", rate: 26.65, reserve: 1194, warranty: 0, aft1: 0, gap: 607, funded: false, salesperson: "TREVON HALL", second_salesperson: null, notes: null, trade_year: null, trade_make: null, trade_model: null, trade_miles: null, acv: 0, payoff: 0, age: 1, trade2: null },
  { customer_name: "KETROW", customer_zip: null, deal_num: "CDJR", new_used: "Used", year: 2023, make: "HONDA", model: "CIVIC", cost: 24713, store: null, front_gross: 2251, lender: "KITSAP", rate: 7.58, reserve: 732, warranty: 754, aft1: 364, gap: 0, funded: false, salesperson: "HOUSE", second_salesperson: null, notes: null, trade_year: "2015", trade_make: "HONDA", trade_model: "CR-V", trade_miles: "92430", acv: 12000, payoff: 16922, age: 1, trade2: null },
  { customer_name: "WARNER", customer_zip: null, deal_num: null, new_used: "New", year: 2025, make: "NISSAN", model: "VERSA", cost: 21796, store: null, front_gross: 2361, lender: "GESA", rate: 5.99, reserve: 1056, warranty: 4872, aft1: 364, gap: 1078, funded: false, salesperson: "ABDUL AL TABBAH", second_salesperson: null, notes: null, trade_year: "2009", trade_make: "NISSAN", trade_model: "ALTIMA", trade_miles: "100711", acv: 1500, payoff: 0, age: 210, trade2: null },
  { customer_name: "MROCZKOWSKI", customer_zip: null, deal_num: null, new_used: "New", year: 2026, make: "NISSAN", model: "SENTRA", cost: 25477, store: null, front_gross: 7099, lender: "ICCU", rate: 13.4, reserve: 566, warranty: 2624, aft1: 0, gap: 573, funded: false, salesperson: "HOUSE", second_salesperson: null, notes: null, trade_year: "2020", trade_make: "NISSAN", trade_model: "KICKS", trade_miles: "26288", acv: 14000, payoff: 12404, age: 50, trade2: null },
  { customer_name: "SALCEDO", customer_zip: null, deal_num: null, new_used: "New", year: 2026, make: "NISSAN", model: "ROGUE", cost: 36299, store: null, front_gross: 670, lender: "CASH", rate: null, reserve: 0, warranty: 886, aft1: 0, gap: 0, funded: false, salesperson: "HOUSE", second_salesperson: null, notes: null, trade_year: "2012", trade_make: "NISSAN", trade_model: "ROGUE", trade_miles: "115900", acv: 2000, payoff: 0, age: 15, trade2: "2018 ELANTRA 17233" },
  { customer_name: "BUSHNELL", customer_zip: null, deal_num: null, new_used: "Used", year: 2018, make: "CHEVROLET", model: "IMPALA", cost: 11267, store: null, front_gross: 5279, lender: "GESA", rate: 6.99, reserve: 734, warranty: 2745, aft1: 364, gap: 1102, funded: false, salesperson: "OSSIE SAMPSON", second_salesperson: null, notes: null, trade_year: null, trade_make: null, trade_model: null, trade_miles: null, acv: 0, payoff: 0, age: 1, trade2: null },
  { customer_name: "CABALSI", customer_zip: null, deal_num: null, new_used: "New", year: 2026, make: "NISSAN", model: "ROGUE", cost: 36442, store: null, front_gross: 5884, lender: "GESA", rate: 6.24, reserve: 1217, warranty: 0, aft1: 364, gap: 1078, funded: false, salesperson: "MICHAEL GODWIN", second_salesperson: null, notes: null, trade_year: "2017", trade_make: "NISSAN", trade_model: "OGUE", trade_miles: "115701", acv: 5500, payoff: 0, age: 7, trade2: null },
  { customer_name: "CARTER", customer_zip: null, deal_num: null, new_used: "Used", year: 2009, make: "NISSAN", model: "ALTIMA", cost: 2467, store: null, front_gross: 4483, lender: "GESA", rate: 7.24, reserve: 261, warranty: 1311, aft1: 364, gap: 0, funded: false, salesperson: "OSSIE SAMPSON", second_salesperson: null, notes: null, trade_year: null, trade_make: null, trade_model: null, trade_miles: null, acv: 0, payoff: 0, age: 1, trade2: null },
  { customer_name: "NIXON", customer_zip: null, deal_num: null, new_used: "Used", year: 2018, make: "NISSAN", model: "SENTRA", cost: 4274, store: null, front_gross: 5160, lender: "GESA", rate: 5.25, reserve: 650, warranty: 4945, aft1: 364, gap: 1107, funded: false, salesperson: "BRYANT ROGERS", second_salesperson: null, notes: null, trade_year: null, trade_make: null, trade_model: null, trade_miles: null, acv: 0, payoff: 0, age: 10, trade2: null },
  { customer_name: "LINDAHL", customer_zip: null, deal_num: null, new_used: "Used", year: 2021, make: "CHEVROLET", model: "MALIBU", cost: 9349, store: null, front_gross: 10541, lender: "KITSAP", rate: 7.04, reserve: 666, warranty: 4965, aft1: 0, gap: 578, funded: false, salesperson: "NICK WILEY", second_salesperson: null, notes: null, trade_year: null, trade_make: null, trade_model: null, trade_miles: null, acv: 0, payoff: 0, age: 2, trade2: null },
  { customer_name: "GONIA", customer_zip: null, deal_num: null, new_used: "Used", year: 2023, make: "KIA", model: "FORTE", cost: 17582, store: null, front_gross: 1935, lender: "KITSAP", rate: 8.04, reserve: 899, warranty: 3415, aft1: 0, gap: 0, funded: false, salesperson: "HOUSE", second_salesperson: null, notes: null, trade_year: null, trade_make: null, trade_model: null, trade_miles: null, acv: 0, payoff: 0, age: 33, trade2: null },
  { customer_name: "BROOKS", customer_zip: null, deal_num: null, new_used: "Used", year: 2021, make: "SUBARU", model: "CROSSTREK", cost: 22026, store: null, front_gross: 6294, lender: "WHATCOM", rate: 8.74, reserve: 779, warranty: 0, aft1: 364, gap: 828, funded: false, salesperson: "BRYAN ROGERS", second_salesperson: null, notes: null, trade_year: "2003", trade_make: "OLDS", trade_model: "ALERO", trade_miles: "101079", acv: 500, payoff: 0, age: 29, trade2: null },
  { customer_name: "EDENFIELD", customer_zip: null, deal_num: null, new_used: "Used", year: 2022, make: "NISSAN", model: "PATHFINDER", cost: 28040, store: null, front_gross: 6851, lender: "ICCU", rate: 6.99, reserve: 2160, warranty: 2652, aft1: 364, gap: 778, funded: false, salesperson: "NATE HARDING", second_salesperson: "JOSE TORRES", notes: null, trade_year: null, trade_make: null, trade_model: null, trade_miles: null, acv: 0, payoff: 0, age: 2, trade2: null },
  // ── NEW deals not yet in DB ──
  { customer_name: "HERNANDEZ", customer_zip: null, deal_num: null, new_used: "Used", year: 2024, make: "MAZDA", model: "3", cost: 24567, store: null, front_gross: 4479, lender: "BECU", rate: 6.39, reserve: 1096, warranty: 2557, aft1: 364, gap: 678, funded: false, salesperson: "BRYAN ROGERS", second_salesperson: null, notes: null, trade_year: "2015", trade_make: "HONDA", trade_model: "CIVIC", trade_miles: "116207", acv: 5000, payoff: 11678, age: 31, trade2: null },
  { customer_name: "JOHNSON", customer_zip: null, deal_num: null, new_used: "New", year: 2026, make: "NISSAN", model: "ROGUE", cost: 35201, store: null, front_gross: 2729, lender: "NMAC", rate: 0, reserve: 344, warranty: 333, aft1: 364, gap: 0, funded: false, salesperson: "BRYAN ROGERS", second_salesperson: null, notes: null, trade_year: "2017", trade_make: "NISSAN", trade_model: "ROGUE", trade_miles: "49K", acv: 11000, payoff: 0, age: 63, trade2: null },
  { customer_name: "DELEON-GUERRO", customer_zip: null, deal_num: "CDJR", new_used: "Used", year: 2023, make: "TOYOTA", model: "4 RUNNER", cost: 35952, store: null, front_gross: 7818, lender: "KITSAP", rate: 7.58, reserve: 1115, warranty: 4164, aft1: 364, gap: 578, funded: false, salesperson: "MICHAEL GODWIN", second_salesperson: null, notes: null, trade_year: null, trade_make: null, trade_model: null, trade_miles: null, acv: 0, payoff: 0, age: 66, trade2: null },
  { customer_name: "JUDA", customer_zip: null, deal_num: null, new_used: "Used", year: 2021, make: "NISSAN", model: "SENTRA", cost: 14482, store: null, front_gross: 5828, lender: "WHATCOMB", rate: 8.74, reserve: 746, warranty: 4665, aft1: 0, gap: 828, funded: false, salesperson: "NICK WILEY", second_salesperson: null, notes: null, trade_year: null, trade_make: null, trade_model: null, trade_miles: null, acv: 0, payoff: 0, age: 6, trade2: null },
  { customer_name: "MARTIN", customer_zip: null, deal_num: null, new_used: "Used", year: 2020, make: "HYUNDAI", model: "TUCSON", cost: 16749, store: null, front_gross: 1418, lender: "CAP 1", rate: 19.84, reserve: 1027, warranty: 625, aft1: 364, gap: 437, funded: false, salesperson: "HOUSE", second_salesperson: null, notes: null, trade_year: null, trade_make: null, trade_model: null, trade_miles: null, acv: 0, payoff: 0, age: 31, trade2: null },
  { customer_name: "RAMOS BURCIAGA", customer_zip: null, deal_num: null, new_used: "New", year: 2026, make: "NISSAN", model: "MURANO", cost: 52491, store: null, front_gross: 8191, lender: "ICCU", rate: 9.19, reserve: 1109, warranty: 3963, aft1: 364, gap: 578, funded: false, salesperson: "RJ JOHNSON JR", second_salesperson: "JOSE TORRES", notes: null, trade_year: "2021", trade_make: "NISSAN", trade_model: "MURANO", trade_miles: "94833", acv: 15000, payoff: 22827, age: 131, trade2: null },
  { customer_name: "GRIFFIN", customer_zip: null, deal_num: null, new_used: "Used", year: 2023, make: "NISSAN", model: "ROGUE", cost: 17325, store: null, front_gross: 8617, lender: "HARBORSTONE", rate: 7.49, reserve: 699, warranty: 5505, aft1: 0, gap: 881, funded: false, salesperson: "RUFUS JOHNSON", second_salesperson: null, notes: null, trade_year: null, trade_make: null, trade_model: null, trade_miles: null, acv: 0, payoff: 0, age: 50, trade2: null },
  { customer_name: "ATKINS/MOBLEY", customer_zip: null, deal_num: null, new_used: "Used", year: 2023, make: "NISSAN", model: "ALTIMA", cost: 19347, store: null, front_gross: 8103, lender: "ON POINT", rate: 6.49, reserve: 802, warranty: 0, aft1: 364, gap: 976, funded: false, salesperson: "MICHAEL GODWIN", second_salesperson: null, notes: null, trade_year: null, trade_make: null, trade_model: null, trade_miles: null, acv: 0, payoff: 0, age: 34, trade2: null },
];

// ── Mail tracking from Excel ────────────────────────────────────────────────
const MAIL_TRACKING = [
  { zip_code: "98443", town: "FIFE", drop_num: 1, pieces_sent: 2114, day_1: 5, day_2: 7, day_3: 5, day_4: 0, day_5: 0, day_6: 0, day_7: 0, day_8: 0, day_9: 0, day_10: 0, day_11: 0 },
  { zip_code: "98499", town: "LAKEWOOD", drop_num: 1, pieces_sent: 13035, day_1: 102, day_2: 54, day_3: 21, day_4: 24, day_5: 0, day_6: 0, day_7: 0, day_8: 0, day_9: 0, day_10: 0, day_11: 0 },
  { zip_code: "98408", town: "TACOMA", drop_num: 1, pieces_sent: 7649, day_1: 46, day_2: 33, day_3: 11, day_4: 7, day_5: 0, day_6: 0, day_7: 0, day_8: 0, day_9: 0, day_10: 0, day_11: 0 },
  { zip_code: "98409", town: "TACOMA", drop_num: 1, pieces_sent: 10796, day_1: 78, day_2: 34, day_3: 25, day_4: 23, day_5: 0, day_6: 0, day_7: 0, day_8: 0, day_9: 0, day_10: 0, day_11: 0 },
  { zip_code: "98405", town: "TACOMA", drop_num: 1, pieces_sent: 11017, day_1: 68, day_2: 26, day_3: 24, day_4: 12, day_5: 0, day_6: 0, day_7: 0, day_8: 0, day_9: 0, day_10: 0, day_11: 0 },
  { zip_code: "98418", town: "TACOMA", drop_num: 2, pieces_sent: 3896, day_1: 0, day_2: 7, day_3: 12, day_4: 12, day_5: 0, day_6: 0, day_7: 0, day_8: 0, day_9: 0, day_10: 0, day_11: 0 },
  { zip_code: "98466", town: "UNI PLACE/FIRCREST", drop_num: 2, pieces_sent: 12484, day_1: 0, day_2: 1, day_3: 8, day_4: 35, day_5: 0, day_6: 0, day_7: 0, day_8: 0, day_9: 0, day_10: 0, day_11: 0 },
  { zip_code: "98444", town: "TACOMA", drop_num: 2, pieces_sent: 13843, day_1: 0, day_2: 0, day_3: 17, day_4: 56, day_5: 0, day_6: 0, day_7: 0, day_8: 0, day_9: 0, day_10: 0, day_11: 0 },
  { zip_code: "98446", town: "TACOMA", drop_num: 2, pieces_sent: 5136, day_1: 0, day_2: 0, day_3: 0, day_4: 6, day_5: 0, day_6: 0, day_7: 0, day_8: 0, day_9: 0, day_10: 0, day_11: 0 },
  { zip_code: "98465", town: "TACOMA", drop_num: 2, pieces_sent: 3523, day_1: 0, day_2: 0, day_3: 1, day_4: 6, day_5: 0, day_6: 0, day_7: 0, day_8: 0, day_9: 0, day_10: 0, day_11: 0 },
  { zip_code: "98467", town: "TACOMA", drop_num: 2, pieces_sent: 6543, day_1: 0, day_2: 0, day_3: 3, day_4: 9, day_5: 0, day_6: 0, day_7: 0, day_8: 0, day_9: 0, day_10: 0, day_11: 0 },
];

async function main() {
  // ── Step 1: Ensure roster has all salespeople from Excel deals ─────────
  console.log("Step 1: Checking roster...");
  const { data: existingSp } = await sb
    .from("salespeople")
    .select("id, name")
    .eq("event_id", EVENT_ID);

  const nameToId: Record<string, string> = {};
  for (const sp of existingSp || []) {
    nameToId[sp.name] = sp.id;
  }

  // Collect all salesperson names from deals
  const allNames = new Set<string>();
  for (const d of DEALS) {
    if (d.salesperson) allNames.add(d.salesperson);
    if (d.second_salesperson) allNames.add(d.second_salesperson);
  }

  // Insert missing salespeople
  const missing = Array.from(allNames).filter((n) => !nameToId[n]);
  if (missing.length > 0) {
    console.log("  Adding missing salespeople:", missing);
    const rows = missing.map((name) => ({
      event_id: EVENT_ID,
      name,
      type: "rep",
      confirmed: true,
    }));
    const { data: inserted } = await sb.from("salespeople").insert(rows).select("id, name");
    for (const sp of inserted || []) {
      nameToId[sp.name] = sp.id;
    }
  } else {
    console.log("  All salespeople already exist");
  }

  // ── Step 2: Rename SANDERS → JOHNSON SANDERS ──────────────────────────
  console.log("\nStep 2: Renaming SANDERS → JOHNSON SANDERS...");
  const { data: sandersDeals } = await sb
    .from("deals")
    .select("id")
    .eq("event_id", EVENT_ID)
    .eq("customer_name", "SANDERS");

  if (sandersDeals && sandersDeals.length > 0) {
    await sb
      .from("deals")
      .update({ customer_name: "JOHNSON SANDERS" })
      .eq("id", sandersDeals[0].id);
    console.log("  Renamed");
  } else {
    console.log("  SANDERS not found (may already be renamed)");
  }

  // ── Step 3: Update existing deals + insert new ones ───────────────────
  console.log("\nStep 3: Updating/inserting deals...");

  // Get all current deals
  const { data: currentDeals } = await sb
    .from("deals")
    .select("id, customer_name")
    .eq("event_id", EVENT_ID);

  const customerToId: Record<string, string> = {};
  for (const d of currentDeals || []) {
    customerToId[d.customer_name] = d.id;
  }

  let updated = 0;
  let inserted = 0;

  for (const d of DEALS) {
    const spId = nameToId[d.salesperson] || null;
    const sp2Id = d.second_salesperson ? nameToId[d.second_salesperson] || null : null;

    const payload: Record<string, unknown> = {
      event_id: EVENT_ID,
      customer_name: d.customer_name,
      customer_zip: d.customer_zip,
      deal_num: d.deal_num,
      new_used: d.new_used,
      year: d.year,
      make: d.make,
      model: d.model,
      cost: d.cost,
      age: d.age,
      front_gross: d.front_gross,
      lender: d.lender,
      rate: d.rate,
      reserve: d.reserve,
      warranty: d.warranty,
      aft1: d.aft1,
      gap: d.gap,
      funded: d.funded,
      salesperson_id: spId,
      salesperson2_id: sp2Id,
      notes: d.notes,
      trade_year: d.trade_year,
      trade_make: d.trade_make,
      trade_model: d.trade_model,
      trade_miles: d.trade_miles,
      acv: d.acv,
      payoff: d.payoff,
      trade2: d.trade2,
    };

    const existingId = customerToId[d.customer_name];
    if (existingId) {
      // Update existing deal
      const { error } = await sb.from("deals").update(payload).eq("id", existingId);
      if (error) {
        console.error(`  Failed to update ${d.customer_name}:`, error.message);
      } else {
        updated++;
      }
    } else {
      // Insert new deal
      const { error } = await sb.from("deals").insert(payload);
      if (error) {
        console.error(`  Failed to insert ${d.customer_name}:`, error.message);
      } else {
        inserted++;
      }
    }
  }
  console.log(`  Updated ${updated} deals, inserted ${inserted} new deals`);

  // ── Step 4: Update mail tracking ──────────────────────────────────────
  console.log("\nStep 4: Updating mail tracking...");

  // Delete existing and re-insert for clean update
  await sb.from("mail_tracking").delete().eq("event_id", EVENT_ID);

  const mailRows = MAIL_TRACKING.map((m) => ({
    event_id: EVENT_ID,
    ...m,
  }));
  const { error: mailErr } = await sb.from("mail_tracking").insert(mailRows);
  if (mailErr) {
    console.error("  Mail tracking insert failed:", mailErr.message);
  } else {
    console.log(`  Inserted ${mailRows.length} mail tracking rows`);
  }

  // ── Summary ───────────────────────────────────────────────────────────
  const { data: finalDeals } = await sb
    .from("deals")
    .select("id")
    .eq("event_id", EVENT_ID);
  const { data: finalSp } = await sb
    .from("salespeople")
    .select("id")
    .eq("event_id", EVENT_ID);

  console.log("\n══════════════════════════════════════════════");
  console.log("Done! Tacoma Nissan update complete.");
  console.log(`  Salespeople: ${finalSp?.length}`);
  console.log(`  Deals:       ${finalDeals?.length}`);
  console.log(`  Mail:        ${mailRows.length} ZIP rows`);
  console.log("══════════════════════════════════════════════");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
