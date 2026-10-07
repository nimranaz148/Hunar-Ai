"use client";

import React, { useState } from "react";
import {
  X,
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { BookingsService, type BookingDetailResponse } from "@/lib/api";

export interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    mentor_name: string;
    service_title: string;
    amount_pkr?: number;
    scheduled_at?: string | null;
  } | null;
  onSuccess: (updatedBooking: BookingDetailResponse) => void;
}

const RATING_LABELS: Record<number, string> = {
  1: "Needs Improvement",
  2: "Fair",
  3: "Good",
  4: "Very Helpful",
  5: "Excellent & Highly Recommended",
};

export function ReviewModal({
  isOpen,
  onClose,
  booking,
  onSuccess,
}: ReviewModalProps): React.ReactElement | null {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state if booking changes
  const currentBookingId = booking?.id;
  const [prevBookingId, setPrevBookingId] = useState<string | undefined>(
    currentBookingId
  );
  if (currentBookingId !== prevBookingId) {
    setPrevBookingId(currentBookingId);
    setRating(0);
    setHoverRating(0);
    setComment("");
    setErrorMessage(null);
  }

  if (!isOpen || !booking) {
    return null;
  }

  const charCount = comment.trim().length;
  const isValidLength = charCount <= 1000;
  const activeStars = hoverRating || rating;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (rating < 1 || rating > 5) {
      setErrorMessage("Please select a rating between 1 and 5 stars.");
      return;
    }

    if (!isValidLength) {
      setErrorMessage("Review comment cannot exceed 1000 characters.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    BookingsService.submitBookingReviewApiV1BookingsBookingIdReviewPost({
      bookingId: booking.id,
      requestBody: {
        rating,
        comment: comment.trim() || undefined,
      },
    })
      .then((updatedBooking) => {
        onSuccess(updatedBooking);
        onClose();
      })
      .catch((err: unknown) => {
        const errorObj = err as {
          body?: { detail?: string };
          message?: string;
        };
        const msg =
          errorObj?.body?.detail ||
          errorObj?.message ||
          "Failed to submit review. Please try again.";
        setErrorMessage(msg);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] flex items-center justify-center">
              <Star className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3
                id="review-modal-title"
                className="font-bold text-base text-[var(--color-fg)] leading-tight"
              >
                Rate & Review Session
              </h3>
              <p className="text-xs text-[var(--color-fg-muted)]">
                F-041 Post-Session Review
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-md text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
            aria-label="Close review modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Booking Context Banner */}
          <div className="p-3.5 bg-[var(--color-canvas)] rounded-[var(--radius-md)] border border-[var(--color-border)] text-xs space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[var(--color-fg-muted)]">Mentor:</span>
              <span className="font-semibold text-[var(--color-fg)]">
                {booking.mentor_name}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--color-fg-muted)]">Service:</span>
              <span className="font-medium text-[var(--color-fg)] line-clamp-1">
                {booking.service_title}
              </span>
            </div>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3 bg-[var(--color-danger-subtle)] border border-[var(--color-danger-border)] rounded-[var(--radius-md)] flex items-start gap-2.5 text-xs text-[var(--color-danger)] font-medium"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Star Rating Selector */}
          <div className="space-y-2 text-center py-2">
            <label className="block text-xs font-semibold text-[var(--color-fg)] uppercase tracking-wider">
              Overall Experience <span className="text-[var(--color-danger)]">*</span>
            </label>
            <div
              className="flex justify-center items-center gap-2"
              role="radiogroup"
              aria-label="Star rating"
            >
              {[1, 2, 3, 4, 5].map((starValue) => {
                const isSelected = activeStars >= starValue;
                return (
                  <button
                    key={starValue}
                    type="button"
                    onClick={() => setRating(starValue)}
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(0)}
                    disabled={isSubmitting}
                    aria-label={`${starValue} star${starValue > 1 ? "s" : ""}`}
                    className="p-1 rounded-full transition-transform hover:scale-125 focus:outline-hidden focus:ring-2 focus:ring-[var(--color-accent)] cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        isSelected
                          ? "text-amber-400 fill-amber-400"
                          : "text-zinc-300 dark:text-zinc-600 hover:text-amber-300"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-xs font-medium text-[var(--color-accent)] h-4">
              {RATING_LABELS[activeStars] || ""}
            </p>
          </div>

          {/* Comment Textarea */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label
                htmlFor="review-comment"
                className="text-xs font-semibold text-[var(--color-fg)] flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[var(--color-fg-muted)]" />
                <span>Written Feedback (Optional)</span>
              </label>
              <span
                className={`text-[10px] font-mono ${
                  isValidLength
                    ? "text-[var(--color-fg-muted)]"
                    : "text-[var(--color-danger)] font-bold"
                }`}
              >
                {charCount}/1000
              </span>
            </div>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              disabled={isSubmitting}
              placeholder="What went well? How did this session help your home business? Share actionable feedback for your mentor..."
              rows={4}
              className="w-full p-3 rounded-[var(--radius-md)] bg-[var(--color-canvas)] border border-[var(--color-border)] text-xs text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] outline-none resize-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all disabled:opacity-50"
            />
          </div>

          {/* Trust Banner */}
          <div className="p-2.5 rounded-[var(--radius-md)] bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>
              Your feedback is verified and helps prospective Pakistani women entrepreneurs find the right mentors.
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-[var(--radius-md)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rating === 0 || !isValidLength}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] hover:bg-[var(--color-accent-hover)] transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting Review...</span>
                </>
              ) : (
                <>
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>Submit Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
