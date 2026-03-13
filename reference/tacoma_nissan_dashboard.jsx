import { useState, useEffect, useCallback } from "react";

// ─── STATIC DATA ────────────────────────────────────────────────────────────
const SALESPEOPLE = [
  "NATE HARDING","OSSIE SAMPSON","TREVON HALL","RUFUS JOHNSON",
  "NICK WILEY","BRYAN ROGERS","MIKE LASHLEY","BRYANT ROGERS",
  "ABDUL AL TABBAH","JOSE TORRES","RJ JOHNSON JR","HALEY DELUDE",
  "MICHAEL GODWIN","HOUSE"
];
const LENDERS = [
  "BECU","KITSAP","HARBORSTONE","GESA","GLOBAL","ALLY","NMAC","CPS",
  "ICCU","WHATCOM","CASH","OTHER",
  "FIRST TEC EXP 09","TRULIANT EQUI VANTAGE","SHARONVIEW TRANS 08",
  "CINCH TRANS 08","AXOS EQUIFAX 08","PENN FED EQUI 08 NON AUTO",
  "US BANK EQUIFAX 09","EXETER EXP","ALLY EXP","SANT EXP",
  "MID AMER CU (9YR OLD MAX)"
];
const SOURCES = ["Flier","Walk In","Internet","Phone","Referral","Repeat"];
const SALE_INFO = {
  dealer: "TACOMA NISSAN", franchise: "NISSAN",
  address: "4030 S TACOMA WAY", city: "TACOMA", state: "WA", zip: "98409",
  startDate: "2026-03-09", endDate: "2026-03-17",
  doc: 599, tl: 200, salesTax: 0.104
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt$ = (n) => n == null || isNaN(n) ? "—" :
  "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtPct = (n) => n == null || isNaN(n) ? "—" : (n * 100).toFixed(1) + "%";
const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().split("T")[0];

// ─── STORAGE ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = "jde_tacoma_nissan_v1";
const defaultState = () => ({
  deals: [
    // ── DAY 1 ──────────────────────────────────────────────────────────────
    { id: uid(), dealNum:"001", store:"NISSAN", stock:"N260114C", customer:"CORDOVEZ",    zip:"98499", newUsed:"Used", date:"2026-03-09", year:"2024", make:"NISSAN",     model:"ROGUE",      cost:21650.42, age:7,   tradeYear:"2011", tradeMake:"SUBARU",   tradeModel:"OUTBACK",    tradeMiles:"188K",  acv:1200,  payoff:0,     trade2:"", salesperson:"BRYANT ROGERS", salesperson2:"HOUSE",        closer:"", frontGross:4149.58, lender:"BECU",        rate:7.24, reserve:900.94,  warranty:3060, aft1:364,  gap:778,  fiTotal:5102.94, totalGross:9252.52,  funded:false, notes:"" },
    { id: uid(), dealNum:"002", store:"NISSAN", stock:"N260066A", customer:"PARKER",      zip:"98499", newUsed:"Used", date:"2026-03-09", year:"2014", make:"FORD",       model:"F150",       cost:11157.94, age:35,  tradeYear:"",     tradeMake:"",         tradeModel:"",           tradeMiles:"",      acv:0,     payoff:0,     trade2:"", salesperson:"OSSIE SAMPSON",  salesperson2:"",             closer:"", frontGross:3791.06, lender:"KITSAP",      rate:6.39, reserve:283.95,  warranty:0,    aft1:870,  gap:0,    fiTotal:1153.95, totalGross:4945.01,  funded:false, notes:"" },
    { id: uid(), dealNum:"003", store:"NISSAN", stock:"N250555",  customer:"AMUIMUIA",    zip:"98409", newUsed:"New",  date:"2026-03-09", year:"2025", make:"NISSAN",     model:"PATHFINDER", cost:41389.56, age:98,  tradeYear:"2021", tradeMake:"CHEVY",    tradeModel:"MALIBU",     tradeMiles:"93519", acv:8000,  payoff:21251, trade2:"", salesperson:"HOUSE",          salesperson2:"",             closer:"", frontGross:0,       lender:"HARBORSTONE", rate:8.99, reserve:1236.54, warranty:6495, aft1:364,  gap:778,  fiTotal:8873.54, totalGross:8873.54,  funded:false, notes:"" },
    { id: uid(), dealNum:"004", store:"NISSAN", stock:"24359",    customer:"MCMILLIAM",   zip:"98405", newUsed:"Used", date:"2026-03-09", year:"2024", make:"HYUNDAI",    model:"TUCSON",     cost:21129.08, age:89,  tradeYear:"",     tradeMake:"",         tradeModel:"",           tradeMiles:"",      acv:0,     payoff:0,     trade2:"", salesperson:"MIKE LASHLEY",   salesperson2:"",             closer:"", frontGross:1872.92, lender:"GLOBAL",      rate:24.2, reserve:860,     warranty:1601, aft1:364,  gap:779,  fiTotal:3604,    totalGross:5476.92,  funded:false, notes:"" },
    { id: uid(), dealNum:"005", store:"NISSAN", stock:"N260211",  customer:"SANDERS",     zip:"98409", newUsed:"New",  date:"2026-03-09", year:"2026", make:"NISSAN",     model:"ROGUE",      cost:37659.56, age:11,  tradeYear:"2023", tradeMake:"KIA",      tradeModel:"SOUL",       tradeMiles:"50155", acv:12500, payoff:14018, trade2:"", salesperson:"MIKE LASHLEY",   salesperson2:"",             closer:"", frontGross:5357.44, lender:"HARBORSTONE", rate:8.99, reserve:1068.54, warranty:5859, aft1:364,  gap:778,  fiTotal:8069.54, totalGross:13426.98, funded:false, notes:"" },
    { id: uid(), dealNum:"006", store:"NISSAN", stock:"24402",    customer:"SANABIA",     zip:"98499", newUsed:"Used", date:"2026-03-09", year:"2023", make:"VW",         model:"TIGUAN",     cost:24656,    age:31,  tradeYear:"",     tradeMake:"",         tradeModel:"",           tradeMiles:"",      acv:0,     payoff:0,     trade2:"", salesperson:"HOUSE",          salesperson2:"",             closer:"", frontGross:2000,    lender:"CPS",         rate:20.3, reserve:2352.55, warranty:0,    aft1:0,    gap:0,    fiTotal:2352.55, totalGross:4352.55,  funded:false, notes:"" },
    { id: uid(), dealNum:"007", store:"CDJR",   stock:"RS124361", customer:"YONTEFF",     zip:"98409", newUsed:"Used", date:"2026-03-09", year:"2024", make:"RAM",        model:"1500",       cost:31332,    age:1,   tradeYear:"",     tradeMake:"",         tradeModel:"",           tradeMiles:"",      acv:0,     payoff:0,     trade2:"", salesperson:"TREVON HALL",    salesperson2:"",             closer:"", frontGross:5954,    lender:"KITSAP",      rate:7.86, reserve:1779.75, warranty:5999, aft1:364,  gap:578,  fiTotal:8720.75, totalGross:14674.75, funded:false, notes:"" },
    { id: uid(), dealNum:"008", store:"NISSAN", stock:"N260106A", customer:"ROSATO",      zip:"98408", newUsed:"Used", date:"2026-03-09", year:"2022", make:"NISSAN",     model:"PATHFINDER", cost:30897.45, age:33,  tradeYear:"2010", tradeMake:"TOYOTA",   tradeModel:"COROLLA",    tradeMiles:"239K",  acv:500,   payoff:0,     trade2:"", salesperson:"ABDUL AL TABBAH",salesperson2:"",             closer:"", frontGross:6042.55, lender:"KITSAP",      rate:9.45, reserve:1509.48, warranty:1150, aft1:0,    gap:573,  fiTotal:3232.48, totalGross:9275.03,  funded:false, notes:"" },
    // ── DAY 2 ──────────────────────────────────────────────────────────────
    { id: uid(), dealNum:"009", store:"NISSAN", stock:"24421A",   customer:"OWENS",       zip:"98409", newUsed:"Used", date:"2026-03-10", year:"2020", make:"NISSAN",     model:"ALTIMA",     cost:14007.87, age:2,   tradeYear:"",     tradeMake:"",         tradeModel:"",           tradeMiles:"",      acv:0,     payoff:0,     trade2:"", salesperson:"BRYANT ROGERS",  salesperson2:"",             closer:"", frontGross:3797.13, lender:"ALLY",        rate:18.84,reserve:2170.87, warranty:3135, aft1:0,    gap:578,  fiTotal:5883.87, totalGross:9681,     funded:false, notes:"" },
    { id: uid(), dealNum:"010", store:"NISSAN", stock:"24196",    customer:"MCKAY",       zip:"98499", newUsed:"Used", date:"2026-03-10", year:"2016", make:"TOYOTA",     model:"4RUNNER",    cost:40896.31, age:148, tradeYear:"2018", tradeMake:"CHEVY",    tradeModel:"IMPALA",     tradeMiles:"108K",  acv:10000, payoff:21538, trade2:"2011 WRANGLER 111K", salesperson:"NATE HARDING",   salesperson2:"JOSE TORRES",  closer:"", frontGross:2000,    lender:"GESA",        rate:6.79, reserve:1469.93, warranty:1850, aft1:364,  gap:1078, fiTotal:4761.93, totalGross:6761.93,  funded:false, notes:"0 FRONT END 3768.16 BACK" },
    { id: uid(), dealNum:"011", store:"NISSAN", stock:"N260028",  customer:"HARTFIELD",   zip:"98409", newUsed:"New",  date:"2026-03-10", year:"2026", make:"NISSAN",     model:"ROGUE",      cost:41157,    age:167, tradeYear:"2003", tradeMake:"INFINITI", tradeModel:"Q45",        tradeMiles:"184235",acv:500,   payoff:0,     trade2:"", salesperson:"OSSIE SAMPSON",  salesperson2:"",             closer:"", frontGross:0,       lender:"NMAC",        rate:"LS", reserve:2009.05, warranty:1995, aft1:0,    gap:0,    fiTotal:4004.05, totalGross:4004.05,  funded:false, notes:"" },
    { id: uid(), dealNum:"012", store:"NISSAN", stock:"24400",    customer:"PECH",        zip:"98409", newUsed:"Used", date:"2026-03-10", year:"2022", make:"NISSAN",     model:"ALTIMA",     cost:21167,    age:32,  tradeYear:"2015", tradeMake:"NISSAN",   tradeModel:"VERSA",      tradeMiles:"147413",acv:1000,  payoff:0,     trade2:"", salesperson:"NATE HARDING",   salesperson2:"JOSE TORRES",  closer:"", frontGross:5033,    lender:"GESA",        rate:6.24, reserve:1136.04, warranty:4015, aft1:0,    gap:1078, fiTotal:6229.04, totalGross:11262.04, funded:false, notes:"THANK YOU!!" },
    { id: uid(), dealNum:"013", store:"NISSAN", stock:"N260211A", customer:"KERCHEVAL",   zip:"98408", newUsed:"Used", date:"2026-03-10", year:"2023", make:"KIA",        model:"SOUL",       cost:14018,    age:1,   tradeYear:"",     tradeMake:"",         tradeModel:"",           tradeMiles:"",      acv:0,     payoff:0,     trade2:"", salesperson:"TREVON HALL",    salesperson2:"",             closer:"", frontGross:2188.58, lender:"CPS",         rate:26.65,reserve:1194.44, warranty:0,    aft1:0,    gap:607,  fiTotal:1801.44, totalGross:3990.02,  funded:false, notes:"" },
    { id: uid(), dealNum:"014", store:"CDJR",   stock:"PE012756", customer:"KETROW",      zip:"98409", newUsed:"Used", date:"2026-03-10", year:"2023", make:"HONDA",      model:"CIVIC",      cost:24713,    age:1,   tradeYear:"2015", tradeMake:"HONDA",    tradeModel:"CR-V",       tradeMiles:"92430", acv:12000, payoff:16922, trade2:"", salesperson:"HOUSE",          salesperson2:"",             closer:"", frontGross:2251,    lender:"KITSAP",      rate:7.58, reserve:731.85,  warranty:754,  aft1:364,  gap:0,    fiTotal:1849.85, totalGross:4100.85,  funded:false, notes:"" },
    { id: uid(), dealNum:"015", store:"NISSAN", stock:"N250442",  customer:"WARNER",      zip:"98499", newUsed:"New",  date:"2026-03-10", year:"2025", make:"NISSAN",     model:"VERSA",      cost:21796,    age:210, tradeYear:"2009", tradeMake:"NISSAN",   tradeModel:"ALTIMA",     tradeMiles:"100711",acv:1500,  payoff:0,     trade2:"", salesperson:"ABDUL AL TABBAH",salesperson2:"",             closer:"", frontGross:2361.44, lender:"GESA",        rate:5.99, reserve:1055.5,  warranty:4872, aft1:364,  gap:1078, fiTotal:7369.5,  totalGross:9730.94,  funded:false, notes:"" },
    // ── DAY 3 ──────────────────────────────────────────────────────────────
    { id: uid(), dealNum:"016", store:"NISSAN", stock:"N260153",  customer:"MROCZKOWSKI", zip:"98512", newUsed:"New",  date:"2026-03-11", year:"2026", make:"NISSAN",     model:"SENTRA",     cost:25477,    age:50,  tradeYear:"2020", tradeMake:"NISSAN",   tradeModel:"KICKS",      tradeMiles:"26288", acv:14000, payoff:12404, trade2:"", salesperson:"HOUSE",          salesperson2:"",             closer:"", frontGross:7098.9,  lender:"ICCU",        rate:13.4, reserve:566.46,  warranty:2624, aft1:0,    gap:573,  fiTotal:3763.46, totalGross:10862.36, funded:false, notes:"" },
    { id: uid(), dealNum:"017", store:"NISSAN", stock:"N260204",  customer:"SALCEDO",     zip:"98498", newUsed:"New",  date:"2026-03-11", year:"2026", make:"NISSAN",     model:"ROGUE",      cost:36299,    age:15,  tradeYear:"2012", tradeMake:"NISSAN",   tradeModel:"ROGUE",      tradeMiles:"115900",acv:2000,  payoff:0,     trade2:"2018 ELANTRA 17233", salesperson:"HOUSE",          salesperson2:"",             closer:"", frontGross:670.44,  lender:"CASH",        rate:0,    reserve:0,       warranty:886,  aft1:0,    gap:0,    fiTotal:886,     totalGross:1556.44,  funded:false, notes:"" },
    { id: uid(), dealNum:"018", store:"NISSAN", stock:"24196A",   customer:"BUSHNELL",    zip:"98499", newUsed:"Used", date:"2026-03-11", year:"2018", make:"CHEVROLET",  model:"IMPALA",     cost:11267,    age:1,   tradeYear:"",     tradeMake:"",         tradeModel:"",           tradeMiles:"",      acv:0,     payoff:0,     trade2:"", salesperson:"OSSIE SAMPSON",  salesperson2:"",             closer:"", frontGross:5278.62, lender:"GESA",        rate:6.99, reserve:734.37,  warranty:2745, aft1:364,  gap:1102, fiTotal:4945.37, totalGross:10223.99, funded:false, notes:"" },
    { id: uid(), dealNum:"019", store:"NISSAN", stock:"N260222",  customer:"CABALSI",     zip:"98409", newUsed:"New",  date:"2026-03-11", year:"2026", make:"NISSAN",     model:"ROGUE",      cost:36442,    age:7,   tradeYear:"2017", tradeMake:"NISSAN",   tradeModel:"ROGUE",      tradeMiles:"115701",acv:5500,  payoff:0,     trade2:"", salesperson:"MICHAEL GODWIN", salesperson2:"",             closer:"", frontGross:5884.44, lender:"GESA",        rate:6.24, reserve:1216.6,  warranty:0,    aft1:364,  gap:1078, fiTotal:2658.6,  totalGross:8543.04,  funded:false, notes:"" },
    { id: uid(), dealNum:"020", store:"NISSAN", stock:"N250442A", customer:"CARTER",      zip:"98498", newUsed:"Used", date:"2026-03-11", year:"2009", make:"NISSAN",     model:"ALTIMA",     cost:2467,     age:1,   tradeYear:"",     tradeMake:"",         tradeModel:"",           tradeMiles:"",      acv:0,     payoff:0,     trade2:"", salesperson:"OSSIE SAMPSON",  salesperson2:"",             closer:"", frontGross:4482.59, lender:"GESA",        rate:7.24, reserve:260.85,  warranty:1311, aft1:364,  gap:0,    fiTotal:1935.85, totalGross:6418.44,  funded:false, notes:"" },
    { id: uid(), dealNum:"021", store:"NISSAN", stock:"N260067B", customer:"NIXON",       zip:"98499", newUsed:"Used", date:"2026-03-11", year:"2018", make:"NISSAN",     model:"SENTRA",     cost:4274.17,  age:10,  tradeYear:"",     tradeMake:"",         tradeModel:"",           tradeMiles:"",      acv:0,     payoff:0,     trade2:"", salesperson:"BRYANT ROGERS",  salesperson2:"",             closer:"", frontGross:5160.04, lender:"GESA",        rate:5.25, reserve:650.14,  warranty:4945, aft1:364,  gap:1107, fiTotal:7066.14, totalGross:12226.18, funded:false, notes:"" },
    { id: uid(), dealNum:"022", store:"NISSAN", stock:"N250555A", customer:"LINDAHL",     zip:"98405", newUsed:"Used", date:"2026-03-11", year:"2021", make:"CHEVROLET",  model:"MALIBU",     cost:9349,     age:2,   tradeYear:"",     tradeMake:"",         tradeModel:"",           tradeMiles:"",      acv:0,     payoff:0,     trade2:"", salesperson:"NICK WILEY",     salesperson2:"",             closer:"", frontGross:10540.76,lender:"KITSAP",      rate:7.04, reserve:666,     warranty:4965, aft1:0,    gap:578,  fiTotal:6209,    totalGross:16749.76, funded:false, notes:"" },
    { id: uid(), dealNum:"023", store:"NISSAN", stock:"24403",    customer:"GONIA",       zip:"98405", newUsed:"Used", date:"2026-03-11", year:"2023", make:"KIA",        model:"FORTE",      cost:17582,    age:33,  tradeYear:"",     tradeMake:"",         tradeModel:"",           tradeMiles:"",      acv:0,     payoff:0,     trade2:"", salesperson:"HOUSE",          salesperson2:"",             closer:"", frontGross:1935.25, lender:"KITSAP",      rate:8.04, reserve:899.01,  warranty:3415, aft1:0,    gap:0,    fiTotal:4314.01, totalGross:6249.26,  funded:false, notes:"2K FLAT FRONT" },
    { id: uid(), dealNum:"024", store:"NISSAN", stock:"24406",    customer:"BROOKS",      zip:"98405", newUsed:"Used", date:"2026-03-11", year:"2021", make:"SUBARU",     model:"CROSSTREK",  cost:22026,    age:29,  tradeYear:"2003", tradeMake:"OLDS",     tradeModel:"ALERO",      tradeMiles:"101079",acv:500,   payoff:0,     trade2:"", salesperson:"BRYAN ROGERS",   salesperson2:"",             closer:"", frontGross:6293.81, lender:"WHATCOM",     rate:8.74, reserve:779.3,   warranty:0,    aft1:364,  gap:828,  fiTotal:1971.3,  totalGross:8265.11,  funded:false, notes:"" },
    { id: uid(), dealNum:"025", store:"NISSAN", stock:"N250570A", customer:"EDENFIELD",   zip:"98499", newUsed:"Used", date:"2026-03-11", year:"2022", make:"NISSAN",     model:"PATHFINDER", cost:28040,    age:2,   tradeYear:"",     tradeMake:"",         tradeModel:"",           tradeMiles:"",      acv:0,     payoff:0,     trade2:"", salesperson:"NATE HARDING",   salesperson2:"JOSE TORRES",  closer:"", frontGross:6851,    lender:"ICCU",        rate:6.99, reserve:2160.27, warranty:2652, aft1:364,  gap:778,  fiTotal:5954.27, totalGross:12805.27, funded:false, notes:"NOT SURE WHERE WE ARE OFF" },
  ],
  mailTracking: {
    totalPieces: 90036,
    drops: [],
    responses: {
      "98443_Day 1": 5,  "98443_Day 2": 7,  "98443_Day 3": 5,
      "98499_Day 1": 102,"98499_Day 2": 54, "98499_Day 3": 21,
      "98408_Day 1": 46, "98408_Day 2": 33, "98408_Day 3": 11,
      "98409_Day 1": 78, "98409_Day 2": 34, "98409_Day 3": 25,
      "98405_Day 1": 68, "98405_Day 2": 26, "98405_Day 3": 24,
      "98418_Day 2": 7,  "98418_Day 3": 12,
      "98466_Day 2": 1,  "98466_Day 3": 8,
      "98444_Day 3": 17,
      "98465_Day 3": 1,
      "98467_Day 3": 3,
    },
  },
  plateLogs: [],
  upCounts: {},
  saleDay: 1,
  currentDay: today(),

  inventory: [],
  inventoryLocations: ["On-Site"],
  recapConfig: {
    jdePct:      25,
    mktCost:     "",
    miscExpenses: "",
  },
  salespeople: [
    { id: uid(), name: "NATE HARDING",        number: "", email: "", confirmed: false, notes: "" },
    { id: uid(), name: "OSSIE SAMPSON",       number: "", email: "", confirmed: false, notes: "" },
    { id: uid(), name: "TREVON HALL",         number: "", email: "", confirmed: false, notes: "" },
    { id: uid(), name: "RUFUS JOHNSON",       number: "", email: "", confirmed: false, notes: "" },
    { id: uid(), name: "NICK WILEY",          number: "", email: "", confirmed: false, notes: "" },
    { id: uid(), name: "BRYAN ROGERS",        number: "", email: "", confirmed: false, notes: "" },
    { id: uid(), name: "MIKE LASHLEY",        number: "", email: "", confirmed: false, notes: "" },
    { id: uid(), name: "BRYANT ROGERS",       number: "", email: "", confirmed: false, notes: "" },
    { id: uid(), name: "ABDUL AL TABBAH",     number: "", email: "", confirmed: false, notes: "" },
    { id: uid(), name: "JOSE TORRES",         number: "", email: "", confirmed: false, notes: "" },
    { id: uid(), name: "RJ JOHNSON JR",       number: "", email: "", confirmed: false, notes: "" },
    { id: uid(), name: "HALEY DELUDE",        number: "", email: "", confirmed: false, notes: "" },
    { id: uid(), name: "MICHAEL GODWIN",      number: "", email: "", confirmed: false, notes: "" },
    { id: uid(), name: "IGOR PLETNOR",        number: "", email: "", confirmed: false, notes: "" },
    { id: uid(), name: "MAYCON MIKE GUIMARAES", number: "", email: "", confirmed: false, notes: "" },
    { id: uid(), name: "IRELAND COMBS",       number: "", email: "", confirmed: false, notes: "" },
    { id: uid(), name: "MAKOTO \"TOKYO\" MACHO", number: "", email: "", confirmed: false, notes: "" },
    { id: uid(), name: "ANDREW ODEI",         number: "", email: "", confirmed: false, notes: "" },
    { id: uid(), name: "CHRIS MARTIN",        number: "", email: "", confirmed: false, notes: "" },
    { id: uid(), name: "HOUSE",               number: "", email: "", confirmed: false, notes: "" },
  ],
  managers: [
    { id: uid(), name: "MIKE BRIERS",         number: "", email: "", confirmed: false, commPct: "" },
    { id: uid(), name: "MIKE BARR",           number: "", email: "", confirmed: false, commPct: "" },
    { id: uid(), name: "STEVEN KUYKENDALL",   number: "", email: "", confirmed: false, commPct: "" },
    { id: uid(), name: "NATE LABRECQUE",      number: "", email: "", confirmed: false, commPct: "" },
    { id: uid(), name: "DANETTE LABRECQUE",   number: "", email: "", confirmed: false, commPct: "" },
  ],
  teamLeader: { name: "NATE LABRECQUE", number: "", email: "", commPct: "" },
  dealerInfo: {
    dealerName: "TACOMA NISSAN",
    street: "4030 S TACOMA WAY",
    city: "TACOMA",
    state: "WA",
    zip: "98409",
    startDate: "2026-03-09",
    endDate: "2026-03-17",
  },
  marketingInfo: {
    mailPieceType: "",
    mailPieceQty: "",
    drop1: "",
    drop2: "",
    drop3: "",
    giveawayPremium: "",
    giveaway2: "",
  },
  companyPacks: {
    packNew:     "",
    packUsed:    "",
    packCompany: "",
  },
  lenders: [
    { id: uid(), name: "BECU",                        note: "" },
    { id: uid(), name: "KITSAP",                      note: "" },
    { id: uid(), name: "HARBORSTONE",                 note: "" },
    { id: uid(), name: "GESA",                        note: "" },
    { id: uid(), name: "GLOBAL",                      note: "" },
    { id: uid(), name: "ALLY",                        note: "" },
    { id: uid(), name: "NMAC",                        note: "" },
    { id: uid(), name: "CPS",                         note: "" },
    { id: uid(), name: "ICCU",                        note: "" },
    { id: uid(), name: "WHATCOM",                     note: "" },
    { id: uid(), name: "CASH",                        note: "" },
    { id: uid(), name: "OTHER",                       note: "" },
    { id: uid(), name: "FIRST TEC EXP 09",            note: "" },
    { id: uid(), name: "TRULIANT EQUI VANTAGE",       note: "" },
    { id: uid(), name: "SHARONVIEW TRANS 08",         note: "" },
    { id: uid(), name: "CINCH TRANS 08",              note: "" },
    { id: uid(), name: "AXOS EQUIFAX 08",             note: "" },
    { id: uid(), name: "PENN FED EQUI 08 NON AUTO",   note: "" },
    { id: uid(), name: "US BANK EQUIFAX 09",          note: "" },
    { id: uid(), name: "EXETER EXP",                  note: "" },
    { id: uid(), name: "ALLY EXP",                    note: "" },
    { id: uid(), name: "SANT EXP",                    note: "" },
    { id: uid(), name: "MID AMER CU (9YR OLD MAX)",   note: "" },
  ],
  credentials: [
    { id: uid(), type: "DMS", username: "", password: "", email: "", challengeQ: "", challengeA: "" },
  ],
});

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultState(), ...JSON.parse(raw) };
  } catch (e) {}
  return defaultState();
}
function saveState(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) {}
}

// ─── TABS ────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "roster",      label: "👥 Roster & Tables" },
  { id: "inventory",   label: "🚗 Inventory" },
  { id: "deallog",     label: "📋 Deal Log" },
  { id: "washout",     label: "💰 Washout" },
  { id: "mail",        label: "📬 Mail Tracking" },
  { id: "recap",       label: "📊 Event Recap" },
  { id: "performance", label: "🏆 Performance" },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [state, setState]       = useState(loadState);
  const [tab, setTab]           = useState("recap");
  const [flash, setFlash]       = useState(null);
  const [importModal, setImportModal] = useState(false);
  const [importing, setImporting]     = useState(false);

  useEffect(() => { saveState(state); }, [state]);

  const update = useCallback((patch) =>
    setState(prev => ({ ...prev, ...patch })), []);

  const showFlash = (msg, type = "success") => {
    setFlash({ msg, type });
    setTimeout(() => setFlash(null), 2400);
  };

  // ── SheetJS importer ──────────────────────────────────────────────────────
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    try {
      // Load SheetJS via script tag if not already loaded
      if (!window.XLSX) {
        await new Promise((resolve, reject) => {
          const existing = document.getElementById("sheetjs-cdn");
          if (existing) { resolve(); return; }
          const s = document.createElement("script");
          s.id  = "sheetjs-cdn";
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
          s.onload  = resolve;
          s.onerror = () => reject(new Error("Failed to load SheetJS from CDN"));
          document.head.appendChild(s);
        });
      }
      const XLSX = window.XLSX;
      const buf  = await file.arrayBuffer();
      const wb   = XLSX.read(new Uint8Array(buf), { type: "array", cellDates: true });

      const getSheet = (name) => {
        const key = wb.SheetNames.find(n => n.toLowerCase().replace(/[^a-z]/g,"").includes(name));
        return key ? XLSX.utils.sheet_to_json(wb.Sheets[key], { header: 1, defval: "" }) : [];
      };

      // ── Parse helpers
      const str  = (v) => (v == null ? "" : String(v).trim());
      const num  = (v) => { const n = parseFloat(str(v).replace(/[$,]/g,"")); return isNaN(n) ? 0 : n; };
      const bool = (v) => str(v).toUpperCase() === "Y";
      const fmtDate = (v) => {
        if (!v) return "";
        if (v instanceof Date) return v.toISOString().split("T")[0];
        const s = str(v);
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
        const d = new Date(s); return isNaN(d) ? s : d.toISOString().split("T")[0];
      };

      // ── ROSTER sheet ──────────────────────────────────────────────────────
      const rRows = getSheet("roster");
      const newSP = [], newMgr = [];
      let newTL = state.teamLeader, newDealer = state.dealerInfo;
      let newMkt = state.marketingInfo, newPacks = state.companyPacks;
      const newLenders = [];

      let section = "";
      for (const row of rRows) {
        // Scan ALL cells in the row for a section title (handles merged cells read as first col)
        const rowText = row.map(v => str(v).toUpperCase()).join(" ");
        const b = str(row[1]), c = str(row[2]), d = str(row[3]), e = str(row[4]);

        // Section switches — check full row text so emoji-prefixed merged headers are caught
        if (rowText.includes("SALESPEOPLE") || rowText.includes("SALESPERSON")) { section = "sp";     continue; }
        if (rowText.includes("TEAM LEADER"))                                     { section = "tl";     continue; }
        if (rowText.includes("MANAGER") && !rowText.includes("TEAM"))            { section = "mgr";    continue; }
        if (rowText.includes("DEALER INFO") || rowText.includes("DEALER INFORMATION")) { section = "dealer"; continue; }
        if (rowText.includes("MARKETING INFORMATION") || rowText.includes("MARKETING INFO")) { section = "mkt"; continue; }
        if (rowText.includes("COMPANY PACK"))                                    { section = "packs";  continue; }
        if (rowText.includes("LENDER") && !rowText.includes("MONEY"))           { section = "lenders"; continue; }

        // Skip column header rows and completely blank rows
        const bU = b.toUpperCase(), cU = c.toUpperCase();
        if (!b && !c) continue;
        if (["#","NAME","DROP","LENDER NAME","PHONE","EMAIL"].includes(bU)) continue;
        if (["#","NAME","PHONE","EMAIL"].includes(cU)) continue;
        // Skip rows where col B is a pure number (row index column)
        if (/^\d+$/.test(b.trim())) continue;

        if (section === "sp"  && (b || c)) {
          const name = c || b;
          if (name && !["#","NAME"].includes(name.toUpperCase()))
            newSP.push({ id: uid(), name: str(name), number: str(d), email: str(e), confirmed: bool(str(row[5])), notes: str(row[6]) });
        }
        if (section === "mgr" && (b || c)) {
          const name = c || b;
          if (name && !["#","NAME"].includes(name.toUpperCase()))
            newMgr.push({ id: uid(), name: str(name), number: str(d), email: str(e), confirmed: bool(str(row[5])), commPct: str(row[6]) });
        }
        if (section === "tl" && (b || c) && !["NAME","#"].includes(b.toUpperCase())) {
          newTL = { name: str(c||b), number: str(d), email: str(e), commPct: str(row[5]) };
        }
        if (section === "dealer" && b && c) {
          const bL = b.toLowerCase();
          if (bL.includes("dealer name"))  newDealer = { ...newDealer, dealerName: str(c) };
          if (bL.includes("street"))       newDealer = { ...newDealer, street: str(c) };
          if (bL.includes("city"))         newDealer = { ...newDealer, city: str(c) };
          if (bL.includes("state"))        newDealer = { ...newDealer, state: str(c) };
          if (bL.includes("zip"))          newDealer = { ...newDealer, zip: str(c) };
          if (bL.includes("start"))        newDealer = { ...newDealer, startDate: fmtDate(c) };
          if (bL.includes("end"))          newDealer = { ...newDealer, endDate: fmtDate(c) };
        }
        if (section === "mkt" && b && c) {
          const bL = b.toLowerCase();
          if (bL.includes("type"))        newMkt = { ...newMkt, mailPieceType: str(c) };
          if (bL.includes("quantity") || bL.includes("qty")) newMkt = { ...newMkt, mailPieceQty: str(c) };
          if (bL.includes("drop 1"))      newMkt = { ...newMkt, drop1: fmtDate(c) };
          if (bL.includes("drop 2"))      newMkt = { ...newMkt, drop2: fmtDate(c) };
          if (bL.includes("drop 3"))      newMkt = { ...newMkt, drop3: fmtDate(c) };
          if (bL.includes("2nd give"))    newMkt = { ...newMkt, giveaway2: str(c) };
          else if (bL.includes("give"))   newMkt = { ...newMkt, giveawayPremium: str(c) };
        }
        if (section === "packs" && b && c) {
          const bL = b.toLowerCase();
          if (bL.includes("new"))     newPacks = { ...newPacks, packNew: str(c) };
          if (bL.includes("used"))    newPacks = { ...newPacks, packUsed: str(c) };
          if (bL.includes("company")) newPacks = { ...newPacks, packCompany: str(c) };
        }
        if (section === "lenders" && (b || c)) {
          const name = c || b;
          if (name && !["#","LENDER NAME","NAME"].includes(name.toUpperCase()))
            newLenders.push({ id: uid(), name: str(name), note: str(d) });
        }
      }

      // ── INVENTORY sheet ───────────────────────────────────────────────────
      const iRows = getSheet("inventory");
      const newInventory = [];
      let iHeaderRow = -1;
      for (let i = 0; i < Math.min(5, iRows.length); i++) {
        if (iRows[i].some(c => str(c).toUpperCase().includes("STOCK"))) { iHeaderRow = i; break; }
      }
      if (iHeaderRow >= 0) {
        const iHdr = iRows[iHeaderRow].map(c => str(c).toLowerCase());
        const iCol = (name) => iHdr.findIndex(h => h.includes(name));
        const cols = {
          hat: iCol("hat"), notes: iCol("note"), location: iCol("location"),
          stock: iCol("stock"), year: iCol("year"), make: iCol("make"),
          model: iCol("model"), cls: iCol("class"), color: iCol("color"),
          odo: iCol("odom"), vin: iCol("vin"), trim: iCol("trim"), age: iCol("age"),
          dt: iCol("drive"), trade: iCol("kbb trade"), retail: iCol("kbb retail"),
          cost: iCol("cost"),
        };
        for (const row of iRows.slice(iHeaderRow + 1)) {
          const stockVal = str(row[cols.stock]);
          if (!stockVal) continue;
          newInventory.push({
            id: uid(),
            hat: str(row[cols.hat]),     notes: str(row[cols.notes]),
            location: str(row[cols.location]) || "On-Site",
            stock: stockVal,             year: str(row[cols.year]),
            make: str(row[cols.make]),   model: str(row[cols.model]),
            cls: str(row[cols.cls]),     color: str(row[cols.color]),
            odometer: str(row[cols.odo]),vin: str(row[cols.vin]),
            trim: str(row[cols.trim]),   age: str(row[cols.age]),
            drivetrain: str(row[cols.dt]),
            kbbTrade: num(row[cols.trade]),
            kbbRetail: num(row[cols.retail]),
            cost: num(row[cols.cost]),
          });
        }
      }

      // ── DEAL LOG sheet ────────────────────────────────────────────────────
      const dRows = getSheet("deal");
      const newDeals = [];
      let dHeaderRow = -1;
      for (let i = 0; i < Math.min(6, dRows.length); i++) {
        if (dRows[i].some(c => str(c).toLowerCase().includes("stock"))) { dHeaderRow = i; break; }
      }
      if (dHeaderRow >= 0) {
        const dHdr = dRows[dHeaderRow].map(c => str(c).toLowerCase().replace(/\s+/g," "));
        const dCol = (name) => dHdr.findIndex(h => h.includes(name));
        const cols = {
          dealNum: dCol("deal"), date: dCol("date"), store: dCol("store"),
          stock: dCol("stock"), customer: dCol("customer"), zip: dCol("zip"),
          nu: dCol("new"), year: dCol("year"), make: dCol("make"), model: dCol("model"),
          cost: dCol("cost"), age: dCol("age"),
          tYear: dCol("trade year"), tMake: dCol("trade make"), tModel: dCol("trade model"),
          tMiles: dCol("trade miles"), acv: dCol("acv"), payoff: dCol("payoff"), trade2: dCol("2nd trade"),
          sp: dCol("salesperson"), sp2: dCol("2nd sales"), closer: dCol("closer"),
          front: dCol("front"), lender: dCol("lender"), rate: dCol("rate"),
          reserve: dCol("reserve"), warranty: dCol("warranty"), aft1: dCol("aft"),
          gap: dCol("gap"), funded: dCol("funded"), notes: dCol("notes"),
        };
        for (const row of dRows.slice(dHeaderRow + 1)) {
          const stockVal = str(row[cols.stock]);
          const custVal  = str(row[cols.customer]);
          if (!stockVal && !custVal) continue;
          const frontG = num(row[cols.front]);
          const res    = num(row[cols.reserve]);
          const warr   = num(row[cols.warranty]);
          const aft1   = num(row[cols.aft1]);
          const gap    = num(row[cols.gap]);
          const fiTot  = res + warr + aft1 + gap;
          newDeals.push({
            id: uid(),
            dealNum:     str(row[cols.dealNum]),
            date:        fmtDate(row[cols.date]),
            store:       str(row[cols.store]),
            stock:       stockVal,
            customer:    custVal,
            zip:         str(row[cols.zip]),
            newUsed:     str(row[cols.nu]),
            year:        str(row[cols.year]),
            make:        str(row[cols.make]),
            model:       str(row[cols.model]),
            cost:        num(row[cols.cost]),
            age:         num(row[cols.age]),
            tradeYear:   str(row[cols.tYear]),
            tradeMake:   str(row[cols.tMake]),
            tradeModel:  str(row[cols.tModel]),
            tradeMiles:  str(row[cols.tMiles]),
            acv:         num(row[cols.acv]),
            payoff:      num(row[cols.payoff]),
            trade2:      str(row[cols.trade2]),
            salesperson: str(row[cols.sp]),
            salesperson2:str(row[cols.sp2]),
            closer:      str(row[cols.closer]),
            frontGross:  frontG,
            lender:      str(row[cols.lender]),
            rate:        str(row[cols.rate]),
            reserve:     res, warranty: warr, aft1: aft1, gap: gap,
            fiTotal:     fiTot,
            totalGross:  frontG + fiTot,
            funded:      bool(row[cols.funded]),
            notes:       str(row[cols.notes]),
          });
        }
      }

      // ── MAIL TRACKING sheet ───────────────────────────────────────────────
      const mRows = getSheet("mail");
      const newResponses = {};
      let mHdrRow = -1;
      for (let i = 0; i < Math.min(5, mRows.length); i++) {
        if (mRows[i].some(c => str(c).toLowerCase().includes("zip"))) { mHdrRow = i; break; }
      }
      if (mHdrRow >= 0) {
        const mHdr = mRows[mHdrRow].map(c => str(c));
        const dayMap = {};
        mHdr.forEach((h, ci) => {
          const m = h.toUpperCase().match(/DAY\s*(\d+)/);
          if (m) dayMap[ci] = `Day ${m[1]}`;
        });
        const zipCol = mHdr.findIndex(h => h.toLowerCase().includes("zip"));
        for (const row of mRows.slice(mHdrRow + 1)) {
          const zip = str(row[zipCol]);
          if (!zip || isNaN(Number(zip))) continue;
          Object.entries(dayMap).forEach(([ci, dayLabel]) => {
            const val = num(row[Number(ci)]);
            if (val > 0) newResponses[`${zip}_${dayLabel}`] = val;
          });
        }
      }

      // ── Apply to state ────────────────────────────────────────────────────
      const patch = {};
      if (newSP.length)        patch.salespeople = newSP;
      if (newMgr.length)       patch.managers    = newMgr;
      if (newTL.name)          patch.teamLeader  = newTL;
      if (newDealer.dealerName)patch.dealerInfo  = newDealer;
      if (newMkt.mailPieceType)patch.marketingInfo = newMkt;
      patch.companyPacks = newPacks;
      if (newLenders.length)   patch.lenders     = newLenders;
      if (newInventory.length) patch.inventory   = newInventory;
      if (newDeals.length)     patch.deals       = newDeals;
      if (Object.keys(newResponses).length)
        patch.mailTracking = { ...state.mailTracking, responses: newResponses };

      update(patch);
      setImportModal(false);
      showFlash(`✅ Imported: ${newDeals.length} deals · ${newInventory.length} vehicles · ${newSP.length} reps`);
    } catch (err) {
      console.error("Import error:", err);
      showFlash(`Import failed: ${err.message}`, "error");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  // Derived metrics
  const deals       = state.deals || [];
  const rc          = state.recapConfig || { jdePct: 25, mktCost: "", miscExpenses: "" };
  const companyPacks = state.companyPacks || { packNew: "", packUsed: "", packCompany: "" };
  const totalDeals  = deals.length;
  const newDeals    = deals.filter(d => d.newUsed === "New").length;
  const usedDeals   = deals.filter(d => d.newUsed === "Used").length;
  const totalFront  = deals.reduce((a, d) => a + (Number(d.frontGross) || 0), 0);
  const totalBack   = deals.reduce((a, d) => a + (Number(d.fiTotal)    || 0), 0);
  const totalGross  = totalFront + totalBack;
  const jdePct      = (parseFloat(rc.jdePct) || 25) / 100;
  const jdeComm     = totalGross * jdePct;
  const mktCost     = parseFloat(rc.mktCost)     || 0;
  const miscExp     = parseFloat(rc.miscExpenses) || 0;
  // Non-comm gross = total deals × company pack (New or Used per deal, averaged via pack applied)
  const nonCommGross = deals.reduce((a, d) => {
    const pack = d.newUsed === "New"
      ? (parseFloat(companyPacks.packNew) || 0)
      : (parseFloat(companyPacks.packUsed) || 0);
    return a + pack;
  }, 0);
  // Reps commissions = sum of all sp commissions from washout logic
  const spRoster    = state.salespeople || [];
  const repsComm    = deals.reduce((a, d) => {
    const hasSplit  = !!(d.salesperson2 && d.salesperson2 !== d.salesperson);
    const commPct   = hasSplit ? 0.125 : 0.25;
    const front     = parseFloat(d.frontGross) || 0;
    // pack for primary sp
    const pack1 = d.newUsed === "New"
      ? (parseFloat(companyPacks.packNew) || 0)
      : (parseFloat(companyPacks.packUsed) || 0);
    const comm1 = Math.max(front - pack1, 0) * commPct;
    // if split, 2nd sp gets same
    const comm2 = hasSplit ? Math.max(front - pack1, 0) * commPct : 0;
    return a + comm1 + comm2;
  }, 0);
  const varNet      = totalGross - jdeComm - mktCost + nonCommGross;
  const totalNet    = varNet - repsComm - miscExp;
  const frontPVR    = totalDeals ? totalFront / totalDeals : 0;
  const backPVR     = totalDeals ? totalBack  / totalDeals : 0;
  const totalPVR    = totalDeals ? totalGross / totalDeals : 0;

  const di = state.dealerInfo || {};

  return (
    <div style={styles.root}>
      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logo}>JDE</span>
          <div>
            <div style={styles.dealerName}>{di.dealerName || SALE_INFO.dealer}</div>
            <div style={styles.dealerSub}>
              {SALE_INFO.franchise} · {di.city || SALE_INFO.city}, {di.state || SALE_INFO.state} · {di.startDate || SALE_INFO.startDate} – {di.endDate || SALE_INFO.endDate}
            </div>
          </div>
        </div>
        <div style={styles.headerStats}>
          <StatPill label="DEALS"   value={totalDeals}                              color="#22d3ee" />
          <StatPill label="GROSS"   value={fmt$(totalGross)}                        color="#34d399" />
          <StatPill label="JDE COM" value={fmt$(jdeComm)}                           color="#a78bfa" />
          <StatPill label="NET"     value={fmt$(totalNet)} color={totalNet >= 0 ? "#34d399" : "#f87171"} />
        </div>
      </header>

      {/* FLASH */}
      {flash && (
        <div style={{ ...styles.flash, background: flash.type === "success" ? "#065f46" : "#7f1d1d" }}>
          {flash.msg}
        </div>
      )}

      {/* NAV */}
      <nav style={{ ...styles.nav, justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ ...styles.navBtn, ...(tab === t.id ? styles.navBtnActive : {}) }}>
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setImportModal(true)}
          style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid #22d3ee",
            background: "transparent", color: "#22d3ee", fontSize: 12, fontWeight: 700,
            cursor: "pointer", whiteSpace: "nowrap", letterSpacing: 0.5,
            fontFamily: "inherit", marginLeft: 12 }}>
          📥 Import Spreadsheet
        </button>
      </nav>

      {/* IMPORT MODAL */}
      {importModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12,
            padding: 32, width: 440, maxWidth: "90vw" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#22d3ee", marginBottom: 6 }}>
              📥 Import Spreadsheet
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 20, lineHeight: 1.6 }}>
              Upload the <strong style={{ color: "#e2e8f0" }}>JDE Import Template</strong> (.xlsx) to load
              roster, inventory, deal log, and mail tracking data into the dashboard.
              <br /><br />
              <span style={{ color: "#f87171" }}>⚠ This will replace existing data in each section that has content in the file.</span>
            </div>
            <div style={{ background: "#1e293b", borderRadius: 8, padding: "14px 16px",
              marginBottom: 20, fontSize: 12, color: "#64748b", lineHeight: 1.8 }}>
              <div style={{ color: "#7dd3fc", fontWeight: 700, marginBottom: 6 }}>SHEET MAPPING</div>
              <div>👥 <strong style={{color:"#e2e8f0"}}>Roster</strong> → Salespeople, Managers, Dealer Info, Packs, Lenders</div>
              <div>🚗 <strong style={{color:"#e2e8f0"}}>Inventory</strong> → Vehicle list</div>
              <div>📋 <strong style={{color:"#e2e8f0"}}>Deal Log</strong> → All deals</div>
              <div>📬 <strong style={{color:"#e2e8f0"}}>Mail Tracking</strong> → ZIP response counts</div>
            </div>
            {importing ? (
              <div style={{ textAlign: "center", color: "#22d3ee", padding: "12px 0" }}>
                ⏳ Parsing file…
              </div>
            ) : (
              <label style={{ display: "block", padding: "11px 0", textAlign: "center",
                background: "#1e3a5f", border: "2px dashed #22d3ee", borderRadius: 8,
                cursor: "pointer", color: "#22d3ee", fontWeight: 700, fontSize: 13 }}>
                📂 Choose .xlsx File
                <input type="file" accept=".xlsx,.xls" onChange={handleImport}
                  style={{ display: "none" }} />
              </label>
            )}
            <button onClick={() => setImportModal(false)}
              style={{ marginTop: 14, width: "100%", padding: "9px 0", borderRadius: 7,
                border: "1px solid #334155", background: "transparent", color: "#64748b",
                cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* CONTENT */}
      <main style={styles.main}>
        {tab === "recap"    && <RecapTab state={state} update={update} metrics={{ totalDeals, newDeals, usedDeals, totalFront, totalBack, totalGross, jdeComm, mktCost, miscExp, nonCommGross, repsComm, varNet, totalNet, frontPVR, backPVR, totalPVR }} />}
        {tab === "deallog"  && <DealLogTab state={state} update={update} showFlash={showFlash} />}
        {tab === "performance" && <PerformanceTab deals={deals} />}
        {tab === "mail"     && <MailTab state={state} update={update} showFlash={showFlash} />}
        {tab === "plate"    && <PlateTab state={state} update={update} showFlash={showFlash} />}
        {tab === "inventory" && <InventoryTab state={state} update={update} showFlash={showFlash} />}
        {tab === "washout"   && <WashoutTab state={state} />}
        {tab === "roster"    && <RosterTab state={state} update={update} showFlash={showFlash} />}
      </main>
    </div>
  );
}

// ─── STAT PILL ──────────────────────────────────────────────────────────────
function StatPill({ label, value, color }) {
  return (
    <div style={styles.pill}>
      <div style={{ ...styles.pillVal, color }}>{value}</div>
      <div style={styles.pillLabel}>{label}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// RECAP TAB
// ═══════════════════════════════════════════════════════════════════════════
const RECAP_STYLES = {
  page:      { display: "flex", flexDirection: "column", gap: 16 },
  grid:      { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px,1fr))", gap: 16 },
  card:      { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: 20 },
  cardTitle: { fontSize: 13, fontWeight: 800, color: "#22d3ee", letterSpacing: 1, marginBottom: 16, textTransform: "uppercase" },
  row:       { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #1e293b" },
  lbl:       { color: "#94a3b8", fontSize: 13 },
  val:       { fontWeight: 700, fontSize: 15 },
  divider:   { height: 1, background: "#1e3a5f", margin: "10px 0" },
  inputRow:  { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #1e293b", gap: 12 },
  inp:       { padding: "5px 9px", borderRadius: 6, border: "1px solid #334155", background: "#1e293b", color: "#e2e8f0", fontSize: 14, fontFamily: "'IBM Plex Mono','Fira Code','Courier New',monospace", width: 110, textAlign: "right", boxSizing: "border-box" },
  totalRow:  { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0 4px", marginTop: 4 },
  totalLbl:  { color: "#e2e8f0", fontSize: 14, fontWeight: 800, letterSpacing: 0.5 },
  unitGrid:  { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 14 },
  unitBox:   { background: "#1e293b", borderRadius: 8, padding: "10px 0", textAlign: "center" },
  unitVal:   { fontSize: 22, fontWeight: 800 },
  unitLbl:   { fontSize: 10, color: "#64748b", letterSpacing: 1, textTransform: "uppercase", marginTop: 2 },
};

function RecapRow({ label, value, color = "#e2e8f0", sublabel }) {
  return (
    <div style={RECAP_STYLES.row}>
      <div>
        <span style={RECAP_STYLES.lbl}>{label}</span>
        {sublabel && <span style={{ fontSize: 11, color: "#475569", marginLeft: 6 }}>{sublabel}</span>}
      </div>
      <span style={{ ...RECAP_STYLES.val, color }}>{value}</span>
    </div>
  );
}

function RecapInputRow({ label, field, rcValue, onChange, prefix = "$", sublabel, color = "#e2e8f0" }) {
  return (
    <div style={RECAP_STYLES.inputRow}>
      <div>
        <span style={RECAP_STYLES.lbl}>{label}</span>
        {sublabel && <span style={{ fontSize: 11, color: "#475569", marginLeft: 6 }}>{sublabel}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {prefix && <span style={{ color: "#64748b", fontSize: 13 }}>{prefix}</span>}
        <input
          value={rcValue ?? ""}
          onChange={e => onChange(field, e.target.value)}
          placeholder="0"
          style={{ ...RECAP_STYLES.inp, color }}
        />
      </div>
    </div>
  );
}

function RecapTab({ state, update, metrics: m }) {
  const rc  = state.recapConfig || { jdePct: 25, mktCost: "", miscExpenses: "" };
  const di  = state.dealerInfo  || {};
  const setRC = (field, val) => update({ recapConfig: { ...rc, [field]: val } });

  return (
    <div style={RECAP_STYLES.page}>
      <div style={RECAP_STYLES.grid}>

        {/* ── FINANCIAL SUMMARY ─────────────────────────────── */}
        <div style={RECAP_STYLES.card}>
          <div style={RECAP_STYLES.cardTitle}>📈 Financial Summary</div>

          <RecapRow label="Total Commissionable Gross"
               value={fmt$(m.totalGross)} color="#22d3ee"
               sublabel="(from Deal Log)" />

          {/* JDE Commission — adjustable % */}
          <div style={RECAP_STYLES.inputRow}>
            <span style={RECAP_STYLES.lbl}>JDE Commission</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#64748b", fontSize: 13 }}>{fmt$(m.jdeComm)}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <input
                  value={rc.jdePct ?? 25}
                  onChange={e => setRC("jdePct", e.target.value)}
                  style={{ ...RECAP_STYLES.inp, width: 56, color: "#a78bfa" }}
                />
                <span style={{ color: "#64748b", fontSize: 13 }}>%</span>
              </div>
            </div>
          </div>

          <RecapInputRow label="Marketing Cost" field="mktCost" rcValue={rc.mktCost} onChange={setRC} color="#fbbf24" />

          <div style={RECAP_STYLES.divider} />

          <RecapRow label="Non-Comm Gross"
               value={fmt$(m.nonCommGross)} color="#7dd3fc"
               sublabel="(deals × company pack)" />

          <RecapRow label="Variable Net"
               value={fmt$(m.varNet)}
               color={m.varNet >= 0 ? "#34d399" : "#f87171"}
               sublabel="(Gross − JDE − Mkt + Non-Comm)" />

          <div style={RECAP_STYLES.divider} />

          <RecapRow label="Reps Commissions"
               value={fmt$(m.repsComm)} color="#f87171"
               sublabel="(auto from Washout)" />

          <RecapInputRow label="Misc Expenses" field="miscExpenses" rcValue={rc.miscExpenses} onChange={setRC} color="#f87171" />

          <div style={RECAP_STYLES.totalRow}>
            <span style={RECAP_STYLES.totalLbl}>TOTAL NET</span>
            <span style={{ fontSize: 24, fontWeight: 900, color: m.totalNet >= 0 ? "#34d399" : "#f87171" }}>
              {fmt$(m.totalNet)}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#475569", textAlign: "right", marginTop: 2 }}>
            Variable Net − Reps Comm − Misc Expenses
          </div>
        </div>

        {/* ── UNIT BREAKDOWN ────────────────────────────────── */}
        <div style={RECAP_STYLES.card}>
          <div style={RECAP_STYLES.cardTitle}>🚗 Unit Breakdown</div>
          <div style={RECAP_STYLES.unitGrid}>
            {[
              { label: "Total", val: m.totalDeals, color: "#22d3ee" },
              { label: "New",   val: m.newDeals,   color: "#34d399" },
              { label: "Used",  val: m.usedDeals,  color: "#fbbf24" },
            ].map(u => (
              <div key={u.label} style={RECAP_STYLES.unitBox}>
                <div style={{ ...RECAP_STYLES.unitVal, color: u.color }}>{u.val}</div>
                <div style={RECAP_STYLES.unitLbl}>{u.label}</div>
              </div>
            ))}
          </div>
          <div style={RECAP_STYLES.divider} />
          {[
            ["Front Gross",  fmt$(m.totalFront), "#34d399"],
            ["Back (F&I)",   fmt$(m.totalBack),  "#7dd3fc"],
            ["Total Gross",  fmt$(m.totalGross), "#22d3ee"],
            ["Front PVR",    fmt$(m.frontPVR),   "#94a3b8"],
            ["Back PVR",     fmt$(m.backPVR),    "#94a3b8"],
            ["Total PVR",    fmt$(m.totalPVR),   "#e2e8f0"],
          ].map(([label, val, color]) => (
            <RecapRow key={label} label={label} value={val} color={color} />
          ))}
        </div>

        {/* ── SALE INFO ─────────────────────────────────────── */}
        <div style={RECAP_STYLES.card}>
          <div style={RECAP_STYLES.cardTitle}>📊 Sale Info</div>
          {[
            ["Dealer",      di.dealerName || SALE_INFO.dealer],
            ["Address",     [di.street, di.city, di.state].filter(Boolean).join(", ") || SALE_INFO.address],
            ["Sale Start",  di.startDate  || SALE_INFO.startDate],
            ["Sale End",    di.endDate    || SALE_INFO.endDate],
            ["Doc Fee",     fmt$(SALE_INFO.doc)],
            ["T&L",         fmt$(SALE_INFO.tl)],
            ["Sales Tax",   fmtPct(SALE_INFO.salesTax)],
          ].map(([label, val]) => (
            <RecapRow key={label} label={label} value={val} />
          ))}
        </div>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SHARED FIELD COMPONENTS — defined at module level, never inside a render
// ═══════════════════════════════════════════════════════════════════════════
const INP_BASE     = { padding:"7px 9px", borderRadius:6, border:"1px solid #334155", background:"#1e293b", color:"#e2e8f0", fontSize:13, fontFamily:"'IBM Plex Mono','Fira Code','Courier New',monospace", width:"100%", boxSizing:"border-box" };
const INP_READONLY = { ...INP_BASE, color:"#7dd3fc", border:"1px solid #1e3a5f", background:"#0c2340" };
const INP_FILLED   = { ...INP_BASE, border:"1px solid #0e7490", background:"#0c2340", color:"#7dd3fc" };
const LBL_STYLE    = { fontSize:11, color:"#64748b", letterSpacing:1, textTransform:"uppercase" };
const FWRAP_STYLE  = { display:"flex", flexDirection:"column", gap:3 };

function FW({ label, value, onChange, type="text", placeholder, readOnly, highlight, inputStyle }) {
  return (
    <div style={FWRAP_STYLE}>
      <label style={LBL_STYLE}>{label}</label>
      <input type={type} value={value||""} placeholder={placeholder||""}
        readOnly={!!readOnly}
        onChange={e => !readOnly && onChange && onChange(e.target.value)}
        style={highlight ? INP_FILLED : readOnly ? INP_READONLY : { ...INP_BASE, ...inputStyle }} />
    </div>
  );
}

function FWSel({ label, value, onChange, options, placeholder, inputStyle }) {
  return (
    <div style={FWRAP_STYLE}>
      <label style={LBL_STYLE}>{label}</label>
      <select value={value||""} onChange={e => onChange && onChange(e.target.value)}
        style={{ ...INP_BASE, ...inputStyle }}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function FWTextarea({ label, value, onChange, placeholder, rows=2 }) {
  return (
    <div style={FWRAP_STYLE}>
      <label style={LBL_STYLE}>{label}</label>
      <textarea value={value||""} placeholder={placeholder||""} rows={rows}
        onChange={e => onChange && onChange(e.target.value)}
        style={{ ...INP_BASE, resize:"vertical" }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DEAL LOG TAB
// ═══════════════════════════════════════════════════════════════════════════
const emptyDeal = () => ({
  id: uid(), dealNum: "", store: "On-Site", stock: "", customer: "", zip: "",
  newUsed: "Used", date: today(),
  // vehicle (auto-filled from inventory)
  year: "", make: "", model: "", cost: "", age: "",
  // trade 1
  tradeYear: "", tradeMake: "", tradeModel: "", tradeMiles: "", acv: "", payoff: "",
  // trade 2
  trade2: "",
  // people
  salesperson: "", salesperson2: "", closer: "",
  // gross & F&I
  frontGross: "", lender: "", rate: "",
  reserve: "", warranty: "", aft1: "", gap: "",
  fiTotal: 0, totalGross: 0,
  // meta
  funded: false, notes: "",
});

function DealLogTab({ state, update, showFlash }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(emptyDeal);
  const [editId, setEditId]     = useState(null);
  const [filter, setFilter]     = useState("");
  const [stockMatched, setStockMatched] = useState(false); // visual indicator

  const deals     = state.deals     || [];
  const inventory = state.inventory || [];
  const locations = state.inventoryLocations || ["On-Site"];
  const lenders     = (state.lenders     || []).map(l => l.name).filter(Boolean);
  const salespeople = (state.salespeople || []).map(s => s.name).filter(Boolean);
  const managers    = (state.managers    || []).map(m => m.name).filter(Boolean);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── auto-fill from inventory when stock# changes ─────────────────
  useEffect(() => {
    if (!form.stock) { setStockMatched(false); return; }
    const match = inventory.find(
      v => v.stock && v.stock.toLowerCase() === form.stock.toLowerCase()
    );
    if (match) {
      setForm(f => ({
        ...f,
        year:  match.year  || f.year,
        make:  match.make  || f.make,
        model: match.model || f.model,
        cost:  match.cost  || f.cost,
        age:   match.age   || f.age,
      }));
      setStockMatched(true);
    } else {
      setStockMatched(false);
    }
  }, [form.stock]);

  // ── auto-calc F&I + total gross ───────────────────────────────────
  useEffect(() => {
    const fg = Number(form.frontGross) || 0;
    const fi = (Number(form.reserve) || 0) + (Number(form.warranty) || 0) +
               (Number(form.aft1)    || 0) + (Number(form.gap)      || 0);
    setForm(f => ({ ...f, fiTotal: fi, totalGross: fg + fi }));
  }, [form.frontGross, form.reserve, form.warranty, form.aft1, form.gap]);

  // ── save / edit / delete ──────────────────────────────────────────
  const openNew = () => {
    setForm(emptyDeal());
    setEditId(null);
    setStockMatched(false);
    setShowForm(true);
  };

  const openEdit = (d) => {
    setForm({ ...d });
    setEditId(d.id);
    setStockMatched(false);
    setShowForm(true);
  };

  const save = () => {
    if (!form.customer) { showFlash("Customer name required", "error"); return; }
    if (editId) {
      update({ deals: deals.map(d => d.id === editId ? { ...form, id: editId } : d) });
      showFlash("Deal updated ✓");
    } else {
      const num = deals.length + 1;
      update({ deals: [...deals, { ...form, dealNum: String(num).padStart(3, "0") }] });
      showFlash(`Deal #${String(num).padStart(3,"0")} saved ✓`);
    }
    setShowForm(false);
    setForm(emptyDeal());
    setEditId(null);
  };

  const remove = (id) => {
    if (!confirm("Delete this deal?")) return;
    update({ deals: deals.filter(d => d.id !== id) });
    showFlash("Deal removed");
  };

  const toggleFunded = (id) =>
    update({ deals: deals.map(d => d.id === id ? { ...d, funded: !d.funded } : d) });

  // ── filtering ─────────────────────────────────────────────────────
  const q = filter.toLowerCase();
  const filtered = deals.filter(d =>
    !q || [d.dealNum, d.customer, d.stock, d.salesperson, d.make, d.model, d.store]
      .join(" ").toLowerCase().includes(q)
  );

  // ── totals ────────────────────────────────────────────────────────
  const totalFront = deals.reduce((a, d) => a + (Number(d.frontGross) || 0), 0);
  const totalFI    = deals.reduce((a, d) => a + (Number(d.fiTotal)    || 0), 0);
  const totalGrossAll = deals.reduce((a, d) => a + (Number(d.totalGross) || 0), 0);

  // ── inline styles ─────────────────────────────────────────────────
  const S = {
    page:      { display: "flex", flexDirection: "column", gap: 14 },
    toolbar:   { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
    srch:      { padding: "8px 12px", borderRadius: 7, border: "1px solid #1e293b", background: "#1e293b", color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", minWidth: 220 },
    btn:       { padding: "8px 18px", borderRadius: 7, border: "none", background: "#0e7490", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "inherit" },
    btnGhost:  { padding: "8px 14px", borderRadius: 7, border: "1px solid #334155", background: "transparent", color: "#94a3b8", fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: "inherit" },
    // form
    formWrap:  { background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: 10, padding: 20 },
    formHdr:   { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    formTitle: { fontSize: 14, fontWeight: 800, color: "#22d3ee", letterSpacing: 1, textTransform: "uppercase" },
    secLbl:    { fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: 2, textTransform: "uppercase", margin: "14px 0 8px", borderBottom: "1px solid #1e293b", paddingBottom: 4 },
    g2:        { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 },
    g3:        { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 },
    g4:        { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 },
    g5:        { display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 },
    g6:        { display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10 },
    fWrap:     { display: "flex", flexDirection: "column", gap: 3 },
    lbl:       { fontSize: 11, color: "#64748b", letterSpacing: 1, textTransform: "uppercase" },
    inp:       { padding: "7px 9px", borderRadius: 6, border: "1px solid #334155", background: "#1e293b", color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box" },
    inpFilled: { padding: "7px 9px", borderRadius: 6, border: "1px solid #0e7490", background: "#0c2340", color: "#7dd3fc", fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box" },
    inpSel:    { padding: "7px 9px", borderRadius: 6, border: "1px solid #334155", background: "#1e293b", color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box" },
    calcRow:   { display: "flex", gap: 12, margin: "14px 0", flexWrap: "wrap" },
    calcBox:   { background: "#1e293b", borderRadius: 8, padding: "10px 18px", flex: 1, minWidth: 140 },
    calcLbl:   { fontSize: 11, color: "#64748b", letterSpacing: 1, textTransform: "uppercase", display: "block" },
    calcVal:   { fontSize: 22, fontWeight: 800, color: "#22d3ee", display: "block", marginTop: 4 },
    formAct:   { display: "flex", gap: 10, marginTop: 16 },
    // table
    tblWrap:   { overflowX: "auto" },
    tbl:       { width: "100%", borderCollapse: "collapse", fontSize: 12 },
    th:        { background: "#0f172a", color: "#64748b", padding: "9px 10px", textAlign: "left", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", border: "1px solid #1e293b", whiteSpace: "nowrap" },
    td:        { padding: "8px 10px", border: "1px solid #1e293b", whiteSpace: "nowrap", color: "#cbd5e1", verticalAlign: "middle" },
    badge:     { padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700 },
    iconBtn:   { background: "transparent", border: "none", cursor: "pointer", fontSize: 15, padding: "0 3px" },
    fundBtn:   { padding: "3px 8px", borderRadius: 4, border: "1px solid #374151", cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: "inherit" },
    summaryBar:{ display: "flex", gap: 12, flexWrap: "wrap" },
    summaryPill:{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 18px", textAlign: "center", minWidth: 130 },
  };


  return (
    <div style={S.page}>

      {/* ── TOOLBAR ──────────────────────────────────────────────── */}
      <div style={S.toolbar}>
        <button style={S.btn} onClick={openNew}>＋ New Deal</button>
        <input style={S.srch} placeholder="🔍  Search deal #, customer, stock, vehicle…"
          value={filter} onChange={e => setFilter(e.target.value)} />
        <span style={{ color: "#64748b", fontSize: 12 }}>
          {filtered.length} / {deals.length} deals
        </span>
      </div>

      {/* ── SUMMARY BAR ──────────────────────────────────────────── */}
      {deals.length > 0 && (
        <div style={S.summaryBar}>
          {[
            { label: "Total Deals",  val: deals.length,          color: "#22d3ee" },
            { label: "New",          val: deals.filter(d=>d.newUsed==="New").length, color: "#34d399" },
            { label: "Used",         val: deals.filter(d=>d.newUsed==="Used").length, color: "#fbbf24" },
            { label: "Front Gross",  val: fmt$(totalFront),       color: "#34d399" },
            { label: "F&I Total",    val: fmt$(totalFI),          color: "#7dd3fc" },
            { label: "Total Gross",  val: fmt$(totalGrossAll),    color: "#22d3ee" },
            { label: "Funded",       val: deals.filter(d=>d.funded).length, color: "#a78bfa" },
          ].map(p => (
            <div key={p.label} style={S.summaryPill}>
              <div style={{ fontSize: 16, fontWeight: 800, color: p.color }}>{p.val}</div>
              <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 1, marginTop: 2, textTransform: "uppercase" }}>{p.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── ENTRY FORM ───────────────────────────────────────────── */}
      {showForm && (
        <div style={S.formWrap}>
          <div style={S.formHdr}>
            <span style={S.formTitle}>{editId ? "✏️ Edit Deal" : "➕ New Deal"}</span>
            <button style={S.btnGhost} onClick={() => { setShowForm(false); setForm(emptyDeal()); setEditId(null); }}>✕ Cancel</button>
          </div>

          {/* ─ Deal Info ─ */}
          <div style={S.secLbl}>Deal Info</div>
          <div style={{ ...S.g6, marginBottom: 10 }}>
            <FW label="Deal #"   value={form.dealNum} onChange={v => setField("dealNum", v)} placeholder="Auto" />
            <FWSel label="Store" value={form.store}   onChange={v => setField("store", v)} options={locations} />
            <FW label="Customer" value={form.customer} onChange={v => setField("customer", v)} placeholder="Last, First" />
            <FW label="ZIP"      value={form.zip}      onChange={v => setField("zip", v)} />
            <FWSel label="N/U"   value={form.newUsed}  onChange={v => setField("newUsed", v)} options={["New","Used"]} />
            <FW label="Date"     value={form.date}     onChange={v => setField("date", v)} type="date" />
          </div>

          {/* ─ Vehicle Sold ─ */}
          <div style={S.secLbl}>
            Vehicle Sold
            {stockMatched && <span style={{ marginLeft: 8, color: "#34d399", fontWeight: 700, fontSize: 11 }}>✓ Auto-filled from Inventory</span>}
          </div>
          <div style={{ ...S.g5, marginBottom: 10 }}>
            <FW label="Stock #" value={form.stock} onChange={v => setField("stock", v)} placeholder="Match inventory…" />
            <FW label="Year"    value={form.year}  onChange={v => setField("year", v)}  readOnly={stockMatched} />
            <FW label="Make"    value={form.make}  onChange={v => setField("make", v)}  readOnly={stockMatched} />
            <FW label="Model"   value={form.model} onChange={v => setField("model", v)} readOnly={stockMatched} />
            <FW label="Cost"    value={form.cost}  onChange={v => setField("cost", v)}  readOnly={stockMatched} placeholder="$" />
          </div>
          <div style={{ ...S.g3, marginBottom: 10 }}>
            <FW label="Age (days)" value={form.age} onChange={v => setField("age", v)} readOnly={stockMatched} />
          </div>

          {/* ─ Trade 1 ─ */}
          <div style={S.secLbl}>Trade 1</div>
          <div style={{ ...S.g6, marginBottom: 10 }}>
            <FW label="Trade Year"  value={form.tradeYear}  onChange={v => setField("tradeYear", v)} />
            <FW label="Trade Make"  value={form.tradeMake}  onChange={v => setField("tradeMake", v)} />
            <FW label="Trade Model" value={form.tradeModel} onChange={v => setField("tradeModel", v)} />
            <FW label="Trade Miles" value={form.tradeMiles} onChange={v => setField("tradeMiles", v)} placeholder="Miles" />
            <FW label="ACV"         value={form.acv}        onChange={v => setField("acv", v)}        placeholder="$" />
            <FW label="Payoff"      value={form.payoff}     onChange={v => setField("payoff", v)}     placeholder="$" />
          </div>

          {/* ─ Trade 2 ─ */}
          <div style={S.secLbl}>Trade 2</div>
          <div style={{ ...S.g3, marginBottom: 10 }}>
            <FW label="2nd Trade Description" value={form.trade2} onChange={v => setField("trade2", v)} placeholder="Year Make Model / ACV / Payoff…" />
          </div>

          {/* ─ People ─ */}
          <div style={S.secLbl}>People</div>
          <div style={{ ...S.g4, marginBottom: 10 }}>
            <FWSel label="Salesperson"
              value={form.salesperson}
              onChange={v => setField("salesperson", v)}
              options={salespeople.length ? salespeople : SALESPEOPLE}
              placeholder="Select…" />
            <FWSel label="2nd Salesperson"
              value={form.salesperson2}
              onChange={v => setField("salesperson2", v)}
              options={["", ...(salespeople.length ? salespeople : SALESPEOPLE)]}
              placeholder="None" />
            <FWSel label="Manager"
              value={form.closer}
              onChange={v => setField("closer", v)}
              options={["", ...managers]}
              placeholder={managers.length ? "Select…" : "Add managers in Roster"} />
          </div>

          {/* ─ Gross & F&I ─ */}
          <div style={S.secLbl}>Gross &amp; F&amp;I</div>
          <div style={{ ...S.g5, marginBottom: 10 }}>
            <FW    label="Front Gross" value={form.frontGross} onChange={v => setField("frontGross", v)} placeholder="$" />
            <FWSel label="Lender"      value={form.lender}     onChange={v => setField("lender", v)}
              options={lenders.length ? lenders : LENDERS} placeholder="Select…" />
            <FW    label="Rate %"      value={form.rate}        onChange={v => setField("rate", v)}    placeholder="%" />
            <FW    label="Reserve"     value={form.reserve}     onChange={v => setField("reserve", v)} placeholder="$" />
            <FW    label="Warranty"    value={form.warranty}    onChange={v => setField("warranty", v)} placeholder="$" />
          </div>
          <div style={{ ...S.g5, marginBottom: 10 }}>
            <FW    label="AFT 1"       value={form.aft1}        onChange={v => setField("aft1", v)}    placeholder="$" />
            <FW    label="GAP"         value={form.gap}         onChange={v => setField("gap", v)}     placeholder="$" />
          </div>

          {/* ─ Calc summary ─ */}
          <div style={S.calcRow}>
            <div style={S.calcBox}>
              <span style={S.calcLbl}>F&amp;I Total</span>
              <span style={{ ...S.calcVal, color: "#7dd3fc" }}>{fmt$(form.fiTotal)}</span>
              <span style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>Reserve + Warranty + AFT1 + GAP</span>
            </div>
            <div style={S.calcBox}>
              <span style={S.calcLbl}>Front Gross</span>
              <span style={{ ...S.calcVal, color: "#34d399" }}>{fmt$(Number(form.frontGross) || 0)}</span>
            </div>
            <div style={{ ...S.calcBox, border: "1px solid #0e7490" }}>
              <span style={S.calcLbl}>Total Gross</span>
              <span style={{ ...S.calcVal, color: "#22d3ee", fontSize: 26 }}>{fmt$(form.totalGross)}</span>
              <span style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>Front + F&amp;I</span>
            </div>
            <div style={S.calcBox}>
              <span style={S.calcLbl}>JDE Comm (25%)</span>
              <span style={{ ...S.calcVal, color: "#a78bfa" }}>{fmt$(form.totalGross * 0.25)}</span>
            </div>
          </div>

          {/* ─ Notes ─ */}
          <FWTextarea label="Notes" value={form.notes} onChange={v => setField("notes", v)} placeholder="Optional notes…" rows={3} />

          <div style={S.formAct}>
            <button style={S.btn} onClick={save}>💾 {editId ? "Update Deal" : "Save Deal"}</button>
            <button style={S.btnGhost} onClick={() => { setShowForm(false); setForm(emptyDeal()); setEditId(null); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── DEAL TABLE ────────────────────────────────────────────── */}
      <div style={S.tblWrap}>
        <table style={S.tbl}>
          <thead>
            <tr>
              {["Deal #","Date","Store","Stock","Customer","ZIP","N/U","Year","Make","Model",
                "Cost","Salesperson","Closer","Front $","F&I $","Total $","Lender","Rate",
                "Trade","Funded",""].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={21} style={{ ...S.td, textAlign: "center", color: "#374151", fontStyle: "italic", padding: 28 }}>
                  No deals yet — click ＋ New Deal to get started
                </td>
              </tr>
            )}
            {filtered.map((d, i) => (
              <tr key={d.id} style={{ background: i % 2 === 0 ? "#0f172a" : "#111827" }}>
                <td style={{ ...S.td, color: "#22d3ee", fontWeight: 800 }}>{d.dealNum || String(i+1).padStart(3,"0")}</td>
                <td style={{ ...S.td, color: "#64748b" }}>{d.date}</td>
                <td style={{ ...S.td, color: "#fbbf24" }}>{d.store}</td>
                <td style={{ ...S.td, color: "#7dd3fc" }}>{d.stock || "—"}</td>
                <td style={{ ...S.td, fontWeight: 600 }}>{d.customer}</td>
                <td style={{ ...S.td, color: "#64748b" }}>{d.zip}</td>
                <td style={S.td}>
                  <span style={{ ...S.badge, background: d.newUsed === "New" ? "#064e3b" : "#451a03", color: d.newUsed === "New" ? "#34d399" : "#fbbf24" }}>
                    {d.newUsed || "—"}
                  </span>
                </td>
                <td style={S.td}>{d.year}</td>
                <td style={{ ...S.td, fontWeight: 600 }}>{d.make}</td>
                <td style={S.td}>{d.model}</td>
                <td style={{ ...S.td, color: "#94a3b8" }}>{d.cost ? fmt$(d.cost) : "—"}</td>
                <td style={S.td}>
                  {d.salesperson}
                  {d.salesperson2 && <span style={{ color: "#64748b" }}> / {d.salesperson2}</span>}
                </td>
                <td style={{ ...S.td, color: "#94a3b8" }}>{d.closer || "—"}</td>
                <td style={{ ...S.td, color: "#34d399", fontWeight: 700 }}>{fmt$(d.frontGross)}</td>
                <td style={{ ...S.td, color: "#7dd3fc" }}>{fmt$(d.fiTotal)}</td>
                <td style={{ ...S.td, color: "#22d3ee", fontWeight: 800, fontSize: 13 }}>{fmt$(d.totalGross)}</td>
                <td style={{ ...S.td, color: "#94a3b8" }}>{d.lender || "—"}</td>
                <td style={{ ...S.td, color: "#64748b" }}>{d.rate ? d.rate + "%" : "—"}</td>
                <td style={{ ...S.td, color: "#94a3b8", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {[d.tradeYear, d.tradeMake, d.tradeModel].filter(Boolean).join(" ") || "—"}
                </td>
                <td style={S.td}>
                  <button onClick={() => toggleFunded(d.id)}
                    style={{ ...S.fundBtn, background: d.funded ? "#065f46" : "#1f2937", color: d.funded ? "#34d399" : "#6b7280" }}>
                    {d.funded ? "✓ FUNDED" : "PENDING"}
                  </button>
                </td>
                <td style={S.td}>
                  <button style={S.iconBtn} onClick={() => openEdit(d)} title="Edit">✏️</button>
                  <button style={S.iconBtn} onClick={() => remove(d.id)} title="Delete">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PERFORMANCE TAB
// ═══════════════════════════════════════════════════════════════════════════
function PerformanceTab({ deals }) {
  const byRep = {};
  SALESPEOPLE.forEach(sp => { byRep[sp] = { deals: 0, front: 0, gross: 0, comm: 0 }; });

  deals.forEach(d => {
    const sp  = d.salesperson;
    const sp2 = d.salesperson2;
    const gross = Number(d.totalGross) || 0;
    const front = Number(d.frontGross) || 0;
    const isplit = !!sp2;

    [sp, sp2].filter(Boolean).forEach(name => {
      if (!byRep[name]) byRep[name] = { deals: 0, front: 0, gross: 0, comm: 0 };
      byRep[name].deals += 1;
      byRep[name].front += isplit ? front / 2 : front;
      byRep[name].gross += isplit ? gross / 2 : gross;
      byRep[name].comm  += isplit ? gross * 0.25 / 2 : gross * 0.25;
    });
  });

  const reps = Object.entries(byRep)
    .filter(([, v]) => v.deals > 0)
    .sort((a, b) => b[1].gross - a[1].gross);

  const maxGross = reps[0]?.[1]?.gross || 1;

  return (
    <div>
      <Card title="🏆 Salesperson Leaderboard">
        {reps.length === 0 && <div style={styles.emptyRow}>No deals recorded yet</div>}
        {reps.map(([name, v], i) => (
          <div key={name} style={styles.repRow}>
            <span style={styles.repRank}>{i + 1}</span>
            <span style={styles.repName}>{name}</span>
            <div style={styles.repBar}>
              <div style={{ ...styles.repBarFill, width: `${(v.gross / maxGross) * 100}%` }} />
            </div>
            <span style={styles.repDeals}>{v.deals} deals</span>
            <span style={styles.repFront}>{fmt$(v.front)}</span>
            <span style={styles.repGross}>{fmt$(v.gross)}</span>
            <span style={styles.repComm}>{fmt$(v.comm)}</span>
          </div>
        ))}
        {reps.length > 0 && (
          <div style={{ ...styles.repRow, marginTop: 12, borderTop: "1px solid #374151", paddingTop: 12 }}>
            <span style={styles.repRank}></span>
            <span style={{ ...styles.repName, color: "#e2e8f0", fontWeight: 700 }}>TOTALS</span>
            <div style={styles.repBar} />
            <span style={styles.repDeals}>{deals.length}</span>
            <span style={styles.repFront}>{fmt$(deals.reduce((a,d) => a+(Number(d.frontGross)||0),0))}</span>
            <span style={styles.repGross}>{fmt$(deals.reduce((a,d) => a+(Number(d.totalGross)||0),0))}</span>
            <span style={styles.repComm}>{fmt$(deals.reduce((a,d) => a+(Number(d.totalGross)||0),0)*0.25)}</span>
          </div>
        )}
      </Card>
      <div style={{ marginTop: 8, color: "#6b7280", fontSize: 12 }}>
        * Commission shown at 25% of commissionable gross. Split deals split 50/50.
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIL TRACKING TAB
// ═══════════════════════════════════════════════════════════════════════════
const ZIP_AREAS = [
  { zip: "98443", town: "FIFE",     drop: 1, pieces: 2114  },
  { zip: "98499", town: "LAKEWOOD", drop: 1, pieces: 13035 },
  { zip: "98408", town: "TACOMA",   drop: 1, pieces: 7649  },
  { zip: "98409", town: "TACOMA",   drop: 1, pieces: 10796 },
  { zip: "98405", town: "TACOMA",   drop: 1, pieces: 11017 },
  { zip: "98418", town: "TACOMA",   drop: 2, pieces: 3896  },
  { zip: "98466", town: "TACOMA",   drop: 2, pieces: 12484 },
  { zip: "98444", town: "TACOMA",   drop: 2, pieces: 13843 },
  { zip: "98446", town: "TACOMA",   drop: 2, pieces: 5136  },
  { zip: "98465", town: "TACOMA",   drop: 2, pieces: 3523  },
  { zip: "98467", town: "TACOMA",   drop: 2, pieces: 6543  },
];
const SALE_DAYS = ["Day 1","Day 2","Day 3","Day 4","Day 5","Day 6","Day 7","Day 8","Day 9","Day 10","Day 11"];

function MailTab({ state, update, showFlash }) {
  const mail = state.mailTracking || { totalPieces: 588, drops: [] };
  const [responses, setResponses] = useState(mail.responses || {});

  const updateResp = (zip, day, val) => {
    const next = { ...responses, [`${zip}_${day}`]: val };
    setResponses(next);
    update({ mailTracking: { ...mail, responses: next } });
  };

  const totalPieces = ZIP_AREAS.reduce((a, z) => a + z.pieces, 0);
  const totalUps = state.deals?.length || 0;

  return (
    <div>
      <div style={styles.toolBar}>
        <span style={styles.badge}>Total Mail: {totalPieces.toLocaleString()} pieces · {totalUps} UPs tracked</span>
        <span style={styles.badge}>Response Rate: {totalPieces ? ((totalUps / totalPieces) * 100).toFixed(2) : "0.00"}%</span>
      </div>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Drop</th>
              <th style={styles.th}>ZIP</th>
              <th style={styles.th}>Town</th>
              <th style={styles.th}>Pieces</th>
              {SALE_DAYS.map(d => <th key={d} style={styles.th}>{d}</th>)}
              <th style={styles.th}>Total</th>
            </tr>
          </thead>
          <tbody>
            {ZIP_AREAS.map((z, i) => {
              const dayTotals = SALE_DAYS.map(d => Number(responses[`${z.zip}_${d}`]) || 0);
              const rowTotal = dayTotals.reduce((a, v) => a + v, 0);
              return (
                <tr key={z.zip} style={{ background: i % 2 === 0 ? "#0f172a" : "#111827" }}>
                  <td style={styles.td}>{z.drop}</td>
                  <td style={{ ...styles.td, color: "#22d3ee", fontWeight: 600 }}>{z.zip}</td>
                  <td style={styles.td}>{z.town}</td>
                  <td style={{ ...styles.td, color: "#fbbf24" }}>{z.pieces.toLocaleString()}</td>
                  {SALE_DAYS.map(d => (
                    <td key={d} style={styles.td}>
                      <input type="number" min="0"
                        value={responses[`${z.zip}_${d}`] || ""}
                        onChange={e => updateResp(z.zip, d, e.target.value)}
                        style={styles.tinyInput}
                        placeholder="0"
                      />
                    </td>
                  ))}
                  <td style={{ ...styles.td, color: "#34d399", fontWeight: 700 }}>{rowTotal}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: "#0f2744", borderTop: "2px solid #1e3a5f" }}>
              <td colSpan={3} style={{ ...styles.td, fontWeight: 800, color: "#e2e8f0", fontSize: 12, letterSpacing: 1 }}>TOTALS</td>
              <td style={{ ...styles.td, color: "#fbbf24", fontWeight: 800 }}>{totalPieces.toLocaleString()}</td>
              {SALE_DAYS.map(d => {
                const colTotal = ZIP_AREAS.reduce((a, z) => a + (Number(responses[`${z.zip}_${d}`]) || 0), 0);
                return (
                  <td key={d} style={{ ...styles.td, color: colTotal > 0 ? "#22d3ee" : "#334155", fontWeight: 800, textAlign: "center" }}>
                    {colTotal}
                  </td>
                );
              })}
              <td style={{ ...styles.td, color: "#34d399", fontWeight: 800 }}>
                {ZIP_AREAS.reduce((a, z) => a + SALE_DAYS.reduce((b, d) => b + (Number(responses[`${z.zip}_${d}`]) || 0), 0), 0)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PLATE LOG TAB
// ═══════════════════════════════════════════════════════════════════════════
const PLATES = ["395 K","395 U","395 O","395 J","395 V","395 T","395 E"];

function PlateTab({ state, update, showFlash }) {
  const [form, setForm] = useState({ plateNum: "", salesperson: "", customer: "", vehicle: "", timeOut: "", timeIn: "", comments: "" });
  const logs = state.plateLogs || [];

  const save = () => {
    if (!form.plateNum || !form.salesperson) {
      showFlash("Plate & Salesperson required", "error"); return;
    }
    update({ plateLogs: [...logs, { ...form, id: uid(), date: today() }] });
    setForm({ plateNum: "", salesperson: "", customer: "", vehicle: "", timeOut: "", timeIn: "", comments: "" });
    showFlash("Plate log saved ✓");
  };

  const close = (id) => {
    update({ plateLogs: logs.map(l => l.id === id ? { ...l, timeIn: new Date().toTimeString().slice(0, 5) } : l) });
  };

  const outNow = () => new Date().toTimeString().slice(0, 5);

  return (
    <div>
      <Card title="🔑 Log Plate Out">
        <div style={styles.formGrid}>
          <SelectField label="Plate #" value={form.plateNum} onChange={v => setForm(f => ({ ...f, plateNum: v }))} options={PLATES} placeholder="Select…" />
          <SelectField label="Salesperson" value={form.salesperson} onChange={v => setForm(f => ({ ...f, salesperson: v }))} options={SALESPEOPLE} placeholder="Select…" />
          <Field label="Customer" value={form.customer} onChange={v => setForm(f => ({ ...f, customer: v }))} />
          <Field label="Vehicle" value={form.vehicle} onChange={v => setForm(f => ({ ...f, vehicle: v }))} />
          <Field label="Time Out" value={form.timeOut} onChange={v => setForm(f => ({ ...f, timeOut: v }))} placeholder={outNow()} />
          <Field label="Comments" value={form.comments} onChange={v => setForm(f => ({ ...f, comments: v }))} />
        </div>
        <div style={styles.formActions}>
          <button style={styles.btnPrimary} onClick={save}>🔑 Log Plate Out</button>
        </div>
      </Card>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {["Date","Plate","Salesperson","Customer","Vehicle","Time Out","Time In","Comments",""].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && <tr><td colSpan={9} style={styles.emptyRow}>No plates logged yet</td></tr>}
            {[...logs].reverse().map((l, i) => (
              <tr key={l.id} style={{ background: i % 2 === 0 ? "#0f172a" : "#111827" }}>
                <td style={styles.td}>{l.date}</td>
                <td style={{ ...styles.td, color: "#fbbf24", fontWeight: 700 }}>{l.plateNum}</td>
                <td style={styles.td}>{l.salesperson}</td>
                <td style={styles.td}>{l.customer}</td>
                <td style={styles.td}>{l.vehicle}</td>
                <td style={{ ...styles.td, color: "#f87171" }}>{l.timeOut}</td>
                <td style={{ ...styles.td, color: "#34d399" }}>{l.timeIn || "—"}</td>
                <td style={styles.td}>{l.comments}</td>
                <td style={styles.td}>
                  {!l.timeIn && <button style={styles.btnSmall} onClick={() => close(l.id)}>Return</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// INVENTORY TAB
// ═══════════════════════════════════════════════════════════════════════════
const VEHICLE_CLASSES    = ["Sedan","SUV","Truck","Van","Coupe","Hatchback","Wagon","Convertible","Other"];
const DRIVETRAIN_TYPES   = ["FWD","RWD","AWD","4WD","4x4"];
const BOOK_PCTS          = [1.15, 1.20, 1.25, 1.30];
const BOOK_PCT_LABELS    = ["115%","120%","125%","130%"];

const emptyVehicle = () => ({
  id: uid(),
  hat: "", notes: "", location: "On-Site",
  stock: "", year: "", make: "", model: "",
  vehicleClass: "", color: "", odometer: "",
  vin: "", trim: "", age: "", drivetrain: "",
  cleanTrade: "", cleanRetail: "", cost: "",
});

function calcBookRows(v) {
  const trade  = parseFloat(v.cleanTrade)  || 0;
  const retail = parseFloat(v.cleanRetail) || 0;
  const cost   = parseFloat(v.cost)        || 0;
  const diffTrade  = trade  ? trade  - cost : null;
  const diffRetail = retail ? retail - cost : null;
  const books = BOOK_PCTS.map(p => ({
    pct: p,
    trade:  trade  ? trade  * p : null,
    retail: retail ? retail * p : null,
  }));
  return { diffTrade, diffRetail, books };
}

function InventoryTab({ state, update, showFlash }) {
  const inventory  = state.inventory          || [];
  const locations  = state.inventoryLocations || ["On-Site"];

  const [search,      setSearch]      = useState("");
  const [filterLoc,   setFilterLoc]   = useState("All");
  const [filterClass, setFilterClass] = useState("All");
  const [editId,      setEditId]      = useState(null);   // vehicle being edited
  const [showForm,    setShowForm]    = useState(false);
  const [form,        setForm]        = useState(emptyVehicle);
  const [newLocInput, setNewLocInput] = useState("");
  const [showAddLoc,  setShowAddLoc]  = useState(false);
  const [expandedId,  setExpandedId]  = useState(null);   // book value row expanded

  // ── helpers ─────────────────────────────────────────────────────
  const setF = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const addLocation = () => {
    const loc = newLocInput.trim();
    if (!loc || locations.includes(loc)) return;
    update({ inventoryLocations: [...locations, loc] });
    setNewLocInput("");
    setShowAddLoc(false);
    showFlash(`Location "${loc}" added ✓`);
  };

  const openNew = () => {
    setForm(emptyVehicle());
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (v) => {
    setForm({ ...v });
    setEditId(v.id);
    setShowForm(true);
  };

  const saveVehicle = () => {
    if (!form.stock && !form.vin && !form.hat) {
      showFlash("Enter at least HAT#, Stock#, or VIN", "error");
      return;
    }
    if (editId) {
      update({ inventory: inventory.map(v => v.id === editId ? { ...form, id: editId } : v) });
      showFlash("Vehicle updated ✓");
    } else {
      update({ inventory: [...inventory, { ...form, id: uid() }] });
      showFlash("Vehicle added ✓");
    }
    setShowForm(false);
    setEditId(null);
  };

  const deleteVehicle = (id) => {
    update({ inventory: inventory.filter(v => v.id !== id) });
    showFlash("Vehicle removed");
  };

  // ── filtered list ────────────────────────────────────────────────
  const q = search.toLowerCase();
  const filtered = inventory.filter(v => {
    const matchSearch = !q ||
      [v.hat, v.stock, v.vin, v.make, v.model, v.year, v.color, v.trim]
        .some(f => (f || "").toLowerCase().includes(q));
    const matchLoc   = filterLoc   === "All" || v.location === filterLoc;
    const matchClass = filterClass === "All" || v.vehicleClass === filterClass;
    return matchSearch && matchLoc && matchClass;
  });

  // ── money formatter ──────────────────────────────────────────────
  const $f = (n) => n == null || isNaN(n) ? "—" :
    "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const diffColor = (n) => n == null ? "#64748b" : n >= 0 ? "#34d399" : "#f87171";

  // ── styles ───────────────────────────────────────────────────────
  const S = {
    page:     { display: "flex", flexDirection: "column", gap: 16 },
    toolbar:  { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
    srch:     { padding: "8px 12px", borderRadius: 7, border: "1px solid #1e293b", background: "#1e293b", color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", minWidth: 220 },
    sel:      { padding: "8px 10px", borderRadius: 7, border: "1px solid #1e293b", background: "#1e293b", color: "#e2e8f0", fontSize: 13, fontFamily: "inherit" },
    btn:      { padding: "8px 18px", borderRadius: 7, border: "none", background: "#0e7490", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "inherit" },
    btnGhost: { padding: "8px 14px", borderRadius: 7, border: "1px solid #334155", background: "transparent", color: "#94a3b8", fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: "inherit" },
    btnSm:    { padding: "4px 10px", borderRadius: 5, border: "none", background: "#1e3a5f", color: "#22d3ee", fontWeight: 700, cursor: "pointer", fontSize: 12, fontFamily: "inherit" },
    btnDel:   { padding: "4px 10px", borderRadius: 5, border: "none", background: "#7f1d1d", color: "#fca5a5", fontWeight: 700, cursor: "pointer", fontSize: 12, fontFamily: "inherit" },
    badge:    { padding: "3px 9px", borderRadius: 12, fontSize: 11, fontWeight: 700 },
    // form
    formWrap: { background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: 10, padding: 20, marginBottom: 4 },
    formTitle:{ fontSize: 14, fontWeight: 800, color: "#22d3ee", letterSpacing: 1, marginBottom: 16, textTransform: "uppercase" },
    g2:       { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 },
    g3:       { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 },
    g4:       { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 },
    g5:       { display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 },
    fWrap:    { display: "flex", flexDirection: "column", gap: 3 },
    lbl:      { fontSize: 11, color: "#64748b", letterSpacing: 1, textTransform: "uppercase" },
    inp:      { padding: "7px 9px", borderRadius: 6, border: "1px solid #334155", background: "#1e293b", color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box" },
    inpSel:   { padding: "7px 9px", borderRadius: 6, border: "1px solid #334155", background: "#1e293b", color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box" },
    secLbl:   { fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: 2, textTransform: "uppercase", margin: "14px 0 8px", borderBottom: "1px solid #1e293b", paddingBottom: 4 },
    // calc panel
    calcPanel:{ background: "#1e293b", borderRadius: 8, padding: 14, marginTop: 14 },
    calcTitle:{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 },
    calcGrid: { display: "grid", gridTemplateColumns: "100px repeat(4,1fr)", gap: 0, fontSize: 12 },
    calcHdr:  { background: "#0f172a", padding: "6px 10px", textAlign: "center", color: "#64748b", fontSize: 11, letterSpacing: 1, fontWeight: 700, border: "1px solid #1e293b" },
    calcCell: { padding: "6px 10px", textAlign: "center", border: "1px solid #1e293b", fontWeight: 600 },
    // table
    tblWrap:  { overflowX: "auto" },
    tbl:      { width: "100%", borderCollapse: "collapse", fontSize: 12 },
    th:       { background: "#0f172a", color: "#64748b", padding: "9px 10px", textAlign: "left", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", border: "1px solid #1e293b", whiteSpace: "nowrap" },
    td:       { padding: "8px 10px", border: "1px solid #1e293b", whiteSpace: "nowrap", color: "#cbd5e1", verticalAlign: "middle" },
    // book expand
    bookRow:  { background: "#1e293b" },
    bookCell: { padding: "10px 14px", border: "1px solid #1e293b" },
  };

  // Live calc preview inside form
  const liveCalc = calcBookRows(form);

  return (
    <div style={S.page}>

      {/* ── TOOLBAR ──────────────────────────────────────────────── */}
      <div style={S.toolbar}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Search HAT#, Stock, VIN, Make, Model…" style={S.srch} />
        <select value={filterLoc} onChange={e => setFilterLoc(e.target.value)} style={S.sel}>
          <option value="All">All Locations</option>
          {locations.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)} style={S.sel}>
          <option value="All">All Classes</option>
          {VEHICLE_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span style={{ color: "#64748b", fontSize: 12, marginLeft: 4 }}>
          {filtered.length} / {inventory.length} vehicles
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {/* Add Location */}
          {showAddLoc ? (
            <div style={{ display: "flex", gap: 6 }}>
              <input value={newLocInput} onChange={e => setNewLocInput(e.target.value)}
                placeholder="Location name…" style={{ ...S.srch, minWidth: 160 }}
                onKeyDown={e => e.key === "Enter" && addLocation()} />
              <button style={S.btn} onClick={addLocation}>Add</button>
              <button style={S.btnGhost} onClick={() => setShowAddLoc(false)}>✕</button>
            </div>
          ) : (
            <button style={S.btnGhost} onClick={() => setShowAddLoc(true)}>📍 Add Location</button>
          )}
          <button style={S.btn} onClick={openNew}>＋ Add Vehicle</button>
        </div>
      </div>

      {/* ── ENTRY / EDIT FORM ─────────────────────────────────────── */}
      {showForm && (
        <div style={S.formWrap}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={S.formTitle}>{editId ? "✏️ Edit Vehicle" : "＋ Add Vehicle"}</span>
            <button style={S.btnGhost} onClick={() => setShowForm(false)}>✕ Cancel</button>
          </div>

          {/* Row 1 — IDs & Status */}
          <div style={S.secLbl}>Identification</div>
          <div style={{ ...S.g5, marginBottom: 10 }}>
            <FW label="HAT #"   value={form.hat}   onChange={v => setF("hat", v)} />
            <FW label="Stock #" value={form.stock} onChange={v => setF("stock", v)} />
            <FW label="VIN #"   value={form.vin}   onChange={v => setF("vin", v)} />
            <FWSel label="Location" value={form.location} onChange={v => setF("location", v)}
              options={locations} placeholder="" />
            <FW label="Notes" value={form.notes} onChange={v => setF("notes", v)} placeholder="Optional…" />
          </div>

          {/* Row 2 — Vehicle Details */}
          <div style={S.secLbl}>Vehicle Details</div>
          <div style={{ ...S.g5, marginBottom: 10 }}>
            <FW label="Year"  value={form.year}  onChange={v => setF("year", v)}  placeholder="2024" />
            <FW label="Make"  value={form.make}  onChange={v => setF("make", v)}  placeholder="Nissan" />
            <FW label="Model" value={form.model} onChange={v => setF("model", v)} placeholder="Altima" />
            <FW label="Trim"  value={form.trim}  onChange={v => setF("trim", v)}  placeholder="SV" />
            <FW label="Color" value={form.color} onChange={v => setF("color", v)} placeholder="Pearl White" />
          </div>
          <div style={{ ...S.g5, marginBottom: 10 }}>
            <FWSel label="Class" value={form.vehicleClass} onChange={v => setF("vehicleClass", v)}
              options={VEHICLE_CLASSES} placeholder="— Select —" />
            <FWSel label="Drivetrain" value={form.drivetrain} onChange={v => setF("drivetrain", v)}
              options={DRIVETRAIN_TYPES} placeholder="— Select —" />
            <FW label="Odometer" value={form.odometer} onChange={v => setF("odometer", v)} placeholder="Miles" />
            <FW label="Age (days)" value={form.age} onChange={v => setF("age", v)} placeholder="0" />
          </div>

          {/* Row 3 — Financials */}
          <div style={S.secLbl}>Book Values & Cost</div>
          <div style={{ ...S.g4, marginBottom: 10 }}>
            <FW label="Clean Trade (Book)" value={form.cleanTrade}  onChange={v => setF("cleanTrade", v)}  placeholder="$" />
            <FW label="Clean Retail (Book)" value={form.cleanRetail} onChange={v => setF("cleanRetail", v)} placeholder="$" />
            <FW label="Cost" value={form.cost} onChange={v => setF("cost", v)} placeholder="$" />
          </div>

          {/* Live Calc Preview */}
          {(form.cleanTrade || form.cleanRetail || form.cost) && (
            <div style={S.calcPanel}>
              <div style={S.calcTitle}>📐 Live Calculations</div>
              <div style={{ display: "grid", gridTemplateColumns: "130px 1fr 1fr", gap: 0, fontSize: 12, marginBottom: 10 }}>
                <div style={{ ...S.calcHdr, background: "transparent" }}></div>
                <div style={S.calcHdr}>TRADE</div>
                <div style={S.calcHdr}>RETAIL</div>

                <div style={{ ...S.calcCell, background: "#0f172a", color: "#94a3b8", textAlign: "left" }}>Difference</div>
                <div style={{ ...S.calcCell, color: diffColor(liveCalc.diffTrade) }}>
                  {liveCalc.diffTrade != null ? ($f(liveCalc.diffTrade) + (liveCalc.diffTrade >= 0 ? " ▲" : " ▼")) : "—"}
                </div>
                <div style={{ ...S.calcCell, color: diffColor(liveCalc.diffRetail) }}>
                  {liveCalc.diffRetail != null ? ($f(liveCalc.diffRetail) + (liveCalc.diffRetail >= 0 ? " ▲" : " ▼")) : "—"}
                </div>

                {liveCalc.books.map((b, i) => (
                  <>
                    <div key={"l"+i} style={{ ...S.calcCell, background: "#0f172a", color: "#a78bfa", textAlign: "left", fontWeight: 700 }}>
                      {BOOK_PCT_LABELS[i]} Book
                    </div>
                    <div key={"t"+i} style={{ ...S.calcCell, color: "#fbbf24" }}>{b.trade  != null ? $f(b.trade)  : "—"}</div>
                    <div key={"r"+i} style={{ ...S.calcCell, color: "#fbbf24" }}>{b.retail != null ? $f(b.retail) : "—"}</div>
                  </>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button style={S.btn} onClick={saveVehicle}>💾 {editId ? "Update" : "Add to Inventory"}</button>
            <button style={S.btnGhost} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── INVENTORY TABLE ───────────────────────────────────────── */}
      <div style={S.tblWrap}>
        <table style={S.tbl}>
          <thead>
            <tr>
              {["HAT#","Stock#","Year","Make","Model","Trim","Class","Color","Odometer","Drivetrain","Location","Trade Book","Retail Book","Cost","Diff (T)","Diff (R)","Age",""].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={18} style={{ ...S.td, textAlign: "center", color: "#374151", fontStyle: "italic", padding: 28 }}>
                No vehicles yet — click ＋ Add Vehicle to get started
              </td></tr>
            )}
            {filtered.map(v => {
              const { diffTrade, diffRetail, books } = calcBookRows(v);
              const expanded = expandedId === v.id;
              return (
                <>
                  <tr key={v.id} style={{ background: expanded ? "#1e3a5f22" : "transparent" }}>
                    <td style={{ ...S.td, color: "#22d3ee", fontWeight: 700 }}>{v.hat  || "—"}</td>
                    <td style={{ ...S.td, color: "#a78bfa" }}>{v.stock || "—"}</td>
                    <td style={S.td}>{v.year  || "—"}</td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{v.make  || "—"}</td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{v.model || "—"}</td>
                    <td style={{ ...S.td, color: "#94a3b8" }}>{v.trim  || "—"}</td>
                    <td style={S.td}>
                      {v.vehicleClass && (
                        <span style={{ ...S.badge, background: "#1e293b", color: "#7dd3fc" }}>{v.vehicleClass}</span>
                      )}
                    </td>
                    <td style={S.td}>{v.color || "—"}</td>
                    <td style={{ ...S.td, textAlign: "right" }}>
                      {v.odometer ? Number(v.odometer).toLocaleString() : "—"}
                    </td>
                    <td style={S.td}>
                      {v.drivetrain && (
                        <span style={{ ...S.badge, background: "#1e293b", color: "#34d399" }}>{v.drivetrain}</span>
                      )}
                    </td>
                    <td style={{ ...S.td, color: "#fbbf24" }}>{v.location || "On-Site"}</td>
                    <td style={{ ...S.td, textAlign: "right" }}>{$f(parseFloat(v.cleanTrade))}</td>
                    <td style={{ ...S.td, textAlign: "right" }}>{$f(parseFloat(v.cleanRetail))}</td>
                    <td style={{ ...S.td, textAlign: "right" }}>{$f(parseFloat(v.cost))}</td>
                    <td style={{ ...S.td, textAlign: "right", color: diffColor(diffTrade), fontWeight: 700 }}>
                      {diffTrade != null ? $f(diffTrade) : "—"}
                    </td>
                    <td style={{ ...S.td, textAlign: "right", color: diffColor(diffRetail), fontWeight: 700 }}>
                      {diffRetail != null ? $f(diffRetail) : "—"}
                    </td>
                    <td style={{ ...S.td, textAlign: "center", color: "#64748b" }}>{v.age || "—"}</td>
                    <td style={{ ...S.td }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button style={S.btnSm}
                          onClick={() => setExpandedId(expanded ? null : v.id)}
                          title="Book values">📐</button>
                        <button style={S.btnSm} onClick={() => openEdit(v)} title="Edit">✏️</button>
                        <button style={S.btnDel} onClick={() => deleteVehicle(v.id)} title="Delete">✕</button>
                      </div>
                    </td>
                  </tr>

                  {/* ── EXPANDED BOOK VALUE ROWS ── */}
                  {expanded && (
                    <tr key={v.id + "_book"} style={S.bookRow}>
                      <td colSpan={18} style={S.bookCell}>
                        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", padding: "4px 0" }}>
                          {/* Difference summary */}
                          <div style={{ background: "#0f172a", borderRadius: 7, padding: "10px 16px", minWidth: 180 }}>
                            <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>Difference (Book − Cost)</div>
                            <div style={{ display: "flex", gap: 20 }}>
                              <div>
                                <span style={{ fontSize: 11, color: "#64748b" }}>Trade: </span>
                                <span style={{ fontWeight: 800, color: diffColor(diffTrade) }}>
                                  {diffTrade != null ? $f(diffTrade) : "—"}
                                </span>
                              </div>
                              <div>
                                <span style={{ fontSize: 11, color: "#64748b" }}>Retail: </span>
                                <span style={{ fontWeight: 800, color: diffColor(diffRetail) }}>
                                  {diffRetail != null ? $f(diffRetail) : "—"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Book % columns */}
                          {books.map((b, i) => (
                            <div key={i} style={{ background: "#0f172a", borderRadius: 7, padding: "10px 16px", minWidth: 160 }}>
                              <div style={{ fontSize: 11, color: "#a78bfa", fontWeight: 800, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>
                                {BOOK_PCT_LABELS[i]} Book
                              </div>
                              <div style={{ display: "flex", gap: 20 }}>
                                <div>
                                  <span style={{ fontSize: 11, color: "#64748b" }}>Trade: </span>
                                  <span style={{ fontWeight: 700, color: "#fbbf24" }}>{b.trade  != null ? $f(b.trade)  : "—"}</span>
                                </div>
                                <div>
                                  <span style={{ fontSize: 11, color: "#64748b" }}>Retail: </span>
                                  <span style={{ fontWeight: 700, color: "#fbbf24" }}>{b.retail != null ? $f(b.retail) : "—"}</span>
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* Notes */}
                          {v.notes && (
                            <div style={{ background: "#0f172a", borderRadius: 7, padding: "10px 16px", flex: 1, minWidth: 180 }}>
                              <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" }}>Notes</div>
                              <div style={{ color: "#94a3b8", fontSize: 13 }}>{v.notes}</div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── SUMMARY STRIP ─────────────────────────────────────────── */}
      {inventory.length > 0 && (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            { label: "Total Units",   val: inventory.length,                         color: "#22d3ee" },
            { label: "On-Site",       val: inventory.filter(v => v.location === "On-Site").length, color: "#34d399" },
            { label: "Avg Trade Book",val: $f(inventory.reduce((a,v) => a + (parseFloat(v.cleanTrade)||0), 0) / inventory.filter(v=>v.cleanTrade).length || 0), color: "#fbbf24" },
            { label: "Avg Retail Book",val: $f(inventory.reduce((a,v) => a + (parseFloat(v.cleanRetail)||0), 0) / inventory.filter(v=>v.cleanRetail).length || 0), color: "#fbbf24" },
            { label: "Avg Cost",      val: $f(inventory.reduce((a,v) => a + (parseFloat(v.cost)||0), 0) / inventory.filter(v=>v.cost).length || 0), color: "#a78bfa" },
          ].map(p => (
            <div key={p.label} style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 18px", textAlign: "center", minWidth: 130 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: p.color }}>{p.val}</div>
              <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 1, marginTop: 2, textTransform: "uppercase" }}>{p.label}</div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// WASHOUT TAB
// ═══════════════════════════════════════════════════════════════════════════
function WashoutTab({ state }) {
  const [activeSP, setActiveSP] = useState(null); // null = show all summary

  const deals      = state.deals       || [];
  const spRoster   = state.salespeople || [];

  // Build the list of salespeople from the roster (names only, filtered to those with deals)
  const spNames = spRoster.map(s => s.name).filter(Boolean);

  const companyPacks = state.companyPacks || { packNew: "", packUsed: "", packCompany: "" };

  // Pack lookup: N/U drives New vs Used company pack
  const getPack = (spName, newUsed) => {
    const raw = newUsed === "New" ? companyPacks.packNew : companyPacks.packUsed;
    return parseFloat(raw) || 0;
  };

  // Build per-salesperson deal rows — a sp appears as primary OR 2nd salesperson
  const buildRows = (spName) => {
    const rows = [];
    for (const d of deals) {
      const isPrimary = d.salesperson === spName;
      const isSplit   = d.salesperson2 === spName;
      if (!isPrimary && !isSplit) continue;

      const hasSplit  = !!(d.salesperson2 && d.salesperson2 !== d.salesperson);
      const commPct   = hasSplit ? 0.125 : 0.25;
      const pack      = getPack(spName, d.newUsed);
      const front     = parseFloat(d.frontGross) || 0;
      const commBase  = Math.max(front - pack, 0);
      const commission = commBase * commPct;

      rows.push({
        dealNum:    d.dealNum || "",
        stock:      d.stock   || "",
        customer:   d.customer || "",
        newUsed:    d.newUsed  || "",
        year:       d.year     || "",
        make:       d.make     || "",
        model:      d.model    || "",
        sp2:        d.salesperson2 || "",
        frontGross: front,
        pack,
        commPct,
        commBase,
        commission,
        isSplit:    hasSplit,
        role:       isPrimary ? "Primary" : "Split",
      });
    }
    return rows;
  };

  // Summary row per salesperson
  const summary = spNames.map(name => {
    const rows = buildRows(name);
    const totalFront = rows.reduce((a, r) => a + r.frontGross, 0);
    const totalComm  = rows.reduce((a, r) => a + r.commission, 0);
    const deals_     = rows.length;
    const splits     = rows.filter(r => r.isSplit).length;
    return { name, rows, totalFront, totalComm, deals: deals_, splits };
  }).filter(s => s.deals > 0 || spNames.length > 0);

  // Also show roster members with 0 deals
  const allSP = spNames.map(name => {
    const found = summary.find(s => s.name === name);
    return found || { name, rows: [], totalFront: 0, totalComm: 0, deals: 0, splits: 0 };
  });

  const grandTotalComm  = allSP.reduce((a, s) => a + s.totalComm, 0);
  const grandTotalDeals = allSP.reduce((a, s) => a + s.deals, 0);

  const active = activeSP ? allSP.find(s => s.name === activeSP) : null;

  // ── styles ──────────────────────────────────────────────────────
  const S = {
    page:       { display: "flex", flexDirection: "column", gap: 16 },
    // summary grid
    spGrid:     { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 },
    spCard:     { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: 16, cursor: "pointer", transition: "border-color .15s" },
    spCardAct:  { background: "#0f172a", border: "1px solid #22d3ee", borderRadius: 10, padding: 16, cursor: "pointer" },
    spName:     { fontSize: 13, fontWeight: 800, color: "#e2e8f0", letterSpacing: 0.5, marginBottom: 10, textTransform: "uppercase" },
    spStat:     { display: "flex", justifyContent: "space-between", marginBottom: 4 },
    spLbl:      { fontSize: 11, color: "#64748b", letterSpacing: 1, textTransform: "uppercase" },
    spVal:      { fontSize: 13, fontWeight: 700 },
    noDeals:    { color: "#374151", fontStyle: "italic" },
    // detail panel
    panel:      { background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: 10, padding: 20 },
    panelHdr:   { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    panelTitle: { fontSize: 16, fontWeight: 800, color: "#22d3ee", letterSpacing: 1, textTransform: "uppercase" },
    closeBtn:   { padding: "5px 14px", borderRadius: 6, border: "1px solid #334155", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 12, fontFamily: "inherit" },
    // table
    tblWrap:    { overflowX: "auto" },
    tbl:        { width: "100%", borderCollapse: "collapse", fontSize: 12 },
    th:         { background: "#1e293b", color: "#64748b", padding: "9px 10px", textAlign: "left", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", border: "1px solid #1e293b", whiteSpace: "nowrap" },
    thR:        { background: "#1e293b", color: "#64748b", padding: "9px 10px", textAlign: "right", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", border: "1px solid #1e293b", whiteSpace: "nowrap" },
    td:         { padding: "8px 10px", border: "1px solid #1e293b", color: "#cbd5e1", verticalAlign: "middle", whiteSpace: "nowrap" },
    tdR:        { padding: "8px 10px", border: "1px solid #1e293b", color: "#cbd5e1", verticalAlign: "middle", whiteSpace: "nowrap", textAlign: "right" },
    tdFoot:     { padding: "9px 10px", border: "1px solid #1e293b", fontWeight: 800, background: "#1e293b", whiteSpace: "nowrap" },
    tdFootR:    { padding: "9px 10px", border: "1px solid #1e293b", fontWeight: 800, background: "#1e293b", whiteSpace: "nowrap", textAlign: "right" },
    badge:      { padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700 },
    // summary totals bar
    totBar:     { display: "flex", gap: 12, flexWrap: "wrap" },
    totPill:    { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 20px", textAlign: "center", minWidth: 140 },
  };

  const $f = (n) => n == null || isNaN(n) ? "—" :
    "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const pctFmt = (p) => (p * 100).toFixed(1) + "%";

  if (spNames.length === 0) {
    return (
      <div style={{ ...S.panel, textAlign: "center", color: "#374151", padding: 48 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
        <div style={{ fontSize: 14 }}>No salespeople on the roster yet.</div>
        <div style={{ fontSize: 12, marginTop: 6 }}>Add salespeople on the <strong style={{ color: "#22d3ee" }}>Roster</strong> tab to generate washout sheets.</div>
      </div>
    );
  }

  return (
    <div style={S.page}>

      {/* ── GRAND TOTALS BAR ─────────────────────────────────────── */}
      <div style={S.totBar}>
        {[
          { label: "Salespeople",    val: allSP.length,          color: "#22d3ee" },
          { label: "Active w/ Deals",val: allSP.filter(s=>s.deals>0).length, color: "#34d399" },
          { label: "Total Deals",    val: grandTotalDeals,        color: "#fbbf24" },
          { label: "Total SP Comm",  val: $f(grandTotalComm),     color: "#a78bfa" },
        ].map(p => (
          <div key={p.label} style={S.totPill}>
            <div style={{ fontSize: 18, fontWeight: 800, color: p.color }}>{p.val}</div>
            <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 1, marginTop: 2, textTransform: "uppercase" }}>{p.label}</div>
          </div>
        ))}
      </div>

      {/* ── SALESPERSON CARDS ────────────────────────────────────── */}
      <div style={S.spGrid}>
        {allSP.map(sp => {
          const isActive = activeSP === sp.name;
          return (
            <div key={sp.name}
              style={isActive ? S.spCardAct : S.spCard}
              onClick={() => setActiveSP(isActive ? null : sp.name)}>
              <div style={S.spName}>{sp.name}</div>
              {sp.deals === 0 ? (
                <div style={S.noDeals}>No deals logged</div>
              ) : (
                <>
                  <div style={S.spStat}>
                    <span style={S.spLbl}>Deals</span>
                    <span style={{ ...S.spVal, color: "#22d3ee" }}>{sp.deals}</span>
                  </div>
                  {sp.splits > 0 && (
                    <div style={S.spStat}>
                      <span style={S.spLbl}>Splits</span>
                      <span style={{ ...S.spVal, color: "#fbbf24" }}>{sp.splits}</span>
                    </div>
                  )}
                  <div style={S.spStat}>
                    <span style={S.spLbl}>Front Gross</span>
                    <span style={{ ...S.spVal, color: "#34d399" }}>{$f(sp.totalFront)}</span>
                  </div>
                  <div style={{ ...S.spStat, marginTop: 6, paddingTop: 6, borderTop: "1px solid #1e293b" }}>
                    <span style={{ ...S.spLbl, color: "#a78bfa" }}>Commission</span>
                    <span style={{ ...S.spVal, color: "#a78bfa", fontSize: 15 }}>{$f(sp.totalComm)}</span>
                  </div>
                </>
              )}
              {sp.deals > 0 && (
                <div style={{ marginTop: 8, fontSize: 11, color: isActive ? "#22d3ee" : "#475569", textAlign: "right" }}>
                  {isActive ? "▲ collapse" : "▼ view deals"}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── DETAIL TABLE for selected SP ─────────────────────────── */}
      {active && active.deals > 0 && (
        <div style={S.panel}>
          <div style={S.panelHdr}>
            <span style={S.panelTitle}>💰 {active.name} — Washout</span>
            <button style={S.closeBtn} onClick={() => setActiveSP(null)}>✕ Close</button>
          </div>

          <div style={S.tblWrap}>
            <table style={S.tbl}>
              <thead>
                <tr>
                  <th style={S.th}>Deal #</th>
                  <th style={S.th}>Stock #</th>
                  <th style={S.th}>Customer</th>
                  <th style={S.th}>N/U</th>
                  <th style={S.th}>Year</th>
                  <th style={S.th}>Make</th>
                  <th style={S.th}>Model</th>
                  <th style={S.th}>2nd SP</th>
                  <th style={S.th}>Role</th>
                  <th style={S.thR}>Front Gross</th>
                  <th style={S.thR}>Pack</th>
                  <th style={S.thR}>Comm Base</th>
                  <th style={S.thR}>Comm %</th>
                  <th style={S.thR}>Commission</th>
                  <th style={S.th}>Split</th>
                </tr>
              </thead>
              <tbody>
                {active.rows.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "#0a0f1e" }}>
                    <td style={{ ...S.td, color: "#22d3ee", fontWeight: 700 }}>{r.dealNum || "—"}</td>
                    <td style={{ ...S.td, color: "#7dd3fc" }}>{r.stock || "—"}</td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{r.customer || "—"}</td>
                    <td style={S.td}>
                      <span style={{ ...S.badge, background: r.newUsed === "New" ? "#064e3b" : "#451a03", color: r.newUsed === "New" ? "#34d399" : "#fbbf24" }}>
                        {r.newUsed || "—"}
                      </span>
                    </td>
                    <td style={S.td}>{r.year}</td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{r.make}</td>
                    <td style={S.td}>{r.model}</td>
                    <td style={{ ...S.td, color: "#94a3b8" }}>{r.sp2 || "—"}</td>
                    <td style={S.td}>
                      <span style={{ ...S.badge, background: r.role === "Primary" ? "#1e3a5f" : "#2d1b6e", color: r.role === "Primary" ? "#7dd3fc" : "#c4b5fd" }}>
                        {r.role}
                      </span>
                    </td>
                    <td style={{ ...S.tdR, color: "#34d399" }}>{$f(r.frontGross)}</td>
                    <td style={{ ...S.tdR, color: "#f87171" }}>({$f(r.pack)})</td>
                    <td style={{ ...S.tdR, color: "#e2e8f0" }}>{$f(r.commBase)}</td>
                    <td style={{ ...S.tdR, color: "#64748b" }}>{pctFmt(r.commPct)}</td>
                    <td style={{ ...S.tdR, color: "#a78bfa", fontWeight: 800, fontSize: 13 }}>{$f(r.commission)}</td>
                    <td style={{ ...S.td, textAlign: "center" }}>
                      {r.isSplit
                        ? <span style={{ ...S.badge, background: "#422006", color: "#fb923c" }}>½ Split</span>
                        : <span style={{ ...S.badge, background: "#064e3b", color: "#34d399" }}>Full</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td style={{ ...S.tdFoot, color: "#64748b" }} colSpan={9}>TOTAL — {active.deals} deal{active.deals !== 1 ? "s" : ""}</td>
                  <td style={{ ...S.tdFootR, color: "#34d399" }}>{$f(active.totalFront)}</td>
                  <td style={S.tdFoot}></td>
                  <td style={S.tdFoot}></td>
                  <td style={S.tdFoot}></td>
                  <td style={{ ...S.tdFootR, color: "#a78bfa", fontSize: 15 }}>{$f(active.totalComm)}</td>
                  <td style={S.tdFoot}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* ── commission summary box ── */}
          <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            {[
              { label: "Total Deals",    val: active.deals,           color: "#22d3ee" },
              { label: "Split Deals",    val: active.splits,          color: "#fbbf24" },
              { label: "Full Deals",     val: active.deals - active.splits, color: "#34d399" },
              { label: "Total Front",    val: $f(active.totalFront),  color: "#34d399" },
              { label: "Total Commission", val: $f(active.totalComm), color: "#a78bfa" },
            ].map(p => (
              <div key={p.label} style={{ background: "#1e293b", borderRadius: 8, padding: "10px 18px", textAlign: "center", minWidth: 130 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: p.color }}>{p.val}</div>
                <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 1, marginTop: 2, textTransform: "uppercase" }}>{p.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


function RosterTab({ state, update, showFlash }) {
  const [showPw, setShowPw] = useState({});
  const [credExpanded, setCredExpanded] = useState({});

  const sp      = state.salespeople  || [];
  const mgrs    = state.managers     || [];
  const tl      = state.teamLeader   || {};
  const di      = state.dealerInfo   || {};
  const mkt     = state.marketingInfo|| {};
  const packs   = state.companyPacks || { packNew: "", packUsed: "", packCompany: "" };
  const lenders = state.lenders      || [];
  const creds   = state.credentials  || [];

  // ── helpers ──────────────────────────────────────────────────────
  const setSP = (id, field, val) =>
    update({ salespeople: sp.map(r => r.id === id ? { ...r, [field]: val } : r) });
  const addSP = () =>
    update({ salespeople: [...sp, { id: uid(), name: "", number: "", email: "", confirmed: false, notes: "" }] });
  const removeSP = (id) =>
    update({ salespeople: sp.filter(r => r.id !== id) });

  const setMgr = (id, field, val) =>
    update({ managers: mgrs.map(r => r.id === id ? { ...r, [field]: val } : r) });

  const setTL = (field, val) => update({ teamLeader: { ...tl, [field]: val } });
  const setDI = (field, val) => update({ dealerInfo: { ...di, [field]: val } });
  const setMkt = (field, val) => update({ marketingInfo: { ...mkt, [field]: val } });
  const setPacks = (field, val) => update({ companyPacks: { ...packs, [field]: val } });

  const setLender = (id, field, val) =>
    update({ lenders: lenders.map(r => r.id === id ? { ...r, [field]: val } : r) });
  const addLender = () =>
    update({ lenders: [...lenders, { id: uid(), name: "", note: "" }] });
  const removeLender = (id) =>
    update({ lenders: lenders.filter(r => r.id !== id) });

  const setCred = (id, field, val) =>
    update({ credentials: creds.map(r => r.id === id ? { ...r, [field]: val } : r) });
  const addCred = () =>
    update({ credentials: [...creds, { id: uid(), type: "", username: "", password: "", email: "", challengeQ: "", challengeA: "" }] });
  const removeCred = (id) =>
    update({ credentials: creds.filter(r => r.id !== id) });

  const addMgr = () =>
    update({ managers: [...mgrs, { id: uid(), name: "", number: "", email: "", confirmed: false, commPct: "" }] });
  const removeMgr = (id) =>
    update({ managers: mgrs.filter(r => r.id !== id) });

  const save = () => { showFlash("Roster saved ✓"); };

  // ── inline styles ────────────────────────────────────────────────
  const S = {
    page:       { display: "flex", flexDirection: "column", gap: 20 },
    section:    { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: 20 },
    secHead:    { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    secTitle:   { fontSize: 13, fontWeight: 800, color: "#22d3ee", letterSpacing: 2, textTransform: "uppercase" },
    tbl:        { width: "100%", borderCollapse: "collapse", fontSize: 13 },
    th:         { background: "#1e293b", color: "#64748b", padding: "8px 10px", textAlign: "left", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", border: "1px solid #1e293b" },
    td:         { padding: "7px 8px", border: "1px solid #1e293b", verticalAlign: "middle" },
    inp:        { width: "100%", padding: "5px 8px", borderRadius: 5, border: "1px solid #334155", background: "#1e293b", color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" },
    inpSm:      { width: "100%", padding: "5px 8px", borderRadius: 5, border: "1px solid #334155", background: "#1e293b", color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" },
    chk:        { width: 16, height: 16, cursor: "pointer", accentColor: "#22d3ee" },
    confY:      { color: "#34d399", fontWeight: 800, fontSize: 13 },
    confN:      { color: "#f87171", fontWeight: 800, fontSize: 13 },
    addBtn:     { padding: "5px 14px", borderRadius: 6, border: "1px solid #22d3ee", background: "transparent", color: "#22d3ee", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
    delBtn:     { padding: "3px 8px", borderRadius: 4, border: "none", background: "#7f1d1d", color: "#fca5a5", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
    saveBtn:    { padding: "10px 28px", borderRadius: 7, border: "none", background: "#0e7490", color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 14, fontFamily: "inherit", marginTop: 8 },
    g2:         { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
    g3:         { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 },
    g4:         { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 },
    lbl:        { fontSize: 11, color: "#64748b", letterSpacing: 1, textTransform: "uppercase", marginBottom: 3, display: "block" },
    fWrap:      { display: "flex", flexDirection: "column" },
    pwWrap:     { position: "relative", display: "flex", alignItems: "center" },
    eyeBtn:     { position: "absolute", right: 6, background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 14, padding: 0, lineHeight: 1 },
    credCard:   { background: "#1e293b", border: "1px solid #334155", borderRadius: 8, marginBottom: 12 },
    credHead:   { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", cursor: "pointer" },
    credBody:   { padding: "12px 14px", borderTop: "1px solid #334155" },
    lenderRow:  { display: "flex", gap: 8, alignItems: "center", marginBottom: 8 },
  };

  return (
    <div style={S.page}>

      {/* ── SALESPEOPLE ─────────────────────────────────────────── */}
      <div style={S.section}>
        <div style={S.secHead}>
          <span style={S.secTitle}>👤 Salespeople</span>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>{sp.filter(r => r.confirmed).length}/{sp.length} confirmed</span>
            <button style={S.addBtn} onClick={addSP}>+ Add Salesperson</button>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={S.tbl}>
            <thead>
              <tr>
                {["#","Name","Phone","Email","Confirmed","Notes",""].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sp.map((row, i) => (
                <tr key={row.id} style={{ background: i % 2 === 0 ? "transparent" : "#0a0f1e" }}>
                  <td style={{ ...S.td, color: "#475569", width: 28, textAlign: "center" }}>{i + 1}</td>
                  <td style={{ ...S.td, minWidth: 160 }}>
                    <input value={row.name} onChange={e => setSP(row.id, "name", e.target.value)} style={S.inp} />
                  </td>
                  <td style={{ ...S.td, minWidth: 130 }}>
                    <input value={row.number} onChange={e => setSP(row.id, "number", e.target.value)} style={S.inp} placeholder="(xxx) xxx-xxxx" />
                  </td>
                  <td style={{ ...S.td, minWidth: 190 }}>
                    <input value={row.email} onChange={e => setSP(row.id, "email", e.target.value)} style={S.inp} placeholder="email@..." />
                  </td>
                  <td style={{ ...S.td, textAlign: "center", width: 80 }}>
                    <input type="checkbox" checked={!!row.confirmed}
                      onChange={e => setSP(row.id, "confirmed", e.target.checked)} style={S.chk} />
                    <span style={{ marginLeft: 6, ...(row.confirmed ? S.confY : S.confN) }}>
                      {row.confirmed ? "Y" : "N"}
                    </span>
                  </td>
                  <td style={{ ...S.td, minWidth: 220 }}>
                    <input value={row.notes || ""} onChange={e => setSP(row.id, "notes", e.target.value)} style={S.inp} placeholder="Optional notes…" />
                  </td>
                  <td style={{ ...S.td, width: 40, textAlign: "center" }}>
                    <button style={S.delBtn} onClick={() => removeSP(row.id)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MANAGERS ────────────────────────────────────────────── */}
      <div style={S.section}>
        <div style={S.secHead}>
          <span style={S.secTitle}>🤝 Managers</span>
          <button style={S.addBtn} onClick={addMgr}>+ Add Manager</button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={S.tbl}>
            <thead>
              <tr>
                {["Name","Phone","Email","Confirmed","Comm %",""].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mgrs.map((row, i) => (
                <tr key={row.id} style={{ background: i % 2 === 0 ? "transparent" : "#0a0f1e" }}>
                  <td style={{ ...S.td, minWidth: 160 }}>
                    <input value={row.name} onChange={e => setMgr(row.id, "name", e.target.value)} style={S.inp} placeholder="Name" />
                  </td>
                  <td style={{ ...S.td, minWidth: 130 }}>
                    <input value={row.number} onChange={e => setMgr(row.id, "number", e.target.value)} style={S.inp} placeholder="(xxx) xxx-xxxx" />
                  </td>
                  <td style={{ ...S.td, minWidth: 190 }}>
                    <input value={row.email} onChange={e => setMgr(row.id, "email", e.target.value)} style={S.inp} placeholder="email@..." />
                  </td>
                  <td style={{ ...S.td, textAlign: "center", width: 80 }}>
                    <input type="checkbox" checked={!!row.confirmed}
                      onChange={e => setMgr(row.id, "confirmed", e.target.checked)} style={S.chk} />
                    <span style={{ marginLeft: 6, ...(row.confirmed ? S.confY : S.confN) }}>
                      {row.confirmed ? "Y" : "N"}
                    </span>
                  </td>
                  <td style={{ ...S.td, width: 80 }}>
                    <input value={row.commPct} onChange={e => setMgr(row.id, "commPct", e.target.value)} style={S.inp} placeholder="%" />
                  </td>
                  <td style={{ ...S.td, width: 50, textAlign: "center" }}>
                    <button style={S.delBtn} onClick={() => removeMgr(row.id)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── TEAM LEADER ─────────────────────────────────────────── */}
      <div style={S.section}>
        <div style={S.secHead}><span style={S.secTitle}>⭐ Team Leader</span></div>
        <div style={S.g4}>
          <FW label="Name"   value={tl.name}    onChange={v => setTL("name", v)} />
          <FW label="Phone"  value={tl.number}  onChange={v => setTL("number", v)} placeholder="(xxx) xxx-xxxx" />
          <FW label="Email"  value={tl.email}   onChange={v => setTL("email", v)} placeholder="email@..." />
          <FW label="Comm %" value={tl.commPct} onChange={v => setTL("commPct", v)} placeholder="%" />
        </div>
      </div>

      {/* ── DEALER INFORMATION ──────────────────────────────────── */}
      <div style={S.section}>
        <div style={S.secHead}><span style={S.secTitle}>🏢 Dealer Information</span></div>
        <div style={{ ...S.g4, marginBottom: 12 }}>
          <FW label="Dealer Name" value={di.dealerName} onChange={v => setDI("dealerName", v)} />
          <FW label="Street"      value={di.street}     onChange={v => setDI("street", v)} />
          <FW label="City"        value={di.city}       onChange={v => setDI("city", v)} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FW label="State" value={di.state} onChange={v => setDI("state", v)} />
            <FW label="Zip"   value={di.zip}   onChange={v => setDI("zip", v)} />
          </div>
        </div>
        <div style={S.g2}>
          <FW label="Sale Start Date" value={di.startDate} onChange={v => setDI("startDate", v)} type="date" />
          <FW label="Sale End Date"   value={di.endDate}   onChange={v => setDI("endDate", v)}   type="date" />
        </div>
      </div>

      {/* ── MARKETING INFORMATION ───────────────────────────────── */}
      <div style={S.section}>
        <div style={S.secHead}><span style={S.secTitle}>📬 Marketing Information</span></div>
        <div style={{ ...S.g4, marginBottom: 12 }}>
          <FW label="Mail Piece Type"     value={mkt.mailPieceType} onChange={v => setMkt("mailPieceType", v)} placeholder="e.g. Postcard 6x9" />
          <FW label="Mail Piece Quantity" value={mkt.mailPieceQty}  onChange={v => setMkt("mailPieceQty", v)}  placeholder="e.g. 90,036" />
          <FW label="Giveaway / Premium"  value={mkt.giveawayPremium} onChange={v => setMkt("giveawayPremium", v)} placeholder="e.g. $5 gift card" />
          <FW label="2nd Giveaway"        value={mkt.giveaway2}     onChange={v => setMkt("giveaway2", v)}     placeholder="e.g. Scratch ticket" />
        </div>
        <div style={S.g3}>
          <FW label="Drop 1 Date" value={mkt.drop1} onChange={v => setMkt("drop1", v)} type="date" />
          <FW label="Drop 2 Date" value={mkt.drop2} onChange={v => setMkt("drop2", v)} type="date" />
          <FW label="Drop 3 Date" value={mkt.drop3} onChange={v => setMkt("drop3", v)} type="date" />
        </div>
      </div>

      {/* ── COMPANY PACKS ───────────────────────────────────────── */}
      <div style={S.section}>
        <div style={S.secHead}><span style={S.secTitle}>📦 Company Packs</span></div>
        <div style={{ ...S.g3 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <FW label="Pack New"     value={packs.packNew}     onChange={v => setPacks("packNew", v)}     placeholder="$" />
            <span style={{ fontSize: 11, color: "#475569" }}>Applied to New vehicle deals</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <FW label="Pack Used"    value={packs.packUsed}    onChange={v => setPacks("packUsed", v)}    placeholder="$" />
            <span style={{ fontSize: 11, color: "#475569" }}>Applied to Used vehicle deals</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <FW label="Pack Company" value={packs.packCompany} onChange={v => setPacks("packCompany", v)} placeholder="$" />
            <span style={{ fontSize: 11, color: "#475569" }}>Dealer-level company pack</span>
          </div>
        </div>
      </div>

      {/* ── LENDERS ─────────────────────────────────────────────── */}
      <div style={S.section}>
        <div style={S.secHead}>
          <span style={S.secTitle}>🏦 Lenders</span>
          <button style={S.addBtn} onClick={addLender}>+ Add Lender</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px,1fr))", gap: 8 }}>
          {lenders.map(row => (
            <div key={row.id} style={{ display: "flex", gap: 8, alignItems: "center", background: "#1e293b", borderRadius: 7, padding: "8px 10px" }}>
              <input value={row.name} onChange={e => setLender(row.id, "name", e.target.value)}
                style={{ ...S.inp, width: 140, flexShrink: 0 }} placeholder="Lender name" />
              <input value={row.note} onChange={e => setLender(row.id, "note", e.target.value)}
                style={{ ...S.inp, flex: 1 }} placeholder="Note (optional)" />
              <button style={S.delBtn} onClick={() => removeLender(row.id)}>✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* ── DEALERSHIP CREDENTIALS ──────────────────────────────── */}
      <div style={S.section}>
        <div style={S.secHead}>
          <span style={S.secTitle}>🔐 Dealership Credentials</span>
          <button style={S.addBtn} onClick={addCred}>+ Add Credential</button>
        </div>
        <div style={{ fontSize: 11, color: "#ef4444", marginBottom: 10, letterSpacing: 0.5 }}>
          ⚠ Stored locally in browser only. Do not use on shared devices.
        </div>
        {creds.map(row => {
          const expanded = !!credExpanded[row.id];
          return (
            <div key={row.id} style={S.credCard}>
              <div style={S.credHead} onClick={() => setCredExpanded(prev => ({ ...prev, [row.id]: !expanded }))}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ color: "#a78bfa", fontWeight: 800, fontSize: 13 }}>
                    {row.type || "— Type —"}
                  </span>
                  {row.username && <span style={{ color: "#64748b", fontSize: 12 }}>@{row.username}</span>}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ color: "#64748b", fontSize: 13 }}>{expanded ? "▲" : "▼"}</span>
                  <button style={S.delBtn} onClick={e => { e.stopPropagation(); removeCred(row.id); }}>✕</button>
                </div>
              </div>
              {expanded && (
                <div style={S.credBody}>
                  <div style={{ ...S.g3, marginBottom: 10 }}>
                    <FW label="Type / System" value={row.type} onChange={v => setCred(row.id, "type", v)} placeholder="e.g. DMS, CRM, VIN..." />
                    <FW label="Username"      value={row.username} onChange={v => setCred(row.id, "username", v)} />
                    <div style={S.fWrap}>
                      <label style={S.lbl}>Password</label>
                      <div style={S.pwWrap}>
                        <input type={showPw[row.id] ? "text" : "password"} value={row.password || ""}
                          onChange={e => setCred(row.id, "password", e.target.value)}
                          style={{ ...S.inp, paddingRight: 28 }} />
                        <button style={S.eyeBtn} onClick={() => setShowPw(prev => ({ ...prev, [row.id]: !prev[row.id] }))}>
                          {showPw[row.id] ? "🙈" : "👁"}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div style={S.g2}>
                    <FW label="Email (if applicable)" value={row.email} onChange={v => setCred(row.id, "email", v)} placeholder="email@..." />
                    <FW label="Challenge Question"     value={row.challengeQ} onChange={v => setCred(row.id, "challengeQ", v)} placeholder="Question..." />
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <FW label="Challenge Answer" value={row.challengeA} onChange={v => setCred(row.id, "challengeA", v)} placeholder="Answer..." />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── SAVE BUTTON ─────────────────────────────────────────── */}
      <div>
        <button style={S.saveBtn} onClick={save}>💾 Save Roster</button>
      </div>

    </div>
  );
}

// ─── REUSABLE COMPONENTS ─────────────────────────────────────────────────────
function Card({ title, children }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>{title}</div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, span }) {
  return (
    <div style={{ ...styles.fieldWrap, gridColumn: span ? `span ${span}` : undefined }}>
      <label style={styles.fieldLabel}>{label}</label>
      <input type={type} value={value} placeholder={placeholder || ""} onChange={e => onChange(e.target.value)}
        style={styles.fieldInput} />
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder }) {
  return (
    <div style={styles.fieldWrap}>
      <label style={styles.fieldLabel}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={styles.fieldInput}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = {
  root:          { minHeight: "100vh", background: "#0a0f1e", color: "#e2e8f0", fontFamily: "'IBM Plex Mono', 'Fira Code', 'Courier New', monospace" },
  header:        { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "#0f172a", borderBottom: "2px solid #1e3a5f", flexWrap: "wrap", gap: 12 },
  headerLeft:    { display: "flex", alignItems: "center", gap: 14 },
  logo:          { fontSize: 28, fontWeight: 900, color: "#22d3ee", letterSpacing: -1, background: "#0f4c75", padding: "4px 12px", borderRadius: 6, border: "2px solid #22d3ee" },
  dealerName:    { fontSize: 20, fontWeight: 800, color: "#f1f5f9", letterSpacing: 1 },
  dealerSub:     { fontSize: 12, color: "#64748b", marginTop: 2 },
  headerStats:   { display: "flex", gap: 12, flexWrap: "wrap" },
  pill:          { textAlign: "center", minWidth: 90 },
  pillVal:       { fontSize: 18, fontWeight: 800, lineHeight: 1 },
  pillLabel:     { fontSize: 10, color: "#64748b", letterSpacing: 1, marginTop: 2 },
  flash:         { position: "fixed", top: 16, right: 16, zIndex: 999, padding: "10px 20px", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 14, boxShadow: "0 4px 20px rgba(0,0,0,.5)" },
  nav:           { display: "flex", gap: 4, padding: "10px 20px", background: "#0f172a", borderBottom: "1px solid #1e293b", flexWrap: "wrap" },
  navBtn:        { padding: "7px 14px", borderRadius: 6, border: "1px solid #1e293b", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit" },
  navBtnActive:  { background: "#1e3a5f", color: "#22d3ee", borderColor: "#22d3ee" },
  main:          { padding: "20px", maxWidth: 1600, margin: "0 auto" },
  grid3:         { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px,1fr))", gap: 16 },
  card:          { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: 18 },
  cardTitle:     { fontSize: 14, fontWeight: 800, color: "#22d3ee", letterSpacing: 1, marginBottom: 14, textTransform: "uppercase" },
  recapRow:      { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1e293b" },
  recapLabel:    { color: "#94a3b8", fontSize: 13 },
  recapVal:      { fontWeight: 700, fontSize: 15 },
  divider:       { height: 1, background: "#1e3a5f", margin: "10px 0" },
  toolBar:       { display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" },
  btnPrimary:    { padding: "9px 18px", borderRadius: 7, border: "none", background: "#0e7490", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: "inherit" },
  btnGhost:      { padding: "9px 18px", borderRadius: 7, border: "1px solid #374151", background: "transparent", color: "#94a3b8", fontWeight: 600, cursor: "pointer", fontSize: 13, fontFamily: "inherit" },
  btnSmall:      { padding: "4px 10px", borderRadius: 5, border: "none", background: "#065f46", color: "#34d399", fontWeight: 700, cursor: "pointer", fontSize: 12, fontFamily: "inherit" },
  badge:         { background: "#1e293b", color: "#94a3b8", padding: "6px 12px", borderRadius: 6, fontSize: 13, fontWeight: 600 },
  searchInput:   { padding: "8px 12px", borderRadius: 7, border: "1px solid #1e293b", background: "#1e293b", color: "#e2e8f0", fontSize: 14, fontFamily: "inherit", minWidth: 200 },
  formCard:      { background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: 10, padding: 20, marginBottom: 20 },
  formTitle:     { fontSize: 16, fontWeight: 800, color: "#22d3ee", marginBottom: 16 },
  formGrid:      { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px,1fr))", gap: 12, marginBottom: 12 },
  sectionLabel:  { fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 2, textTransform: "uppercase", margin: "14px 0 6px" },
  fieldWrap:     { display: "flex", flexDirection: "column", gap: 4 },
  fieldLabel:    { fontSize: 11, color: "#64748b", letterSpacing: 1, textTransform: "uppercase" },
  fieldInput:    { padding: "8px 10px", borderRadius: 6, border: "1px solid #1e293b", background: "#1e293b", color: "#e2e8f0", fontSize: 14, fontFamily: "inherit", outline: "none" },
  calcRow:       { display: "flex", gap: 16, margin: "14px 0", flexWrap: "wrap" },
  calcBox:       { background: "#1e293b", borderRadius: 8, padding: "10px 16px", flex: 1, minWidth: 140 },
  calcLabel:     { fontSize: 11, color: "#64748b", letterSpacing: 1, textTransform: "uppercase", display: "block" },
  calcVal:       { fontSize: 20, fontWeight: 800, color: "#22d3ee", display: "block", marginTop: 4 },
  formActions:   { display: "flex", gap: 10, marginTop: 16 },
  tableWrap:     { overflowX: "auto" },
  table:         { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th:            { background: "#0f172a", color: "#64748b", padding: "10px 10px", textAlign: "left", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", border: "1px solid #1e293b", whiteSpace: "nowrap" },
  td:            { padding: "9px 10px", border: "1px solid #1e293b", color: "#cbd5e1", whiteSpace: "nowrap", verticalAlign: "middle" },
  emptyRow:      { padding: 24, textAlign: "center", color: "#374151", fontStyle: "italic" },
  tinyInput:     { width: 48, padding: "4px 6px", borderRadius: 4, border: "1px solid #374151", background: "#1e293b", color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", textAlign: "center" },
  fundedBtn:     { padding: "3px 8px", borderRadius: 4, border: "1px solid #374151", cursor: "pointer", fontSize: 11, fontWeight: 700, fontFamily: "inherit" },
  iconBtn:       { background: "transparent", border: "none", cursor: "pointer", fontSize: 16, padding: "0 4px" },
  repRow:        { display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid #1e293b" },
  repRank:       { width: 22, color: "#64748b", fontWeight: 700, fontSize: 13, textAlign: "right" },
  repName:       { width: 160, color: "#94a3b8", fontSize: 13, fontWeight: 600, flexShrink: 0 },
  repBar:        { flex: 1, height: 8, background: "#1e293b", borderRadius: 4, overflow: "hidden" },
  repBarFill:    { height: "100%", background: "linear-gradient(90deg,#0e7490,#22d3ee)", borderRadius: 4, transition: "width .4s ease" },
  repDeals:      { width: 60, color: "#64748b", fontSize: 12, textAlign: "right" },
  repFront:      { width: 90, color: "#fbbf24", fontSize: 13, fontWeight: 600, textAlign: "right" },
  repGross:      { width: 90, color: "#22d3ee", fontSize: 13, fontWeight: 700, textAlign: "right" },
  repComm:       { width: 90, color: "#a78bfa", fontSize: 13, fontWeight: 600, textAlign: "right" },
  rosterItem:    { display: "flex", gap: 10, padding: "7px 0", borderBottom: "1px solid #1e293b", alignItems: "center" },
  rosterNum:     { color: "#374151", fontSize: 12, width: 20, textAlign: "right" },
  rosterName:    { color: "#94a3b8", fontSize: 13, fontWeight: 600 },
};
