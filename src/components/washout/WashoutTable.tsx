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

interface WashoutRow {
  dealNum: string;
  customer: string;
  newUsed: string;
  year: number | null;
  make: string;
  model: string;
  sp2Name: string;
  role: "Primary" | "Split";
  frontGross: number;
  pack: number;
  commBase: number;
  commPct: number;
  commission: number;
  isSplit: boolean;
}

interface SPSummary {
  id: string;
  name: string;
  rows: WashoutRow[];
  totalFront: number;
  totalComm: number;
  dealCount: number;
  splits: number;
}

export default function WashoutTable({ eventId, packNew, packUsed, packCompany }: Props) {
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [salespeople, setSalespeople] = useState<SalespersonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSP, setActiveSP] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [d, sp] = await Promise.all([
        getDealsByEvent(eventId),
        getSalespeopleByEvent(eventId),
      ]);
      setDeals(d);
      setSalespeople(sp);
    } catch (err) {
      console.error("Failed to load washout data:", err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reps and team leaders appear in the washout (they earn commissions on deals)
  const reps = salespeople.filter(
    (s) => s.type === SalespersonType.Rep || s.type === SalespersonType.TeamLeader
  );

  // Build deal rows for a specific salesperson
  function buildRows(spId: string): WashoutRow[] {
    const rows: WashoutRow[] = [];

    for (const d of deals) {
      const isPrimary = d.salesperson_id === spId;
      const isSplitSP = d.salesperson2_id === spId;
      if (!isPrimary && !isSplitSP) continue;

      const hasSplit = !!(
        d.salesperson2_id &&
        d.salesperson2_id !== d.salesperson_id
      );
      const commPct = hasSplit ? 0.125 : 0.25;
      const pack = calcPack(d.new_used, packNew, packUsed, packCompany);
      const front = d.front_gross ?? 0;
      const commBase = Math.max(front - pack, 0);
      const commission = calcCommission(front, pack, hasSplit);

      // Resolve sp2 name
      const sp2 = hasSplit
        ? salespeople.find(
            (s) =>
              s.id === (isPrimary ? d.salesperson2_id : d.salesperson_id)
          )
        : null;

      rows.push({
        dealNum: d.deal_num || "",
        customer: d.customer_name || "",
        newUsed: d.new_used || "",
        year: d.year,
        make: d.make || "",
        model: d.model || "",
        sp2Name: sp2?.name || "",
        role: isPrimary ? "Primary" : "Split",
        frontGross: front,
        pack,
        commPct,
        commBase,
        commission,
        isSplit: hasSplit,
      });
    }
    return rows;
  }

  // Build summary for all reps
  const allSP: SPSummary[] = reps.map((sp) => {
    const rows = buildRows(sp.id);
    return {
      id: sp.id,
      name: sp.name,
      rows,
      totalFront: rows.reduce((a, r) => a + r.frontGross, 0),
      totalComm: rows.reduce((a, r) => a + r.commission, 0),
      dealCount: rows.length,
      splits: rows.filter((r) => r.isSplit).length,
    };
  });

  const grandTotalComm = allSP.reduce((a, s) => a + s.totalComm, 0);
  const grandTotalDeals = allSP.reduce((a, s) => a + s.dealCount, 0);
  const activeWithDeals = allSP.filter((s) => s.dealCount > 0).length;

  const active = activeSP ? allSP.find((s) => s.id === activeSP) : null;

  if (loading) {
    return (
      <div className="text-jde-muted py-8 text-center">
        Loading washout data...
      </div>
    );
  }

  if (reps.length === 0) {
    return (
      <div className="rounded-lg bg-jde-surface border border-jde-border p-12 text-center">
        <div className="text-3xl mb-3">👥</div>
        <div className="text-sm text-jde-muted">
          No salespeople on the roster yet.
        </div>
        <div className="text-xs text-jde-muted mt-1">
          Add salespeople on the{" "}
          <span className="text-jde-cyan font-semibold">Roster</span> tab to
          generate washout sheets.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Grand totals bar */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: "Salespeople", val: String(allSP.length), color: "text-jde-cyan" },
          { label: "Active w/ Deals", val: String(activeWithDeals), color: "text-jde-success" },
          { label: "Total Deals", val: String(grandTotalDeals), color: "text-jde-warning" },
          { label: "Total SP Comm", val: formatCurrency(grandTotalComm), color: "text-jde-purple" },
        ].map((p) => (
          <div
            key={p.label}
            className="bg-jde-surface border border-jde-border rounded-lg px-5 py-2.5 text-center min-w-[140px]"
          >
            <div className={`text-lg font-extrabold font-mono ${p.color}`}>
              {p.val}
            </div>
            <div className="text-[10px] text-jde-muted uppercase tracking-wider mt-0.5">
              {p.label}
            </div>
          </div>
        ))}
      </div>

      {/* Salesperson cards grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
        {allSP.map((sp) => {
          const isActive = activeSP === sp.id;
          return (
            <div
              key={sp.id}
              onClick={() => setActiveSP(isActive ? null : sp.id)}
              className={`rounded-lg p-4 cursor-pointer transition-colors ${
                isActive
                  ? "bg-jde-surface border border-jde-cyan shadow-glow-cyan"
                  : "bg-jde-surface border border-jde-border hover:border-jde-border/80"
              } ${sp.dealCount === 0 ? "opacity-50" : ""}`}
            >
              <div className="text-[13px] font-extrabold text-jde-text uppercase tracking-wide mb-2.5">
                {sp.name}
              </div>
              {sp.dealCount === 0 ? (
                <div className="text-jde-border italic text-sm">
                  No deals logged
                </div>
              ) : (
                <>
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] text-jde-muted uppercase tracking-wider">
                      Deals
                    </span>
                    <span className="text-[13px] font-bold text-jde-cyan font-mono">
                      {sp.dealCount}
                    </span>
                  </div>
                  {sp.splits > 0 && (
                    <div className="flex justify-between mb-1">
                      <span className="text-[11px] text-jde-muted uppercase tracking-wider">
                        Splits
                      </span>
                      <span className="text-[13px] font-bold text-jde-warning font-mono">
                        {sp.splits}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] text-jde-muted uppercase tracking-wider">
                      Front Gross
                    </span>
                    <span className="text-[13px] font-bold text-jde-success font-mono">
                      {formatCurrency(sp.totalFront)}
                    </span>
                  </div>
                  <div className="flex justify-between mt-1.5 pt-1.5 border-t border-jde-border">
                    <span className="text-[11px] text-jde-purple uppercase tracking-wider">
                      Commission
                    </span>
                    <span className="text-[15px] font-extrabold text-jde-purple font-mono">
                      {formatCurrency(sp.totalComm)}
                    </span>
                  </div>
                </>
              )}
              {sp.dealCount > 0 && (
                <div
                  className={`mt-2 text-[11px] text-right ${
                    isActive ? "text-jde-cyan" : "text-slate-600"
                  }`}
                >
                  {isActive ? "▲ collapse" : "▼ view deals"}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail table for selected SP */}
      {active && active.dealCount > 0 && (
        <div className="bg-jde-surface border border-[#1e3a5f] rounded-lg p-5">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <span className="text-base font-extrabold text-jde-cyan uppercase tracking-wider">
              {active.name} — Washout
            </span>
            <button
              onClick={() => setActiveSP(null)}
              className="px-3.5 py-1 rounded-md border border-jde-border bg-transparent text-jde-muted text-xs hover:text-jde-text transition-colors"
            >
              ✕ Close
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="bg-jde-panel text-jde-cyan px-2.5 py-2 text-left text-[10px] uppercase tracking-wider border border-jde-panel whitespace-nowrap">
                    Deal #
                  </th>
                  <th className="bg-jde-panel text-jde-cyan px-2.5 py-2 text-left text-[10px] uppercase tracking-wider border border-jde-panel whitespace-nowrap">
                    Customer
                  </th>
                  <th className="bg-jde-panel text-jde-cyan px-2.5 py-2 text-left text-[10px] uppercase tracking-wider border border-jde-panel whitespace-nowrap">
                    N/U
                  </th>
                  <th className="bg-jde-panel text-jde-cyan px-2.5 py-2 text-left text-[10px] uppercase tracking-wider border border-jde-panel whitespace-nowrap">
                    Vehicle
                  </th>
                  <th className="bg-jde-panel text-jde-cyan px-2.5 py-2 text-left text-[10px] uppercase tracking-wider border border-jde-panel whitespace-nowrap">
                    2nd SP
                  </th>
                  <th className="bg-jde-panel text-jde-cyan px-2.5 py-2 text-left text-[10px] uppercase tracking-wider border border-jde-panel whitespace-nowrap">
                    Role
                  </th>
                  <th className="bg-jde-panel text-jde-cyan px-2.5 py-2 text-right text-[10px] uppercase tracking-wider border border-jde-panel whitespace-nowrap">
                    Front Gross
                  </th>
                  <th className="bg-jde-panel text-jde-cyan px-2.5 py-2 text-right text-[10px] uppercase tracking-wider border border-jde-panel whitespace-nowrap">
                    Pack
                  </th>
                  <th className="bg-jde-panel text-jde-cyan px-2.5 py-2 text-right text-[10px] uppercase tracking-wider border border-jde-panel whitespace-nowrap">
                    Comm Base
                  </th>
                  <th className="bg-jde-panel text-jde-cyan px-2.5 py-2 text-right text-[10px] uppercase tracking-wider border border-jde-panel whitespace-nowrap">
                    Comm %
                  </th>
                  <th className="bg-jde-panel text-jde-cyan px-2.5 py-2 text-right text-[10px] uppercase tracking-wider border border-jde-panel whitespace-nowrap">
                    Commission
                  </th>
                  <th className="bg-jde-panel text-jde-cyan px-2.5 py-2 text-center text-[10px] uppercase tracking-wider border border-jde-panel whitespace-nowrap">
                    Split
                  </th>
                </tr>
              </thead>
              <tbody>
                {active.rows.map((r, i) => (
                  <tr
                    key={i}
                    className={i % 2 === 0 ? "bg-transparent" : "bg-jde-bg"}
                  >
                    <td className="px-2.5 py-2 border border-jde-panel text-jde-cyan font-bold whitespace-nowrap">
                      {r.dealNum || "—"}
                    </td>
                    <td className="px-2.5 py-2 border border-jde-panel text-jde-text font-semibold whitespace-nowrap">
                      {r.customer || "—"}
                    </td>
                    <td className="px-2.5 py-2 border border-jde-panel whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          r.newUsed === "New"
                            ? "bg-emerald-900/50 text-jde-success"
                            : "bg-amber-900/50 text-jde-warning"
                        }`}
                      >
                        {r.newUsed || "—"}
                      </span>
                    </td>
                    <td className="px-2.5 py-2 border border-jde-panel text-jde-text whitespace-nowrap">
                      {[r.year, r.make, r.model].filter(Boolean).join(" ") ||
                        "—"}
                    </td>
                    <td className="px-2.5 py-2 border border-jde-panel text-jde-muted whitespace-nowrap">
                      {r.sp2Name || "—"}
                    </td>
                    <td className="px-2.5 py-2 border border-jde-panel whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          r.role === "Primary"
                            ? "bg-[#1e3a5f] text-sky-300"
                            : "bg-[#2d1b6e] text-violet-300"
                        }`}
                      >
                        {r.role}
                      </span>
                    </td>
                    <td className="px-2.5 py-2 border border-jde-panel text-right font-mono text-jde-success whitespace-nowrap">
                      {formatCurrency(r.frontGross)}
                    </td>
                    <td className="px-2.5 py-2 border border-jde-panel text-right font-mono text-jde-danger whitespace-nowrap">
                      ({formatCurrency(r.pack)})
                    </td>
                    <td className="px-2.5 py-2 border border-jde-panel text-right font-mono text-jde-text whitespace-nowrap">
                      {formatCurrency(r.commBase)}
                    </td>
                    <td className="px-2.5 py-2 border border-jde-panel text-right font-mono text-slate-500 whitespace-nowrap">
                      {(r.commPct * 100).toFixed(1)}%
                    </td>
                    <td className="px-2.5 py-2 border border-jde-panel text-right font-mono text-jde-purple font-extrabold text-[13px] whitespace-nowrap">
                      {formatCurrency(r.commission)}
                    </td>
                    <td className="px-2.5 py-2 border border-jde-panel text-center whitespace-nowrap">
                      {r.isSplit ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-orange-900/40 text-orange-400">
                          ½ Split
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-900/50 text-jde-success">
                          Full
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td
                    className="px-2.5 py-2 border border-jde-panel bg-jde-panel font-extrabold text-slate-500 whitespace-nowrap"
                    colSpan={6}
                  >
                    TOTAL — {active.dealCount} deal
                    {active.dealCount !== 1 ? "s" : ""}
                  </td>
                  <td className="px-2.5 py-2 border border-jde-panel bg-jde-panel text-right font-extrabold font-mono text-jde-success whitespace-nowrap">
                    {formatCurrency(active.totalFront)}
                  </td>
                  <td className="px-2.5 py-2 border border-jde-panel bg-jde-panel" />
                  <td className="px-2.5 py-2 border border-jde-panel bg-jde-panel" />
                  <td className="px-2.5 py-2 border border-jde-panel bg-jde-panel" />
                  <td className="px-2.5 py-2 border border-jde-panel bg-jde-panel text-right font-extrabold font-mono text-jde-purple text-[15px] whitespace-nowrap">
                    {formatCurrency(active.totalComm)}
                  </td>
                  <td className="px-2.5 py-2 border border-jde-panel bg-jde-panel" />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Commission summary pills */}
          <div className="flex gap-3 mt-4 flex-wrap">
            {[
              { label: "Total Deals", val: String(active.dealCount), color: "text-jde-cyan" },
              { label: "Split Deals", val: String(active.splits), color: "text-jde-warning" },
              { label: "Full Deals", val: String(active.dealCount - active.splits), color: "text-jde-success" },
              { label: "Total Front", val: formatCurrency(active.totalFront), color: "text-jde-success" },
              { label: "Total Commission", val: formatCurrency(active.totalComm), color: "text-jde-purple" },
            ].map((p) => (
              <div
                key={p.label}
                className="bg-jde-panel rounded-lg px-4 py-2.5 text-center min-w-[130px]"
              >
                <div className={`text-lg font-extrabold font-mono ${p.color}`}>
                  {p.val}
                </div>
                <div className="text-[10px] text-jde-muted uppercase tracking-wider mt-0.5">
                  {p.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
