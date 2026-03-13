"use client";

import { useState } from "react";
import { calcFiTotal, calcTotalGross } from "@/lib/calculations";
import { formatCurrency } from "@/lib/formatters";
import { NewUsed } from "@/types/enums";
import type { DealRow, DealInsert, SalespersonRow, LenderRow } from "@/types/database";

interface Props {
  eventId: string;
  deal: DealRow | null;
  reps: SalespersonRow[];
  managers: SalespersonRow[];  // closers dropdown
  lenders: LenderRow[];
  onSave: (deal: DealInsert) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export default function DealRowEditor({
  eventId,
  deal,
  reps,
  managers,
  lenders,
  onSave,
  onCancel,
  onDelete,
}: Props) {
  const [form, setForm] = useState({
    deal_num: deal?.deal_num ?? "",
    deal_date: deal?.deal_date ?? "",
    customer_name: deal?.customer_name ?? "",
    customer_zip: deal?.customer_zip ?? "",
    new_used: deal?.new_used ?? "",
    year: deal?.year != null ? String(deal.year) : "",
    make: deal?.make ?? "",
    model: deal?.model ?? "",
    salesperson_id: deal?.salesperson_id ?? "",
    salesperson2_id: deal?.salesperson2_id ?? "",
    closer_id: deal?.closer_id ?? "",
    front_gross: deal?.front_gross ?? 0,
    lender: deal?.lender ?? "",
    rate: deal?.rate != null ? String(deal.rate) : "",
    reserve: deal?.reserve ?? 0,
    warranty: deal?.warranty ?? 0,
    aft1: deal?.aft1 ?? 0,
    gap: deal?.gap ?? 0,
    trade_year: deal?.trade_year ?? "",
    trade_make: deal?.trade_make ?? "",
    trade_model: deal?.trade_model ?? "",
    trade_miles: deal?.trade_miles ?? "",
    acv: deal?.acv ?? 0,
    payoff: deal?.payoff ?? 0,
    funded: deal?.funded ?? false,
    notes: deal?.notes ?? "",
  });

  const fiTotal = calcFiTotal(form.reserve, form.warranty, form.aft1, form.gap);
  const totalGross = calcTotalGross(form.front_gross, fiTotal);

  function setField<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function numField(key: keyof typeof form, val: string) {
    setField(key, (val === "" ? 0 : Number(val)) as never);
  }

  function handleSubmit() {
    const payload: DealInsert = {
      event_id: eventId,
      deal_num: form.deal_num || null,
      deal_date: form.deal_date || null,
      customer_name: form.customer_name || null,
      customer_zip: form.customer_zip || null,
      new_used: form.new_used === "New" ? NewUsed.New : form.new_used === "Used" ? NewUsed.Used : null,
      year: form.year ? Number(form.year) : null,
      make: form.make || null,
      model: form.model || null,
      salesperson_id: form.salesperson_id || null,
      salesperson2_id: form.salesperson2_id || null,
      closer_id: form.closer_id || null,
      closer_type: form.closer_id ? "manager" : null,
      front_gross: form.front_gross,
      lender: form.lender || null,
      rate: form.rate ? Number(form.rate) : null,
      reserve: form.reserve,
      warranty: form.warranty,
      aft1: form.aft1,
      gap: form.gap,
      trade_year: form.trade_year || null,
      trade_make: form.trade_make || null,
      trade_model: form.trade_model || null,
      trade_miles: form.trade_miles || null,
      acv: form.acv,
      payoff: form.payoff,
      funded: form.funded,
      notes: form.notes || null,
    };
    if (deal?.id) (payload as { id?: string }).id = deal.id;
    onSave(payload);
  }

  const inputCls =
    "w-full px-2 py-1 rounded bg-jde-input border border-jde-border text-jde-cyan text-sm focus:outline-none focus:border-jde-cyan";
  const numInputCls =
    "w-full px-2 py-1 rounded bg-jde-input border border-jde-border text-jde-cyan text-sm text-right font-mono focus:outline-none focus:border-jde-cyan";
  const selectCls =
    "w-full px-2 py-1 rounded bg-jde-input border border-jde-border text-jde-cyan text-sm focus:outline-none focus:border-jde-cyan";

  return (
    <tr className="bg-jde-panel/60">
      {/* # */}
      <td className="px-2 py-1">
        <input
          className={inputCls}
          style={{ width: 48 }}
          value={form.deal_num}
          onChange={(e) => setField("deal_num", e.target.value)}
          placeholder="#"
        />
      </td>
      {/* Date */}
      <td className="px-2 py-1">
        <input
          type="date"
          className={inputCls}
          style={{ width: 120 }}
          value={form.deal_date}
          onChange={(e) => setField("deal_date", e.target.value)}
        />
      </td>
      {/* Customer */}
      <td className="px-2 py-1">
        <input
          className={inputCls}
          style={{ width: 130 }}
          value={form.customer_name}
          onChange={(e) => setField("customer_name", e.target.value)}
          placeholder="Customer"
        />
      </td>
      {/* ZIP */}
      <td className="px-2 py-1">
        <input
          className={inputCls}
          style={{ width: 64 }}
          value={form.customer_zip}
          onChange={(e) => setField("customer_zip", e.target.value)}
          placeholder="ZIP"
        />
      </td>
      {/* N/U */}
      <td className="px-2 py-1">
        <select
          className={selectCls}
          style={{ width: 64 }}
          value={form.new_used}
          onChange={(e) => setField("new_used", e.target.value)}
        >
          <option value="">—</option>
          <option value="New">New</option>
          <option value="Used">Used</option>
        </select>
      </td>
      {/* Vehicle (year make model combined) */}
      <td className="px-2 py-1">
        <div className="flex gap-1">
          <input
            className={inputCls}
            style={{ width: 48 }}
            value={form.year}
            onChange={(e) => setField("year", e.target.value)}
            placeholder="Yr"
          />
          <input
            className={inputCls}
            style={{ width: 70 }}
            value={form.make}
            onChange={(e) => setField("make", e.target.value)}
            placeholder="Make"
          />
          <input
            className={inputCls}
            style={{ width: 70 }}
            value={form.model}
            onChange={(e) => setField("model", e.target.value)}
            placeholder="Model"
          />
        </div>
      </td>
      {/* Salesperson */}
      <td className="px-2 py-1">
        <select
          className={selectCls}
          style={{ width: 110 }}
          value={form.salesperson_id}
          onChange={(e) => setField("salesperson_id", e.target.value)}
        >
          <option value="">—</option>
          {reps.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </td>
      {/* SP2 */}
      <td className="px-2 py-1">
        <select
          className={selectCls}
          style={{ width: 100 }}
          value={form.salesperson2_id}
          onChange={(e) => setField("salesperson2_id", e.target.value)}
        >
          <option value="">—</option>
          {reps.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </td>
      {/* Closer */}
      <td className="px-2 py-1">
        <select
          className={selectCls}
          style={{ width: 110 }}
          value={form.closer_id}
          onChange={(e) => setField("closer_id", e.target.value)}
        >
          <option value="">—</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </td>
      {/* Front Gross */}
      <td className="px-2 py-1">
        <input
          type="number"
          className={numInputCls}
          style={{ width: 80 }}
          value={form.front_gross || ""}
          onChange={(e) => numField("front_gross", e.target.value)}
        />
      </td>
      {/* Lender */}
      <td className="px-2 py-1">
        <select
          className={selectCls}
          style={{ width: 100 }}
          value={form.lender}
          onChange={(e) => setField("lender", e.target.value)}
        >
          <option value="">—</option>
          {lenders.map((l) => (
            <option key={l.id} value={l.name}>
              {l.name}
            </option>
          ))}
        </select>
      </td>
      {/* Reserve */}
      <td className="px-2 py-1">
        <input
          type="number"
          className={numInputCls}
          style={{ width: 72 }}
          value={form.reserve || ""}
          onChange={(e) => numField("reserve", e.target.value)}
        />
      </td>
      {/* Warranty */}
      <td className="px-2 py-1">
        <input
          type="number"
          className={numInputCls}
          style={{ width: 72 }}
          value={form.warranty || ""}
          onChange={(e) => numField("warranty", e.target.value)}
        />
      </td>
      {/* Aft1 */}
      <td className="px-2 py-1">
        <input
          type="number"
          className={numInputCls}
          style={{ width: 72 }}
          value={form.aft1 || ""}
          onChange={(e) => numField("aft1", e.target.value)}
        />
      </td>
      {/* GAP */}
      <td className="px-2 py-1">
        <input
          type="number"
          className={numInputCls}
          style={{ width: 72 }}
          value={form.gap || ""}
          onChange={(e) => numField("gap", e.target.value)}
        />
      </td>
      {/* F&I (computed) */}
      <td className="px-2 py-1 text-right font-mono text-jde-purple text-sm">
        {formatCurrency(fiTotal)}
      </td>
      {/* Total (computed) */}
      <td className="px-2 py-1 text-right font-mono font-semibold text-jde-success text-sm">
        {formatCurrency(totalGross)}
      </td>
      {/* Funded */}
      <td className="px-2 py-1 text-center">
        <input
          type="checkbox"
          checked={form.funded}
          onChange={(e) => setField("funded", e.target.checked)}
          className="accent-jde-cyan"
        />
      </td>
      {/* Actions */}
      <td className="px-2 py-1">
        <div className="flex gap-1 justify-center">
          <button
            onClick={handleSubmit}
            className="px-2 py-0.5 rounded border border-jde-success text-jde-success text-xs hover:bg-jde-success/10 transition-colors"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="px-2 py-0.5 rounded border border-jde-border text-jde-muted text-xs hover:bg-jde-panel transition-colors"
          >
            ✕
          </button>
          {onDelete && deal && (
            <button
              onClick={onDelete}
              className="px-2 py-0.5 rounded border border-jde-danger text-jde-danger text-xs hover:bg-jde-danger/10 transition-colors"
            >
              Del
            </button>
          )}
        </div>
      </td>
      {/* Notes */}
      <td className="px-2 py-1">
        <input
          className={inputCls}
          style={{ width: 120 }}
          value={form.notes}
          onChange={(e) => setField("notes", e.target.value)}
          placeholder="Notes..."
        />
      </td>
    </tr>
  );
}
