"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

interface Props {
  eventId?: string;
  currentPage?: string;
}

export default function FeedbackWidget({ eventId, currentPage }: Props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState<"success" | "error" | null>(null);
  const supabase = createClient();

  async function handleSubmit() {
    if (!message.trim()) return;
    setSubmitting(true);

    const { error } = await supabase.from("feedback").insert({
      event_id: eventId || null,
      page: currentPage || null,
      message: message.trim(),
    });

    setSubmitting(false);

    if (error) {
      setFlash("error");
      setTimeout(() => setFlash(null), 2400);
    } else {
      setFlash("success");
      setMessage("");
      setTimeout(() => {
        setFlash(null);
        setOpen(false);
      }, 1500);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center text-lg shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 ${
          open
            ? "bg-jde-border text-jde-muted rotate-45"
            : "bg-jde-cyan text-jde-bg shadow-glow-cyan"
        }`}
        title="Send Feedback"
      >
        {open ? "✕" : "💬"}
      </button>

      {/* Feedback panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-80 bg-jde-surface border border-jde-border rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-jde-border bg-jde-panel">
            <h3 className="text-sm font-bold text-jde-cyan tracking-wide">
              💬 Send Feedback
            </h3>
            <p className="text-[11px] text-jde-muted mt-0.5">
              Requests, bugs, ideas — anything goes
            </p>
          </div>

          {/* Body */}
          <div className="p-4">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What's on your mind?"
              rows={4}
              className="w-full bg-[#1e3a5f] border border-jde-border rounded-lg px-3 py-2 text-sm text-jde-text placeholder-jde-muted/50 focus:outline-none focus:border-jde-cyan resize-none"
              autoFocus
            />

            {/* Flash messages */}
            {flash === "success" && (
              <div className="mt-2 px-3 py-1.5 rounded-lg bg-[#065f46] text-jde-success text-xs font-medium">
                ✓ Feedback submitted — thank you!
              </div>
            )}
            {flash === "error" && (
              <div className="mt-2 px-3 py-1.5 rounded-lg bg-[#7f1d1d] text-jde-danger text-xs font-medium">
                Failed to submit. Try again.
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!message.trim() || submitting}
              className="mt-3 w-full py-2 rounded-lg border border-jde-cyan text-jde-cyan text-sm font-semibold hover:bg-jde-cyan/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
