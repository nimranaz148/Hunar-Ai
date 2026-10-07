import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import MentorEarningsPage from "@/app/(dashboard)/mentor/earnings/page";
import { MentorsService, type MentorEarningsResponse } from "@/lib/api";

// Mock next/navigation
let mockPeriodQuery = "all";
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === "period" ? mockPeriodQuery : null),
  }),
}));

const mockEmptyEarnings: MentorEarningsResponse = {
  total_earned_pkr: 0,
  pending_escrow_pkr: 0,
  total_refunded_pkr: 0,
  completed_sessions_count: 0,
  average_session_fee_pkr: 0,
  period: "all",
  period_label: "All Time",
  monthly_trend: [],
  transactions: [],
};

const mockPopulatedEarnings: MentorEarningsResponse = {
  total_earned_pkr: 15000,
  pending_escrow_pkr: 5000,
  total_refunded_pkr: 3000,
  completed_sessions_count: 3,
  average_session_fee_pkr: 5000,
  period: "all",
  period_label: "All Time",
  monthly_trend: [
    {
      year: 2026,
      month: 9,
      month_label: "Sep 2026",
      sessions_completed: 1,
      earned_pkr: 5000,
      refunded_pkr: 0,
    },
    {
      year: 2026,
      month: 10,
      month_label: "Oct 2026",
      sessions_completed: 2,
      earned_pkr: 10000,
      refunded_pkr: 3000,
    },
  ],
  transactions: [
    {
      booking_id: "booking-001",
      mentee_name: "Amina Khan",
      service_title: "Handmade Cost & Pricing Audit",
      service_type: "session",
      amount_pkr: 5000,
      payment_status: "released",
      booking_status: "completed",
      created_at: "2026-10-01T10:00:00Z",
    },
    {
      booking_id: "booking-002",
      mentee_name: "Sara Ali",
      service_title: "1-on-1 Growth Strategy",
      service_type: "session",
      amount_pkr: 5000,
      payment_status: "held",
      booking_status: "scheduled",
      created_at: "2026-10-04T12:00:00Z",
    },
    {
      booking_id: "booking-003",
      mentee_name: "Fatima Noor",
      service_title: "Packaging Consultation",
      service_type: "session",
      amount_pkr: 3000,
      payment_status: "refunded",
      booking_status: "cancelled",
      created_at: "2026-09-25T14:00:00Z",
    },
  ],
};

describe("MentorEarningsPage (Task 42 / F-026)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPeriodQuery = "all";
  });

  it("renders empty state and 0 PKR KPIs when mentor has no earnings", async () => {
    vi.spyOn(
      MentorsService,
      "getOwnEarningsApiV1MentorsMeEarningsGet"
    ).mockResolvedValue(mockEmptyEarnings);

    render(<MentorEarningsPage />);

    expect(
      screen.getByText(/Loading your earnings and escrow report\.\.\./i)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Earnings & Escrow Ledger")).toBeInTheDocument();
      expect(screen.getByText("No transactions found")).toBeInTheDocument();
    });

    expect(screen.getByText("Total Earned")).toBeInTheDocument();
    expect(screen.getByText("In Escrow (Pending)")).toBeInTheDocument();
    expect(screen.getByText("Sessions Delivered")).toBeInTheDocument();
  });

  it("renders 4 KPI metrics, monthly trend chart, and transaction ledger rows", async () => {
    vi.spyOn(
      MentorsService,
      "getOwnEarningsApiV1MentorsMeEarningsGet"
    ).mockResolvedValue(mockPopulatedEarnings);

    render(<MentorEarningsPage />);

    await waitFor(() => {
      expect(screen.getByText("PKR 15,000")).toBeInTheDocument();
      expect(screen.getAllByText("PKR 5,000").length).toBeGreaterThan(0);
      expect(screen.getByText("Amina Khan")).toBeInTheDocument();
      expect(screen.getByText("Sara Ali")).toBeInTheDocument();
      expect(screen.getByText("Fatima Noor")).toBeInTheDocument();
    });

    // Check Monthly trend
    expect(screen.getByText("Monthly Earnings Trend")).toBeInTheDocument();
    expect(screen.getByText("Sep 2026")).toBeInTheDocument();
    expect(screen.getByText("Oct 2026")).toBeInTheDocument();

    // Check Trust disclosure banner
    expect(
      screen.getByText(/Simulated Escrow Payout Protocol:/i)
    ).toBeInTheDocument();
  });

  it("filters transactions by search query input", async () => {
    vi.spyOn(
      MentorsService,
      "getOwnEarningsApiV1MentorsMeEarningsGet"
    ).mockResolvedValue(mockPopulatedEarnings);

    render(<MentorEarningsPage />);

    await waitFor(() => {
      expect(screen.getByText("Amina Khan")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      /Search transactions by mentee name or session title/i
    );
    fireEvent.change(searchInput, { target: { value: "Amina" } });

    expect(screen.getByText("Amina Khan")).toBeInTheDocument();
    expect(screen.queryByText("Sara Ali")).not.toBeInTheDocument();
    expect(screen.queryByText("Fatima Noor")).not.toBeInTheDocument();
  });

  it("filters transactions by escrow status pill tabs", async () => {
    vi.spyOn(
      MentorsService,
      "getOwnEarningsApiV1MentorsMeEarningsGet"
    ).mockResolvedValue(mockPopulatedEarnings);

    render(<MentorEarningsPage />);

    await waitFor(() => {
      expect(screen.getByText("Amina Khan")).toBeInTheDocument();
    });

    // Click "In Escrow" filter pill
    const escrowPill = screen.getByRole("button", { name: "In Escrow" });
    fireEvent.click(escrowPill);

    expect(screen.queryByText("Amina Khan")).not.toBeInTheDocument();
    expect(screen.getByText("Sara Ali")).toBeInTheDocument();
    expect(screen.queryByText("Fatima Noor")).not.toBeInTheDocument();

    // Click "Refunded" filter pill
    const refundedPill = screen.getByRole("button", { name: "Refunded" });
    fireEvent.click(refundedPill);

    expect(screen.queryByText("Amina Khan")).not.toBeInTheDocument();
    expect(screen.queryByText("Sara Ali")).not.toBeInTheDocument();
    expect(screen.getByText("Fatima Noor")).toBeInTheDocument();
  });

  it("switches period tab and requests updated report from API", async () => {
    const fetchSpy = vi
      .spyOn(MentorsService, "getOwnEarningsApiV1MentorsMeEarningsGet")
      .mockResolvedValue(mockPopulatedEarnings);

    render(<MentorEarningsPage />);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith({ period: "all" });
    });

    // Click "This Month" tab
    const thisMonthBtn = screen.getByRole("button", { name: "This Month" });
    fireEvent.click(thisMonthBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith({ period: "this_month" });
    });
  });

  it("displays error state with retry on API failure", async () => {
    const fetchSpy = vi
      .spyOn(MentorsService, "getOwnEarningsApiV1MentorsMeEarningsGet")
      .mockRejectedValueOnce(new Error("Network connection error"));

    render(<MentorEarningsPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load earnings")).toBeInTheDocument();
      expect(
        screen.getByText("Network connection error")
      ).toBeInTheDocument();
    });

    fetchSpy.mockResolvedValueOnce(mockPopulatedEarnings);
    const retryBtn = screen.getByRole("button", { name: /Try Again/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText("Amina Khan")).toBeInTheDocument();
    });
  });
});
