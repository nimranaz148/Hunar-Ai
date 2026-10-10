"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Send,
  TrendingUp,
  Coins,
  ArrowRight,
  Calendar,
  Sparkles,
  ClipboardList,
  Search,
  Clock,
  Video,
  Layers,
  Compass,
  Image as ImageIcon,
  AlertCircle,
  RefreshCw,
  Tag,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StaggerGroup } from "@/components/animations/StaggerGroup";
import { CountUp } from "@/components/animations/CountUp";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import {
  BusinessService,
  type BusinessResponse,
  type EntrepreneurDashboardResponse,
} from "@/lib/api";

function formatPKR(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function EntrepreneurDashboardPage() {
  const [business, setBusiness] = useState<BusinessResponse | null>(null);
  const [dashboard, setDashboard] = useState<EntrepreneurDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);

    try {
      const biz = await BusinessService.getCurrentUserBusinessApiV1BusinessesGet();
      setBusiness(biz);

      if (biz?.id) {
        const data =
          await BusinessService.getDashboardApiV1BusinessesBusinessIdDashboardGet({
            businessId: biz.id,
          });
        setDashboard(data);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load dashboard metrics";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) {
        loadDashboard();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [loadDashboard]);

  const getFormatIcon = (fmt: string) => {
    switch (fmt.toLowerCase()) {
      case "reel":
        return <Video className="w-4 h-4 text-purple-600" />;
      case "carousel":
        return <Layers className="w-4 h-4 text-blue-600" />;
      case "story":
        return <Compass className="w-4 h-4 text-amber-600" />;
      case "static":
      default:
        return <ImageIcon className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <AppShell
      role="entrepreneur"
      userName={business?.name || "Entrepreneur"}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-[var(--color-border)] animate-slide-in">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-gradient-purple text-white shadow-purple-sm">
                Home Dashboard
              </span>
              <span className="text-xs text-[var(--color-fg-muted)]">
                D-001 Executive Overview
              </span>
            </div>
            <h1 className="text-3xl font-black text-gradient-purple mt-2 tracking-tight">
              Khush Amdeed, {business?.name || "Entrepreneur"}!
            </h1>
            <p className="text-sm text-[var(--color-fg-muted)] mt-2">
              Live tracking for launch tasks, 30-day content publishing, and weekly audience engagement.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadDashboard(true)}
              disabled={isRefreshing || isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[var(--color-fg)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-hover)] transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <Link
              href="/content/today"
              className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm"
            >
              <Send className="w-4 h-4" />
              Today&apos;s Post
            </Link>
          </div>
        </div>

        {/* Error banner */}
        {errorMessage && (
          <div
            role="alert"
            className="p-4 bg-[var(--color-danger-subtle)] border border-[var(--color-danger-border)] rounded-[var(--radius-lg)] text-[var(--color-danger)] text-sm flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="font-semibold text-sm">Unable to load dashboard</h2>
              <p className="mt-1 text-xs opacity-90">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => loadDashboard()}
              className="px-3 py-1 bg-[var(--color-surface)] border border-[var(--color-danger-border)] rounded text-xs font-medium hover:bg-[var(--color-surface-hover)]"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !dashboard && (
          <LoadingState message="Loading your business performance and execution roadmap..." />
        )}

        {/* Empty State when no business is created */}
        {!isLoading && !dashboard && !errorMessage && (
          <EmptyState
            title="Business Profile Not Found"
            description="You haven't initialized your business profile yet. Complete the AI onboarding to generate your validated profile, pricing, and 30-day content calendar."
            icon={<Sparkles className="w-6 h-6 text-[var(--color-accent)]" />}
            action={
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] text-xs font-semibold hover:bg-[var(--color-accent-hover)] transition"
              >
                Start AI Onboarding
                <ArrowRight className="w-4 h-4" />
              </Link>
            }
          />
        )}

        {dashboard && (
          <div className="space-y-10">
            {/* KPI Overview Section */}
            <ScrollReveal direction="up">
              <div className="mb-6">
                <h2 className="section-header">Performance Overview</h2>
                <p className="section-subtitle">
                  Track your progress across launch tasks, content publishing, audience engagement, and revenue.
                </p>
              </div>
            </ScrollReveal>

            {/* 4 Core PRD KPI Cards with Apple-style design */}
            <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" stagger={0.1}>
              {/* Card 1: Tasks Done */}
              <Link href="/plan" className="kpi-card group">
                <div className="flex items-center justify-between mb-4">
                  <span className="kpi-label">Tasks Done</span>
                  <div className="icon-container w-12 h-12">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="mb-3">
                  <div className="kpi-value">
                    <CountUp end={dashboard.tasks_done_count} duration={1.5} />
                    <span className="text-2xl">/{dashboard.total_tasks_count || 30}</span>
                  </div>
                  <p className="text-sm text-[var(--color-fg-muted)] mt-1">completed</p>
                </div>
                <div className="progress-bar mb-4">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(100, (dashboard.tasks_done_count / (dashboard.total_tasks_count || 30)) * 100)}%`,
                    }}
                  />
                </div>
                <div className="flex items-center text-xs font-semibold text-[var(--color-accent)] group-hover:gap-2 gap-1 transition-all">
                  <span>View 30-Day Launch Plan</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>

              {/* Card 2: Posts Published */}
              <Link href="/content/calendar" className="kpi-card group">
                <div className="flex items-center justify-between mb-4">
                  <span className="kpi-label">Posts Published</span>
                  <div className="icon-container w-12 h-12">
                    <Send className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="mb-3">
                  <div className="kpi-value">
                    <CountUp end={dashboard.posts_published_count} duration={1.5} />
                    <span className="text-2xl">/{dashboard.total_posts_count || 30}</span>
                  </div>
                  <p className="text-sm text-[var(--color-fg-muted)] mt-1">of {dashboard.total_posts_count || 30} scheduled</p>
                </div>
                <div className="progress-bar mb-4">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(100, (dashboard.posts_published_count / (dashboard.total_posts_count || 30)) * 100)}%`,
                    }}
                  />
                </div>
                <div className="flex items-center text-xs font-semibold text-[var(--color-accent)] group-hover:gap-2 gap-1 transition-all">
                  <span>Open Content Calendar</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>

              {/* Card 3: Engagement Trend */}
              <Link href="/metrics" className="kpi-card group">
                <div className="flex items-center justify-between mb-4">
                  <span className="kpi-label">Engagement</span>
                  <div className="icon-container w-12 h-12">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="mb-3">
                  <div className="kpi-value">
                    {dashboard.engagement_change_pct > 0 ? "+" : ""}
                    <CountUp end={dashboard.engagement_change_pct} duration={1.5} suffix="%" />
                  </div>
                  <p className="text-sm text-[var(--color-fg-muted)] mt-1">7-day trend</p>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  {dashboard.engagement_change_pct > 0 ? (
                    <span className="badge-modern text-xs">Trending Up</span>
                  ) : (
                    <span className="text-xs text-[var(--color-fg-muted)]">Stable</span>
                  )}
                </div>
                <div className="flex items-center text-xs font-semibold text-[var(--color-accent)] group-hover:gap-2 gap-1 transition-all">
                  <span>Track Audience Metrics</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>

              {/* Card 4: Revenue This Week */}
              <Link href="/pricing" className="kpi-card group">
                <div className="flex items-center justify-between mb-4">
                  <span className="kpi-label">Revenue (This Week)</span>
                  <div className="icon-container w-12 h-12">
                    <Coins className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="mb-3">
                  <div className="kpi-value text-3xl">
                    {formatPKR(dashboard.revenue_this_week_pkr)}
                  </div>
                  <p className="text-sm text-[var(--color-fg-muted)] mt-1">this week</p>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs text-[var(--color-fg-muted)]">Live tracking</span>
                </div>
                <div className="flex items-center text-xs font-semibold text-[var(--color-accent)] group-hover:gap-2 gap-1 transition-all">
                  <span>Unit Economics & Break-even</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            </StaggerGroup>

            {/* Middle Section: 7-Day Engagement Trend & Today's Post Spotlight */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Engagement Trend (7 Days) */}
              <div className="lg:col-span-7 p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xs)] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-[var(--color-fg)] flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[var(--color-accent)]" />
                      Audience Engagement Trend (7 Days)
                    </h2>
                    <p className="text-xs text-[var(--color-fg-muted)]">
                      Daily likes, comments, and WhatsApp direct inquiries
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[var(--color-success)] bg-[var(--color-success-subtle)] px-2.5 py-1 rounded-[var(--radius-md)] border border-[var(--color-success-border)]">
                    +23% vs last week
                  </span>
                </div>

                {/* Visual Sparkline / Bar Graph */}
                <div className="pt-4 pb-2">
                  <div className="h-44 flex items-end justify-between gap-2 px-2">
                    {(() => {
                      const trendPoints = dashboard.trend_7d || [];
                      const maxVal = Math.max(...trendPoints.map((p) => p.reach), 100);
                      return trendPoints.map((pt, idx) => {
                        const heightPercent = Math.max(15, Math.round((pt.reach / maxVal) * 100));
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                          <span className="text-[var(--text-2xs)] font-bold text-[var(--color-fg-muted)] opacity-0 group-hover:opacity-100 transition">
                            {pt.engagement}
                          </span>
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full max-w-[32px] bg-[var(--color-accent-subtle)] group-hover:bg-[var(--color-accent)] border border-[var(--color-accent)] rounded-t-[var(--radius-sm)] transition-all relative"
                          />
                          <span className="text-[var(--text-2xs)] font-bold text-[var(--color-fg)]">
                            {pt.day}
                          </span>
                        </div>
                      );
                    });
                  })()}
                  </div>
                </div>

                <div className="p-3 bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-xs text-[var(--color-fg-muted)] flex items-center justify-between">
                  <span>Highest conversion channel: <strong>Instagram Reels + WhatsApp</strong></span>
                  <Link href="/metrics" className="font-bold text-[var(--color-accent)] hover:underline">
                    View full analytics →
                  </Link>
                </div>
              </div>

              {/* Today's Post Spotlight */}
              <div className="lg:col-span-5 p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xs)] flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--color-fg-muted)] uppercase tracking-wider">
                      Today&apos;s Post Spotlight
                    </span>
                    {dashboard.today_post && (
                      <StatusBadge status={dashboard.today_post.status} />
                    )}
                  </div>

                  {dashboard.today_post ? (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 text-xs font-black rounded-[var(--radius-md)] bg-[var(--color-surface-hover)] border border-[var(--color-border)]">
                          Day {dashboard.today_post.day}
                        </span>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-md)] bg-[var(--color-surface-hover)] text-xs font-semibold">
                          {getFormatIcon(dashboard.today_post.format)}
                          <span className="capitalize">{dashboard.today_post.format}</span>
                        </div>
                        <span className="px-2 py-0.5 text-[var(--text-2xs)] font-bold uppercase rounded bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
                          {dashboard.today_post.pillar.replace(/_/g, " ")}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[var(--text-2xs)] font-bold text-[var(--color-fg-muted)] uppercase">
                          Hook:
                        </span>
                        <p className="text-sm font-bold text-[var(--color-fg)] line-clamp-2 leading-snug">
                          &quot;{dashboard.today_post.hook}&quot;
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[var(--text-2xs)] font-bold text-[var(--color-fg-muted)] uppercase">
                          Caption Snippet:
                        </span>
                        <p className="text-xs text-[var(--color-fg-muted)] line-clamp-3 leading-relaxed">
                          {dashboard.today_post.caption}
                        </p>
                      </div>

                      {dashboard.today_post.best_time_hint && (
                        <div className="flex items-center gap-1.5 text-xs text-[var(--color-fg-muted)]">
                          <Clock className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                          <span>Recommended Time: <strong>{dashboard.today_post.best_time_hint}</strong></span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center space-y-2">
                      <Calendar className="w-8 h-8 text-[var(--color-fg-muted)] mx-auto opacity-50" />
                      <p className="text-xs text-[var(--color-fg-muted)]">
                        No post scheduled for today.
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[var(--color-border)]">
                  <Link
                    href="/content/today"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-accent)] text-[var(--color-fg-inverse)] rounded-[var(--radius-md)] text-xs font-bold hover:bg-[var(--color-accent-hover)] transition"
                  >
                    <span>Go to Today View</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom Section: Upcoming Roadmap Tasks (PRD §29.1) */}
            <div className="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xs)] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[var(--color-fg)] flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-[var(--color-accent)]" />
                    Upcoming Launch Plan Tasks
                  </h2>
                  <p className="text-xs text-[var(--color-fg-muted)]">
                    Action items to establish and scale your business operations
                  </p>
                </div>
                <Link
                  href="/plan"
                  className="text-xs font-semibold text-[var(--color-accent)] hover:underline flex items-center gap-1"
                >
                  <span>View All Tasks</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-2.5">
                {dashboard.upcoming_tasks && dashboard.upcoming_tasks.length > 0 ? (
                  dashboard.upcoming_tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-[var(--radius-md)] flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-[var(--color-fg-muted)]" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-[var(--color-fg)] block">
                            {task.title}
                          </span>
                          <span className="text-[var(--text-2xs)] text-[var(--color-fg-muted)]">
                            Week {task.week} • {task.category.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusBadge status={task.status} />
                        <Link
                          href="/plan"
                          className="px-3 py-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded text-xs font-semibold text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)] transition"
                        >
                          Execute
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[var(--color-fg-muted)] py-4 text-center">
                    All upcoming tasks completed! Check your Launch Plan for next milestone objectives.
                  </p>
                )}
              </div>
            </div>

            {/* Quick Launchpad Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                href="/content/research"
                className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] hover:border-[var(--color-accent)] transition space-y-1.5 group"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-[var(--color-accent)]" />
                  <span className="text-xs font-bold text-[var(--color-fg)]">
                    Market Research Teardown
                  </span>
                </div>
                <p className="text-xs text-[var(--color-fg-muted)]">
                  Review local competitor pricing, weaknesses, and hashtag clusters.
                </p>
              </Link>

              <Link
                href="/pricing"
                className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] hover:border-[var(--color-accent)] transition space-y-1.5 group"
              >
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[var(--color-accent)]" />
                  <span className="text-xs font-bold text-[var(--color-fg)]">
                    Pricing & Break-even
                  </span>
                </div>
                <p className="text-xs text-[var(--color-fg-muted)]">
                  Verify unit economics, labor costs, and monthly sales targets.
                </p>
              </Link>

              <Link
                href="/content/outline"
                className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] hover:border-[var(--color-accent)] transition space-y-1.5 group"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
                  <span className="text-xs font-bold text-[var(--color-fg)]">
                    30-Day Campaign Outline
                  </span>
                </div>
                <p className="text-xs text-[var(--color-fg-muted)]">
                  Explore content pillars, weekly journey themes, and concept briefs.
                </p>
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
