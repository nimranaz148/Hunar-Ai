import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ReviewModal } from "@/components/mentor/ReviewModal";
import MyBookingsPage from "@/app/(dashboard)/mentors/bookings/page";
import {
  BookingsService,
  type BookingItemResponse,
  type BookingDetailResponse,
  type BookingReviewResponse,
  type PaginatedResponse_BookingItemResponse_,
} from "@/lib/api";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/mentors/bookings",
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

const mockCompletedBooking: BookingItemResponse = {
  id: "booking-completed-1",
  service_id: "svc-1",
  service_title: "1-on-1 Artisanal Product Pricing",
  service_type: "session",
  mentor_id: "m-1",
  mentor_name: "Tariq Mansoor",
  mentor_avatar_url: null,
  entrepreneur_id: "ent-1",
  entrepreneur_name: "Fatima Ali",
  status: "completed",
  amount_pkr: 3500,
  duration_min: 60,
  scheduled_at: "2026-10-01T14:00:00Z",
  created_at: "2026-09-28T10:00:00Z",
  payment_status: "released",
};

const mockReviewedBooking: BookingItemResponse = {
  id: "booking-reviewed-2",
  service_id: "svc-2",
  service_title: "Fashion Brand Growth Package",
  service_type: "package",
  mentor_id: "m-2",
  mentor_name: "Ayesha Malik",
  mentor_avatar_url: null,
  entrepreneur_id: "ent-1",
  entrepreneur_name: "Fatima Ali",
  status: "reviewed",
  amount_pkr: 7500,
  duration_min: 120,
  scheduled_at: "2026-09-20T11:00:00Z",
  created_at: "2026-09-18T09:00:00Z",
  payment_status: "released",
};

const mockReviewResponse: BookingReviewResponse = {
  id: "review-1",
  booking_id: "booking-completed-1",
  mentor_id: "m-1",
  entrepreneur_id: "ent-1",
  rating: 5,
  comment: "Exceptional session! Tariq gave clear actionable steps for wholesale margins.",
  created_at: "2026-10-07T12:00:00Z",
};

const mockUpdatedBookingDetail: BookingDetailResponse = {
  ...mockCompletedBooking,
  payment_status: "released",
  status: "reviewed",
  notes: "Need assistance with wholesale margins.",
  session_notes: "Reviewed cost formulas.",
  service_description: "Comprehensive financial review.",
  updated_at: "2026-10-07T12:00:00Z",
  review: mockReviewResponse,
};

describe("ReviewModal (Task 46 / F-041)", () => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders modal with booking and mentor details", () => {
    render(
      <ReviewModal
        isOpen={true}
        booking={mockCompletedBooking}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    expect(screen.getByText("Rate & Review Session")).toBeInTheDocument();
    expect(screen.getByText("Tariq Mansoor")).toBeInTheDocument();
    expect(screen.getByText("1-on-1 Artisanal Product Pricing")).toBeInTheDocument();
    expect(screen.getByText(/Overall Experience/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/What went well/i)).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <ReviewModal
        isOpen={false}
        booking={mockCompletedBooking}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("enforces rating selection before submission", async () => {
    render(
      <ReviewModal
        isOpen={true}
        booking={mockCompletedBooking}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    const submitBtn = screen.getByRole("button", { name: /Submit Review/i });
    expect(submitBtn).toBeDisabled();

    // Select 4 stars
    const starButtons = screen.getAllByRole("button", { name: /\d stars?/i });
    expect(starButtons).toHaveLength(5);
    fireEvent.click(starButtons[3]); // 4th star (rating 4)

    expect(submitBtn).not.toBeDisabled();
    expect(screen.getByText("Very Helpful")).toBeInTheDocument();
  });

  it("submits review successfully and triggers onSuccess", async () => {
    const submitSpy = vi
      .spyOn(BookingsService, "submitBookingReviewApiV1BookingsBookingIdReviewPost")
      .mockImplementation(() => {
        return Promise.resolve(mockUpdatedBookingDetail) as unknown as ReturnType<
          typeof BookingsService.submitBookingReviewApiV1BookingsBookingIdReviewPost
        >;
      });

    render(
      <ReviewModal
        isOpen={true}
        booking={mockCompletedBooking}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    // Select 5 stars
    const starButtons = screen.getAllByRole("button", { name: /\d stars?/i });
    fireEvent.click(starButtons[4]); // 5 stars

    // Enter comment
    const textarea = screen.getByPlaceholderText(/What went well/i);
    fireEvent.change(textarea, {
      target: { value: "Exceptional session! Tariq gave clear actionable steps for wholesale margins." },
    });

    const submitBtn = screen.getByRole("button", { name: /Submit Review/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledWith({
        bookingId: "booking-completed-1",
        requestBody: {
          rating: 5,
          comment: "Exceptional session! Tariq gave clear actionable steps for wholesale margins.",
        },
      });
      expect(onSuccess).toHaveBeenCalledWith(mockUpdatedBookingDetail);
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("handles submission error gracefully", async () => {
    vi.spyOn(BookingsService, "submitBookingReviewApiV1BookingsBookingIdReviewPost").mockRejectedValue({
      body: { detail: "Booking already reviewed" },
    });

    render(
      <ReviewModal
        isOpen={true}
        booking={mockCompletedBooking}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    const starButtons = screen.getAllByRole("button", { name: /\d stars?/i });
    fireEvent.click(starButtons[2]); // 3 stars

    const submitBtn = screen.getByRole("button", { name: /Submit Review/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Booking already reviewed")).toBeInTheDocument();
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });
});

describe("MyBookingsPage Review Integration (Task 46 / F-041)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(BookingsService, "listUserBookingsApiV1BookingsGet").mockResolvedValue({
      items: [mockCompletedBooking, mockReviewedBooking],
      total: 2,
      page: 1,
      page_size: 50,
    } as unknown as PaginatedResponse_BookingItemResponse_);
  });

  it("renders Rate & Review button for completed bookings and Reviewed badge for reviewed bookings", async () => {
    render(<MyBookingsPage />);

    await waitFor(() => {
      expect(screen.getByText("1-on-1 Artisanal Product Pricing")).toBeInTheDocument();
    });

    // Completed card should have Rate & Review button
    const reviewBtn = screen.getByRole("button", { name: /Rate & Review/i });
    expect(reviewBtn).toBeInTheDocument();

    // Reviewed card should show Reviewed badge
    const reviewedBadges = screen.getAllByText(/Reviewed/i);
    expect(reviewedBadges.length).toBeGreaterThan(0);
  });

  it("opens ReviewModal when clicking Rate & Review", async () => {
    render(<MyBookingsPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Rate & Review/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Rate & Review/i }));

    expect(screen.getByText("Rate & Review Session")).toBeInTheDocument();
    expect(screen.getAllByText("Tariq Mansoor").length).toBeGreaterThanOrEqual(2);
  });
});
