"use client";

import { useEffect, useState, useCallback } from "react";
import { getDealsByEvent, upsertDeal, deleteDeal } from "@/lib/supabase/queries/deals";
import { getSalespeopleByEvent } from "@/lib/supabase/queries/salespeople";
import { getLendersByEvent } from "@/lib/supabase/queries/lenders";
import { formatCurrency } from "@/lib/formatters";
import type { DealRow, DealInsert, SalespersonRow, LenderRow } from "@/types/database";
import { SalespersonType } from "@/types/enums";
import DealRowEditor from "./DealRowEditor";

interface Props {
  eventId: string;
}

export default function DealLogContainer({ eventId }: Props) {
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [salespeople, setSalespeople] = useState<SalespersonRow[]>([]);
  const [lenders, setLenders] = useState<LenderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showFlash = useCallback((type: "success" | "error", msg: string) => {
    setFlash({ type, msg });
    setTimeout(() => setFlash(null), 2400);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [d, sp, l] = await Promise.all([
        getDealsByEvent(eventId),
        getSalespeopleByEvent(eventId),
        getLendersByEvent(eventId),
      ]);
      setDeals(d);
      setSalespeople(sp);
      setLenders(l);
    } catch (err) {
      console.error("Failed to load deal log data:", err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const reps = salespeople.filter(
    (s) => s.type === SalespersonType.Rep || s.type === SalespersonType.TeamLeader
  );
  const managers = salespeople.filter(
    (s) => s.type === SalespersonType.Manager
  );

  // Inline save: upsert and update local state without full reload
  async function handleSave(deal: DealInsert): Promise<DealRow> {
    const saved = await upsertDeal(deal);
    setDeals((prev) => prev.map((d) => (d.id === saved.id ? saved : d)));
    return saved;
  }

  // Add new empty deal to DB immediately, then append to local state
  async function handleAdd() {
    const insert: DealInsert = {
      event_id: eventId,
      front_gross: 0,
      reserve: 0,
      warranty: 0,
      aft1: 0,
      gap: 0,
      acv: 0,
      payoff: 0,
      funded: false,
    };
    try {
      const created = await upsertDeal(insert);
      setDeals((prev) => [...prev, created]);
      showFlash("success", "New deal row added");
    } catch {
      showFlash("error", "Failed to add deal");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDeal(id);
      setDeals((prev) => prev.filter((d) => d.id !== id));
      showFlash("success", "Deal deleted");
    } catch {
      showFlash("error", "Failed to delete deal");
    }
  }

  // Summary stats
  const totalFront = deals.reduce((s, d) => s + d.front_gross, 0);
  const totalBack = deals.reduce((s, d) => s + d.fi_total, 0);
  const totalGross = deals.reduce((s, d) => s + d.total_gross, 0);

  if (loading) {
    return <div className="text-jde-muted py-8 text-center">Loading deals...</div>;
  }

  return (
    <div>
      {/* Flash message */}
      {flash && (
        <div
          className={`flash-animate mb-4 px-4 py-2 rounded text-sm ${
            flash.type === "success"
              ? "bg-[#065f46] text-jde-success border border-jde-success/20"
              : "bg-[#7f1d1d] text-jde-danger border border-jde-danger/20"
          }`}
        >
          {flash.msg}
        </div>
      )}

      {/* Summary bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-4 text-sm">
          <span className="text-jde-muted bg-jde-surface/50 px-2.5 py-1 rounded-md border border-jde-border/50">
            Deals: <span className="font-mono text-jde-cyan">{deals.length}</span>
          </span>
          <span className="text-jde-muted bg-jde-surface/50 px-2.5 py-1 rounded-md border border-jde-border/50">
            Front: <span className="font-mono text-jde-success">{formatCurrency(totalFront)}</span>
          </span>
          <span className="text-jde-muted bg-jde-surface/50 px-2.5 py-1 rounded-md border border-jde-border/50">
            Back: <span className="font-mono text-jde-purple">{formatCurrency(totalBack)}</span>
          </span>
          <span className="text-jde-muted bg-jde-surface/50 px-2.5 py-1 rounded-md border border-jde-border/50">
            Total: <span className="font-mono text-jde-warning">{formatCurrency(totalGross)}</span>
          </span>
        </div>
        <button
          onClick={handleAdd}
          className="px-3 py-1.5 rounded border border-jde-cyan text-jde-cyan text-sm hover:bg-jde-cyan/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          + Add Deal
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-jde-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-jde-panel text-jde-cyan text-xs uppercase tracking-wider">
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Customer</th>
              <th className="px-3 py-2 text-left">ZIP</th>
              <th className="px-3 py-2 text-left">N/U</th>
              <th className="px-3 py-2 text-left">Vehicle</th>
              <th className="px-3 py-2 text-left">Salesperson</th>
              <th className="px-3 py-2 text-left">SP2</th>
              <th className="px-3 py-2 text-left">Closer</th>
              <th className="px-3 py-2 text-right">Front</th>
              <th className="px-3 py-2 text-left">Lender</th>
              <th className="px-3 py-2 text-right">Rate</th>
              <th className="px-3 py-2 text-right">Reserve</th>
              <th className="px-3 py-2 text-right">Warranty</th>
              <th className="px-3 py-2 text-right">Aft1</th>
              <th className="px-3 py-2 text-right">GAP</th>
              <th className="px-3 py-2 text-right">F&I</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2 text-center">Fund</th>
              <th className="px-3 py-2 text-center w-16"></th>
              <th className="px-3 py-2 text-left">Notes</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((deal, idx) => (
              <DealRowEditor
                key={deal.id}
                eventId={eventId}
                deal={deal}
                index={idx}
                reps={reps}
                managers={managers}
                lenders={lenders}
                onSave={handleSave}
                onDelete={handleDelete}
              />
            ))}

            {deals.length === 0 && (
              <tr>
                <td colSpan={21} className="text-center py-8 text-jde-muted">
                  No deals yet. Click &quot;+ Add Deal&quot; to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
