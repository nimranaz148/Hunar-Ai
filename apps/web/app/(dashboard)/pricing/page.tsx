"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Calculator,
  ArrowRight,
  Package,
  Layers,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  BusinessService,
  PricingService,
  type BusinessResponse,
  type PricingResultResponse,
} from "@/lib/api";
import { formatPKR, formatPercentage } from "@/lib/format";

export default function PricingPage() {
  const [business, setBusiness] = useState<BusinessResponse | null>(null);
  const [pricingResults, setPricingResults] = useState<PricingResultResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [overheadInput, setOverheadInput] = useState<number>(10000);
  const [showOverheadEditor, setShowOverheadEditor] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const biz = await BusinessService.getCurrentUserBusinessApiV1BusinessesGet();
      setBusiness(biz);

      if (biz?.id) {
        const results = await PricingService.getPricingApiV1BusinessesBusinessIdPricingGet({
          businessId: biz.id,
        });

        if (results && results.length > 0) {
          setPricingResults(results);
          // Set overhead from existing assumptions if present
          const firstAssumptions = results[0]?.assumptions as { monthly_overhead_pkr?: number } | undefined;
          if (firstAssumptions?.monthly_overhead_pkr) {
            setOverheadInput(firstAssumptions.monthly_overhead_pkr);
          }
        } else {
          // Auto-calculate on initial visit
          const updated = await PricingService.calculatePricingApiV1BusinessesBusinessIdPricingCalculatePost({
            businessId: biz.id,
            requestBody: { overhead_pkr: 10000 },
          });
          setPricingResults(updated);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load pricing data";
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

  const handleCalculate = async (businessId: string, overhead: number) => {
    setIsCalculating(true);
    setErrorMessage(null);
    try {
      const updated = await PricingService.calculatePricingApiV1BusinessesBusinessIdPricingCalculatePost({
        businessId,
        requestBody: { overhead_pkr: overhead },
      });
      setPricingResults(updated);
      setToastMessage("Pricing economics calculated successfully!");
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to calculate pricing";
      setErrorMessage(msg);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleApprove = async (pricingId: string) => {
    if (!business?.id) return;
    setApprovingId(pricingId);
    try {
      const approved = await PricingService.approvePricingApiV1BusinessesBusinessIdPricingPricingIdApprovePost({
        businessId: business.id,
        pricingId,
      });

      setPricingResults((prev) =>
        prev.map((item) => (item.id === pricingId ? approved : item))
      );
      setToastMessage("Pricing economics approved!");
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to approve pricing";
      setErrorMessage(msg);
    } finally {
      setApprovingId(null);
    }
  };

  const getMarginBadge = (marginPct: number) => {
    if (marginPct >= 35) {
      return <StatusBadge status="success" label={`${formatPercentage(marginPct)} Margin`} />;
    }
    if (marginPct >= 20) {
      return <StatusBadge status="warning" label={`${formatPercentage(marginPct)} Margin`} />;
    }
    return <StatusBadge status="danger" label={`${formatPercentage(marginPct)} (Low)`} />;
  };

  // Calculations for summary banner
  const averageMargin =
    pricingResults.length > 0
      ? pricingResults.reduce((acc, curr) => acc + curr.margin_pct, 0) / pricingResults.length
      : 0;

  const totalBreakEvenUnits =
    pricingResults.length > 0
      ? pricingResults.reduce((acc, curr) => acc + curr.break_even_units, 0)
      : 0;

  const allApproved =
    pricingResults.length > 0 && pricingResults.every((item) => Boolean(item.approved_at));

  return (
    <AppShell
      role="entrepreneur"
      userName={business?.name || "Entrepreneur"}
      pageTitle="Pricing & Break-even View (F-007)"
      actions={
        business && (
          <div className="flex items-center gap-2">
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-fg)] text-[var(--text-xs)] font-medium hover:bg-[var(--color-surface-sunken)] transition-colors"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Edit Products</span>
            </Link>
            <button
              onClick={() => handleCalculate(business.id, overheadInput)}
              disabled={isCalculating}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] text-[var(--text-xs)] font-medium hover:opacity-90 disabled:opacity-50 transition-all shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCalculating ? "animate-spin" : ""}`} />
              <span>{isCalculating ? "Calculating..." : "Recalculate"}</span>
            </button>
          </div>
        )
      }
    >
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between text-[var(--text-xs)] text-[var(--color-fg-muted)]">
          <div className="flex items-center gap-2">
            <Link href="/products" className="hover:text-[var(--color-accent)] transition-colors">
              Products Catalog
            </Link>
            <span>/</span>
            <span className="text-[var(--color-fg)] font-medium">Pricing & Break-even</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/validation"
              className="hover:text-[var(--color-accent)] transition-colors"
            >
              Idea Validation →
            </Link>
            <Link
              href="/plan"
              className="font-medium text-[var(--color-accent)] hover:underline flex items-center gap-1"
            >
              <span>Launch Plan Gate (F-008)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-status-success-bg)] text-[var(--color-status-success-fg)] border border-[var(--color-status-success-border)] text-[var(--text-sm)] flex items-center gap-2 shadow-xs">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Error Display */}
        {errorMessage && (
          <ErrorState
            message={errorMessage}
            onRetry={loadData}
          />
        )}

        {isLoading ? (
          <LoadingState
            message="Evaluating itemized costs, margins, and break-even targets..."
          />
        ) : !business ? (
          <EmptyState
            title="No business profile found"
            description="Complete the onboarding conversation first to establish your business catalog."
            action={
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] text-[var(--text-sm)] font-medium hover:opacity-90"
              >
                Start Onboarding
              </Link>
            }
          />
        ) : pricingResults.length === 0 ? (
          <EmptyState
            title="No products configured for pricing"
            description="Add products with itemized costs in the Product Editor to calculate margins and break-even."
            action={
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] text-[var(--text-sm)] font-medium hover:opacity-90"
              >
                Add Products
              </Link>
            }
          />
        ) : (
          <>
            {/* Top KPI Metrics Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
                <div className="flex items-center justify-between text-[var(--color-fg-muted)] mb-2">
                  <span className="text-[var(--text-xs)] font-medium uppercase tracking-wider">
                    Average Gross Margin
                  </span>
                  <TrendingUp className="w-4 h-4 text-[var(--color-accent)]" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[var(--text-2xl)] font-bold text-[var(--color-fg)]">
                    {formatPercentage(averageMargin)}
                  </span>
                  <span className="text-[var(--text-xs)] text-[var(--color-fg-muted)]">
                    Target: ≥ 35%
                  </span>
                </div>
                <p className="text-[var(--text-xs)] text-[var(--color-fg-muted)] mt-2">
                  Calculated from direct ingredient and packaging costs.
                </p>
              </div>

              <div className="p-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
                <div className="flex items-center justify-between text-[var(--color-fg-muted)] mb-2">
                  <span className="text-[var(--text-xs)] font-medium uppercase tracking-wider">
                    Monthly Fixed Overhead
                  </span>
                  <button
                    onClick={() => setShowOverheadEditor(!showOverheadEditor)}
                    className="text-[var(--text-xs)] text-[var(--color-accent)] hover:underline flex items-center gap-1"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>{showOverheadEditor ? "Close" : "Adjust"}</span>
                  </button>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[var(--text-2xl)] font-bold text-[var(--color-fg)]">
                    {formatPKR(overheadInput)}
                  </span>
                  <span className="text-[var(--text-xs)] text-[var(--color-fg-muted)]">/ month</span>
                </div>
                {showOverheadEditor ? (
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="number"
                      min="1000"
                      step="500"
                      value={overheadInput}
                      onChange={(e) => setOverheadInput(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-28 px-2 py-1 text-[var(--text-xs)] rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] text-[var(--color-fg)] focus:outline-none focus:border-[var(--color-border-focus)]"
                    />
                    <button
                      onClick={() => {
                        setShowOverheadEditor(false);
                        handleCalculate(business.id, overheadInput);
                      }}
                      className="px-2.5 py-1 text-[var(--text-xs)] rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] font-medium hover:opacity-90"
                    >
                      Apply
                    </button>
                  </div>
                ) : (
                  <p className="text-[var(--text-xs)] text-[var(--color-fg-muted)] mt-2">
                    Utilities, packaging stocks, equipment depreciation.
                  </p>
                )}
              </div>

              <div className="p-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
                <div className="flex items-center justify-between text-[var(--color-fg-muted)] mb-2">
                  <span className="text-[var(--text-xs)] font-medium uppercase tracking-wider">
                    Approval Status
                  </span>
                  <Layers className="w-4 h-4 text-[var(--color-fg-muted)]" />
                </div>
                <div className="flex items-center gap-2">
                  {allApproved ? (
                    <StatusBadge status="success" label="All Approved (Gate 1 Ready)" />
                  ) : (
                    <StatusBadge status="warning" label="Pending Review" />
                  )}
                </div>
                <p className="text-[var(--text-xs)] text-[var(--color-fg-muted)] mt-2">
                  {allApproved
                    ? "Pricing ready for final Launch Plan approval (F-008)."
                    : "Review product margins below and approve each item."}
                </p>
              </div>
            </div>

            {/* Wireframe F-007 / PRD §30.2 Unit Economics Table */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs overflow-hidden">
              <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
                <div>
                  <h2 className="text-[var(--text-base)] font-bold text-[var(--color-fg)]">
                    Product Margins & Break-even Breakdown (PRD §30.2)
                  </h2>
                  <p className="text-[var(--text-xs)] text-[var(--color-fg-muted)]">
                    Deterministic unit contribution towards monthly fixed costs
                  </p>
                </div>
                <span className="text-[var(--text-xs)] font-medium text-[var(--color-fg-muted)]">
                  {pricingResults.length} Items Calculated
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[var(--text-sm)]">
                  <thead className="bg-[var(--color-surface-sunken)] border-b border-[var(--color-border)] text-[var(--text-xs)] uppercase tracking-wider text-[var(--color-fg-muted)]">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold">Product Offering</th>
                      <th className="px-4 py-3.5 font-semibold">Unit Cost</th>
                      <th className="px-4 py-3.5 font-semibold">Price</th>
                      <th className="px-4 py-3.5 font-semibold">Margin</th>
                      <th className="px-4 py-3.5 font-semibold">Break-even</th>
                      <th className="px-4 py-3.5 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]/60">
                    {pricingResults.map((item) => {
                      const isApproved = Boolean(item.approved_at);
                      const isApproving = approvingId === item.id;
                      const hasRisks = (item.risk_flags || []).length > 0;

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-[var(--color-surface-sunken)]/40 transition-colors"
                        >
                          <td className="px-5 py-4">
                            <div className="font-semibold text-[var(--color-fg)]">
                              {item.product_name}
                            </div>
                            {item.notes && (
                              <p className="text-[var(--text-xs)] text-[var(--color-fg-muted)] mt-1 line-clamp-2 max-w-md">
                                {item.notes}
                              </p>
                            )}
                            {hasRisks && (
                              <div className="mt-2 space-y-1">
                                {(item.risk_flags || []).map((flag, fIdx) => (
                                  <div
                                    key={fIdx}
                                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-status-warning-bg)] text-[var(--color-status-warning-fg)] text-[11px] font-medium"
                                  >
                                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                                    <span>{flag}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-[var(--color-fg)] font-medium">
                            {formatPKR(item.unit_cost)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-[var(--color-fg)] font-bold">
                            {formatPKR(item.price)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {getMarginBadge(item.margin_pct)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="font-bold text-[var(--color-fg)]">
                              {item.break_even_units}
                            </span>
                            <span className="text-[var(--text-xs)] text-[var(--color-fg-muted)] ml-1">
                              units/mo
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right">
                            {isApproved ? (
                              <div className="inline-flex items-center gap-1.5 text-[var(--color-status-success-fg)] text-[var(--text-xs)] font-medium">
                                <CheckCircle className="w-4 h-4" />
                                <span>Approved</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleApprove(item.id)}
                                disabled={isApproving}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] text-[var(--text-xs)] font-medium hover:opacity-90 disabled:opacity-50 transition-all shadow-xs"
                              >
                                {isApproving ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-3.5 h-3.5" />
                                )}
                                <span>Approve</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Strategic Pricing Guidance Banner (PRD §36.13) */}
            <div className="p-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--color-accent)]" />
                <h3 className="text-[var(--text-base)] font-bold text-[var(--color-fg)]">
                  Pricing Agent Strategic Guidance (PRD §36.13)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)]/60">
                  <h4 className="text-[var(--text-xs)] font-semibold uppercase tracking-wider text-[var(--color-fg-muted)] mb-1.5">
                    Pakistani Home-Business Margin Rule
                  </h4>
                  <p className="text-[var(--text-sm)] text-[var(--color-fg)] leading-relaxed">
                    Always maintain at least a 30-35% gross profit margin. Raw ingredient and packaging prices frequently fluctuate in local wholesale markets (e.g. Jodia Bazaar or Akbari Mandi). High margins protect your home venture against unannounced price hikes.
                  </p>
                </div>

                <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)]/60">
                  <h4 className="text-[var(--text-xs)] font-semibold uppercase tracking-wider text-[var(--color-fg-muted)] mb-1.5">
                    Managing Break-even Volume
                  </h4>
                  <p className="text-[var(--text-sm)] text-[var(--color-fg)] leading-relaxed">
                    With an overhead of {formatPKR(overheadInput)}/mo, you must sell {totalBreakEvenUnits} units total across your offerings to cover rent, utilities, and tools. Focus initial sales on high-margin anchor items to break even before mid-month.
                  </p>
                </div>
              </div>
            </div>

            {/* Next Step Call to Action */}
            <div className="p-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-[var(--text-sm)] font-bold text-[var(--color-fg)]">
                  Ready to proceed to Plan Approval?
                </h4>
                <p className="text-[var(--text-xs)] text-[var(--color-fg-muted)]">
                  Once your pricing is locked in, review your complete 30-day launch plan at Human Gate 1.
                </p>
              </div>
              <Link
                href="/plan"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] text-[var(--text-sm)] font-medium hover:opacity-90 transition-opacity shadow-xs"
              >
                <span>Proceed to Launch Plan (F-008)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
