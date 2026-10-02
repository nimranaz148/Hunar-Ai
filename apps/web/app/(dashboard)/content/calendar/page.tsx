"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Calendar,
  Layers,
  Video,
  Image as ImageIcon,
  Compass,
  CheckCircle2,
  Send,
  Copy,
  Check,
  Filter,
  RefreshCw,
  ChevronRight,
  X,
  FileText,
  AlertCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  BusinessService,
  ContentService,
  type BusinessResponse,
  type ContentCalendarViewResponse,
  type ContentItemResponse,
} from "@/lib/api";

function getPromptString(prompt?: Record<string, unknown> | null): string {
  if (!prompt || typeof prompt !== "object" || Object.keys(prompt).length === 0) {
    return "";
  }
  const val = prompt.prompt || prompt.description || prompt.concept;
  return typeof val === "string" ? val : JSON.stringify(prompt);
}

export default function ContentCalendarPage() {
  const [business, setBusiness] = useState<BusinessResponse | null>(null);
  const [calendarView, setCalendarView] = useState<ContentCalendarViewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [pillarFilter, setPillarFilter] = useState<string>("all");
  const [weekFilter, setWeekFilter] = useState<number | "all">("all");

  // Drawer / Detail modal state
  const [selectedItem, setSelectedItem] = useState<ContentItemResponse | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      const biz = await BusinessService.getCurrentUserBusinessApiV1BusinessesGet();
      setBusiness(biz);

      if (biz?.id) {
        const view =
          await ContentService.getCalendarApiV1BusinessesBusinessIdContentCalendarGet({
            businessId: biz.id,
          });
        setCalendarView(view);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load content calendar";
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
        loadData();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [loadData]);

  // Handle status update
  const handleUpdateStatus = async (
    itemId: string,
    newStatus: "draft" | "approved" | "posted" | "skipped"
  ) => {
    if (!business?.id) return;
    setIsUpdatingStatus(true);
    try {
      const updated =
        await ContentService.updateItemStatusApiV1BusinessesBusinessIdContentItemsItemIdStatusPatch({
          businessId: business.id,
          itemId,
          requestBody: { status: newStatus },
        });

      // Update local state
      if (calendarView) {
        const currentItems = calendarView.items || [];
        const updatedItems = currentItems.map((item) =>
          item.id === itemId ? updated : item
        );

        // Recalculate stats
        const draftCount = updatedItems.filter((i) => i.status === "draft").length;
        const approvedCount = updatedItems.filter((i) => i.status === "approved").length;
        const postedCount = updatedItems.filter((i) => i.status === "posted").length;
        const skippedCount = updatedItems.filter((i) => i.status === "skipped").length;

        setCalendarView({
          ...calendarView,
          items: updatedItems,
          stats: {
            total: updatedItems.length,
            draft: draftCount,
            approved: approvedCount,
            posted: postedCount,
            skipped: skippedCount,
            needs_review: calendarView.stats?.needs_review ?? 0,
          },
        });
      }

      if (selectedItem?.id === itemId) {
        setSelectedItem(updated);
      }

      setToastMessage(`Day ${updated.day} updated to ${newStatus.toUpperCase()}`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to update item status";
      setErrorMessage(msg);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      setCopiedField(null);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
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

  const allItems = calendarView?.items || [];
  const stats = calendarView?.stats || {
    total: 0,
    draft: 0,
    approved: 0,
    posted: 0,
    skipped: 0,
  };

  // Distinct pillars for filter
  const distinctPillars = Array.from(
    new Set(allItems.map((item) => item.pillar).filter(Boolean))
  );

  // Filter items
  const filteredItems = allItems.filter((item) => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (formatFilter !== "all" && item.format.toLowerCase() !== formatFilter.toLowerCase())
      return false;
    if (pillarFilter !== "all" && item.pillar !== pillarFilter) return false;
    if (weekFilter !== "all") {
      const startDay = (weekFilter - 1) * 7 + 1;
      const endDay = weekFilter === 4 ? 30 : weekFilter * 7;
      if (item.day < startDay || item.day > endDay) return false;
    }
    return true;
  });

  const selectedImagePrompt = selectedItem ? getPromptString(selectedItem.image_prompt) : "";
  const selectedVideoPrompt = selectedItem ? getPromptString(selectedItem.video_prompt) : "";

  return (
    <AppShell
      role="entrepreneur"
      userName={business?.name || "Entrepreneur"}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Toast Feedback */}
        {toastMessage && (
          <div
            role="status"
            className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 bg-[var(--color-surface)] border border-[var(--color-success-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] text-sm font-medium text-[var(--color-success)] animate-in fade-in"
          >
            <CheckCircle2 className="w-5 h-5 text-[var(--color-success)]" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[var(--text-2xs)] font-bold tracking-wide uppercase bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
                Phase 2 · Content Engine
              </span>
              <span className="text-[var(--text-xs)] text-[var(--color-fg-muted)]">
                F-011 Month View
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-fg)] mt-1 tracking-tight flex items-center gap-2">
              <Calendar className="w-6 h-6 text-[var(--color-accent)]" />
              30-Day Content Calendar
            </h1>
            <p className="text-sm text-[var(--color-fg-muted)] mt-1">
              Review, filter, and schedule your social media posts across the 30-day campaign.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={isRefreshing || isLoading}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--color-fg)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-hover)] transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <Link
              href="/content/outline"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[var(--color-fg)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-hover)] transition"
            >
              <FileText className="w-3.5 h-3.5 text-[var(--color-fg-muted)]" />
              Outline & Strategy
            </Link>
            <Link
              href="/content/today"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-[var(--color-fg-inverse)] bg-[var(--color-accent)] rounded-[var(--radius-md)] hover:bg-[var(--color-accent-hover)] transition shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              Today&apos;s Post
            </Link>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div
            role="alert"
            className="p-4 bg-[var(--color-danger-subtle)] border border-[var(--color-danger-border)] rounded-[var(--radius-lg)] text-[var(--color-danger)] text-sm flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="font-semibold text-sm">Unable to load calendar</h2>
              <p className="mt-1 text-xs opacity-90">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => loadData()}
              className="px-3 py-1 bg-[var(--color-surface)] border border-[var(--color-danger-border)] rounded text-xs font-medium hover:bg-[var(--color-surface-hover)]"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !calendarView && (
          <LoadingState message="Loading your 30-day content calendar..." />
        )}

        {/* Empty State */}
        {!isLoading && !calendarView && !errorMessage && (
          <EmptyState
            title="No Content Calendar Found"
            description="Your 30-day content calendar has not been generated yet. Head to the Strategy Outline or complete your Onboarding to generate it."
            action={
              <Link
                href="/content/outline"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-[var(--color-fg-inverse)] text-sm font-semibold rounded-[var(--radius-md)] hover:bg-[var(--color-accent-hover)] transition"
              >
                Go to Content Outline
              </Link>
            }
          />
        )}

        {calendarView && (
          <div className="space-y-6">
            {/* Stats Overview Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)]">
                <span className="text-[var(--text-2xs)] font-bold text-[var(--color-fg-subtle)] uppercase tracking-wider block">
                  Total Posts
                </span>
                <span className="text-2xl font-black text-[var(--color-fg)] mt-1 block">
                  {stats.total}
                </span>
                <span className="text-[var(--text-2xs)] text-[var(--color-fg-muted)] mt-1 block">
                  Full 30-day plan
                </span>
              </div>

              <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)]">
                <span className="text-[var(--text-2xs)] font-bold text-[var(--color-neutral)] uppercase tracking-wider block">
                  Drafts
                </span>
                <span className="text-2xl font-black text-[var(--color-neutral)] mt-1 block">
                  {stats.draft}
                </span>
                <span className="text-[var(--text-2xs)] text-[var(--color-fg-muted)] mt-1 block">
                  Pending review
                </span>
              </div>

              <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)]">
                <span className="text-[var(--text-2xs)] font-bold text-[var(--color-success)] uppercase tracking-wider block">
                  Approved
                </span>
                <span className="text-2xl font-black text-[var(--color-success)] mt-1 block">
                  {stats.approved}
                </span>
                <span className="text-[var(--text-2xs)] text-[var(--color-fg-muted)] mt-1 block">
                  Ready for posting
                </span>
              </div>

              <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)]">
                <span className="text-[var(--text-2xs)] font-bold text-[var(--color-info)] uppercase tracking-wider block">
                  Posted
                </span>
                <span className="text-2xl font-black text-[var(--color-info)] mt-1 block">
                  {stats.posted}
                </span>
                <span className="text-[var(--text-2xs)] text-[var(--color-fg-muted)] mt-1 block">
                  Published on socials
                </span>
              </div>

              <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)]">
                <span className="text-[var(--text-2xs)] font-bold text-[var(--color-warning)] uppercase tracking-wider block">
                  Skipped
                </span>
                <span className="text-2xl font-black text-[var(--color-warning)] mt-1 block">
                  {stats.skipped}
                </span>
                <span className="text-[var(--text-2xs)] text-[var(--color-fg-muted)] mt-1 block">
                  Bypassed / rescheduled
                </span>
              </div>
            </div>

            {/* Filter and View Controls Bar */}
            <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-fg-muted)]">
                  <Filter className="w-3.5 h-3.5 text-[var(--color-fg-subtle)]" />
                  <span>Filter by:</span>
                </div>

                {/* Status Filter */}
                <select
                  aria-label="Filter by Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-medium text-[var(--color-fg)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] focus:outline-hidden focus:ring-1 focus:ring-[var(--color-accent)]"
                >
                  <option value="all">All Statuses ({stats.total})</option>
                  <option value="draft">Draft ({stats.draft})</option>
                  <option value="approved">Approved ({stats.approved})</option>
                  <option value="posted">Posted ({stats.posted})</option>
                  <option value="skipped">Skipped ({stats.skipped})</option>
                </select>

                {/* Format Filter */}
                <select
                  aria-label="Filter by Format"
                  value={formatFilter}
                  onChange={(e) => setFormatFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-medium text-[var(--color-fg)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] focus:outline-hidden focus:ring-1 focus:ring-[var(--color-accent)]"
                >
                  <option value="all">All Formats</option>
                  <option value="reel">Reels</option>
                  <option value="carousel">Carousels</option>
                  <option value="story">Stories</option>
                  <option value="static">Static Posts</option>
                </select>

                {/* Pillar Filter */}
                {distinctPillars.length > 0 && (
                  <select
                    aria-label="Filter by Strategic Pillar"
                    value={pillarFilter}
                    onChange={(e) => setPillarFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs font-medium text-[var(--color-fg)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] focus:outline-hidden focus:ring-1 focus:ring-[var(--color-accent)]"
                  >
                    <option value="all">All Pillars</option>
                    {distinctPillars.map((p) => (
                      <option key={p} value={p}>
                        {p.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Week Switcher */}
              <div className="flex items-center gap-1 bg-[var(--color-surface-hover)] p-1 rounded-[var(--radius-md)] border border-[var(--color-border)] text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setWeekFilter("all")}
                  className={`px-2.5 py-1 rounded transition ${
                    weekFilter === "all"
                      ? "bg-[var(--color-surface)] text-[var(--color-fg)] shadow-xs"
                      : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
                  }`}
                >
                  All Days
                </button>
                <button
                  type="button"
                  onClick={() => setWeekFilter(1)}
                  className={`px-2.5 py-1 rounded transition ${
                    weekFilter === 1
                      ? "bg-[var(--color-surface)] text-[var(--color-fg)] shadow-xs"
                      : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
                  }`}
                >
                  W1 (1-7)
                </button>
                <button
                  type="button"
                  onClick={() => setWeekFilter(2)}
                  className={`px-2.5 py-1 rounded transition ${
                    weekFilter === 2
                      ? "bg-[var(--color-surface)] text-[var(--color-fg)] shadow-xs"
                      : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
                  }`}
                >
                  W2 (8-14)
                </button>
                <button
                  type="button"
                  onClick={() => setWeekFilter(3)}
                  className={`px-2.5 py-1 rounded transition ${
                    weekFilter === 3
                      ? "bg-[var(--color-surface)] text-[var(--color-fg)] shadow-xs"
                      : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
                  }`}
                >
                  W3 (15-21)
                </button>
                <button
                  type="button"
                  onClick={() => setWeekFilter(4)}
                  className={`px-2.5 py-1 rounded transition ${
                    weekFilter === 4
                      ? "bg-[var(--color-surface)] text-[var(--color-fg)] shadow-xs"
                      : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
                  }`}
                >
                  W4 (22-30)
                </button>
              </div>
            </div>

            {/* Calendar Grid: 30 Days */}
            {filteredItems.length === 0 ? (
              <div className="p-12 text-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)]">
                <p className="text-sm font-medium text-[var(--color-fg-muted)]">
                  No content items match your current filter selections.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("all");
                    setFormatFilter("all");
                    setPillarFilter("all");
                    setWeekFilter("all");
                  }}
                  className="mt-3 text-xs font-semibold text-[var(--color-accent)] hover:underline"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="group relative flex flex-col justify-between p-4 bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] cursor-pointer transition-all duration-200"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedItem(item);
                      }
                    }}
                    aria-label={`Open details for Day ${item.day}`}
                  >
                    {/* Top Row: Day Pill & Format Icon */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 text-xs font-black rounded-[var(--radius-sm)] bg-[var(--color-surface-hover)] text-[var(--color-fg)] border border-[var(--color-border)]">
                          Day {item.day}
                        </span>
                        <div
                          className="p-1 rounded bg-[var(--color-surface-hover)] flex items-center justify-center"
                          title={item.format}
                        >
                          {getFormatIcon(item.format)}
                        </div>
                      </div>

                      <StatusBadge status={item.status} />
                    </div>

                    {/* Middle: Pillar tag & Hook preview */}
                    <div className="space-y-1.5 flex-1 my-1">
                      <span className="inline-block text-[var(--text-2xs)] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
                        {item.pillar.replace(/_/g, " ")}
                      </span>

                      <h2 className="text-xs font-bold text-[var(--color-fg)] line-clamp-2 leading-snug group-hover:text-[var(--color-accent)] transition">
                        {item.hook || "Post Concept"}
                      </h2>

                      {item.caption && (
                        <p className="text-[var(--text-2xs)] text-[var(--color-fg-muted)] line-clamp-2 leading-relaxed">
                          {item.caption}
                        </p>
                      )}
                    </div>

                    {/* Bottom Row: Date & Quick View cue */}
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-[var(--color-border)] text-[var(--text-2xs)] text-[var(--color-fg-subtle)]">
                      <span>{item.date || `Day ${item.day}`}</span>
                      <span className="flex items-center gap-0.5 text-[var(--color-accent)] font-semibold opacity-0 group-hover:opacity-100 transition">
                        View <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Slide-over Drawer / Detail Modal for Selected Content Item */}
        {selectedItem && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-item-title"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in"
          >
            <div className="bg-[var(--color-surface)] w-full max-w-xl h-full shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-[var(--color-border)]">
              {/* Drawer Header */}
              <div className="p-6 border-b border-[var(--color-border)] flex items-start justify-between gap-4 bg-[var(--color-surface-hover)]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 text-xs font-black rounded-[var(--radius-sm)] bg-[var(--color-surface)] text-[var(--color-fg)] border border-[var(--color-border)]">
                      Day {selectedItem.day}
                    </span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-medium">
                      {getFormatIcon(selectedItem.format)}
                      <span className="capitalize">{selectedItem.format}</span>
                    </div>
                    <StatusBadge status={selectedItem.status} />
                  </div>

                  <h2
                    id="drawer-item-title"
                    className="text-lg font-bold text-[var(--color-fg)] tracking-tight mt-1"
                  >
                    {selectedItem.hook}
                  </h2>
                  <p className="text-xs text-[var(--color-fg-muted)] mt-0.5">
                    Strategic Pillar:{" "}
                    <span className="font-semibold text-[var(--color-accent)] uppercase">
                      {selectedItem.pillar.replace(/_/g, " ")}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="p-1.5 text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface)] rounded-[var(--radius-md)] transition"
                  aria-label="Close details"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                {/* Status Switcher Actions */}
                <div className="p-4 bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-[var(--radius-lg)] space-y-2">
                  <span className="text-[var(--text-2xs)] font-bold text-[var(--color-fg-muted)] uppercase tracking-wider block">
                    Update Item Status
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      disabled={isUpdatingStatus || selectedItem.status === "draft"}
                      onClick={() => handleUpdateStatus(selectedItem.id, "draft")}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] border transition ${
                        selectedItem.status === "draft"
                          ? "bg-[var(--color-neutral-subtle)] text-[var(--color-neutral)] border-[var(--color-neutral-border)]"
                          : "bg-[var(--color-surface)] text-[var(--color-fg)] border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                      }`}
                    >
                      Draft
                    </button>

                    <button
                      type="button"
                      disabled={isUpdatingStatus || selectedItem.status === "approved"}
                      onClick={() => handleUpdateStatus(selectedItem.id, "approved")}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] border transition ${
                        selectedItem.status === "approved"
                          ? "bg-[var(--color-success-subtle)] text-[var(--color-success)] border-[var(--color-success-border)]"
                          : "bg-[var(--color-surface)] text-[var(--color-fg)] border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                      }`}
                    >
                      Approve
                    </button>

                    <button
                      type="button"
                      disabled={isUpdatingStatus || selectedItem.status === "posted"}
                      onClick={() => handleUpdateStatus(selectedItem.id, "posted")}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] border transition ${
                        selectedItem.status === "posted"
                          ? "bg-[var(--color-info-subtle)] text-[var(--color-info)] border-[var(--color-info-border)]"
                          : "bg-[var(--color-surface)] text-[var(--color-fg)] border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                      }`}
                    >
                      Posted
                    </button>

                    <button
                      type="button"
                      disabled={isUpdatingStatus || selectedItem.status === "skipped"}
                      onClick={() => handleUpdateStatus(selectedItem.id, "skipped")}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] border transition ${
                        selectedItem.status === "skipped"
                          ? "bg-[var(--color-warning-subtle)] text-[var(--color-warning)] border-[var(--color-warning-border)]"
                          : "bg-[var(--color-surface)] text-[var(--color-fg)] border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                      }`}
                    >
                      Skip
                    </button>
                  </div>
                </div>

                {/* Hook / Key Idea */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--color-fg)]">
                      Hook & Core Angle
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedItem.hook || "", "hook")}
                      className="inline-flex items-center gap-1 text-[var(--text-2xs)] font-semibold text-[var(--color-accent)] hover:underline"
                    >
                      {copiedField === "hook" ? (
                        <>
                          <Check className="w-3 h-3 text-[var(--color-success)]" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3 bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-xs text-[var(--color-fg)] font-medium leading-relaxed">
                    {selectedItem.hook}
                  </div>
                </div>

                {/* Full Caption */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--color-fg)]">
                      Full Caption (Roman Urdu / English)
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedItem.caption || "", "caption")}
                      className="inline-flex items-center gap-1 text-[var(--text-2xs)] font-semibold text-[var(--color-accent)] hover:underline"
                    >
                      {copiedField === "caption" ? (
                        <>
                          <Check className="w-3 h-3 text-[var(--color-success)]" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Caption</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-4 bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-xs text-[var(--color-fg)] whitespace-pre-wrap leading-relaxed font-normal">
                    {selectedItem.caption || "No caption generated yet."}
                  </div>
                </div>

                {/* Hashtags */}
                {selectedItem.hashtags && selectedItem.hashtags.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--color-fg)]">
                        Strategic Hashtags ({selectedItem.hashtags.length})
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            (selectedItem.hashtags || []).join(" "),
                            "hashtags"
                          )
                        }
                        className="inline-flex items-center gap-1 text-[var(--text-2xs)] font-semibold text-[var(--color-accent)] hover:underline"
                      >
                        {copiedField === "hashtags" ? (
                          <>
                            <Check className="w-3 h-3 text-[var(--color-success)]" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy All</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 p-3 bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-[var(--radius-md)]">
                      {(selectedItem.hashtags || []).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-[var(--text-2xs)] font-medium bg-[var(--color-surface)] text-[var(--color-accent)] rounded border border-[var(--color-border)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Visual Prompts (Image / Video) */}
                <div className="space-y-4">
                  <span className="text-xs font-bold text-[var(--color-fg)] block">
                    Visual Creation Prompts
                  </span>

                  {selectedImagePrompt && (
                    <div className="space-y-1.5 p-3 bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-[var(--radius-md)]">
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-2xs)] font-bold text-[var(--color-fg-muted)] uppercase flex items-center gap-1">
                          <ImageIcon className="w-3 h-3 text-emerald-600" />
                          Image Prompt
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedImagePrompt, "image_prompt")}
                          className="text-[var(--text-2xs)] font-semibold text-[var(--color-accent)] hover:underline"
                        >
                          {copiedField === "image_prompt" ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <p className="text-xs text-[var(--color-fg-muted)] italic">
                        &quot;{selectedImagePrompt}&quot;
                      </p>
                    </div>
                  )}

                  {selectedVideoPrompt && (
                    <div className="space-y-1.5 p-3 bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-[var(--radius-md)]">
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-2xs)] font-bold text-[var(--color-fg-muted)] uppercase flex items-center gap-1">
                          <Video className="w-3 h-3 text-purple-600" />
                          Video Prompt
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedVideoPrompt, "video_prompt")}
                          className="text-[var(--text-2xs)] font-semibold text-[var(--color-accent)] hover:underline"
                        >
                          {copiedField === "video_prompt" ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <p className="text-xs text-[var(--color-fg-muted)] italic">
                        &quot;{selectedVideoPrompt}&quot;
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)] rounded-[var(--radius-md)] border border-[var(--color-border)] transition"
                >
                  Close Preview
                </button>
                <Link
                  href="/content/today"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[var(--color-fg-inverse)] bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] rounded-[var(--radius-md)] transition shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  Go to Today View
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
