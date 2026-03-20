"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  getInventoryByEvent,
  upsertInventoryItem,
  deleteInventoryItem,
} from "@/lib/supabase/queries/inventory";
import { formatCurrency } from "@/lib/formatters";
import type { InventoryRow, InventoryInsert } from "@/types/database";

interface Props {
  eventId: string;
}

type EditableField = keyof Omit<InventoryRow, "id" | "event_id">;

const COLUMNS: { key: EditableField; label: string; type: "text" | "number"; width: number; align?: "right" }[] = [
  { key: "hat_num", label: "HAT #", type: "text", width: 72 },
  { key: "stock_num", label: "Stock #", type: "text", width: 90 },
  { key: "vin", label: "VIN", type: "text", width: 150 },
  { key: "year", label: "Year", type: "number", width: 56 },
  { key: "make", label: "Make", type: "text", width: 80 },
  { key: "model", label: "Model", type: "text", width: 80 },
  { key: "class", label: "Class", type: "text", width: 64 },
  { key: "color", label: "Color", type: "text", width: 80 },
  { key: "drivetrain", label: "Drive", type: "text", width: 56 },
  { key: "odometer", label: "Odo", type: "number", width: 64, align: "right" },
  { key: "age", label: "Age", type: "number", width: 48, align: "right" },
  { key: "kbb_trade", label: "KBB Trade", type: "number", width: 80, align: "right" },
  { key: "kbb_retail", label: "KBB Retail", type: "number", width: 80, align: "right" },
  { key: "cost", label: "Cost", type: "number", width: 80, align: "right" },
];

export default function InventoryTable({ eventId }: Props) {
  const [items, setItems] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [locationFilter, setLocationFilter] = useState("all");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [kbbMode, setKbbMode] = useState<"trade" | "retail">("trade");

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const showFlash = useCallback((type: "success" | "error", msg: string) => {
    setFlash({ type, msg });
    setTimeout(() => setFlash(null), 2400);
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await getInventoryByEvent(eventId);
      setItems(data);
    } catch (err) {
      console.error("Failed to load inventory:", err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  // Unique locations for filter dropdown
  const locations = Array.from(
    new Set(items.map((i) => i.location).filter(Boolean))
  ).sort() as string[];

  const locationFiltered =
    locationFilter === "all"
      ? items
      : items.filter((i) => i.location === locationFilter);

  // Computed value getter for sorting
  function getSortValue(item: InventoryRow, key: string): number | string | null {
    const kbbVal = kbbMode === "trade" ? item.kbb_trade : item.kbb_retail;
    if (key === "diff") return (kbbVal ?? 0) - (item.cost ?? 0);
    if (key === "pct115") return kbbVal != null ? Math.round(kbbVal * 1.15) : null;
    if (key === "pct115diff") return kbbVal != null && item.cost != null ? Math.round(kbbVal * 1.15) - item.cost : null;
    if (key === "pct125") return kbbVal != null ? Math.round(kbbVal * 1.25) : null;
    if (key === "pct125diff") return kbbVal != null && item.cost != null ? Math.round(kbbVal * 1.25) - item.cost : null;
    if (key === "pct140") return kbbVal != null ? Math.round(kbbVal * 1.40) : null;
    if (key === "pct140diff") return kbbVal != null && item.cost != null ? Math.round(kbbVal * 1.40) - item.cost : null;
    const val = item[key as keyof InventoryRow];
    // For text fields that may contain numbers (hat_num, stock_num), parse numerically
    if (typeof val === "string" && val.length > 0) {
      const num = parseFloat(val);
      if (!isNaN(num)) return num;
    }
    return val as number | string | null;
  }

  const filtered = sortKey
    ? [...locationFiltered].sort((a, b) => {
        const av = getSortValue(a, sortKey);
        const bv = getSortValue(b, sortKey);
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = typeof av === "string" && typeof bv === "string"
          ? av.localeCompare(bv)
          : Number(av) - Number(bv);
        return sortDir === "asc" ? cmp : -cmp;
      })
    : locationFiltered;

  async function handleAddVehicle() {
    try {
      const newItem = await upsertInventoryItem({
        event_id: eventId,
        location: "On-Site",
      } as InventoryInsert);
      setItems((prev) => [...prev, newItem]);
      showFlash("success", "Vehicle added");
    } catch {
      showFlash("error", "Failed to add vehicle");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteInventoryItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      showFlash("success", "Vehicle deleted");
    } catch {
      showFlash("error", "Failed to delete vehicle");
    }
  }

  async function handleFieldSave(
    item: InventoryRow,
    field: EditableField,
    rawValue: string
  ) {
    const col = COLUMNS.find((c) => c.key === field);
    const isNum = col?.type === "number" || field === "location";

    let value: string | number | null;
    if (field === "location" || field === "notes") {
      value = rawValue || null;
    } else if (isNum || col?.type === "number") {
      value = rawValue === "" ? null : Number(rawValue);
    } else {
      value = rawValue || null;
    }

    // Skip save if unchanged
    if (item[field] === value) return;
    if (item[field] == null && value == null) return;

    try {
      const updated = await upsertInventoryItem({
        id: item.id,
        event_id: item.event_id,
        [field]: value,
      });
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    } catch {
      showFlash("error", "Failed to save");
    }
  }

  // Summary stats
  const totalUnits = items.length;
  const onSite = items.filter((i) => i.location === "On-Site").length;
  const withTrade = items.filter((i) => i.kbb_trade != null && i.kbb_trade > 0);
  const withRetail = items.filter((i) => i.kbb_retail != null && i.kbb_retail > 0);
  const withCost = items.filter((i) => i.cost != null && i.cost > 0);
  const avgTrade =
    withTrade.length > 0
      ? withTrade.reduce((s, i) => s + (i.kbb_trade ?? 0), 0) / withTrade.length
      : 0;
  const avgRetail =
    withRetail.length > 0
      ? withRetail.reduce((s, i) => s + (i.kbb_retail ?? 0), 0) / withRetail.length
      : 0;
  const avgCost =
    withCost.length > 0
      ? withCost.reduce((s, i) => s + (i.cost ?? 0), 0) / withCost.length
      : 0;

  if (loading) {
    return <div className="text-jde-muted py-8 text-center">Loading inventory...</div>;
  }

  return (
    <div>
      {/* Flash */}
      {flash && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg text-sm font-semibold shadow-lg flash-animate ${
            flash.type === "success"
              ? "bg-[#065f46] text-jde-success border border-jde-success/20"
              : "bg-[#7f1d1d] text-jde-danger border border-jde-danger/20"
          }`}
        >
          {flash.msg}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <label className="text-xs text-jde-muted uppercase tracking-wider">
            Location
          </label>
          <select
            className="px-2 py-1 rounded bg-jde-input border border-jde-border text-jde-cyan text-sm focus:outline-none focus:border-jde-cyan"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="all">All Locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
          <button
            onClick={() => setKbbMode((m) => (m === "trade" ? "retail" : "trade"))}
            className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all duration-200 ${
              kbbMode === "trade"
                ? "border-jde-success text-jde-success hover:bg-jde-success/10"
                : "border-jde-purple text-jde-purple hover:bg-jde-purple/10"
            }`}
          >
            {kbbMode === "trade" ? "KBB Trade ⇄" : "KBB Retail ⇄"}
          </button>
          <span className="text-sm text-jde-muted">
            Showing <span className="font-mono text-jde-cyan">{filtered.length}</span> of{" "}
            <span className="font-mono text-jde-cyan">{totalUnits}</span>
          </span>
        </div>
        <button
          onClick={handleAddVehicle}
          className="px-3 py-1.5 rounded-lg border border-jde-cyan text-jde-cyan text-sm font-medium hover:bg-jde-cyan/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          + Add Vehicle
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-jde-border">
        <table className="w-full text-sm" style={{ minWidth: 1500 }}>
          <thead>
            <tr className="bg-jde-panel text-jde-cyan text-xs uppercase tracking-wider">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`px-2 py-2 cursor-pointer hover:text-white select-none ${col.align === "right" ? "text-right" : "text-left"}`}
                  onClick={() => toggleSort(col.key)}
                >
                  {col.label}{sortKey === col.key ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
                </th>
              ))}
              {[
                { key: "diff", label: kbbMode === "trade" ? "Trade Diff" : "Retail Diff", align: "right" },
                { key: "pct115", label: "115%", align: "right" },
                { key: "pct115diff", label: "115% Diff", align: "right" },
                { key: "pct125", label: "125%", align: "right" },
                { key: "pct125diff", label: "125% Diff", align: "right" },
                { key: "pct140", label: "140%", align: "right" },
                { key: "pct140diff", label: "140% Diff", align: "right" },
              ].map((col) => (
                <th
                  key={col.key}
                  className={`px-2 py-2 cursor-pointer hover:text-white select-none ${col.align === "right" ? "text-right" : "text-left"}`}
                  onClick={() => toggleSort(col.key)}
                >
                  {col.label}{sortKey === col.key ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
                </th>
              ))}
              <th
                className="px-2 py-2 cursor-pointer hover:text-white select-none text-left"
                onClick={() => toggleSort("location")}
              >
                Location{sortKey === "location" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
              </th>
              <th
                className="px-2 py-2 cursor-pointer hover:text-white select-none text-left"
                onClick={() => toggleSort("notes")}
              >
                Notes{sortKey === "notes" ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
              </th>
              <th className="px-2 py-2 text-center w-12"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, idx) => (
              <InventoryRow
                key={item.id}
                item={item}
                idx={idx}
                kbbMode={kbbMode}
                onFieldSave={handleFieldSave}
                onDelete={handleDelete}
              />
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={COLUMNS.length + 10}
                  className="text-center py-8 text-jde-muted"
                >
                  {items.length === 0
                    ? 'No vehicles yet. Click "+ Add Vehicle" to get started.'
                    : "No vehicles match this location filter."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-5 gap-3 mt-4">
        <StatPill label="Total Units" value={String(totalUnits)} color="text-jde-cyan" />
        <StatPill label="On-Site" value={String(onSite)} color="text-jde-warning" />
        <StatPill label="Avg KBB Trade" value={formatCurrency(avgTrade)} color="text-jde-success" />
        <StatPill label="Avg KBB Retail" value={formatCurrency(avgRetail)} color="text-sky-300" />
        <StatPill label="Avg Cost" value={formatCurrency(avgCost)} color="text-jde-purple" />
      </div>
    </div>
  );
}

/* ── Inventory Row ────────────────────────────────────────────────────────── */

function InventoryRow({
  item,
  idx,
  kbbMode,
  onFieldSave,
  onDelete,
}: {
  item: InventoryRow;
  idx: number;
  kbbMode: "trade" | "retail";
  onFieldSave: (item: InventoryRow, field: EditableField, value: string) => void;
  onDelete: (id: string) => void;
}) {
  const kbbVal = kbbMode === "trade" ? item.kbb_trade : item.kbb_retail;
  const diff = (kbbVal ?? 0) - (item.cost ?? 0);
  const diffColor =
    diff > 0 ? "text-jde-success" : diff < 0 ? "text-jde-danger" : "text-jde-muted";
  const rowBg = idx % 2 === 0 ? "bg-jde-surface" : "bg-jde-bg";

  function pctDiffCell(multiplier: number) {
    const pctVal = kbbVal != null ? Math.round(kbbVal * multiplier) : null;
    const d = pctVal != null && item.cost != null ? pctVal - item.cost : null;
    const c = d != null ? (d > 0 ? "text-jde-success" : d < 0 ? "text-jde-danger" : "text-jde-muted") : "text-jde-muted";
    return (
      <td className={`px-2 py-1 text-right font-mono text-sm ${c}`}>
        {d != null ? formatCurrency(d) : "—"}
      </td>
    );
  }

  return (
    <tr className={`${rowBg} hover:bg-jde-panel/50 transition-colors`}>
      {COLUMNS.map((col) => (
        <td key={col.key} className="px-1 py-1">
          <InlineCell
            item={item}
            field={col.key}
            type={col.type}
            width={col.width}
            align={col.align}
            onSave={onFieldSave}
          />
        </td>
      ))}
      {/* Diff (computed) */}
      <td className={`px-2 py-1 text-right font-mono text-sm ${diffColor}`}>
        {kbbVal != null && item.cost != null ? formatCurrency(diff) : "—"}
      </td>
      {/* 115% */}
      <td className="px-2 py-1 text-right font-mono text-sm text-jde-warning">
        {kbbVal != null && kbbVal > 0 ? formatCurrency(Math.round(kbbVal * 1.15)) : "—"}
      </td>
      {pctDiffCell(1.15)}
      {/* 125% */}
      <td className="px-2 py-1 text-right font-mono text-sm text-jde-purple">
        {kbbVal != null && kbbVal > 0 ? formatCurrency(Math.round(kbbVal * 1.25)) : "—"}
      </td>
      {pctDiffCell(1.25)}
      {/* 140% */}
      <td className="px-2 py-1 text-right font-mono text-sm text-jde-cyan">
        {kbbVal != null && kbbVal > 0 ? formatCurrency(Math.round(kbbVal * 1.40)) : "—"}
      </td>
      {pctDiffCell(1.40)}
      {/* Location */}
      <td className="px-1 py-1">
        <InlineCell
          item={item}
          field="location"
          type="text"
          width={80}
          onSave={onFieldSave}
        />
      </td>
      {/* Notes */}
      <td className="px-1 py-1">
        <InlineCell
          item={item}
          field="notes"
          type="text"
          width={120}
          onSave={onFieldSave}
        />
      </td>
      {/* Delete */}
      <td className="px-2 py-1 text-center">
        <button
          onClick={() => onDelete(item.id)}
          className="text-jde-muted hover:text-jde-danger text-xs transition-colors"
          title="Delete vehicle"
        >
          ✕
        </button>
      </td>
    </tr>
  );
}

/* ── Inline Editable Cell ─────────────────────────────────────────────────── */

function InlineCell({
  item,
  field,
  type,
  width,
  align,
  onSave,
}: {
  item: InventoryRow;
  field: EditableField;
  type: "text" | "number";
  width: number;
  align?: "right";
  onSave: (item: InventoryRow, field: EditableField, value: string) => void;
}) {
  const raw = item[field as keyof InventoryRow];
  const initial = raw != null ? String(raw) : "";
  const [value, setValue] = useState(initial);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync if parent data changes
  useEffect(() => {
    const newVal = item[field as keyof InventoryRow];
    setValue(newVal != null ? String(newVal) : "");
  }, [item, field]);

  function handleBlur() {
    setEditing(false);
    if (value !== initial) {
      onSave(item, field, value);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Escape") {
      setValue(initial);
      setEditing(false);
    }
  }

  if (!editing) {
    return (
      <div
        className={`px-1 py-0.5 cursor-text text-sm font-mono min-h-[24px] ${
          align === "right" ? "text-right" : "text-left"
        } ${value ? "text-jde-text" : "text-slate-600"}`}
        style={{ minWidth: width }}
        onClick={() => {
          setEditing(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        {value || "—"}
      </div>
    );
  }

  return (
    <input
      ref={inputRef}
      type={type}
      className={`px-1 py-0.5 rounded bg-jde-input border border-jde-cyan text-jde-cyan text-sm font-mono focus:outline-none ${
        align === "right" ? "text-right" : "text-left"
      }`}
      style={{ width }}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      autoFocus
    />
  );
}

/* ── Stat Pill ────────────────────────────────────────────────────────────── */

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-jde-surface border border-jde-border rounded-lg py-2.5 text-center hover:shadow-glow-cyan transition-shadow">
      <div className={`text-lg font-extrabold font-mono ${color}`}>{value}</div>
      <div className="text-[10px] text-jde-muted uppercase tracking-widest mt-0.5">
        {label}
      </div>
    </div>
  );
}
