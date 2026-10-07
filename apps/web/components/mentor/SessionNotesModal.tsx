"use client";

import React, { useState } from "react";
import {
  X,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { BookingsService, type BookingDetailResponse } from "@/lib/api";

export interface SessionNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    mentee_name: string;
    service_title: string;
    amount_pkr: number;
    scheduled_at?: string | null;
    session_notes?: string | null;
  } | null;
  onSuccess: (updatedBooking: BookingDetailResponse) => void;
}

function formatPKR(amount: number): string {
  return `PKR ${amount.toLocaleString()}`;
}

export function SessionNotesModal({
  isOpen,
  onClose,
  booking,
  onSuccess,
}: SessionNotesModalProps): React.ReactElement | null {
  const [notes, setNotes] = useState<string>(booking?.session_notes || "");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state if booking changes
  const currentBookingId = booking?.id;
  const [prevBookingId, setPrevBookingId] = useState<string | undefined>(
    currentBookingId
  );
  if (currentBookingId !== prevBookingId) {
    setPrevBookingId(currentBookingId);
    setNotes(booking?.session_notes || "");
    setErrorMessage(null);
  }

  if (!isOpen || !booking) {
    return null;
  }

  const charCount = notes.trim().length;
  const isValidLength = charCount >= 10 && charCount <= 2000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidLength) {
      setErrorMessage(
        charCount < 10
          ? "Please provide at least 10 characters summarizing the session."
          : "Session notes cannot exceed 2,000 characters."
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const updated =
        await BookingsService.submitSessionNotesApiV1BookingsBookingIdNotesPost({
          bookingId: booking.id,
          requestBody: {
            session_notes: notes.trim(),
          },
        });
      onSuccess(updated);
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to record session notes. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-notes-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
              <FileText className="w-4 h-4" />
              <span>Session Notes (F-027)</span>
            </div>
            <h2
              id="session-notes-modal-title"
              className="text-lg font-bold text-foreground"
            >
              Record Advisory Session Notes
            </h2>
            <p className="text-xs text-muted-foreground">
              Summarize guidance, recommendations, and next steps for the mentee.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Session context overview card */}
        <div className="p-3.5 rounded-lg border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Consultation With
            </span>
            <span className="font-semibold text-foreground text-sm block">
              {booking.mentee_name}
            </span>
            <span className="text-muted-foreground block">
              {booking.service_title}
            </span>
          </div>

          <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-border/60 pt-2 sm:pt-0 sm:pl-3 space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Escrow Payout
            </span>
            <span className="font-bold text-emerald-600 text-sm block">
              {formatPKR(booking.amount_pkr)}
            </span>
            <span className="text-[10px] text-muted-foreground block">
              Released upon save
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label
                htmlFor="session-notes-input"
                className="font-medium text-foreground"
              >
                Key Takeaways & Action Items <span className="text-destructive">*</span>
              </label>
              <span
                className={`text-[11px] font-mono ${
                  charCount > 2000
                    ? "text-destructive font-bold"
                    : charCount < 10
                    ? "text-muted-foreground"
                    : "text-emerald-600"
                }`}
              >
                {charCount} / 2,000 characters
              </span>
            </div>

            <textarea
              id="session-notes-input"
              data-testid="session-notes-textarea"
              rows={6}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Conducted detailed unit economics audit. Identified raw material waste in stitching. Recommended standardizing fabric consumption and setting price at PKR 2,400 to achieve 35% margin. Next action: Mentee to revise catalog pricing by next week."
              className="w-full p-3 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 resize-y"
            />
            <p className="text-[11px] text-muted-foreground">
              Minimum 10 characters required. The mentee will be able to review these notes to track their progress.
            </p>
          </div>

          {/* Escrow automated protocol banner */}
          <div className="p-3 rounded-lg border border-emerald-300 bg-emerald-50/60 flex items-start gap-2.5 text-xs text-emerald-950">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <span className="font-semibold block">
                Automated Escrow Protocol (PRD §10 W-005):
              </span>
              <span>
                Saving these notes transitions this booking to{" "}
                <span className="font-semibold text-emerald-700">completed</span> and
                automatically releases{" "}
                <span className="font-semibold text-emerald-700">
                  {formatPKR(booking.amount_pkr)}
                </span>{" "}
                from escrow to your released balance.
              </span>
            </div>
          </div>

          {/* Error display */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 flex items-center gap-2 text-xs text-destructive"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="submit-session-notes-btn"
              disabled={!isValidLength || isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving Notes & Releasing Escrow...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Complete Session & Release Escrow
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
