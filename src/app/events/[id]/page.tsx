"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import DealLogContainer from "@/components/deal-log/DealLogContainer";
import WashoutTable from "@/components/washout/WashoutTable";
import RecapSummary from "@/components/recap/RecapSummary";
import RosterTable from "@/components/roster/RosterTable";
import MailTrackingTable from "@/components/mail-tracking/MailTrackingTable";
import PerformanceTable from "@/components/performance/PerformanceTable";
import InventoryTable from "@/components/inventory/InventoryTable";
import EventKPIPanel from "@/components/kpi/EventKPIPanel";

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
  new_count: number;
  used_count: number;
  new_gross: number;
  used_gross: number;
  warranty_count: number;
  gap_count: number;
}

const TABS = [
  "Roster",
  "Inventory",
  "Deal Log",
  "Washout",
  "Mail Tracking",
  "Recap",
  "Performance",
  "KPI",
  "Settings",
] as const;

type Tab = (typeof TABS)[number];

const TAB_ICONS: Record<Tab, string> = {
  Roster: "\uD83D\uDC65",
  Inventory: "\uD83D\uDE97",
  "Deal Log": "\uD83D\uDCDD",
  Washout: "\uD83D\uDCB0",
  "Mail Tracking": "\uD83D\uDCEC",
  Recap: "\uD83D\uDCCA",
  Performance: "\uD83C\uDFC6",
  KPI: "📊",
  Settings: "⚙",
};

function getInitialTab(param: string | null): Tab {
  if (!param) return "Deal Log";
  const match = TABS.find(
    (t) => t.toLowerCase().replace(/\s+/g, "-") === param.toLowerCase()
  );
  return match ?? "Deal Log";
}

export default function EventDashboard() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = params.id as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<DealSummary>({
    total_deals: 0,
    total_gross: 0,
    new_count: 0,
    used_count: 0,
    new_gross: 0,
    used_gross: 0,
    warranty_count: 0,
    gap_count: 0,
  });
  const [activeTab, setActiveTab] = useState<Tab>(
    getInitialTab(searchParams.get("tab"))
  );
  const [packNew, setPackNew] = useState(0);
  const [packUsed, setPackUsed] = useState(0);
  const [packCompany, setPackCompany] = useState(0);
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

      // Get pack values directly from the events table
      const pn = Number(eventData.pack_new) || 0;
      const pu = Number(eventData.pack_used) || 0;
      const pc = Number(eventData.pack_company) || 0;
      setPackNew(pn);
      setPackUsed(pu);
      setPackCompany(pc);

      // Load deals for stats
      const { data: deals } = await supabase
        .from("deals")
        .select("new_used, total_gross, warranty, gap")
        .eq("event_id", eventId);

      if (deals && deals.length > 0) {
        let totalGross = 0;
        let newCount = 0;
        let usedCount = 0;
        let newGross = 0;
        let usedGross = 0;
        let warrantyCount = 0;
        let gapCount = 0;

        deals.forEach((d) => {
          const gross = Number(d.total_gross) || 0;
          totalGross += gross;
          if (d.new_used === "New") {
            newCount++;
            newGross += gross;
          } else {
            usedCount++;
            usedGross += gross;
          }
          if ((Number(d.warranty) || 0) > 0) warrantyCount++;
          if ((Number(d.gap) || 0) > 0) gapCount++;
        });

        setStats({
          total_deals: deals.length,
          total_gross: totalGross,
          new_count: newCount,
          used_count: usedCount,
          new_gross: newGross,
          used_gross: usedGross,
          warranty_count: warrantyCount,
          gap_count: gapCount,
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
      <div className="min-h-screen bg-jde-bg">
        <div className="header-gradient border-b border-jde-border">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="skeleton h-6 w-48 mb-3" />
            <div className="skeleton h-4 w-72 mb-5" />
            <div className="flex gap-3 mb-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton h-16 w-36 rounded-lg" />
              ))}
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="skeleton h-9 w-24 rounded-t" />
              ))}
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="skeleton h-64 w-full rounded-xl" />
        </div>
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
      <div className="header-gradient border-b border-jde-border">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-jde-cyan/40 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Top row: nav + event name */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link
                href="/events"
                className="text-jde-muted hover:text-jde-cyan transition-all duration-200 text-sm"
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
          </div>

          {/* Stat pills — 3 cols on mobile, 6 on desktop */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
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
            <SplitStatPill
              topValue={String(stats.new_count)}
              topColor="text-jde-cyan"
              bottomValue={String(stats.used_count)}
              bottomColor="text-jde-warning"
              label="New / Used"
              borderColor="border-jde-cyan/30"
              bgColor="bg-jde-cyan/10"
              glowClass="shadow-glow-cyan"
            />
            <SplitStatPill
              topValue={formatCurrency(stats.new_count > 0 ? stats.new_gross / stats.new_count : 0)}
              topColor="text-jde-success"
              bottomValue={formatCurrency(stats.used_count > 0 ? stats.used_gross / stats.used_count : 0)}
              bottomColor="text-jde-warning"
              label="New Avg / Used Avg"
              borderColor="border-jde-success/30"
              bgColor="bg-jde-success/10"
              glowClass="shadow-glow-green"
            />
            <StatPill
              label="Warranty"
              value={`${stats.warranty_count} / ${stats.total_deals} (${stats.total_deals > 0 ? Math.round((stats.warranty_count / stats.total_deals) * 100) : 0}%)`}
              color="cyan"
            />
            <StatPill
              label="GAP"
              value={`${stats.gap_count} / ${stats.total_deals} (${stats.total_deals > 0 ? Math.round((stats.gap_count / stats.total_deals) * 100) : 0}%)`}
              color="purple"
            />
          </div>

          {/* Tab navigation */}
          <div className="flex gap-1 -mb-[1px] overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  if (tab === "Settings") {
                    router.push(`/events/${eventId}/settings`);
                    return;
                  }
                  setActiveTab(tab);
                }}
                className={`px-3 md:px-5 py-2 md:py-2.5 text-[11px] md:text-[13px] rounded-t transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-jde-bg text-jde-cyan border border-jde-border border-b-jde-bg font-semibold shadow-glow-cyan"
                    : "text-jde-muted hover:text-jde-text"
                }`}
              >
                <span className="mr-1.5">{TAB_ICONS[tab]}</span>
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content area */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div key={activeTab} className="tab-content-enter">
          {activeTab === "Roster" ? (
            <RosterTable eventId={eventId} />
          ) : activeTab === "Inventory" ? (
            <InventoryTable eventId={eventId} />
          ) : activeTab === "Deal Log" ? (
            <DealLogContainer eventId={eventId} />
          ) : activeTab === "Washout" ? (
            <WashoutTable eventId={eventId} packNew={packNew} packUsed={packUsed} packCompany={packCompany} />
          ) : activeTab === "Recap" ? (
            <RecapSummary eventId={eventId} />
          ) : activeTab === "Mail Tracking" ? (
            <MailTrackingTable eventId={eventId} />
          ) : activeTab === "Performance" ? (
            <PerformanceTable eventId={eventId} packNew={packNew} packUsed={packUsed} packCompany={packCompany} />
          ) : activeTab === "KPI" ? (
            <EventKPIPanel eventId={eventId} />
          ) : (
            <div className="rounded-xl bg-jde-surface border border-jde-border p-6 min-h-[400px] flex items-center justify-center">
              <p className="text-jde-muted">
                {activeTab} tab — content coming soon
              </p>
            </div>
          )}
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
    cyan: "bg-jde-cyan/10 text-jde-cyan border-jde-cyan/30 shadow-glow-cyan",
    green: "bg-jde-success/10 text-jde-success border-jde-success/30 shadow-glow-green",
    purple: "bg-jde-purple/10 text-jde-purple border-jde-purple/30 shadow-glow-purple",
    amber: "bg-jde-warning/10 text-jde-warning border-jde-warning/30 shadow-glow-amber",
  };

  return (
    <div
      className={`px-1.5 py-2 md:px-3 md:py-2.5 rounded-lg border ${colorMap[color]} text-center min-w-0`}
    >
      <div className="font-mono font-extrabold text-[10px] sm:text-[13px] md:text-[15px] leading-tight truncate">{value}</div>
      <div className="text-[7px] md:text-[9px] uppercase tracking-wider opacity-60 mt-0.5 truncate">
        {label}
      </div>
    </div>
  );
}

function SplitStatPill({
  topValue,
  topColor,
  bottomValue,
  bottomColor,
  label,
  borderColor,
  bgColor,
  glowClass,
}: {
  topValue: string;
  topColor: string;
  bottomValue: string;
  bottomColor: string;
  label: string;
  borderColor: string;
  bgColor: string;
  glowClass: string;
}) {
  return (
    <div
      className={`px-2 py-2 md:px-3 md:py-2.5 rounded-lg border ${borderColor} ${bgColor} ${glowClass} text-center min-w-0`}
    >
      {/* Stacked on mobile, side-by-side on desktop */}
      <div className="hidden md:flex items-baseline justify-center gap-1 min-w-0">
        <span className={`font-mono font-extrabold text-[15px] leading-tight truncate ${topColor}`}>
          {topValue}
        </span>
        <span className="text-jde-muted/40 text-[10px] flex-shrink-0">/</span>
        <span className={`font-mono font-extrabold text-[15px] leading-tight truncate ${bottomColor}`}>
          {bottomValue}
        </span>
      </div>
      <div className="flex flex-col items-center md:hidden min-w-0">
        <span className={`font-mono font-extrabold text-[11px] sm:text-[13px] leading-tight truncate max-w-full ${topColor}`}>
          {topValue}
        </span>
        <span className={`font-mono font-extrabold text-[11px] sm:text-[13px] leading-tight truncate max-w-full ${bottomColor}`}>
          {bottomValue}
        </span>
      </div>
      <div className="text-[8px] md:text-[9px] uppercase tracking-wider opacity-60 mt-0.5 truncate">
        {label}
      </div>
    </div>
  );
}
