"use client";

import { useEffect, useState, useCallback } from "react";
import { getDealsByEvent } from "@/lib/supabase/queries/deals";
import { getSalespeopleByEvent } from "@/lib/supabase/queries/salespeople";
import { getEvent, updateEvent } from "@/lib/supabase/queries/events";
import {
  calcPack,
  calcCommission,
  calcJdeCommission,
  calcNonCommGross,
  calcVariableNet,
  calcTotalNet,
  calcPVR,
} from "@/lib/calculations";
import { formatCurrency } from "@/lib/formatters";
import { SalespersonType } from "@/types/enums";
import type { DealRow, SalespersonRow, EventRow } from "@/types/database";

interface Props {
  eventId: string;
}

export default function RecapSummary({ eventId }: Props) {
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [salespeople, setSalespeople] = useState<SalespersonRow[]>([]);
  const [event, setEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);

  // Local editable fields (stored on event)
  const [miscExpenses, setMiscExpenses] = useState("");
  const [savingMisc, setSavingMisc] = useState(false);

  const load = useCallback(async () => {
    try {
      const [d, sp, ev] = await Promise.all([
        getDealsByEvent(eventId),
        getSalespeopleByEvent(eventId),
        getEvent(eventId),
      ]);
      setDeals(d);
      setSalespeople(sp);
      setEvent(ev);
      if (ev) {
        setMiscExpenses(String(ev.misc_expenses ?? 0));
      }
    } catch (err) {
      console.error("Failed to load recap data:", err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  // Save misc_expenses when input blurs
  async function saveMiscExpenses(val: string) {
    if (!event) return;
    const num = Number(val) || 0;
    if (num === event.misc_expenses) return;
    setSavingMisc(true);
    try {
      const updated = await updateEvent({ id: eventId, misc_expenses: num });
      setEvent(updated);
    } catch (err) {
      console.error("Failed to save misc expenses:", err);
    } finally {
      setSavingMisc(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-jde-muted">
        Loading recap...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-jde-muted">
        Event not found
      </div>
    );
  }

  // ── Derived metrics ───────────────────────────────────────────────────────
  const packNew = event.pack_new;
  const packUsed = event.pack_used;
  const packCompany = event.pack_company;
  const jdePct = event.jde_pct;
  const mktCost = event.marketing_cost;
  const miscExp = Number(miscExpenses) || 0;

  // Totals
  const totalDeals = deals.length;
  const newDeals = deals.filter((d) => d.new_used === "New").length;
  const usedDeals = deals.filter((d) => d.new_used === "Used").length;

  const totalFront = deals.reduce((s, d) => s + (d.front_gross || 0), 0);
  const totalBack = deals.reduce(
    (s, d) => s + (d.reserve || 0) + (d.warranty || 0) + (d.aft1 || 0) + (d.gap || 0),
    0
  );
  const totalGross = deals.reduce((s, d) => s + (d.total_gross || 0), 0);

  const jdeComm = calcJdeCommission(totalGross, jdePct);
  const nonCommGross = calcNonCommGross(deals, packNew, packUsed, packCompany);
  const variableNet = calcVariableNet(totalGross, jdeComm, mktCost, nonCommGross);

  // Reps commissions — same logic as WashoutTable
  const reps = salespeople.filter(
    (sp) => sp.type === SalespersonType.Rep || sp.type === SalespersonType.TeamLeader
  );
  let repsComm = 0;
  for (const deal of deals) {
    for (const rep of reps) {
      const isPrimary = deal.salesperson_id === rep.id;
      const isSplit2 =
        deal.salesperson2_id === rep.id &&
        deal.salesperson2_id !== deal.salesperson_id;
      if (!isPrimary && !isSplit2) continue;

      const hasSplit =
        deal.salesperson2_id != null &&
        deal.salesperson2_id !== deal.salesperson_id;
      const pack = calcPack(deal.new_used, packNew, packUsed, packCompany);
      const commission = calcCommission(deal.front_gross, pack, hasSplit);
      repsComm += commission;
    }
  }

  const totalNet = calcTotalNet(variableNet, repsComm, miscExp);

  const frontPVR = calcPVR(totalFront, totalDeals);
  const backPVR = calcPVR(totalBack, totalDeals);
  const totalPVR = calcPVR(totalGross, totalDeals);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* ── FINANCIAL SUMMARY ──────────────────────────────── */}
        <div className="bg-jde-surface border border-jde-border rounded-xl p-5">
          <h3 className="text-xs font-extrabold text-jde-cyan tracking-widest uppercase mb-4 flex items-center"><span className="inline-block w-4 h-0.5 bg-jde-cyan mr-2 rounded-full" />
            Financial Summary
          </h3>

          <RecapRow
            label="Total Commissionable Gross"
            sublabel="(from Deal Log)"
            value={formatCurrency(totalGross)}
            color="text-jde-cyan"
          />

          {/* JDE Commission — show % from settings */}
          <div className="flex items-center justify-between py-2.5 border-b border-jde-border">
            <div>
              <span className="text-sm text-jde-muted">JDE Commission</span>
              <span className="text-xs text-slate-600 ml-1.5">({jdePct}%)</span>
            </div>
            <span className="font-bold text-sm text-jde-purple font-mono">
              {formatCurrency(jdeComm)}
            </span>
          </div>

          <RecapRow
            label="Marketing Cost"
            value={formatCurrency(mktCost)}
            color="text-jde-warning"
          />

          <div className="h-px bg-gradient-to-r from-transparent via-jde-border to-transparent my-2.5" />

          <RecapRow
            label="Non-Comm Gross"
            sublabel="(deals x company pack)"
            value={formatCurrency(nonCommGross)}
            color="text-sky-300"
          />

          <RecapRow
            label="Variable Net"
            sublabel="(Gross - JDE - Mkt + Non-Comm)"
            value={formatCurrency(variableNet)}
            color={variableNet >= 0 ? "text-jde-success" : "text-jde-danger"}
          />

          <div className="h-px bg-gradient-to-r from-transparent via-jde-border to-transparent my-2.5" />

          <RecapRow
            label="Reps Commissions"
            sublabel="(auto from Washout)"
            value={formatCurrency(repsComm)}
            color="text-jde-danger"
          />

          {/* Misc Expenses — editable inline */}
          <div className="flex items-center justify-between py-2.5 border-b border-jde-border">
            <div>
              <span className="text-sm text-jde-muted">Misc Expenses</span>
              {savingMisc && (
                <span className="text-xs text-slate-600 ml-1.5">saving...</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-600 text-sm">$</span>
              <input
                type="number"
                className="w-[100px] px-2 py-1 rounded-md bg-jde-panel border border-jde-border text-jde-danger text-sm font-mono text-right focus:outline-none focus:border-jde-cyan"
                value={miscExpenses}
                onChange={(e) => setMiscExpenses(e.target.value)}
                onBlur={(e) => saveMiscExpenses(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* TOTAL NET */}
          <div className="flex items-center justify-between pt-3 mt-1 bg-gradient-to-r from-jde-surface to-jde-panel rounded-lg px-3 py-2 -mx-1">
            <span className="text-sm font-extrabold text-jde-text tracking-wide">
              TOTAL NET
            </span>
            <span
              className={`text-2xl font-black font-mono ${
                totalNet >= 0 ? "text-jde-success" : "text-jde-danger"
              }`}
            >
              {formatCurrency(totalNet)}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 text-right mt-0.5">
            Variable Net - Reps Comm - Misc Expenses
          </p>
        </div>

        {/* ── UNIT BREAKDOWN ─────────────────────────────────── */}
        <div className="bg-jde-surface border border-jde-border rounded-xl p-5">
          <h3 className="text-xs font-extrabold text-jde-cyan tracking-widest uppercase mb-4 flex items-center"><span className="inline-block w-4 h-0.5 bg-jde-cyan mr-2 rounded-full" />
            Unit Breakdown
          </h3>

          {/* Big count boxes */}
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            <CountBox label="Total" value={totalDeals} color="text-jde-cyan" />
            <CountBox label="New" value={newDeals} color="text-jde-success" />
            <CountBox label="Used" value={usedDeals} color="text-jde-warning" />
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-jde-border to-transparent my-2.5" />

          <RecapRow label="Front Gross" value={formatCurrency(totalFront)} color="text-jde-success" />
          <RecapRow label="Back (F&I)" value={formatCurrency(totalBack)} color="text-sky-300" />
          <RecapRow label="Total Gross" value={formatCurrency(totalGross)} color="text-jde-cyan" />
          <RecapRow label="Front PVR" value={formatCurrency(frontPVR)} color="text-jde-muted" />
          <RecapRow label="Back PVR" value={formatCurrency(backPVR)} color="text-jde-muted" />
          <RecapRow label="Total PVR" value={formatCurrency(totalPVR)} color="text-jde-text" />
        </div>

        {/* ── SALE INFO ──────────────────────────────────────── */}
        <div className="bg-jde-surface border border-jde-border rounded-xl p-5">
          <h3 className="text-xs font-extrabold text-jde-cyan tracking-widest uppercase mb-4 flex items-center"><span className="inline-block w-4 h-0.5 bg-jde-cyan mr-2 rounded-full" />
            Sale Info
          </h3>

          <RecapRow label="Dealer" value={event.dealer_name} color="text-jde-text" />
          <RecapRow
            label="Address"
            value={
              [event.street, event.city, event.state].filter(Boolean).join(", ") ||
              "—"
            }
            color="text-jde-text"
          />
          <RecapRow
            label="Sale Start"
            value={event.start_date || "—"}
            color="text-jde-text"
          />
          <RecapRow
            label="Sale End"
            value={event.end_date || "—"}
            color="text-jde-text"
          />
          <RecapRow
            label="Pack — Company"
            value={formatCurrency(packCompany)}
            color="text-jde-text"
          />
          <RecapRow
            label="Pack — New"
            value={formatCurrency(packNew)}
            color="text-jde-text"
          />
          <RecapRow
            label="Pack — Used"
            value={formatCurrency(packUsed)}
            color="text-jde-text"
          />
          <RecapRow
            label="JDE %"
            value={`${jdePct}%`}
            color="text-jde-purple"
          />
        </div>
      </div>
    </div>
  );
}

/* ── Helper components ──────────────────────────────────────────────────── */

function RecapRow({
  label,
  sublabel,
  value,
  color = "text-jde-text",
}: {
  label: string;
  sublabel?: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-jde-border">
      <div>
        <span className="text-sm text-jde-muted">{label}</span>
        {sublabel && (
          <span className="text-xs text-slate-600 ml-1.5">{sublabel}</span>
        )}
      </div>
      <span className={`font-bold text-sm font-mono ${color}`}>{value}</span>
    </div>
  );
}

function CountBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-jde-panel rounded-lg py-2.5 text-center">
      <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
      <div className="text-[10px] text-jde-muted uppercase tracking-widest mt-0.5">
        {label}
      </div>
    </div>
  );
}
