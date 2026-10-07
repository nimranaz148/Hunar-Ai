import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { SessionNotesModal } from "@/components/mentor/SessionNotesModal";
import { BookingsService, type BookingDetailResponse } from "@/lib/api";

const mockBooking = {
  id: "booking-123-abc",
  mentee_name: "Amina Khan",
  service_title: "Handmade Cost & Pricing Strategy",
  amount_pkr: 4000,
  scheduled_at: "2026-10-10T10:00:00Z",
  session_notes: null,
};

const mockUpdatedBooking: BookingDetailResponse = {
  id: "booking-123-abc",
  service_id: "service-001",
  service_title: "Handmade Cost & Pricing Strategy",
  service_type: "session",
  mentor_id: "mentor-001",
  mentor_name: "Tariq Mansoor",
  entrepreneur_id: "ent-001",
  entrepreneur_name: "Amina Khan",
  status: "completed",
  amount_pkr: 4000,
  duration_min: 60,
  scheduled_at: "2026-10-10T10:00:00Z",
  created_at: "2026-10-05T09:00:00Z",
  notes: "Need help with pricing.",
  session_notes: "Reviewed cost sheet and recommended 35% margin pricing.",
  service_description: "Unit economics session.",
  payment_status: "released",
};

describe("SessionNotesModal (Task 43 / F-027)", () => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(
      <SessionNotesModal
        isOpen={false}
        booking={mockBooking}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
    expect(screen.queryByText("Record Advisory Session Notes")).not.toBeInTheDocument();
  });

  it("renders modal with booking context, mentee name, fee, and escrow guarantee", () => {
    render(
      <SessionNotesModal
        isOpen={true}
        booking={mockBooking}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    expect(screen.getByText("Record Advisory Session Notes")).toBeInTheDocument();
    expect(screen.getByText("Amina Khan")).toBeInTheDocument();
    expect(screen.getByText("Handmade Cost & Pricing Strategy")).toBeInTheDocument();
    expect(screen.getAllByText("PKR 4,000").length).toBeGreaterThan(0);
    expect(screen.getByText(/Automated Escrow Protocol/i)).toBeInTheDocument();
  });

  it("disables submit button when note text is under 10 characters", () => {
    render(
      <SessionNotesModal
        isOpen={true}
        booking={mockBooking}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    const submitBtn = screen.getByTestId("submit-session-notes-btn");
    expect(submitBtn).toBeDisabled();

    const textarea = screen.getByTestId("session-notes-textarea");
    fireEvent.change(textarea, { target: { value: "Short" } });

    expect(submitBtn).toBeDisabled();
    expect(screen.getByText("5 / 2,000 characters")).toBeInTheDocument();
  });

  it("submits session notes and calls onSuccess upon success", async () => {
    const submitSpy = vi
      .spyOn(
        BookingsService,
        "submitSessionNotesApiV1BookingsBookingIdNotesPost"
      )
      .mockResolvedValueOnce(mockUpdatedBooking);

    render(
      <SessionNotesModal
        isOpen={true}
        booking={mockBooking}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    const textarea = screen.getByTestId("session-notes-textarea");
    const notesContent =
      "Reviewed raw material consumption. Recommended setting unit price to PKR 1,800.";
    fireEvent.change(textarea, { target: { value: notesContent } });

    const submitBtn = screen.getByTestId("submit-session-notes-btn");
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledWith({
        bookingId: "booking-123-abc",
        requestBody: {
          session_notes: notesContent,
        },
      });
      expect(onSuccess).toHaveBeenCalledWith(mockUpdatedBooking);
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("displays error message if submission fails", async () => {
    vi.spyOn(
      BookingsService,
      "submitSessionNotesApiV1BookingsBookingIdNotesPost"
    ).mockRejectedValueOnce(new Error("Database connection timed out"));

    render(
      <SessionNotesModal
        isOpen={true}
        booking={mockBooking}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    const textarea = screen.getByTestId("session-notes-textarea");
    fireEvent.change(textarea, {
      target: { value: "Comprehensive advisory notes for pricing review." },
    });

    const submitBtn = screen.getByTestId("submit-session-notes-btn");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Database connection timed out")
      ).toBeInTheDocument();
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  it("calls onClose when cancel or close button is clicked", () => {
    render(
      <SessionNotesModal
        isOpen={true}
        booking={mockBooking}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    const cancelBtn = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalled();

    const closeIconBtn = screen.getByLabelText("Close modal");
    fireEvent.click(closeIconBtn);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
