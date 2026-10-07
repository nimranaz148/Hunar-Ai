"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Clock,
  Calendar,
  DollarSign,
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  User,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Briefcase,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatPKR, formatDate, formatDateTime } from "@/lib/format";
import {
  MentorsService,
  BookingsService,
  type MentorDashboardResponse,
  type MentorDashboardSessionItem,
  ApiError,
} from "@/lib/api";

export default function MentorDashboardPage() {
  const [dashboard, setDashboard] = useState<MentorDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Decline confirmation modal state
  const [decliningSession, setDecliningSession] = useState<MentorDashboardSessionItem | null>(null);

  const refreshDashboard = useCallback(async () => {
    try {
      setErrorMessage(null);
      const data = await MentorsService.getOwnDashboardApiV1MentorsMeDashboardGet();
      setDashboard(data);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(
          typeof err.body?.detail === "string"
            ? err.body.detail
            : "Failed to load mentor dashboard. Please check connection."
        );
      } else {
        setErrorMessage("Failed to load mentor dashboard.");
      }
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadInitial() {
      try {
        setErrorMessage(null);
        const data = await MentorsService.getOwnDashboardApiV1MentorsMeDashboardGet();
        if (!ignore) {
          setDashboard(data);
        }
      } catch (err: unknown) {
        if (!ignore) {
          if (err instanceof ApiError) {
            setErrorMessage(
              typeof err.body?.detail === "string"
                ? err.body.detail
                : "Failed to load mentor dashboard. Please check connection."
            );
          } else {
            setErrorMessage("Failed to load mentor dashboard.");
          }
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadInitial();
    return () => {
      ignore = true;
    };
  }, []);

  const handleAcceptRequest = async (item: MentorDashboardSessionItem) => {
    try {
      setActionLoadingId(item.id);
      setActionSuccess(null);
      setErrorMessage(null);

      await BookingsService.updateBookingDetailsApiV1BookingsBookingIdPatch({
        bookingId: item.id,
        requestBody: { status: "accepted" },
      });

      setActionSuccess(`Accepted booking request from ${item.entrepreneur_name}!`);
      await refreshDashboard();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(
          typeof err.body?.detail === "string"
            ? err.body.detail
            : "Could not accept booking request."
        );
      } else {
        setErrorMessage("Could not accept booking request.");
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmDecline = async () => {
    if (!decliningSession) return;

    try {
      setActionLoadingId(decliningSession.id);
      setActionSuccess(null);
      setErrorMessage(null);

      await BookingsService.updateBookingDetailsApiV1BookingsBookingIdPatch({
        bookingId: decliningSession.id,
        requestBody: { status: "declined" },
      });

      setActionSuccess(
        `Declined request from ${decliningSession.entrepreneur_name}. Held payment has been refunded to mentee.`
      );
      setDecliningSession(null);
      await refreshDashboard();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(
          typeof err.body?.detail === "string"
            ? err.body.detail
            : "Could not decline booking request."
        );
      } else {
        setErrorMessage("Could not decline booking request.");
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <AppShell role="mentor">
      <div className="space-y-8 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Mentor Pro
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Mentor Dashboard
              </h1>
            </div>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Manage client coaching requests, upcoming mentoring sessions, and earnings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/mentor/availability"
              className="inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-2xs"
            >
              <Clock className="w-4 h-4 text-emerald-600" />
              Availability
            </Link>
            <Link
              href="/mentor/services"
              className="inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-2xs"
            >
              <Briefcase className="w-4 h-4 text-blue-600" />
              My Services
            </Link>
            <Link
              href="/mentor/profile"
              className="inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-2xs"
            >
              <User className="w-4 h-4 text-purple-600" />
              Profile
            </Link>
          </div>
        </div>

        {/* Feedback Banners */}
        {actionSuccess && (
          <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button
              onClick={() => setActionSuccess(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={refreshDashboard}
              className="inline-flex items-center gap-1 text-rose-800 hover:text-rose-950 font-medium text-xs underline"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !dashboard ? (
          <div className="py-12">
            <LoadingState message="Loading mentor dashboard..." />
          </div>
        ) : (
          dashboard && (
            <>
              {/* 4 Core KPI Summary Cards (PRD §7 D-002, §8, §29.2) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Pending Requests */}
                <a
                  href="#pending-requests"
                  className="p-5 rounded-xl border border-border bg-card hover:border-amber-300 hover:shadow-xs transition-all flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Pending Requests
                    </span>
                    <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-extrabold text-foreground">
                      {dashboard.pending_requests_count}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">
                        {dashboard.pending_requests_count > 0
                          ? "Action required"
                          : "No action pending"}
                      </span>
                      {dashboard.pending_requests_count > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-800 rounded-full">
                          Review now
                        </span>
                      )}
                    </div>
                  </div>
                </a>

                {/* 2. Upcoming Sessions */}
                <a
                  href="#upcoming-sessions"
                  className="p-5 rounded-xl border border-border bg-card hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Upcoming Sessions
                    </span>
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Calendar className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-extrabold text-foreground">
                      {dashboard.upcoming_sessions_count}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">Scheduled with mentees</span>
                      <span className="text-xs font-medium text-blue-600 group-hover:underline flex items-center gap-0.5">
                        View schedule <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </a>

                {/* 3. Simulated Earnings */}
                <Link
                  href="/mentor/earnings"
                  className="p-5 rounded-xl border border-border bg-card hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Total Earnings
                    </span>
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-extrabold text-foreground">
                      {formatPKR(dashboard.total_earnings_pkr)}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">Released escrow payouts</span>
                      <span className="text-xs font-medium text-emerald-600 group-hover:underline flex items-center gap-0.5">
                        Breakdown <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>

                {/* 4. Client Rating */}
                <Link
                  href="/mentor/profile"
                  className="p-5 rounded-xl border border-border bg-card hover:border-purple-300 hover:shadow-xs transition-all flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Client Rating
                    </span>
                    <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Star className="w-5 h-5 fill-purple-600" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-extrabold text-foreground flex items-center gap-1.5">
                      ★ {dashboard.average_rating.toFixed(1)}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">
                        {dashboard.review_count} client review
                        {dashboard.review_count === 1 ? "" : "s"}
                      </span>
                      <span className="text-xs font-medium text-purple-600 group-hover:underline flex items-center gap-0.5">
                        Profile <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              </div>

              {/* SECTION 1: Pending Booking Requests (PRD §5 F-024) */}
              <section id="pending-requests" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-foreground">
                      Pending Requests
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      {dashboard.pending_requests.length}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    Accepting locks session; declining releases held escrow
                  </span>
                </div>

                {dashboard.pending_requests.length === 0 ? (
                  <div className="p-8 rounded-xl border border-dashed border-border bg-card text-center">
                    <EmptyState
                      title="No pending requests"
                      description="You have no client requests awaiting response. As entrepreneurs book your services, they will appear here for review."
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {dashboard.pending_requests.map((item) => (
                      <div
                        key={item.id}
                        data-testid={`pending-request-card-${item.id}`}
                        className="p-5 sm:p-6 rounded-xl border border-amber-200 bg-amber-50/20 hover:bg-amber-50/30 transition-colors shadow-2xs space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-foreground text-base">
                                {item.entrepreneur_name}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                                Mentee
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                {item.service_type.replace(/_/g, " ")}
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-foreground">
                              {item.service_title}
                            </h3>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 text-right">
                            <span className="text-lg font-bold text-foreground">
                              {formatPKR(item.amount_pkr)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {item.duration_min} minutes
                            </span>
                          </div>
                        </div>

                        {/* Session Focus / Notes */}
                        {item.notes && (
                          <div className="p-3.5 rounded-lg bg-card border border-border text-sm text-foreground space-y-1">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                              <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                              Session Focus / Mentee Questions:
                            </div>
                            <p className="text-sm text-foreground/90 leading-relaxed italic">
                              &ldquo;{item.notes}&rdquo;
                            </p>
                          </div>
                        )}

                        {/* Footer & Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-border/60">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Requested on {formatDate(item.created_at)}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-emerald-700 font-medium">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Escrow Held
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setDecliningSession(item)}
                              disabled={actionLoadingId === item.id}
                              className="px-3.5 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-muted-foreground hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors disabled:opacity-50"
                            >
                              Decline
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAcceptRequest(item)}
                              disabled={actionLoadingId === item.id}
                              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-2xs disabled:opacity-50"
                            >
                              {actionLoadingId === item.id ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  Accepting...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Accept Request
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* SECTION 2: Upcoming Sessions */}
              <section id="upcoming-sessions" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-bold text-foreground">
                      Upcoming Sessions
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                      {dashboard.upcoming_sessions.length}
                    </span>
                  </div>
                  <Link
                    href="/mentor/mentees"
                    className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1"
                  >
                    View All Mentees <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {dashboard.upcoming_sessions.length === 0 ? (
                  <div className="p-8 rounded-xl border border-dashed border-border bg-card text-center">
                    <EmptyState
                      title="No upcoming sessions scheduled"
                      description="When you accept requests or schedule sessions with mentees, your upcoming agenda will appear here."
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dashboard.upcoming_sessions.map((item) => (
                      <div
                        key={item.id}
                        data-testid={`upcoming-session-card-${item.id}`}
                        className="p-5 rounded-xl border border-border bg-card hover:border-border/80 transition-all shadow-2xs space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {item.service_type.replace(/_/g, " ")}
                            </span>
                            <StatusBadge status={item.status} />
                          </div>

                          <h3 className="font-bold text-foreground text-base line-clamp-1">
                            {item.service_title}
                          </h3>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="w-4 h-4 text-primary shrink-0" />
                            <span className="font-medium text-foreground">
                              {item.entrepreneur_name}
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-border space-y-2 text-xs text-muted-foreground">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-blue-600" />
                              {item.scheduled_at
                                ? formatDateTime(item.scheduled_at)
                                : "Schedule to be confirmed"}
                            </span>
                            <span className="font-medium text-foreground">
                              {item.duration_min} min
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span>Fee: {formatPKR(item.amount_pkr)}</span>
                            <Link
                              href={`/mentor/mentees?id=${item.entrepreneur_id}`}
                              className="text-primary hover:underline font-medium flex items-center gap-0.5"
                            >
                              Mentee Brief <ChevronRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* SECTION 3: Quick Navigation Launchpad */}
              <section className="p-6 rounded-xl border border-border bg-gradient-to-r from-card to-muted/30 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-base font-bold text-foreground">
                    Mentor Management Quick Links
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Link
                    href="/mentor/availability"
                    className="p-3.5 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-foreground">
                          Weekly Availability
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Set recurring hours
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  <Link
                    href="/mentor/services"
                    className="p-3.5 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-foreground">
                          Service Offerings
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Edit rates & packages
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  <Link
                    href="/mentor/profile"
                    className="p-3.5 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-foreground">
                          Public Profile
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Bio, niches & city
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </section>
            </>
          )
        )}

        {/* Decline Request Confirmation Modal */}
        {decliningSession && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby="decline-dialog-title"
          >
            <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 id="decline-dialog-title" className="text-base font-bold text-foreground">
                    Decline Booking Request?
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    This action will cancel the requested session.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted text-xs text-muted-foreground space-y-1">
                <div>
                  Mentee: <strong className="text-foreground">{decliningSession.entrepreneur_name}</strong>
                </div>
                <div>
                  Service: <strong className="text-foreground">{decliningSession.service_title}</strong>
                </div>
                <div className="pt-1 text-emerald-700 font-medium">
                  Escrow Guarantee: The held amount of {formatPKR(decliningSession.amount_pkr)} will be automatically refunded to the mentee.
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDecliningSession(null)}
                  disabled={actionLoadingId !== null}
                  className="px-4 py-2 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Keep Request
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDecline}
                  disabled={actionLoadingId !== null}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors shadow-2xs"
                >
                  {actionLoadingId ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Declining...
                    </>
                  ) : (
                    "Confirm Decline"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
