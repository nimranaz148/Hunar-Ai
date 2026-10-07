"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Sparkles,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Target,
  FileText,
  Briefcase,
  MapPin,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import {
  MentorsService,
  type MenteeListItem,
  type MenteeDetailResponse,
} from "@/lib/api";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

function formatPKR(amount: number): string {
  return `PKR ${amount.toLocaleString()}`;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "Schedule pending";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export default function MentorMenteesPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div className="p-8">
          <LoadingState message="Loading mentees..." />
        </div>
      }
    >
      <MentorMenteesContent />
    </Suspense>
  );
}

function MentorMenteesContent(): React.ReactElement {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id");

  const [mentees, setMentees] = useState<MenteeListItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedMenteeId, setSelectedMenteeId] = useState<string | null>(initialId);
  const [prevInitialId, setPrevInitialId] = useState<string | null>(initialId);
  const [menteeDetail, setMenteeDetail] = useState<MenteeDetailResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  if (initialId !== prevInitialId) {
    setPrevInitialId(initialId);
    setSelectedMenteeId(initialId);
    if (!initialId) {
      setMenteeDetail(null);
    }
  }

  const handleSelectMentee = (id: string) => {
    setSelectedMenteeId(id);
    setMenteeDetail(null);
  };

  const handleBackToList = () => {
    setSelectedMenteeId(null);
    setMenteeDetail(null);
  };

  // Load mentee list
  const fetchMentees = async () => {
    try {
      setListError(null);
      const res = await MentorsService.listOwnMenteesApiV1MentorsMeMenteesGet();
      setMentees(res.mentees || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load mentees";
      setListError(msg);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setListError(null);
        const res = await MentorsService.listOwnMenteesApiV1MentorsMeMenteesGet();
        if (!ignore) {
          setMentees(res.mentees || []);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : "Failed to load mentees";
          setListError(msg);
        }
      } finally {
        if (!ignore) {
          setIsLoadingList(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  // Load selected mentee detail
  useEffect(() => {
    if (!selectedMenteeId) {
      return;
    }

    let ignore = false;
    async function loadDetail(id: string) {
      setIsLoadingDetail(true);
      setDetailError(null);
      try {
        const res =
          await MentorsService.getOwnMenteeDetailApiV1MentorsMeMenteesMenteeIdGet({
            menteeId: id,
          });
        if (!ignore) {
          setMenteeDetail(res);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg =
            err instanceof Error ? err.message : "Failed to load mentee brief and progress";
          setDetailError(msg);
        }
      } finally {
        if (!ignore) {
          setIsLoadingDetail(false);
        }
      }
    }

    loadDetail(selectedMenteeId);
    return () => {
      ignore = true;
    };
  }, [selectedMenteeId]);

  // Filtered mentees list
  const filteredMentees = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return mentees;
    return mentees.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.business_name && m.business_name.toLowerCase().includes(q)) ||
        (m.business_niche && m.business_niche.toLowerCase().includes(q)) ||
        (m.business_city && m.business_city.toLowerCase().includes(q))
    );
  }, [mentees, searchQuery]);

  // Total metrics
  const totalTasksCompleted = useMemo(
    () => mentees.reduce((acc, m) => acc + (m.tasks_completed || 0), 0),
    [mentees]
  );
  const totalTasks = useMemo(
    () => mentees.reduce((acc, m) => acc + (m.tasks_total || 0), 0),
    [mentees]
  );
  const avgCompletionPercent =
    totalTasks > 0 ? Math.round((totalTasksCompleted / totalTasks) * 100) : 0;

  // View: Detailed Mentee Brief & Progress
  if (selectedMenteeId) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <button
            type="button"
            onClick={handleBackToList}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Mentees List
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (selectedMenteeId) {
                  setIsLoadingDetail(true);
                  MentorsService.getOwnMenteeDetailApiV1MentorsMeMenteesMenteeIdGet({
                    menteeId: selectedMenteeId,
                  })
                    .then((res) => setMenteeDetail(res))
                    .catch((err) =>
                      setDetailError(
                        err instanceof Error ? err.message : "Failed to reload detail"
                      )
                    )
                    .finally(() => setIsLoadingDetail(false));
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Brief
            </button>
          </div>
        </div>

        {/* Loading detail */}
        {isLoadingDetail && (
          <div className="py-12">
            <LoadingState message="Synthesizing mentee brief and progress report..." />
          </div>
        )}

        {/* Error detail */}
        {detailError && !isLoadingDetail && (
          <div className="p-6">
            <ErrorState
              title="Unable to load mentee brief"
              message={detailError}
              onRetry={() => setSelectedMenteeId(selectedMenteeId)}
            />
          </div>
        )}

        {/* Detail view content */}
        {menteeDetail && !isLoadingDetail && (
          <div className="space-y-6">
            {/* Top Mentee & Venture Banner */}
            <div className="p-6 rounded-xl border border-border bg-card shadow-2xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold text-foreground">
                      {menteeDetail.name}
                    </h1>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-primary/10 text-primary border border-primary/20">
                      Mentee
                    </span>
                    {menteeDetail.niche && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-muted text-foreground border border-border capitalize">
                        {menteeDetail.niche.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span>{menteeDetail.email}</span>
                    {menteeDetail.city && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                          {menteeDetail.area
                            ? `${menteeDetail.area}, ${menteeDetail.city}`
                            : menteeDetail.city}
                        </span>
                      </>
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-right sm:text-left">
                    <span className="text-xs text-muted-foreground block">Venture Name</span>
                    <span className="text-base font-semibold text-foreground">
                      {menteeDetail.business_name || "New Venture"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Operating Profile Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border text-xs">
                <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
                  <span className="text-muted-foreground block">Monthly Budget</span>
                  <span className="font-semibold text-foreground text-sm">
                    {menteeDetail.budget_pkr ? formatPKR(menteeDetail.budget_pkr) : "Not set"}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
                  <span className="text-muted-foreground block">Weekly Time</span>
                  <span className="font-semibold text-foreground text-sm">
                    {menteeDetail.hours_per_week
                      ? `${menteeDetail.hours_per_week} hrs/week`
                      : "Not set"}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
                  <span className="text-muted-foreground block">Target Platforms</span>
                  <span className="font-semibold text-foreground text-sm truncate block">
                    {menteeDetail.platforms && menteeDetail.platforms.length > 0
                      ? menteeDetail.platforms.join(", ")
                      : "WhatsApp"}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
                  <span className="text-muted-foreground block">Languages</span>
                  <span className="font-semibold text-foreground text-sm uppercase">
                    {menteeDetail.languages && menteeDetail.languages.length > 0
                      ? menteeDetail.languages.join(", ")
                      : "UR, EN"}
                  </span>
                </div>
              </div>

              {menteeDetail.target_customer && (
                <div className="p-3 rounded-lg bg-card border border-border text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Target Customer Profile: </span>
                  {menteeDetail.target_customer}
                </div>
              )}
            </div>

            {/* AI One-Page Mentor Brief Card (PRD §10 W-005, §36.23) */}
            <div
              data-testid="mentor-brief-card"
              className="p-6 rounded-xl border border-emerald-300 bg-gradient-to-br from-emerald-50/40 via-card to-card shadow-xs space-y-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">
                      Session Briefing (AI Synthesized)
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      One-page executive overview prepared by Mentor Brief Agent (PRD W-005)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                    {menteeDetail.mentor_brief.stage}
                  </span>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="p-4 rounded-lg bg-card border border-border shadow-2xs">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  Executive Summary
                </h3>
                <p className="text-sm text-foreground leading-relaxed">
                  {menteeDetail.mentor_brief.executive_summary}
                </p>
              </div>

              {/* Blockers & Focus Areas 2-column grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Identified Blockers */}
                <div className="p-4 rounded-lg bg-amber-50/30 border border-amber-200 shadow-2xs space-y-2.5">
                  <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Identified Bottlenecks & Blockers
                  </h3>
                  <ul className="space-y-2 text-xs text-foreground/90">
                    {(menteeDetail.mentor_brief.key_blockers ?? []).map((b, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-500 font-bold shrink-0">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Session Focus Areas */}
                <div className="p-4 rounded-lg bg-blue-50/30 border border-blue-200 shadow-2xs space-y-2.5">
                  <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-blue-600" />
                    Recommended Session Focus Areas
                  </h3>
                  <ul className="space-y-2 text-xs text-foreground/90">
                    {(menteeDetail.mentor_brief.focus_areas ?? []).map((f, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Probing Discussion Questions & Growth Priorities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Questions for Mentor */}
                <div className="p-4 rounded-lg bg-card border border-border shadow-2xs space-y-2.5">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-purple-600" />
                    Suggested Discussion Prompts (Urdu / English)
                  </h3>
                  <div className="space-y-2 text-xs text-foreground/90">
                    {(menteeDetail.mentor_brief.recommended_questions ?? []).map((q, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-md bg-muted/40 border border-border/60 italic"
                      >
                        &ldquo;{q}&rdquo;
                      </div>
                    ))}
                  </div>
                </div>

                {/* Immediate Next Priorities */}
                <div className="p-4 rounded-lg bg-card border border-border shadow-2xs space-y-2.5">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Mentee Growth Priorities (Next 1-2 Weeks)
                  </h3>
                  <div className="space-y-2 text-xs text-foreground/90">
                    {(menteeDetail.mentor_brief.growth_priorities ?? []).map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2.5 rounded-md bg-muted/40 border border-border/60"
                      >
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0">
                          {idx + 1}
                        </span>
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Launch Plan Progress Card (PRD §36.14) */}
            <div className="p-6 rounded-xl border border-border bg-card shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-foreground">
                    Launch Plan Execution Progress
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    30-day roadmap milestones generated by Launch Planner agent (F-009)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Status:</span>
                  <StatusBadge status={menteeDetail.plan_status || "in_progress"} />
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">
                    Completed Tasks: {menteeDetail.tasks_completed} of{" "}
                    {menteeDetail.tasks_total}
                  </span>
                  <span className="font-bold text-primary">
                    {menteeDetail.completion_rate}% Completed
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500 rounded-full"
                    style={{ width: `${Math.min(100, menteeDetail.completion_rate ?? 0)}%` }}
                  />
                </div>
              </div>

              {/* Active Tasks List */}
              {menteeDetail.recent_tasks && menteeDetail.recent_tasks.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    Current & Upcoming Milestones
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {menteeDetail.recent_tasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3 rounded-lg border border-border bg-muted/20 flex flex-col justify-between space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-medium text-foreground line-clamp-1">
                            {task.title}
                          </span>
                          <StatusBadge status={task.status} />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                          <span className="capitalize">
                            W{task.week} • {task.category}
                          </span>
                          <span>{task.due_date ? `Due ${formatDate(task.due_date)}` : "No date"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Validation & Content Snapshot Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Validation & Economics */}
              <div className="p-5 rounded-xl border border-border bg-card shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">
                    Market Validation & Offerings
                  </h3>
                  {menteeDetail.validation_confidence && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 capitalize">
                      Confidence: {menteeDetail.validation_confidence}
                    </span>
                  )}
                </div>

                <div className="text-xs space-y-2 text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">Differentiator / Gap: </span>
                    <span>
                      {menteeDetail.competitor_gap ||
                        "Hyper-convenient local delivery & customized craft catalog"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Product Offerings: </span>
                    <span>
                      {menteeDetail.products_count} catalog item
                      {menteeDetail.products_count === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content Engine Stats */}
              <div className="p-5 rounded-xl border border-border bg-card shadow-2xs space-y-3">
                <h3 className="text-sm font-bold text-foreground">
                  Content Marketing Engine
                </h3>
                <div className="text-xs space-y-2 text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>30-Day Content Calendar Items:</span>
                    <span className="font-semibold text-foreground">
                      {menteeDetail.content_items_total ?? 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Published Organic Posts:</span>
                    <span className="font-semibold text-emerald-600">
                      {menteeDetail.content_items_posted ?? 0}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden mt-1">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{
                        width: `${
                          (menteeDetail.content_items_total ?? 0) > 0
                            ? Math.round(
                                ((menteeDetail.content_items_posted ?? 0) /
                                  (menteeDetail.content_items_total || 1)) *
                                  100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Session History with This Mentor */}
            <div className="p-6 rounded-xl border border-border bg-card shadow-2xs space-y-4">
              <h2 className="text-base font-bold text-foreground">
                Session History With You
              </h2>

              {(!menteeDetail.session_history || menteeDetail.session_history.length === 0) ? (
                <p className="text-sm text-muted-foreground">
                  No sessions recorded yet with this mentee.
                </p>
              ) : (
                <div className="space-y-3">
                  {menteeDetail.session_history.map((session) => (
                    <div
                      key={session.id}
                      data-testid={`session-history-item-${session.id}`}
                      className="p-4 rounded-lg border border-border bg-muted/20 space-y-3 text-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-foreground">
                            {session.service_title}
                          </h4>
                          <span className="text-xs text-muted-foreground capitalize">
                            Type: {session.service_type.replace(/_/g, " ")} • {session.duration_min} min
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-bold text-foreground text-xs">
                            {formatPKR(session.amount_pkr)}
                          </span>
                          <StatusBadge status={session.status} />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>
                          Scheduled: {formatDateTime(session.scheduled_at)}
                        </span>
                      </div>

                      {/* Mentee Notes */}
                      {session.notes && (
                        <div className="p-3 rounded-md bg-card border border-border text-xs space-y-1">
                          <span className="font-semibold text-muted-foreground block">
                            Mentee Focus Question / Stated Problem:
                          </span>
                          <p className="italic text-foreground/90">&ldquo;{session.notes}&rdquo;</p>
                        </div>
                      )}

                      {/* Mentor Notes */}
                      {session.session_notes && (
                        <div className="p-3 rounded-md bg-emerald-50/50 border border-emerald-200 text-xs space-y-1">
                          <span className="font-semibold text-emerald-900 block">
                            Your Session Notes:
                          </span>
                          <p className="text-foreground/90">{session.session_notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // View: Mentees List & Overview
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Mentees & Progress Reports
          </h1>
          <p className="text-sm text-muted-foreground">
            Review your booked mentees, inspect their launch roadmaps, and view synthesized session briefs (F-025).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/mentor"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors"
          >
            <Briefcase className="w-3.5 h-3.5 text-primary" />
            Mentor Dashboard
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-border bg-card shadow-2xs space-y-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Total Booked Mentees
          </span>
          <div className="text-2xl font-bold text-foreground">
            {mentees.length}
          </div>
          <span className="text-xs text-muted-foreground">
            Entrepreneurs who have booked your advisory
          </span>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card shadow-2xs space-y-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Tasks Completed Across Mentees
          </span>
          <div className="text-2xl font-bold text-emerald-600">
            {totalTasksCompleted}
          </div>
          <span className="text-xs text-muted-foreground">
            Total 30-day launch milestones verified
          </span>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card shadow-2xs space-y-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Average Execution Rate
          </span>
          <div className="text-2xl font-bold text-primary">
            {avgCompletionPercent}%
          </div>
          <span className="text-xs text-muted-foreground">
            Overall mentee task completion average
          </span>
        </div>
      </div>

      {/* Search / Filter toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search mentees by name, venture, niche, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Error State */}
      {listError && (
        <div className="p-6">
          <ErrorState
            title="Failed to load mentees"
            message={listError}
            onRetry={fetchMentees}
          />
        </div>
      )}

      {/* Loading State */}
      {isLoadingList && (
        <div className="py-12">
          <LoadingState message="Loading your booked mentees..." />
        </div>
      )}

      {/* Empty State */}
      {!isLoadingList && !listError && mentees.length === 0 && (
        <div className="p-8 rounded-xl border border-dashed border-border bg-card text-center">
          <EmptyState
            title="No mentees booked yet"
            description="When entrepreneurs book mentoring sessions with you from your active services catalog, they will appear here along with their business profiles and 30-day launch roadmaps."
          />
        </div>
      )}

      {/* No Search Results */}
      {!isLoadingList &&
        !listError &&
        mentees.length > 0 &&
        filteredMentees.length === 0 && (
          <div className="p-8 rounded-xl border border-border bg-card text-center">
            <p className="text-sm text-muted-foreground">
              No mentees match your search query &ldquo;{searchQuery}&rdquo;.
            </p>
          </div>
        )}

      {/* Mentees Grid */}
      {!isLoadingList && !listError && filteredMentees.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMentees.map((mentee) => {
            const totalTasks = mentee.tasks_total ?? 0;
            const completedTasks = mentee.tasks_completed ?? 0;
            const completion =
              totalTasks > 0
                ? Math.round((completedTasks / totalTasks) * 100)
                : 0;

            return (
              <div
                key={mentee.entrepreneur_id}
                data-testid={`mentee-card-${mentee.entrepreneur_id}`}
                className="p-5 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-foreground text-base">
                        {mentee.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {mentee.email}
                      </p>
                    </div>

                    <StatusBadge status={mentee.latest_booking_status} />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-foreground">
                      {mentee.business_name || "New Venture"}
                    </span>
                    {mentee.business_niche && (
                      <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                        {mentee.business_niche.replace(/_/g, " ")}
                      </span>
                    )}
                    {mentee.business_city && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {mentee.business_city}
                      </span>
                    )}
                  </div>

                  {/* Launch Progress */}
                  <div className="space-y-1.5 pt-2 border-t border-border/60">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Launch Tasks: {mentee.tasks_completed}/{mentee.tasks_total}
                      </span>
                      <span className="font-semibold text-primary">
                        {completion}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, completion)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border text-xs">
                  <span className="text-muted-foreground">
                    {mentee.total_bookings} session
                    {mentee.total_bookings === 1 ? "" : "s"} booked
                  </span>

                  <button
                    type="button"
                    onClick={() => handleSelectMentee(mentee.entrepreneur_id)}
                    className="inline-flex items-center gap-1 text-primary hover:underline font-semibold cursor-pointer"
                  >
                    View Mentee Brief <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
