"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { formatCurrency } from "@/lib/formatters";
import type { DealRow, SalespersonRow } from "@/types/database";
import { SalespersonType } from "@/types/enums";

interface Props {
  eventId: string;
}

interface MailRow {
  zip_code: string;
  town: string | null;
  pieces_sent: number | null;
  day_1: number; day_2: number; day_3: number; day_4: number;
  day_5: number; day_6: number; day_7: number; day_8: number;
  day_9: number; day_10: number; day_11: number;
}

interface EventData {
  start_date: string | null;
  end_date: string | null;
  marketing_cost: number;
  mail_quantity: number | null;
}

export default function EventKPIPanel({ eventId }: Props) {
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [salespeople, setSalespeople] = useState<SalespersonRow[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [, setInventory] = useState<any[]>([]);
  const [mailRows, setMailRows] = useState<MailRow[]>([]);
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const load = useCallback(async () => {
    const [dRes, spRes, invRes, mtRes, evRes] = await Promise.all([
      supabase.from("deals").select("*").eq("event_id", eventId),
      supabase.from("salespeople").select("*").eq("event_id", eventId),
      supabase.from("inventory").select("*").eq("event_id", eventId),
      supabase.from("mail_tracking").select("*").eq("event_id", eventId),
      supabase.from("events").select("start_date,end_date,marketing_cost,mail_quantity").eq("id", eventId).single(),
    ]);
    setDeals((dRes.data || []) as DealRow[]);
    setSalespeople((spRes.data || []) as SalespersonRow[]);
    setInventory(invRes.data || []);
    setMailRows((mtRes.data || []) as MailRow[]);
    setEvent(evRes.data as EventData | null);
    setLoading(false);
  }, [eventId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="text-jde-muted py-8 text-center">Loading KPIs...</div>;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  function saleDays(): number {
    if (!event?.start_date || !event?.end_date) return 1;
    const s = new Date(event.start_date);
    const e = new Date(event.end_date);
    return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <MomentumPanel deals={deals} saleDays={saleDays()} />
      <TradeInPanel deals={deals} />
      <LenderPanel deals={deals} />
      <GeographicPanel deals={deals} mailRows={mailRows} />
      <ProductMixPanel deals={deals} />
      <SalespersonEfficiencyPanel deals={deals} salespeople={salespeople} saleDays={saleDays()} />
    </div>
  );
}

/* ── Shared KPI Row Component ──────────────────────────────────────────── */

function KPIRow({ label, value, color = "text-jde-text" }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-baseline py-1.5 border-b border-jde-border/30 last:border-0">
      <span className="text-sm text-jde-muted">{label}</span>
      <span className={`font-mono font-semibold text-sm ${color}`}>{value}</span>
    </div>
  );
}

function PanelHeader({ title, color = "bg-jde-cyan" }: { title: string; color?: string }) {
  return (
    <h3 className="text-xs font-extrabold text-jde-cyan tracking-widest uppercase mb-4">
      <span className={`inline-block w-4 h-0.5 ${color} mr-2 rounded-full`} />
      {title}
    </h3>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-jde-surface border border-jde-border rounded-xl p-5">
      {children}
    </div>
  );
}

/* ── Panel 1: Momentum & Timing ────────────────────────────────────────── */

function MomentumPanel({ deals, saleDays }: { deals: DealRow[]; saleDays: number }) {
  // Group deals by date
  const byDate = new Map<string, DealRow[]>();
  deals.forEach(d => {
    const date = d.deal_date || "unknown";
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)!.push(d);
  });

  const sortedDates = Array.from(byDate.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  // Hot Start: deals in first 2 days ÷ total
  const first2Days = sortedDates.slice(0, 2).reduce((s, [, d]) => s + d.length, 0);
  const hotStart = deals.length > 0 ? Math.round((first2Days / deals.length) * 100) : 0;

  // Weekend vs Weekday
  let weekdayDeals = 0, weekendDeals = 0;
  let weekdayGross = 0, weekendGross = 0;
  deals.forEach(d => {
    if (!d.deal_date) return;
    const day = new Date(d.deal_date + "T12:00:00").getDay();
    const isWeekend = day === 0 || day === 6;
    if (isWeekend) { weekendDeals++; weekendGross += d.total_gross || 0; }
    else { weekdayDeals++; weekdayGross += d.total_gross || 0; }
  });

  // Best / Worst day
  let bestDay = { date: "—", count: 0 };
  let worstDay = { date: "—", count: Infinity };
  sortedDates.forEach(([date, d]) => {
    if (d.length > bestDay.count) bestDay = { date, count: d.length };
    if (d.length < worstDay.count) worstDay = { date, count: d.length };
  });
  if (worstDay.count === Infinity) worstDay = { date: "—", count: 0 };

  // Day-over-day trend (simple: compare first half gross to second half)
  const halfIdx = Math.floor(sortedDates.length / 2);
  const firstHalfGross = sortedDates.slice(0, halfIdx).reduce((s, [, d]) => s + d.reduce((ss, dd) => ss + (dd.total_gross || 0), 0), 0);
  const secondHalfGross = sortedDates.slice(halfIdx).reduce((s, [, d]) => s + d.reduce((ss, dd) => ss + (dd.total_gross || 0), 0), 0);
  const trend = secondHalfGross > firstHalfGross ? "↑ Trending Up" : secondHalfGross < firstHalfGross ? "↓ Trending Down" : "→ Flat";
  const trendColor = secondHalfGross > firstHalfGross ? "text-jde-success" : secondHalfGross < firstHalfGross ? "text-jde-danger" : "text-jde-muted";

  // Closing streak: longest consecutive days with 5+ deals
  let maxStreak = 0, currentStreak = 0;
  sortedDates.forEach(([, d]) => {
    if (d.length >= 5) { currentStreak++; maxStreak = Math.max(maxStreak, currentStreak); }
    else { currentStreak = 0; }
  });

  // Best day formatted
  const fmtDate = (d: string) => {
    if (d === "—") return "—";
    try { return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
    catch { return d; }
  };

  return (
    <Panel>
      <PanelHeader title="Momentum & Timing" />
      <KPIRow label="Hot Start Score (first 2 days)" value={`${hotStart}%`} color={hotStart > 30 ? "text-jde-success" : "text-jde-warning"} />
      <KPIRow label="Deals / Day" value={(deals.length / saleDays).toFixed(1)} color="text-jde-cyan" />
      <KPIRow label="Best Day" value={`${fmtDate(bestDay.date)} (${bestDay.count} deals)`} color="text-jde-success" />
      <KPIRow label="Worst Day" value={`${fmtDate(worstDay.date)} (${worstDay.count} deals)`} color="text-jde-danger" />
      <KPIRow label="Weekday Deals" value={`${weekdayDeals} (avg ${weekdayDeals > 0 ? formatCurrency(weekdayGross / weekdayDeals) : "$0"})`} color="text-jde-text" />
      <KPIRow label="Weekend Deals" value={`${weekendDeals} (avg ${weekendDeals > 0 ? formatCurrency(weekendGross / weekendDeals) : "$0"})`} color="text-jde-text" />
      <KPIRow label="Gross Trend (1st half → 2nd)" value={trend} color={trendColor} />
      <KPIRow label="5+ Deal Streak" value={`${maxStreak} day${maxStreak !== 1 ? "s" : ""}`} color="text-jde-purple" />
    </Panel>
  );
}

/* ── Panel 2: Trade-In Intelligence ────────────────────────────────────── */

function TradeInPanel({ deals }: { deals: DealRow[] }) {
  const withTrade = deals.filter(d => d.acv != null && d.acv > 0);
  const withPayoff = withTrade.filter(d => d.payoff != null && d.payoff > 0);

  const avgAcv = withTrade.length > 0 ? withTrade.reduce((s, d) => s + (d.acv || 0), 0) / withTrade.length : 0;
  const avgPayoff = withPayoff.length > 0 ? withPayoff.reduce((s, d) => s + (d.payoff || 0), 0) / withPayoff.length : 0;

  // Equity analysis
  const withBoth = withTrade.filter(d => d.payoff != null);
  const positiveEquity = withBoth.filter(d => (d.acv || 0) >= (d.payoff || 0));
  const negativeEquity = withBoth.filter(d => (d.acv || 0) < (d.payoff || 0));
  const equityRate = withBoth.length > 0 ? Math.round((positiveEquity.length / withBoth.length) * 100) : 0;
  const avgNegEquity = negativeEquity.length > 0
    ? negativeEquity.reduce((s, d) => s + ((d.payoff || 0) - (d.acv || 0)), 0) / negativeEquity.length
    : 0;

  // Top trade-in makes
  const makeCounts = new Map<string, number>();
  withTrade.forEach(d => {
    const make = d.trade_make?.trim().toUpperCase();
    if (make) makeCounts.set(make, (makeCounts.get(make) || 0) + 1);
  });
  const topMakes = Array.from(makeCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);

  // Avg trade mileage
  const withMiles = withTrade.filter(d => d.trade_miles != null && d.trade_miles !== "");
  const parseMiles = (m: string | null) => {
    if (!m) return 0;
    const n = parseFloat(String(m).replace(/[^0-9.]/g, ""));
    return isNaN(n) ? 0 : n;
  };
  const milesValues = withMiles.map(d => parseMiles(d.trade_miles));
  // If values look like they're in K (e.g., 188), multiply. If already full (e.g., 188000), don't.
  const avgMiles = milesValues.length > 0 ? milesValues.reduce((s, v) => s + v, 0) / milesValues.length : 0;
  const milesFmt = avgMiles > 1000 ? Math.round(avgMiles).toLocaleString() : avgMiles > 0 ? Math.round(avgMiles) + "K" : "—";

  return (
    <Panel>
      <PanelHeader title="Trade-In Intelligence" color="bg-jde-warning" />
      <KPIRow label="Trades" value={`${withTrade.length} / ${deals.length} (${deals.length > 0 ? Math.round((withTrade.length / deals.length) * 100) : 0}%)`} color="text-jde-cyan" />
      <KPIRow label="Avg ACV" value={formatCurrency(avgAcv)} color="text-jde-success" />
      <KPIRow label="Avg Payoff" value={formatCurrency(avgPayoff)} color="text-jde-danger" />
      <KPIRow label="Positive Equity Rate" value={`${equityRate}% (${positiveEquity.length})`} color={equityRate > 50 ? "text-jde-success" : "text-jde-danger"} />
      <KPIRow label="Avg Negative Equity" value={avgNegEquity > 0 ? `-${formatCurrency(avgNegEquity)}` : "—"} color="text-jde-danger" />
      <KPIRow label="Avg Trade Mileage" value={milesFmt} color="text-jde-muted" />
      {topMakes.length > 0 && (
        <>
          <div className="text-[10px] uppercase tracking-wider text-jde-muted mt-3 mb-1">Top Trade-In Makes</div>
          {topMakes.map(([make, count]) => (
            <KPIRow key={make} label={make} value={String(count)} color="text-jde-warning" />
          ))}
        </>
      )}
    </Panel>
  );
}

/* ── Panel 3: Lender Mix & Finance ─────────────────────────────────────── */

function LenderPanel({ deals }: { deals: DealRow[] }) {
  // Lender breakdown
  const lenderCounts = new Map<string, { count: number; reserve: number }>();
  let totalRate = 0, rateCount = 0;
  let fundedCount = 0, cashCount = 0, financeCount = 0;

  deals.forEach(d => {
    const lender = d.lender?.trim().toUpperCase();
    if (lender && lender !== "CASH" && lender !== "") {
      financeCount++;
      if (!lenderCounts.has(lender)) lenderCounts.set(lender, { count: 0, reserve: 0 });
      const l = lenderCounts.get(lender)!;
      l.count++;
      l.reserve += d.reserve || 0;
    } else if (lender === "CASH" || (!lender && !d.rate)) {
      cashCount++;
    } else {
      financeCount++;
    }
    if (d.rate != null && d.rate > 0) { totalRate += d.rate; rateCount++; }
    if (d.funded) fundedCount++;
  });

  const avgRate = rateCount > 0 ? totalRate / rateCount : 0;
  const topLenders = Array.from(lenderCounts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  return (
    <Panel>
      <PanelHeader title="Lender Mix & Finance" color="bg-jde-purple" />
      <KPIRow label="Avg Rate" value={avgRate > 0 ? avgRate.toFixed(2) + "%" : "—"} color="text-jde-cyan" />
      <KPIRow label="Funded Rate" value={`${fundedCount} / ${deals.length} (${deals.length > 0 ? Math.round((fundedCount / deals.length) * 100) : 0}%)`} color={fundedCount > deals.length * 0.8 ? "text-jde-success" : "text-jde-warning"} />
      <KPIRow label="Cash Deals" value={String(cashCount)} color="text-jde-muted" />
      <KPIRow label="Financed Deals" value={String(financeCount)} color="text-jde-purple" />
      {topLenders.length > 0 && (
        <>
          <div className="text-[10px] uppercase tracking-wider text-jde-muted mt-3 mb-1">Top Lenders</div>
          {topLenders.map(([name, data]) => (
            <div key={name} className="flex justify-between items-baseline py-1.5 border-b border-jde-border/30 last:border-0">
              <span className="text-sm text-jde-muted truncate mr-2" style={{ maxWidth: "55%" }}>{name}</span>
              <span className="font-mono text-sm text-jde-text whitespace-nowrap">
                {data.count} deals · <span className="text-jde-success">{formatCurrency(data.count > 0 ? data.reserve / data.count : 0)}</span> avg res
              </span>
            </div>
          ))}
        </>
      )}
    </Panel>
  );
}

/* ── Panel 4: Geographic Insights ──────────────────────────────────────── */

function GeographicPanel({ deals, mailRows }: { deals: DealRow[]; mailRows: MailRow[] }) {
  // Customer ZIP counts
  const custZips = new Map<string, number>();
  deals.forEach(d => {
    const zip = d.customer_zip?.trim();
    if (zip) custZips.set(zip, (custZips.get(zip) || 0) + 1);
  });
  const topCustZips = Array.from(custZips.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const uniqueZips = custZips.size;

  // Mailed ZIPs set
  const mailedZips = new Set(mailRows.map(m => m.zip_code));

  // Deals from mailed vs non-mailed ZIPs
  let mailedDeals = 0, nonMailedDeals = 0;
  deals.forEach(d => {
    const zip = d.customer_zip?.trim();
    if (!zip) return;
    if (mailedZips.has(zip)) mailedDeals++;
    else nonMailedDeals++;
  });

  const totalUps = mailRows.reduce((s, r) => s + r.day_1 + r.day_2 + r.day_3 + r.day_4 + r.day_5 + r.day_6 + r.day_7 + r.day_8 + r.day_9 + r.day_10 + r.day_11, 0);

  return (
    <Panel>
      <PanelHeader title="Geographic Insights" color="bg-jde-success" />
      <KPIRow label="Unique Customer ZIPs" value={String(uniqueZips)} color="text-jde-cyan" />
      <KPIRow label="Deals from Mailed ZIPs" value={`${mailedDeals} (${deals.length > 0 ? Math.round((mailedDeals / deals.length) * 100) : 0}%)`} color="text-jde-success" />
      <KPIRow label="Deals from Non-Mailed ZIPs" value={`${nonMailedDeals} (${deals.length > 0 ? Math.round((nonMailedDeals / deals.length) * 100) : 0}%)`} color="text-jde-warning" />
      <KPIRow label="Mail → Deal Conversion" value={totalUps > 0 ? `${(mailedDeals / totalUps * 100).toFixed(1)}% of UPs` : "—"} color="text-jde-purple" />
      {topCustZips.length > 0 && (
        <>
          <div className="text-[10px] uppercase tracking-wider text-jde-muted mt-3 mb-1">Top Customer ZIPs</div>
          {topCustZips.map(([zip, count]) => (
            <KPIRow
              key={zip}
              label={`${zip}${mailedZips.has(zip) ? " 📬" : ""}`}
              value={`${count} deal${count !== 1 ? "s" : ""}`}
              color="text-jde-text"
            />
          ))}
        </>
      )}
    </Panel>
  );
}

/* ── Panel 5: Product Mix ──────────────────────────────────────────────── */

function ProductMixPanel({ deals }: { deals: DealRow[] }) {
  // Top models
  const modelCounts = new Map<string, { count: number; gross: number }>();
  deals.forEach(d => {
    const model = d.model?.trim().toUpperCase();
    if (!model) return;
    if (!modelCounts.has(model)) modelCounts.set(model, { count: 0, gross: 0 });
    const m = modelCounts.get(model)!;
    m.count++;
    m.gross += d.total_gross || 0;
  });
  const topModels = Array.from(modelCounts.entries()).sort((a, b) => b[1].count - a[1].count).slice(0, 5);

  // Class breakdown
  const classCounts = new Map<string, { count: number; gross: number; cost: number }>();
  deals.forEach(d => {
    // Infer class from make/model if not available — use new_used as proxy
    const cls = d.new_used || "Unknown";
    if (!classCounts.has(cls)) classCounts.set(cls, { count: 0, gross: 0, cost: 0 });
    const c = classCounts.get(cls)!;
    c.count++;
    c.gross += d.total_gross || 0;
    c.cost += d.cost || 0;
  });

  // New vs Used avg age
  const newDeals = deals.filter(d => d.new_used === "New");
  const usedDeals = deals.filter(d => d.new_used === "Used");
  const newAvgAge = newDeals.length > 0 ? newDeals.reduce((s, d) => s + (d.age || 0), 0) / newDeals.length : 0;
  const usedAvgAge = usedDeals.length > 0 ? usedDeals.reduce((s, d) => s + (d.age || 0), 0) / usedDeals.length : 0;

  // Avg gross by type
  const newAvgGross = newDeals.length > 0 ? newDeals.reduce((s, d) => s + (d.total_gross || 0), 0) / newDeals.length : 0;
  const usedAvgGross = usedDeals.length > 0 ? usedDeals.reduce((s, d) => s + (d.total_gross || 0), 0) / usedDeals.length : 0;

  return (
    <Panel>
      <PanelHeader title="Product Mix" color="bg-jde-warning" />
      <KPIRow label="New Deals" value={`${newDeals.length} · avg ${formatCurrency(newAvgGross)}`} color="text-jde-cyan" />
      <KPIRow label="Used Deals" value={`${usedDeals.length} · avg ${formatCurrency(usedAvgGross)}`} color="text-jde-warning" />
      <KPIRow label="New Avg Age (days)" value={newAvgAge > 0 ? Math.round(newAvgAge).toString() : "—"} color="text-jde-muted" />
      <KPIRow label="Used Avg Age (days)" value={usedAvgAge > 0 ? Math.round(usedAvgAge).toString() : "—"} color="text-jde-muted" />
      {topModels.length > 0 && (
        <>
          <div className="text-[10px] uppercase tracking-wider text-jde-muted mt-3 mb-1">Top Models Sold</div>
          {topModels.map(([model, data]) => (
            <div key={model} className="flex justify-between items-baseline py-1.5 border-b border-jde-border/30 last:border-0">
              <span className="text-sm text-jde-muted">{model}</span>
              <span className="font-mono text-sm text-jde-text">
                {data.count} · <span className="text-jde-success">{formatCurrency(data.count > 0 ? data.gross / data.count : 0)}</span> avg
              </span>
            </div>
          ))}
        </>
      )}
    </Panel>
  );
}

/* ── Panel 6: Salesperson Efficiency ───────────────────────────────────── */

function SalespersonEfficiencyPanel({ deals, salespeople, saleDays }: { deals: DealRow[]; salespeople: SalespersonRow[]; saleDays: number }) {
  const reps = salespeople.filter(sp => sp.type === SalespersonType.Rep || sp.type === SalespersonType.TeamLeader);

  // Active reps (those with at least 1 deal)
  const activeRepIds = new Set<string>();
  let splitDeals = 0;

  const repStats = new Map<string, { deals: number; gross: number }>();

  deals.forEach(d => {
    if (d.salesperson_id) {
      activeRepIds.add(d.salesperson_id);
      if (!repStats.has(d.salesperson_id)) repStats.set(d.salesperson_id, { deals: 0, gross: 0 });
      const s = repStats.get(d.salesperson_id)!;
      s.deals++;
      s.gross += d.total_gross || 0;
    }
    if (d.salesperson2_id && d.salesperson2_id !== d.salesperson_id) {
      activeRepIds.add(d.salesperson2_id);
      splitDeals++;
    }
  });

  const activeReps = activeRepIds.size;
  const inactiveReps = reps.length - activeReps;
  const carryRate = reps.length > 0 ? Math.round((inactiveReps / reps.length) * 100) : 0;
  const splitRate = deals.length > 0 ? Math.round((splitDeals / deals.length) * 100) : 0;
  const dealsPerActiveRep = activeReps > 0 ? (deals.length / activeReps).toFixed(1) : "0";
  const grossPerRepPerDay = activeReps > 0 && saleDays > 0
    ? formatCurrency(deals.reduce((s, d) => s + (d.total_gross || 0), 0) / activeReps / saleDays)
    : "$0";

  // Top rep by consistency (lowest std dev of daily deal counts)
  const repDailyCounts = new Map<string, Map<string, number>>();
  deals.forEach(d => {
    if (!d.salesperson_id || !d.deal_date) return;
    if (!repDailyCounts.has(d.salesperson_id)) repDailyCounts.set(d.salesperson_id, new Map());
    const daily = repDailyCounts.get(d.salesperson_id)!;
    daily.set(d.deal_date, (daily.get(d.deal_date) || 0) + 1);
  });

  let mostConsistent = { name: "—", stdDev: Infinity };
  const spMap = new Map(salespeople.map(sp => [sp.id, sp]));

  repDailyCounts.forEach((daily, spId) => {
    if (daily.size < 3) return; // need at least 3 days for meaningful std dev
    const vals = Array.from(daily.values());
    const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
    const variance = vals.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / vals.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev < mostConsistent.stdDev) {
      mostConsistent = { name: spMap.get(spId)?.name || "Unknown", stdDev };
    }
  });

  return (
    <Panel>
      <PanelHeader title="Salesperson Efficiency" color="bg-jde-purple" />
      <KPIRow label="Team Size (reps)" value={String(reps.length)} color="text-jde-text" />
      <KPIRow label="Active Reps (w/ deals)" value={String(activeReps)} color="text-jde-cyan" />
      <KPIRow label="Carry Rate (0 deals)" value={`${inactiveReps} reps (${carryRate}%)`} color={carryRate > 30 ? "text-jde-danger" : "text-jde-success"} />
      <KPIRow label="Deals per Active Rep" value={dealsPerActiveRep} color="text-jde-warning" />
      <KPIRow label="Gross / Rep / Day" value={grossPerRepPerDay} color="text-jde-success" />
      <KPIRow label="Split Deal Rate" value={`${splitDeals} (${splitRate}%)`} color="text-jde-purple" />
      <KPIRow label="Most Consistent Rep" value={mostConsistent.name !== "—" ? `${mostConsistent.name} (σ ${mostConsistent.stdDev.toFixed(1)})` : "—"} color="text-jde-cyan" />
    </Panel>
  );
}
