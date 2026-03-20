"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

interface FeedbackRow {
  id: string;
  event_id: string | null;
  page: string | null;
  message: string;
  created_at: string;
  event?: { dealer_name: string | null } | null;
}

export default function FeedbackPage() {
  const [items, setItems] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("feedback")
      .select("*, event:events(dealer_name)")
      .order("created_at", { ascending: false });
    setItems((data || []) as FeedbackRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit",
    });
  }

  return (
    <div className="min-h-screen bg-jde-bg text-jde-text">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/events"
              className="text-jde-muted hover:text-jde-cyan transition-all duration-200 text-sm"
            >
              &larr; Events
            </Link>
            <h1 className="text-xl font-bold text-jde-text">📋 Feedback</h1>
          </div>
          <span className="text-sm text-jde-muted">
            <span className="font-mono text-jde-cyan">{items.length}</span> submissions
          </span>
        </div>

        {loading ? (
          <div className="text-jde-muted text-center py-12">Loading feedback...</div>
        ) : items.length === 0 ? (
          <div className="bg-jde-surface border border-jde-border rounded-xl p-12 text-center">
            <p className="text-jde-muted text-lg">No feedback yet</p>
            <p className="text-jde-muted/60 text-sm mt-1">
              Submissions from the 💬 widget will appear here
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-jde-surface border border-jde-border rounded-xl p-4 hover:border-jde-cyan/30 transition-colors"
              >
                {/* Meta row */}
                <div className="flex items-center gap-3 mb-2 text-xs text-jde-muted">
                  <span className="font-mono">{formatDate(item.created_at)}</span>
                  {item.event?.dealer_name && (
                    <>
                      <span className="text-jde-border">·</span>
                      <Link
                        href={`/events/${item.event_id}`}
                        className="text-jde-cyan hover:underline"
                      >
                        {item.event.dealer_name}
                      </Link>
                    </>
                  )}
                  {item.page && (
                    <>
                      <span className="text-jde-border">·</span>
                      <span className="px-1.5 py-0.5 rounded bg-jde-panel text-jde-muted">
                        {item.page}
                      </span>
                    </>
                  )}
                </div>
                {/* Message */}
                <p className="text-sm text-jde-text whitespace-pre-wrap leading-relaxed">
                  {item.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
