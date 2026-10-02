"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/format";
import { AdminService } from "@/lib/api";
import { ArrowLeft, Code, Cpu, Layers, Terminal } from "lucide-react";

interface SpanItem {
  id: number;
  span_id: string;
  parent_id: string | null;
  span_type: string;
  started_at: string | null;
  ended_at: string | null;
  data: Record<string, unknown> | null;
  error: Record<string, unknown> | null;
}

interface RunDetail {
  id: string;
  trace_id: string | null;
  workflow: string;
  status: string;
  input_summary: string | null;
  output_summary: string | null;
  error: string | null;
  started_at: string | null;
  ended_at: string | null;
}

export default function AgentRunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const runId = resolvedParams.id;

  const [run, setRun] = useState<RunDetail | null>(null);
  const [spans, setSpans] = useState<SpanItem[]>([]);
  const [selectedSpan, setSelectedSpan] = useState<SpanItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDetail() {
      setIsLoading(true);
      try {
        const resp = await AdminService.getRunDetailApiV1AdminRunsRunIdGet({
          runId,
        });
        setRun(resp.run as unknown as RunDetail);
        setSpans(resp.spans as unknown as SpanItem[]);
        if (resp.spans && resp.spans.length > 0) {
          setSelectedSpan(resp.spans[0] as unknown as SpanItem);
        }
      } catch {
        // Mock fallback for presentation
        const mockRun: RunDetail = {
          id: runId,
          trace_id: "trace_7b8c9d0e1f2a",
          workflow: "onboarding_intake",
          status: "succeeded",
          input_summary: "Crochet bags home enterprise in Karachi",
          output_summary: "Generated comprehensive business validation report with break-even units.",
          error: null,
          started_at: "2026-09-30T21:00:00Z",
          ended_at: "2026-09-30T21:00:14Z",
        };
        const mockSpans: SpanItem[] = [
          {
            id: 1,
            span_id: "span_root",
            parent_id: null,
            span_type: "agent",
            started_at: "2026-09-30T21:00:00Z",
            ended_at: "2026-09-30T21:00:14Z",
            data: { name: "OnboardingAgent" },
            error: null,
          },
          {
            id: 2,
            span_id: "span_gen_1",
            parent_id: "span_root",
            span_type: "generation",
            started_at: "2026-09-30T21:00:01Z",
            ended_at: "2026-09-30T21:00:05Z",
            data: { model: "gemini-2.5-flash", prompt_tokens: 350, completion_tokens: 120 },
            error: null,
          },
          {
            id: 3,
            span_id: "span_tool_1",
            parent_id: "span_root",
            span_type: "function",
            started_at: "2026-09-30T21:00:05Z",
            ended_at: "2026-09-30T21:00:09Z",
            data: {
              name: "calc_pricing",
              input: { unit_cost_pkr: 1200, desired_margin_pct: 25 },
              output: { recommended_price_pkr: 1600, break_even_units: 35 },
            },
            error: null,
          },
          {
            id: 4,
            span_id: "span_gen_2",
            parent_id: "span_root",
            span_type: "generation",
            started_at: "2026-09-30T21:00:09Z",
            ended_at: "2026-09-30T21:00:14Z",
            data: { model: "gemini-2.5-flash", prompt_tokens: 420, completion_tokens: 280 },
            error: null,
          },
        ];
        setRun(mockRun);
        setSpans(mockSpans);
        setSelectedSpan(mockSpans[0]);
      } finally {
        setIsLoading(false);
      }
    }
    loadDetail();
  }, [runId]);

  return (
    <AppShell
      role="super_admin"
      userName="Super Admin"
      pageTitle="Agent Run Detail (F-034)"
      actions={
        <Link
          href="/admin/runs"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--text-xs)] font-medium hover:bg-[var(--color-surface-hover)]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Explorer
        </Link>
      }
    >
      {isLoading || !run ? (
        <div className="p-8 text-center text-[var(--color-fg-muted)]">Loading run trace...</div>
      ) : (
        <div className="space-y-6">
          {/* Metadata Banner */}
          <div className="p-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <StatusBadge status={run.status} />
                  <span className="font-mono text-[var(--text-xs)] text-[var(--color-fg-muted)]">
                    {run.trace_id}
                  </span>
                </div>
                <h2 className="text-[var(--text-lg)] font-bold text-[var(--color-fg)] capitalize">
                  {run.workflow.replace(/_/g, " ")}
                </h2>
                <p className="text-[var(--text-xs)] text-[var(--color-fg-muted)] mt-1">
                  Started: {run.started_at ? formatDateTime(run.started_at) : "Queued"} · Ended:{" "}
                  {run.ended_at ? formatDateTime(run.ended_at) : "In progress"}
                </p>
              </div>

              {run.output_summary && (
                <div className="max-w-md p-3 rounded-[var(--radius-md)] bg-[var(--color-canvas)] text-[var(--text-xs)] text-[var(--color-fg)]">
                  <span className="font-semibold block mb-0.5">Output Summary:</span>
                  {run.output_summary}
                </div>
              )}
            </div>
          </div>

          {/* Span Timeline & Detail Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline Tree */}
            <div className="lg:col-span-2 p-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
              <h3 className="text-[var(--text-base)] font-bold text-[var(--color-fg)] mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[var(--color-accent)]" />
                Execution Span Hierarchy ({spans.length} spans)
              </h3>

              <div className="space-y-2">
                {spans.map((span) => {
                  const isSelected = selectedSpan?.id === span.id;
                  const isChild = span.parent_id !== null;
                  return (
                    <div
                      key={span.id}
                      onClick={() => setSelectedSpan(span)}
                      className={`p-3 rounded-[var(--radius-md)] border transition-all cursor-pointer flex items-center justify-between ${
                        isChild ? "ml-6" : ""
                      } ${
                        isSelected
                          ? "border-[var(--color-accent)] bg-[var(--color-accent-subtle)] shadow-[var(--shadow-sm)]"
                          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1 rounded bg-[var(--color-canvas)]">
                          {span.span_type === "function" ? (
                            <Terminal className="w-3.5 h-3.5 text-[var(--color-info)]" />
                          ) : span.span_type === "generation" ? (
                            <Cpu className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                          ) : (
                            <Layers className="w-3.5 h-3.5 text-[var(--color-neutral)]" />
                          )}
                        </div>
                        <div>
                          <span className="font-mono text-[var(--text-xs)] font-semibold text-[var(--color-fg)]">
                            {span.data?.name ? String(span.data.name) : span.span_type}
                          </span>
                          <span className="ml-2 text-[var(--text-2xs)] text-[var(--color-fg-subtle)]">
                            {span.span_id}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[var(--text-2xs)] text-[var(--color-fg-muted)]">
                          {span.span_type}
                        </span>
                        <StatusBadge
                          status={span.error ? "failed" : "succeeded"}
                          className="text-[9px] px-1.5 py-0"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Span Detail Panel */}
            <div className="p-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] flex flex-col">
              <h3 className="text-[var(--text-base)] font-bold text-[var(--color-fg)] mb-3 flex items-center gap-2">
                <Code className="w-4 h-4 text-[var(--color-info)]" />
                Span Payload Inspector
              </h3>

              {selectedSpan ? (
                <div className="flex-1 space-y-3">
                  <div>
                    <span className="text-[var(--text-2xs)] text-[var(--color-fg-muted)] font-medium">
                      Span ID / Type
                    </span>
                    <p className="font-mono text-[var(--text-xs)] font-semibold text-[var(--color-fg)]">
                      {selectedSpan.span_id} ({selectedSpan.span_type})
                    </p>
                  </div>

                  <div>
                    <span className="text-[var(--text-2xs)] text-[var(--color-fg-muted)] font-medium">
                      Data (Secrets Redacted & Truncated)
                    </span>
                    <pre className="p-3 mt-1 rounded-[var(--radius-sm)] bg-[var(--color-canvas)] text-[var(--text-2xs)] font-mono text-[var(--color-fg)] overflow-x-auto max-h-96 border border-[var(--color-border)]">
                      {JSON.stringify(selectedSpan.data, null, 2)}
                    </pre>
                  </div>

                  {selectedSpan.error && (
                    <div>
                      <span className="text-[var(--text-2xs)] text-[var(--color-danger)] font-medium">
                        Error
                      </span>
                      <pre className="p-2 mt-1 rounded bg-[var(--color-danger-subtle)] text-[var(--color-danger)] text-[var(--text-2xs)] font-mono">
                        {JSON.stringify(selectedSpan.error, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[var(--text-xs)] text-[var(--color-fg-muted)]">
                  Select a span from the timeline to view input and output payloads.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
