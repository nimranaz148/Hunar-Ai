import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CohortFunnelChart } from "@/components/cohort/CohortFunnelChart";
import { StalledPreviewCard } from "@/components/cohort/StalledPreviewCard";
import CohortDashboardPage from "@/app/(admin)/admin/cohort/page";
import { AdminService, CohortFunnelStage, type CohortDashboardResponse } from "@/lib/api";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/cohort",
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

const mockCohortData: CohortDashboardResponse = {
  program_id: null,
  program_name: "All Cohorts",
  funnel: {
    signed_up: 28,
    plan_approved: 22,
    first_post: 15,
    first_order: 8,
    stages: [
      {
        stage: CohortFunnelStage.stage.SIGNED_UP,
        label: "Signed Up",
        count: 28,
        percentage: 100,
        step_conversion_rate: 100,
      },
      {
        stage: CohortFunnelStage.stage.PLAN_APPROVED,
        label: "Plan Approved",
        count: 22,
        percentage: 78.6,
        step_conversion_rate: 78.6,
      },
      {
        stage: CohortFunnelStage.stage.FIRST_POST,
        label: "First Post",
        count: 15,
        percentage: 53.6,
        step_conversion_rate: 68.2,
      },
      {
        stage: CohortFunnelStage.stage.FIRST_ORDER,
        label: "First Order",
        count: 8,
        percentage: 28.6,
        step_conversion_rate: 53.3,
      },
    ],
  },
  kpis: {
    total_entrepreneurs: 28,
    plan_approved_count: 22,
    stalled_count: 5,
    active_mentors: 6,
    bookings_this_week: 12,
  },
  stalled_preview: [
    {
      business_id: "biz-1",
      business_name: "Zari Threads",
      owner_id: "user-1",
      owner_name: "Fatima Ali",
      owner_email: "fatima@example.com",
      program_id: "prog-1",
      program_name: "Lahore Batch 1",
      reason: "No post in 7 days · 1 task overdue",
      days_since_last_post: 7,
      days_since_last_metric: 4,
      overdue_task_count: 1,
      last_activity_at: "2026-10-01",
    },
    {
      business_id: "biz-2",
      business_name: "Chai & Cinnamon",
      owner_id: "user-2",
      owner_name: "Hina Tariq",
      owner_email: "hina@example.com",
      program_id: "prog-1",
      program_name: "Lahore Batch 1",
      reason: "No metrics in 10 days",
      days_since_last_post: 3,
      days_since_last_metric: 10,
      overdue_task_count: 0,
      last_activity_at: "2026-09-28",
    },
  ],
  programs: [
    {
      id: "prog-1",
      name: "Lahore Batch 1",
      invite_code: "LHR-01",
      entrepreneur_count: 18,
    },
    {
      id: "prog-2",
      name: "Karachi Batch 2",
      invite_code: "KHI-02",
      entrepreneur_count: 10,
    },
  ],
};

describe("CohortFunnelChart Component", () => {
  it("renders funnel milestones, counts, and conversion percentages", () => {
    render(<CohortFunnelChart funnelData={mockCohortData.funnel} />);

    expect(screen.getByText("Cohort Progression Funnel")).toBeInTheDocument();
    expect(screen.getByText("Signed Up")).toBeInTheDocument();
    expect(screen.getByText("Plan Approved")).toBeInTheDocument();
    expect(screen.getByText("First Post")).toBeInTheDocument();
    expect(screen.getByText("First Order")).toBeInTheDocument();

    expect(screen.getByText("28")).toBeInTheDocument();
    expect(screen.getByText("(100%)")).toBeInTheDocument();
    expect(screen.getByText("(78.6%)")).toBeInTheDocument();
    expect(screen.getByText("(53.6%)")).toBeInTheDocument();
    expect(screen.getByText("(28.6%)")).toBeInTheDocument();

    expect(screen.getByText("68.2% conversion")).toBeInTheDocument();
    expect(screen.getByText("53.3% conversion")).toBeInTheDocument();
  });
});

describe("StalledPreviewCard Component", () => {
  it("renders list of stalled businesses with diagnosis tags and idle days", () => {
    render(
      <StalledPreviewCard
        stalledItems={mockCohortData.stalled_preview || []}
        totalStalledCount={5}
      />
    );

    expect(screen.getByText("Stalled Businesses")).toBeInTheDocument();
    expect(screen.getByText("5 flagged")).toBeInTheDocument();
    expect(screen.getByText("Zari Threads")).toBeInTheDocument();
    expect(screen.getByText(/Fatima Ali/i)).toBeInTheDocument();
    expect(screen.getByText("7d idle")).toBeInTheDocument();
    expect(screen.getByText("No post in 7 days")).toBeInTheDocument();
    expect(screen.getByText("1 task overdue")).toBeInTheDocument();
    expect(screen.getByText("No metrics in 10 days")).toBeInTheDocument();

    expect(screen.getByText("View Stalled List")).toBeInTheDocument();
  });

  it("renders healthy empty state when no stalled businesses exist", () => {
    render(<StalledPreviewCard stalledItems={[]} totalStalledCount={0} />);

    expect(screen.getByText("All entrepreneurs on track!")).toBeInTheDocument();
    expect(
      screen.getByText(/No businesses in this cohort currently exceed inactivity thresholds/i)
    ).toBeInTheDocument();
  });
});

describe("CohortDashboardPage (Task 51 / F-028 / D-003)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads and renders high-level KPI cards and cohort oversight on mount", async () => {
    vi.spyOn(AdminService, "getAdminCohortDashboardApiV1AdminCohortDashboardGet").mockResolvedValue(mockCohortData);

    render(<CohortDashboardPage />);

    expect(screen.getByLabelText("Loading cohort dashboard")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByLabelText("Loading cohort dashboard")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Cohort Progression & Oversight")).toBeInTheDocument();

    // Funnel KPI Cards
    expect(screen.getAllByText("Signed Up").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Plan Approved").length).toBeGreaterThan(0);
    expect(screen.getAllByText("First Post").length).toBeGreaterThan(0);
    expect(screen.getAllByText("First Order").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Stalled").length).toBeGreaterThan(0);

    // KPI Values
    expect(screen.getAllByText("28").length).toBeGreaterThan(0);
    expect(screen.getAllByText("22").length).toBeGreaterThan(0);
    expect(screen.getAllByText("15").length).toBeGreaterThan(0);
    expect(screen.getAllByText("8").length).toBeGreaterThan(0);
    expect(screen.getAllByText("5").length).toBeGreaterThan(0);

    // Sub-KPIs
    expect(screen.getByText("6 Verified Mentors")).toBeInTheDocument();
    expect(screen.getByText("12 Sessions Booked")).toBeInTheDocument();

    // Dropdown contains programs
    expect(screen.getByText("Lahore Batch 1 (18)")).toBeInTheDocument();
    expect(screen.getByText("Karachi Batch 2 (10)")).toBeInTheDocument();
  });

  it("fetches filtered metrics when user changes cohort dropdown", async () => {
    const getCohortDashboardSpy = vi
      .spyOn(AdminService, "getAdminCohortDashboardApiV1AdminCohortDashboardGet")
      .mockResolvedValue(mockCohortData);

    render(<CohortDashboardPage />);

    await waitFor(() => {
      expect(screen.queryByLabelText("Loading cohort dashboard")).not.toBeInTheDocument();
    });

    const select = screen.getByLabelText("Select cohort program");
    fireEvent.change(select, { target: { value: "prog-1" } });

    await waitFor(() => {
      expect(getCohortDashboardSpy).toHaveBeenCalledWith({ programId: "prog-1" });
    });
  });

  it("displays error banner and handles retry on API failure", async () => {
    vi.spyOn(AdminService, "getAdminCohortDashboardApiV1AdminCohortDashboardGet")
      .mockRejectedValueOnce(new Error("Network timeout"))
      .mockResolvedValueOnce(mockCohortData);

    render(<CohortDashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByText("Network timeout")).toBeInTheDocument();

    // Click retry
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.getByText("Cohort Progression & Oversight")).toBeInTheDocument();
    });
  });
});
