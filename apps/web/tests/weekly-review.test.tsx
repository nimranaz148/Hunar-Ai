import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { WeeklyReviewGateModal } from "@/components/metrics/WeeklyReviewGateModal";
import PerformanceMetricsPage from "@/app/(dashboard)/metrics/page";
import {
  BusinessService,
  MetricsService,
  ContentService,
  ProposalsService,
  type BusinessResponse,
  type MetricsSnapshotResponse,
  type MetricsProgressResponse,
  type PaginatedResponse_MetricsSnapshotResponse_,
  type MetricsChartsResponse,
  type ProposalDetailResponse,
} from "@/lib/api";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/metrics",
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

const mockProposal: ProposalDetailResponse = {
  id: "prop-123",
  business_id: "biz-123",
  gate_type: "weekly_review",
  status: "pending",
  payload: {
    diagnosis: {
      best_format: "reel",
      best_day: "Wednesday",
      engagement_trend: "+28%",
      revenue_trend: "+20%",
      total_views: 6500,
      total_revenue_pkr: 22000,
      total_inquiries: 18,
      total_orders: 5,
      days_analyzed: 3,
    },
    coach_rationale: "Reels are generating 3x more DMs and buyer interest in Lahore. Shift upcoming static slots to process reels.",
    proposed_adjustments: [
      {
        item_id: "item-1",
        day: 5,
        current_format: "static",
        proposed_format: "reel",
        current_hook: "Check out our collection",
        proposed_hook: "Dekhein yeh hand embroidery kurta kaise banta hai!",
        recommended_hashtags: ["#embroideryreel", "#lahorecrafts"],
        rationale: "Reels encourage viral reach on Instagram.",
      },
    ],
    mentor_recommendation: "Book a 1-on-1 session with a Sales Mentor to convert DMs into paid advance bookings.",
  },
  created_at: "2026-10-08T12:00:00Z",
};

const mockBusiness: BusinessResponse = {
  id: "biz-123",
  name: "Zainab Handmade",
  niche: "Embroidery",
  city: "Lahore",
  budget_pkr: 25000,
  hours_per_week: 20,
  tone: "friendly",
  languages: ["Urdu"],
  platforms: ["instagram", "facebook"],
  owner_id: "user-123",
  created_at: "2026-10-01T00:00:00Z",
};

const mockSnapshots: MetricsSnapshotResponse[] = [
  {
    id: "snap-1",
    business_id: "biz-123",
    platform: "instagram",
    period_start: "2026-10-01",
    period_end: "2026-10-01",
    views: 2000,
    reach: 1500,
    likes: 150,
    comments: 20,
    shares: 10,
    saves: 25,
    follower_delta: 5,
    inquiries: 6,
    orders: 2,
    revenue_pkr: 6000,
    created_at: "2026-10-01T20:00:00Z",
  },
  {
    id: "snap-2",
    business_id: "biz-123",
    platform: "instagram",
    period_start: "2026-10-02",
    period_end: "2026-10-02",
    views: 2500,
    reach: 1800,
    likes: 220,
    comments: 30,
    shares: 15,
    saves: 40,
    follower_delta: 8,
    inquiries: 8,
    orders: 2,
    revenue_pkr: 8000,
    created_at: "2026-10-02T20:00:00Z",
  },
  {
    id: "snap-3",
    business_id: "biz-123",
    platform: "facebook",
    period_start: "2026-10-03",
    period_end: "2026-10-03",
    views: 2000,
    reach: 1400,
    likes: 180,
    comments: 25,
    shares: 12,
    saves: 30,
    follower_delta: 6,
    inquiries: 4,
    orders: 1,
    revenue_pkr: 8000,
    created_at: "2026-10-03T20:00:00Z",
  },
];

const mockProgress: MetricsProgressResponse = {
  total_days_logged: 3,
  target_days: 3,
  threshold_met: true,
  latest_snapshot_date: "2026-10-03",
};

const mockChartsData: MetricsChartsResponse = {
  business_id: "biz-123",
  timeframe_days: 30,
  start_date: "2026-10-01",
  end_date: "2026-10-03",
  summary: {
    total_views: 6500,
    total_reach: 4700,
    total_engagement: 922,
    total_inquiries: 18,
    total_orders: 5,
    total_revenue_pkr: 22000,
    net_follower_delta: 19,
    inquiry_to_order_rate_pct: 27.8,
    total_snapshots: 3,
  },
  timeline: [],
  channels: [],
  top_content: [],
};

describe("WeeklyReviewGateModal (Task 50 / F-017 / Human Gate 3)", () => {
  it("renders modal with performance diagnosis, coach rationale, and proposed adjustments", () => {
    const handleClose = vi.fn();
    const handleApproved = vi.fn();
    const handleRejected = vi.fn();

    render(
      <WeeklyReviewGateModal
        isOpen={true}
        businessId="biz-123"
        proposal={mockProposal}
        onClose={handleClose}
        onApproved={handleApproved}
        onRejected={handleRejected}
      />
    );

    expect(screen.getByText(/Weekly AI Coach Review & Strategy Approval/i)).toBeInTheDocument();
    expect(screen.getByText("Human Gate 3 (F-017)")).toBeInTheDocument();

    // Performance diagnosis
    expect(screen.getByText("6,500")).toBeInTheDocument();
    expect(screen.getByText("Rs 22,000")).toBeInTheDocument();
    expect(screen.getByText("18 DMs")).toBeInTheDocument();

    // Rationale and proposed adjustments
    expect(screen.getByText(/Reels are generating 3x more DMs/i)).toBeInTheDocument();
    expect(screen.getByText(/Dekhein yeh hand embroidery kurta kaise banta hai!/i)).toBeInTheDocument();
    expect(screen.getByText("#embroideryreel")).toBeInTheDocument();

    // Mentor recommendation
    expect(screen.getByText(/Book a 1-on-1 session with a Sales Mentor/i)).toBeInTheDocument();
  });

  it("approves proposal and triggers onApproved callback", async () => {
    const handleApproved = vi.fn();
    const handleRejected = vi.fn();

    const approveSpy = vi
      .spyOn(ProposalsService, "approveSingleProposalApiV1ProposalsProposalIdApprovePost")
      .mockResolvedValue({
        ...mockProposal,
        status: "approved",
        decided_at: "2026-10-08T12:05:00Z",
      });

    render(
      <WeeklyReviewGateModal
        isOpen={true}
        businessId="biz-123"
        proposal={mockProposal}
        onClose={vi.fn()}
        onApproved={handleApproved}
        onRejected={handleRejected}
      />
    );

    const approveBtn = screen.getByRole("button", { name: /Approve Strategy \(Gate 3\)/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(approveSpy).toHaveBeenCalledWith({
        proposalId: "prop-123",
        requestBody: { comments: null },
      });
      expect(handleApproved).toHaveBeenCalledWith(
        expect.objectContaining({ status: "approved" })
      );
    });
  });

  it("handles rejection flow with feedback reason", async () => {
    const handleRejected = vi.fn();

    const rejectSpy = vi
      .spyOn(ProposalsService, "rejectSingleProposalApiV1ProposalsProposalIdRejectPost")
      .mockResolvedValue({
        ...mockProposal,
        status: "rejected",
        rejection_reason: "Cannot shoot reels this week",
        decided_at: "2026-10-08T12:10:00Z",
      });

    render(
      <WeeklyReviewGateModal
        isOpen={true}
        businessId="biz-123"
        proposal={mockProposal}
        onClose={vi.fn()}
        onApproved={vi.fn()}
        onRejected={handleRejected}
      />
    );

    const rejectBtn = screen.getByRole("button", { name: /Reject with Feedback/i });
    fireEvent.click(rejectBtn);

    expect(screen.getByLabelText(/What would you like the Weekly Coach to change\?/i)).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/I don't have time to shoot reels/i);
    fireEvent.change(textarea, { target: { value: "Cannot shoot reels this week" } });

    const confirmRejectBtn = screen.getByRole("button", { name: /Confirm Rejection/i });
    fireEvent.click(confirmRejectBtn);

    await waitFor(() => {
      expect(rejectSpy).toHaveBeenCalledWith({
        proposalId: "prop-123",
        requestBody: { reason: "Cannot shoot reels this week" },
      });
      expect(handleRejected).toHaveBeenCalledWith(
        expect.objectContaining({ status: "rejected" })
      );
    });
  });
});

describe("PerformanceMetricsPage - Gate 3 Integration (Task 50 / F-017)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(BusinessService, "getCurrentUserBusinessApiV1BusinessesGet").mockResolvedValue(mockBusiness);

    vi.spyOn(MetricsService, "listBusinessMetricsApiV1BusinessesBusinessIdMetricsGet").mockResolvedValue({
      items: mockSnapshots,
      total: 3,
      page: 1,
      pageSize: 50,
    } as unknown as PaginatedResponse_MetricsSnapshotResponse_);

    vi.spyOn(MetricsService, "getCoachingProgressApiV1BusinessesBusinessIdMetricsProgressGet").mockResolvedValue(mockProgress);

    vi.spyOn(MetricsService, "getMetricsChartsApiV1BusinessesBusinessIdMetricsChartsGet").mockResolvedValue(mockChartsData);

    vi.spyOn(ContentService, "getCalendarApiV1BusinessesBusinessIdContentCalendarGet").mockResolvedValue({
      business_id: "biz-123",
      generated_at: "2026-10-01T00:00:00Z",
      total_items: 0,
      items: [],
    } as unknown as Awaited<ReturnType<typeof ContentService.getCalendarApiV1BusinessesBusinessIdContentCalendarGet>>);

    vi.spyOn(ProposalsService, "getLatestWeeklyReviewApiV1BusinessesBusinessIdWeeklyReviewLatestGet").mockResolvedValue(mockProposal);
  });

  it("shows Gate 3 trigger controls on the dashboard when 3-day threshold is met", async () => {
    render(<PerformanceMetricsPage />);

    await waitFor(() => {
      expect(screen.getByText("Weekly AI Coach Unlocked & Ready")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /View Strategy \(pending\)/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Regenerate Review/i })).toBeInTheDocument();
  });

  it("opens WeeklyReviewGateModal when clicking View Strategy button", async () => {
    render(<PerformanceMetricsPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /View Strategy \(pending\)/i })).toBeInTheDocument();
    });

    const viewBtn = screen.getByRole("button", { name: /View Strategy \(pending\)/i });
    fireEvent.click(viewBtn);

    expect(screen.getByText(/Weekly AI Coach Review & Strategy Approval/i)).toBeInTheDocument();
  });
});
