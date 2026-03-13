"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

interface EventRow {
  id: string;
  dealer_name: string | null;
  franchise: string | null;
  city: string | null;
  state: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  name: string;
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

      // Get deal counts per event from deals
      const { data: dealCounts } = await supabase
        .from("deals")
        .select("event_id");

      const countMap: Record<string, number> = {};
      dealCounts?.forEach((d) => {
        countMap[d.event_id] = (countMap[d.event_id] || 0) + 1;
      });

      const mapped: EventRow[] = eventsData.map((e) => ({
        id: e.id,
        dealer_name: e.dealer_name || e.name,
        franchise: e.franchise,
        city: e.city,
        state: e.state,
        start_date: e.start_date,
        end_date: e.end_date,
        status: e.status,
        name: e.name,
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

  function accentColor(status: string) {
    switch (status) {
      case "active":
        return "bg-jde-cyan";
      case "completed":
        return "bg-jde-success";
      default:
        return "bg-jde-muted/30";
    }
  }

  return (
    <div className="min-h-screen bg-jde-bg">
      {/* Header */}
      <div className="border-b border-jde-border header-gradient">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-jde-cyan shadow-glow-cyan" />
            <h1 className="text-xl font-bold text-jde-cyan tracking-wide">
              JDE MISSION CONTROL
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-jde-text">Events</h2>
          <Link
            href="/events/new"
            className="px-4 py-2 rounded-lg border border-jde-cyan text-jde-cyan text-sm font-medium hover:bg-jde-cyan/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            + New Event
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-lg bg-jde-surface border border-jde-border p-5 relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-jde-border" />
                <div className="pl-2">
                  <div className="skeleton h-5 w-3/4 mb-3" />
                  <div className="skeleton h-3 w-1/2 mb-2" />
                  <div className="skeleton h-3 w-2/3 mb-4" />
                  <div className="border-t border-jde-border pt-3 mt-3">
                    <div className="skeleton h-4 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 text-jde-muted">
            <div className="text-4xl mb-4 opacity-40">🚗</div>
            <p className="text-lg mb-2">No events yet</p>
            <p className="text-sm">Create your first event to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="block py-5 pr-5 pl-7 rounded-lg bg-jde-surface border border-jde-border hover:border-jde-cyan/50 hover:shadow-glow-cyan transition-all duration-200 relative overflow-hidden"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentColor(event.status)}`} />

                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-jde-text">
                      {event.dealer_name || event.name}
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
                  <span className="font-mono text-base font-bold text-jde-cyan">
                    {event.deal_count}
                  </span>
                  <span className="text-sm text-jde-muted ml-1.5">
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
