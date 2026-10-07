import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MentorDashboardPage from "@/app/(dashboard)/mentor/page";
import {
  MentorsService,
  BookingsService,
  type MentorDashboardResponse,
} from "@/lib/api";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/mentor",
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

const mockDashboardData: MentorDashboardResponse = {
  pending_requests_count: 1,
  upcoming_sessions_count: 1,
  total_earnings_pkr: 7500,
  average_rating: 4.9,
  review_count: 8,
  pending_requests: [
    {
      id: "booking-req-001",
      service_id: "service-001",
      service_title: "Handmade Cost & Pricing Audit",
      service_type: "session",
      entrepreneur_id: "ent-001",
      entrepreneur_name: "Fatima Noor",
      status: "requested",
      amount_pkr: 3500,
      duration_min: 60,
      notes: "Need urgent advice on my crochet winter collection margins.",
      session_notes: null,
      payment_status: "held",
      created_at: "2026-10-06T10:00:00Z",
    },
  ],
  upcoming_sessions: [
    {
      id: "booking-up-002",
      service_id: "service-002",
      service_title: "1-on-1 Stitching Studio Launch",
      service_type: "session",
      entrepreneur_id: "ent-002",
      entrepreneur_name: "Zainab Bibi",
      status: "scheduled",
      amount_pkr: 4000,
      duration_min: 45,
      scheduled_at: "2026-10-10T14:00:00Z",
      notes: "Prepping factory patterns.",
      session_notes: null,
      payment_status: "held",
      created_at: "2026-10-05T09:00:00Z",
    },
  ],
  recent_reviews: [],
};

describe("MentorDashboardPage (Task 40 / F-024 / D-002)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(
      MentorsService,
      "getOwnDashboardApiV1MentorsMeDashboardGet"
    ).mockImplementation(() => {
      return Promise.resolve(mockDashboardData) as unknown as ReturnType<
        typeof MentorsService.getOwnDashboardApiV1MentorsMeDashboardGet
      >;
    });

    vi.spyOn(
      BookingsService,
      "updateBookingDetailsApiV1BookingsBookingIdPatch"
    ).mockImplementation(() => {
      return Promise.resolve({
        id: "booking-req-001",
        status: "accepted",
      }) as unknown as ReturnType<
        typeof BookingsService.updateBookingDetailsApiV1BookingsBookingIdPatch
      >;
    });
  });

  it("renders 4 core KPI summary cards (PRD §7 D-002)", async () => {
    render(<MentorDashboardPage />);

    await waitFor(() => {
      expect(screen.queryByText(/loading mentor dashboard/i)).not.toBeInTheDocument();
    });

    // Check KPI counts and values
    expect(screen.getAllByText("Pending Requests").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Upcoming Sessions").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Total Earnings")).toBeInTheDocument();
    expect(screen.getByText("Client Rating")).toBeInTheDocument();

    // Check formatted values
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1); // pending and upcoming count
    expect(screen.getByText(/PKR\s*7,500/i)).toBeInTheDocument(); // earnings in PKR
    expect(screen.getByText(/4\.9/)).toBeInTheDocument(); // rating
    expect(screen.getByText(/8 client reviews/i)).toBeInTheDocument();
  });

  it("renders pending booking requests with mentee notes and fee", async () => {
    render(<MentorDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Fatima Noor")).toBeInTheDocument();
    });

    expect(screen.getByText("Handmade Cost & Pricing Audit")).toBeInTheDocument();
    expect(screen.getByText(/Need urgent advice on my crochet winter collection margins/i)).toBeInTheDocument();
    expect(screen.getByText(/PKR\s*3,500/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /accept request/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /decline/i })).toBeInTheDocument();
  });

  it("accepts a pending booking request via BookingsService", async () => {
    const updateSpy = vi.spyOn(
      BookingsService,
      "updateBookingDetailsApiV1BookingsBookingIdPatch"
    );

    render(<MentorDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Fatima Noor")).toBeInTheDocument();
    });

    const acceptButton = screen.getByRole("button", { name: /accept request/i });
    fireEvent.click(acceptButton);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith({
        bookingId: "booking-req-001",
        requestBody: { status: "accepted" },
      });
      expect(screen.getByText(/accepted booking request from Fatima Noor/i)).toBeInTheDocument();
    });
  });

  it("opens decline confirmation modal and confirms decline", async () => {
    const updateSpy = vi.spyOn(
      BookingsService,
      "updateBookingDetailsApiV1BookingsBookingIdPatch"
    );

    render(<MentorDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Fatima Noor")).toBeInTheDocument();
    });

    const declineButton = screen.getByRole("button", { name: /decline/i });
    fireEvent.click(declineButton);

    // Modal is rendered
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Decline Booking Request\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Held amount of PKR\s*3,500 will be automatically refunded/i)).toBeInTheDocument();

    const confirmButton = screen.getByRole("button", { name: /confirm decline/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith({
        bookingId: "booking-req-001",
        requestBody: { status: "declined" },
      });
    });
  });

  it("renders upcoming sessions section with mentee details", async () => {
    render(<MentorDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Zainab Bibi")).toBeInTheDocument();
    });

    expect(screen.getByText("1-on-1 Stitching Studio Launch")).toBeInTheDocument();
    expect(screen.getByText(/45 min/i)).toBeInTheDocument();
    expect(screen.getByText(/Fee: PKR\s*4,000/i)).toBeInTheDocument();
  });

  it("renders empty state gracefully when there are no requests or upcoming sessions", async () => {
    vi.spyOn(
      MentorsService,
      "getOwnDashboardApiV1MentorsMeDashboardGet"
    ).mockImplementation(() => {
      return Promise.resolve({
        pending_requests_count: 0,
        upcoming_sessions_count: 0,
        total_earnings_pkr: 0,
        average_rating: 5.0,
        review_count: 0,
        pending_requests: [],
        upcoming_sessions: [],
        recent_reviews: [],
      }) as unknown as ReturnType<
        typeof MentorsService.getOwnDashboardApiV1MentorsMeDashboardGet
      >;
    });

    render(<MentorDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("No pending requests")).toBeInTheDocument();
      expect(screen.getByText("No upcoming sessions scheduled")).toBeInTheDocument();
    });
  });
});
