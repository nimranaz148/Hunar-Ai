"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  Eye,
  ShoppingBag,
  Award,
  Calendar,
} from "lucide-react";
import type {
  MetricsChartsResponse,
} from "@/lib/api";

export interface PerformanceChartsProps {
  chartsData: MetricsChartsResponse;
  days: number | null;
  onDaysChange: (days: number | null) => void;
  selectedPlatform: string;
  onPlatformChange: (platform: string) => void;
  isLoading?: boolean;
}

const CHANNEL_COLORS = {
  instagram: "#E1306C",
  facebook: "#1877F2",
  other: "#8b5cf6",
};

interface TooltipPayloadItem {
  name: string;
  value: number;
  color?: string;
  dataKey?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function RevenueOrdersTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-lg text-xs space-y-1">
        <p className="font-semibold text-[var(--color-fg)] border-b border-[var(--color-border)] pb-1 mb-1">
          {label}
        </p>
        {payload.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-[var(--color-fg-muted)]">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: item.color || "#10b981" }}
              />
              {item.name}:
            </span>
            <span className="font-bold text-[var(--color-fg)] font-mono">
              {item.name.toLowerCase().includes("revenue")
                ? `Rs ${item.value.toLocaleString()}`
                : item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function EngagementTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-lg text-xs space-y-1">
        <p className="font-semibold text-[var(--color-fg)] border-b border-[var(--color-border)] pb-1 mb-1">
          {label}
        </p>
        {payload.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-[var(--color-fg-muted)]">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: item.color || "#3b82f6" }}
              />
              {item.name}:
            </span>
            <span className="font-bold text-[var(--color-fg)] font-mono">
              {item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export function PerformanceCharts({
  chartsData,
  days,
  onDaysChange,
  selectedPlatform,
  onPlatformChange,
  isLoading = false,
}: PerformanceChartsProps) {
  const { summary, timeline, channels, top_content } = chartsData;

  const timeframeOptions: Array<{ label: string; value: number | null }> = [
    { label: "Last 7 Days", value: 7 },
    { label: "Last 14 Days", value: 14 },
    { label: "Last 30 Days", value: 30 },
    { label: "All Time", value: null },
  ];

  const formattedTimeline = timeline.map((pt) => {
    const formattedDate = new Date(pt.date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    return {
      ...pt,
      displayDate: formattedDate,
    };
  });

  const pieData = channels
    .filter((c) => (c.views ?? 0) > 0)
    .map((c) => ({
      name: c.platform.charAt(0).toUpperCase() + c.platform.slice(1),
      value: c.views ?? 0,
      color: c.platform.toLowerCase() === "instagram" ? CHANNEL_COLORS.instagram : CHANNEL_COLORS.facebook,
    }));

  const hasData = timeline.length > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Filter and timeframe controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
        {/* Timeframe selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-[var(--color-fg-muted)] mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Timeframe:
          </span>
          {timeframeOptions.map((opt) => (
            <button
              key={opt.label}
              onClick={() => onDaysChange(opt.value)}
              aria-label={`Timeframe ${opt.label}`}
              className={`px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                days === opt.value
                  ? "bg-[var(--color-accent)] text-[var(--color-fg-inverse)] shadow-xs"
                  : "bg-[var(--color-canvas)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] border border-[var(--color-border)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Channel filter */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="text-xs font-semibold text-[var(--color-fg-muted)] mr-1">
            Channel:
          </span>
          {[
            { id: "all", label: "All" },
            { id: "instagram", label: "Instagram" },
            { id: "facebook", label: "Facebook" },
          ].map((ch) => (
            <button
              key={ch.id}
              onClick={() => onPlatformChange(ch.id)}
              aria-label={`Chart ${ch.label}`}
              className={`px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-medium transition-all cursor-pointer ${
                selectedPlatform === ch.id
                  ? "bg-[var(--color-surface-hover)] text-[var(--color-fg)] border border-[var(--color-border)] font-semibold"
                  : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
              }`}
            >
              {ch.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--color-fg-muted)]">
            <span>Period Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 font-mono">
            Rs {(summary.total_revenue_pkr ?? 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-[var(--color-fg-subtle)] block">
            {summary.total_orders ?? 0} orders recorded
          </span>
        </div>

        {/* Total Views */}
        <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--color-fg-muted)]">
            <span>Views & Impressions</span>
            <Eye className="w-4 h-4 text-[var(--color-accent)]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[var(--color-fg)] font-mono">
            {(summary.total_views ?? 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-[var(--color-fg-subtle)] block">
            Reach: {(summary.total_reach ?? 0).toLocaleString()}
          </span>
        </div>

        {/* Total Engagement */}
        <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--color-fg-muted)]">
            <span>Total Engagement</span>
            <TrendingUp className="w-4 h-4 text-pink-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[var(--color-fg)] font-mono">
            {(summary.total_engagement ?? 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-[var(--color-fg-subtle)] block">
            Likes, comments & shares
          </span>
        </div>

        {/* Conversion Rate */}
        <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[var(--color-fg-muted)]">
            <span>Inquiry-to-Order Rate</span>
            <ShoppingBag className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-600 font-mono">
            {summary.inquiry_to_order_rate_pct ?? 0}%
          </div>
          <span className="text-[11px] text-[var(--color-fg-subtle)] block">
            {summary.total_inquiries ?? 0} DMs / Inquiries
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse" />
          <div className="h-80 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse" />
        </div>
      ) : !hasData ? (
        <div className="p-12 text-center border border-dashed border-[var(--color-border)] rounded-[var(--radius-lg)] bg-[var(--color-surface)] space-y-3">
          <div className="w-12 h-12 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] mx-auto flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[var(--color-fg)]">
            No chart data available for this timeframe
          </h3>
          <p className="text-xs text-[var(--color-fg-muted)] max-w-sm mx-auto">
            Log metrics snapshots or adjust your timeframe filter above to view visual performance trends.
          </p>
        </div>
      ) : (
        <>
          {/* Charts Row 1: Revenue & Orders Dual-Axis Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-fg)]">
                    Revenue &amp; Customer Orders Trend
                  </h3>
                  <p className="text-xs text-[var(--color-fg-muted)]">
                    Daily sales revenue (PKR) and conversion orders over time
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  Sales Growth
                </span>
              </div>

              <div className="h-72 w-full pt-2" data-testid="revenue-orders-chart">
                <ResponsiveContainer width="100%" height="100%" minWidth={250} minHeight={200}>
                  <AreaChart data={formattedTimeline}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="displayDate" tick={{ fontSize: 11 }} />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(val) => `Rs ${val}`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(val) => `${val} ord`}
                    />
                    <Tooltip content={<RevenueOrdersTooltip />} />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue_pkr"
                      name="Revenue (PKR)"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#revenueGrad)"
                      strokeWidth={2}
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="orders"
                      name="Orders"
                      stroke="#f59e0b"
                      fillOpacity={1}
                      fill="url(#ordersGrad)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Channel Views Share Donut Chart */}
            <div className="p-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--color-fg)]">
                  Channel Share Breakdown
                </h3>
                <p className="text-xs text-[var(--color-fg-muted)]">
                  Proportion of views and impressions by platform
                </p>
              </div>

              <div className="h-48 w-full flex items-center justify-center" data-testid="channel-share-chart">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={150} minHeight={150}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-[var(--color-fg-muted)]">No channel split data</p>
                )}
              </div>

              <div className="space-y-2 border-t border-[var(--color-border)] pt-3">
                {channels.map((ch) => {
                  const isInsta = ch.platform.toLowerCase() === "instagram";
                  return (
                    <div
                      key={ch.platform}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor: isInsta
                              ? CHANNEL_COLORS.instagram
                              : CHANNEL_COLORS.facebook,
                          }}
                        />
                        <span className="font-medium capitalize text-[var(--color-fg)]">
                          {ch.platform}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold font-mono text-[var(--color-fg)]">
                          {ch.views_share_pct}%
                        </span>{" "}
                        <span className="text-[var(--color-fg-subtle)] text-[10px]">
                          ({(ch.views ?? 0).toLocaleString()} views)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Charts Row 2: Views vs Engagement Bar Chart */}
          <div className="p-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--color-fg)]">
                  Audience Reach &amp; Engagement Activity
                </h3>
                <p className="text-xs text-[var(--color-fg-muted)]">
                  Compare impressions against direct post interactions (likes, comments, shares, saves)
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-[var(--color-fg-muted)]">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Views
                </span>
                <span className="flex items-center gap-1.5 text-[var(--color-fg-muted)]">
                  <span className="w-2.5 h-2.5 rounded-sm bg-pink-500" /> Engagement
                </span>
                <span className="flex items-center gap-1.5 text-[var(--color-fg-muted)]">
                  <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" /> DMs / Inquiries
                </span>
              </div>
            </div>

            <div className="h-72 w-full pt-2" data-testid="reach-engagement-chart">
              <ResponsiveContainer width="100%" height="100%" minWidth={250} minHeight={200}>
                <BarChart data={formattedTimeline}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="displayDate" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<EngagementTooltip />} />
                  <Legend />
                  <Bar dataKey="views" name="Views" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="engagement" name="Engagement" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="inquiries" name="Inquiries (DMs)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Attributed Posts Section */}
          {top_content && top_content.length > 0 && (
            <div className="p-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-fg)]">
                      Top Performing Content Items
                    </h3>
                    <p className="text-xs text-[var(--color-fg-muted)]">
                      Posts linked to marketing snapshots sorted by highest audience response
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {top_content.map((post, idx) => (
                  <div
                    key={post.content_item_id || idx}
                    className="p-3.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-canvas)] space-y-2 hover:border-[var(--color-accent)]/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-[var(--color-fg)] line-clamp-2">
                        {post.title}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
                        {post.platform}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 pt-2 border-t border-[var(--color-border)] text-center text-xs">
                      <div>
                        <span className="text-[10px] text-[var(--color-fg-subtle)] block">Views</span>
                        <span className="font-bold font-mono text-[var(--color-fg)]">
                          {(post.views ?? 0).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--color-fg-subtle)] block">DMs</span>
                        <span className="font-bold font-mono text-purple-600">
                          {post.inquiries ?? 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--color-fg-subtle)] block">Sales</span>
                        <span className="font-bold font-mono text-emerald-600">
                          Rs {(post.revenue_pkr ?? 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
