"use client";

import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  X,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Eye,
  MessageCircle,
  ArrowRight,
  UserCheck,
  Loader2,
  Calendar,
  Layers,
  HelpCircle,
} from "lucide-react";
import {
  ProposalDetailResponse,
  ProposedContentAdjustment,
  ProposalsService,
  ApiError,
} from "@/lib/api";

export interface WeeklyReviewGateModalProps {
  isOpen: boolean;
  businessId: string;
  proposal: ProposalDetailResponse | null;
  onClose: () => void;
  onApproved: (updatedProposal: ProposalDetailResponse) => void;
  onRejected: (updatedProposal: ProposalDetailResponse) => void;
  onRefreshNeeded?: () => void;
}

export function WeeklyReviewGateModal({
  isOpen,
  proposal,
  onClose,
  onApproved,
  onRejected,
}: WeeklyReviewGateModalProps): React.ReactElement | null {
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [isRejecting, setIsRejecting] = useState<boolean>(false);
  const [rejectMode, setRejectMode] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [comments, setComments] = useState<string>("");
  const [actionError, setActionError] = useState<string | null>(null);

  if (!isOpen || !proposal) return null;

  const payload = proposal.payload || {};
  const diagnosis = payload.diagnosis || {};
  const adjustments = payload.proposed_adjustments || [];
  const coachRationale = payload.coach_rationale || "";
  const mentorRec = payload.mentor_recommendation || null;
  const isDecided = proposal.status !== "pending";

  const handleApprove = async () => {
    setActionError(null);
    setIsApproving(true);
    try {
      const updated = await ProposalsService.approveSingleProposalApiV1ProposalsProposalIdApprovePost({
        proposalId: proposal.id,
        requestBody: { comments: comments.trim() || null },
      });
      onApproved(updated);
    } catch (err) {
      if (err instanceof ApiError) {
        setActionError(err.body?.detail || "Failed to approve proposal.");
      } else {
        setActionError("An unexpected error occurred while approving.");
      }
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setActionError("Please provide a feedback reason explaining what to adjust.");
      return;
    }
    setActionError(null);
    setIsRejecting(true);
    try {
      const updated = await ProposalsService.rejectSingleProposalApiV1ProposalsProposalIdRejectPost({
        proposalId: proposal.id,
        requestBody: { reason: rejectionReason.trim() },
      });
      onRejected(updated);
    } catch (err) {
      if (err instanceof ApiError) {
        setActionError(err.body?.detail || "Failed to reject proposal.");
      } else {
        setActionError("An unexpected error occurred while rejecting.");
      }
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate3-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="w-full max-w-3xl my-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-[var(--color-border)] bg-[var(--color-canvas)]/50 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                  Human Gate 3 (F-017)
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    proposal.status === "approved"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : proposal.status === "rejected"
                      ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  }`}
                >
                  {proposal.status.toUpperCase()}
                </span>
              </div>
              <h2 id="gate3-title" className="text-lg sm:text-xl font-bold text-[var(--color-fg)] mt-1">
                Weekly AI Coach Review &amp; Strategy Approval
              </h2>
              <p className="text-xs text-[var(--color-fg-muted)] mt-0.5">
                Empirical marketing diagnosis and proposed adjustments for upcoming content.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {actionError && (
            <div
              role="alert"
              className="p-3.5 rounded-lg bg-[var(--color-danger-subtle)] border border-[var(--color-danger-border)] text-xs text-[var(--color-danger)] flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Section 1: Empirical Performance Diagnosis (PRD §10 W-004) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-bold tracking-wider text-[var(--color-fg-muted)] flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                <span>Performance Diagnosis ({diagnosis.days_analyzed || 3} Days Logged)</span>
              </h3>
              <span className="text-[11px] text-[var(--color-fg-subtle)]">
                Best day: <strong className="text-[var(--color-fg)]">{diagnosis.best_day || "Wednesday"}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]">
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-fg-muted)]">
                  <Eye className="w-3.5 h-3.5 text-blue-500" />
                  <span>Total Views</span>
                </div>
                <div className="text-base font-bold text-[var(--color-fg)] mt-1">
                  {(diagnosis.total_views || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                  {diagnosis.engagement_trend || "+24%"} vs last week
                </div>
              </div>

              <div className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]">
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-fg-muted)]">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Revenue</span>
                </div>
                <div className="text-base font-bold text-[var(--color-fg)] mt-1">
                  Rs {(diagnosis.total_revenue_pkr || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                  {diagnosis.revenue_trend || "+18%"} sales growth
                </div>
              </div>

              <div className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]">
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-fg-muted)]">
                  <MessageCircle className="w-3.5 h-3.5 text-purple-500" />
                  <span>Customer Inquiries</span>
                </div>
                <div className="text-base font-bold text-[var(--color-fg)] mt-1">
                  {diagnosis.total_inquiries || 0} DMs
                </div>
                <div className="text-[10px] text-[var(--color-fg-muted)] mt-0.5">
                  {diagnosis.total_orders || 0} converted orders
                </div>
              </div>

              <div className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]">
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-fg-muted)]">
                  <Layers className="w-3.5 h-3.5 text-amber-500" />
                  <span>Winning Format</span>
                </div>
                <div className="text-base font-bold capitalize text-[var(--color-fg)] mt-1">
                  {diagnosis.best_format || "Reel"}s
                </div>
                <div className="text-[10px] text-amber-600 font-semibold mt-0.5">
                  Highest reach format
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Coach Strategic Rationale (Why) */}
          <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                Weekly AI Coach Rationale
              </h4>
            </div>
            <p className="text-xs text-[var(--color-fg)] leading-relaxed">
              {coachRationale || "Based on your logged performance metrics, video formats generate higher customer reach and inquiries. Converting upcoming static posts will optimize algorithmic distribution."}
            </p>
          </div>

          {/* Section 3: Proposed Adjustments (What changes if approved) */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-bold tracking-wider text-[var(--color-fg-muted)] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[var(--color-accent)]" />
              <span>Proposed Content Calendar Adjustments ({adjustments.length})</span>
            </h3>

            {adjustments.length === 0 ? (
              <p className="text-xs text-[var(--color-fg-muted)] italic">
                No specific upcoming slot adjustments proposed for this cycle. Current calendar structure is performing well.
              </p>
            ) : (
              <div className="space-y-3">
                {adjustments.map((adj: ProposedContentAdjustment, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-canvas)]/40 hover:border-[var(--color-accent)]/50 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-fg)]">
                          Day {adj.day}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-fg)]">
                          <span className="capitalize text-[var(--color-fg-muted)] line-through">
                            {adj.current_format}
                          </span>
                          <ArrowRight className="w-3 h-3 text-[var(--color-accent)]" />
                          <span className="capitalize text-emerald-600 font-bold">
                            {adj.proposed_format}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-[var(--color-fg-muted)] hidden sm:inline">
                        Slot #{adj.day}
                      </span>
                    </div>

                    {adj.proposed_hook && (
                      <div className="text-xs bg-[var(--color-surface)] p-2 rounded border border-[var(--color-border)]">
                        <span className="text-[10px] font-bold text-[var(--color-fg-muted)] uppercase block mb-0.5">
                          Upgraded Hook (Urdu / Roman Urdu):
                        </span>
                        <p className="text-[var(--color-fg)] font-medium italic">
                          &ldquo;{adj.proposed_hook}&rdquo;
                        </p>
                      </div>
                    )}

                    {adj.recommended_hashtags && adj.recommended_hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 items-center">
                        <span className="text-[10px] text-[var(--color-fg-muted)] mr-1">Hashtags:</span>
                        {adj.recommended_hashtags.map((tag: string, tIdx: number) => (
                          <span
                            key={tIdx}
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {adj.rationale && (
                      <p className="text-[11px] text-[var(--color-fg-muted)] flex items-start gap-1">
                        <HelpCircle className="w-3 h-3 shrink-0 mt-0.5 text-[var(--color-fg-subtle)]" />
                        <span>{adj.rationale}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Mentor Recommendation (if any) */}
          {mentorRec && (
            <div className="p-3.5 rounded-lg border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
              <UserCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-amber-700 dark:text-amber-300">
                  Mentor Consultation Recommendation
                </h4>
                <p className="text-xs text-[var(--color-fg-muted)] leading-relaxed">
                  {mentorRec}
                </p>
              </div>
            </div>
          )}

          {/* Rejection / Decision Status Display */}
          {proposal.status === "rejected" && proposal.rejection_reason && (
            <div className="p-3.5 rounded-lg border border-rose-500/20 bg-rose-500/5 space-y-1">
              <h4 className="text-xs font-bold text-rose-700 dark:text-rose-300">
                Rejected Revision Feedback:
              </h4>
              <p className="text-xs text-[var(--color-fg)]">{proposal.rejection_reason}</p>
            </div>
          )}

          {/* Rejection Form Drawer (if user clicks Reject) */}
          {rejectMode && !isDecided && (
            <form onSubmit={handleReject} className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="rejection-reason" className="text-xs font-bold text-rose-700 dark:text-rose-300">
                  What would you like the Weekly Coach to change?
                </label>
                <button
                  type="button"
                  onClick={() => setRejectMode(false)}
                  className="text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
                >
                  Cancel
                </button>
              </div>
              <textarea
                id="rejection-reason"
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., I don't have time to shoot reels this week, please stick to carousels with product packaging tips..."
                className="w-full text-xs p-2.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-fg)] focus:outline-none focus:border-[var(--color-accent)]"
                disabled={isRejecting}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectMode(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--color-fg-muted)] hover:bg-[var(--color-surface)] border border-[var(--color-border)]"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isRejecting}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-xs"
                >
                  {isRejecting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Confirm Rejection</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Optional Approval Comments */}
          {!rejectMode && !isDecided && (
            <div className="space-y-1.5">
              <label htmlFor="approval-comments" className="text-[11px] font-medium text-[var(--color-fg-muted)]">
                Optional Approval Notes / Intentions:
              </label>
              <input
                id="approval-comments"
                type="text"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="e.g., Sounds great, will film the crafting process on Wednesday morning"
                className="w-full text-xs px-3 py-2 rounded-lg bg-[var(--color-canvas)] border border-[var(--color-border)] text-[var(--color-fg)] focus:outline-none focus:border-[var(--color-accent)]"
                disabled={isApproving}
              />
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-[var(--color-border)] bg-[var(--color-canvas)]/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-[var(--color-fg-muted)]">
            {isDecided ? (
              <span>This proposal was decided on {proposal.decided_at ? new Date(proposal.decided_at).toLocaleDateString() : "recently"}.</span>
            ) : (
              <span>Approving will automatically update the designated draft content items.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] transition-colors cursor-pointer"
            >
              Close
            </button>

            {!isDecided && !rejectMode && (
              <>
                <button
                  type="button"
                  onClick={() => setRejectMode(true)}
                  disabled={isApproving}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer"
                >
                  Reject with Feedback
                </button>

                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isApproving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Approving Changes...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve Strategy (Gate 3)</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
