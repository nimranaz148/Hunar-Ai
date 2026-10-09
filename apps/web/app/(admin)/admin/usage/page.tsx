"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { AdminService } from "@/lib/api";
import type { UsageStatsResponse, HourlyRunStat } from "@/lib/api";
import {
  BarChart3,
  Users,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RotateCw,
  Sparkles,
  ExternalLink,
  Flame,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface HourlyTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: HourlyRunStat;
    dataKey: string;
    value: number;
    color: string;
  }>;
}

function CustomHourlyTooltip({ active, payload }: HourlyTooltipProps) {
  if (active && payload && payload.length) {
    const stat = payload[0].payload;
    return (
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] p-3 shadow-[var(--shadow-md)] text-[var(--text-xs)]">
        <p className="font-bold text-[var(--color-fg)] mb-1">{stat.hour} UTC</p>
        <p className="text-[var(--color-fg-muted)]">
          Total Runs: <span className="font-semibold text-[var(--color-fg)]">{stat.total}</span>
        </p>
        <p className="text-[var(--color-success)] font-medium">
          Succeeded: <span className="font-semibold">{stat.succeeded}</span>
        </p>
        <p className="text-[var(--color-danger)] font-medium">
          Failed: <span className="font-semibold">{stat.failed}</span>
        </p>
      </div>
    );
  }
  return null;
}

export default function UsageStatsPage() {
  const [data, setData] = useState<UsageStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch usage stats on mount or refresh
  useEffect(() => {
    let ignore = false;

    AdminService.getSystemUsageStatsApiV1AdminUsageGet()
      .then((res) => {
        if (!ignore) {
          setData(res);
          setIsLoading(false);
          setIsRefreshing(false);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const msg =
            err instanceof Error
              ? err.message
              : "Failed to load usage statistics. Please try again.";
          setError(msg);
          setIsLoading(false);
          setIsRefreshing(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  // Auto-refresh interval (every 60s when enabled)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setRefreshKey((k) => k + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setError(null);
    setRefreshKey((k) => k + 1);
  };

  const todayUtc = new Date().toISOString().split("T")[0];

  return (
    <AppShell
      role="super_admin"
      userName="Super Admin"
      pageTitle="System Usage Statistics"
    >
      <div className="space-y-6">
        {/* Top Control Bar */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-6 shadow-[var(--shadow-sm)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-[var(--radius-md)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h2 className="text-[var(--text-lg)] font-bold text-[var(--color-fg)]">
                System Usage & Health
              </h2>
            </div>
            <p className="text-[var(--text-xs)] text-[var(--color-fg-muted)] mt-1">
              Real-time active users, 24-hour agent activity, latency breakdowns, and user activity leaderboard (PRD F-037 / D-004).
            </p>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span className="text-[var(--text-2xs)] font-medium text-[var(--color-fg-subtle)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] px-2.5 py-1 rounded-[var(--radius-full)]">
              Today: {todayUtc} (UTC)
            </span>

            <button
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
              aria-pressed={autoRefresh}
              className={`text-[var(--text-xs)] font-medium px-3 py-1.5 rounded-[var(--radius-md)] border transition-colors cursor-pointer ${
                autoRefresh
                  ? "bg-[var(--color-accent-subtle)] border-[var(--color-accent)] text-[var(--color-accent)]"
                  : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
              }`}
            >
              Auto-refresh (60s): {autoRefresh ? "ON" : "OFF"}
            </button>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              aria-label="Refresh usage statistics"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-sunken)] text-[var(--text-xs)] font-medium text-[var(--color-fg)] transition-colors disabled:opacity-50 cursor-pointer shadow-[var(--shadow-sm)]"
              title="Refresh metrics"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <LoadingState message="Loading system usage statistics..." className="my-8" />
        )}

        {/* Error State */}
        {error && !isLoading && (
          <ErrorState
            title="Failed to load usage statistics"
            message={error}
            onRetry={handleRefresh}
            className="my-8"
          />
        )}

        {/* Main Content */}
        {!isLoading && !error && data && (
          <>
            {/* 4 KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Active Users Today */}
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-xs)] font-medium text-[var(--color-fg-muted)] uppercase tracking-wider">
                    Active Users Today
                  </span>
                  <div className="p-2 rounded-[var(--radius-md)] bg-[var(--color-neutral-subtle)] text-[var(--color-fg)]">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-[var(--text-2xl)] font-bold text-[var(--color-fg)]">
                    {data.active_users_today}
                  </span>
                  <p className="text-[var(--text-2xs)] text-[var(--color-fg-subtle)] mt-1">
                    Distinct users across runs & audit
                  </p>
                </div>
              </div>

              {/* Agent Runs Today */}
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-xs)] font-medium text-[var(--color-fg-muted)] uppercase tracking-wider">
                    Runs Today
                  </span>
                  <div className="p-2 rounded-[var(--radius-md)] bg-[var(--color-info-subtle)] text-[var(--color-info)]">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-[var(--text-2xl)] font-bold text-[var(--color-fg)]">
                    {data.runs_today_total}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[var(--text-2xs)] text-[var(--color-success)] font-medium">
                      {data.runs_today_succeeded} succeeded
                    </span>
                    <span className="text-[var(--text-2xs)] text-[var(--color-fg-subtle)]">·</span>
                    <span className="text-[var(--text-2xs)] text-[var(--color-danger)] font-medium">
                      {data.runs_today_failed} failed
                    </span>
                  </div>
                </div>
              </div>

              {/* Average Latency */}
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-xs)] font-medium text-[var(--color-fg-muted)] uppercase tracking-wider">
                    Avg Duration
                  </span>
                  <div className="p-2 rounded-[var(--radius-md)] bg-[var(--color-warning-subtle)] text-[var(--color-warning)]">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-[var(--text-2xl)] font-bold text-[var(--color-fg)]">
                    {data.avg_latency_seconds}s
                  </span>
                  <p className="text-[var(--text-2xs)] text-[var(--color-fg-subtle)] mt-1">
                    Completed agent workflows today
                  </p>
                </div>
              </div>

              {/* Error Rate */}
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-xs)] font-medium text-[var(--color-fg-muted)] uppercase tracking-wider">
                    Error Rate
                  </span>
                  <div
                    className={`p-2 rounded-[var(--radius-md)] ${
                      data.error_rate_pct > 5
                        ? "bg-[var(--color-danger-subtle)] text-[var(--color-danger)]"
                        : "bg-[var(--color-success-subtle)] text-[var(--color-success)]"
                    }`}
                  >
                    {data.error_rate_pct > 5 ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[var(--text-2xl)] font-bold ${
                        data.error_rate_pct > 5
                          ? "text-[var(--color-danger)]"
                          : "text-[var(--color-fg)]"
                      }`}
                    >
                      {data.error_rate_pct}%
                    </span>
                    <span
                      className={`text-[var(--text-2xs)] font-semibold px-2 py-0.5 rounded-[var(--radius-full)] ${
                        data.error_rate_pct > 5
                          ? "bg-[var(--color-danger-subtle)] text-[var(--color-danger)]"
                          : data.error_rate_pct === 0
                          ? "bg-[var(--color-success-subtle)] text-[var(--color-success)]"
                          : "bg-[var(--color-warning-subtle)] text-[var(--color-warning)]"
                      }`}
                    >
                      {data.error_rate_pct > 5
                        ? "Elevated"
                        : data.error_rate_pct === 0
                        ? "Zero Errors"
                        : "Nominal"}
                    </span>
                  </div>
                  <p className="text-[var(--text-2xs)] text-[var(--color-fg-subtle)] mt-1">
                    {data.runs_today_failed} failed or blocked runs
                  </p>
                </div>
              </div>
            </div>

            {/* 24-Hour Execution Trend Bar Chart */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[var(--color-border)] gap-2">
                <div>
                  <h3 className="text-[var(--text-base)] font-bold text-[var(--color-fg)] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[var(--color-accent)]" />
                    24-Hour Execution Trend
                  </h3>
                  <p className="text-[var(--text-xs)] text-[var(--color-fg-muted)]">
                    Agent workflow executions bucketed by UTC hour (00:00 - 23:00)
                  </p>
                </div>
                <div className="flex items-center gap-4 text-[var(--text-2xs)] font-medium">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-[#16a34a]" />
                    <span className="text-[var(--color-fg-muted)]">Succeeded</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-[#ef4444]" />
                    <span className="text-[var(--color-fg-muted)]">Failed</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 h-[260px] w-full" data-testid="hourly-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.runs_per_hour}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="var(--color-border, #e2e8f0)"
                    />
                    <XAxis
                      dataKey="hour"
                      tick={{ fill: "var(--color-fg-subtle, #94a3b8)", fontSize: 11 }}
                      stroke="var(--color-border, #e2e8f0)"
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "var(--color-fg-subtle, #94a3b8)", fontSize: 11 }}
                      stroke="var(--color-border, #e2e8f0)"
                    />
                    <Tooltip content={<CustomHourlyTooltip />} />
                    <Bar
                      dataKey="succeeded"
                      name="Succeeded"
                      stackId="runs"
                      fill="#16a34a"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="failed"
                      name="Failed"
                      stackId="runs"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Grid: Workflow Breakdown & Top Users Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Workflow Breakdown */}
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)] flex flex-col justify-between">
                <div>
                  <div className="pb-3 border-b border-[var(--color-border)]">
                    <h3 className="text-[var(--text-base)] font-bold text-[var(--color-fg)] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
                      Workflow Breakdown
                    </h3>
                    <p className="text-[var(--text-xs)] text-[var(--color-fg-muted)]">
                      Executions, latency averages, and failure rates per workflow today
                    </p>
                  </div>

                  {data.workflows.length === 0 ? (
                    <EmptyState
                      title="No workflow activity"
                      description="No agent workflows have been executed today yet."
                      className="my-6 border-0 bg-transparent py-8"
                    />
                  ) : (
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-left text-[var(--text-xs)] border-collapse">
                        <thead>
                          <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-sunken)]">
                            <th className="py-2.5 px-3 font-semibold text-[var(--color-fg-muted)]">
                              Workflow
                            </th>
                            <th className="py-2.5 px-3 font-semibold text-[var(--color-fg-muted)] text-right">
                              Total
                            </th>
                            <th className="py-2.5 px-3 font-semibold text-[var(--color-fg-muted)] text-right">
                              Avg Duration
                            </th>
                            <th className="py-2.5 px-3 font-semibold text-[var(--color-fg-muted)] text-right">
                              Fail Rate
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                          {data.workflows.map((wf) => (
                            <tr
                              key={wf.workflow}
                              className="hover:bg-[var(--color-surface-hover)] transition-colors"
                            >
                              <td className="py-3 px-3 font-medium text-[var(--color-fg)]">
                                <span className="font-mono bg-[var(--color-surface-sunken)] px-1.5 py-0.5 rounded-[var(--radius-sm)] border border-[var(--color-border)]">
                                  {wf.workflow}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right font-semibold text-[var(--color-fg)]">
                                {wf.total_runs}
                              </td>
                              <td className="py-3 px-3 text-right text-[var(--color-fg-muted)]">
                                {wf.avg_latency_seconds}s
                              </td>
                              <td className="py-3 px-3 text-right">
                                <span
                                  className={`inline-block font-semibold px-2 py-0.5 rounded-[var(--radius-full)] text-[var(--text-2xs)] ${
                                    wf.failure_rate_pct > 10
                                      ? "bg-[var(--color-danger-subtle)] text-[var(--color-danger)]"
                                      : wf.failure_rate_pct > 0
                                      ? "bg-[var(--color-warning-subtle)] text-[var(--color-warning)]"
                                      : "bg-[var(--color-success-subtle)] text-[var(--color-success)]"
                                  }`}
                                >
                                  {wf.failure_rate_pct}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[var(--color-border)] mt-4 flex items-center justify-between text-[var(--text-2xs)] text-[var(--color-fg-subtle)]">
                  <span>Count: {data.workflows.length} workflows active today</span>
                  <Link
                    href="/admin/runs"
                    className="inline-flex items-center gap-1 text-[var(--color-accent)] hover:underline font-medium"
                  >
                    Explore all runs <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Top Users Leaderboard */}
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)] flex flex-col justify-between">
                <div>
                  <div className="pb-3 border-b border-[var(--color-border)] flex items-center justify-between">
                    <div>
                      <h3 className="text-[var(--text-base)] font-bold text-[var(--color-fg)] flex items-center gap-2">
                        <Flame className="w-4 h-4 text-[var(--color-warning)]" />
                        Top Active Users Today
                      </h3>
                      <p className="text-[var(--text-xs)] text-[var(--color-fg-muted)]">
                        Top 5 users by agent workflows initiated today
                      </p>
                    </div>
                  </div>

                  {data.top_users.length === 0 ? (
                    <EmptyState
                      title="No user executions"
                      description="No users have initiated workflows today."
                      className="my-6 border-0 bg-transparent py-8"
                    />
                  ) : (
                    <div className="mt-4 space-y-2.5">
                      {data.top_users.map((user, idx) => (
                        <div
                          key={user.user_id}
                          className="flex items-center justify-between p-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] hover:border-[var(--color-border-strong)] transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--text-2xs)] font-bold text-[var(--color-fg)]">
                              #{idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-[var(--text-xs)] font-semibold text-[var(--color-fg)] truncate">
                                {user.name || user.email}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[var(--text-2xs)] text-[var(--color-fg-subtle)] truncate">
                                  {user.email}
                                </span>
                                <span className="text-[var(--text-2xs)] text-[var(--color-fg-subtle)]">
                                  ·
                                </span>
                                <span className="text-[var(--text-2xs)] text-[var(--color-fg-subtle)] capitalize">
                                  {user.role.replace("_", " ")}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0 pl-3">
                            <span className="block text-[var(--text-sm)] font-bold text-[var(--color-fg)]">
                              {user.run_count}
                            </span>
                            <span className="text-[var(--text-2xs)] text-[var(--color-fg-subtle)]">
                              runs
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[var(--color-border)] mt-4 flex items-center justify-between text-[var(--text-2xs)] text-[var(--color-fg-subtle)]">
                  <span>Ranked by workflow count</span>
                  <Link
                    href="/admin/runs"
                    className="inline-flex items-center gap-1 text-[var(--color-accent)] hover:underline font-medium"
                  >
                    View Agent Explorer <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
