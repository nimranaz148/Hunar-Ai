"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ClipboardList,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Send,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  FileEdit,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  BusinessService,
  PlanService,
  UpdateTaskStatusRequest,
  type BusinessResponse,
  type Gate1OverviewResponse,
  type PlanTaskResponse,
} from "@/lib/api";
import { formatPKR, formatPercentage, formatDate } from "@/lib/format";

export default function PlanApprovalPage() {
  const [business, setBusiness] = useState<BusinessResponse | null>(null);
  const [gateData, setGateData] = useState<Gate1OverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<number | "all">("all");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Request Changes Modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const biz = await BusinessService.getCurrentUserBusinessApiV1BusinessesGet();
      setBusiness(biz);

      if (biz?.id) {
        const overview = await PlanService.getGate1ApiV1BusinessesBusinessIdPlanGate1Get({
          businessId: biz.id,
        });
        setGateData(overview);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load launch plan overview";
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
      const approvedPlan = await PlanService.approvePlanApiV1BusinessesBusinessIdPlanApprovePost({
        businessId: business.id,
        requestBody: { comments: "Business plan approved by entrepreneur" },
      });

      setGateData((prev) =>
        prev
          ? {
              ...prev,
              plan: approvedPlan,
              gate_status: "approved",
            }
          : null
      );
      setToastMessage("Launch Plan Approved! Your 30-day task roadmap is now active.");
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to approve plan";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id) return;
    if (!rejectReason.trim()) {
      setRejectError("Please enter your feedback to request revisions.");
      return;
    }

    setIsSubmitting(true);
    setRejectError(null);
    try {
      const updatedPlan = await PlanService.rejectPlanApiV1BusinessesBusinessIdPlanRejectPost({
        businessId: business.id,
        requestBody: { reason: rejectReason.trim() },
      });

      setGateData((prev) =>
        prev
          ? {
              ...prev,
              plan: updatedPlan,
              gate_status: "revision_requested",
            }
          : null
      );
      setIsRejectModalOpen(false);
      setRejectReason("");
      setToastMessage("Change request recorded. The planner will adjust your tasks.");
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record changes";
      setRejectError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTaskStatus = async (task: PlanTaskResponse) => {
    if (!business?.id) return;
    const newStatus =
      task.status === "completed"
        ? UpdateTaskStatusRequest.status.PENDING
        : UpdateTaskStatusRequest.status.COMPLETED;
    try {
      const updatedTask = await PlanService.updateTaskApiV1BusinessesBusinessIdPlanTasksTaskIdPatch({
        businessId: business.id,
        taskId: task.id,
        requestBody: { status: newStatus },
      });

      setGateData((prev) => {
        if (!prev) return null;
        const newTasks = (prev.plan.tasks || []).map((t) => (t.id === task.id ? updatedTask : t));
        return {
          ...prev,
          plan: {
            ...prev.plan,
            tasks: newTasks,
          },
        };
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update task";
      setErrorMessage(msg);
    }
  };

  const isApproved = gateData?.gate_status === "approved";
  const tasks = gateData?.plan?.tasks || [];
  const filteredTasks =
    selectedWeek === "all" ? tasks : tasks.filter((t) => t.week === selectedWeek);

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <AppShell
      role="entrepreneur"
      userName={business?.name || "Entrepreneur"}
      pageTitle="Plan Approval Gate (F-008 - Human Gate 1)"
      actions={
        business && (
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={isLoading || isSubmitting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] text-xs font-medium hover:bg-[var(--color-surface-sunken)] transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
            {!isApproved && (
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[var(--radius-sm)] bg-[var(--color-status-success-bg)] text-[var(--color-status-success-fg)] border border-[var(--color-status-success-border)] text-xs font-semibold hover:opacity-90 transition-opacity shadow-xs"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve Plan</span>
              </button>
            )}
          </div>
        )
      }
    >
      <div className="space-y-6 max-w-5xl mx-auto pb-16">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between text-xs text-[var(--color-fg-muted)]">
          <div className="flex items-center gap-2">
            <Link href="/pricing" className="hover:text-[var(--color-accent)] transition-colors">
              Unit Pricing
            </Link>
            <span>/</span>
            <span className="text-[var(--color-fg)] font-medium">Plan Approval Gate (F-008)</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/validation"
              className="hover:text-[var(--color-accent)] transition-colors"
            >
              View Validation Report →
            </Link>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-status-success-bg)] text-[var(--color-status-success-fg)] border border-[var(--color-status-success-border)] text-sm flex items-center gap-2.5 shadow-xs">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <ErrorState message={errorMessage} onRetry={loadData} />
        )}

        {isLoading ? (
          <LoadingState message="Assembling your complete business launch plan and unit economics..." />
        ) : !business ? (
          <EmptyState
            title="No business profile found"
            description="Complete onboarding chat to configure your business foundation."
            action={
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] text-sm font-medium"
              >
                Start Onboarding
              </Link>
            }
          />
        ) : !gateData ? (
          <EmptyState
            title="Plan not generated yet"
            description="Trigger the launch planner to generate your 30-day roadmap."
            action={
              <button
                onClick={loadData}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] text-sm font-medium"
              >
                Generate Plan
              </button>
            }
          />
        ) : (
          <>
            {/* Header Gate Status Banner (PRD §30.2 Wireframe) */}
            <div className="p-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-[var(--color-fg)]">
                    Your Business Plan
                  </h1>
                  {isApproved ? (
                    <StatusBadge status="success" label="Approved & Active" />
                  ) : gateData.gate_status === "revision_requested" ? (
                    <StatusBadge status="warning" label="Revisions Requested" />
                  ) : (
                    <StatusBadge status="info" label="Pending Your Approval (Human Gate 1)" />
                  )}
                </div>
                <p className="text-xs text-[var(--color-fg-muted)] mt-1.5 max-w-2xl">
                  {gateData.plan.summary ||
                    `30-day comprehensive launch roadmap for ${business.name} across ${business.city}.`}
                </p>
                {gateData.plan.revision_notes && !isApproved && (
                  <div className="mt-3 p-2.5 rounded-[var(--radius-sm)] bg-[var(--color-status-warning-bg)] text-[var(--color-status-warning-fg)] text-xs">
                    <span className="font-semibold">Requested Changes:</span> {gateData.plan.revision_notes}
                  </div>
                )}
              </div>

              {/* Progress metric if approved */}
              {isApproved && (
                <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-[var(--color-border)] pt-3 md:pt-0 md:pl-6">
                  <div>
                    <span className="text-xs text-[var(--color-fg-muted)] block">
                      30-Day Execution Progress
                    </span>
                    <span className="text-xl font-bold text-[var(--color-fg)]">
                      {progressPercent}%
                    </span>
                    <span className="text-xs text-[var(--color-fg-muted)] ml-1.5">
                      ({completedCount}/{tasks.length} tasks)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Wireframe §30.2: Section 1 - VALIDATION REPORT SNAPSHOT */}
            <div className="p-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-2 font-bold text-base text-[var(--color-fg)] uppercase tracking-wider">
                  <TrendingUp className="w-4 h-4 text-[var(--color-accent)]" />
                  <span>Validation Report (PRD §30.2)</span>
                </div>
                <Link
                  href="/validation"
                  className="text-xs font-medium text-[var(--color-accent)] hover:underline flex items-center gap-1"
                >
                  <span>View Full Report</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)]/60">
                  <span className="text-xs font-semibold uppercase text-[var(--color-fg-muted)] block mb-1">
                    Feasibility Confidence
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold capitalize text-[var(--color-fg)]">
                      {gateData.validation_snapshot?.confidence || "Medium"}
                    </span>
                    <StatusBadge
                      status={
                        gateData.validation_snapshot?.confidence === "high"
                          ? "success"
                          : "warning"
                      }
                      label={gateData.validation_snapshot?.confidence === "high" ? "Strong Fit" : "Viable"}
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)]/60">
                  <span className="text-xs font-semibold uppercase text-[var(--color-fg-muted)] block mb-1">
                    Identified Competitors
                  </span>
                  <span className="text-sm font-medium text-[var(--color-fg)] line-clamp-1">
                    {gateData.validation_snapshot?.competitors_summary || "Local ventures analyzed"}
                  </span>
                </div>

                <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)]/60">
                  <span className="text-xs font-semibold uppercase text-[var(--color-fg-muted)] block mb-1">
                    Market Gap We Exploit
                  </span>
                  <span className="text-sm font-medium text-[var(--color-fg)] line-clamp-2">
                    &ldquo;{gateData.validation_snapshot?.key_gap}&rdquo;
                  </span>
                </div>
              </div>
            </div>

            {/* Wireframe §30.2: Section 2 - PRICING SNAPSHOT */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs overflow-hidden">
              <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-base text-[var(--color-fg)] uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-[var(--color-accent)]" />
                  <span>Unit Pricing & Margins (PRD §30.2)</span>
                </div>
                <Link
                  href="/pricing"
                  className="text-xs font-medium text-[var(--color-accent)] hover:underline flex items-center gap-1"
                >
                  <span>Edit Unit Economics</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--color-surface-sunken)] border-b border-[var(--color-border)] text-xs uppercase tracking-wider text-[var(--color-fg-muted)]">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Product</th>
                      <th className="px-4 py-3 font-semibold">Cost</th>
                      <th className="px-4 py-3 font-semibold">Price</th>
                      <th className="px-4 py-3 font-semibold">Margin</th>
                      <th className="px-4 py-3 font-semibold">Break-even</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]/60">
                    {(gateData.pricing_snapshot || []).map((p, idx) => (
                      <tr key={idx} className="hover:bg-[var(--color-surface-sunken)]/40">
                        <td className="px-5 py-3.5 font-medium text-[var(--color-fg)]">
                          {p.product_name}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-[var(--color-fg-muted)]">
                          {formatPKR(Number(p.unit_cost))}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-bold text-[var(--color-fg)]">
                          {formatPKR(Number(p.price))}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <StatusBadge
                            status={Number(p.margin_pct) >= 35 ? "success" : "warning"}
                            label={`${formatPercentage(Number(p.margin_pct))}`}
                          />
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-[var(--color-fg)] font-medium">
                          {p.break_even_units} units/mo
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Wireframe §30.2: Section 3 - LAUNCH PLAN (30 DAYS) CHECKLIST */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
                <div>
                  <h3 className="text-base font-bold text-[var(--color-fg)] uppercase tracking-wider flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-[var(--color-accent)]" />
                    <span>Launch Plan (30 Days) — Actionable Roadmap</span>
                  </h3>
                  <p className="text-xs text-[var(--color-fg-muted)] mt-1">
                    Sequenced week-by-week actions tailored to your startup budget and niche
                  </p>
                </div>

                {/* Week Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    onClick={() => setSelectedWeek("all")}
                    className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                      selectedWeek === "all"
                        ? "bg-[var(--color-accent)] text-[var(--color-fg-inverse)]"
                        : "bg-[var(--color-surface-sunken)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
                    }`}
                  >
                    All Weeks ({tasks.length})
                  </button>
                  {[1, 2, 3, 4].map((w) => (
                    <button
                      key={w}
                      onClick={() => setSelectedWeek(w)}
                      className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                        selectedWeek === w
                          ? "bg-[var(--color-accent)] text-[var(--color-fg-inverse)]"
                          : "bg-[var(--color-surface-sunken)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
                      }`}
                    >
                      Week {w}
                    </button>
                  ))}
                </div>
              </div>

              {/* Task Items Checklist */}
              <div className="space-y-3">
                {filteredTasks.length === 0 ? (
                  <p className="text-xs text-[var(--color-fg-muted)] py-4 text-center">
                    No tasks for this week filter.
                  </p>
                ) : (
                  filteredTasks.map((t) => {
                    const isDone = t.status === "completed";

                    return (
                      <div
                        key={t.id}
                        className={`flex items-start gap-3 p-3.5 rounded-[var(--radius-md)] border transition-all ${
                          isDone
                            ? "bg-[var(--color-surface-sunken)]/60 border-[var(--color-border)]/40 opacity-75"
                            : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-border-focus)] shadow-2xs"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleTaskStatus(t)}
                          disabled={!isApproved}
                          title={isApproved ? "Click to toggle status" : "Approve plan to complete tasks"}
                          className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                            isDone
                              ? "bg-[var(--color-status-success-bg)] text-[var(--color-status-success-fg)] border border-[var(--color-status-success-border)]"
                              : "border border-[var(--color-border)] hover:border-[var(--color-accent)]"
                          }`}
                        >
                          {isDone && <CheckCircle className="w-4 h-4" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-sm font-semibold ${
                                isDone
                                  ? "line-through text-[var(--color-fg-muted)]"
                                  : "text-[var(--color-fg)]"
                              }`}
                            >
                              {t.title}
                            </span>
                            <span className="px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-surface-sunken)] text-[var(--color-fg-muted)] text-[10px] font-semibold uppercase tracking-wider">
                              Week {t.week} · {t.category}
                            </span>
                          </div>

                          {t.description && (
                            <p className="text-xs text-[var(--color-fg-muted)] mt-1 leading-relaxed">
                              {t.description}
                            </p>
                          )}

                          {t.due_date && (
                            <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-fg-muted)] mt-2">
                              <Calendar className="w-3 h-3" />
                              <span>Target: {formatDate(t.due_date)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Wireframe §30.2: HUMAN GATE 1 ACTIONS */}
            {!isApproved && (
              <div className="p-6 rounded-[var(--radius-lg)] border-2 border-[var(--color-accent)]/30 bg-[var(--color-surface)] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-base font-bold text-[var(--color-fg)] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
                    <span>Human Gate 1 Decision Required</span>
                  </h4>
                  <p className="text-xs text-[var(--color-fg-muted)] mt-1">
                    Approving locks in your 30-day curriculum and unlocks Content Calendar generation.
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsRejectModalOpen(true)}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] text-sm font-medium hover:bg-[var(--color-surface-sunken)] disabled:opacity-50 transition-colors"
                  >
                    <FileEdit className="w-4 h-4" />
                    <span>Request Changes</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-xs"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span>Approve Plan</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Request Changes Modal */}
        {isRejectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4 shadow-lg">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
                <h3 className="text-base font-bold text-[var(--color-fg)] flex items-center gap-2">
                  <FileEdit className="w-4 h-4 text-[var(--color-accent)]" />
                  <span>Request Plan Adjustments</span>
                </h3>
                <button
                  onClick={() => setIsRejectModalOpen(false)}
                  className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleReject} className="space-y-4">
                <p className="text-xs text-[var(--color-fg-muted)]">
                  Explain what you would like changed (e.g., lower startup budget, more time for direct WhatsApp outreach, or adjusting delivery timelines):
                </p>

                <div>
                  <textarea
                    rows={4}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Please dedicate more tasks in Week 1 to neighborhood flyers and WhatsApp group outreach..."
                    className="w-full p-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] text-[var(--color-fg)] text-sm focus:outline-none focus:border-[var(--color-border-focus)] resize-none"
                  />
                  {rejectError && (
                    <p className="text-xs text-[var(--color-danger)] mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{rejectError}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRejectModalOpen(false)}
                    className="px-4 py-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-fg)] text-xs font-medium hover:bg-[var(--color-surface-sunken)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] text-xs font-bold hover:opacity-90 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Change Request</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
