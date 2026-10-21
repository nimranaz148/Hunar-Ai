"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Calendar,
  Send,
  FileText,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Award,
  Hash,
  RefreshCw,
  AlertCircle,
  Lightbulb,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  BusinessService,
  ContentService,
  type BusinessResponse,
  type ResearchReportResponse,
} from "@/lib/api";

export default function ResearchReportPage() {
  const [business, setBusiness] = useState<BusinessResponse | null>(null);
  const [report, setReport] = useState<ResearchReportResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCluster, setCopiedCluster] = useState<string | null>(null);

  const loadResearch = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);

    try {
      const biz = await BusinessService.getCurrentUserBusinessApiV1BusinessesGet();
      setBusiness(biz);

      if (biz?.id) {
        const data =
          await ContentService.getResearchApiV1BusinessesBusinessIdContentResearchGet({
            businessId: biz.id,
          });
        setReport(data);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load market research report";
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
        loadResearch();
      }
    });
    return () => {
      isMounted = false;
    };
  }, [loadResearch]);

  const copyToClipboard = async (tags: string[], label: string) => {
    try {
      await navigator.clipboard.writeText(tags.join(" "));
      setCopiedCluster(label);
      setTimeout(() => setCopiedCluster(null), 2000);
    } catch {
      setCopiedCluster(null);
    }
  };

  const allHashtags = report?.hashtags
    ? Object.values(report.hashtags).flat()
    : [];

  return (
    <AppShell
      role="entrepreneur"
      userName={business?.name || "Entrepreneur"}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Breadcrumbs & Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-2xs font-bold tracking-wide uppercase bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
                Market Intelligence
              </span>
              <span className="text-xs text-[var(--color-fg-muted)]">
                F-014 Research Report
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-fg)] mt-1 tracking-tight flex items-center gap-2">
              <Search className="w-6 h-6 text-[var(--color-accent)]" />
              Competitor & Trend Research
            </h1>
            <p className="text-xs text-[var(--color-fg-muted)] mt-0.5">
              Live competitor teardowns, strategic differentiation levers, and localized hashtag clusters for {business?.name || "your brand"}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadResearch(true)}
              disabled={isRefreshing || isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[var(--color-fg)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-hover)] transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <Link
              href="/content/today"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[var(--color-fg)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-hover)] transition"
            >
              <Send className="w-3.5 h-3.5 text-[var(--color-fg-muted)]" />
              Today&apos;s Post
            </Link>
            <Link
              href="/content/calendar"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[var(--color-fg)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-hover)] transition"
            >
              <Calendar className="w-3.5 h-3.5 text-[var(--color-fg-muted)]" />
              Content Calendar
            </Link>
            <Link
              href="/content/outline"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[var(--color-fg)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-hover)] transition"
            >
              <FileText className="w-3.5 h-3.5 text-[var(--color-fg-muted)]" />
              Campaign Outline
            </Link>
          </div>
        </div>

        {/* Error State */}
        {errorMessage && (
          <div
            role="alert"
            className="p-4 bg-[var(--color-danger-subtle)] border border-[var(--color-danger-border)] rounded-[var(--radius-lg)] text-[var(--color-danger)] text-sm flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="font-semibold text-sm">Unable to load research report</h2>
              <p className="mt-1 text-xs opacity-90">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => loadResearch()}
              className="px-3 py-1 bg-[var(--color-surface)] border border-[var(--color-danger-border)] rounded text-xs font-medium hover:bg-[var(--color-surface-hover)]"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !report && (
          <LoadingState message="Analyzing competitors, market gaps, and localized hashtags..." />
        )}

        {/* Empty State */}
        {!isLoading && !report && !errorMessage && (
          <EmptyState
            title="No Market Research Available"
            description="Competitor analysis and trend insights have not been generated yet. Complete business onboarding or generate a content calendar."
            action={
              <Link
                href="/content/calendar"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-[var(--color-fg-inverse)] text-sm font-semibold rounded-[var(--radius-md)] hover:bg-[var(--color-accent-hover)] transition"
              >
                Go to Content Calendar
              </Link>
            }
          />
        )}

        {report && (
          <div className="space-y-8">
            {/* Overview / Key Metrics Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xs)] flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-2xs font-bold text-[var(--color-fg-muted)] uppercase tracking-wider block">
                    Competitors Profiled
                  </span>
                  <span className="text-xl font-black text-[var(--color-fg)]">
                    {report.competitors?.length || 0} Direct Brands
                  </span>
                </div>
              </div>

              <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xs)] flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-success-subtle)] text-[var(--color-success)] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-2xs font-bold text-[var(--color-fg-muted)] uppercase tracking-wider block">
                    Research Confidence
                  </span>
                  <span className="text-xl font-black text-[var(--color-success)]">
                    {Math.round(report.confidence * 100)}% High Confidence
                  </span>
                </div>
              </div>

              <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xs)] flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-info-subtle)] text-[var(--color-info)] flex items-center justify-center shrink-0">
                  <Hash className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-2xs font-bold text-[var(--color-fg-muted)] uppercase tracking-wider block">
                    Curated Hashtags
                  </span>
                  <span className="text-xl font-black text-[var(--color-fg)]">
                    {allHashtags.length} Strategic Tags
                  </span>
                </div>
              </div>
            </div>

            {/* Section 1: Competitor Teardown */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[var(--color-fg)] flex items-center gap-2">
                    <Award className="w-4 h-4 text-[var(--color-accent)]" />
                    Direct Competitors Teardown
                  </h2>
                  <p className="text-xs text-[var(--color-fg-muted)]">
                    Benchmarked local brands in {business?.niche || "your niche"} in {business?.city || "Pakistan"}.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.competitors && report.competitors.length > 0 ? (
                  report.competitors.map((comp, idx) => (
                    <div
                      key={idx}
                      className="p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xs)] space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-[var(--color-fg)]">
                            {String(comp.name || "Competitor Brand")}
                          </h3>
                          {comp.handle && (
                            <span className="text-xs font-semibold text-[var(--color-accent)]">
                              {String(comp.handle)}
                            </span>
                          )}
                        </div>
                        {comp.price_point && (
                          <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[var(--color-fg)]">
                            {String(comp.price_point)}
                          </span>
                        )}
                      </div>

                      {comp.key_advantage && (
                        <div className="text-xs space-y-0.5">
                          <span className="font-bold text-[var(--color-success)] uppercase text-2xs block">
                            Their Key Strength:
                          </span>
                          <p className="text-[var(--color-fg-muted)]">
                            {String(comp.key_advantage)}
                          </p>
                        </div>
                      )}

                      {comp.weakness && (
                        <div className="text-xs space-y-0.5 pt-2 border-t border-[var(--color-border)]">
                          <span className="font-bold text-[var(--color-danger)] uppercase text-2xs block">
                            Market Gap / Their Vulnerability:
                          </span>
                          <p className="text-[var(--color-fg-muted)]">
                            {String(comp.weakness)}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[var(--color-fg-muted)]">
                    No competitor entries found in report.
                  </p>
                )}
              </div>
            </div>

            {/* Section 2: How to Win / Be Better */}
            <div className="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] space-y-4">
              <h2 className="text-sm font-bold text-[var(--color-fg)] flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[var(--color-accent)]" />
                Strategic Levers: How to Outperform Competitors
              </h2>
              <p className="text-xs text-[var(--color-fg-muted)]">
                Recommended positioning guidelines derived by the Research Normalizer agent:
              </p>

              <div className="space-y-2.5 pt-1">
                {report.how_to_be_better && report.how_to_be_better.length > 0 ? (
                  report.how_to_be_better.map((bullet, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3.5 bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-xs text-[var(--color-fg)]"
                    >
                      <div className="w-5 h-5 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] flex items-center justify-center shrink-0 mt-0.5 font-bold text-2xs">
                        {idx + 1}
                      </div>
                      <span className="leading-relaxed font-medium">{bullet}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[var(--color-fg-muted)]">
                    No strategic levers found.
                  </p>
                )}
              </div>
            </div>

            {/* Section 3: Strategic Hashtag Clusters */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-[var(--color-fg)] flex items-center gap-2">
                    <Hash className="w-4 h-4 text-[var(--color-accent)]" />
                    Targeted Hashtag Clusters
                  </h2>
                  <p className="text-xs text-[var(--color-fg-muted)]">
                    Balanced between high-volume discovery, specific niche intent, and local geographic buyers.
                  </p>
                </div>
                {allHashtags.length > 0 && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(allHashtags, "all")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--color-accent)] text-[var(--color-fg-inverse)] rounded-[var(--radius-md)] text-xs font-bold hover:bg-[var(--color-accent-hover)] transition"
                  >
                    {copiedCluster === "all" ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>All Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy All ({allHashtags.length})</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {report.hashtags &&
                  Object.entries(report.hashtags).map(([clusterKey, tags]) => {
                    const tagList = Array.isArray(tags) ? tags : [];
                    return (
                      <div
                        key={clusterKey}
                        className="p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xs)] flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-fg)]">
                              {clusterKey} Reach
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(tagList, clusterKey)}
                              className="text-2xs font-bold text-[var(--color-accent)] hover:underline flex items-center gap-1"
                            >
                              {copiedCluster === clusterKey ? (
                                <>
                                  <Check className="w-3 h-3 text-[var(--color-success)]" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {tagList.map((tag, tIdx) => (
                              <span
                                key={tIdx}
                                className="px-2 py-0.5 text-2xs font-medium bg-[var(--color-surface-hover)] text-[var(--color-accent)] rounded border border-[var(--color-border)]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Section 4: Source Reference URLs */}
            {report.source_urls && report.source_urls.length > 0 && (
              <div className="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xs)] space-y-3">
                <h2 className="text-xs font-bold text-[var(--color-fg-muted)] uppercase tracking-wider flex items-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Live Search Findings & Sources
                </h2>
                <div className="flex flex-wrap gap-2">
                  {report.source_urls.map((url, uIdx) => (
                    <a
                      key={uIdx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-accent)] bg-[var(--color-surface-hover)] border border-[var(--color-border)] rounded-[var(--radius-md)] hover:underline"
                    >
                      <span className="truncate max-w-xs">{url}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
