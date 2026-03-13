"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  getSalespeopleByEvent,
  upsertSalesperson,
  deleteSalesperson,
} from "@/lib/supabase/queries/salespeople";
import {
  getLendersByEvent,
  upsertLender,
  deleteLender,
} from "@/lib/supabase/queries/lenders";
import { SalespersonType } from "@/types/enums";
import type {
  SalespersonRow,
  SalespersonInsert,
  LenderRow,
  LenderInsert,
} from "@/types/database";

interface Props {
  eventId: string;
}

type Flash = { type: "success" | "error"; msg: string } | null;

// ─── Main Component ──────────────────────────────────────────────────────────

export default function RosterTable({ eventId }: Props) {
  const [salespeople, setSalespeople] = useState<SalespersonRow[]>([]);
  const [lenders, setLenders] = useState<LenderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<Flash>(null);

  const showFlash = useCallback((type: "success" | "error", msg: string) => {
    setFlash({ type, msg });
    setTimeout(() => setFlash(null), 2400);
  }, []);

  const load = useCallback(async () => {
    try {
      const [sp, ln] = await Promise.all([
        getSalespeopleByEvent(eventId),
        getLendersByEvent(eventId),
      ]);
      setSalespeople(sp);
      setLenders(ln);
    } catch (err) {
      console.error("Failed to load roster:", err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Derived lists ─────────────────────────────────────────────────────────
  const reps = salespeople.filter((s) => s.type === SalespersonType.Rep);
  const managers = salespeople.filter(
    (s) => s.type === SalespersonType.Manager
  );
  const teamLeaders = salespeople.filter(
    (s) => s.type === SalespersonType.TeamLeader
  );
  const teamLeader = teamLeaders[0] || null;

  // ── Salesperson save / add / delete ───────────────────────────────────────
  async function handleSaveSp(row: SalespersonRow) {
    try {
      const updated = await upsertSalesperson(row);
      setSalespeople((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
      showFlash("success", "Saved");
    } catch (err) {
      console.error("Save failed:", err);
      showFlash("error", "Save failed");
    }
  }

  async function handleAddSp(type: SalespersonType) {
    const insert: SalespersonInsert = {
      event_id: eventId,
      name: "",
      type,
      confirmed: false,
    };
    try {
      const created = await upsertSalesperson(insert);
      setSalespeople((prev) => [...prev, created]);
      showFlash("success", `${type === SalespersonType.Rep ? "Salesperson" : type === SalespersonType.Manager ? "Manager" : "Team Leader"} added`);
    } catch (err) {
      console.error("Add failed:", err);
      showFlash("error", "Add failed");
    }
  }

  async function handleDeleteSp(id: string) {
    try {
      await deleteSalesperson(id);
      setSalespeople((prev) => prev.filter((s) => s.id !== id));
      showFlash("success", "Deleted");
    } catch (err) {
      console.error("Delete failed:", err);
      showFlash("error", "Delete failed");
    }
  }

  // ── Lender save / add / delete ────────────────────────────────────────────
  async function handleSaveLender(row: LenderRow) {
    try {
      const updated = await upsertLender(row);
      setLenders((prev) =>
        prev.map((l) => (l.id === updated.id ? updated : l))
      );
      showFlash("success", "Saved");
    } catch (err) {
      console.error("Save failed:", err);
      showFlash("error", "Save failed");
    }
  }

  async function handleAddLender() {
    const insert: LenderInsert = {
      event_id: eventId,
      name: "",
    };
    try {
      const created = await upsertLender(insert);
      setLenders((prev) => [...prev, created]);
      showFlash("success", "Lender added");
    } catch (err) {
      console.error("Add failed:", err);
      showFlash("error", "Add failed");
    }
  }

  async function handleDeleteLender(id: string) {
    try {
      await deleteLender(id);
      setLenders((prev) => prev.filter((l) => l.id !== id));
      showFlash("success", "Deleted");
    } catch (err) {
      console.error("Delete failed:", err);
      showFlash("error", "Delete failed");
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-jde-muted">
        Loading roster...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Flash message */}
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

      {/* ── SALESPEOPLE ───────────────────────────────────────── */}
      <Section
        title="Salespeople"
        trailing={
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              {reps.filter((r) => r.confirmed).length}/{reps.length} confirmed
            </span>
            <AddButton
              label="+ Add Salesperson"
              onClick={() => handleAddSp(SalespersonType.Rep)}
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["#", "Name", "Phone", "Email", "Confirmed", "Notes", ""].map(
                  (h) => (
                    <th key={h} className="bg-jde-panel text-jde-cyan px-2.5 py-2 text-left text-[11px] tracking-wider uppercase border border-jde-border font-semibold">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {reps.map((row, i) => (
                <SalespersonTableRow
                  key={row.id}
                  row={row}
                  index={i}
                  onSave={handleSaveSp}
                  onDelete={handleDeleteSp}
                  showIndex
                />
              ))}
              {reps.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-jde-muted text-sm">
                    No salespeople yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── MANAGERS ──────────────────────────────────────────── */}
      <Section
        title="Managers"
        trailing={
          <AddButton
            label="+ Add Manager"
            onClick={() => handleAddSp(SalespersonType.Manager)}
          />
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Name", "Phone", "Email", "Confirmed", "Notes", ""].map(
                  (h) => (
                    <th key={h} className="bg-jde-panel text-jde-cyan px-2.5 py-2 text-left text-[11px] tracking-wider uppercase border border-jde-border font-semibold">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {managers.map((row, i) => (
                <SalespersonTableRow
                  key={row.id}
                  row={row}
                  index={i}
                  onSave={handleSaveSp}
                  onDelete={handleDeleteSp}
                />
              ))}
              {managers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-jde-muted text-sm">
                    No managers yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── TEAM LEADER ───────────────────────────────────────── */}
      <Section
        title="Team Leader"
        trailing={
          !teamLeader ? (
            <AddButton
              label="+ Add Team Leader"
              onClick={() => handleAddSp(SalespersonType.TeamLeader)}
            />
          ) : null
        }
      >
        {teamLeader ? (
          <TeamLeaderCard
            row={teamLeader}
            onSave={handleSaveSp}
            onDelete={handleDeleteSp}
          />
        ) : (
          <p className="text-jde-muted text-sm py-4">No team leader assigned</p>
        )}
      </Section>

      {/* ── LENDERS ───────────────────────────────────────────── */}
      <Section
        title="Lenders"
        trailing={
          <AddButton label="+ Add Lender" onClick={handleAddLender} />
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {lenders.map((row) => (
            <LenderCard
              key={row.id}
              row={row}
              onSave={handleSaveLender}
              onDelete={handleDeleteLender}
            />
          ))}
          {lenders.length === 0 && (
            <p className="text-jde-muted text-sm py-4 col-span-full">
              No lenders yet
            </p>
          )}
        </div>
      </Section>
    </div>
  );
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({
  title,
  trailing,
  children,
}: {
  title: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-jde-surface border border-jde-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-extrabold text-jde-cyan tracking-widest uppercase flex items-center">
          <span className="inline-block w-4 h-0.5 bg-jde-cyan mr-2 rounded-full" />
          {title}
        </h3>
        {trailing}
      </div>
      {children}
    </div>
  );
}

// ─── Add button ──────────────────────────────────────────────────────────────

function AddButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 rounded-md border border-jde-cyan bg-transparent text-jde-cyan text-xs font-bold hover:bg-jde-cyan/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
    >
      {label}
    </button>
  );
}

// ─── Salesperson table row (inline editing on blur) ──────────────────────────

function SalespersonTableRow({
  row,
  index,
  onSave,
  onDelete,
  showIndex,
}: {
  row: SalespersonRow;
  index: number;
  onSave: (r: SalespersonRow) => void;
  onDelete: (id: string) => void;
  showIndex?: boolean;
}) {
  const [local, setLocal] = useState(row);
  const pendingRef = useRef(false);

  // Sync from parent when row changes (e.g. after save returns)
  useEffect(() => {
    if (!pendingRef.current) setLocal(row);
  }, [row]);

  function set(field: keyof SalespersonRow, val: string | boolean) {
    setLocal((prev) => ({ ...prev, [field]: val }));
  }

  function saveOnBlur() {
    // Only save if something actually changed
    if (
      local.name !== row.name ||
      local.phone !== row.phone ||
      local.email !== row.email ||
      local.confirmed !== row.confirmed ||
      local.notes !== row.notes
    ) {
      pendingRef.current = true;
      onSave(local);
      setTimeout(() => {
        pendingRef.current = false;
      }, 500);
    }
  }

  function handleConfirmToggle() {
    const updated = { ...local, confirmed: !local.confirmed };
    setLocal(updated);
    pendingRef.current = true;
    onSave(updated);
    setTimeout(() => {
      pendingRef.current = false;
    }, 500);
  }

  const inputCls =
    "w-full px-2 py-1.5 rounded bg-jde-panel border border-jde-border text-jde-text text-sm focus:outline-none focus:border-jde-cyan";
  const stripeBg = index % 2 === 0 ? "" : "bg-jde-bg";

  return (
    <tr className={`${stripeBg} hover:bg-jde-panel/40 transition-colors`}>
      {showIndex && (
        <td className="px-2 py-1.5 border border-jde-border text-slate-600 text-center w-8 text-xs">
          {index + 1}
        </td>
      )}
      <td className="px-2 py-1.5 border border-jde-border min-w-[160px]">
        <input
          className={inputCls}
          value={local.name}
          onChange={(e) => set("name", e.target.value)}
          onBlur={saveOnBlur}
          placeholder="Name"
        />
      </td>
      <td className="px-2 py-1.5 border border-jde-border min-w-[130px]">
        <input
          className={inputCls}
          value={local.phone || ""}
          onChange={(e) => set("phone", e.target.value)}
          onBlur={saveOnBlur}
          placeholder="(xxx) xxx-xxxx"
        />
      </td>
      <td className="px-2 py-1.5 border border-jde-border min-w-[190px]">
        <input
          className={inputCls}
          value={local.email || ""}
          onChange={(e) => set("email", e.target.value)}
          onBlur={saveOnBlur}
          placeholder="email@..."
        />
      </td>
      <td className="px-2 py-1.5 border border-jde-border text-center w-20">
        <button
          onClick={handleConfirmToggle}
          className="inline-flex items-center gap-1.5 cursor-pointer"
        >
          <span
            className={`inline-block w-4 h-4 rounded border ${
              local.confirmed
                ? "bg-jde-cyan border-jde-cyan"
                : "bg-transparent border-slate-500"
            }`}
          >
            {local.confirmed && (
              <svg className="w-4 h-4 text-jde-bg" viewBox="0 0 16 16" fill="currentColor">
                <path d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z" />
              </svg>
            )}
          </span>
          <span
            className={`text-xs font-extrabold ${
              local.confirmed ? "text-jde-success" : "text-jde-muted"
            }`}
          >
            {local.confirmed ? "Y" : "N"}
          </span>
        </button>
      </td>
      <td className="px-2 py-1.5 border border-jde-border min-w-[200px]">
        <input
          className={inputCls}
          value={local.notes || ""}
          onChange={(e) => set("notes", e.target.value)}
          onBlur={saveOnBlur}
          placeholder="Optional notes..."
        />
      </td>
      <td className="px-2 py-1.5 border border-jde-border w-10 text-center">
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

// ─── Team Leader card (single row, field-based layout) ───────────────────────

function TeamLeaderCard({
  row,
  onSave,
  onDelete,
}: {
  row: SalespersonRow;
  onSave: (r: SalespersonRow) => void;
  onDelete: (id: string) => void;
}) {
  const [local, setLocal] = useState(row);
  const pendingRef = useRef(false);

  useEffect(() => {
    if (!pendingRef.current) setLocal(row);
  }, [row]);

  function set(field: keyof SalespersonRow, val: string | boolean) {
    setLocal((prev) => ({ ...prev, [field]: val }));
  }

  function saveOnBlur() {
    if (
      local.name !== row.name ||
      local.phone !== row.phone ||
      local.email !== row.email ||
      local.notes !== row.notes
    ) {
      pendingRef.current = true;
      onSave(local);
      setTimeout(() => {
        pendingRef.current = false;
      }, 500);
    }
  }

  const inputCls =
    "w-full px-2 py-1.5 rounded bg-jde-panel border border-jde-border text-jde-text text-sm focus:outline-none focus:border-jde-cyan";

  return (
    <div className="flex items-end gap-3">
      <div className="flex-1">
        <label className="block text-[11px] text-jde-muted uppercase tracking-wider mb-1">
          Name
        </label>
        <input
          className={inputCls}
          value={local.name}
          onChange={(e) => set("name", e.target.value)}
          onBlur={saveOnBlur}
        />
      </div>
      <div className="flex-1">
        <label className="block text-[11px] text-jde-muted uppercase tracking-wider mb-1">
          Phone
        </label>
        <input
          className={inputCls}
          value={local.phone || ""}
          onChange={(e) => set("phone", e.target.value)}
          onBlur={saveOnBlur}
          placeholder="(xxx) xxx-xxxx"
        />
      </div>
      <div className="flex-1">
        <label className="block text-[11px] text-jde-muted uppercase tracking-wider mb-1">
          Email
        </label>
        <input
          className={inputCls}
          value={local.email || ""}
          onChange={(e) => set("email", e.target.value)}
          onBlur={saveOnBlur}
          placeholder="email@..."
        />
      </div>
      <div className="flex-1">
        <label className="block text-[11px] text-jde-muted uppercase tracking-wider mb-1">
          Notes
        </label>
        <input
          className={inputCls}
          value={local.notes || ""}
          onChange={(e) => set("notes", e.target.value)}
          onBlur={saveOnBlur}
          placeholder="Optional..."
        />
      </div>
      <button
        onClick={() => onDelete(row.id)}
        className="px-2 py-1.5 rounded bg-[#7f1d1d] text-red-300 text-xs font-bold hover:bg-red-900 transition-colors shrink-0"
      >
        ✕
      </button>
    </div>
  );
}

// ─── Lender card ─────────────────────────────────────────────────────────────

function LenderCard({
  row,
  onSave,
  onDelete,
}: {
  row: LenderRow;
  onSave: (r: LenderRow) => void;
  onDelete: (id: string) => void;
}) {
  const [local, setLocal] = useState(row);
  const pendingRef = useRef(false);

  useEffect(() => {
    if (!pendingRef.current) setLocal(row);
  }, [row]);

  function saveOnBlur() {
    if (local.name !== row.name || local.note !== row.note) {
      pendingRef.current = true;
      onSave(local);
      setTimeout(() => {
        pendingRef.current = false;
      }, 500);
    }
  }

  const inputCls =
    "px-2 py-1.5 rounded bg-jde-panel border border-jde-border text-jde-text text-sm focus:outline-none focus:border-jde-cyan";

  return (
    <div className="flex items-center gap-2 bg-jde-panel rounded-lg px-2.5 py-2">
      <input
        className={`${inputCls} w-[140px] shrink-0`}
        value={local.name}
        onChange={(e) => setLocal((p) => ({ ...p, name: e.target.value }))}
        onBlur={saveOnBlur}
        placeholder="Lender name"
      />
      <input
        className={`${inputCls} flex-1`}
        value={local.note || ""}
        onChange={(e) => setLocal((p) => ({ ...p, note: e.target.value }))}
        onBlur={saveOnBlur}
        placeholder="Note (optional)"
      />
      <button
        onClick={() => onDelete(row.id)}
        className="px-1.5 py-0.5 rounded bg-[#7f1d1d] text-red-300 text-xs font-bold hover:bg-red-900 transition-colors shrink-0"
      >
        ✕
      </button>
    </div>
  );
}
