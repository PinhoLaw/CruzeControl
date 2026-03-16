"use client";

import { useState, useEffect, useRef } from "react";
import { calcFiTotal, calcTotalGross } from "@/lib/calculations";
import { formatCurrency } from "@/lib/formatters";
import { NewUsed } from "@/types/enums";
import type { DealRow, DealInsert, SalespersonRow, LenderRow } from "@/types/database";

interface Props {
  eventId: string;
  deal: DealRow;
  index: number;
  reps: SalespersonRow[];
  managers: SalespersonRow[];
  lenders: LenderRow[];
  onSave: (deal: DealInsert) => Promise<DealRow>;
  onDelete: (id: string) => void;
}

function formFromDeal(d: DealRow) {
  return {
    deal_num: d.deal_num ?? "",
    deal_date: d.deal_date ?? "",
    customer_name: d.customer_name ?? "",
    customer_zip: d.customer_zip ?? "",
    new_used: d.new_used ?? "",
    year: d.year != null ? String(d.year) : "",
    make: d.make ?? "",
    model: d.model ?? "",
    salesperson_id: d.salesperson_id ?? "",
    salesperson2_id: d.salesperson2_id ?? "",
    closer_id: d.closer_id ?? "",
    front_gross: d.front_gross ?? 0,
    lender: d.lender ?? "",
    rate: d.rate != null ? String(d.rate) : "",
    reserve: d.reserve ?? 0,
    warranty: d.warranty ?? 0,
    aft1: d.aft1 ?? 0,
    gap: d.gap ?? 0,
    trade_year: d.trade_year ?? "",
    trade_make: d.trade_make ?? "",
    trade_model: d.trade_model ?? "",
    trade_miles: d.trade_miles ?? "",
    acv: d.acv ?? 0,
    payoff: d.payoff ?? 0,
    funded: d.funded ?? false,
    notes: d.notes ?? "",
  };
}

type Form = ReturnType<typeof formFromDeal>;

export default function DealRowEditor({
  eventId,
  deal,
  index,
  reps,
  managers,
  lenders,
  onSave,
  onDelete,
}: Props) {
  const [form, setForm] = useState<Form>(() => formFromDeal(deal));
  const [flashGreen, setFlashGreen] = useState(false);
  const pendingRef = useRef(false);

  // Sync from parent when not mid-save
  useEffect(() => {
    if (!pendingRef.current) setForm(formFromDeal(deal));
  }, [deal]);

  const fiTotal = calcFiTotal(form.reserve, form.warranty, form.aft1, form.gap);
  const totalGross = calcTotalGross(form.front_gross, fiTotal);

  function setField<K extends keyof Form>(key: K, val: Form[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function numField(key: keyof Form, val: string) {
    setField(key, (val === "" ? 0 : Number(val)) as never);
  }

  function buildPayload(f: Form): DealInsert {
    const payload: DealInsert = {
      event_id: eventId,
      deal_num: f.deal_num || null,
      deal_date: f.deal_date || null,
      customer_name: f.customer_name || null,
      customer_zip: f.customer_zip || null,
      new_used: f.new_used === "New" ? NewUsed.New : f.new_used === "Used" ? NewUsed.Used : null,
      year: f.year ? Number(f.year) : null,
      make: f.make || null,
      model: f.model || null,
      salesperson_id: f.salesperson_id || null,
      salesperson2_id: f.salesperson2_id || null,
      closer_id: f.closer_id || null,
      closer_type: f.closer_id ? "manager" : null,
      front_gross: f.front_gross,
      lender: f.lender || null,
      rate: f.rate ? Number(f.rate) : null,
      reserve: f.reserve,
      warranty: f.warranty,
      aft1: f.aft1,
      gap: f.gap,
      trade_year: f.trade_year || null,
      trade_make: f.trade_make || null,
      trade_model: f.trade_model || null,
      trade_miles: f.trade_miles || null,
      acv: f.acv,
      payoff: f.payoff,
      funded: f.funded,
      notes: f.notes || null,
    };
    (payload as { id?: string }).id = deal.id;
    return payload;
  }

  function hasChanges(f: Form): boolean {
    const orig = formFromDeal(deal);
    return (Object.keys(orig) as (keyof Form)[]).some((k) => f[k] !== orig[k]);
  }

  async function doSave(overrides?: Partial<Form>) {
    const f = overrides ? { ...form, ...overrides } : form;
    if (!hasChanges(f)) return;
    pendingRef.current = true;
    try {
      await onSave(buildPayload(f));
      setFlashGreen(true);
      setTimeout(() => {
        setFlashGreen(false);
        pendingRef.current = false;
      }, 600);
    } catch {
      pendingRef.current = false;
    }
  }

  function saveOnBlur() {
    doSave();
  }

  // For dropdowns / checkbox: update state + save immediately with override
  function handleSelectChange(field: keyof Form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    doSave({ [field]: value } as Partial<Form>);
  }

  function handleCheckboxChange(field: keyof Form, checked: boolean) {
    setForm((prev) => ({ ...prev, [field]: checked }));
    doSave({ [field]: checked } as Partial<Form>);
  }

  const stripeBg = index % 2 === 0 ? "bg-jde-surface" : "bg-jde-bg";

  const inputCls =
    "w-full px-2 py-1 rounded bg-jde-input border border-jde-border text-jde-cyan text-sm focus:outline-none focus:border-jde-cyan";
  const numInputCls =
    "w-full px-2 py-1 rounded bg-jde-input border border-jde-border text-jde-cyan text-sm text-right font-mono focus:outline-none focus:border-jde-cyan";
  const selectCls =
    "w-full px-2 py-1 rounded bg-jde-input border border-jde-border text-jde-cyan text-sm focus:outline-none focus:border-jde-cyan";

  return (
    <tr
      className={`${flashGreen ? "bg-emerald-900/40" : stripeBg} transition-colors duration-500`}
    >
      {/* # */}
      <td className="px-2 py-1">
        <input
          className={inputCls}
          style={{ width: 48 }}
          value={form.deal_num}
          onChange={(e) => setField("deal_num", e.target.value)}
          onBlur={saveOnBlur}
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
          onBlur={saveOnBlur}
        />
      </td>
      {/* Customer */}
      <td className="px-2 py-1">
        <input
          className={inputCls}
          style={{ width: 130 }}
          value={form.customer_name}
          onChange={(e) => setField("customer_name", e.target.value)}
          onBlur={saveOnBlur}
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
          onBlur={saveOnBlur}
          placeholder="ZIP"
        />
      </td>
      {/* N/U */}
      <td className="px-2 py-1">
        <select
          className={selectCls}
          style={{ width: 64 }}
          value={form.new_used}
          onChange={(e) => handleSelectChange("new_used", e.target.value)}
        >
          <option value="">--</option>
          <option value="New">New</option>
          <option value="Used">Used</option>
        </select>
      </td>
      {/* Vehicle (year make model) */}
      <td className="px-2 py-1">
        <div className="flex gap-1">
          <input
            className={inputCls}
            style={{ width: 48 }}
            value={form.year}
            onChange={(e) => setField("year", e.target.value)}
            onBlur={saveOnBlur}
            placeholder="Yr"
          />
          <input
            className={inputCls}
            style={{ width: 70 }}
            value={form.make}
            onChange={(e) => setField("make", e.target.value)}
            onBlur={saveOnBlur}
            placeholder="Make"
          />
          <input
            className={inputCls}
            style={{ width: 70 }}
            value={form.model}
            onChange={(e) => setField("model", e.target.value)}
            onBlur={saveOnBlur}
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
          onChange={(e) => handleSelectChange("salesperson_id", e.target.value)}
        >
          <option value="">--</option>
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
          onChange={(e) => handleSelectChange("salesperson2_id", e.target.value)}
        >
          <option value="">--</option>
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
          onChange={(e) => handleSelectChange("closer_id", e.target.value)}
        >
          <option value="">--</option>
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
          onBlur={saveOnBlur}
        />
      </td>
      {/* Lender */}
      <td className="px-2 py-1">
        <select
          className={selectCls}
          style={{ width: 100 }}
          value={form.lender}
          onChange={(e) => handleSelectChange("lender", e.target.value)}
        >
          <option value="">--</option>
          {lenders.map((l) => (
            <option key={l.id} value={l.name}>
              {l.name}
            </option>
          ))}
        </select>
      </td>
      {/* Rate */}
      <td className="px-2 py-1">
        <input
          className={numInputCls}
          style={{ width: 56 }}
          value={form.rate}
          onChange={(e) => setField("rate", e.target.value)}
          onBlur={saveOnBlur}
          placeholder="%"
        />
      </td>
      {/* Reserve */}
      <td className="px-2 py-1">
        <input
          type="number"
          className={numInputCls}
          style={{ width: 72 }}
          value={form.reserve || ""}
          onChange={(e) => numField("reserve", e.target.value)}
          onBlur={saveOnBlur}
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
          onBlur={saveOnBlur}
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
          onBlur={saveOnBlur}
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
          onBlur={saveOnBlur}
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
          onChange={(e) => handleCheckboxChange("funded", e.target.checked)}
          className="accent-jde-cyan"
        />
      </td>
      {/* Delete */}
      <td className="px-2 py-1 text-center">
        <button
          onClick={() => onDelete(deal.id)}
          className="px-2 py-0.5 rounded border border-jde-danger text-jde-danger text-xs hover:bg-jde-danger/10 transition-colors"
        >
          Del
        </button>
      </td>
      {/* Notes */}
      <td className="px-2 py-1">
        <input
          className={inputCls}
          style={{ width: 120 }}
          value={form.notes}
          onChange={(e) => setField("notes", e.target.value)}
          onBlur={saveOnBlur}
          placeholder="Notes..."
        />
      </td>
    </tr>
  );
}
