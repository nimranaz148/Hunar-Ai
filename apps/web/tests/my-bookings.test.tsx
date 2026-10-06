import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MyBookingsPage from "@/app/(dashboard)/mentors/bookings/page";
import {
  BookingsService,
  type BookingItemResponse,
  type BookingDetailResponse,
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

const mockBookingsList: BookingItemResponse[] = [
  {
    id: "booking-1",
    service_id: "svc-1",
    service_title: "1-on-1 Artisanal Product Pricing",
    service_type: "session",
    mentor_id: "m-1",
    mentor_name: "Tariq Mansoor",
    mentor_avatar_url: null,
    entrepreneur_id: "ent-1",
    entrepreneur_name: "Fatima Ali",
    status: "requested",
    amount_pkr: 3500,
    duration_min: 60,
    scheduled_at: "2026-10-10T14:00:00Z",
    created_at: "2026-10-06T10:00:00Z",
    payment_status: "held",
  },
  {
    id: "booking-2",
    service_id: "svc-2",
    service_title: "Fashion Brand Growth Package",
    service_type: "package",
    mentor_id: "m-2",
    mentor_name: "Ayesha Malik",
    mentor_avatar_url: null,
    entrepreneur_id: "ent-1",
    entrepreneur_name: "Fatima Ali",
    status: "completed",
    amount_pkr: 7500,
    duration_min: 120,
    scheduled_at: "2026-10-01T11:00:00Z",
    created_at: "2026-09-28T09:00:00Z",
    payment_status: "released",
  },
];

const mockDetailResponse: BookingDetailResponse = {
  id: "booking-1",
  service_id: "svc-1",
  service_title: "1-on-1 Artisanal Product Pricing",
  service_type: "session",
  mentor_id: "m-1",
  mentor_name: "Tariq Mansoor",
  mentor_avatar_url: null,
  entrepreneur_id: "ent-1",
  entrepreneur_name: "Fatima Ali",
  status: "requested",
  amount_pkr: 3500,
  duration_min: 60,
  scheduled_at: "2026-10-10T14:00:00Z",
  created_at: "2026-10-06T10:00:00Z",
  payment_status: "held",
  notes: "Need assistance with wholesale margins for local textile markets.",
  session_notes: null,
  service_description: "Comprehensive financial review of cost structure and markup.",
  updated_at: null,
};

describe("MyBookingsPage (Task 36 / F-020)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(BookingsService, "listUserBookingsApiV1BookingsGet").mockImplementation(() => {
      const response: PaginatedResponse_BookingItemResponse_ = {
        items: mockBookingsList,
        total: mockBookingsList.length,
        page: 1,
        page_size: 50,
      };
      return Promise.resolve(response) as unknown as ReturnType<
        typeof BookingsService.listUserBookingsApiV1BookingsGet
      >;
    });

    vi.spyOn(BookingsService, "getBookingDetailsApiV1BookingsBookingIdGet").mockImplementation(() => {
      return Promise.resolve(mockDetailResponse) as unknown as ReturnType<
        typeof BookingsService.getBookingDetailsApiV1BookingsBookingIdGet
      >;
    });
  });

  it("renders page header and booking cards with mentor and escrow info", async () => {
    render(<MyBookingsPage />);

    expect(await screen.findByText("My Mentorship Bookings")).toBeInTheDocument();
    expect(screen.getByText("Browse Services")).toBeInTheDocument();
    expect(screen.getByText("My Bookings")).toBeInTheDocument();

    // Cards content
    expect(screen.getByText("Tariq Mansoor")).toBeInTheDocument();
    expect(screen.getByText("1-on-1 Artisanal Product Pricing")).toBeInTheDocument();
    expect(screen.getByText("Rs 3,500")).toBeInTheDocument();
    expect(screen.getByText("Escrow Held")).toBeInTheDocument();
    expect(screen.getAllByText("Requested").length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText("Ayesha Malik")).toBeInTheDocument();
    expect(screen.getByText("Fashion Brand Growth Package")).toBeInTheDocument();
    expect(screen.getByText("Rs 7,500")).toBeInTheDocument();
    expect(screen.getByText("Payment Released")).toBeInTheDocument();
    expect(screen.getAllByText("Completed").length).toBeGreaterThanOrEqual(1);
  });

  it("filters bookings when switching status tabs", async () => {
    render(<MyBookingsPage />);

    expect(await screen.findByText("Tariq Mansoor")).toBeInTheDocument();

    // Click 'Completed' tab
    const completedTab = screen.getByRole("button", { name: "Completed" });
    fireEvent.click(completedTab);

    await waitFor(() => {
      expect(BookingsService.listUserBookingsApiV1BookingsGet).toHaveBeenCalledWith(
        expect.objectContaining({ status: "completed" })
      );
    });
  });

  it("opens slide-over detail drawer when clicking Details button", async () => {
    render(<MyBookingsPage />);

    expect(await screen.findByText("Tariq Mansoor")).toBeInTheDocument();

    const detailButtons = screen.getAllByRole("button", { name: /Details/i });
    fireEvent.click(detailButtons[0]);

    expect(await screen.findByText("Booking Details")).toBeInTheDocument();
    expect(screen.getByText("Need assistance with wholesale margins for local textile markets.")).toBeInTheDocument();
    expect(screen.getByText("Comprehensive financial review of cost structure and markup.")).toBeInTheDocument();

    // Close drawer
    const closeButton = screen.getByRole("button", { name: /Close drawer/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText("Booking Details")).not.toBeInTheDocument();
    });
  });

  it("cancels a requested booking and updates status in the list", async () => {
    const updatedResponse: BookingDetailResponse = {
      ...mockDetailResponse,
      status: "cancelled",
      payment_status: "refunded",
    };

    vi.spyOn(BookingsService, "updateBookingDetailsApiV1BookingsBookingIdPatch").mockImplementation(() => {
      return Promise.resolve(updatedResponse) as unknown as ReturnType<
        typeof BookingsService.updateBookingDetailsApiV1BookingsBookingIdPatch
      >;
    });

    render(<MyBookingsPage />);

    expect(await screen.findByText("Tariq Mansoor")).toBeInTheDocument();

    // Click Cancel on the requested booking
    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(cancelButton);

    // Cancel modal appears
    expect(await screen.findByText("Cancel Mentorship Booking?")).toBeInTheDocument();
    expect(screen.getByText(/immediately refunded to your balance/i)).toBeInTheDocument();

    // Confirm cancellation
    const confirmButton = screen.getByRole("button", { name: /Yes, Cancel Booking/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(BookingsService.updateBookingDetailsApiV1BookingsBookingIdPatch).toHaveBeenCalledWith({
        bookingId: "booking-1",
        requestBody: { status: "cancelled" },
      });
      expect(screen.getByText(/Booking successfully cancelled/i)).toBeInTheDocument();
    });
  });

  it("displays empty state when user has no bookings", async () => {
    vi.spyOn(BookingsService, "listUserBookingsApiV1BookingsGet").mockImplementation(() => {
      const emptyResponse: PaginatedResponse_BookingItemResponse_ = {
        items: [],
        total: 0,
        page: 1,
        page_size: 50,
      };
      return Promise.resolve(emptyResponse) as unknown as ReturnType<
        typeof BookingsService.listUserBookingsApiV1BookingsGet
      >;
    });

    render(<MyBookingsPage />);

    expect(await screen.findByText("No Bookings Found")).toBeInTheDocument();
    expect(screen.getByText("Browse Mentors & Services")).toBeInTheDocument();
  });
});
