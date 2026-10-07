import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MetricsEntryModal } from "@/components/metrics/MetricsEntryModal";
import PerformanceMetricsPage from "@/app/(dashboard)/metrics/page";
import {
  BusinessService,
  MetricsService,
  ContentService,
  type BusinessResponse,
  type MetricsSnapshotResponse,
  type MetricsProgressResponse,
  type PaginatedResponse_MetricsSnapshotResponse_,
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

const mockBusiness: BusinessResponse = {
  id: "biz-123",
  owner_id: "user-123",
  program_id: "prog-1",
  name: "Fatima's Block Prints",
  niche: "crafts",
  city: "Lahore",
  area: "Gulberg",
  budget_pkr: 25000,
  hours_per_week: 20,
  tone: "friendly",
  languages: ["roman_ur", "ur"],
  platforms: ["instagram", "facebook"],
  target_customer: "Women interested in artisan kurtas",
  created_at: "2026-10-01T10:00:00Z",
  updated_at: null,
};

const mockSnapshots: MetricsSnapshotResponse[] = [
  {
    id: "snapshot-1",
    business_id: "biz-123",
    content_item_id: null,
    content_item_title: null,
    platform: "instagram",
    period_start: "2026-10-01",
    period_end: "2026-10-02",
    views: 3200,
    reach: 2800,
    likes: 180,
    comments: 24,
    shares: 12,
    saves: 30,
    follower_delta: 15,
    inquiries: 6,
    orders: 2,
    revenue_pkr: 7500,
    created_at: "2026-10-02T12:00:00Z",
    updated_at: null,
  },
  {
    id: "snapshot-2",
    business_id: "biz-123",
    content_item_id: "item-5",
    content_item_title: "Day 5 [REEL]: Block print artisan showcase",
    platform: "facebook",
    period_start: "2026-10-03",
    period_end: "2026-10-03",
    views: 1100,
    reach: 950,
    likes: 65,
    comments: 8,
    shares: 4,
    saves: 10,
    follower_delta: 5,
    inquiries: 3,
    orders: 1,
    revenue_pkr: 3500,
    created_at: "2026-10-03T18:00:00Z",
    updated_at: null,
  },
];

const mockProgressBelowThreshold: MetricsProgressResponse = {
  total_days_logged: 2,
  target_days: 3,
  threshold_met: false,
  latest_snapshot_date: "2026-10-03",
};

const mockCreatedSnapshot: MetricsSnapshotResponse = {
  id: "snapshot-new",
  business_id: "biz-123",
  content_item_id: null,
  content_item_title: null,
  platform: "instagram",
  period_start: "2026-10-04",
  period_end: "2026-10-04",
  views: 2400,
  reach: 2100,
  likes: 120,
  comments: 18,
  shares: 8,
  saves: 15,
  follower_delta: 8,
  inquiries: 4,
  orders: 2,
  revenue_pkr: 6000,
  created_at: "2026-10-04T12:00:00Z",
  updated_at: null,
};

describe("MetricsEntryModal (Task 48 / F-015)", () => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders modal with platform selectors, dates, and engagement inputs", () => {
    render(
      <MetricsEntryModal
        isOpen={true}
        businessId="biz-123"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    expect(screen.getByText("Log Performance Metrics")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Instagram/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Facebook/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Period Start/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Period End/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Views \/ Impressions/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Revenue \(PKR\)/i)).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <MetricsEntryModal
        isOpen={false}
        businessId="biz-123"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("validates that period_end is not earlier than period_start", async () => {
    render(
      <MetricsEntryModal
        isOpen={true}
        businessId="biz-123"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    const startInput = screen.getByLabelText(/Period Start/i);
    const endInput = screen.getByLabelText(/Period End/i);

    fireEvent.change(startInput, { target: { value: "2026-10-05" } });
    fireEvent.change(endInput, { target: { value: "2026-10-01" } }); // Invalid

    const submitBtn = screen.getByRole("button", { name: /Save Metrics Snapshot/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/End date cannot be earlier than start date/i)).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("submits valid metrics and calls onSuccess", async () => {
    const submitSpy = vi
      .spyOn(MetricsService, "logMetricsSnapshotApiV1BusinessesBusinessIdMetricsPost")
      .mockImplementation(() => {
        return Promise.resolve(mockCreatedSnapshot) as unknown as ReturnType<
          typeof MetricsService.logMetricsSnapshotApiV1BusinessesBusinessIdMetricsPost
        >;
      });

    render(
      <MetricsEntryModal
        isOpen={true}
        businessId="biz-123"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    // Switch to Instagram
    fireEvent.click(screen.getByRole("button", { name: /Instagram/i }));

    const startInput = screen.getByLabelText(/Period Start/i);
    const endInput = screen.getByLabelText(/Period End/i);
    fireEvent.change(startInput, { target: { value: "2026-10-04" } });
    fireEvent.change(endInput, { target: { value: "2026-10-04" } });

    // Set numbers
    fireEvent.change(screen.getByLabelText(/Views \/ Impressions/i), { target: { value: "2400" } });
    fireEvent.change(screen.getByLabelText(/Revenue \(PKR\)/i), { target: { value: "6000" } });

    const submitBtn = screen.getByRole("button", { name: /Save Metrics Snapshot/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          businessId: "biz-123",
          requestBody: expect.objectContaining({
            platform: "instagram",
            period_start: "2026-10-04",
            period_end: "2026-10-04",
            views: 2400,
            revenue_pkr: 6000,
          }),
        })
      );
      expect(onSuccess).toHaveBeenCalledWith(mockCreatedSnapshot);
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("handles submission API error gracefully", async () => {
    vi.spyOn(MetricsService, "logMetricsSnapshotApiV1BusinessesBusinessIdMetricsPost").mockRejectedValue({
      body: { detail: "Failed to record snapshot due to server error" },
    });

    render(
      <MetricsEntryModal
        isOpen={true}
        businessId="biz-123"
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    const submitBtn = screen.getByRole("button", { name: /Save Metrics Snapshot/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Failed to record snapshot due to server error/i)).toBeInTheDocument();
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });
});

describe("PerformanceMetricsPage (Task 48 / F-015)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(BusinessService, "getCurrentUserBusinessApiV1BusinessesGet").mockImplementation(() => {
      return Promise.resolve(mockBusiness) as unknown as ReturnType<
        typeof BusinessService.getCurrentUserBusinessApiV1BusinessesGet
      >;
    });

    vi.spyOn(MetricsService, "listBusinessMetricsApiV1BusinessesBusinessIdMetricsGet").mockImplementation(() => {
      const resp: PaginatedResponse_MetricsSnapshotResponse_ = {
        items: mockSnapshots,
        total: mockSnapshots.length,
        page: 1,
        page_size: 50,
      };
      return Promise.resolve(resp) as unknown as ReturnType<
        typeof MetricsService.listBusinessMetricsApiV1BusinessesBusinessIdMetricsGet
      >;
    });

    vi.spyOn(MetricsService, "getCoachingProgressApiV1BusinessesBusinessIdMetricsProgressGet").mockImplementation(() => {
      return Promise.resolve(mockProgressBelowThreshold) as unknown as ReturnType<
        typeof MetricsService.getCoachingProgressApiV1BusinessesBusinessIdMetricsProgressGet
      >;
    });

    vi.spyOn(ContentService, "getCalendarApiV1BusinessesBusinessIdContentCalendarGet").mockImplementation(() => {
      return Promise.resolve({
        business_id: "biz-123",
        generated_at: "2026-10-01T00:00:00Z",
        total_items: 0,
        items: [],
      }) as unknown as ReturnType<
        typeof ContentService.getCalendarApiV1BusinessesBusinessIdContentCalendarGet
      >;
    });
  });

  it("renders page header, 3-day coaching threshold banner, and summary KPIs", async () => {
    render(<PerformanceMetricsPage />);

    await waitFor(() => {
      expect(screen.getAllByRole("heading", { name: /Marketing & Sales Performance/i }).length).toBeGreaterThanOrEqual(1);
    });

    // 3-Day threshold banner
    expect(screen.getByText(/Weekly Coach Needs 3 Days of Logged Metrics/i)).toBeInTheDocument();
    expect(screen.getByText("2 / 3 Days Logged")).toBeInTheDocument();

    // Summary KPIs: Rs 11,000 total revenue (7500 + 3500)
    expect(screen.getByText("Rs 11,000")).toBeInTheDocument();
    // 4,300 total views (3200 + 1100)
    expect(screen.getByText("4,300")).toBeInTheDocument();
  });

  it("filters snapshots by platform tabs", async () => {
    render(<PerformanceMetricsPage />);

    await waitFor(() => {
      expect(screen.getByText("All Channels (2)")).toBeInTheDocument();
    });

    // Both Instagram and Facebook items are visible initially
    await waitFor(() => {
      expect(screen.getByText("3,200")).toBeInTheDocument();
      expect(screen.getByText("1,100")).toBeInTheDocument();
    });

    // Filter by Instagram only
    fireEvent.click(screen.getByRole("button", { name: "Instagram" }));
    expect(screen.getByText("3,200")).toBeInTheDocument();
    expect(screen.queryByText("1,100")).not.toBeInTheDocument();

    // Filter by Facebook only
    fireEvent.click(screen.getByRole("button", { name: "Facebook" }));
    expect(screen.getByText("1,100")).toBeInTheDocument();
    expect(screen.queryByText("3,200")).not.toBeInTheDocument();
  });

  it("opens MetricsEntryModal when clicking Log Metrics button", async () => {
    render(<PerformanceMetricsPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Log Metrics/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Log Metrics/i }));
    expect(screen.getByText("Log Performance Metrics")).toBeInTheDocument();
  });

  it("opens slide-over detail drawer when clicking Details button", async () => {
    render(<PerformanceMetricsPage />);

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /Details/i }).length).toBeGreaterThan(0);
    });

    const detailsButtons = screen.getAllByRole("button", { name: /Details/i });
    fireEvent.click(detailsButtons[0]);

    expect(screen.getByText("Snapshot Details")).toBeInTheDocument();
    expect(screen.getByText("Engagement Breakdown")).toBeInTheDocument();
    expect(screen.getByText("Conversions & Growth")).toBeInTheDocument();
  });
});
