"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { CohortFunnelChart } from "@/components/cohort/CohortFunnelChart";
import { StalledPreviewCard } from "@/components/cohort/StalledPreviewCard";
import {
  Users,
  CheckCircle,
  Share2,
  ShoppingBag,
  AlertTriangle,
  RotateCw,
  Award,
  Calendar,
} from "lucide-react";
import { CohortService } from "@/lib/api";
import type { CohortDashboardResponse } from "@/lib/api";

export default function CohortDashboardPage() {
  const [data, setData] = useState<CohortDashboardResponse | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    let ignore = false;
    CohortService.getCohortDashboard({
      programId: selectedProgramId || undefined,
    })
      .then((res) => {
        if (!ignore) {
          setData(res);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Failed to load cohort dashboard metrics. Please try again.";
          setError(errorMessage);
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [selectedProgramId, refreshKey]);

  const handleProgramChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProgramId(e.target.value);
    setIsLoading(true);
    setError(null);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <AppShell
      role="super_admin"
      userName="Super Admin"
      pageTitle="Cohort Monitoring"
    >
      <div className="space-y-6">
        {/* Top Control Bar: Cohort Batch Selector */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-6 shadow-[var(--shadow-sm)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-[var(--text-lg)] font-bold text-[var(--color-fg)]">
              Cohort Progression & Oversight
            </h2>
            <p className="text-[var(--text-xs)] text-[var(--color-fg-muted)] mt-1">
              Real-time conversion funnel, activity drop-offs, and early warning stalled detection (PRD D-003).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label
                htmlFor="cohort-select"
                className="text-[var(--text-xs)] font-semibold text-[var(--color-fg-muted)] whitespace-nowrap"
              >
                Cohort:
              </label>
              <select
                id="cohort-select"
                aria-label="Select cohort program"
                value={selectedProgramId}
                onChange={handleProgramChange}
                disabled={isLoading}
                className="text-[var(--text-xs)] font-medium bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-fg)] rounded-[var(--radius-md)] px-3 py-2 focus:outline-none focus:border-[var(--color-border-focus)] transition-colors min-w-[160px]"
              >
                <option value="">All Cohorts (Aggregated)</option>
                {data?.programs?.map((prog) => (
                  <option key={prog.id} value={prog.id}>
                    {prog.name} ({prog.entrepreneur_count || 0})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              aria-label="Refresh cohort metrics"
              className="p-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-sunken)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors disabled:opacity-50"
              title="Refresh metrics"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Error State */}
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

        {/* Loading Skeleton */}
        {isLoading && !data && (
          <div className="space-y-6 animate-pulse" aria-label="Loading cohort dashboard">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)]"
                />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)]" />
              <div className="h-96 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)]" />
            </div>
          </div>
        )}

        {/* Data Display */}
        {data && (
          <div className="space-y-6">
            {/* Top 5 Primary Funnel KPI Stat Cards (PRD §29.3 wireframe) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* 1. Signed Up */}
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
                <div className="flex items-center justify-between text-[var(--color-fg-muted)] mb-2">
                  <span className="text-[var(--text-2xs)] font-bold uppercase tracking-wider">
                    Signed Up
                  </span>
                  <Users className="w-4 h-4 text-[var(--color-fg-subtle)]" />
                </div>
                <div className="text-[var(--text-2xl)] font-extrabold text-[var(--color-fg)]">
                  {data.kpis.total_entrepreneurs}
                </div>
                <div className="text-[var(--text-2xs)] text-[var(--color-fg-muted)] mt-1 truncate">
                  Enrolled in {data.program_name || "cohort"}
                </div>
              </div>

              {/* 2. Plan Approved */}
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
                <div className="flex items-center justify-between text-[var(--color-fg-muted)] mb-2">
                  <span className="text-[var(--text-2xs)] font-bold uppercase tracking-wider">
                    Plan Approved
                  </span>
                  <CheckCircle className="w-4 h-4 text-[var(--color-info)]" />
                </div>
                <div className="text-[var(--text-2xl)] font-extrabold text-[var(--color-fg)]">
                  {data.kpis.plan_approved_count}
                </div>
                <div className="text-[var(--text-2xs)] text-[var(--color-info)] font-semibold mt-1">
                  {data.funnel.stages[1]?.percentage || 0}% of cohort
                </div>
              </div>

              {/* 3. First Post */}
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
                <div className="flex items-center justify-between text-[var(--color-fg-muted)] mb-2">
                  <span className="text-[var(--text-2xs)] font-bold uppercase tracking-wider">
                    First Post
                  </span>
                  <Share2 className="w-4 h-4 text-[var(--color-accent)]" />
                </div>
                <div className="text-[var(--text-2xl)] font-extrabold text-[var(--color-fg)]">
                  {data.funnel.first_post}
                </div>
                <div className="text-[var(--text-2xs)] text-[var(--color-accent)] font-semibold mt-1">
                  {data.funnel.stages[2]?.percentage || 0}% of cohort
                </div>
              </div>

              {/* 4. First Order */}
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
                <div className="flex items-center justify-between text-[var(--color-fg-muted)] mb-2">
                  <span className="text-[var(--text-2xs)] font-bold uppercase tracking-wider">
                    First Order
                  </span>
                  <ShoppingBag className="w-4 h-4 text-[var(--color-success)]" />
                </div>
                <div className="text-[var(--text-2xl)] font-extrabold text-[var(--color-success)]">
                  {data.funnel.first_order}
                </div>
                <div className="text-[var(--text-2xs)] text-[var(--color-success)] font-semibold mt-1">
                  {data.funnel.stages[3]?.percentage || 0}% of cohort
                </div>
              </div>

              {/* 5. Stalled Count */}
              <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between text-[var(--color-fg-muted)] mb-2">
                  <span className="text-[var(--text-2xs)] font-bold uppercase tracking-wider">
                    Stalled
                  </span>
                  <AlertTriangle className="w-4 h-4 text-[var(--color-warning)]" />
                </div>
                <div className="text-[var(--text-2xl)] font-extrabold text-[var(--color-warning)]">
                  {data.kpis.stalled_count}
                </div>
                <div className="text-[var(--text-2xs)] text-[var(--color-warning)] font-semibold mt-1">
                  Need coach intervention
                </div>
              </div>
            </div>

            {/* Sub-KPI Strip (Active Mentors & Bookings This Week - PRD D-003) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)] flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[var(--text-xs)] text-[var(--color-fg-muted)] font-medium">
                    Active Approved Mentors
                  </div>
                  <div className="text-[var(--text-lg)] font-bold text-[var(--color-fg)]">
                    {data.kpis.active_mentors} Verified Mentors
                  </div>
                </div>
              </div>

              <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-info-subtle)] text-[var(--color-info)] flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[var(--text-xs)] text-[var(--color-fg-muted)] font-medium">
                    Mentoring Bookings This Week
                  </div>
                  <div className="text-[var(--text-lg)] font-bold text-[var(--color-fg)]">
                    {data.kpis.bookings_this_week} Sessions Booked
                  </div>
                </div>
              </div>
            </div>

            {/* Main Visualizations: Funnel Chart (left 2 cols) & Stalled Preview (right col) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <CohortFunnelChart funnelData={data.funnel} />
              </div>
              <div className="lg:col-span-1">
                <StalledPreviewCard
                  stalledItems={data.stalled_preview || []}
                  totalStalledCount={data.kpis.stalled_count}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
