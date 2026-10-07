"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Banknote,
  Clock,
  CheckCircle2,
  Search,
  ShieldCheck,
  RefreshCw,
  Briefcase,
  Users,
  RotateCcw,
} from "lucide-react";
import {
  MentorsService,
  type MentorEarningsResponse,
  type EarningsTransaction,
} from "@/lib/api";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

function formatPKR(amount: number): string {
  return `PKR ${amount.toLocaleString()}`;
}

function formatDate(dateStr: string): string {
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

export default function MentorEarningsPage(): React.ReactElement {
  return (
    <Suspense
      fallback={
        <div className="py-12">
          <LoadingState message="Loading earnings report..." />
        </div>
      }
    >
      <MentorEarningsContent />
    </Suspense>
  );
}

function MentorEarningsContent(): React.ReactElement {
  const searchParams = useSearchParams();
  const initialPeriod = searchParams.get("period") || "all";

  const [period, setPeriod] = useState<string>(initialPeriod);
  const [data, setData] = useState<MentorEarningsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchEarnings = async (selectedPeriod: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await MentorsService.getOwnEarningsApiV1MentorsMeEarningsGet({
        period: selectedPeriod,
      });
      setData(res);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load earnings report";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setError(null);
        const res = await MentorsService.getOwnEarningsApiV1MentorsMeEarningsGet({
          period,
        });
        if (!ignore) {
          setData(res);
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg =
            err instanceof Error ? err.message : "Failed to load earnings report";
          setError(msg);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [period]);

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    setIsLoading(true);
  };

  const transactions = useMemo(() => {
    if (!data) return [];
    let list: EarningsTransaction[] = data.transactions || [];

    // Filter by payment status tab
    if (statusFilter !== "all") {
      list = list.filter((t) => t.payment_status === statusFilter);
    }

    // Filter by search query (mentee name or service title)
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.mentee_name.toLowerCase().includes(q) ||
          t.service_title.toLowerCase().includes(q)
      );
    }

    return list;
  }, [data, statusFilter, searchQuery]);

  // Max earning month for relative chart bar heights
  const maxMonthlyEarned = useMemo(() => {
    if (!data || !data.monthly_trend || data.monthly_trend.length === 0) return 1;
    return Math.max(...data.monthly_trend.map((m) => m.earned_pkr), 1);
  }, [data]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Earnings & Escrow Ledger
          </h1>
          <p className="text-sm text-muted-foreground">
            Review released advisory income, pending escrow holds, and transaction history (F-026 / R-006).
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
          <Link
            href="/mentor/mentees"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            Mentees
          </Link>
          <button
            type="button"
            onClick={() => fetchEarnings(period)}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Period Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {[
          { id: "all", label: "All Time" },
          { id: "this_month", label: "This Month" },
          { id: "last_month", label: "Last Month" },
          { id: "this_year", label: "This Year" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handlePeriodChange(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              period === tab.id
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && !data && (
        <div className="py-12">
          <LoadingState message="Loading your earnings and escrow report..." />
        </div>
      )}

      {/* Error state */}
      {error && !data && (
        <div className="p-6">
          <ErrorState
            title="Failed to load earnings"
            message={error}
            onRetry={() => fetchEarnings(period)}
          />
        </div>
      )}

      {/* Content */}
      {data && (
        <div className="space-y-6">
          {/* 4 Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Earned */}
            <div className="p-5 rounded-xl border border-border bg-card shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium uppercase tracking-wider">
                  Total Earned
                </span>
                <Banknote className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {formatPKR(data.total_earned_pkr)}
              </div>
              <span className="text-xs text-emerald-600 block">
                Released upon completed sessions
              </span>
            </div>

            {/* In Escrow */}
            <div className="p-5 rounded-xl border border-border bg-card shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium uppercase tracking-wider">
                  In Escrow (Pending)
                </span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-amber-600">
                {formatPKR(data.pending_escrow_pkr)}
              </div>
              <span className="text-xs text-muted-foreground block">
                Held safely for scheduled bookings
              </span>
            </div>

            {/* Completed Sessions */}
            <div className="p-5 rounded-xl border border-border bg-card shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium uppercase tracking-wider">
                  Sessions Delivered
                </span>
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {data.completed_sessions_count}
              </div>
              <span className="text-xs text-muted-foreground block">
                Completed 1-on-1 consultations
              </span>
            </div>

            {/* Average Session Fee */}
            <div className="p-5 rounded-xl border border-border bg-card shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium uppercase tracking-wider">
                  Average Session Fee
                </span>
                <RotateCcw className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {formatPKR(data.average_session_fee_pkr)}
              </div>
              <span className="text-xs text-muted-foreground block">
                Average per delivered booking
              </span>
            </div>
          </div>

          {/* Simulated Escrow Guarantee Trust Banner */}
          <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950">
            <div className="flex items-start sm:items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="font-semibold block sm:inline">
                  Simulated Escrow Payout Protocol:
                </span>{" "}
                <span>
                  Entrepreneur payments are deposited into Hunar escrow when booked and released directly to your simulated account upon session completion. 0% platform fee during early pilot.
                </span>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-md bg-white/80 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Raast / Direct Bank Active</span>
            </div>
          </div>

          {/* Monthly Trend Breakdown */}
          {data.monthly_trend && data.monthly_trend.length > 0 && (
            <div className="p-5 rounded-xl border border-border bg-card shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    Monthly Earnings Trend
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Chronological performance over the last recording periods.
                  </p>
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {data.period_label}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
                {data.monthly_trend.map((m) => {
                  const pct = Math.max(
                    8,
                    Math.round((m.earned_pkr / maxMonthlyEarned) * 100)
                  );
                  return (
                    <div
                      key={`${m.year}-${m.month}`}
                      data-testid={`monthly-trend-${m.year}-${m.month}`}
                      className="p-3 rounded-lg border border-border/80 bg-muted/20 flex flex-col justify-between space-y-2 text-center"
                    >
                      <span className="text-xs font-bold text-foreground">
                        {m.month_label}
                      </span>
                      <div className="h-16 flex items-end justify-center py-1">
                        <div
                          className="w-8 rounded-t-md bg-primary transition-all duration-300"
                          style={{ height: `${pct}%` }}
                          title={`${formatPKR(m.earned_pkr)} (${m.sessions_completed} sessions)`}
                        />
                      </div>
                      <div className="space-y-0.5 border-t border-border/50 pt-1">
                        <span className="text-xs font-semibold text-foreground block">
                          {formatPKR(m.earned_pkr)}
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          {m.sessions_completed} session
                          {m.sessions_completed === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Transaction Ledger Card */}
          <div className="p-6 rounded-xl border border-border bg-card shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Transaction Ledger
                </h2>
                <p className="text-xs text-muted-foreground">
                  Complete history of advisory session payouts and escrow statuses.
                </p>
              </div>

              {/* Status Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "all", label: "All" },
                  { id: "released", label: "Released" },
                  { id: "held", label: "In Escrow" },
                  { id: "refunded", label: "Refunded" },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setStatusFilter(pill.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      statusFilter === pill.id
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search filter input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transactions by mentee name or session title..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-muted/20 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Transactions Table / List */}
            {transactions.length === 0 ? (
              <div className="py-8">
                <EmptyState
                  title="No transactions found"
                  description={
                    searchQuery
                      ? `No transactions match "${searchQuery}".`
                      : "No advisory transactions recorded in this period yet."
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                      <th className="py-3 px-2">Date</th>
                      <th className="py-3 px-2">Mentee</th>
                      <th className="py-3 px-2">Service / Offering</th>
                      <th className="py-3 px-2 text-right">Gross Fee</th>
                      <th className="py-3 px-2 text-center">Escrow Status</th>
                      <th className="py-3 px-2 text-center">Session Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {transactions.map((tx) => (
                      <tr
                        key={tx.booking_id}
                        data-testid={`transaction-row-${tx.booking_id}`}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-3 px-2 text-muted-foreground whitespace-nowrap">
                          {formatDate(tx.created_at)}
                        </td>
                        <td className="py-3 px-2 font-medium text-foreground whitespace-nowrap">
                          {tx.mentee_name}
                        </td>
                        <td className="py-3 px-2 text-foreground">
                          <span className="font-medium block">
                            {tx.service_title}
                          </span>
                          <span className="text-[10px] text-muted-foreground capitalize">
                            {tx.service_type}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right font-bold text-foreground whitespace-nowrap">
                          {formatPKR(tx.amount_pkr)}
                        </td>
                        <td className="py-3 px-2 text-center whitespace-nowrap">
                          <StatusBadge status={tx.payment_status} />
                        </td>
                        <td className="py-3 px-2 text-center whitespace-nowrap">
                          <StatusBadge status={tx.booking_status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
