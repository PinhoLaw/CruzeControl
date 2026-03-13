"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEvent } from "@/lib/supabase/queries/events";
import { bulkInsertLenders } from "@/lib/supabase/queries/lenders";
import { EventStatus } from "@/types/enums";
import Link from "next/link";

const DEFAULT_LENDERS = [
  "BECU",
  "KITSAP",
  "HARBORSTONE",
  "GESA",
  "GLOBAL",
  "ALLY",
  "NMAC",
  "CPS",
  "ICCU",
  "WHATCOM",
  "CASH",
  "OTHER",
  "FIRST TEC EXP 09",
  "TRULIANT EQUI VANTAGE",
  "SHARONVIEW TRANS 08",
  "CINCH TRANS 08",
  "AXOS EQUIFAX 08",
  "PENN FED EQUI 08 NON AUTO",
  "US BANK EQUIFAX 09",
  "EXETER EXP",
  "ALLY EXP",
  "SANT EXP",
  "MID AMER CU (9YR OLD MAX)",
];

type FormData = {
  dealer_name: string;
  franchise: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  start_date: string;
  end_date: string;
  mail_piece_type: string;
  mail_quantity: string;
  drop_1: string;
  drop_2: string;
  drop_3: string;
  giveaway_1: string;
  giveaway_2: string;
  pack_new: string;
  pack_used: string;
  pack_company: string;
  jde_pct: string;
  marketing_cost: string;
  status: string;
};

const INITIAL_FORM: FormData = {
  dealer_name: "",
  franchise: "",
  street: "",
  city: "",
  state: "",
  zip: "",
  start_date: "",
  end_date: "",
  mail_piece_type: "",
  mail_quantity: "",
  drop_1: "",
  drop_2: "",
  drop_3: "",
  giveaway_1: "",
  giveaway_2: "",
  pack_new: "0",
  pack_used: "0",
  pack_company: "0",
  jde_pct: "25",
  marketing_cost: "0",
  status: "draft",
};

const inputCls =
  "w-full px-3 py-2 rounded-md bg-[#1e3a5f] border border-jde-border text-jde-cyan text-sm font-mono focus:outline-none focus:border-jde-cyan placeholder:text-slate-600";
const labelCls = "block text-xs text-jde-muted uppercase tracking-wider mb-1";
const selectCls =
  "w-full px-3 py-2 rounded-md bg-[#1e3a5f] border border-jde-border text-jde-cyan text-sm font-mono focus:outline-none focus:border-jde-cyan";

export default function NewEventPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  function setField(key: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.dealer_name.trim()) return;
    setSaving(true);

    try {
      const event = await createEvent({
        dealer_name: form.dealer_name.trim(),
        franchise: form.franchise || null,
        street: form.street || null,
        city: form.city || null,
        state: form.state || null,
        zip: form.zip || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        mail_piece_type: form.mail_piece_type || null,
        mail_quantity: form.mail_quantity ? Number(form.mail_quantity) : null,
        drop_1: form.drop_1 || null,
        drop_2: form.drop_2 || null,
        drop_3: form.drop_3 || null,
        giveaway_1: form.giveaway_1 || null,
        giveaway_2: form.giveaway_2 || null,
        pack_new: Number(form.pack_new) || 0,
        pack_used: Number(form.pack_used) || 0,
        pack_company: Number(form.pack_company) || 0,
        jde_pct: Number(form.jde_pct) || 25,
        marketing_cost: Number(form.marketing_cost) || 0,
        status: form.status as EventStatus,
      });

      // Insert default lenders for the new event
      await bulkInsertLenders(event.id, DEFAULT_LENDERS);

      setFlash({ type: "success", msg: "Event created — redirecting to Roster..." });
      setTimeout(() => {
        router.push(`/events/${event.id}?tab=roster`);
      }, 600);
    } catch (err) {
      console.error("Failed to create event:", err);
      setFlash({ type: "error", msg: "Failed to create event" });
      setTimeout(() => setFlash(null), 2400);
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-jde-bg">
      {/* Header */}
      <div className="bg-jde-surface border-b border-jde-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/events"
              className="text-jde-muted hover:text-jde-cyan transition-colors text-sm"
            >
              &larr; Back to Events
            </Link>
            <h1 className="text-lg font-bold text-jde-text">Create New Event</h1>
          </div>
        </div>
      </div>

      {/* Flash */}
      {flash && (
        <div className="max-w-4xl mx-auto px-6 mt-4">
          <div
            className={`px-4 py-2 rounded text-sm ${
              flash.type === "success"
                ? "bg-[#065f46] text-jde-success"
                : "bg-[#7f1d1d] text-jde-danger"
            }`}
          >
            {flash.msg}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-6 py-6">
        {/* Dealer Info */}
        <Section title="Dealer Information">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Dealer Name" required>
              <input
                className={inputCls}
                value={form.dealer_name}
                onChange={(e) => setField("dealer_name", e.target.value)}
                placeholder="e.g. Tacoma Nissan"
                required
              />
            </Field>
            <Field label="Franchise">
              <input
                className={inputCls}
                value={form.franchise}
                onChange={(e) => setField("franchise", e.target.value)}
                placeholder="e.g. Nissan"
              />
            </Field>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-3">
            <Field label="Street" span={2}>
              <input
                className={inputCls}
                value={form.street}
                onChange={(e) => setField("street", e.target.value)}
              />
            </Field>
            <Field label="City">
              <input
                className={inputCls}
                value={form.city}
                onChange={(e) => setField("city", e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="State">
                <input
                  className={inputCls}
                  value={form.state}
                  onChange={(e) => setField("state", e.target.value)}
                  maxLength={2}
                  placeholder="WA"
                />
              </Field>
              <Field label="ZIP">
                <input
                  className={inputCls}
                  value={form.zip}
                  onChange={(e) => setField("zip", e.target.value)}
                />
              </Field>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-3">
            <Field label="Start Date">
              <input
                type="date"
                className={inputCls}
                value={form.start_date}
                onChange={(e) => setField("start_date", e.target.value)}
              />
            </Field>
            <Field label="End Date">
              <input
                type="date"
                className={inputCls}
                value={form.end_date}
                onChange={(e) => setField("end_date", e.target.value)}
              />
            </Field>
            <Field label="Status">
              <select
                className={selectCls}
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </Field>
          </div>
        </Section>

        {/* Company Packs & Commission */}
        <Section title="Company Packs & Commission">
          <div className="grid grid-cols-5 gap-4">
            <Field label="Pack — New ($)">
              <input
                type="number"
                className={inputCls}
                value={form.pack_new}
                onChange={(e) => setField("pack_new", e.target.value)}
              />
            </Field>
            <Field label="Pack — Used ($)">
              <input
                type="number"
                className={inputCls}
                value={form.pack_used}
                onChange={(e) => setField("pack_used", e.target.value)}
              />
            </Field>
            <Field label="Pack — Company ($)">
              <input
                type="number"
                className={inputCls}
                value={form.pack_company}
                onChange={(e) => setField("pack_company", e.target.value)}
              />
            </Field>
            <Field label="JDE Commission (%)">
              <input
                type="number"
                className={inputCls}
                value={form.jde_pct}
                onChange={(e) => setField("jde_pct", e.target.value)}
                step="0.1"
              />
            </Field>
            <Field label="Marketing Cost ($)">
              <input
                type="number"
                className={inputCls}
                value={form.marketing_cost}
                onChange={(e) => setField("marketing_cost", e.target.value)}
              />
            </Field>
          </div>
        </Section>

        {/* Marketing / Mail */}
        <Section title="Marketing Information">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Mail Piece Type">
              <input
                className={inputCls}
                value={form.mail_piece_type}
                onChange={(e) => setField("mail_piece_type", e.target.value)}
                placeholder="e.g. 11x14 postcard"
              />
            </Field>
            <Field label="Mail Quantity">
              <input
                type="number"
                className={inputCls}
                value={form.mail_quantity}
                onChange={(e) => setField("mail_quantity", e.target.value)}
              />
            </Field>
            <div /> {/* spacer */}
          </div>
          <div className="grid grid-cols-3 gap-4 mt-3">
            <Field label="Drop 1 Date">
              <input
                type="date"
                className={inputCls}
                value={form.drop_1}
                onChange={(e) => setField("drop_1", e.target.value)}
              />
            </Field>
            <Field label="Drop 2 Date">
              <input
                type="date"
                className={inputCls}
                value={form.drop_2}
                onChange={(e) => setField("drop_2", e.target.value)}
              />
            </Field>
            <Field label="Drop 3 Date">
              <input
                type="date"
                className={inputCls}
                value={form.drop_3}
                onChange={(e) => setField("drop_3", e.target.value)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <Field label="Giveaway / Premium 1">
              <input
                className={inputCls}
                value={form.giveaway_1}
                onChange={(e) => setField("giveaway_1", e.target.value)}
              />
            </Field>
            <Field label="Giveaway / Premium 2">
              <input
                className={inputCls}
                value={form.giveaway_2}
                onChange={(e) => setField("giveaway_2", e.target.value)}
              />
            </Field>
          </div>
        </Section>

        {/* Lenders note */}
        <div className="mb-8 px-3 py-2 rounded-md bg-jde-panel border border-jde-border">
          <p className="text-xs text-jde-muted">
            <span className="text-jde-cyan font-medium">23 default lenders</span> will be added automatically when the event is created. You can edit them on the Roster tab.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/events"
            className="px-5 py-2 rounded-md border border-jde-border text-jde-muted text-sm hover:text-jde-text transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 rounded-md border border-jde-cyan text-jde-cyan text-sm font-medium hover:bg-jde-cyan/10 transition-colors disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Event"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <h2 className="text-sm font-bold text-jde-cyan uppercase tracking-wider mb-4 pb-2 border-b border-jde-border">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  span,
  children,
}: {
  label: string;
  required?: boolean;
  span?: number;
  children: React.ReactNode;
}) {
  return (
    <div className={span === 2 ? "col-span-2" : ""}>
      <label className={labelCls}>
        {label}
        {required && <span className="text-jde-danger ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
