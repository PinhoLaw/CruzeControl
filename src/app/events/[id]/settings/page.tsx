"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEvent, updateEvent } from "@/lib/supabase/queries/events";
import type { EventRow } from "@/types/database";
import { EventStatus } from "@/types/enums";
import Link from "next/link";

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
  misc_expenses: string;
  status: string;
};

function eventToForm(e: EventRow): FormData {
  return {
    dealer_name: e.dealer_name || "",
    franchise: e.franchise || "",
    street: e.street || "",
    city: e.city || "",
    state: e.state || "",
    zip: e.zip || "",
    start_date: e.start_date || "",
    end_date: e.end_date || "",
    mail_piece_type: e.mail_piece_type || "",
    mail_quantity: e.mail_quantity != null ? String(e.mail_quantity) : "",
    drop_1: e.drop_1 || "",
    drop_2: e.drop_2 || "",
    drop_3: e.drop_3 || "",
    giveaway_1: e.giveaway_1 || "",
    giveaway_2: e.giveaway_2 || "",
    pack_new: String(e.pack_new ?? 0),
    pack_used: String(e.pack_used ?? 0),
    pack_company: String(e.pack_company ?? 0),
    jde_pct: String(e.jde_pct ?? 25),
    marketing_cost: String(e.marketing_cost ?? 0),
    misc_expenses: String(e.misc_expenses ?? 0),
    status: e.status || "draft",
  };
}

const inputCls =
  "w-full px-3 py-2 rounded-md bg-[#1e3a5f] border border-jde-border text-jde-cyan text-sm font-mono focus:outline-none focus:border-jde-cyan placeholder:text-slate-600";
const labelCls = "block text-xs text-jde-muted uppercase tracking-wider mb-1";
const selectCls =
  "w-full px-3 py-2 rounded-md bg-[#1e3a5f] border border-jde-border text-jde-cyan text-sm font-mono focus:outline-none focus:border-jde-cyan";

export default function EventSettings() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const event = await getEvent(eventId);
        if (event) setForm(eventToForm(event));
      } catch (err) {
        console.error("Failed to load event:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [eventId]);

  function setField(key: keyof FormData, value: string) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);

    try {
      await updateEvent({
        id: eventId,
        dealer_name: form.dealer_name,
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
        misc_expenses: Number(form.misc_expenses) || 0,
        status: form.status as EventStatus,
      });

      setFlash({ type: "success", msg: "Event settings saved" });
      setTimeout(() => {
        router.push(`/events/${eventId}`);
      }, 800);
    } catch (err) {
      console.error("Failed to save:", err);
      setFlash({ type: "error", msg: "Failed to save settings" });
      setTimeout(() => setFlash(null), 2400);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-jde-bg flex items-center justify-center text-jde-muted">
        Loading...
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-jde-bg flex items-center justify-center text-jde-muted">
        Event not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-jde-bg">
      {/* Header */}
      <div className="bg-jde-surface border-b border-jde-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/events/${eventId}`}
              className="text-jde-muted hover:text-jde-cyan transition-colors text-sm"
            >
              &larr; Back to Dashboard
            </Link>
            <h1 className="text-lg font-bold text-jde-text">Event Settings</h1>
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
      <form onSubmit={handleSave} className="max-w-4xl mx-auto px-6 py-6">
        {/* Dealer Info */}
        <Section title="Dealer Information">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Dealer Name" required>
              <input
                className={inputCls}
                value={form.dealer_name}
                onChange={(e) => setField("dealer_name", e.target.value)}
                required
              />
            </Field>
            <Field label="Franchise">
              <input
                className={inputCls}
                value={form.franchise}
                onChange={(e) => setField("franchise", e.target.value)}
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
          <div className="grid grid-cols-6 gap-4">
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
            <Field label="Misc Expenses ($)">
              <input
                type="number"
                className={inputCls}
                value={form.misc_expenses}
                onChange={(e) => setField("misc_expenses", e.target.value)}
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

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-8">
          <Link
            href={`/events/${eventId}`}
            className="px-5 py-2 rounded-md border border-jde-border text-jde-muted text-sm hover:text-jde-text transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 rounded-md border border-jde-cyan text-jde-cyan text-sm font-medium hover:bg-jde-cyan/10 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
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
