"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  getMailTrackingByEvent,
  upsertMailTracking,
  deleteMailTracking,
} from "@/lib/supabase/queries/mail-tracking";
import type { MailTrackingRow, MailTrackingInsert } from "@/types/database";

interface Props {
  eventId: string;
}

type Flash = { type: "success" | "error"; msg: string } | null;

const DAY_KEYS = [
  "day_1",
  "day_2",
  "day_3",
  "day_4",
  "day_5",
  "day_6",
  "day_7",
  "day_8",
  "day_9",
  "day_10",
  "day_11",
] as const;

const DAY_LABELS = [
  "Day 1",
  "Day 2",
  "Day 3",
  "Day 4",
  "Day 5",
  "Day 6",
  "Day 7",
  "Day 8",
  "Day 9",
  "Day 10",
  "Day 11",
];

function rowTotal(row: MailTrackingRow): number {
  return DAY_KEYS.reduce((sum, k) => sum + (row[k] || 0), 0);
}

export default function MailTrackingTable({ eventId }: Props) {
  const [rows, setRows] = useState<MailTrackingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<Flash>(null);

  const showFlash = useCallback((type: "success" | "error", msg: string) => {
    setFlash({ type, msg });
    setTimeout(() => setFlash(null), 2400);
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await getMailTrackingByEvent(eventId);
      setRows(data);
    } catch (err) {
      console.error("Failed to load mail tracking:", err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Save handler ──────────────────────────────────────────────────────────
  async function handleSave(updated: MailTrackingRow) {
    try {
      const saved = await upsertMailTracking(updated);
      setRows((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
      showFlash("success", "Saved");
    } catch (err) {
      console.error("Save failed:", err);
      showFlash("error", "Save failed");
    }
  }

  // ── Add row ───────────────────────────────────────────────────────────────
  async function handleAdd() {
    const insert: MailTrackingInsert = {
      event_id: eventId,
      zip_code: "",
      town: "",
      drop_num: 1,
      pieces_sent: 0,
      day_1: 0,
      day_2: 0,
      day_3: 0,
      day_4: 0,
      day_5: 0,
      day_6: 0,
      day_7: 0,
      day_8: 0,
      day_9: 0,
      day_10: 0,
      day_11: 0,
    };
    try {
      const created = await upsertMailTracking(insert);
      setRows((prev) => [...prev, created]);
      showFlash("success", "ZIP row added");
    } catch (err) {
      console.error("Add failed:", err);
      showFlash("error", "Add failed");
    }
  }

  // ── Delete row ────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    try {
      await deleteMailTracking(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
      showFlash("success", "Deleted");
    } catch (err) {
      console.error("Delete failed:", err);
      showFlash("error", "Delete failed");
    }
  }

  // ── Derived totals ────────────────────────────────────────────────────────
  const totalPieces = rows.reduce((s, r) => s + (r.pieces_sent || 0), 0);
  const totalResponses = rows.reduce((s, r) => s + rowTotal(r), 0);
  const responseRate =
    totalPieces > 0 ? ((totalResponses / totalPieces) * 100).toFixed(2) : "0.00";

  const colTotals = DAY_KEYS.map((k) =>
    rows.reduce((s, r) => s + (r[k] || 0), 0)
  );
  const grandTotal = colTotals.reduce((s, v) => s + v, 0);

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-jde-muted">
        Loading mail tracking...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Flash */}
      {flash && (
        <div
          className={`flash-animate fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-semibold shadow-lg ${
            flash.type === "success"
              ? "bg-[#065f46] text-jde-success border border-jde-success/20"
              : "bg-[#7f1d1d] text-jde-danger border border-jde-danger/20"
          }`}
        >
          {flash.msg}
        </div>
      )}

      {/* Summary bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="px-3 py-1.5 rounded-lg bg-jde-surface border border-jde-border text-sm">
          <span className="text-jde-muted mr-1.5">Total Mail:</span>
          <span className="text-jde-warning font-bold font-mono">
            {totalPieces.toLocaleString()}
          </span>
          <span className="text-jde-muted mx-1.5">pieces</span>
          <span className="text-slate-600 mx-1">·</span>
          <span className="text-jde-cyan font-bold font-mono">
            {totalResponses}
          </span>
          <span className="text-jde-muted ml-1.5">UPs tracked</span>
        </span>
        <span className="px-3 py-1.5 rounded-lg bg-jde-surface border border-jde-border text-sm">
          <span className="text-jde-muted mr-1.5">Response Rate:</span>
          <span className="text-jde-success font-bold font-mono">
            {responseRate}%
          </span>
        </span>
        <div className="ml-auto">
          <button
            onClick={handleAdd}
            className="px-3 py-1.5 rounded-md border border-jde-cyan bg-transparent text-jde-cyan text-xs font-bold hover:bg-jde-cyan/10 transition-colors"
          >
            + Add ZIP Row
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-jde-surface border border-jde-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm min-w-[1200px]">
            <thead>
              <tr>
                <th className={thCls}>Drop</th>
                <th className={thCls}>Town</th>
                <th className={thCls}>ZIP</th>
                <th className={thCls}>Pieces</th>
                {DAY_LABELS.map((d) => (
                  <th key={d} className={`${thCls} text-center`}>
                    {d}
                  </th>
                ))}
                <th className={`${thCls} text-center`}>Total</th>
                <th className={thCls}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <MailRow
                  key={row.id}
                  row={row}
                  index={i}
                  onSave={handleSave}
                  onDelete={handleDelete}
                />
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={16}
                    className="text-center py-8 text-jde-muted text-sm"
                  >
                    No ZIP codes yet — click &quot;+ Add ZIP Row&quot; to start
                  </td>
                </tr>
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="bg-[#0f2744] border-t-2 border-[#1e3a5f]">
                  <td
                    colSpan={3}
                    className="px-2.5 py-2.5 text-xs font-extrabold text-jde-text tracking-wider"
                  >
                    TOTALS
                  </td>
                  <td className="px-2.5 py-2.5 text-jde-warning font-extrabold font-mono text-sm">
                    {totalPieces.toLocaleString()}
                  </td>
                  {colTotals.map((ct, i) => (
                    <td
                      key={i}
                      className={`px-1 py-2.5 text-center font-extrabold font-mono text-sm ${
                        ct > 0 ? "text-jde-cyan" : "text-slate-700"
                      }`}
                    >
                      {ct}
                    </td>
                  ))}
                  <td className="px-2.5 py-2.5 text-center text-jde-success font-extrabold font-mono text-sm">
                    {grandTotal}
                  </td>
                  <td className="px-2.5 py-2.5"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Shared th class ─────────────────────────────────────────────────────────
const thCls =
  "bg-jde-panel text-jde-cyan px-2.5 py-2 text-left text-[11px] tracking-wider uppercase border-b border-jde-border font-semibold whitespace-nowrap";

// ─── Single mail tracking row (inline editing on blur) ───────────────────────

function MailRow({
  row,
  index,
  onSave,
  onDelete,
}: {
  row: MailTrackingRow;
  index: number;
  onSave: (r: MailTrackingRow) => void;
  onDelete: (id: string) => void;
}) {
  const [local, setLocal] = useState<MailTrackingRow>(row);
  const pendingRef = useRef(false);

  useEffect(() => {
    if (!pendingRef.current) setLocal(row);
  }, [row]);

  function setField(field: string, val: string) {
    setLocal((prev) => ({ ...prev, [field]: val }));
  }

  function setNumField(field: string, val: string) {
    setLocal((prev) => ({
      ...prev,
      [field]: val === "" ? 0 : Number(val) || 0,
    }));
  }

  function saveOnBlur() {
    // Check if anything changed
    const changed =
      local.zip_code !== row.zip_code ||
      local.town !== row.town ||
      local.drop_num !== row.drop_num ||
      local.pieces_sent !== row.pieces_sent ||
      DAY_KEYS.some((k) => local[k] !== row[k]);

    if (changed) {
      pendingRef.current = true;
      onSave(local);
      setTimeout(() => {
        pendingRef.current = false;
      }, 500);
    }
  }

  const total = rowTotal(local);
  const stripeBg = index % 2 === 0 ? "bg-jde-surface" : "bg-[#111827]";

  const metaInputCls =
    "w-full px-1.5 py-1 rounded bg-jde-panel border border-jde-border text-jde-text text-sm focus:outline-none focus:border-jde-cyan font-mono";
  const dayInputCls =
    "w-full px-1 py-1 rounded bg-jde-panel border border-jde-border text-jde-text text-sm text-center focus:outline-none focus:border-jde-cyan font-mono";

  return (
    <tr className={stripeBg}>
      {/* Drop # */}
      <td className="px-2 py-1.5 border-b border-jde-border w-14">
        <input
          type="number"
          className={`${metaInputCls} w-12`}
          value={local.drop_num ?? ""}
          onChange={(e) => setNumField("drop_num", e.target.value)}
          onBlur={saveOnBlur}
          min={1}
          max={3}
        />
      </td>
      {/* Town */}
      <td className="px-2 py-1.5 border-b border-jde-border min-w-[100px]">
        <input
          className={metaInputCls}
          value={local.town || ""}
          onChange={(e) => setField("town", e.target.value)}
          onBlur={saveOnBlur}
          placeholder="Town"
        />
      </td>
      {/* ZIP */}
      <td className="px-2 py-1.5 border-b border-jde-border">
        <input
          className={`${metaInputCls} text-jde-cyan font-semibold min-w-[72px]`}
          value={local.zip_code || ""}
          onChange={(e) => setField("zip_code", e.target.value)}
          onBlur={saveOnBlur}
          placeholder="ZIP"
        />
      </td>
      {/* Pieces Sent */}
      <td className="px-2 py-1.5 border-b border-jde-border">
        <input
          type="number"
          className={`${metaInputCls} text-jde-warning min-w-[72px]`}
          value={local.pieces_sent || ""}
          onChange={(e) => setNumField("pieces_sent", e.target.value)}
          onBlur={saveOnBlur}
          placeholder="0"
        />
      </td>
      {/* Day 1–11 */}
      {DAY_KEYS.map((k) => (
        <td key={k} className="px-0.5 py-1.5 border-b border-jde-border w-14">
          <input
            type="number"
            className={dayInputCls}
            value={local[k] || ""}
            onChange={(e) => setNumField(k, e.target.value)}
            onBlur={saveOnBlur}
            placeholder="0"
            min={0}
          />
        </td>
      ))}
      {/* Row total */}
      <td className="px-2 py-1.5 border-b border-jde-border text-center text-jde-success font-bold font-mono text-sm w-14">
        {total}
      </td>
      {/* Delete */}
      <td className="px-2 py-1.5 border-b border-jde-border w-10 text-center">
        <button
          onClick={() => onDelete(row.id)}
          className="px-1.5 py-0.5 rounded bg-[#7f1d1d] text-red-300 text-xs font-bold hover:bg-red-900 transition-colors"
        >
          ✕
        </button>
      </td>
    </tr>
  );
}
