"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Clock,
  Compass,
  Image as ImageIcon,
  Layers,
  RefreshCw,
  Send,
  Sparkles,
  AlertCircle,
  Tag,
  Search,
  TrendingUp,
  Video,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Mascot } from "@/components/landing/Mascot";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatCard } from "@/components/ui/StatCard";
import { CountValue } from "@/components/ui/CountValue";
import { DataGrid, type GridColumn, type GridFilter } from "@/components/ui/DataGrid";
import { formatDate, formatPKR } from "@/lib/format";
import {
  BusinessService,
  type BusinessResponse,
  type EntrepreneurDashboardResponse,
} from "@/lib/api";

type UpcomingTask = NonNullable<EntrepreneurDashboardResponse["upcoming_tasks"]>[number];

const pct = (n: number) => `${n > 0 ? "+" : ""}${Math.round(n)}%`;
const pkr = (n: number) => formatPKR(Math.round(n));

const FORMAT_ICON: Record<string, React.ReactNode> = {
  reel: <Video className="h-4 w-4" aria-hidden />,
  carousel: <Layers className="h-4 w-4" aria-hidden />,
  story: <Compass className="h-4 w-4" aria-hidden />,
};

const titleCase = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

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
        const data = await BusinessService.getDashboardApiV1BusinessesBusinessIdDashboardGet({
          businessId: biz.id,
        });
        setDashboard(data);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to load dashboard metrics");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) loadDashboard();
    });
    return () => {
      isMounted = false;
    };
  }, [loadDashboard]);

  const tasks = dashboard?.upcoming_tasks ?? [];

  const taskColumns: GridColumn<UpcomingTask>[] = [
    {
      key: "title",
      header: "Task",
      sortValue: (t) => t.title,
      render: (t) => (
        <div className="min-w-0">
          <span className="block font-semibold">{t.title}</span>
          <span className="block text-xs text-[var(--color-fg-muted)]">
            Week {t.week} • {t.category.toUpperCase()}
          </span>
        </div>
      ),
    },
    {
      key: "due",
      header: "Due",
      sortValue: (t) => t.due_date ?? "",
      render: (t) => (t.due_date ? formatDate(t.due_date) : "-"),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (t) => t.status,
      render: (t) => <StatusBadge status={t.status} />,
    },
    {
      key: "action",
      header: "",
      align: "right",
      render: () => (
        <Link
          href="/plan"
          className="font-label inline-flex min-h-9 items-center rounded-full border-2 border-[var(--color-ink)] px-3.5 text-sm transition-colors hover:bg-[var(--color-marigold)]"
        >
          Execute
        </Link>
      ),
    },
  ];

  const taskFilters: GridFilter<UpcomingTask>[] = [
    {
      id: "status",
      label: "Filter by status",
      options: [...new Set(tasks.map((t) => t.status))].map((v) => ({ value: v, label: titleCase(v) })),
      getValue: (t) => t.status,
    },
    {
      id: "category",
      label: "Filter by category",
      options: [...new Set(tasks.map((t) => t.category))].map((v) => ({ value: v, label: titleCase(v) })),
      getValue: (t) => t.category,
    },
  ];

  const total = (n: number | undefined | null, fallback = 30) => n || fallback;
  const totalTasks = total(dashboard?.total_tasks_count);
  const tasksFormat = useMemo(() => (n: number) => `${Math.round(n)}/${totalTasks}`, [totalTasks]);

  return (
    <AppShell role="entrepreneur" userName={business?.name || "Entrepreneur"}>
      <div className="mx-auto max-w-[96rem] space-y-5">
        {/* Greeting banner */}
        <section className="on-dark relative overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-magenta)] px-6 py-8 text-[var(--color-cream)] md:px-10 md:py-10">
          <div className="relative z-10 max-w-3xl">
            <p className="font-label text-sm">Home dashboard · D-001 Overview</p>
            <h1 className="font-display mt-2 text-[clamp(2.4rem,5.4vw,5rem)] leading-[0.92]">
              Khush Amdeed, {business?.name || "Entrepreneur"}!
            </h1>
            <p className="mt-3 max-w-xl text-md">
              Live tracking for launch tasks, 30-day content publishing, and weekly audience engagement.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/content/today" className="btn btn-cream">
                <Send className="h-4 w-4" aria-hidden />
                Today&apos;s Post
              </Link>
              <button
                type="button"
                onClick={() => loadDashboard(true)}
                disabled={isRefreshing || isLoading}
                className="btn btn-ghost disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden />
                Refresh
              </button>
            </div>
          </div>
          <Mascot variant="dupatta" className="pointer-events-none absolute -bottom-10 right-6 hidden h-[115%] w-auto lg:block" />
        </section>

        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-[var(--radius-lg)] border-2 border-[var(--color-danger)] bg-[var(--color-danger-subtle)] p-4 text-[var(--color-danger)]"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <div className="flex-1">
              <h2 className="font-label text-md">Unable to load dashboard</h2>
              <p className="mt-1 text-sm">{errorMessage}</p>
            </div>
            <button type="button" onClick={() => loadDashboard()} className="btn btn-ghost !min-h-9 !text-[var(--color-danger)]">
              Retry
            </button>
          </div>
        )}

        {isLoading && !dashboard && <LoadingState message="Loading your business performance and execution roadmap..." />}

        {!isLoading && !dashboard && !errorMessage && (
          <EmptyState
            title="Business Profile Not Found"
            description="You haven't initialized your business profile yet. Complete the AI onboarding to generate your validated profile, pricing, and 30-day content calendar."
            icon={<Sparkles className="h-6 w-6" aria-hidden />}
            action={
              <Link href="/onboarding" className="btn btn-ink">
                Start AI Onboarding
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            }
          />
        )}

        {dashboard && (
          <>
            {/* KPI row */}
            <section aria-label="Key numbers" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                tone="marigold"
                label="Tasks Done"
                value={
                  <CountValue value={dashboard.tasks_done_count} format={tasksFormat} />
                }
                hint="completed"
                progress={(dashboard.tasks_done_count / total(dashboard.total_tasks_count)) * 100}
                href="/plan"
                linkLabel="View 30-Day Launch Plan"
              />
              <StatCard
                tone="violet"
                label="Posts Published"
                value={<CountValue value={dashboard.posts_published_count} />}
                hint={`of ${total(dashboard.total_posts_count)} scheduled`}
                progress={(dashboard.posts_published_count / total(dashboard.total_posts_count)) * 100}
                href="/content/calendar"
                linkLabel="Open Content Calendar"
              />
              <StatCard
                tone="pink"
                label="Engagement"
                value={<CountValue value={dashboard.engagement_change_pct} format={pct} />}
                hint={dashboard.engagement_change_pct > 0 ? "7-day trend, trending up" : "7-day trend, stable"}
                href="/metrics"
                linkLabel="Track Audience Metrics"
              />
              <StatCard
                tone="plum"
                label="Revenue (This Week)"
                value={<CountValue value={dashboard.revenue_this_week_pkr} format={pkr} />}
                hint="this week"
                href="/pricing"
                linkLabel="Unit Economics & Break-even"
              />
            </section>

            {/* Chart + spotlight */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <section className="rounded-[var(--radius-lg)] border border-[var(--color-ink)] bg-[var(--color-surface)] p-5 lg:col-span-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display flex items-center gap-2 text-[1.6rem] leading-none">
                      <TrendingUp className="h-5 w-5 text-[var(--color-violet)]" aria-hidden />
                      Audience Engagement Trend (7 Days)
                    </h2>
                    <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
                      Daily likes, comments, and WhatsApp direct inquiries
                    </p>
                  </div>
                  <span className="rounded-[var(--radius-sm)] border border-[var(--color-success)] bg-[var(--color-success-subtle)] px-2.5 py-1 text-sm font-bold text-[var(--color-success)]">
                    +23% vs last week
                  </span>
                </div>

                <div className="mt-6 flex h-48 items-end justify-between gap-2 border-b border-[var(--color-ink)] px-1">
                  {(() => {
                    const pts = dashboard.trend_7d || [];
                    const max = Math.max(...pts.map((p) => p.reach), 100);
                    return pts.map((pt, i) => (
                      <div key={i} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                        <span className="text-xs font-bold opacity-0 transition-opacity group-hover:opacity-100">
                          {pt.engagement}
                        </span>
                        <div
                          style={{ height: `${Math.max(15, Math.round((pt.reach / max) * 100))}%` }}
                          className="w-full max-w-10 rounded-t-[var(--radius-sm)] border border-[var(--color-ink)] bg-[var(--color-violet)] transition-colors group-hover:bg-[var(--color-marigold)]"
                        />
                      </div>
                    ));
                  })()}
                </div>
                <div className="flex justify-between gap-2 px-1 pt-2">
                  {(dashboard.trend_7d || []).map((pt, i) => (
                    <span key={i} className="font-label flex-1 text-center text-sm">
                      {pt.day}
                    </span>
                  ))}
                </div>

                <p className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] px-3 py-2.5 text-sm">
                  <span>
                    Highest conversion channel: <strong>Instagram Reels + WhatsApp</strong>
                  </span>
                  <Link href="/metrics" className="font-label text-[var(--color-violet)] underline-offset-4 hover:underline">
                    View full analytics →
                  </Link>
                </p>
              </section>

              <section className="flex flex-col justify-between rounded-[var(--radius-lg)] border border-[var(--color-ink)] bg-[var(--color-lilac)] p-5 lg:col-span-5">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-label text-sm">Today&apos;s Post Spotlight</h2>
                    {dashboard.today_post && <StatusBadge status={dashboard.today_post.status} />}
                  </div>

                  {dashboard.today_post ? (
                    <div className="mt-4 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-label rounded-full bg-[var(--color-ink)] px-3 py-1 text-sm text-[var(--color-cream)]">
                          Day {dashboard.today_post.day}
                        </span>
                        <span className="font-label inline-flex items-center gap-1.5 rounded-full border-2 border-[var(--color-ink)] px-3 py-0.5 text-sm">
                          {FORMAT_ICON[dashboard.today_post.format.toLowerCase()] ?? <ImageIcon className="h-4 w-4" aria-hidden />}
                          <span className="capitalize">{dashboard.today_post.format}</span>
                        </span>
                        <span className="font-label rounded-full bg-[var(--color-cream)] px-3 py-0.5 text-sm">
                          {dashboard.today_post.pillar.replace(/_/g, " ")}
                        </span>
                      </div>

                      <div>
                        <p className="font-label text-xs text-[var(--color-fg-muted)]">Hook</p>
                        <p className="font-display text-[1.7rem] leading-[1.05]">
                          &quot;{dashboard.today_post.hook}&quot;
                        </p>
                      </div>

                      <div>
                        <p className="font-label text-xs text-[var(--color-fg-muted)]">Caption snippet</p>
                        <p className="line-clamp-3 text-sm leading-relaxed">{dashboard.today_post.caption}</p>
                      </div>

                      {dashboard.today_post.best_time_hint && (
                        <p className="flex items-center gap-1.5 text-sm">
                          <Clock className="h-4 w-4" aria-hidden />
                          Recommended time: <strong>{dashboard.today_post.best_time_hint}</strong>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="py-10 text-center">
                      <Calendar className="mx-auto h-8 w-8 opacity-60" aria-hidden />
                      <p className="mt-2 text-sm">No post scheduled for today.</p>
                    </div>
                  )}
                </div>

                <Link href="/content/today" className="btn btn-ink mt-6 w-full">
                  Go to Today View
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </section>
            </div>

            {/* Tasks table with search + filters */}
            <section aria-labelledby="tasks-heading" className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 id="tasks-heading" className="font-display text-[2rem] leading-none">
                    Upcoming Launch Plan Tasks
                  </h2>
                  <p className="mt-1.5 text-sm">Action items to establish and scale your business operations</p>
                </div>
                <Link href="/plan" className="font-label inline-flex items-center gap-1.5 text-sm underline-offset-4 hover:underline">
                  View All Tasks
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>

              {tasks.length > 0 ? (
                <DataGrid
                  caption="Upcoming launch plan tasks"
                  columns={taskColumns}
                  rows={tasks}
                  rowKey={(t) => t.id}
                  searchText={(t) => `${t.title} ${t.category} week ${t.week}`}
                  searchPlaceholder="Search tasks"
                  filters={taskFilters}
                  pageSize={6}
                  emptyTitle="No tasks match"
                  emptyDescription="Clear the search or a filter to see your tasks again."
                />
              ) : (
                <p className="rounded-[var(--radius-lg)] border border-[var(--color-ink)] bg-[var(--color-surface)] p-6 text-center text-sm">
                  All upcoming tasks completed! Check your Launch Plan for next milestone objectives.
                </p>
              )}
            </section>

            {/* Launchpad */}
            <section aria-label="Shortcuts" className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                { href: "/content/research", icon: Search, title: "Market Research Teardown", body: "Review local competitor pricing, weaknesses, and hashtag clusters.", tone: "bg-[var(--color-cream)]" },
                { href: "/pricing", icon: Tag, title: "Pricing & Break-even", body: "Verify unit economics, labor costs, and monthly sales targets.", tone: "bg-[var(--color-marigold)]" },
                { href: "/content/outline", icon: Sparkles, title: "30-Day Campaign Outline", body: "Explore content pillars, weekly journey themes, and concept briefs.", tone: "bg-[var(--color-pink)]" },
              ].map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className={`group flex min-h-40 flex-col justify-between rounded-[var(--radius-lg)] border border-[var(--color-ink)] p-5 transition-transform duration-300 ease-[var(--ease-back)] hover:-translate-y-1 ${c.tone}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <c.icon className="h-5 w-5" aria-hidden />
                    <ArrowRight className="h-5 w-5 transition-transform duration-300 ease-[var(--ease-back)] group-hover:translate-x-1.5" aria-hidden />
                  </div>
                  <div>
                    <h3 className="font-display text-[1.7rem] leading-none">{c.title}</h3>
                    <p className="mt-2 text-sm">{c.body}</p>
                  </div>
                </Link>
              ))}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
