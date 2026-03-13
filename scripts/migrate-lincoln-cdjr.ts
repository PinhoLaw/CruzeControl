/**
 * Migration script: inserts Lincoln CDJR event data (from old Supabase project)
 * into the new project. Data was extracted via MCP SQL and embedded here.
 *
 * Usage:  npx tsx scripts/migrate-lincoln-cdjr.ts
 */

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

// ── Default Lenders ──────────────────────────────────────────────────────────
const DEFAULT_LENDERS = [
  "BECU", "KITSAP", "HARBORSTONE", "GESA", "GLOBAL", "ALLY", "NMAC", "CPS",
  "ICCU", "WHATCOM", "CASH", "OTHER", "FIRST TEC EXP 09",
  "TRULIANT EQUI VANTAGE", "SHARONVIEW TRANS 08", "CINCH TRANS 08",
  "AXOS EQUIFAX 08", "PENN FED EQUI 08 NON AUTO", "US BANK EQUIFAX 09",
  "EXETER EXP", "ALLY EXP", "SANT EXP", "MID AMER CU (9YR OLD MAX)",
];

// ── Roster Data (16 rows) ───────────────────────────────────────────────────
const ROSTER = [
  { name: "ABDUL AL TABBAH", phone: null, email: null, confirmed: true, type: "rep", notes: "Gateway" },
  { name: "ANDREW ODEI", phone: null, email: null, confirmed: true, type: "rep", notes: "CASH" },
  { name: "BRYAN ROGERS", phone: null, email: null, confirmed: true, type: "rep", notes: "Team Leader | Ally" },
  { name: "BRYANT ROGERS", phone: null, email: null, confirmed: true, type: "rep", notes: "BOA" },
  { name: "CHRIS MARTIN", phone: null, email: null, confirmed: true, type: "rep", notes: "GM Fin LS | 4x4" },
  { name: "IGOR PLETNOR", phone: null, email: null, confirmed: true, type: "rep", notes: "Capital One" },
  { name: "IRELAND COMBS", phone: null, email: null, confirmed: true, type: "rep", notes: "Chase | RWD" },
  { name: "JOSE TORRES", phone: null, email: null, confirmed: true, type: "rep", notes: "NBT" },
  { name: 'MAKOTO "TOKYO" MACHO', phone: null, email: null, confirmed: true, type: "rep", notes: "HANSCOM FED" },
  { name: "MAYCON MIKE GUIMARAES", phone: null, email: null, confirmed: true, type: "rep", notes: "F&I Manager | Huntington" },
  { name: "MIKE LASHLEY", phone: null, email: null, confirmed: true, type: "rep", notes: "Mazda" },
  { name: "NATE HARDING", phone: null, email: null, confirmed: true, type: "rep", notes: "5th/3rd | FWD" },
  { name: "NICK WILEY", phone: null, email: null, confirmed: true, type: "rep", notes: "KeyBank N.A. | 4x2" },
  { name: "OSSIE SAMPSON", phone: null, email: null, confirmed: true, type: "rep", notes: "NATE LABRECQUE | TD Auto" },
  { name: "RJ JOHNSON JR", phone: null, email: null, confirmed: true, type: "rep", notes: "service cu" },
  { name: "TREVON HALL", phone: null, email: null, confirmed: true, type: "rep", notes: "GM Fin Ret | AWD" },
];

// ── Deals Data (47 rows) ────────────────────────────────────────────────────
const DEALS = [
  { customer_name: "NEVITT", customer_zip: "62613", deal_num: "1", new_used: "New", year: 2026, make: "JEEP", model: "GR CHEROKEE", cost: null, stock_number: "J3523", front_gross: 5785, lender: "HEARTLAND", rate: 5.84, reserve: 541.22, warranty: 1493, gap: 672, aft1: null, fi_total: 2706.22, total_gross: 8491.22, funded: false, salesperson: "JOSE TORRES", second_salesperson: null, notes: null, trade_year: "2024", trade_make: "JEEP", trade_model: "COMPASS", trade_miles: "20996", acv: 19000, payoff: 28700, age: 31 },
  { customer_name: "VAUGHT", customer_zip: "27295", deal_num: "1", new_used: "Used", year: 2020, make: "RAM", model: "1500", cost: 29944, stock_number: "M3551", front_gross: 3575.15, lender: "CEFCU", rate: 5.59, reserve: 400.78, warranty: 1954, gap: 673, aft1: null, fi_total: 3027.78, total_gross: 6602.93, funded: false, salesperson: "OSSIE SAMPSON", second_salesperson: null, notes: null, trade_year: null, trade_make: null, trade_model: null, trade_miles: null, acv: null, payoff: null, age: 9 },
  { customer_name: "CONNOR", customer_zip: "62656", deal_num: "1", new_used: "New", year: 2025, make: "JEEP", model: "GR CHER", cost: 45515, stock_number: "J3387", front_gross: 7040.86, lender: "STELLANTIS", rate: 9.89, reserve: 1725.16, warranty: 1494, gap: 473, aft1: null, fi_total: 3692.16, total_gross: 10733.02, funded: false, salesperson: "MIKE LASHLEY", second_salesperson: null, notes: "veh cost 45566.14", trade_year: "2018", trade_make: "JEEP", trade_model: "G CHEROKEE", trade_miles: "128372", acv: 8000, payoff: 11959, age: 156 },
  { customer_name: "GAULE", customer_zip: "62666", deal_num: "1", new_used: "New", year: 2025, make: "JEEP", model: "GR CHEROKEE", cost: 44980, stock_number: "J3456", front_gross: 6420, lender: "HEARTLAND", rate: 5.84, reserve: 392.4, warranty: 1251, gap: null, aft1: 517, fi_total: 2160.4, total_gross: 8580.4, funded: false, salesperson: "BRYAN ROGERS", second_salesperson: null, notes: null, trade_year: "2023", trade_make: "JEEP", trade_model: "COMPASS", trade_miles: "34383", acv: 22000, payoff: 20415, age: 89 },
  { customer_name: "NEWBERN", customer_zip: "62526", deal_num: "1", new_used: "Used", year: 2020, make: "JEEP", model: "COMPASS", cost: 9381.65, stock_number: "P3548A", front_gross: 5918.35, lender: "STELLANTIS", rate: 24.99, reserve: 194.79, warranty: 871, gap: null, aft1: null, fi_total: 1065.79, total_gross: 6984.14, funded: false, salesperson: "OSSIE SAMPSON", second_salesperson: null, notes: "veh cost 9381.65", trade_year: "1994", trade_make: "FORD", trade_model: "F-150", trade_miles: null, acv: 500, payoff: null, age: 11 },
  { customer_name: "GALLAGHER", customer_zip: "62702", deal_num: "1", new_used: "Used", year: 2023, make: "FORD", model: "ESCAPE", cost: 22095, stock_number: "P3479", front_gross: 5438.76, lender: "BETTER B", rate: 5.64, reserve: 534.87, warranty: 2515, gap: 873, aft1: null, fi_total: 3922.87, total_gross: 9361.63, funded: false, salesperson: "HOUSE", second_salesperson: null, notes: null, trade_year: "2017", trade_make: "NISSAN", trade_model: "VERSA", trade_miles: "152208", acv: 2500, payoff: null, age: 64 },
  { customer_name: "LEE", customer_zip: "62526", deal_num: "2", new_used: "Used", year: 2024, make: "CHEVY", model: "EQUINOX", cost: 25504.39, stock_number: "M3550", front_gross: 5715.61, lender: "HEARTLAND", rate: 6.34, reserve: 406.99, warranty: 2504, gap: 673, aft1: 917, fi_total: 4500.99, total_gross: 10216.6, funded: false, salesperson: "NATE HARDING", second_salesperson: null, notes: "veh cost 24754.39", trade_year: null, trade_make: null, trade_model: null, trade_miles: null, acv: null, payoff: null, age: 8 },
  { customer_name: "LAWSON", customer_zip: "62521", deal_num: "2", new_used: "Used", year: 2023, make: "NISSAN", model: "ROGUE", cost: 18655, stock_number: "M3536", front_gross: 2000, lender: "CPS", rate: 18.3, reserve: 1330, warranty: 860, gap: null, aft1: null, fi_total: 2190, total_gross: 4190, funded: false, salesperson: 'MAKOTO "TOKYO" MACHO', second_salesperson: null, notes: "MINI", trade_year: "2010", trade_make: "CHEVY", trade_model: "MALIBU", trade_miles: null, acv: 500, payoff: null, age: 22 },
  { customer_name: "NAFZIGER", customer_zip: "61747", deal_num: "2", new_used: "Used", year: 2022, make: "FORD", model: "ESCAPE", cost: 19872, stock_number: "P3567", front_gross: 5978, lender: "PNC", rate: 9.95, reserve: 1795, warranty: 1955, gap: 673, aft1: null, fi_total: 4423, total_gross: 10401, funded: false, salesperson: "ANDREW ODEI", second_salesperson: null, notes: null, trade_year: null, trade_make: null, trade_model: null, trade_miles: null, acv: null, payoff: null, age: null },
  { customer_name: "BERNHARDT", customer_zip: "62702", deal_num: "2", new_used: "Used", year: 2018, make: "JEEP", model: "GR CHEROKEE", cost: null, stock_number: "J3387A", front_gross: 3724, lender: "CPS", rate: 19.8, reserve: 689, warranty: null, gap: null, aft1: null, fi_total: 689, total_gross: 4413, funded: false, salesperson: "OSSIE SAMPSON", second_salesperson: null, notes: null, trade_year: "2010", trade_make: "ACURA", trade_model: "MDX", trade_miles: "193602", acv: 1500, payoff: 0, age: 2 },
  { customer_name: "CLARK", customer_zip: "62702", deal_num: "2", new_used: "Used", year: 2021, make: "TOYOTA", model: "RAV 4", cost: 22015, stock_number: "M3556", front_gross: 4215.59, lender: "HEARTLAND", rate: 6.14, reserve: 320.3, warranty: null, gap: null, aft1: null, fi_total: 320.3, total_gross: 4535.89, funded: false, salesperson: "TREVON HALL", second_salesperson: null, notes: "veh cost 22015.29", trade_year: "2016", trade_make: "NISSAN", trade_model: "ROGUE", trade_miles: "108278", acv: 4500, payoff: 10311, age: 9 },
  { customer_name: "WASHINGTON", customer_zip: "62702", deal_num: "2", new_used: "Used", year: 2024, make: "JEEP", model: "COMPASS", cost: 20400, stock_number: "J3523A", front_gross: 6621.72, lender: "GLOBAL", rate: 21.95, reserve: 821.7, warranty: 1773, gap: null, aft1: null, fi_total: 2594.7, total_gross: 9216.42, funded: false, salesperson: "MAYCON MIKE GUIMARAES", second_salesperson: null, notes: null, trade_year: "2018", trade_make: "NISSAN", trade_model: "ALTIMA", trade_miles: "160000", acv: 1800, payoff: 0, age: 2 },
  { customer_name: "PRITCHARD", customer_zip: "62613", deal_num: "3", new_used: "Used", year: 2024, make: "CHEVY", model: "MALIBU", cost: 18705.36, stock_number: "G3543", front_gross: 5144.64, lender: "HEARTLAND", rate: 6.34, reserve: 303.25, warranty: 1934, gap: 673, aft1: null, fi_total: 2910.25, total_gross: 8054.89, funded: false, salesperson: "JOSE TORRES", second_salesperson: null, notes: null, trade_year: "2011", trade_make: "DODGE", trade_model: "CALIBER", trade_miles: null, acv: 500, payoff: null, age: 17 },
  { customer_name: "CONNOR", customer_zip: "62656", deal_num: "3", new_used: "New", year: 2026, make: "RAM", model: "2500", cost: 57490, stock_number: "R3513", front_gross: 0, lender: "CEFCU", rate: 5.64, reserve: 713.16, warranty: 1965, gap: 673, aft1: 417, fi_total: 3768.16, total_gross: 3768.16, funded: false, salesperson: "HOUSE", second_salesperson: null, notes: "MINI", trade_year: "2021", trade_make: "RAM", trade_model: "1500", trade_miles: "75741", acv: 29000, payoff: 47800, age: 34 },
  { customer_name: "PHILLIPS", customer_zip: "62671", deal_num: "3", new_used: "Used", year: 2020, make: "JEEP", model: "GR CHEROKEE", cost: 23355, stock_number: "M3527", front_gross: 6039.75, lender: "SANT", rate: 16.35, reserve: 1352.47, warranty: null, gap: null, aft1: null, fi_total: 1352.47, total_gross: 7392.22, funded: false, salesperson: "BRYAN ROGERS", second_salesperson: null, notes: null, trade_year: "2019", trade_make: "JEEP", trade_model: "CHEROKEE", trade_miles: "106000", acv: 8500, payoff: 0, age: 28 },
  { customer_name: "SMITH", customer_zip: "62656", deal_num: "3", new_used: "Used", year: 2022, make: "FORD", model: "MAVERICK", cost: 25928, stock_number: "G3441", front_gross: 5763.69, lender: "HEARTLAND", rate: 6.64, reserve: 378.47, warranty: 2393, gap: 673, aft1: null, fi_total: 3444.47, total_gross: 9208.16, funded: false, salesperson: "NATE HARDING", second_salesperson: null, notes: null, trade_year: "2015", trade_make: "CHEVY", trade_model: "EQUINOX", trade_miles: "115415", acv: 3000, payoff: 941, age: 97 },
  { customer_name: "WRIGHT", customer_zip: "62656", deal_num: "3", new_used: "Used", year: 2022, make: "RAM", model: "1500", cost: null, stock_number: "M3530", front_gross: 8142.21, lender: "GLOBAL", rate: 13.7, reserve: 1216.07, warranty: 1021, gap: 635, aft1: null, fi_total: 2872.07, total_gross: 11014.28, funded: false, salesperson: "HOUSE", second_salesperson: null, notes: null, trade_year: "2008", trade_make: "TOYOTA", trade_model: "SIENNA", trade_miles: null, acv: null, payoff: null, age: 26 },
  { customer_name: "MCCOY", customer_zip: "62551", deal_num: "3", new_used: "Used", year: 2020, make: "GMC", model: "TERRAIN", cost: 21462, stock_number: "M3518A", front_gross: 6189, lender: "HEARTLAND", rate: 4.39, reserve: 336.16, warranty: 2057, gap: 673, aft1: null, fi_total: 3066.16, total_gross: 9255.16, funded: false, salesperson: "BRYANT ROGERS", second_salesperson: null, notes: null, trade_year: "2019", trade_make: "FORD", trade_model: "EDGE", trade_miles: "109000", acv: 6000, payoff: 4495.77, age: 1 },
  { customer_name: "NEVITT", customer_zip: "62613", deal_num: "4", new_used: "Used", year: 2023, make: "JEEP", model: "GR CHEROKEE", cost: 30520.45, stock_number: "M3516", front_gross: 10599.55, lender: "PNC", rate: 6.93, reserve: 817.41, warranty: null, gap: null, aft1: 1802, fi_total: 2619.41, total_gross: 13218.96, funded: false, salesperson: "JOSE TORRES", second_salesperson: null, notes: "veh cost 30520.45 / dlr resv 817.41 + svc cont. 1802.00", trade_year: "2015", trade_make: "DODGE", trade_model: "CARAVAN", trade_miles: "139969", acv: 2500, payoff: 0, age: null },
  { customer_name: "QUICK", customer_zip: "62963", deal_num: "4", new_used: "Used", year: 2024, make: "CHEVY", model: "MALIBU", cost: 18407, stock_number: "M3546", front_gross: 4842.83, lender: "CEFCU", rate: 5.89, reserve: 313.6, warranty: 2678, gap: 673, aft1: 612, fi_total: 4276.6, total_gross: 9119.43, funded: false, salesperson: 'MAKOTO "TOKYO" MACHO', second_salesperson: null, notes: null, trade_year: "2010", trade_make: "HYUNDAI", trade_model: "ELANTRA", trade_miles: "165509", acv: 750, payoff: 0, age: 14 },
  { customer_name: "TEAL", customer_zip: "62526", deal_num: "4", new_used: "Used", year: 2017, make: "JEEP", model: "CHEROKEE", cost: null, stock_number: "G3521", front_gross: 2909.64, lender: "HEARTLAND", rate: 10.54, reserve: 250.91, warranty: 2274, gap: 673, aft1: 613, fi_total: 3810.91, total_gross: 6720.55, funded: false, salesperson: "BRYANT ROGERS", second_salesperson: null, notes: null, trade_year: null, trade_make: "NT", trade_model: null, trade_miles: null, acv: null, payoff: null, age: 32 },
  { customer_name: "SHAWGO", customer_zip: "62656", deal_num: "4", new_used: "Used", year: 2022, make: "FORD", model: "MAVERICK", cost: 147902.03, stock_number: "R3359C", front_gross: 5747.97, lender: "STELLANTIS", rate: 18.66, reserve: 738.61, warranty: null, gap: 873, aft1: 212, fi_total: 1823.61, total_gross: 7571.58, funded: false, salesperson: "MIKE LASHLEY", second_salesperson: null, notes: "veh cost 17902.03", trade_year: "2003", trade_make: "TOYOTA", trade_model: "SOLARA", trade_miles: "200000", acv: 800, payoff: null, age: 1 },
  { customer_name: "KABEYA", customer_zip: "62702", deal_num: "4", new_used: "Used", year: 2022, make: "HONDA", model: "PILOT", cost: 29169.96, stock_number: "M3520", front_gross: 8380.04, lender: "STELLANTIS", rate: 12.63, reserve: 1970.12, warranty: 2131, gap: 873, aft1: null, fi_total: 4974.12, total_gross: 13354.16, funded: false, salesperson: "IGOR PLETNOR", second_salesperson: null, notes: null, trade_year: "2017", trade_make: "TOYOTA", trade_model: "CAMRY", trade_miles: "111234", acv: 9000, payoff: 0, age: 31 },
  { customer_name: "MITCHELL", customer_zip: "61756", deal_num: "5", new_used: "Used", year: 2019, make: "FORD", model: "EXPLORER", cost: 14829.77, stock_number: "G3519", front_gross: 3169.23, lender: "HARTLAND", rate: 5.54, reserve: 231.66, warranty: 1405, gap: null, aft1: null, fi_total: 1636.66, total_gross: 4805.89, funded: false, salesperson: "JOSE TORRES", second_salesperson: null, notes: "missed dlr resv +231.66", trade_year: null, trade_make: null, trade_model: null, trade_miles: null, acv: null, payoff: null, age: 28 },
  { customer_name: "GUEMES", customer_zip: "62702", deal_num: "5", new_used: "Used", year: 2022, make: "CHEVY", model: "SUBURBAN", cost: null, stock_number: "J3415A", front_gross: 3187.56, lender: "CEFCU", rate: 6.04, reserve: 538.16, warranty: null, gap: 618, aft1: null, fi_total: 1156.16, total_gross: 4343.72, funded: false, salesperson: "IGOR PLETNOR", second_salesperson: null, notes: null, trade_year: "2021", trade_make: "GMC", trade_model: "ACADIA", trade_miles: "58428", acv: 17700, payoff: 28168, age: 54 },
  { customer_name: "WARTENBE", customer_zip: "62545", deal_num: "5", new_used: "Used", year: 2019, make: "LINCOLN", model: "MKC", cost: 18348, stock_number: "G3532", front_gross: 8129.51, lender: "HEARTLAND", rate: 9.04, reserve: 254.83, warranty: 1540, gap: 0, aft1: null, fi_total: 1794.83, total_gross: 9924.34, funded: false, salesperson: "CHRIS MARTIN", second_salesperson: null, notes: null, trade_year: "2016", trade_make: "NISSAN", trade_model: "SENTRA", trade_miles: "156000", acv: 1200, payoff: 0, age: 22 },
  { customer_name: "ANKROM", customer_zip: "62561", deal_num: "5", new_used: "New", year: 2025, make: "JEEP", model: "GR CHER", cost: 47015, stock_number: "J3384", front_gross: 5210, lender: "CAP 1", rate: 9.81, reserve: 2292.61, warranty: null, gap: 673, aft1: null, fi_total: 2965.61, total_gross: 8175.61, funded: false, salesperson: 'MAKOTO "TOKYO" MACHO', second_salesperson: null, notes: null, trade_year: "2014", trade_make: "JEEP", trade_model: "WRANGLER", trade_miles: "80365", acv: 12500, payoff: 0, age: 158 },
  { customer_name: "TUCKER", customer_zip: "62551", deal_num: "6", new_used: "New", year: 2026, make: "CHRYSLER", model: "PACIFICA", cost: 44835, stock_number: "C3373", front_gross: 1014, lender: "HEARTLAND", rate: 6.34, reserve: 631.36, warranty: 1042, gap: 673, aft1: null, fi_total: 2346.36, total_gross: 3360.36, funded: false, salesperson: "NICK WILEY", second_salesperson: null, notes: null, trade_year: "2023", trade_make: "BUICK", trade_model: "ENVISION", trade_miles: "35204", acv: 20000, payoff: 37556, age: 165 },
  { customer_name: "GALE", customer_zip: "61734", deal_num: "6", new_used: "Used", year: 2025, make: "TOYOTA", model: "RAV 4", cost: 30721, stock_number: "M3518", front_gross: 10253.3, lender: "HEARTLAND", rate: 5.84, reserve: null, warranty: 2325, gap: null, aft1: 612, fi_total: 2937, total_gross: 13190.3, funded: false, salesperson: "NICK WILEY", second_salesperson: null, notes: null, trade_year: "2020", trade_make: "GMC", trade_model: "TERRAIN", trade_miles: "48666", acv: 21000, payoff: 12622.95, age: 30 },
  { customer_name: "STIRTS", customer_zip: "62526", deal_num: "6", new_used: "Used", year: 2016, make: "HONDA", model: "ACCORD", cost: null, stock_number: "P3555", front_gross: 2000, lender: "CU1", rate: 7.76, reserve: 308.07, warranty: null, gap: 673, aft1: null, fi_total: 981.07, total_gross: 2981.07, funded: false, salesperson: "CHRIS MARTIN", second_salesperson: null, notes: "veh cost 14664.81", trade_year: null, trade_make: null, trade_model: null, trade_miles: null, acv: null, payoff: null, age: 11 },
  { customer_name: "REED", customer_zip: "62521", deal_num: "7", new_used: "Used", year: 2022, make: "CHEVY", model: "BLAZER", cost: 22531, stock_number: "G3425", front_gross: 5432.06, lender: "CEFCU", rate: 12.09, reserve: 349.66, warranty: 2778, gap: 673, aft1: null, fi_total: 3800.66, total_gross: 9232.72, funded: false, salesperson: "BRYANT ROGERS", second_salesperson: null, notes: null, trade_year: null, trade_make: null, trade_model: null, trade_miles: null, acv: null, payoff: null, age: 111 },
  { customer_name: "GIDDINGS", customer_zip: "62702", deal_num: "7", new_used: "Used", year: 2015, make: "RAM", model: "2500", cost: 12015, stock_number: "P3430C", front_gross: 6044.33, lender: "HEARTLAND", rate: 8.99, reserve: 294.39, warranty: 1730, gap: 673, aft1: null, fi_total: 2697.39, total_gross: 8741.72, funded: false, salesperson: "MAYCON MIKE GUIMARAES", second_salesperson: null, notes: null, trade_year: "2011", trade_make: "FORD", trade_model: "F-150", trade_miles: "93960", acv: 11000, payoff: 16317, age: 5 },
  { customer_name: "ROGERS", customer_zip: "62561", deal_num: "7", new_used: "New", year: 2026, make: "JEEP", model: "COMPASS", cost: null, stock_number: "J3469", front_gross: 7594.64, lender: "HEARTLAND", rate: 6.34, reserve: 467.44, warranty: 2312, gap: 618, aft1: null, fi_total: 3397.44, total_gross: 10992.08, funded: false, salesperson: "ABDUL AL TABBAH", second_salesperson: null, notes: null, trade_year: "2017", trade_make: "FORD", trade_model: "ESCAPE", trade_miles: "85791", acv: 5000, payoff: 9941, age: 76 },
  { customer_name: "ABRAHAM", customer_zip: "62644", deal_num: "8", new_used: "New", year: 2025, make: "JEEP", model: "GR CHEROKEE", cost: 52871, stock_number: "J3420", front_gross: 4044, lender: "CEFCU", rate: 6.84, reserve: 591.51, warranty: 0, gap: 673, aft1: 707, fi_total: 1971.51, total_gross: 6015.51, funded: false, salesperson: "BRYAN ROGERS", second_salesperson: null, notes: null, trade_year: null, trade_make: null, trade_model: null, trade_miles: null, acv: null, payoff: null, age: 117 },
  { customer_name: "DEVORE/FRANKLIN", customer_zip: "62539", deal_num: "8", new_used: "Used", year: 2022, make: "KIA", model: "SPORTAGE", cost: 21819, stock_number: "M3517", front_gross: 5954, lender: "HEARTLAND", rate: 7.14, reserve: 303.99, warranty: 1200, gap: null, aft1: null, fi_total: 1503.99, total_gross: 7457.99, funded: false, salesperson: "MIKE LASHLEY", second_salesperson: null, notes: "veh cost 21854.00", trade_year: null, trade_make: null, trade_model: null, trade_miles: null, acv: null, payoff: null, age: 30 },
  { customer_name: "KENNETT", customer_zip: "62635", deal_num: "8", new_used: "Used", year: 2021, make: "CHRYSLER", model: "VOYAGER", cost: null, stock_number: "P3568A", front_gross: 6198.05, lender: "HEARTLAND", rate: 5.39, reserve: 218.23, warranty: 2040, gap: 673, aft1: 613, fi_total: 3544.23, total_gross: 9742.28, funded: false, salesperson: "HOUSE", second_salesperson: null, notes: null, trade_year: "2010", trade_make: "HYUNDAI", trade_model: "SONATA", trade_miles: "183371", acv: 500, payoff: null, age: 2 },
  { customer_name: "JOHNSON", customer_zip: "62702", deal_num: "9", new_used: "Used", year: 2019, make: "FORD", model: "EDGE", cost: 6000, stock_number: "M3518B", front_gross: 4103, lender: "GLOBAL", rate: 22.2, reserve: 324.71, warranty: null, gap: 840, aft1: null, fi_total: 1164.71, total_gross: 5267.71, funded: false, salesperson: "MAYCON MIKE GUIMARAES", second_salesperson: null, notes: null, trade_year: null, trade_make: null, trade_model: null, trade_miles: null, acv: null, payoff: null, age: 1 },
  { customer_name: "DONATH", customer_zip: "62656", deal_num: "9", new_used: "Used", year: 2019, make: "RAM", model: "1500", cost: null, stock_number: "G3417A", front_gross: 8494, lender: "SANT", rate: 18.73, reserve: 1615.82, warranty: 2040, gap: null, aft1: null, fi_total: 3655.82, total_gross: 12149.82, funded: false, salesperson: "TREVON HALL", second_salesperson: null, notes: null, trade_year: "2018", trade_make: "CHRYSLER", trade_model: "PACIFICA", trade_miles: "128496", acv: 5000, payoff: 0, age: 13 },
  { customer_name: "MCCANNE", customer_zip: "62634", deal_num: "10", new_used: "Used", year: 2022, make: "RAM", model: "1500", cost: 40761, stock_number: "P3568", front_gross: 4189, lender: "HEARTLAND", rate: 6.14, reserve: 593.71, warranty: null, gap: 673, aft1: null, fi_total: 1266.71, total_gross: 5455.71, funded: false, salesperson: "IGOR PLETNOR", second_salesperson: null, notes: "veh cost 40762.00 / f&i = gap 673 + resv 593.71 / no warr.", trade_year: "2021", trade_make: "CHRYSLER", trade_model: "VOYAGER", trade_miles: "138204", acv: 7500, payoff: 17862, age: 1 },
  { customer_name: "CROSIER", customer_zip: "61778", deal_num: "11", new_used: "Used", year: 2021, make: "JEEP", model: "WRANGLER", cost: null, stock_number: "P3569", front_gross: 0, lender: "CAP 1", rate: 13.59, reserve: 359, warranty: 1517, gap: null, aft1: null, fi_total: 1876, total_gross: 1876, funded: false, salesperson: "HOUSE", second_salesperson: null, notes: null, trade_year: "2018", trade_make: "BMW", trade_model: "5 SERIES", trade_miles: "113661", acv: 13500, payoff: 18466, age: null },
  { customer_name: "JARRIN", customer_zip: "62526", deal_num: null, new_used: "Used", year: 2022, make: "FORD", model: "EDGE", cost: 20620, stock_number: "M3531", front_gross: 3291.15, lender: "CEFCU", rate: 5.64, reserve: 314.74, warranty: 2240, gap: 673, aft1: null, fi_total: 3227.74, total_gross: 6518.89, funded: false, salesperson: "NATE HARDING", second_salesperson: null, notes: "veh cost 20620.16", trade_year: "2007", trade_make: "FORD", trade_model: "500", trade_miles: "210000", acv: 175, payoff: null, age: 20 },
  { customer_name: "NIEHAUS", customer_zip: "62656", deal_num: null, new_used: "Used", year: 2022, make: "RAM", model: "1500", cost: 34249, stock_number: "R3359A", front_gross: 9978.33, lender: "CEFCU", rate: 6.74, reserve: 581.58, warranty: 2230, gap: 673, aft1: null, fi_total: 3484.58, total_gross: 13462.91, funded: false, salesperson: 'MAKOTO "TOKYO" MACHO', second_salesperson: null, notes: "veh cost 34321.99", trade_year: "2022", trade_make: "FORD", trade_model: "MAVERICK", trade_miles: "57274", acv: 17000, payoff: 21303, age: 26 },
  { customer_name: "MACK", customer_zip: "62703", deal_num: null, new_used: "Used", year: 2020, make: "NISASN", model: "MURANO", cost: 10348, stock_number: "G3390A", front_gross: 4951.45, lender: "CEFCU", rate: 12.29, reserve: 253.77, warranty: 1894, gap: 673, aft1: null, fi_total: 2820.77, total_gross: 7772.22, funded: false, salesperson: "BRYANT ROGERS", second_salesperson: "HOUSE", notes: null, trade_year: "2012", trade_make: "BUICK", trade_model: "REGAL", trade_miles: "106608", acv: 2500, payoff: 6449, age: 25 },
  { customer_name: "STILTMAN", customer_zip: "61723", deal_num: null, new_used: "Used", year: 2020, make: "JEEP", model: "GLADIATOR", cost: 27451, stock_number: "P3430A", front_gross: 2000, lender: "CEFCU", rate: 4.84, reserve: 86.96, warranty: null, gap: null, aft1: 517, fi_total: 603.96, total_gross: 2603.96, funded: false, salesperson: "BRYANT ROGERS", second_salesperson: "MAYCON MIKE GUIMARAES", notes: "MINI", trade_year: "2015", trade_make: "RAM", trade_model: "2500", trade_miles: "118456", acv: 11500, payoff: 0, age: 82 },
  { customer_name: "MIGUEL", customer_zip: "62526", deal_num: null, new_used: "Used", year: 2020, make: "CHEVY", model: "BLAZER", cost: 16668, stock_number: "G3552", front_gross: 2000, lender: "STELLANTIS", rate: 21.99, reserve: 144.85, warranty: null, gap: 873, aft1: null, fi_total: 1017.85, total_gross: 3017.85, funded: false, salesperson: "BRYANT ROGERS", second_salesperson: "HOUSE", notes: "MINI", trade_year: null, trade_make: null, trade_model: null, trade_miles: null, acv: null, payoff: null, age: 7 },
  { customer_name: "BAKER", customer_zip: "62656", deal_num: null, new_used: "New", year: 2026, make: "JEEP", model: "COMPASS", cost: 32457, stock_number: "J3475", front_gross: 2148, lender: "CEFCU", rate: 7.34, reserve: 459.59, warranty: 2870, gap: 673, aft1: null, fi_total: 4002.59, total_gross: 6150.59, funded: false, salesperson: "MIKE LASHLEY", second_salesperson: null, notes: null, trade_year: "2018", trade_make: "CHEVROLET", trade_model: "EQUINOX", trade_miles: "156000", acv: 5000, payoff: 12311.56, age: 67 },
  { customer_name: "MARTIN", customer_zip: "62548", deal_num: null, new_used: "Used", year: 2025, make: "CHEVY", model: "SILVERADO", cost: 51424, stock_number: "R3059A", front_gross: 2752.1, lender: "CEFCU", rate: 4.74, reserve: 535.66, warranty: 1854, gap: null, aft1: null, fi_total: 2389.66, total_gross: 5141.76, funded: false, salesperson: "HOUSE", second_salesperson: null, notes: null, trade_year: "2010", trade_make: "CHEVY", trade_model: "SILVERADO", trade_miles: "108931", acv: 4000, payoff: 0, age: 33 },
];

// ── Inventory Data (37 trade-in rows) ────────────────────────────────────────
const INVENTORY = [
  { year: 1994, make: "FORD", model: "F-150", odometer: null, cost: 500, location: "TRADE" },
  { year: 2003, make: "TOYOTA", model: "SOLARA", odometer: 200000, cost: 800, location: "TRADE" },
  { year: 2007, make: "FORD", model: "500", odometer: 210000, cost: 175, location: "TRADE" },
  { year: 2008, make: "TOYOTA", model: "SIENNA", odometer: null, cost: null, location: "TRADE" },
  { year: 2010, make: "ACURA", model: "MDX", odometer: 193602, cost: 1500, location: "TRADE" },
  { year: 2010, make: "CHEVY", model: "MALIBU", odometer: null, cost: 500, location: "TRADE" },
  { year: 2010, make: "CHEVY", model: "SILVERADO", odometer: 108931, cost: 4000, location: "TRADE" },
  { year: 2010, make: "HYUNDAI", model: "ELANTRA", odometer: 165509, cost: 750, location: "TRADE" },
  { year: 2010, make: "HYUNDAI", model: "SONATA", odometer: 183371, cost: 500, location: "TRADE" },
  { year: 2011, make: "DODGE", model: "CALIBER", odometer: null, cost: 500, location: "TRADE" },
  { year: 2011, make: "FORD", model: "F-150", odometer: 93960, cost: 11000, location: "TRADE" },
  { year: 2012, make: "BUICK", model: "REGAL", odometer: 106608, cost: 2500, location: "TRADE" },
  { year: 2014, make: "JEEP", model: "WRANGLER", odometer: 80365, cost: 12500, location: "TRADE" },
  { year: 2015, make: "CHEVY", model: "EQUINOX", odometer: 115415, cost: 3000, location: "TRADE" },
  { year: 2015, make: "DODGE", model: "CARAVAN", odometer: 139969, cost: 2500, location: "TRADE" },
  { year: 2015, make: "RAM", model: "2500", odometer: 118456, cost: 11500, location: "TRADE" },
  { year: 2016, make: "NISSAN", model: "ROGUE", odometer: 108278, cost: 4500, location: "TRADE" },
  { year: 2016, make: "NISSAN", model: "SENTRA", odometer: 156000, cost: 1200, location: "TRADE" },
  { year: 2017, make: "FORD", model: "ESCAPE", odometer: 85791, cost: 5000, location: "TRADE" },
  { year: 2017, make: "NISSAN", model: "VERSA", odometer: 152208, cost: 2500, location: "TRADE" },
  { year: 2017, make: "TOYOTA", model: "CAMRY", odometer: 111234, cost: 9000, location: "TRADE" },
  { year: 2018, make: "BMW", model: "5 SERIES", odometer: 113661, cost: 13500, location: "TRADE" },
  { year: 2018, make: "CHEVROLET", model: "EQUINOX", odometer: 156000, cost: 5000, location: "TRADE" },
  { year: 2018, make: "CHRYSLER", model: "PACIFICA", odometer: 128496, cost: 5000, location: "TRADE" },
  { year: 2018, make: "JEEP", model: "G CHEROKEE", odometer: 128372, cost: 8000, location: "TRADE" },
  { year: 2018, make: "NISSAN", model: "ALTIMA", odometer: 160000, cost: 1800, location: "TRADE" },
  { year: 2019, make: "FORD", model: "EDGE", odometer: 109000, cost: 6000, location: "TRADE" },
  { year: 2019, make: "JEEP", model: "CHEROKEE", odometer: 106000, cost: 8500, location: "TRADE" },
  { year: 2020, make: "GMC", model: "TERRAIN", odometer: 48666, cost: 21000, location: "TRADE" },
  { year: 2021, make: "CHRYSLER", model: "VOYAGER", odometer: 138204, cost: 7500, location: "TRADE" },
  { year: 2021, make: "GMC", model: "ACADIA", odometer: 58428, cost: 17700, location: "TRADE" },
  { year: 2021, make: "RAM", model: "1500", odometer: 75741, cost: 29000, location: "TRADE" },
  { year: 2022, make: "FORD", model: "MAVERICK", odometer: 57274, cost: 17000, location: "TRADE" },
  { year: 2023, make: "BUICK", model: "ENVISION", odometer: 35204, cost: 20000, location: "TRADE" },
  { year: 2023, make: "JEEP", model: "COMPASS", odometer: 34383, cost: 22000, location: "TRADE" },
  { year: 2024, make: "JEEP", model: "COMPASS", odometer: 20996, cost: 19000, location: "TRADE" },
  { year: null, make: "NT", model: null, odometer: null, cost: null, location: "TRADE" },
];

async function main() {
  // ── Step 1: Create Event ──────────────────────────────────────────────────
  console.log("Step 1: Creating Lincoln CDJR event...");
  const { data: event, error: evErr } = await supabase
    .from("events")
    .insert({
      dealer_name: "LINCOLN CDJR",
      franchise: "CDJR",
      street: "103 Taylor Ct",
      city: "Lincoln",
      state: "IL",
      zip: "62656",
      start_date: "2026-02-24",
      end_date: "2026-03-03",
      status: "completed",
      jde_pct: 25,
    })
    .select("*")
    .single();

  if (evErr) {
    console.error("Failed to create event:", evErr.message);
    process.exit(1);
  }
  const eventId = event.id;
  console.log(`  Created event: ${event.dealer_name} (${eventId})`);

  // ── Step 2: Insert Roster ─────────────────────────────────────────────────
  console.log("\nStep 2: Inserting roster...");
  const rosterRows = ROSTER.map((r) => ({ event_id: eventId, ...r }));
  const { data: insertedRoster, error: rErr } = await supabase
    .from("salespeople")
    .insert(rosterRows)
    .select("id, name");

  if (rErr) {
    console.error("Failed to insert roster:", rErr.message);
    process.exit(1);
  }
  console.log(`  Inserted ${insertedRoster!.length} salespeople`);

  // Build name → id lookup
  const nameToId: Record<string, string> = {};
  for (const sp of insertedRoster!) {
    nameToId[sp.name] = sp.id;
  }

  // ── Step 3: Insert Deals ──────────────────────────────────────────────────
  console.log("\nStep 3: Inserting deals...");
  const dealRows = DEALS.map((d) => {
    const spId = d.salesperson ? nameToId[d.salesperson] || null : null;
    const sp2Id = d.second_salesperson ? nameToId[d.second_salesperson] || null : null;

    if (d.salesperson && !spId) {
      console.warn(`  Warning: salesperson "${d.salesperson}" not found in roster`);
    }
    if (d.second_salesperson && !sp2Id) {
      console.warn(`  Warning: second_salesperson "${d.second_salesperson}" not found in roster`);
    }

    return {
      event_id: eventId,
      deal_num: d.deal_num,
      deal_date: null,
      customer_name: d.customer_name,
      customer_zip: d.customer_zip,
      new_used: d.new_used,
      year: d.year,
      make: d.make,
      model: d.model,
      cost: d.cost != null ? Math.round(d.cost) : null,
      salesperson_id: spId,
      salesperson2_id: sp2Id,
      closer_id: null,
      closer_type: null,
      front_gross: Math.round(d.front_gross),
      lender: d.lender,
      rate: d.rate,
      reserve: Math.round(d.reserve ?? 0),
      warranty: Math.round(d.warranty ?? 0),
      aft1: Math.round(d.aft1 ?? 0),
      gap: Math.round(d.gap ?? 0),
      funded: d.funded,
      notes: d.notes,
      trade_year: d.trade_year,
      trade_make: d.trade_make,
      trade_model: d.trade_model,
      trade_miles: d.trade_miles,
      acv: d.acv != null ? Math.round(d.acv) : 0,
      payoff: d.payoff != null ? Math.round(d.payoff) : 0,
      age: d.age,
    };
  });

  // Insert in batches of 25
  let dealsInserted = 0;
  for (let i = 0; i < dealRows.length; i += 25) {
    const batch = dealRows.slice(i, i + 25);
    const { error: dErr } = await supabase.from("deals").insert(batch);
    if (dErr) {
      console.error(`Failed to insert deals batch at ${i}:`, dErr.message);
      process.exit(1);
    }
    dealsInserted += batch.length;
    console.log(`  Inserted ${dealsInserted} / ${dealRows.length} deals`);
  }

  // ── Step 4: Insert Inventory ──────────────────────────────────────────────
  console.log("\nStep 4: Inserting inventory...");
  const invRows = INVENTORY.map((v) => ({
    event_id: eventId,
    year: v.year,
    make: v.make,
    model: v.model,
    odometer: v.odometer,
    cost: v.cost,
    location: v.location,
    notes: "Auto-created from trade-in",
  }));

  const { error: iErr } = await supabase.from("inventory").insert(invRows);
  if (iErr) {
    console.error("Failed to insert inventory:", iErr.message);
    process.exit(1);
  }
  console.log(`  Inserted ${invRows.length} inventory items`);

  // ── Step 5: Insert Default Lenders ────────────────────────────────────────
  console.log("\nStep 5: Inserting default lenders...");
  const lenderRows = DEFAULT_LENDERS.map((name) => ({ event_id: eventId, name }));
  const { error: lErr } = await supabase.from("lenders").insert(lenderRows);
  if (lErr) {
    console.error("Failed to insert lenders:", lErr.message);
    process.exit(1);
  }
  console.log(`  Inserted ${DEFAULT_LENDERS.length} lenders`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════");
  console.log(`Done! Lincoln CDJR migration complete.`);
  console.log(`  Event:     ${event.dealer_name} (${eventId})`);
  console.log(`  Roster:    ${insertedRoster!.length} salespeople`);
  console.log(`  Deals:     ${dealsInserted}`);
  console.log(`  Inventory: ${invRows.length} vehicles`);
  console.log(`  Lenders:   ${DEFAULT_LENDERS.length}`);
  console.log("══════════════════════════════════════════════");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
