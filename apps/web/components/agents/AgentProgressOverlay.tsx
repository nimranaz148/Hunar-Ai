"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Bot,
  CheckCircle2,
  Loader2,
  Circle,
  XCircle,
  X,
  Minimize2,
  Maximize2,
  AlertTriangle,
} from "lucide-react";
import {
  AgentsService,
  OpenAPI,
  type AgentProgressEvent,
  type AgentProgressStep,
} from "@/lib/api";

export interface AgentProgressOverlayProps {
  runId: string | null;
  workflowName?: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (event: AgentProgressEvent) => void;
  onCancelled?: () => void;
}

export function AgentProgressOverlay({
  runId,
  workflowName = "content calendar",
  isOpen,
  onClose,
  onComplete,
  onCancelled,
}: AgentProgressOverlayProps) {
  const [eventData, setEventData] = useState<AgentProgressEvent | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  const handleCancel = useCallback(async () => {
    if (!runId || isCancelling) return;
    setIsCancelling(true);
    try {
      await AgentsService.cancelRunApiV1AgentsRunsRunIdCancelPost({ runId });
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      onCancelled?.();
    } catch {
      setStreamError("Failed to cancel agent run.");
    } finally {
      setIsCancelling(false);
    }
  }, [runId, isCancelling, onCancelled]);

  useEffect(() => {
    if (!isOpen || !runId) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    let isMounted = true;
    const baseApi =
      typeof OpenAPI !== "undefined" && OpenAPI?.BASE
        ? OpenAPI.BASE
        : "http://localhost:8000";
    const sseUrl = `${baseApi}/api/v1/agents/runs/${runId}/stream`;

    // Support both EventSource and polling fallback
    if (typeof EventSource !== "undefined") {
      const es = new EventSource(sseUrl, { withCredentials: true });
      eventSourceRef.current = es;

      es.onmessage = (msg) => {
        if (!isMounted) return;
        try {
          const parsed = JSON.parse(msg.data) as AgentProgressEvent;
          setEventData(parsed);

          if (parsed.status === "succeeded") {
            es.close();
            onComplete?.(parsed);
          } else if (parsed.status === "failed" || parsed.status === "blocked") {
            es.close();
            if (parsed.error) {
              setStreamError(parsed.error);
            }
          }
        } catch {
          // Ignore heartbeats or non-json keep-alives
        }
      };

      es.onerror = () => {
        if (!isMounted) return;
        // Attempt single polling fallback on SSE disconnect
        AgentsService.getRunProgressApiV1AgentsRunsRunIdGet({ runId })
          .then((progress) => {
            if (isMounted) {
              setEventData(progress);
              if (progress.status === "succeeded") {
                es.close();
                onComplete?.(progress);
              }
            }
          })
          .catch(() => {
            if (isMounted) {
              setStreamError("Connection lost to agent stream.");
            }
          });
      };
    } else {
      // Polling fallback when EventSource is unavailable (e.g. testing environments)
      Promise.resolve().then(() => {
        if (!isMounted) return;
        AgentsService.getRunProgressApiV1AgentsRunsRunIdGet({ runId })
          .then((progress) => {
            if (isMounted) {
              setEventData(progress);
              if (progress.status === "succeeded") {
                onComplete?.(progress);
              }
            }
          })
          .catch(() => {
            if (isMounted) {
              setStreamError("Could not retrieve agent progress.");
            }
          });
      });
    }

    return () => {
      isMounted = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [isOpen, runId, onComplete]);

  if (!isOpen || !runId) return null;

  const steps: AgentProgressStep[] = eventData?.steps || [];
  const status = eventData?.status || "running";
  const completedCount = steps.filter((s) => s.status === "completed").length;
  const totalCount = steps.length || 1;

  // Minimized floating pill (PRD: dismiss to background)
  if (isMinimized) {
    return (
      <div
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[var(--color-surface-raised)] border border-[var(--color-border)] shadow-[var(--shadow-lg)] rounded-full px-4 py-2 text-sm"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2">
          {status === "running" ? (
            <Loader2 className="w-4 h-4 text-[var(--color-accent)] animate-spin" />
          ) : status === "succeeded" ? (
            <CheckCircle2 className="w-4 h-4 text-[var(--color-status-success)]" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-[var(--color-status-danger)]" />
          )}
          <span className="font-medium text-[var(--color-fg)]">
            {status === "succeeded"
              ? `${workflowName} complete`
              : status === "failed"
              ? "Agent run cancelled"
              : `Generating ${workflowName}... (${completedCount}/${totalCount})`}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="p-1 hover:bg-[var(--color-surface-sunken)] rounded-full text-[var(--color-fg-muted)] transition-colors"
          title="Expand overlay"
          aria-label="Expand progress overlay"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-label="Agent execution progress"
      aria-modal="true"
    >
      <div className="w-full max-w-lg bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-t-2xl sm:rounded-2xl shadow-[var(--shadow-xl)] overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface-sunken)]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-fg)]">
                {status === "succeeded"
                  ? "Generation Complete"
                  : status === "failed"
                  ? "Agent Run Stopped"
                  : `Generating your ${workflowName}...`}
              </h2>
              <p className="text-xs text-[var(--color-fg-muted)]">
                {status === "running" && `Step ${completedCount + 1} of ${totalCount}`}
                {status === "succeeded" && "All tasks finished successfully"}
                {status === "failed" && (eventData?.error || "Workflow stopped")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="p-1.5 text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface)] rounded-md transition-colors"
              title="Dismiss to background"
              aria-label="Dismiss to background"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface)] rounded-md transition-colors"
              title="Close overlay"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Step List (PRD §653-666) */}
        <div className="p-5 overflow-y-auto space-y-3.5 flex-1" role="list">
          {streamError && (
            <div className="p-3 rounded-lg bg-[var(--color-status-danger-subtle)] border border-[var(--color-status-danger)]/20 text-xs text-[var(--color-status-danger)] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{streamError}</span>
            </div>
          )}

          {steps.map((step, idx) => {
            const isCompleted = step.status === "completed";
            const isInProgress = step.status === "in_progress";
            const isFailed = step.status === "failed";

            return (
              <div
                key={idx}
                role="listitem"
                className={`flex items-start gap-3 text-sm transition-all duration-150 ${
                  isCompleted
                    ? "text-[var(--color-fg)]"
                    : isInProgress
                    ? "text-[var(--color-fg)] font-medium"
                    : isFailed
                    ? "text-[var(--color-status-danger)] font-medium"
                    : "text-[var(--color-fg-muted)] opacity-60"
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isCompleted && (
                    <CheckCircle2 className="w-4 h-4 text-[var(--color-status-success)]" />
                  )}
                  {isInProgress && (
                    <Loader2 className="w-4 h-4 text-[var(--color-accent)] animate-spin" />
                  )}
                  {isFailed && (
                    <XCircle className="w-4 h-4 text-[var(--color-status-danger)]" />
                  )}
                  {!isCompleted && !isInProgress && !isFailed && (
                    <Circle className="w-4 h-4 text-[var(--color-border)]" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>{step.name}</span>
                    {step.detail && (
                      <span className="text-xs text-[var(--color-fg-muted)] font-normal">
                        ({step.detail})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-[var(--color-border)] bg-[var(--color-surface-sunken)] flex items-center justify-between gap-3">
          <div className="text-xs text-[var(--color-fg-muted)]">
            {status === "running" && (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
                Live agent stream
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {status === "running" && (
              <>
                <button
                  type="button"
                  onClick={() => setIsMinimized(true)}
                  className="px-3 py-1.5 text-xs font-medium border border-[var(--color-border)] rounded-md hover:bg-[var(--color-surface)] text-[var(--color-fg)] transition-colors"
                >
                  Dismiss to background
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="px-3 py-1.5 text-xs font-medium border border-[var(--color-status-danger)]/40 text-[var(--color-status-danger)] hover:bg-[var(--color-status-danger-subtle)] rounded-md transition-colors disabled:opacity-50"
                >
                  {isCancelling ? "Cancelling..." : "Cancel Run"}
                </button>
              </>
            )}
            {status === "succeeded" && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-medium bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-accent-fg)] rounded-md transition-colors shadow-xs"
              >
                View Results
              </button>
            )}
            {status === "failed" && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-medium border border-[var(--color-border)] rounded-md hover:bg-[var(--color-surface)] text-[var(--color-fg)] transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
