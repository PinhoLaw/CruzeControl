"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

interface Event {
  id: string;
  name: string;
  dealer_name: string | null;
  franchise: string | null;
  city: string | null;
  state: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
}

interface DealSummary {
  total_deals: number;
  total_gross: number;
  jde_commission: number;
  total_net: number;
}

const TABS = [
  "Roster",
  "Inventory",
  "Deal Log",
  "Washout",
  "Mail Tracking",
  "Recap",
  "Performance",
] as const;

type Tab = (typeof TABS)[number];

export default function EventDashboard() {
  const params = useParams();
  const eventId = params.id as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<DealSummary>({
    total_deals: 0,
    total_gross: 0,
    jde_commission: 0,
    total_net: 0,
  });
  const [activeTab, setActiveTab] = useState<Tab>("Deal Log");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      // Load event
      const { data: eventData } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (!eventData) {
        setLoading(false);
        return;
      }
      setEvent(eventData);

      // Load event_config for pack values
      const { data: config } = await supabase
        .from("event_config")
        .select("pack_new, pack_used, jde_commission_pct")
        .eq("event_id", eventId)
        .single();

      const packNew = Number(config?.pack_new) || 0;
      const packUsed = Number(config?.pack_used) || 0;
      const jdePct = Number(config?.jde_commission_pct) || 0.25;

      // Load deals for stats from sales_deals
      const { data: deals } = await supabase
        .from("sales_deals")
        .select("front_gross, reserve, warranty, aftermarket_1, gap, new_used, total_gross")
        .eq("event_id", eventId);

      if (deals && deals.length > 0) {
        let totalGross = 0;
        let nonCommGross = 0;

        deals.forEach((d) => {
          totalGross += Number(d.total_gross) || 0;
          const pack = d.new_used === "New" ? packNew : packUsed;
          nonCommGross += pack;
        });

        const jdeCommission = totalGross * jdePct;
        const totalNet = totalGross - jdeCommission + nonCommGross;

        setStats({
          total_deals: deals.length,
          total_gross: totalGross,
          jde_commission: jdeCommission,
          total_net: totalNet,
        });
      }

      setLoading(false);
    }

    load();
  }, [eventId]);

  function formatCurrency(n: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);
  }

  function formatDate(d: string | null) {
    if (!d) return "—";
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-jde-bg flex items-center justify-center text-jde-muted">
        Loading...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-jde-bg flex items-center justify-center text-jde-muted">
        Event not found
      </div>
    );
  }

  const displayName = event.dealer_name || event.name;

  return (
    <div className="min-h-screen bg-jde-bg">
      {/* Header */}
      <div className="bg-jde-surface border-b border-jde-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Top row: nav + event name */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link
                href="/events"
                className="text-jde-muted hover:text-jde-cyan transition-colors text-sm"
              >
                &larr; Events
              </Link>
              <div>
                <h1 className="text-xl font-bold text-jde-text">
                  {displayName}
                </h1>
                <p className="text-sm text-jde-muted">
                  {event.franchise && `${event.franchise} · `}
                  {event.city}
                  {event.city && event.state ? ", " : ""}
                  {event.state} · {formatDate(event.start_date)} —{" "}
                  {formatDate(event.end_date)}
                </p>
              </div>
            </div>
            <Link
              href={`/events/${eventId}/settings`}
              className="px-3 py-1.5 rounded border border-jde-border text-sm text-jde-muted hover:text-jde-cyan hover:border-jde-cyan transition-colors"
            >
              Settings
            </Link>
          </div>

          {/* Stat pills */}
          <div className="flex gap-3 mb-4">
            <StatPill
              label="Total Deals"
              value={String(stats.total_deals)}
              color="cyan"
            />
            <StatPill
              label="Total Gross"
              value={formatCurrency(stats.total_gross)}
              color="green"
            />
            <StatPill
              label="JDE Commission"
              value={formatCurrency(stats.jde_commission)}
              color="purple"
            />
            <StatPill
              label="Total Net"
              value={formatCurrency(stats.total_net)}
              color="amber"
            />
          </div>

          {/* Tab navigation */}
          <div className="flex gap-1 -mb-[1px]">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm rounded-t transition-colors ${
                  activeTab === tab
                    ? "bg-jde-bg text-jde-cyan border border-jde-border border-b-jde-bg font-medium"
                    : "text-jde-muted hover:text-jde-text"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content area */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="rounded-lg bg-jde-surface border border-jde-border p-6 min-h-[400px] flex items-center justify-center">
          <p className="text-jde-muted">
            {activeTab} tab — content coming soon
          </p>
        </div>
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "cyan" | "green" | "purple" | "amber";
}) {
  const colorMap = {
    cyan: "bg-jde-cyan/10 text-jde-cyan border-jde-cyan/30",
    green: "bg-jde-success/10 text-jde-success border-jde-success/30",
    purple: "bg-jde-purple/10 text-jde-purple border-jde-purple/30",
    amber: "bg-jde-warning/10 text-jde-warning border-jde-warning/30",
  };

  return (
    <div
      className={`px-4 py-2 rounded-lg border ${colorMap[color]} flex items-center gap-2`}
    >
      <span className="text-xs opacity-70">{label}</span>
      <span className="font-mono font-semibold text-sm">{value}</span>
    </div>
  );
}
