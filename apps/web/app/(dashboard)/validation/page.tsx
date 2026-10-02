"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  TrendingUp,
  Target,
  Users,
  ExternalLink,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Coins,
  Lightbulb,
  CheckCircle2,
  Briefcase,
  HelpCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  BusinessService,
  ValidationService,
  type BusinessResponse,
  type ValidationReportResponse,
  type CompetitorItem,
} from "@/lib/api";

export default function ValidationPage() {
  const [business, setBusiness] = useState<BusinessResponse | null>(null);
  const [report, setReport] = useState<ValidationReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const biz = await BusinessService.getCurrentUserBusinessApiV1BusinessesGet();
      setBusiness(biz);

      try {
        const valReport =
          await ValidationService.getReportApiV1BusinessesBusinessIdValidationGet({
            businessId: biz.id,
          });
        setReport(valReport);
      } catch (err: unknown) {
        const errorObj = err as { status?: number };
        if (errorObj?.status === 404) {
          // Report not yet generated; user can trigger it
          setReport(null);
        } else {
          throw err;
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load validation report";
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

  const handleGenerate = async (force: boolean = false) => {
    if (!business) return;
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const newReport =
        await ValidationService.generateReportApiV1BusinessesBusinessIdValidationGeneratePost({
          businessId: business.id,
          requestBody: { force_refresh: force },
        });
      setReport(newReport);
      setToastMessage(
        force
          ? "Validation analysis refreshed with fresh competitor data!"
          : "Market validation analysis completed successfully!"
      );
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate validation report";
      setErrorMessage(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const getConfidenceBadge = (confidence?: string | null) => {
    switch (confidence) {
      case "high":
        return <StatusBadge status="success" label="High Feasibility" />;
      case "medium":
        return <StatusBadge status="warning" label="Moderate Feasibility" />;
      default:
        return <StatusBadge status="neutral" label="Low Feasibility" />;
    }
  };

  return (
    <AppShell
      role="entrepreneur"
      userName={business?.name || "Entrepreneur"}
      pageTitle="Market Validation Report (F-006)"
      actions={
        business && (
          <button
            onClick={() => handleGenerate(true)}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] text-[var(--text-xs)] font-medium hover:bg-[var(--color-surface-sunken)] disabled:opacity-50 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
            <span>{isGenerating ? "Analyzing Market..." : "Re-run Analysis"}</span>
          </button>
        )
      }
    >
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between text-[var(--text-xs)] text-[var(--color-fg-muted)]">
          <div className="flex items-center gap-2">
            <Link
              href="/business"
              className="hover:text-[var(--color-fg)] flex items-center gap-1.5 transition-colors"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Business Profile</span>
            </Link>
            <span>/</span>
            <span className="font-medium text-[var(--color-fg)]">Validation Report (F-006)</span>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-[var(--color-accent)] hover:underline"
          >
            <span>Manage Products</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div
            role="status"
            className="flex items-center gap-3 p-4 rounded-[var(--radius-md)] bg-[var(--color-status-success-bg)] text-[var(--color-status-success-fg)] border border-[var(--color-status-success-border)] text-[var(--text-sm)] shadow-sm animate-in fade-in"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Global Loading / Error State */}
        {isLoading && <LoadingState message="Fetching market validation data..." />}
        {errorMessage && !isLoading && (
          <ErrorState message={errorMessage} onRetry={loadData} />
        )}

        {/* Generating Indicator Overlay */}
        {isGenerating && (
          <div className="p-8 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] text-center space-y-4 shadow-sm animate-pulse">
            <div className="inline-flex p-3 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
              <Sparkles className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <h3 className="text-[var(--text-base)] font-bold text-[var(--color-fg)]">
                Idea Validator Agent is at work...
              </h3>
              <p className="text-[var(--text-xs)] text-[var(--color-fg-muted)] max-w-md mx-auto mt-1">
                Scanning competitor benchmarks in {business?.city || "your city"}, analyzing
                pricing margins, and formulating positioning advice for {business?.name || "your venture"}.
              </p>
            </div>
          </div>
        )}

        {/* If no report exists yet and not generating */}
        {!isLoading && !report && !isGenerating && !errorMessage && (
          <EmptyState
            icon={<ShieldCheck className="w-12 h-12 text-[var(--color-accent)]" />}
            title="Market Validation Report Not Generated"
            description="Run our Idea Validator AI Agent to analyze your local demand in Pakistan, uncover competitor weaknesses, and confirm your profit potential."
            action={
              <button
                onClick={() => handleGenerate(false)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-accent-hover)] transition-colors shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>Run Idea Validation Analysis</span>
              </button>
            }
          />
        )}

        {/* Report Content */}
        {!isLoading && report && !isGenerating && (
          <div className="space-y-6">
            {/* Executive Summary Card */}
            <div className="p-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-[var(--text-xl)] font-bold text-[var(--color-fg)]">
                      {business?.name}
                    </h2>
                    {getConfidenceBadge(report.confidence)}
                  </div>
                  <p className="text-[var(--text-xs)] text-[var(--color-fg-muted)] mt-1">
                    Niche: <span className="capitalize font-medium text-[var(--color-fg)]">{business?.niche}</span> · Location: <span className="capitalize font-medium text-[var(--color-fg)]">{business?.city}</span> {business?.area ? `(${business.area})` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-[var(--text-xs)] text-[var(--color-fg-muted)] block">
                      Target Audience
                    </span>
                    <span className="text-[var(--text-xs)] font-medium text-[var(--color-fg)] line-clamp-1 max-w-xs">
                      {business?.target_customer || "Local residential & online consumers"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Demand & Pricing KPI Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)]/60">
                  <div className="flex items-center gap-2 text-[var(--text-xs)] font-semibold uppercase tracking-wider text-[var(--color-fg-muted)] mb-1.5">
                    <TrendingUp className="w-4 h-4 text-[var(--color-status-success-fg)]" />
                    <span>Market Demand Assessment</span>
                  </div>
                  <p className="text-[var(--text-sm)] text-[var(--color-fg)] leading-relaxed">
                    {report.demand_summary}
                  </p>
                </div>

                <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)]/60">
                  <div className="flex items-center gap-2 text-[var(--text-xs)] font-semibold uppercase tracking-wider text-[var(--color-fg-muted)] mb-1.5">
                    <Coins className="w-4 h-4 text-[var(--color-accent)]" />
                    <span>Pricing & Margin Benchmark</span>
                  </div>
                  <p className="text-[var(--text-sm)] text-[var(--color-fg)] leading-relaxed">
                    {report.pricing_insight}
                  </p>
                </div>
              </div>
            </div>

            {/* Strategic Differentiation Checklist */}
            <div className="p-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
              <div className="flex items-center gap-2 text-[var(--text-base)] font-bold text-[var(--color-fg)] mb-2">
                <Lightbulb className="w-5 h-5 text-[var(--color-accent)]" />
                <span>How to Stand Out & Win Customers (PRD §36.12)</span>
              </div>
              <p className="text-[var(--text-xs)] text-[var(--color-fg-muted)] mb-4">
                Recommended strategic levers tailored to exploit competitor vulnerabilities in your area:
              </p>

              <div className="space-y-2.5">
                {(report.how_to_be_better || []).map((advice, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-[var(--radius-sm)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)]/50"
                  >
                    <div className="w-5 h-5 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-bold text-[var(--text-xs)] flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <span className="text-[var(--text-sm)] text-[var(--color-fg)] leading-snug">
                      {advice}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Competitor Teardown Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[var(--text-lg)] font-bold text-[var(--color-fg)] flex items-center gap-2">
                    <Users className="w-5 h-5 text-[var(--color-fg-muted)]" />
                    <span>Identified Competitors & Market Gaps</span>
                  </h3>
                  <p className="text-[var(--text-xs)] text-[var(--color-fg-muted)]">
                    Local businesses operating in your territory and customer segment
                  </p>
                </div>
                <span className="text-[var(--text-xs)] font-medium text-[var(--color-fg-muted)]">
                  {(report.competitors || []).length} Competitors Analyzed
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(report.competitors || []).map((comp: CompetitorItem, index: number) => (
                  <div
                    key={index}
                    className="p-5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] space-y-4 shadow-xs hover:border-[var(--color-border-focus)] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 pb-2 border-b border-[var(--color-border)]/60">
                      <div>
                        <h4 className="text-[var(--text-base)] font-bold text-[var(--color-fg)]">
                          {comp.name}
                        </h4>
                        <span className="text-[var(--text-xs)] text-[var(--color-fg-muted)]">
                          Active Competitor
                        </span>
                      </div>

                      {comp.source_url && (
                        <a
                          href={comp.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[var(--text-xs)] text-[var(--color-accent)] hover:underline flex-shrink-0"
                        >
                          <span>Profile</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {/* What they do well */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[var(--text-xs)] font-semibold text-[var(--color-fg-muted)]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-status-success-fg)]" />
                        <span>What They Do Well</span>
                      </div>
                      <p className="text-[var(--text-xs)] text-[var(--color-fg)] pl-5">
                        {comp.what_they_do_well}
                      </p>
                    </div>

                    {/* Gap we can exploit */}
                    <div className="space-y-1 p-2.5 rounded-[var(--radius-xs)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)]/50">
                      <div className="flex items-center gap-1.5 text-[var(--text-xs)] font-semibold text-[var(--color-accent)]">
                        <Target className="w-3.5 h-3.5" />
                        <span>Gap We Can Exploit</span>
                      </div>
                      <p className="text-[var(--text-xs)] text-[var(--color-fg)] pl-5 font-medium">
                        {comp.gap_we_can_exploit}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strategic Rationale & Synthesis */}
            <div className="p-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-2">
              <h3 className="text-[var(--text-base)] font-bold text-[var(--color-fg)] flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[var(--color-fg-muted)]" />
                <span>Validator Strategic Reasoning</span>
              </h3>
              <p className="text-[var(--text-sm)] text-[var(--color-fg-muted)] leading-relaxed">
                {report.reasoning}
              </p>
            </div>

            {/* Bottom Next Step Action */}
            <div className="flex items-center justify-between pt-6 border-t border-[var(--color-border)]">
              <Link
                href="/products"
                className="px-4 py-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--text-sm)] font-medium text-[var(--color-fg)] hover:bg-[var(--color-surface-sunken)] transition-colors"
              >
                ← Back to Products (F-005)
              </Link>

              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-accent-hover)] transition-colors shadow-sm"
              >
                <span>Proceed to Pricing & Break-even (F-007)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
