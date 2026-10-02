"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  FileEdit,
  Video,
  Image as ImageIcon,
  Share2,
  Hash,
  Compass,
  Check,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  BusinessService,
  ContentService,
  type BusinessResponse,
  type ContentOutlineGateResponse,
  type DayBriefItem,
} from "@/lib/api";

export default function ContentOutlinePage() {
  const [business, setBusiness] = useState<BusinessResponse | null>(null);
  const [gateData, setGateData] = useState<ContentOutlineGateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<number | "all">("all");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Revision Modal State
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [revisionError, setRevisionError] = useState<string | null>(null);

  // Approval Modal State
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const biz = await BusinessService.getCurrentUserBusinessApiV1BusinessesGet();
      setBusiness(biz);

      if (biz?.id) {
        const overview =
          await ContentService.getOutlineGateApiV1BusinessesBusinessIdContentOutlineGet({
            businessId: biz.id,
          });
        setGateData(overview);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load content outline";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
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

  const handleApprove = async () => {
    if (!business?.id) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result =
        await ContentService.approveOutlineApiV1BusinessesBusinessIdContentOutlineApprovePost({
          businessId: business.id,
        });
      setIsApproveConfirmOpen(false);
      setToastMessage("30-Day Content Outline approved! Content Writer agents have been dispatched.");
      if (gateData) {
        setGateData({
          ...gateData,
          calendar: result.calendar,
        });
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to approve content outline";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!business?.id) return;
    if (!revisionNotes.trim() || revisionNotes.trim().length < 3) {
      setRevisionError("Please enter at least 3 characters explaining what you'd like adjusted.");
      return;
    }
    setIsSubmitting(true);
    setRevisionError(null);
    try {
      const result =
        await ContentService.reviseOutlineApiV1BusinessesBusinessIdContentOutlineRevisePost({
          businessId: business.id,
          requestBody: { notes: revisionNotes.trim() },
        });
      setIsRevisionModalOpen(false);
      setRevisionNotes("");
      setToastMessage("Revision request sent! The Content Strategist will adjust your outline.");
      if (gateData) {
        setGateData({
          ...gateData,
          calendar: result.calendar,
        });
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to submit revision request";
      setRevisionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calendar = gateData?.calendar;
  const research = gateData?.research;

  const allBriefs = calendar?.day_briefs || [];
  const filteredBriefs =
    selectedWeek === "all"
      ? allBriefs
      : allBriefs.filter((b: DayBriefItem) => {
          const startDay = (selectedWeek - 1) * 7 + 1;
          const endDay = selectedWeek === 4 ? 30 : selectedWeek * 7;
          return b.day >= startDay && b.day <= endDay;
        });

  const getFormatIcon = (fmt: string) => {
    switch (fmt.toLowerCase()) {
      case "reel":
        return <Video className="w-3.5 h-3.5 text-rose-600" />;
      case "carousel":
        return <Layers className="w-3.5 h-3.5 text-blue-600" />;
      case "story":
        return <Share2 className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  const getGoalBadgeClass = (goal: string) => {
    switch (goal.toLowerCase()) {
      case "sales":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "awareness":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "engagement":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "leads":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-neutral-50 text-neutral-700 border-neutral-200";
    }
  };

  return (
    <AppShell
      role="entrepreneur"
      userName={business?.name || "Entrepreneur"}
      pageTitle="30-Day Content Outline & Strategy"
    >
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Toast Alert */}
        {toastMessage && (
          <div
            role="status"
            className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 animate-in fade-in"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm font-medium">{toastMessage}</p>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 text-sm font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Global Error Banner */}
        {errorMessage && (
          <div
            role="alert"
            className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <p className="text-sm font-medium">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-700 hover:text-rose-900 text-sm font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
                30-Day Content Outline & Strategy
              </h1>
              {calendar && (
                <StatusBadge
                  status={calendar.status}
                  label={
                    calendar.status === "approved"
                      ? "Approved (Gate 2 Passed)"
                      : calendar.status === "revision_requested"
                      ? "Revision In Progress"
                      : "Awaiting Review"
                  }
                />
              )}
            </div>
            <p className="text-neutral-600 text-sm mt-1">
              Human Gate 2 (F-010): Review your strategic brand pillars, weekly themes, and 30-day posting blueprint before captions are written.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition"
              title="Refresh outline"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>

            {calendar && calendar.status !== "approved" && (
              <>
                <button
                  type="button"
                  onClick={() => setIsRevisionModalOpen(true)}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition"
                >
                  <FileEdit className="w-4 h-4 text-neutral-500" />
                  Request Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsApproveConfirmOpen(true)}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm transition"
                >
                  <Check className="w-4 h-4" />
                  Approve Outline
                </button>
              </>
            )}

            {calendar && calendar.status === "approved" && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 text-sm font-medium rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Approved & Dispatched
              </div>
            )}
          </div>
        </div>

        {/* Loading & Empty States */}
        {isLoading && !gateData && (
          <LoadingState message="Loading your 30-day content strategy & market research..." />
        )}

        {!isLoading && !gateData && !errorMessage && (
          <EmptyState
            title="No Content Strategy Found"
            description="We haven't generated a 30-day content outline for your business yet. Complete your business profile or onboarding first."
            action={
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition"
              >
                Go to Onboarding
              </Link>
            }
          />
        )}

        {gateData && calendar && (
          <div className="space-y-8">
            {/* Revision Banner if requested */}
            {calendar.status === "revision_requested" && calendar.revision_notes && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-sm font-semibold">Active Revision Feedback</h2>
                    <p className="text-sm mt-1 text-amber-800 italic">
                      &quot;{calendar.revision_notes}&quot;
                    </p>
                    <p className="text-xs text-amber-700 mt-2">
                      The Content Strategist agent is updating your outline based on these notes.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Top Grid: Market Research Rationale + Format Mix */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Research Insights Card */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-base font-semibold text-neutral-900">
                      Why This Strategy Fits Your Market
                    </h2>
                  </div>
                  {research && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      <Sparkles className="w-3 h-3" />
                      {Math.round(research.confidence * 100)}% Market Fit Confidence
                    </span>
                  )}
                </div>

                <p className="text-sm text-neutral-600">
                  Based on local competitor analysis and search trends for{" "}
                  <strong className="text-neutral-800">{business?.niche || "your niche"}</strong> in{" "}
                  <strong className="text-neutral-800">{business?.city || "Pakistan"}</strong>.
                </p>

                {/* Key Differentiation Points */}
                {research?.how_to_be_better && research.how_to_be_better.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      How You Will Stand Out
                    </h3>
                    <ul className="space-y-1.5 text-sm text-neutral-700">
                      {research.how_to_be_better.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Competitors Benchmarked */}
                {research?.competitors && research.competitors.length > 0 && (
                  <div className="pt-2">
                    <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                      Benchmarked Competitors
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {research.competitors.map((comp, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs space-y-1"
                        >
                          <div className="font-semibold text-neutral-900 flex items-center justify-between">
                            <span>{comp.name}</span>
                            <span className="text-neutral-500">{comp.handle}</span>
                          </div>
                          <div className="text-neutral-600">
                            <strong>Edge:</strong> {comp.key_advantage}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search-Informed Hashtags */}
                {research?.hashtags && (
                  <div className="pt-2">
                    <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-neutral-400" />
                      Target Search Hashtags
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.values(research.hashtags)
                        .flat()
                        .slice(0, 8)
                        .map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded text-xs font-mono"
                          >
                            {String(tag)}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Format Distribution & Pillars Card */}
              <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs space-y-5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-base font-semibold text-neutral-900">
                    Content Mix & Pillars
                  </h2>
                </div>

                {/* Formats */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Format Distribution
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(calendar.format_distribution || {}).map(
                      ([fmt, pct]) => (
                        <div
                          key={fmt}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50 border border-neutral-200"
                        >
                          <div className="flex items-center gap-2">
                            {getFormatIcon(fmt)}
                            <span className="text-xs font-medium text-neutral-700 capitalize">
                              {fmt}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-neutral-900">
                            {Number(pct)}%
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Pillars */}
                <div className="space-y-3 pt-2 border-t border-neutral-100">
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Content Pillars
                  </h3>
                  <div className="space-y-2">
                    {calendar.pillars?.map((pillar, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1"
                      >
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="capitalize font-semibold text-neutral-800">
                            {pillar.name.replace(/_/g, " ")}
                          </span>
                          <span className="text-neutral-600 font-bold">
                            {pillar.target_percentage}%
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 leading-tight">
                          {pillar.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Strategic Themes */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-semibold text-neutral-900">
                  Weekly Strategic Journey
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {calendar.weekly_themes?.map((week) => (
                  <div
                    key={week.week}
                    className="p-4 rounded-xl border border-neutral-200 bg-linear-to-b from-neutral-50 to-white space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-neutral-200 text-neutral-800">
                        Week {week.week}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-neutral-900">
                      {week.theme}
                    </h3>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      {week.objective}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 30-Day Day-by-Day Post Blueprint */}
            <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-neutral-900">
                    30-Day Day-by-Day Post Briefs
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Showing daily hooks, goals, and format assignments designed to build steady customer momentum.
                  </p>
                </div>

                {/* Week Filter Buttons */}
                <div className="inline-flex rounded-lg border border-neutral-200 p-1 bg-neutral-50 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setSelectedWeek("all")}
                    className={`px-3 py-1 rounded-md transition ${
                      selectedWeek === "all"
                        ? "bg-white text-neutral-900 shadow-xs font-semibold"
                        : "text-neutral-600 hover:text-neutral-900"
                    }`}
                  >
                    All (30)
                  </button>
                  {[1, 2, 3, 4].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setSelectedWeek(w)}
                      className={`px-3 py-1 rounded-md transition ${
                        selectedWeek === w
                          ? "bg-white text-neutral-900 shadow-xs font-semibold"
                          : "text-neutral-600 hover:text-neutral-900"
                      }`}
                    >
                      Week {w}
                    </button>
                  ))}
                </div>
              </div>

              {/* Day Briefs Grid */}
              <div className="divide-y divide-neutral-100">
                {filteredBriefs.map((brief: DayBriefItem) => (
                  <div
                    key={brief.day}
                    className="p-4 hover:bg-neutral-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      {/* Day Number Badge */}
                      <div className="w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-200 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                          Day
                        </span>
                        <span className="text-base font-bold text-neutral-900 leading-none">
                          {brief.day}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Format Badge */}
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-800 border border-neutral-200 capitalize">
                            {getFormatIcon(brief.format)}
                            {brief.format}
                          </span>

                          {/* Pillar Badge */}
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 capitalize">
                            {brief.pillar.replace(/_/g, " ")}
                          </span>

                          {/* Goal Tag */}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border capitalize ${getGoalBadgeClass(
                              brief.goal
                            )}`}
                          >
                            Goal: {brief.goal}
                          </span>
                        </div>

                        <p className="text-sm font-medium text-neutral-800">
                          {brief.key_idea}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Floating Action Bar */}
            <div className="p-6 bg-neutral-900 rounded-2xl text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Ready to generate full captions and visual prompts?
                </h3>
                <p className="text-neutral-400 text-xs mt-1">
                  Approving activates the Content Writer and Visual Prompt agents to generate ready-to-post captions, Urdu hooks, and media guidelines.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {calendar.status !== "approved" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsRevisionModalOpen(true)}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-neutral-700 text-neutral-200 hover:bg-neutral-800 text-sm font-semibold transition"
                    >
                      Request Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsApproveConfirmOpen(true)}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-md transition flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Approve 30-Day Outline
                    </button>
                  </>
                ) : (
                  <Link
                    href="/content/calendar"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition"
                  >
                    View in Calendar
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Request Revision */}
        {isRevisionModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="revision-modal-title"
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
          >
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-neutral-900">
                <FileEdit className="w-5 h-5 text-amber-600" />
                <h3 id="revision-modal-title" className="text-lg font-bold">
                  Request Outline Revisions
                </h3>
              </div>

              <p className="text-sm text-neutral-600">
                Tell the Content Strategist what to adjust (e.g., more Reels on behind-the-scenes craft, fewer static posts, change the weekly themes, or adjust focus for a festival).
              </p>

              {revisionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                  {revisionError}
                </div>
              )}

              <div>
                <label
                  htmlFor="revision-textarea"
                  className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1"
                >
                  Revision Notes & Guidance
                </label>
                <textarea
                  id="revision-textarea"
                  rows={4}
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="e.g. Please add more Reels showcasing our hand-embroidery process and emphasize wedding season gifts in Week 3..."
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-neutral-900"
                />
                <span className="text-[11px] text-neutral-400 mt-1 block">
                  Minimum 3 characters required.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRevisionModalOpen(false);
                    setRevisionError(null);
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRequestRevision}
                  disabled={isSubmitting || revisionNotes.trim().length < 3}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? "Submitting..." : "Send Revision Request"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Confirm Approval */}
        {isApproveConfirmOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="approve-modal-title"
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
          >
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mx-auto">
                <Check className="w-6 h-6" />
              </div>

              <div className="text-center space-y-2">
                <h3 id="approve-modal-title" className="text-lg font-bold text-neutral-900">
                  Approve 30-Day Content Outline?
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  By approving, you lock in your strategic pillars and 30-day concept plan. Next, the Content Writer and Visual Prompt agents will generate captions, hashtags, and image generation guides for each post.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsApproveConfirmOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition"
                >
                  Review Again
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {isSubmitting ? "Approving..." : "Yes, Approve Strategy"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
