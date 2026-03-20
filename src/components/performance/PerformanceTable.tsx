"use client";

import { useEffect, useState, useCallback } from "react";
import { getDealsByEvent } from "@/lib/supabase/queries/deals";
import { getSalespeopleByEvent } from "@/lib/supabase/queries/salespeople";
import { calcCommission, calcPack } from "@/lib/calculations";
import { formatCurrency } from "@/lib/formatters";
import { SalespersonType } from "@/types/enums";
import type { DealRow, SalespersonRow } from "@/types/database";

interface Props {
  eventId: string;
  packNew: number;
  packUsed: number;
  packCompany: number;
}

interface RepStats {
  id: string;
  name: string;
  dealCount: number; // full deals
  splitCount: number; // split deals (counted as 0.5)
  units: number; // dealCount + splitCount * 0.5
  frontGross: number;
  fiTotal: number;
  totalGross: number;
  commission: number;
}

export default function PerformanceTable({
  eventId,
  packNew,
  packUsed,
  packCompany,
}: Props) {
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [salespeople, setSalespeople] = useState<SalespersonRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [d, sp] = await Promise.all([
        getDealsByEvent(eventId),
        getSalespeopleByEvent(eventId),
      ]);
      setDeals(d);
      setSalespeople(sp);
    } catch (err) {
      console.error("Failed to load performance data:", err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-jde-muted">
        Loading performance...
      </div>
    );
  }

  // ── Build rep stats ───────────────────────────────────────────────────────
  const reps = salespeople.filter(
    (sp) => sp.type === SalespersonType.Rep || sp.type === SalespersonType.TeamLeader
  );
  const repMap = new Map<string, SalespersonRow>();
  reps.forEach((r) => repMap.set(r.id, r));

  const statsMap = new Map<string, RepStats>();

  function getOrCreate(spId: string): RepStats {
    if (!statsMap.has(spId)) {
      const sp = repMap.get(spId);
      statsMap.set(spId, {
        id: spId,
        name: sp?.name || "Unknown",
        dealCount: 0,
        splitCount: 0,
        units: 0,
        frontGross: 0,
        fiTotal: 0,
        totalGross: 0,
        commission: 0,
      });
    }
    return statsMap.get(spId)!;
  }

  for (const deal of deals) {
    const hasSplit =
      deal.salesperson2_id != null &&
      deal.salesperson2_id !== deal.salesperson_id;
    const pack = calcPack(deal.new_used, packNew, packUsed, packCompany);
    const comm = calcCommission(deal.front_gross, pack, hasSplit);
    const fi = (deal.fi_total || 0);
    const front = deal.front_gross || 0;
    const gross = deal.total_gross || 0;

    // Primary salesperson
    if (deal.salesperson_id && repMap.has(deal.salesperson_id)) {
      const s = getOrCreate(deal.salesperson_id);
      if (hasSplit) {
        s.splitCount += 1;
      } else {
        s.dealCount += 1;
      }
      s.frontGross += front;
      s.fiTotal += fi;
      s.totalGross += gross;
      s.commission += comm;
    }

    // Split partner
    if (hasSplit && deal.salesperson2_id && repMap.has(deal.salesperson2_id)) {
      const s = getOrCreate(deal.salesperson2_id);
      s.splitCount += 1;
      s.frontGross += front;
      s.fiTotal += fi;
      s.totalGross += gross;
      s.commission += comm;
    }
  }

  // Calculate units (full + 0.5 per split)
  statsMap.forEach((s) => {
    s.units = s.dealCount + s.splitCount * 0.5;
  });

  // Sort by total gross descending
  const ranked = Array.from(statsMap.values())
    .filter((s) => s.dealCount > 0 || s.splitCount > 0)
    .sort((a, b) => b.totalGross - a.totalGross);

  // ── Derived stats for pills ───────────────────────────────────────────────
  const topPerformer = ranked[0] || null;
  const highestSingleDeal = deals.reduce(
    (max, d) => Math.max(max, d.total_gross || 0),
    0
  );
  const avgDealGross =
    deals.length > 0
      ? deals.reduce((s, d) => s + (d.total_gross || 0), 0) / deals.length
      : 0;

  // ── Totals ────────────────────────────────────────────────────────────────
  const totals = ranked.reduce(
    (acc, r) => ({
      units: acc.units + r.units,
      dealCount: acc.dealCount + r.dealCount,
      splitCount: acc.splitCount + r.splitCount,
      frontGross: acc.frontGross + r.frontGross,
      fiTotal: acc.fiTotal + r.fiTotal,
      totalGross: acc.totalGross + r.totalGross,
      commission: acc.commission + r.commission,
    }),
    {
      units: 0,
      dealCount: 0,
      splitCount: 0,
      frontGross: 0,
      fiTotal: 0,
      totalGross: 0,
      commission: 0,
    }
  );

  const maxGross = topPerformer?.totalGross || 1;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {/* Stat pills */}
      <div className="flex items-center gap-3 flex-wrap">
        {topPerformer && (
          <div className="px-3 py-1.5 rounded-lg bg-jde-warning/10 border border-jde-warning/30 text-sm">
            <span className="text-jde-warning/70 mr-1.5">Top Performer:</span>
            <span className="text-jde-warning font-bold">{topPerformer.name}</span>
            <span className="text-jde-warning/70 mx-1">·</span>
            <span className="text-jde-warning font-bold font-mono">
              {formatCurrency(topPerformer.totalGross)}
            </span>
          </div>
        )}
        <div className="px-3 py-1.5 rounded-lg bg-jde-cyan/10 border border-jde-cyan/30 text-sm">
          <span className="text-jde-cyan/70 mr-1.5">Highest Deal:</span>
          <span className="text-jde-cyan font-bold font-mono">
            {formatCurrency(highestSingleDeal)}
          </span>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-jde-purple/10 border border-jde-purple/30 text-sm">
          <span className="text-jde-purple/70 mr-1.5">Avg Deal Gross:</span>
          <span className="text-jde-purple font-bold font-mono">
            {formatCurrency(avgDealGross)}
          </span>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-jde-surface border border-jde-border rounded-xl p-5">
        <h3 className="text-xs font-extrabold text-jde-cyan tracking-widest uppercase mb-4">
          <span className="inline-block w-4 h-0.5 bg-jde-cyan mr-2 rounded-full" />
          Salesperson Leaderboard
        </h3>

        {ranked.length === 0 ? (
          <p className="text-jde-muted text-sm py-6 text-center">
            No deals recorded yet
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm min-w-[900px]">
              <thead>
                <tr>
                  {[
                    "#",
                    "Salesperson",
                    "",
                    "Units",
                    "Deals",
                    "Splits",
                    "Front Gross",
                    "F&I",
                    "Total Gross",
                    "Commission",
                    "Front PVR",
                  ].map((h) => (
                    <th
                      key={h}
                      className="bg-jde-panel text-jde-cyan px-2.5 py-2 text-left text-[11px] tracking-wider uppercase border-b border-jde-border font-semibold whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ranked.map((rep, i) => {
                  const isTop = i === 0;
                  const frontPVR =
                    rep.units > 0 ? rep.frontGross / rep.units : 0;
                  const barWidth = (rep.totalGross / maxGross) * 100;

                  return (
                    <tr
                      key={rep.id}
                      className={
                        isTop
                          ? "bg-jde-warning/5"
                          : i % 2 === 0
                          ? ""
                          : "bg-jde-bg"
                      }
                    >
                      {/* Rank */}
                      <td className="px-2.5 py-2.5 border-b border-jde-border w-8 text-center">
                        <span
                          className={`text-xs font-bold ${
                            isTop ? "text-jde-warning" : "text-slate-600"
                          }`}
                        >
                          {i + 1}
                        </span>
                      </td>
                      {/* Name */}
                      <td className="px-2.5 py-2.5 border-b border-jde-border min-w-[150px]">
                        <span
                          className={`text-sm font-semibold ${
                            isTop ? "text-jde-warning" : "text-jde-muted"
                          }`}
                        >
                          {rep.name}
                        </span>
                      </td>
                      {/* Bar */}
                      <td className="px-2 py-2.5 border-b border-jde-border min-w-[120px]">
                        <div className="h-2 bg-jde-panel rounded overflow-hidden">
                          <div
                            className="h-full rounded transition-all duration-400"
                            style={{
                              width: `${barWidth}%`,
                              background:
                                "linear-gradient(90deg, #0e7490, #22d3ee)",
                            }}
                          />
                        </div>
                      </td>
                      {/* Units */}
                      <td className="px-2.5 py-2.5 border-b border-jde-border text-right">
                        <span className="text-sm text-jde-text font-mono font-semibold">
                          {rep.units % 1 === 0
                            ? rep.units
                            : rep.units.toFixed(1)}
                        </span>
                      </td>
                      {/* Deals */}
                      <td className="px-2.5 py-2.5 border-b border-jde-border text-right">
                        <span className="text-sm text-slate-500 font-mono">
                          {rep.dealCount}
                        </span>
                      </td>
                      {/* Splits */}
                      <td className="px-2.5 py-2.5 border-b border-jde-border text-right">
                        <span className="text-sm text-slate-500 font-mono">
                          {rep.splitCount}
                        </span>
                      </td>
                      {/* Front Gross */}
                      <td className="px-2.5 py-2.5 border-b border-jde-border text-right">
                        <span className="text-sm text-jde-warning font-semibold font-mono">
                          {formatCurrency(rep.frontGross)}
                        </span>
                      </td>
                      {/* F&I */}
                      <td className="px-2.5 py-2.5 border-b border-jde-border text-right">
                        <span className="text-sm text-sky-300 font-mono">
                          {formatCurrency(rep.fiTotal)}
                        </span>
                      </td>
                      {/* Total Gross */}
                      <td className="px-2.5 py-2.5 border-b border-jde-border text-right">
                        <span
                          className={`text-sm font-bold font-mono ${
                            isTop ? "text-jde-warning" : "text-jde-cyan"
                          }`}
                        >
                          {formatCurrency(rep.totalGross)}
                        </span>
                      </td>
                      {/* Commission */}
                      <td className="px-2.5 py-2.5 border-b border-jde-border text-right">
                        <span className="text-sm text-jde-purple font-semibold font-mono">
                          {formatCurrency(rep.commission)}
                        </span>
                      </td>
                      {/* Front PVR */}
                      <td className="px-2.5 py-2.5 border-b border-jde-border text-right">
                        <span className="text-sm text-jde-muted font-mono">
                          {formatCurrency(frontPVR)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#0f2744] border-t-2 border-[#1e3a5f]">
                  <td className="px-2.5 py-2.5" />
                  <td className="px-2.5 py-2.5 text-sm font-extrabold text-jde-text tracking-wide">
                    TOTALS
                  </td>
                  <td className="px-2.5 py-2.5" />
                  <td className="px-2.5 py-2.5 text-right text-sm font-extrabold text-jde-text font-mono">
                    {totals.units % 1 === 0
                      ? totals.units
                      : totals.units.toFixed(1)}
                  </td>
                  <td className="px-2.5 py-2.5 text-right text-sm font-extrabold text-slate-400 font-mono">
                    {totals.dealCount}
                  </td>
                  <td className="px-2.5 py-2.5 text-right text-sm font-extrabold text-slate-400 font-mono">
                    {totals.splitCount}
                  </td>
                  <td className="px-2.5 py-2.5 text-right text-sm font-extrabold text-jde-warning font-mono">
                    {formatCurrency(totals.frontGross)}
                  </td>
                  <td className="px-2.5 py-2.5 text-right text-sm font-extrabold text-sky-300 font-mono">
                    {formatCurrency(totals.fiTotal)}
                  </td>
                  <td className="px-2.5 py-2.5 text-right text-sm font-extrabold text-jde-cyan font-mono">
                    {formatCurrency(totals.totalGross)}
                  </td>
                  <td className="px-2.5 py-2.5 text-right text-sm font-extrabold text-jde-purple font-mono">
                    {formatCurrency(totals.commission)}
                  </td>
                  <td className="px-2.5 py-2.5 text-right text-sm font-extrabold text-jde-muted font-mono">
                    {formatCurrency(
                      totals.units > 0
                        ? totals.frontGross / totals.units
                        : 0
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <p className="text-xs text-slate-600 mt-3">
          * Commission at 25% solo / 12.5% split of (front gross - pack).
          Split deals count as 0.5 units each.
        </p>
      </div>

      {/* Closer Leaderboard */}
      <CloserLeaderboard deals={deals} salespeople={salespeople} />
    </div>
  );
}

/* ── Closer Leaderboard ──────────────────────────────────────────────────── */

interface CloserStats {
  id: string;
  name: string;
  dealCount: number;
  frontGross: number;
  fiTotal: number;
  totalGross: number;
}

function CloserLeaderboard({
  deals,
  salespeople,
}: {
  deals: DealRow[];
  salespeople: SalespersonRow[];
}) {
  const spMap = new Map<string, SalespersonRow>();
  salespeople.forEach((sp) => spMap.set(sp.id, sp));

  const closerMap = new Map<string, CloserStats>();

  for (const deal of deals) {
    if (!deal.closer_id) continue;

    if (!closerMap.has(deal.closer_id)) {
      const sp = spMap.get(deal.closer_id);
      closerMap.set(deal.closer_id, {
        id: deal.closer_id,
        name: sp?.name || "Unknown",
        dealCount: 0,
        frontGross: 0,
        fiTotal: 0,
        totalGross: 0,
      });
    }

    const c = closerMap.get(deal.closer_id)!;
    c.dealCount += 1;
    c.frontGross += deal.front_gross || 0;
    c.fiTotal += deal.fi_total || 0;
    c.totalGross += deal.total_gross || 0;
  }

  const ranked = Array.from(closerMap.values())
    .filter((c) => c.dealCount > 0)
    .sort((a, b) => b.totalGross - a.totalGross);

  const maxGross = ranked[0]?.totalGross || 1;

  const totals = ranked.reduce(
    (acc, c) => ({
      dealCount: acc.dealCount + c.dealCount,
      frontGross: acc.frontGross + c.frontGross,
      fiTotal: acc.fiTotal + c.fiTotal,
      totalGross: acc.totalGross + c.totalGross,
    }),
    { dealCount: 0, frontGross: 0, fiTotal: 0, totalGross: 0 }
  );

  return (
    <div className="bg-jde-surface border border-jde-border rounded-xl p-5">
      <h3 className="text-xs font-extrabold text-jde-warning tracking-widest uppercase mb-4">
        <span className="inline-block w-4 h-0.5 bg-jde-warning mr-2 rounded-full" />
        Closer Leaderboard
      </h3>

      {ranked.length === 0 ? (
        <p className="text-jde-muted text-sm py-6 text-center">
          No closer data recorded yet
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm min-w-[700px]">
            <thead>
              <tr>
                {["#", "Closer", "", "Deals", "Front Gross", "F&I", "Total Gross", "Front PVR"].map(
                  (h) => (
                    <th
                      key={h}
                      className="bg-jde-panel text-jde-warning px-2.5 py-2 text-left text-[11px] tracking-wider uppercase border-b border-jde-border font-semibold whitespace-nowrap"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {ranked.map((closer, i) => {
                const isTop = i === 0;
                const frontPVR =
                  closer.dealCount > 0 ? closer.frontGross / closer.dealCount : 0;
                const barWidth = (closer.totalGross / maxGross) * 100;

                return (
                  <tr
                    key={closer.id}
                    className={
                      isTop
                        ? "bg-jde-warning/5"
                        : i % 2 === 0
                        ? ""
                        : "bg-jde-bg"
                    }
                  >
                    <td className="px-2.5 py-2.5 border-b border-jde-border w-8 text-center">
                      <span
                        className={`text-xs font-bold ${
                          isTop ? "text-jde-warning" : "text-slate-600"
                        }`}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-2.5 py-2.5 border-b border-jde-border min-w-[150px]">
                      <span
                        className={`text-sm font-semibold ${
                          isTop ? "text-jde-warning" : "text-jde-muted"
                        }`}
                      >
                        {closer.name}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 border-b border-jde-border min-w-[120px]">
                      <div className="h-2 bg-jde-panel rounded overflow-hidden">
                        <div
                          className="h-full rounded transition-all duration-400"
                          style={{
                            width: `${barWidth}%`,
                            background:
                              "linear-gradient(90deg, #92400e, #fbbf24)",
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-2.5 py-2.5 border-b border-jde-border text-right">
                      <span className="text-sm text-jde-text font-mono font-semibold">
                        {closer.dealCount}
                      </span>
                    </td>
                    <td className="px-2.5 py-2.5 border-b border-jde-border text-right">
                      <span className="text-sm text-jde-warning font-semibold font-mono">
                        {formatCurrency(closer.frontGross)}
                      </span>
                    </td>
                    <td className="px-2.5 py-2.5 border-b border-jde-border text-right">
                      <span className="text-sm text-sky-300 font-mono">
                        {formatCurrency(closer.fiTotal)}
                      </span>
                    </td>
                    <td className="px-2.5 py-2.5 border-b border-jde-border text-right">
                      <span
                        className={`text-sm font-bold font-mono ${
                          isTop ? "text-jde-warning" : "text-jde-cyan"
                        }`}
                      >
                        {formatCurrency(closer.totalGross)}
                      </span>
                    </td>
                    <td className="px-2.5 py-2.5 border-b border-jde-border text-right">
                      <span className="text-sm text-jde-muted font-mono">
                        {formatCurrency(frontPVR)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-[#0f2744] border-t-2 border-[#1e3a5f]">
                <td className="px-2.5 py-2.5" />
                <td className="px-2.5 py-2.5 text-sm font-extrabold text-jde-text tracking-wide">
                  TOTALS
                </td>
                <td className="px-2.5 py-2.5" />
                <td className="px-2.5 py-2.5 text-right text-sm font-extrabold text-jde-text font-mono">
                  {totals.dealCount}
                </td>
                <td className="px-2.5 py-2.5 text-right text-sm font-extrabold text-jde-warning font-mono">
                  {formatCurrency(totals.frontGross)}
                </td>
                <td className="px-2.5 py-2.5 text-right text-sm font-extrabold text-sky-300 font-mono">
                  {formatCurrency(totals.fiTotal)}
                </td>
                <td className="px-2.5 py-2.5 text-right text-sm font-extrabold text-jde-cyan font-mono">
                  {formatCurrency(totals.totalGross)}
                </td>
                <td className="px-2.5 py-2.5 text-right text-sm font-extrabold text-jde-muted font-mono">
                  {formatCurrency(
                    totals.dealCount > 0
                      ? totals.frontGross / totals.dealCount
                      : 0
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
