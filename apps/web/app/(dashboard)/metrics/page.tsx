"use client";

import React, { useEffect, useState, useTransition, useCallback } from "react";
import {
  BarChart3,
  Calendar,
  DollarSign,
  Users,
  ShoppingBag,
  Eye,
  Plus,
  RefreshCw,
  AlertCircle,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  X,
} from "lucide-react";

function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}
import { AppShell } from "@/components/layout/AppShell";
import { MetricsEntryModal } from "@/components/metrics/MetricsEntryModal";
import {
  BusinessService,
  ContentService,
  MetricsService,
  BusinessResponse,
  MetricsSnapshotResponse,
  MetricsProgressResponse,
  ApiError,
} from "@/lib/api";

export default function PerformanceMetricsPage() {
  const [, startTransition] = useTransition();

  const [business, setBusiness] = useState<BusinessResponse | null>(null);
  const [snapshots, setSnapshots] = useState<MetricsSnapshotResponse[]>([]);
  const [progress, setProgress] = useState<MetricsProgressResponse | null>(null);
  const [recentPosts, setRecentPosts] = useState<
    Array<{ id: string; day: number; format: string; hook: string }>
  >([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [platformFilter, setPlatformFilter] = useState<"all" | "instagram" | "facebook">("all");

  // Modal & Drawer State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<MetricsSnapshotResponse | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch current business
      const biz = await BusinessService.getCurrentUserBusinessApiV1BusinessesGet();
      setBusiness(biz);

      if (biz?.id) {
        // 2. Fetch metrics snapshots and coaching progress concurrently
        const [snapshotsRes, progressRes] = await Promise.all([
          MetricsService.listBusinessMetricsApiV1BusinessesBusinessIdMetricsGet({
            businessId: biz.id,
            page: 1,
            pageSize: 50,
          }),
          MetricsService.getCoachingProgressApiV1BusinessesBusinessIdMetricsProgressGet({
            businessId: biz.id,
          }),
        ]);

        setSnapshots(snapshotsRes.items || []);
        setProgress(progressRes);

        // 3. Optionally fetch content items for post linkage dropdown
        try {
          const cal =
            await ContentService.getCalendarApiV1BusinessesBusinessIdContentCalendarGet({
              businessId: biz.id,
            });
          if (cal?.items) {
            setRecentPosts(
              cal.items.map((item) => ({
                id: item.id,
                day: item.day,
                format: item.format,
                hook: item.hook,
              }))
            );
          }
        } catch {
          // Non-blocking if calendar is not yet generated
        }
      }
    } catch (err) {
      const apiErr = err as ApiError;
      const msg =
        (apiErr.body as { detail?: string })?.detail ||
        apiErr.message ||
        "Failed to load business metrics.";
      setError(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) {
        loadData();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [loadData]);

  const handleSnapshotSuccess = (newSnapshot: MetricsSnapshotResponse) => {
    startTransition(() => {
      setSnapshots((prev) => [newSnapshot, ...prev]);
      if (progress) {
        const updatedDays = Math.min(3, progress.total_days_logged + 1);
        setProgress({
          ...progress,
          total_days_logged: updatedDays,
          threshold_met: updatedDays >= 3,
          latest_snapshot_date: newSnapshot.period_end,
        });
      }
    });
    setToastMessage("Metrics snapshot recorded successfully!");
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredSnapshots = snapshots.filter((s) => {
    if (platformFilter === "all") return true;
    return s.platform.toLowerCase() === platformFilter;
  });

  // Calculate aggregates
  const totalRevenue = snapshots.reduce((acc, s) => acc + (s.revenue_pkr || 0), 0);
  const totalViews = snapshots.reduce((acc, s) => acc + (s.views || 0), 0);
  const totalInquiries = snapshots.reduce((acc, s) => acc + (s.inquiries || 0), 0);
  const totalOrders = snapshots.reduce((acc, s) => acc + (s.orders || 0), 0);
  const totalFollowerDelta = snapshots.reduce((acc, s) => acc + (s.follower_delta || 0), 0);

  const daysLogged = progress?.total_days_logged || 0;
  const isThresholdMet = progress?.threshold_met || daysLogged >= 3;

  return (
    <AppShell role="entrepreneur" pageTitle="Marketing & Sales Performance">
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Toast Alert */}
        {toastMessage && (
          <div
            role="status"
            className="fixed top-5 right-5 z-50 p-4 rounded-[var(--radius-md)] bg-emerald-600 text-white shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top-3"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--color-border)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)]">
                Performance Analytics (F-015)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                Phase 4
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-fg)] mt-1">
              Marketing &amp; Sales Performance
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-fg-muted)] mt-0.5">
              Log manual social engagement, customer DMs, and sales to guide your Weekly AI Coach.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => loadData(true)}
              disabled={isRefreshing || isLoading}
              className="p-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50 cursor-pointer"
              aria-label="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] text-xs font-semibold hover:bg-[var(--color-accent-hover)] transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Metrics</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="p-4 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] border border-[var(--color-danger-border)] text-xs text-[var(--color-danger)] flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Unable to load metrics</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* 3-Day Weekly Coach Threshold Banner (PRD §10 W-004) */}
        <div className="p-4 sm:p-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  isThresholdMet
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                }`}
              >
                {isThresholdMet ? (
                  <Sparkles className="w-5 h-5 fill-current" />
                ) : (
                  <Clock className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--color-fg)]">
                  {isThresholdMet
                    ? "Weekly AI Coach Unlocked & Ready"
                    : "Weekly Coach Needs 3 Days of Logged Metrics"}
                </h3>
                <p className="text-xs text-[var(--color-fg-muted)] mt-0.5 leading-relaxed">
                  {isThresholdMet
                    ? `You have logged ${daysLogged} days of performance data. Weekly Coach (Human Gate 3) can now analyze engagement and recommend adjustments.`
                    : `PRD §10 W-004 requires at least 3 distinct days of metrics (${daysLogged}/3 completed) before the Weekly Coach can formulate content & pricing strategies.`}
                </p>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${
                isThresholdMet
                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
              }`}
            >
              {isThresholdMet ? "Ready for Gate 3" : `${daysLogged} / 3 Days Logged`}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[var(--color-canvas)] h-2 rounded-full overflow-hidden border border-[var(--color-border)]">
            <div
              className={`h-full transition-all duration-500 ${
                isThresholdMet ? "bg-emerald-500" : "bg-[var(--color-accent)]"
              }`}
              style={{ width: `${Math.min(100, (daysLogged / 3) * 100)}%` }}
            />
          </div>
        </div>

        {/* 4 Core Summary KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-1">
            <span className="text-[11px] font-medium text-[var(--color-fg-muted)] uppercase tracking-wider block">
              Total Revenue Logged
            </span>
            <div className="text-lg sm:text-2xl font-bold text-[var(--color-fg)]">
              Rs {totalRevenue.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5">
              <DollarSign className="w-3 h-3" />
              <span>Simulated Cashflow</span>
            </span>
          </div>

          <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-1">
            <span className="text-[11px] font-medium text-[var(--color-fg-muted)] uppercase tracking-wider block">
              Total Views / Reach
            </span>
            <div className="text-lg sm:text-2xl font-bold text-[var(--color-fg)]">
              {totalViews.toLocaleString()}
            </div>
            <span className="text-[11px] text-[var(--color-fg-subtle)] font-medium flex items-center gap-0.5">
              <Eye className="w-3 h-3 text-[var(--color-accent)]" />
              <span>Social Impressions</span>
            </span>
          </div>

          <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-1">
            <span className="text-[11px] font-medium text-[var(--color-fg-muted)] uppercase tracking-wider block">
              Inquiries &amp; Orders
            </span>
            <div className="text-lg sm:text-2xl font-bold text-[var(--color-fg)]">
              {totalOrders} / {totalInquiries}
            </div>
            <span className="text-[11px] text-indigo-600 font-medium flex items-center gap-0.5">
              <ShoppingBag className="w-3 h-3" />
              <span>
                {totalInquiries > 0
                  ? `${Math.round((totalOrders / totalInquiries) * 100)}% conversion`
                  : "0% conversion"}
              </span>
            </span>
          </div>

          <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-1">
            <span className="text-[11px] font-medium text-[var(--color-fg-muted)] uppercase tracking-wider block">
              Net Follower Delta
            </span>
            <div className="text-lg sm:text-2xl font-bold text-[var(--color-fg)] flex items-center gap-1">
              <span>{totalFollowerDelta > 0 ? `+${totalFollowerDelta}` : totalFollowerDelta}</span>
              {totalFollowerDelta >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-600" />
              )}
            </div>
            <span className="text-[11px] text-[var(--color-fg-subtle)] font-medium flex items-center gap-0.5">
              <Users className="w-3 h-3 text-[var(--color-accent)]" />
              <span>Audience Growth</span>
            </span>
          </div>
        </div>

        {/* Platform Filter Tabs & Table Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-1.5 p-1 rounded-[var(--radius-md)] bg-[var(--color-canvas)] border border-[var(--color-border)] self-start">
            <button
              onClick={() => setPlatformFilter("all")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-sm)] transition-all cursor-pointer ${
                platformFilter === "all"
                  ? "bg-[var(--color-surface)] text-[var(--color-fg)] shadow-xs border border-[var(--color-border)]"
                  : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
              }`}
            >
              All Channels ({snapshots.length})
            </button>
            <button
              onClick={() => setPlatformFilter("instagram")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-sm)] transition-all flex items-center gap-1.5 cursor-pointer ${
                platformFilter === "instagram"
                  ? "bg-[var(--color-surface)] text-pink-600 dark:text-pink-400 shadow-xs border border-[var(--color-border)]"
                  : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
              }`}
            >
              <InstagramIcon className="w-3.5 h-3.5" />
              <span>Instagram</span>
            </button>
            <button
              onClick={() => setPlatformFilter("facebook")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-sm)] transition-all flex items-center gap-1.5 cursor-pointer ${
                platformFilter === "facebook"
                  ? "bg-[var(--color-surface)] text-blue-600 dark:text-blue-400 shadow-xs border border-[var(--color-border)]"
                  : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
              }`}
            >
              <FacebookIcon className="w-3.5 h-3.5" />
              <span>Facebook</span>
            </button>
          </div>

          <span className="text-xs text-[var(--color-fg-subtle)]">
            Showing {filteredSnapshots.length} snapshot{filteredSnapshots.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* Snapshots Ledger */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-20 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] animate-pulse"
              />
            ))}
          </div>
        ) : filteredSnapshots.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-[var(--color-border)] rounded-[var(--radius-lg)] bg-[var(--color-surface)] space-y-3">
            <div className="w-12 h-12 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] mx-auto flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[var(--color-fg)]">
              No performance metrics recorded yet
            </h3>
            <p className="text-xs text-[var(--color-fg-muted)] max-w-md mx-auto leading-relaxed">
              Log your daily Instagram views, Facebook posts, WhatsApp inquiries, and customer orders to build data for your Weekly AI Review.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] hover:bg-[var(--color-accent-hover)] transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Your First Snapshot</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSnapshots.map((item) => {
              const isInsta = item.platform.toLowerCase() === "instagram";
              return (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs hover:border-[var(--color-accent)]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isInsta
                            ? "bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                        }`}
                      >
                        {isInsta ? <InstagramIcon className="w-3 h-3" /> : <FacebookIcon className="w-3 h-3" />}
                        <span className="capitalize">{item.platform}</span>
                      </span>

                      <span className="text-xs font-semibold text-[var(--color-fg)] flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[var(--color-accent)]" />
                        <span>
                          {new Date(item.period_start).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                          {" — "}
                          {new Date(item.period_end).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </span>

                      {item.content_item_title ? (
                        <span className="text-[11px] font-medium text-[var(--color-fg-muted)] bg-[var(--color-canvas)] px-2 py-0.5 rounded border border-[var(--color-border)] truncate max-w-xs">
                          {item.content_item_title}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[var(--color-fg-subtle)] italic">
                          Channel Overview
                        </span>
                      )}
                    </div>

                    {/* Metric Stats Row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-fg-muted)] pt-1">
                      <span>
                        <strong className="text-[var(--color-fg)] font-semibold font-mono">
                          {item.views.toLocaleString()}
                        </strong>{" "}
                        views
                      </span>
                      <span>
                        <strong className="text-[var(--color-fg)] font-semibold font-mono">
                          {item.likes.toLocaleString()}
                        </strong>{" "}
                        likes
                      </span>
                      <span>
                        <strong className="text-[var(--color-fg)] font-semibold font-mono">
                          {item.comments.toLocaleString()}
                        </strong>{" "}
                        comments
                      </span>
                      <span>
                        <strong className="text-[var(--color-fg)] font-semibold font-mono">
                          {item.inquiries.toLocaleString()}
                        </strong>{" "}
                        DMs
                      </span>
                      <span>
                        <strong className="text-[var(--color-fg)] font-semibold font-mono">
                          {item.orders.toLocaleString()}
                        </strong>{" "}
                        orders
                      </span>
                    </div>
                  </div>

                  {/* Revenue & Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border)]">
                    <div className="text-right">
                      <span className="text-[10px] text-[var(--color-fg-subtle)] uppercase tracking-wider block">
                        Sales Revenue
                      </span>
                      <span className="text-sm font-bold text-emerald-600 font-mono">
                        Rs {item.revenue_pkr.toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedSnapshot(item)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] text-[var(--color-fg)] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Slide-over Detail Drawer */}
        {selectedSnapshot && (
          <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
            <div className="w-full max-w-md bg-[var(--color-surface)] h-full shadow-2xl border-l border-[var(--color-border)] flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
              <div className="p-6 border-b border-[var(--color-border)] flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)]">
                    Snapshot Details
                  </span>
                  <h2 className="text-lg font-bold text-[var(--color-fg)] mt-1 capitalize">
                    {selectedSnapshot.platform} Metrics
                  </h2>
                  <p className="text-xs text-[var(--color-fg-muted)]">
                    {selectedSnapshot.period_start} to {selectedSnapshot.period_end}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSnapshot(null)}
                  className="p-1 rounded-[var(--radius-sm)] text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)]"
                  aria-label="Close detail"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 flex-1">
                {selectedSnapshot.content_item_title && (
                  <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-canvas)] border border-[var(--color-border)] space-y-1">
                    <span className="text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wider block">
                      Linked Post
                    </span>
                    <span className="text-xs font-semibold text-[var(--color-fg)]">
                      {selectedSnapshot.content_item_title}
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[var(--color-fg)] uppercase tracking-wider">
                    Engagement Breakdown
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded bg-[var(--color-canvas)] border border-[var(--color-border)]">
                      <span className="text-[10px] text-[var(--color-fg-muted)] block">Views</span>
                      <strong className="text-sm font-bold font-mono">{selectedSnapshot.views.toLocaleString()}</strong>
                    </div>
                    <div className="p-2.5 rounded bg-[var(--color-canvas)] border border-[var(--color-border)]">
                      <span className="text-[10px] text-[var(--color-fg-muted)] block">Reach</span>
                      <strong className="text-sm font-bold font-mono">{selectedSnapshot.reach.toLocaleString()}</strong>
                    </div>
                    <div className="p-2.5 rounded bg-[var(--color-canvas)] border border-[var(--color-border)]">
                      <span className="text-[10px] text-[var(--color-fg-muted)] block">Likes</span>
                      <strong className="text-sm font-bold font-mono">{selectedSnapshot.likes.toLocaleString()}</strong>
                    </div>
                    <div className="p-2.5 rounded bg-[var(--color-canvas)] border border-[var(--color-border)]">
                      <span className="text-[10px] text-[var(--color-fg-muted)] block">Comments</span>
                      <strong className="text-sm font-bold font-mono">{selectedSnapshot.comments.toLocaleString()}</strong>
                    </div>
                    <div className="p-2.5 rounded bg-[var(--color-canvas)] border border-[var(--color-border)]">
                      <span className="text-[10px] text-[var(--color-fg-muted)] block">Shares</span>
                      <strong className="text-sm font-bold font-mono">{selectedSnapshot.shares.toLocaleString()}</strong>
                    </div>
                    <div className="p-2.5 rounded bg-[var(--color-canvas)] border border-[var(--color-border)]">
                      <span className="text-[10px] text-[var(--color-fg-muted)] block">Saves</span>
                      <strong className="text-sm font-bold font-mono">{selectedSnapshot.saves.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[var(--color-fg)] uppercase tracking-wider">
                    Conversions &amp; Growth
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded bg-[var(--color-canvas)] border border-[var(--color-border)]">
                      <span className="text-[10px] text-[var(--color-fg-muted)] block">Follower Net Change</span>
                      <strong className="text-sm font-bold font-mono">
                        {selectedSnapshot.follower_delta > 0
                          ? `+${selectedSnapshot.follower_delta}`
                          : selectedSnapshot.follower_delta}
                      </strong>
                    </div>
                    <div className="p-2.5 rounded bg-[var(--color-canvas)] border border-[var(--color-border)]">
                      <span className="text-[10px] text-[var(--color-fg-muted)] block">Customer DMs</span>
                      <strong className="text-sm font-bold font-mono">{selectedSnapshot.inquiries}</strong>
                    </div>
                    <div className="p-2.5 rounded bg-[var(--color-canvas)] border border-[var(--color-border)]">
                      <span className="text-[10px] text-[var(--color-fg-muted)] block">Orders Confirmed</span>
                      <strong className="text-sm font-bold font-mono">{selectedSnapshot.orders}</strong>
                    </div>
                    <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                      <span className="text-[10px] block">Sales Revenue</span>
                      <strong className="text-sm font-bold font-mono">
                        Rs {selectedSnapshot.revenue_pkr.toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
                <button
                  onClick={() => setSelectedSnapshot(null)}
                  className="w-full py-2 border border-[var(--color-border)] rounded-[var(--radius-md)] text-xs font-semibold text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Entry Form */}
        {business && (
          <MetricsEntryModal
            isOpen={isModalOpen}
            businessId={business.id}
            recentContentItems={recentPosts}
            onClose={() => setIsModalOpen(false)}
            onSuccess={handleSnapshotSuccess}
          />
        )}
      </div>
    </AppShell>
  );
}
