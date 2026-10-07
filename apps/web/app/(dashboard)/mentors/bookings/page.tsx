"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  DollarSign,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  X,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Search,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ReviewModal } from "@/components/mentor/ReviewModal";
import {
  BookingsService,
  BookingItemResponse,
  BookingDetailResponse,
  ApiError,
} from "@/lib/api";

type TabFilter = "all" | "requested" | "upcoming" | "completed" | "cancelled";

const TAB_OPTIONS: { id: TabFilter; label: string }[] = [
  { id: "all", label: "All Bookings" },
  { id: "requested", label: "Requested" },
  { id: "upcoming", label: "Accepted & Scheduled" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled & Declined" },
];

export default function MyBookingsPage() {
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [bookings, setBookings] = useState<BookingItemResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Detail drawer state
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingDetailResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Cancellation modal state
  const [bookingToCancel, setBookingToCancel] = useState<BookingItemResponse | null>(null);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Review modal state (F-041)
  const [bookingToReview, setBookingToReview] =
    useState<BookingItemResponse | BookingDetailResponse | null>(null);

  const handleReviewSuccess = (updatedBooking: BookingDetailResponse) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === updatedBooking.id ? { ...b, status: "reviewed" } : b
      )
    );
    if (selectedBooking?.id === updatedBooking.id) {
      setSelectedBooking(updatedBooking);
    }
    setToastMessage("Thank you! Your review has been submitted successfully.");
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    let ignore = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        let queryStatus: string | null = null;
        if (activeTab === "requested") queryStatus = "requested";
        else if (activeTab === "completed") queryStatus = "completed";

        const res = await BookingsService.listUserBookingsApiV1BookingsGet({
          page: 1,
          pageSize: 50,
          status: queryStatus,
        });

        let items = res.items || [];
        if (activeTab === "upcoming") {
          items = items.filter((b) => b.status === "accepted" || b.status === "scheduled");
        } else if (activeTab === "completed") {
          items = items.filter((b) => b.status === "completed" || b.status === "reviewed");
        } else if (activeTab === "cancelled") {
          items = items.filter((b) => b.status === "cancelled" || b.status === "declined");
        }

        if (!ignore) {
          setBookings(items);
        }
      } catch (err: unknown) {
        if (!ignore) {
          if (err instanceof ApiError) {
            setError(err.body?.detail || "Failed to load bookings");
          } else if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("An unexpected error occurred while fetching bookings");
          }
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [activeTab]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      let queryStatus: string | null = null;
      if (activeTab === "requested") queryStatus = "requested";
      else if (activeTab === "completed") queryStatus = "completed";

      const res = await BookingsService.listUserBookingsApiV1BookingsGet({
        page: 1,
        pageSize: 50,
        status: queryStatus,
      });

      let items = res.items || [];
      if (activeTab === "upcoming") {
        items = items.filter((b) => b.status === "accepted" || b.status === "scheduled");
      } else if (activeTab === "cancelled") {
        items = items.filter((b) => b.status === "cancelled" || b.status === "declined");
      }

      setBookings(items);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.body?.detail || "Failed to load bookings");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred while fetching bookings");
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenDetail = async (id: string) => {
    setSelectedBookingId(id);
    setIsLoadingDetail(true);
    setDetailError(null);
    try {
      const detail = await BookingsService.getBookingDetailsApiV1BookingsBookingIdGet({
        bookingId: id,
      });
      setSelectedBooking(detail);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setDetailError(err.body?.detail || "Failed to load booking details");
      } else {
        setDetailError("Unable to retrieve booking information");
      }
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedBookingId(null);
    setSelectedBooking(null);
    setDetailError(null);
  };

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    setIsCancelling(true);
    setCancelError(null);
    try {
      const updated = await BookingsService.updateBookingDetailsApiV1BookingsBookingIdPatch({
        bookingId: bookingToCancel.id,
        requestBody: { status: "cancelled" },
      });

      // Update in list
      setBookings((prev) =>
        prev.map((b) =>
          b.id === updated.id
            ? { ...b, status: updated.status, payment_status: updated.payment_status }
            : b
        )
      );

      // If active drawer is open, update drawer too
      if (selectedBooking && selectedBooking.id === updated.id) {
        setSelectedBooking(updated);
      }

      setToastMessage("Booking successfully cancelled. Simulated escrow payment has been refunded.");
      setTimeout(() => setToastMessage(null), 5000);
      setBookingToCancel(null);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setCancelError(err.body?.detail || "Failed to cancel booking");
      } else if (err instanceof Error) {
        setCancelError(err.message);
      } else {
        setCancelError("An error occurred while cancelling booking");
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "requested":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Requested
          </span>
        );
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Accepted
          </span>
        );
      case "scheduled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 border border-purple-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            Scheduled
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Completed
          </span>
        );
      case "reviewed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <span className="text-amber-500">★</span>
            Reviewed
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 border border-red-500/20">
            <XCircle className="w-3 h-3 text-red-600" />
            Cancelled
          </span>
        );
      case "declined":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-600 border border-zinc-500/20">
            <XCircle className="w-3 h-3 text-zinc-600" />
            Declined
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-600 border border-zinc-500/20 capitalize">
            {status}
          </span>
        );
    }
  };

  const getEscrowBadge = (paymentStatus?: string) => {
    switch (paymentStatus) {
      case "held":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            <ShieldCheck className="w-3 h-3 text-amber-600" />
            Escrow Held
          </span>
        );
      case "released":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Payment Released
          </span>
        );
      case "refunded":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 bg-zinc-500/10 px-2 py-0.5 rounded border border-zinc-500/20">
            <ShieldCheck className="w-3 h-3 text-zinc-500" />
            Escrow Refunded
          </span>
        );
      default:
        return null;
    }
  };

  const formatServiceType = (type: string) => {
    switch (type) {
      case "session":
        return "1-on-1 Session";
      case "package":
        return "Service Package";
      case "review":
        return "Audit & Review";
      default:
        return type.replace(/_/g, " ");
    }
  };

  return (
    <AppShell role="entrepreneur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-[var(--color-border)] gap-8">
          <Link
            href="/mentors"
            className="pb-3 text-sm font-medium text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] border-b-2 border-transparent transition-colors"
          >
            Browse Services
          </Link>
          <Link
            href="/mentors/bookings"
            className="pb-3 text-sm font-semibold text-[var(--color-accent)] border-b-2 border-[var(--color-accent)] transition-colors"
          >
            My Bookings
          </Link>
        </div>

        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-accent)] uppercase tracking-wider">
              <Calendar className="w-4 h-4" />
              <span>Phase 3 — Mentor Pro Panel</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-fg)] mt-1">
              My Mentorship Bookings
            </h1>
            <p className="text-sm text-[var(--color-fg-muted)] mt-1">
              Review your scheduled 1-on-1 sessions, track mentor responses, and monitor simulated escrow protection.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-[var(--color-border)] rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50"
              aria-label="Refresh bookings"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
            <Link
              href="/mentors"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] hover:bg-[var(--color-accent-hover)] transition-colors shadow-[var(--shadow-sm)]"
            >
              <span>Book New Session</span>
            </Link>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 px-4 py-3 rounded-[var(--radius-md)] flex items-center justify-between text-sm animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-emerald-700 hover:text-emerald-900"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[var(--color-border)]">
          {TAB_OPTIONS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-[var(--radius-md)] text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-[var(--color-accent)] text-[var(--color-fg-inverse)]"
                  : "bg-[var(--color-surface)] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-fg)] border border-[var(--color-border)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-4 rounded-[var(--radius-md)] flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
            <button
              onClick={handleRefresh}
              className="underline font-semibold hover:text-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 space-y-4 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-border)]" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-[var(--color-border)] rounded w-3/4" />
                    <div className="h-3 bg-[var(--color-border)] rounded w-1/2" />
                  </div>
                </div>
                <div className="h-4 bg-[var(--color-border)] rounded w-full" />
                <div className="h-4 bg-[var(--color-border)] rounded w-2/3" />
                <div className="pt-4 border-t border-[var(--color-border)] flex justify-between">
                  <div className="h-4 bg-[var(--color-border)] rounded w-1/4" />
                  <div className="h-8 bg-[var(--color-border)] rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && bookings.length === 0 && (
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-12 text-center space-y-4 shadow-[var(--shadow-sm)]">
            <div className="w-16 h-16 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] flex items-center justify-center mx-auto">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[var(--color-fg)]">
              No Bookings Found
            </h3>
            <p className="text-sm text-[var(--color-fg-muted)] max-w-md mx-auto">
              {activeTab === "all"
                ? "You haven't requested any mentor sessions yet. Browse our verified Pakistani advisors and book customized strategic guidance."
                : `There are currently no bookings matching the "${activeTab}" status.`}
            </p>
            <div className="pt-2">
              <Link
                href="/mentors"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] hover:bg-[var(--color-accent-hover)] font-semibold text-sm transition-colors shadow-[var(--shadow-sm)]"
              >
                <Search className="w-4 h-4" />
                <span>Browse Mentors & Services</span>
              </Link>
            </div>
          </div>
        )}

        {/* Bookings Grid */}
        {!isLoading && !error && bookings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((booking) => {
              const isEligibleForCancel =
                booking.status === "requested" || booking.status === "accepted";

              return (
                <div
                  key={booking.id}
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-sm)] hover:border-[var(--color-accent)]/50 transition-all flex flex-col justify-between space-y-4"
                >
                  {/* Card Header */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {booking.mentor_avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={booking.mentor_avatar_url}
                            alt={booking.mentor_name}
                            className="w-10 h-10 rounded-full object-cover border border-[var(--color-border)]"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] flex items-center justify-center font-bold text-sm">
                            {booking.mentor_name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-sm text-[var(--color-fg)]">
                            {booking.mentor_name}
                          </h3>
                          <span className="text-xs text-[var(--color-fg-subtle)]">
                            Booked on {new Date(booking.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {getStatusBadge(booking.status)}
                    </div>

                    {/* Service Info */}
                    <div className="space-y-1">
                      <h4 className="font-semibold text-base text-[var(--color-fg)] line-clamp-2">
                        {booking.service_title}
                      </h4>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs px-2 py-0.5 rounded bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[var(--color-fg-muted)]">
                          {formatServiceType(booking.service_type)}
                        </span>
                        <span className="text-xs text-[var(--color-fg-subtle)] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {booking.duration_min} mins
                        </span>
                      </div>
                    </div>

                    {/* Schedule & Escrow Info */}
                    <div className="bg-[var(--color-surface-hover)]/60 rounded-[var(--radius-md)] p-3 space-y-1.5 border border-[var(--color-border)]/50">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--color-fg-muted)] flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[var(--color-fg-subtle)]" />
                          Scheduled:
                        </span>
                        <span className="font-medium text-[var(--color-fg)]">
                          {booking.scheduled_at
                            ? new Date(booking.scheduled_at).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Pending mentor confirmation"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--color-border)]/50">
                        <span className="text-[var(--color-fg-muted)]">Escrow:</span>
                        {getEscrowBadge(booking.payment_status)}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs text-[var(--color-fg-subtle)] block">Amount</span>
                      <span className="text-sm font-bold text-[var(--color-fg)]">
                        Rs {booking.amount_pkr.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {booking.status === "completed" && (
                        <button
                          onClick={() => setBookingToReview(booking)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-[var(--radius-md)] transition-colors flex items-center gap-1"
                        >
                          <span>★</span>
                          <span>Rate &amp; Review</span>
                        </button>
                      )}
                      {booking.status === "reviewed" && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-emerald-600 bg-emerald-500/10 border border-emerald-500/20">
                          <span className="text-amber-500">★</span>
                          Reviewed
                        </span>
                      )}
                      {isEligibleForCancel && (
                        <button
                          onClick={() => setBookingToCancel(booking)}
                          className="px-2.5 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-500/10 rounded-[var(--radius-md)] transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenDetail(booking.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--color-surface-hover)] text-[var(--color-fg)] hover:bg-[var(--color-accent)] hover:text-[var(--color-fg-inverse)] border border-[var(--color-border)] transition-colors"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Slide-over Detail Drawer */}
        {selectedBookingId && (
          <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
            <div className="w-full max-w-lg bg-[var(--color-surface)] h-full shadow-2xl border-l border-[var(--color-border)] flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div className="p-6 border-b border-[var(--color-border)] flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)]">
                    Booking Details
                  </span>
                  <h2 className="text-lg font-bold text-[var(--color-fg)] mt-1">
                    {selectedBooking ? selectedBooking.service_title : "Loading..."}
                  </h2>
                </div>
                <button
                  onClick={handleCloseDetail}
                  className="p-1 rounded-[var(--radius-sm)] text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)]"
                  aria-label="Close drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="p-6 space-y-6 flex-1">
                {isLoadingDetail && (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-4 bg-[var(--color-border)] rounded w-1/2" />
                    <div className="h-16 bg-[var(--color-border)] rounded" />
                    <div className="h-24 bg-[var(--color-border)] rounded" />
                  </div>
                )}

                {detailError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-4 rounded-[var(--radius-md)] text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{detailError}</span>
                  </div>
                )}

                {!isLoadingDetail && selectedBooking && (
                  <>
                    {/* Status & Escrow Bar */}
                    <div className="flex items-center justify-between bg-[var(--color-surface-hover)] p-3 rounded-[var(--radius-md)] border border-[var(--color-border)]">
                      <div>
                        <span className="text-xs text-[var(--color-fg-subtle)] block">Current Status</span>
                        <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-[var(--color-fg-subtle)] block">Payment Protection</span>
                        <div className="mt-1">{getEscrowBadge(selectedBooking.payment_status)}</div>
                      </div>
                    </div>

                    {/* Mentor Information */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider">
                        Assigned Mentor
                      </h4>
                      <div className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
                        {selectedBooking.mentor_avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={selectedBooking.mentor_avatar_url}
                            alt={selectedBooking.mentor_name}
                            className="w-12 h-12 rounded-full object-cover border border-[var(--color-border)]"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] flex items-center justify-center font-bold text-base">
                            {selectedBooking.mentor_name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-sm text-[var(--color-fg)]">
                            {selectedBooking.mentor_name}
                          </h3>
                          <span className="text-xs text-[var(--color-fg-muted)] block">
                            Verified Pakistani Industry Mentor
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Service Description */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider">
                        Service Scope
                      </h4>
                      <p className="text-sm text-[var(--color-fg)] bg-[var(--color-surface-hover)]/40 p-3 rounded-[var(--radius-md)] border border-[var(--color-border)] leading-relaxed">
                        {selectedBooking.service_description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-[var(--color-fg-muted)] pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Duration: {selectedBooking.duration_min} mins
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          Price: Rs {selectedBooking.amount_pkr.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Preferred / Scheduled Date */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider">
                        Session Timing
                      </h4>
                      <div className="p-3 rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-[var(--color-accent)]" />
                        <div>
                          <span className="font-medium text-[var(--color-fg)] block">
                            {selectedBooking.scheduled_at
                              ? new Date(selectedBooking.scheduled_at).toLocaleString(undefined, {
                                  dateStyle: "full",
                                  timeStyle: "short",
                                })
                              : "Not yet scheduled"}
                          </span>
                          <span className="text-xs text-[var(--color-fg-subtle)]">
                            {selectedBooking.status === "requested"
                              ? "The mentor will accept or suggest a time within 48 hours."
                              : "Live session is conducted via Google Meet / Zoom link shared before call."}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Entrepreneur's Goals / Notes */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider">
                        Your Session Goals & Questions
                      </h4>
                      <div className="p-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-fg)] leading-relaxed">
                        {selectedBooking.notes || (
                          <span className="text-[var(--color-fg-subtle)] italic">
                            No initial notes provided during checkout.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Mentor Session Notes (if available) */}
                    {selectedBooking.session_notes && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider">
                          Mentor Session Feedback & Action Items
                        </h4>
                        <div className="p-3 rounded-[var(--radius-md)] border border-emerald-500/20 bg-emerald-500/5 text-sm text-[var(--color-fg)] leading-relaxed">
                          {selectedBooking.session_notes}
                        </div>
                      </div>
                    )}

                    {/* Entrepreneur Review (if reviewed) */}
                    {selectedBooking.review && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-[var(--color-fg-muted)] uppercase tracking-wider">
                          Your Rating & Review
                        </h4>
                        <div className="p-4 rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/5 space-y-2">
                          <div className="flex items-center gap-1 text-amber-500 text-sm">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span key={star}>
                                {star <= selectedBooking.review!.rating ? "★" : "☆"}
                              </span>
                            ))}
                            <span className="ml-2 font-semibold text-xs text-[var(--color-fg)]">
                              {selectedBooking.review.rating} / 5
                            </span>
                          </div>
                          {selectedBooking.review.comment && (
                            <p className="text-sm text-[var(--color-fg)] leading-relaxed italic">
                              &ldquo;{selectedBooking.review.comment}&rdquo;
                            </p>
                          )}
                          <p className="text-[10px] text-[var(--color-fg-subtle)]">
                            Reviewed on{" "}
                            {new Date(selectedBooking.review.created_at).toLocaleDateString(
                              undefined,
                              { month: "short", day: "numeric", year: "numeric" }
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between gap-3">
                <button
                  onClick={handleCloseDetail}
                  className="px-4 py-2 border border-[var(--color-border)] rounded-[var(--radius-md)] text-sm font-medium text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  Close
                </button>

                <div className="flex items-center gap-2">
                  {selectedBooking && selectedBooking.status === "completed" && (
                    <button
                      onClick={() => {
                        setBookingToReview(selectedBooking);
                      }}
                      className="px-4 py-2 bg-[var(--color-accent)] text-white hover:opacity-90 rounded-[var(--radius-md)] text-sm font-semibold transition-opacity flex items-center gap-1.5"
                    >
                      <span>★</span>
                      <span>Rate &amp; Review</span>
                    </button>
                  )}

                  {selectedBooking &&
                    (selectedBooking.status === "requested" ||
                      selectedBooking.status === "accepted") && (
                      <button
                        onClick={() => {
                          setBookingToCancel(selectedBooking);
                        }}
                        className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-[var(--radius-md)] text-sm font-semibold transition-colors"
                      >
                        Cancel Booking
                      </button>
                    )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancellation Confirmation Dialog */}
        {bookingToCancel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-fg)]">
                    Cancel Mentorship Booking?
                  </h3>
                  <p className="text-sm text-[var(--color-fg-muted)] mt-1">
                    Are you sure you want to cancel your session with{" "}
                    <strong>{bookingToCancel.mentor_name}</strong>?
                  </p>
                </div>
              </div>

              <div className="bg-[var(--color-surface-hover)] rounded-[var(--radius-md)] p-3 text-xs text-[var(--color-fg-muted)] space-y-1">
                <p className="font-semibold text-[var(--color-fg)]">Escrow Guarantee:</p>
                <p>
                  Your simulated escrow deposit of{" "}
                  <strong>Rs {bookingToCancel.amount_pkr.toLocaleString()}</strong> will be
                  immediately refunded to your balance.
                </p>
              </div>

              {cancelError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-xs rounded-[var(--radius-md)]">
                  {cancelError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={() => setBookingToCancel(null)}
                  className="px-4 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)] font-medium text-sm transition-colors"
                >
                  Keep Booking
                </button>
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={handleConfirmCancel}
                  className="px-4 py-2 rounded-[var(--radius-md)] bg-red-600 text-white hover:bg-red-700 font-semibold text-sm transition-colors flex items-center gap-2"
                >
                  {isCancelling && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{isCancelling ? "Cancelling..." : "Yes, Cancel Booking"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Review Modal (F-041) */}
        {bookingToReview && (
          <ReviewModal
            isOpen={!!bookingToReview}
            booking={bookingToReview}
            onClose={() => setBookingToReview(null)}
            onSuccess={handleReviewSuccess}
          />
        )}
      </div>
    </AppShell>
  );
}
