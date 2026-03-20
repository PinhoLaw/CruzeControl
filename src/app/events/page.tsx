"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import FeedbackWidget from "@/components/FeedbackWidget";

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
  total_gross: number;
}

interface AggStats {
  totalDeals: number;
  totalGross: number;
  totalUps: number;
  totalDays: number;
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [agg, setAgg] = useState<AggStats>({ totalDeals: 0, totalGross: 0, totalUps: 0, totalDays: 0 });
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

      // Get deal counts and total gross per event
      const { data: dealData } = await supabase
        .from("deals")
        .select("event_id, total_gross");

      // Get mail tracking UPs
      const { data: mailData } = await supabase
        .from("mail_tracking")
        .select("event_id, day_1, day_2, day_3, day_4, day_5, day_6, day_7, day_8, day_9, day_10, day_11");

      const countMap: Record<string, number> = {};
      const grossMap: Record<string, number> = {};
      dealData?.forEach((d) => {
        countMap[d.event_id] = (countMap[d.event_id] || 0) + 1;
        grossMap[d.event_id] = (grossMap[d.event_id] || 0) + (Number(d.total_gross) || 0);
      });

      // Compute UPs per event
      const upsMap: Record<string, number> = {};
      mailData?.forEach((m) => {
        const ups = (m.day_1||0)+(m.day_2||0)+(m.day_3||0)+(m.day_4||0)+(m.day_5||0)+(m.day_6||0)+(m.day_7||0)+(m.day_8||0)+(m.day_9||0)+(m.day_10||0)+(m.day_11||0);
        upsMap[m.event_id] = (upsMap[m.event_id] || 0) + ups;
      });

      // Compute aggregate stats (completed events only)
      let totalDeals = 0, totalGross = 0, totalUps = 0, totalDays = 0;
      eventsData.filter((e) => e.status === "completed").forEach((e) => {
        totalDeals += countMap[e.id] || 0;
        totalGross += grossMap[e.id] || 0;
        totalUps += upsMap[e.id] || 0;
        if (e.start_date && e.end_date) {
          const start = new Date(e.start_date + "T00:00:00");
          const end = new Date(e.end_date + "T00:00:00");
          totalDays += Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
        }
      });
      setAgg({ totalDeals, totalGross, totalUps, totalDays });

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
        total_gross: grossMap[e.id] || 0,
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

  function formatCurrency(n: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);
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
          {!loading && agg.totalDays > 0 && (
            <div className="flex items-center gap-4 md:gap-6">
              <div className="text-right">
                <div className="font-mono text-sm md:text-base font-bold text-jde-cyan">
                  {(agg.totalDeals / agg.totalDays).toFixed(1)}
                </div>
                <div className="text-[9px] md:text-[10px] text-jde-muted uppercase tracking-wider">Deals / Day</div>
              </div>
              <div className="w-px h-8 bg-jde-border" />
              <div className="text-right">
                <div className="font-mono text-sm md:text-base font-bold text-jde-success">
                  {formatCurrency(Math.round(agg.totalGross / agg.totalDays))}
                </div>
                <div className="text-[9px] md:text-[10px] text-jde-muted uppercase tracking-wider">Gross / Day</div>
              </div>
              <div className="w-px h-8 bg-jde-border" />
              <div className="text-right">
                <div className="font-mono text-sm md:text-base font-bold text-jde-purple">
                  {(agg.totalUps / agg.totalDays).toFixed(1)}
                </div>
                <div className="text-[9px] md:text-[10px] text-jde-muted uppercase tracking-wider">UPs / Day</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-jde-text">Events</h2>
          <div className="flex items-center gap-3">
            <Link
              href="/feedback"
              className="px-3 py-2 rounded-lg border border-jde-border text-jde-muted text-sm hover:text-jde-cyan hover:border-jde-cyan/30 transition-all duration-200"
            >
              📋 Feedback
            </Link>
            <Link
              href="/events/new"
              className="px-4 py-2 rounded-lg border border-jde-cyan text-jde-cyan text-sm font-medium hover:bg-jde-cyan/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              + New Event
            </Link>
          </div>
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

                <div className="mt-3 pt-3 border-t border-jde-border flex items-center">
                  <span className="font-mono text-base font-bold text-jde-cyan">
                    {event.deal_count}
                  </span>
                  <span className="text-sm text-jde-muted ml-1.5">
                    {event.deal_count === 1 ? "deal" : "deals"}
                  </span>
                  {event.deal_count > 0 && (
                    <>
                      <span className="text-jde-border mx-3">|</span>
                      <span className="font-mono text-base font-bold text-jde-success">
                        {formatCurrency(event.total_gross)}
                      </span>
                      <span className="text-sm text-jde-muted ml-1.5">
                        total gross
                      </span>
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <FeedbackWidget currentPage="Events List" />
    </div>
  );
}
