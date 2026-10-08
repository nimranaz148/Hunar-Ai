"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  Mail,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  TrendingDown,
  User,
  X,
  CheckCircle2,
} from "lucide-react";
import { CohortService } from "@/lib/api";
import type {
  StalledBusinessItem,
  StalledListResponse,
  StalledSummaryCounts,
} from "@/lib/api";

type ReasonFilter = "all" | "no_post" | "no_metrics" | "overdue_tasks";

export default function StalledBusinessesPage() {
  const [data, setData] = useState<StalledListResponse | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [reasonFilter, setReasonFilter] = useState<ReasonFilter>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Nudge feedback state
  const [nudgingId, setNudgingId] = useState<string | null>(null);
  const [nudgeSuccessMsg, setNudgeSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    CohortService.getStalledBusinesses({
      programId: selectedProgramId || undefined,
      reasonFilter: reasonFilter === "all" ? undefined : reasonFilter,
      search: searchQuery.trim() || undefined,
      page,
      pageSize: 20,
    })
      .then((res) => {
        if (!ignore) {
          setData(res);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const msg =
            err instanceof Error
              ? err.message
              : "Failed to load stalled businesses. Please try again.";
          setError(msg);
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [selectedProgramId, reasonFilter, searchQuery, page, refreshKey]);

  const handleProgramChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProgramId(e.target.value);
    setPage(1);
    setIsLoading(true);
    setError(null);
  };

  const handleReasonFilterChange = (filter: ReasonFilter) => {
    setReasonFilter(filter);
    setPage(1);
    setIsLoading(true);
    setError(null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setPage(1);
    setIsLoading(true);
    setError(null);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);
    setRefreshKey((k) => k + 1);
  };

  const handleNudge = async (business: StalledBusinessItem) => {
    setNudgingId(business.business_id);
    setNudgeSuccessMsg(null);
    try {
      const res = await CohortService.triggerNudge({
        businessId: business.business_id,
      });
      setNudgeSuccessMsg(res.message);
      // Auto-hide success banner after 5 seconds
      setTimeout(() => {
        setNudgeSuccessMsg(null);
      }, 5000);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to send intervention check-in.";
      setError(msg);
    } finally {
      setNudgingId(null);
    }
  };

  const summary: StalledSummaryCounts = data?.summary || {
    total_stalled: 0,
    no_post_count: 0,
    no_metrics_count: 0,
    overdue_tasks_count: 0,
  };

  return (
    <AppShell
      role="super_admin"
      userName="Super Admin"
      pageTitle="Stalled Businesses"
    >
      <div className="space-y-6">
        {/* Back Link & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href="/admin/cohort"
              className="inline-flex items-center gap-1.5 text-[var(--text-xs)] font-bold text-[var(--color-accent)] hover:underline mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Cohort Dashboard</span>
            </Link>
            <h2 className="text-[var(--text-xl)] font-bold text-[var(--color-fg)]">
              Stalled Businesses Directory (F-029)
            </h2>
            <p className="text-[var(--text-xs)] text-[var(--color-fg-muted)] mt-1">
              Early warning monitoring detecting inactive entrepreneurs who need coaching intervention or task assistance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              aria-label="Refresh stalled businesses"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-sunken)] text-[var(--text-xs)] font-medium text-[var(--color-fg)] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Success / Alert Toasts */}
        {nudgeSuccessMsg && (
          <div
            role="status"
            className="rounded-[var(--radius-md)] border border-[var(--color-success)] bg-[var(--color-success-subtle)] p-4 text-[var(--color-success)] text-[var(--text-sm)] flex items-center justify-between shadow-[var(--shadow-sm)]"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{nudgeSuccessMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setNudgeSuccessMsg(null)}
              className="text-[var(--text-xs)] hover:opacity-75"
              aria-label="Dismiss toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-[var(--radius-md)] border border-[var(--color-danger)] bg-[var(--color-danger-subtle)] p-4 text-[var(--color-danger)] text-[var(--text-sm)] flex items-center justify-between"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={handleRefresh}
              className="text-[var(--text-xs)] font-bold underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Total Stalled */}
          <button
            type="button"
            onClick={() => handleReasonFilterChange("all")}
            className={`text-left rounded-[var(--radius-lg)] border p-4 transition-all shadow-[var(--shadow-sm)] ${
              reasonFilter === "all"
                ? "border-[var(--color-warning)] bg-[var(--color-warning-subtle)] ring-2 ring-[var(--color-warning)]/20"
                : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-focus)]"
            }`}
          >
            <div className="flex items-center justify-between text-[var(--color-fg-muted)] mb-1">
              <span className="text-[var(--text-2xs)] font-bold uppercase tracking-wider">
                Total Stalled
              </span>
              <AlertTriangle className="w-4 h-4 text-[var(--color-warning)]" />
            </div>
            <div className="text-[var(--text-2xl)] font-extrabold text-[var(--color-warning)]">
              {summary.total_stalled}
            </div>
            <p className="text-[var(--text-2xs)] text-[var(--color-fg-muted)] mt-1">
              All inactive businesses
            </p>
          </button>

          {/* 2. No Post > 5 Days */}
          <button
            type="button"
            onClick={() => handleReasonFilterChange("no_post")}
            className={`text-left rounded-[var(--radius-lg)] border p-4 transition-all shadow-[var(--shadow-sm)] ${
              reasonFilter === "no_post"
                ? "border-[var(--color-danger)] bg-[var(--color-danger-subtle)] ring-2 ring-[var(--color-danger)]/20"
                : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-focus)]"
            }`}
          >
            <div className="flex items-center justify-between text-[var(--color-fg-muted)] mb-1">
              <span className="text-[var(--text-2xs)] font-bold uppercase tracking-wider">
                No Post (&gt;5d)
              </span>
              <Clock className="w-4 h-4 text-[var(--color-danger)]" />
            </div>
            <div className="text-[var(--text-2xl)] font-extrabold text-[var(--color-danger)]">
              {summary.no_post_count}
            </div>
            <p className="text-[var(--text-2xs)] text-[var(--color-fg-muted)] mt-1">
              Content publishing stalled
            </p>
          </button>

          {/* 3. No Metrics > 7 Days */}
          <button
            type="button"
            onClick={() => handleReasonFilterChange("no_metrics")}
            className={`text-left rounded-[var(--radius-lg)] border p-4 transition-all shadow-[var(--shadow-sm)] ${
              reasonFilter === "no_metrics"
                ? "border-[var(--color-info)] bg-[var(--color-info-subtle)] ring-2 ring-[var(--color-info)]/20"
                : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-focus)]"
            }`}
          >
            <div className="flex items-center justify-between text-[var(--color-fg-muted)] mb-1">
              <span className="text-[var(--text-2xs)] font-bold uppercase tracking-wider">
                No Metrics (&gt;7d)
              </span>
              <TrendingDown className="w-4 h-4 text-[var(--color-info)]" />
            </div>
            <div className="text-[var(--text-2xl)] font-extrabold text-[var(--color-info)]">
              {summary.no_metrics_count}
            </div>
            <p className="text-[var(--text-2xs)] text-[var(--color-fg-muted)] mt-1">
              Weekly numbers not logged
            </p>
          </button>

          {/* 4. Overdue Tasks */}
          <button
            type="button"
            onClick={() => handleReasonFilterChange("overdue_tasks")}
            className={`text-left rounded-[var(--radius-lg)] border p-4 transition-all shadow-[var(--shadow-sm)] ${
              reasonFilter === "overdue_tasks"
                ? "border-[var(--color-accent)] bg-[var(--color-accent-subtle)] ring-2 ring-[var(--color-accent)]/20"
                : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-focus)]"
            }`}
          >
            <div className="flex items-center justify-between text-[var(--color-fg-muted)] mb-1">
              <span className="text-[var(--text-2xs)] font-bold uppercase tracking-wider">
                Overdue Tasks
              </span>
              <Calendar className="w-4 h-4 text-[var(--color-accent)]" />
            </div>
            <div className="text-[var(--text-2xl)] font-extrabold text-[var(--color-accent)]">
              {summary.overdue_tasks_count}
            </div>
            <p className="text-[var(--text-2xs)] text-[var(--color-fg-muted)] mt-1">
              Launch roadmap overdue
            </p>
          </button>
        </div>

        {/* Filters & Search Control Bar */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Reason Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0" role="tablist" aria-label="Filter by reason">
            {[
              { id: "all", label: "All Reasons" },
              { id: "no_post", label: "No Post (>5d)" },
              { id: "no_metrics", label: "No Metrics (>7d)" },
              { id: "overdue_tasks", label: "Overdue Tasks" },
            ].map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={reasonFilter === tab.id}
                onClick={() => handleReasonFilterChange(tab.id as ReasonFilter)}
                className={`px-3 py-1.5 rounded-[var(--radius-md)] text-[var(--text-xs)] font-semibold transition-colors whitespace-nowrap ${
                  reasonFilter === tab.id
                    ? "bg-[var(--color-fg)] text-[var(--color-fg-inverse)]"
                    : "text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-fg)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Program Select & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="cohort-select-filter"
                className="text-[var(--text-xs)] font-semibold text-[var(--color-fg-muted)] whitespace-nowrap sr-only"
              >
                Filter Cohort
              </label>
              <select
                id="cohort-select-filter"
                aria-label="Filter by cohort program"
                value={selectedProgramId}
                onChange={handleProgramChange}
                disabled={isLoading}
                className="text-[var(--text-xs)] font-medium bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-fg)] rounded-[var(--radius-md)] px-3 py-2 focus:outline-none focus:border-[var(--color-border-focus)] transition-colors min-w-[150px]"
              >
                <option value="">All Cohorts</option>
                {data?.programs?.map((prog) => (
                  <option key={prog.id} value={prog.id}>
                    {prog.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--color-fg-subtle)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search business or owner..."
                aria-label="Search stalled businesses"
                className="w-full sm:w-56 pl-9 pr-8 py-2 text-[var(--text-xs)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:border-[var(--color-border-focus)]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && !data && (
          <div className="space-y-3 animate-pulse" aria-label="Loading stalled businesses">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-28 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)]"
              />
            ))}
          </div>
        )}

        {/* Business Cards / List */}
        {data && (
          <div className="space-y-3">
            {data.items.length === 0 ? (
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[var(--color-success-subtle)] text-[var(--color-success)] flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-[var(--text-base)] font-bold text-[var(--color-fg)]">
                  No Stalled Businesses Found
                </h3>
                <p className="text-[var(--text-xs)] text-[var(--color-fg-muted)] max-w-sm mx-auto">
                  {searchQuery || reasonFilter !== "all" || selectedProgramId
                    ? "No businesses matched your selected filters. Try clearing or expanding your search."
                    : "All entrepreneurs are actively progressing through their launch plans on schedule!"}
                </p>
                {(searchQuery || reasonFilter !== "all" || selectedProgramId) && (
                  <button
                    type="button"
                    onClick={() => {
                      setReasonFilter("all");
                      setSelectedProgramId("");
                      setSearchQuery("");
                      setPage(1);
                      setIsLoading(true);
                      setError(null);
                    }}
                    className="text-[var(--text-xs)] font-bold text-[var(--color-accent)] hover:underline inline-block mt-2"
                  >
                    Reset All Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3" role="list" aria-label="Stalled businesses directory">
                {data.items.map((item) => (
                  <div
                    key={item.business_id}
                    role="listitem"
                    className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-sm)] hover:border-[var(--color-border-focus)] transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    {/* Left: Info */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[var(--text-base)] font-bold text-[var(--color-fg)]">
                          {item.business_name}
                        </h3>
                        {item.program_name && (
                          <span className="text-[var(--text-2xs)] font-semibold px-2 py-0.5 rounded bg-[var(--color-surface-sunken)] border border-[var(--color-border-subtle)] text-[var(--color-fg-muted)]">
                            {item.program_name}
                          </span>
                        )}
                        <span className="text-[var(--text-2xs)] font-bold px-2 py-0.5 rounded bg-[var(--color-warning-subtle)] text-[var(--color-warning)]">
                          Needs Check-in
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-[var(--text-xs)] text-[var(--color-fg-muted)]">
                        <span className="flex items-center gap-1.5 font-medium text-[var(--color-fg)]">
                          <User className="w-3.5 h-3.5 text-[var(--color-fg-subtle)]" />
                          {item.owner_name}
                        </span>
                        <a
                          href={`mailto:${item.owner_email}`}
                          className="flex items-center gap-1 hover:text-[var(--color-accent)] transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5 text-[var(--color-fg-subtle)]" />
                          {item.owner_email}
                        </a>
                      </div>

                      {/* Inactivity Diagnostics & Reason Tags */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {item.days_since_last_post !== null && item.days_since_last_post !== undefined && (
                          <span className="inline-flex items-center gap-1 text-[var(--text-2xs)] font-semibold px-2.5 py-1 rounded bg-[var(--color-danger-subtle)] text-[var(--color-danger)]">
                            <Clock className="w-3 h-3" />
                            {item.days_since_last_post} days without post
                          </span>
                        )}
                        {item.days_since_last_metric !== null && item.days_since_last_metric !== undefined && (
                          <span className="inline-flex items-center gap-1 text-[var(--text-2xs)] font-semibold px-2.5 py-1 rounded bg-[var(--color-info-subtle)] text-[var(--color-info)]">
                            <TrendingDown className="w-3 h-3" />
                            {item.days_since_last_metric} days without metrics
                          </span>
                        )}
                        {Boolean(item.overdue_task_count && item.overdue_task_count > 0) && (
                          <span className="inline-flex items-center gap-1 text-[var(--text-2xs)] font-semibold px-2.5 py-1 rounded bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
                            <Calendar className="w-3 h-3" />
                            {item.overdue_task_count} tasks overdue
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-[var(--color-border-subtle)] shrink-0">
                      <Link
                        href={`/admin/users?search=${encodeURIComponent(item.owner_email)}`}
                        className="px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-sunken)] text-[var(--text-xs)] font-semibold text-[var(--color-fg)] inline-flex items-center gap-1.5 transition-colors"
                      >
                        <span>User Profile</span>
                        <ExternalLink className="w-3 h-3 text-[var(--color-fg-subtle)]" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleNudge(item)}
                        disabled={nudgingId === item.business_id}
                        aria-label={`Send intervention check-in to ${item.business_name}`}
                        className="px-3.5 py-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover,var(--color-accent))] text-[var(--color-fg-inverse)] text-[var(--text-xs)] font-semibold inline-flex items-center gap-1.5 transition-all shadow-[var(--shadow-xs)] disabled:opacity-50"
                      >
                        <Send className={`w-3 h-3 ${nudgingId === item.business_id ? "animate-pulse" : ""}`} />
                        <span>{nudgingId === item.business_id ? "Nudging..." : "Send Nudge"}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {data.total_pages > 1 && (
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 flex items-center justify-between text-[var(--text-xs)]">
                <span className="text-[var(--color-fg-muted)]">
                  Showing {(page - 1) * data.page_size + 1} to{" "}
                  {Math.min(page * data.page_size, data.total)} of {data.total} businesses
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPage((p) => Math.max(1, p - 1));
                      setIsLoading(true);
                      setError(null);
                    }}
                    disabled={page <= 1 || isLoading}
                    className="px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-sunken)] text-[var(--color-fg)] font-medium disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="font-semibold text-[var(--color-fg)] px-2">
                    Page {page} of {data.total_pages}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPage((p) => Math.min(data.total_pages, p + 1));
                      setIsLoading(true);
                      setError(null);
                    }}
                    disabled={page >= data.total_pages || isLoading}
                    className="px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-sunken)] text-[var(--color-fg)] font-medium disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
