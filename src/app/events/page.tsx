"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

interface EventRow {
  id: string;
  dealer_name: string;
  franchise: string | null;
  city: string | null;
  state: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  deal_count: number;
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadEvents() {
      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .order("start_date", { ascending: false });

      if (!eventsData) {
        setLoading(false);
        return;
      }

      // Get deal counts per event
      const { data: dealCounts } = await supabase
        .from("deals")
        .select("event_id");

      const countMap: Record<string, number> = {};
      dealCounts?.forEach((d) => {
        countMap[d.event_id] = (countMap[d.event_id] || 0) + 1;
      });

      const mapped: EventRow[] = eventsData.map((e) => ({
        id: e.id,
        dealer_name: e.dealer_name,
        franchise: e.franchise,
        city: e.city,
        state: e.state,
        start_date: e.start_date,
        end_date: e.end_date,
        status: e.status,
        deal_count: countMap[e.id] || 0,
      }));

      setEvents(mapped);
      setLoading(false);
    }

    loadEvents();
  }, []);

  function formatDate(d: string | null) {
    if (!d) return "—";
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function statusColor(status: string) {
    switch (status) {
      case "active":
        return "bg-jde-cyan/20 text-jde-cyan";
      case "completed":
        return "bg-jde-success/20 text-jde-success";
      case "draft":
        return "bg-jde-muted/20 text-jde-muted";
      default:
        return "bg-jde-muted/20 text-jde-muted";
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-jde-bg">
      {/* Header */}
      <div className="border-b border-jde-border bg-jde-surface">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-jde-cyan tracking-wide">
            JDE MISSION CONTROL
          </h1>
          <button
            onClick={handleSignOut}
            className="text-sm text-jde-muted hover:text-jde-cyan transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-jde-text">Events</h2>
          <Link
            href="/events/new"
            className="px-4 py-2 rounded border border-jde-cyan text-jde-cyan text-sm hover:bg-jde-cyan/10 transition-colors"
          >
            + New Event
          </Link>
        </div>

        {loading ? (
          <div className="text-jde-muted">Loading...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 text-jde-muted">
            <p className="text-lg mb-2">No events yet</p>
            <p className="text-sm">
              Create your first event to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="block p-5 rounded-lg bg-jde-surface border border-jde-border hover:border-jde-cyan/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-jde-text">
                      {event.dealer_name}
                    </h3>
                    {event.franchise && (
                      <p className="text-sm text-jde-muted">
                        {event.franchise}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${statusColor(event.status)}`}
                  >
                    {event.status}
                  </span>
                </div>

                <div className="text-sm text-jde-muted space-y-1">
                  {(event.city || event.state) && (
                    <p>
                      {event.city}
                      {event.city && event.state ? ", " : ""}
                      {event.state}
                    </p>
                  )}
                  <p>
                    {formatDate(event.start_date)} —{" "}
                    {formatDate(event.end_date)}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-jde-border">
                  <span className="font-mono text-sm text-jde-cyan">
                    {event.deal_count}
                  </span>
                  <span className="text-sm text-jde-muted ml-1">
                    {event.deal_count === 1 ? "deal" : "deals"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
