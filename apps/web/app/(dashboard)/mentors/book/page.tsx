"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  HelpCircle,
  Loader2,
  MapPin,
  ShieldCheck,
  Star,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  ApiError,
  BookingsService,
  ServicesService,
  type MentorServiceDetailResponse,
} from "@/lib/api";

function BookingFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get("service_id");

  const [service, setService] = useState<MentorServiceDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(serviceId));
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Form state
  const [notes, setNotes] = useState<string>("");
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<{
    id: string;
    mentorName: string;
    serviceTitle: string;
    amountPkr: number;
    status: string;
  } | null>(null);

  useEffect(() => {
    if (!serviceId) return;

    let isMounted = true;
    async function loadService() {
      try {
        setLoading(true);
        setFetchError(null);
        const data = await ServicesService.getServiceApiV1ServicesServiceIdGet({
          serviceId: serviceId as string,
        });
        if (isMounted) {
          setService(data);
        }
      } catch (err) {
        if (!isMounted) return;
        if (err instanceof ApiError) {
          setFetchError(err.body?.detail || "Could not load service details.");
        } else {
          setFetchError("Network error while loading service.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadService();
    return () => {
      isMounted = false;
    };
  }, [serviceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;

    if (!notes.trim()) {
      setSubmitError("Please write what guidance or challenges you'd like to discuss.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      const createdBooking = await BookingsService.bookMentorServiceApiV1BookingsPost({
        requestBody: {
          service_id: service.id,
          notes: notes.trim(),
          scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        },
      });

      setBookingSuccess({
        id: createdBooking.id,
        mentorName: createdBooking.mentor_name,
        serviceTitle: createdBooking.service_title,
        amountPkr: createdBooking.amount_pkr,
        status: createdBooking.status,
      });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setSubmitError(err.body?.detail || "Failed to book mentor service.");
      } else if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Failed to book service. Please check your connection and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent)]" />
        <p className="text-sm text-[var(--color-fg-subtle)]">Loading service details...</p>
      </div>
    );
  }

  if (!serviceId || fetchError || !service) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 text-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)]">
        <HelpCircle className="w-12 h-12 text-[var(--color-warning)] mx-auto mb-4" />
        <h2 className="text-lg font-bold text-[var(--color-fg)]">
          {fetchError || "Service Not Found"}
        </h2>
        <p className="text-sm text-[var(--color-fg-subtle)] mt-2 mb-6">
          Please select an active mentor service from the marketplace to proceed with booking.
        </p>
        <Link
          href="/mentors"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] hover:bg-[var(--color-accent-hover)] font-semibold text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Mentors</span>
        </Link>
      </div>
    );
  }

  // Success view
  if (bookingSuccess) {
    return (
      <div className="max-w-2xl mx-auto my-8 p-8 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-md)]">
        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-[var(--color-fg)]">
            Booking Request Submitted! 🎉
          </h2>
          <p className="text-sm text-[var(--color-fg-subtle)] max-w-md mx-auto">
            Aapki booking request kamyabi se bhej di gai hai. The mentor will review your focus areas and confirm session timing.
          </p>
        </div>

        <div className="my-6 p-5 rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)] border border-[var(--color-border)] space-y-3">
          <div className="flex justify-between items-center text-xs text-[var(--color-fg-subtle)]">
            <span>Booking ID</span>
            <span className="font-mono text-[var(--color-fg)] font-semibold">{bookingSuccess.id.slice(0, 8)}...</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-[var(--color-fg-subtle)]">Mentor</span>
            <span className="font-semibold text-[var(--color-fg)]">{bookingSuccess.mentorName}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-[var(--color-fg-subtle)]">Service</span>
            <span className="font-semibold text-[var(--color-fg)]">{bookingSuccess.serviceTitle}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-[var(--color-fg-subtle)]">Simulated Escrow</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              Rs {bookingSuccess.amountPkr.toLocaleString()} (Held)
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-[var(--color-fg-subtle)]">Status</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              Requested
            </span>
          </div>
        </div>

        <div className="p-4 rounded-[var(--radius-md)] bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-300 leading-relaxed mb-6">
          <div className="font-semibold mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            What happens next?
          </div>
          <p>
            1. {bookingSuccess.mentorName} receives your request and notes.
            <br />
            2. They have 48 hours to accept and coordinate the live session.
            <br />
            3. Your Rs {bookingSuccess.amountPkr.toLocaleString()} will remain safely in escrow until the session is completed.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/mentors"
            className="w-full sm:w-auto px-5 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)] font-medium text-sm text-center transition-colors"
          >
            Browse More Mentors
          </Link>
          <button
            onClick={() => router.push("/mentors/bookings")}
            className="w-full sm:w-auto px-6 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] hover:bg-[var(--color-accent-hover)] font-semibold text-sm transition-colors text-center shadow-[var(--shadow-sm)]"
          >
            View My Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/mentors"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Mentors</span>
        </Link>
        <span className="text-xs text-[var(--color-fg-subtle)] font-medium">
          Step 2 of 2: Confirm Booking
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Mentor & Service Summary + Notes Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Card */}
          <div className="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)]">
            <div className="flex items-start gap-4">
              {service.mentor_avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={service.mentor_avatar_url}
                  alt={service.mentor_name}
                  className="w-14 h-14 rounded-full object-cover border border-[var(--color-border)]"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[var(--color-accent)] text-[var(--color-fg-inverse)] flex items-center justify-center font-bold text-lg">
                  {service.mentor_name.charAt(0)}
                </div>
              )}

              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-[var(--color-fg)]">
                    {service.mentor_name}
                  </h3>
                  <div className="flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{service.mentor_rating.toFixed(1)}</span>
                    <span className="text-[var(--color-fg-subtle)] font-normal">
                      ({service.mentor_review_count})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-[var(--color-fg-subtle)]">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{service.mentor_city}</span>
                  <span>•</span>
                  <span>{service.niche.replace("_", " ").toUpperCase()}</span>
                </div>
              </div>
            </div>

            <hr className="my-4 border-[var(--color-border)]" />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--color-fg)]">
                  {service.title}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[var(--radius-sm)] bg-[var(--color-surface-subtle)] text-xs text-[var(--color-fg)] font-medium">
                    <Clock className="w-3 h-3 text-[var(--color-fg-subtle)]" />
                    {service.duration_min} min
                  </span>
                  <span className="px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-semibold text-2xs uppercase">
                    {service.type.replace("_", " ")}
                  </span>
                </div>
              </div>

              <p className="text-sm text-[var(--color-fg-subtle)] whitespace-pre-wrap leading-relaxed">
                {service.description}
              </p>
            </div>
          </div>

          {/* Booking Inputs Form */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] space-y-5"
          >
            <h3 className="font-bold text-base text-[var(--color-fg)]">
              Session Requirements & Notes
            </h3>

            {submitError && (
              <div
                role="alert"
                className="p-4 rounded-[var(--radius-md)] bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300"
              >
                {submitError}
              </div>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="booking-notes"
                className="block text-xs font-semibold text-[var(--color-fg)] uppercase tracking-wider"
              >
                What would you like guidance on? (Aap kis cheez par mashwara chahte hain?) *
              </label>
              <textarea
                id="booking-notes"
                rows={4}
                required
                maxLength={1000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Meri hand-embroidered kurtis ki pricing calculation samajh nahi aa rahi, packaging aur bulk courier rate negotiate kaise karun?"
                className="w-full px-3.5 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] text-sm text-[var(--color-fg)] focus:outline-hidden focus:ring-2 focus:ring-[var(--color-accent)] resize-y"
              />
              <div className="flex justify-between text-2xs text-[var(--color-fg-subtle)]">
                <span>Provide context so your mentor can prepare effectively.</span>
                <span>{notes.length}/1000</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="booking-schedule"
                className="block text-xs font-semibold text-[var(--color-fg)] uppercase tracking-wider"
              >
                Preferred Date & Time (Optional)
              </label>
              <div className="relative">
                <input
                  id="booking-schedule"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] text-sm text-[var(--color-fg)] focus:outline-hidden focus:ring-2 focus:ring-[var(--color-accent)]"
                />
              </div>
              <span className="block text-2xs text-[var(--color-fg-subtle)]">
                Exact timing can also be adjusted after the mentor accepts your booking request.
              </span>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 font-semibold text-sm transition-colors shadow-[var(--shadow-sm)] flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Booking Request...</span>
                  </>
                ) : (
                  <span>Send Booking Request (Rs {service.price_pkr.toLocaleString()})</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Escrow & Price Breakdown */}
        <div className="space-y-6">
          <div className="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] space-y-5">
            <h3 className="font-bold text-sm uppercase tracking-wider text-[var(--color-fg-subtle)]">
              Payment Summary
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-[var(--color-fg)]">Mentor Session Fee</span>
                <span className="font-medium text-[var(--color-fg)]">
                  Rs {service.price_pkr.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-[var(--color-fg-subtle)]">
                <span>Escrow Processing</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Free (Simulated)</span>
              </div>
              <hr className="border-[var(--color-border)]" />
              <div className="flex justify-between items-center text-base font-bold">
                <span className="text-[var(--color-fg)]">Total Amount</span>
                <span className="text-[var(--color-accent)]">
                  Rs {service.price_pkr.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Escrow Guarantee Box */}
            <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-surface-subtle)] border border-[var(--color-border)] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-fg)]">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Hunar Escrow Guarantee</span>
              </div>
              <p className="text-xs text-[var(--color-fg-subtle)] leading-relaxed">
                Payment is held in simulated escrow and only transferred to the mentor once the session has taken place. Full refund if declined.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-surface-subtle)] border border-[var(--color-border)] text-xs text-[var(--color-fg-subtle)] space-y-2">
            <span className="font-semibold text-[var(--color-fg)] block">Languages Spoken</span>
            <div className="flex flex-wrap gap-1.5">
              {(service.mentor_languages || ["ur", "en"]).map((l) => (
                <span
                  key={l}
                  className="px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--color-surface)] border border-[var(--color-border)] font-medium uppercase text-2xs text-[var(--color-fg)]"
                >
                  {l}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookServicePage() {
  return (
    <AppShell role="entrepreneur" pageTitle="Book Mentor Session">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent)]" />
          </div>
        }
      >
        <BookingFormContent />
      </Suspense>
    </AppShell>
  );
}
