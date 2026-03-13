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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
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

  async function handleSave(deal: DealInsert) {
    try {
      await upsertDeal(deal);
      showFlash("success", "Deal saved");
      setEditingId(null);
      setAddingNew(false);
      await loadData();
    } catch {
      showFlash("error", "Failed to save deal");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDeal(id);
      showFlash("success", "Deal deleted");
      setEditingId(null);
      await loadData();
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
          onClick={() => {
            setAddingNew(true);
            setEditingId(null);
          }}
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
              <th className="px-3 py-2 text-right">Reserve</th>
              <th className="px-3 py-2 text-right">Warranty</th>
              <th className="px-3 py-2 text-right">Aft1</th>
              <th className="px-3 py-2 text-right">GAP</th>
              <th className="px-3 py-2 text-right">F&I</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2 text-center">Fund</th>
              <th className="px-3 py-2 text-center w-20">Actions</th>
              <th className="px-3 py-2 text-left">Notes</th>
            </tr>
          </thead>
          <tbody>
            {/* Add new row */}
            {addingNew && (
              <DealRowEditor
                eventId={eventId}
                deal={null}
                reps={reps}
                managers={managers}
                lenders={lenders}
                onSave={handleSave}
                onCancel={() => setAddingNew(false)}
              />
            )}

            {deals.map((deal, idx) =>
              editingId === deal.id ? (
                <DealRowEditor
                  key={deal.id}
                  eventId={eventId}
                  deal={deal}
                  reps={reps}
                  managers={managers}
                  lenders={lenders}
                  onSave={handleSave}
                  onCancel={() => setEditingId(null)}
                  onDelete={() => handleDelete(deal.id)}
                />
              ) : (
                <DealRowDisplay
                  key={deal.id}
                  deal={deal}
                  idx={idx}
                  salespeople={salespeople}
                  onEdit={() => {
                    setEditingId(deal.id);
                    setAddingNew(false);
                  }}
                />
              )
            )}

            {deals.length === 0 && !addingNew && (
              <tr>
                <td colSpan={20} className="text-center py-8 text-jde-muted">
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

/** Read-only display row */
function DealRowDisplay({
  deal,
  idx,
  salespeople,
  onEdit,
}: {
  deal: DealRow;
  idx: number;
  salespeople: SalespersonRow[];
  onEdit: () => void;
}) {
  const sp1 = salespeople.find((s) => s.id === deal.salesperson_id);
  const sp2 = salespeople.find((s) => s.id === deal.salesperson2_id);
  const closer = salespeople.find((s) => s.id === deal.closer_id);
  const rowBg = idx % 2 === 0 ? "bg-jde-surface" : "bg-jde-bg";

  return (
    <tr
      className={`${rowBg} hover:bg-jde-panel/50 cursor-pointer transition-colors`}
      onClick={onEdit}
    >
      <td className="px-3 py-2 font-mono text-jde-muted">{deal.deal_num || idx + 1}</td>
      <td className="px-3 py-2 text-jde-muted">
        {deal.deal_date
          ? new Date(deal.deal_date + "T00:00:00").toLocaleDateString("en-US", {
              month: "numeric",
              day: "numeric",
            })
          : "—"}
      </td>
      <td className="px-3 py-2 text-jde-text">{deal.customer_name || "—"}</td>
      <td className="px-3 py-2 font-mono text-jde-muted">{deal.customer_zip || "—"}</td>
      <td className="px-3 py-2">
        <span
          className={`text-xs font-medium ${
            deal.new_used === "New" ? "text-jde-cyan" : "text-jde-warning"
          }`}
        >
          {deal.new_used || "—"}
        </span>
      </td>
      <td className="px-3 py-2 text-jde-text">
        {deal.year || deal.make || deal.model
          ? `${deal.year ?? ""} ${deal.make ?? ""} ${deal.model ?? ""}`.trim()
          : "—"}
      </td>
      <td className="px-3 py-2 text-jde-text">{sp1?.name || "—"}</td>
      <td className="px-3 py-2 text-jde-muted">{sp2?.name || ""}</td>
      <td className="px-3 py-2 text-jde-muted">{closer?.name || "—"}</td>
      <td className="px-3 py-2 text-right font-mono text-jde-text">
        {formatCurrency(deal.front_gross)}
      </td>
      <td className="px-3 py-2 text-jde-muted">{deal.lender || "—"}</td>
      <td className="px-3 py-2 text-right font-mono text-jde-muted">
        {formatCurrency(deal.reserve)}
      </td>
      <td className="px-3 py-2 text-right font-mono text-jde-muted">
        {formatCurrency(deal.warranty)}
      </td>
      <td className="px-3 py-2 text-right font-mono text-jde-muted">
        {formatCurrency(deal.aft1)}
      </td>
      <td className="px-3 py-2 text-right font-mono text-jde-muted">
        {formatCurrency(deal.gap)}
      </td>
      <td className="px-3 py-2 text-right font-mono text-jde-purple">
        {formatCurrency(deal.fi_total)}
      </td>
      <td className="px-3 py-2 text-right font-mono font-semibold text-jde-success">
        {formatCurrency(deal.total_gross)}
      </td>
      <td className="px-3 py-2 text-center">
        {deal.funded ? (
          <span className="text-jde-success">✓</span>
        ) : (
          <span className="text-jde-muted">—</span>
        )}
      </td>
      <td className="px-3 py-2 text-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="text-jde-muted hover:text-jde-cyan text-xs transition-colors"
        >
          Edit
        </button>
      </td>
      <td
        className="px-3 py-2 text-jde-muted text-xs max-w-[150px] truncate"
        title={deal.notes || ""}
      >
        {deal.notes
          ? deal.notes.length > 30
            ? deal.notes.slice(0, 30) + "…"
            : deal.notes
          : ""}
      </td>
    </tr>
  );
}
