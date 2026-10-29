import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import StalledBusinessesPage from "@/app/(admin)/admin/cohort/stalled/page";
import {
  AdminService,
  type StalledListResponse,
  type NudgeStalledBusinessResponse,
} from "@/lib/api";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/cohort/stalled",
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

const mockStalledData: StalledListResponse = {
  items: [
    {
      business_id: "biz-1",
      business_name: "Zari Threads",
      owner_id: "user-1",
      owner_name: "Fatima Ali",
      owner_email: "fatima@example.com",
      program_id: "prog-1",
      program_name: "Lahore Batch 1",
      reason: "No post in 8 days · 1 task overdue",
      days_since_last_post: 8,
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
  total: 2,
  page: 1,
  page_size: 20,
  total_pages: 1,
  summary: {
    total_stalled: 2,
    no_post_count: 1,
    no_metrics_count: 1,
    overdue_tasks_count: 1,
  },
  programs: [
    {
      id: "prog-1",
      name: "Lahore Batch 1",
      invite_code: "LHR-01",
      entrepreneur_count: 18,
    },
  ],
};

describe("StalledBusinessesPage (Task 52 / F-029)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads and renders stalled summary cards, back button, and business items on mount", async () => {
    vi.spyOn(AdminService, "getAdminStalledBusinessesApiV1AdminCohortStalledGet").mockResolvedValue(mockStalledData);

    render(<StalledBusinessesPage />);

    expect(screen.getByLabelText("Loading stalled businesses")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByLabelText("Loading stalled businesses")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Stalled Businesses Directory (F-029)")).toBeInTheDocument();
    expect(screen.getByText("Back to Cohort Dashboard")).toBeInTheDocument();

    // Summary stat values
    expect(screen.getByText("Total Stalled")).toBeInTheDocument();
    expect(screen.getAllByText("No Post (>5d)").length).toBeGreaterThan(0);
    expect(screen.getAllByText("No Metrics (>7d)").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Overdue Tasks").length).toBeGreaterThan(0);

    // Business details
    expect(screen.getByText("Zari Threads")).toBeInTheDocument();
    expect(screen.getByText("Fatima Ali")).toBeInTheDocument();
    expect(screen.getByText("8 days without post")).toBeInTheDocument();
    expect(screen.getByText("1 tasks overdue")).toBeInTheDocument();

    expect(screen.getByText("Chai & Cinnamon")).toBeInTheDocument();
    expect(screen.getByText("10 days without metrics")).toBeInTheDocument();
  });

  it("filters by reason when user clicks category filter tabs", async () => {
    const getStalledSpy = vi
      .spyOn(AdminService, "getAdminStalledBusinessesApiV1AdminCohortStalledGet")
      .mockResolvedValue(mockStalledData);

    render(<StalledBusinessesPage />);

    await waitFor(() => {
      expect(screen.queryByLabelText("Loading stalled businesses")).not.toBeInTheDocument();
    });

    // Click 'No Post (>5d)' tab
    const tab = screen.getByRole("tab", { name: "No Post (>5d)" });
    fireEvent.click(tab);

    await waitFor(() => {
      expect(getStalledSpy).toHaveBeenCalledWith(
        expect.objectContaining({ reasonFilter: "no_post" })
      );
    });
  });

  it("filters by program when user selects a cohort in the dropdown", async () => {
    const getStalledSpy = vi
      .spyOn(AdminService, "getAdminStalledBusinessesApiV1AdminCohortStalledGet")
      .mockResolvedValue(mockStalledData);

    render(<StalledBusinessesPage />);

    await waitFor(() => {
      expect(screen.queryByLabelText("Loading stalled businesses")).not.toBeInTheDocument();
    });

    const select = screen.getByLabelText("Filter by cohort program");
    fireEvent.change(select, { target: { value: "prog-1" } });

    await waitFor(() => {
      expect(getStalledSpy).toHaveBeenCalledWith(
        expect.objectContaining({ programId: "prog-1" })
      );
    });
  });

  it("filters by search term when typing in search input", async () => {
    const getStalledSpy = vi
      .spyOn(AdminService, "getAdminStalledBusinessesApiV1AdminCohortStalledGet")
      .mockResolvedValue(mockStalledData);

    render(<StalledBusinessesPage />);

    await waitFor(() => {
      expect(screen.queryByLabelText("Loading stalled businesses")).not.toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText("Search stalled businesses");
    fireEvent.change(searchInput, { target: { value: "Zari" } });

    await waitFor(() => {
      expect(getStalledSpy).toHaveBeenCalledWith(
        expect.objectContaining({ search: "Zari" })
      );
    });
  });

  it("sends an intervention nudge and shows success confirmation toast", async () => {
    vi.spyOn(AdminService, "getAdminStalledBusinessesApiV1AdminCohortStalledGet").mockResolvedValue(mockStalledData);
    const triggerNudgeSpy = vi.spyOn(AdminService, "triggerAdminStalledNudgeApiV1AdminCohortStalledBusinessIdNudgePost").mockResolvedValue({
      success: true,
      business_id: "biz-1",
      business_name: "Zari Threads",
      nudged_at: "2026-10-09T00:00:00Z",
      message: "Intervention nudge successfully recorded for Zari Threads.",
    } as NudgeStalledBusinessResponse);

    render(<StalledBusinessesPage />);

    await waitFor(() => {
      expect(screen.queryByLabelText("Loading stalled businesses")).not.toBeInTheDocument();
    });

    const nudgeBtn = screen.getByRole("button", {
      name: "Send intervention check-in to Zari Threads",
    });
    fireEvent.click(nudgeBtn);

    await waitFor(() => {
      expect(triggerNudgeSpy).toHaveBeenCalledWith({ businessId: "biz-1" });
      expect(
        screen.getByText("Intervention nudge successfully recorded for Zari Threads.")
      ).toBeInTheDocument();
    });
  });

  it("renders friendly empty state when no businesses match", async () => {
    vi.spyOn(AdminService, "getAdminStalledBusinessesApiV1AdminCohortStalledGet").mockResolvedValue({
      ...mockStalledData,
      items: [],
      total: 0,
    });

    render(<StalledBusinessesPage />);

    await waitFor(() => {
      expect(screen.queryByLabelText("Loading stalled businesses")).not.toBeInTheDocument();
    });

    expect(screen.getByText("No Stalled Businesses Found")).toBeInTheDocument();
  });

  it("renders error alert with retry button on failure", async () => {
    vi.spyOn(AdminService, "getAdminStalledBusinessesApiV1AdminCohortStalledGet")
      .mockRejectedValueOnce(new Error("Database unavailable"))
      .mockResolvedValueOnce(mockStalledData);

    render(<StalledBusinessesPage />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByText("Database unavailable")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.getByText("Zari Threads")).toBeInTheDocument();
    });
  });
});
