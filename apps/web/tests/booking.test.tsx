import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BookServicePage from "@/app/(dashboard)/mentors/book/page";
import {
  BookingsService,
  ServicesService,
  type MentorServiceDetailResponse,
  type BookingDetailResponse,
} from "@/lib/api";

const mockPush = vi.fn();
let mockSearchParamServiceId: string | null = "svc-1";

vi.mock("next/navigation", () => ({
  usePathname: () => "/mentors/book",
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === "service_id" ? mockSearchParamServiceId : null),
  }),
}));

const mockServiceDetail: MentorServiceDetailResponse = {
  id: "svc-1",
  mentor_id: "m-1",
  mentor_name: "Tariq Mansoor",
  mentor_avatar_url: null,
  mentor_city: "Lahore",
  mentor_rating: 4.9,
  mentor_review_count: 18,
  title: "1-on-1 Artisanal Product Pricing & Margins",
  description: "Deep dive review of your unit economics, material costs, and packaging margins.",
  niche: "handmade",
  type: "session",
  price_pkr: 3500,
  duration_min: 60,
  active: true,
  created_at: "2026-10-05T12:00:00Z",
  mentor_bio: "Experienced artisan coach scaling craft brands across Pakistan.",
  mentor_languages: ["ur", "roman_ur", "en"],
  mentor_niches: ["handmade", "stitching_fashion"],
};

describe("BookServicePage (Task 35 / F-019)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParamServiceId = "svc-1";
    vi.spyOn(ServicesService, "getServiceApiV1ServicesServiceIdGet").mockReturnValue({
      then: (resolve: (val: unknown) => unknown) => Promise.resolve(resolve(mockServiceDetail)),
    } as ReturnType<typeof ServicesService.getServiceApiV1ServicesServiceIdGet>);
  });

  it("renders service not found when service_id is missing", async () => {
    mockSearchParamServiceId = null;
    render(<BookServicePage />);

    expect(await screen.findByText(/Service Not Found/i)).toBeInTheDocument();
    expect(screen.getByText(/Return to Mentors/i)).toBeInTheDocument();
  });

  it("renders service details and escrow payment summary when service_id is provided", async () => {
    render(<BookServicePage />);

    // Mentor and service info
    expect(await screen.findByText("Tariq Mansoor")).toBeInTheDocument();
    expect(screen.getByText("1-on-1 Artisanal Product Pricing & Margins")).toBeInTheDocument();
    expect(screen.getByText(/60 min/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Rs 3,500/i).length).toBeGreaterThan(0);

    // Escrow guarantee text
    expect(screen.getByText(/Hunar Escrow Guarantee/i)).toBeInTheDocument();
  });

  it("validates that guidance notes are required before submitting", async () => {
    render(<BookServicePage />);

    expect(await screen.findByText("Tariq Mansoor")).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: /Send Booking Request/i });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText(/Please write what guidance or challenges you'd like to discuss/i)
    ).toBeInTheDocument();
  });

  it("submits booking successfully and displays confirmation with escrow details", async () => {
    const mockCreatedBooking: BookingDetailResponse = {
      id: "booking-uuid-12345",
      service_id: "svc-1",
      service_title: "1-on-1 Artisanal Product Pricing & Margins",
      service_type: "session",
      mentor_id: "m-1",
      mentor_name: "Tariq Mansoor",
      mentor_avatar_url: null,
      entrepreneur_id: "e-1",
      entrepreneur_name: "Fatima Ali",
      status: "requested",
      amount_pkr: 3500,
      duration_min: 60,
      scheduled_at: null,
      created_at: "2026-10-06T10:00:00Z",
      notes: "I need help with pricing my handmade leather totes for wholesale.",
      session_notes: null,
      service_description: "Deep dive review...",
      payment_status: "held",
      updated_at: null,
    };

    vi.spyOn(BookingsService, "bookMentorServiceApiV1BookingsPost").mockReturnValue({
      then: (resolve: (val: unknown) => unknown) => Promise.resolve(resolve(mockCreatedBooking)),
    } as ReturnType<typeof BookingsService.bookMentorServiceApiV1BookingsPost>);

    render(<BookServicePage />);

    expect(await screen.findByText("Tariq Mansoor")).toBeInTheDocument();

    const notesInput = screen.getByLabelText(/What would you like guidance on/i);
    fireEvent.change(notesInput, {
      target: { value: "I need help with pricing my handmade leather totes for wholesale." },
    });

    const submitBtn = screen.getByRole("button", { name: /Send Booking Request/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Booking Request Submitted!/i)).toBeInTheDocument();
    expect(screen.getByText(/booking-/i)).toBeInTheDocument();
    expect(screen.getByText(/Rs 3,500 \(Held\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Requested/i)).toBeInTheDocument();
    expect(screen.getByText(/What happens next\?/i)).toBeInTheDocument();
  });
});
