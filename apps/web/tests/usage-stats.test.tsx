import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UsageStatsPage from "@/app/(admin)/admin/usage/page";
import { AdminService, type UsageStatsResponse } from "@/lib/api";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/usage",
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

const mockUsageData: UsageStatsResponse = {
  active_users_today: 14,
  runs_today_total: 42,
  runs_today_succeeded: 38,
  runs_today_failed: 4,
  avg_latency_seconds: 2.15,
  error_rate_pct: 9.5,
  runs_per_hour: [
    { hour: "00:00", total: 2, succeeded: 2, failed: 0 },
    { hour: "01:00", total: 0, succeeded: 0, failed: 0 },
    { hour: "10:00", total: 15, succeeded: 14, failed: 1 },
    { hour: "11:00", total: 25, succeeded: 22, failed: 3 },
  ],
  workflows: [
    {
      workflow: "market_research",
      total_runs: 20,
      avg_latency_seconds: 3.4,
      failure_rate_pct: 10.0,
    },
    {
      workflow: "pricing_calculator",
      total_runs: 15,
      avg_latency_seconds: 1.2,
      failure_rate_pct: 6.7,
    },
    {
      workflow: "content_calendar_generator",
      total_runs: 7,
      avg_latency_seconds: 0.8,
      failure_rate_pct: 14.3,
    },
  ],
  top_users: [
    {
      user_id: "user-111",
      name: "Fatima Ali",
      email: "fatima@example.com",
      role: "entrepreneur",
      run_count: 18,
    },
    {
      user_id: "user-222",
      name: "Zain Ahmed",
      email: "zain@example.com",
      role: "entrepreneur",
      run_count: 12,
    },
  ],
};

describe("UsageStatsPage (Task 54 / F-037 / D-004)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially and renders usage statistics upon fetch", async () => {
    vi.spyOn(AdminService, "getSystemUsageStatsApiV1AdminUsageGet").mockResolvedValue(mockUsageData);

    render(<UsageStatsPage />);

    expect(screen.getByText("Loading system usage statistics...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Loading system usage statistics...")).not.toBeInTheDocument();
    });

    // Check title
    expect(screen.getByText("System Usage & Health")).toBeInTheDocument();

    // Check KPI Cards
    expect(screen.getByText("Active Users Today")).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument();

    expect(screen.getByText("Runs Today")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("38 succeeded")).toBeInTheDocument();
    expect(screen.getByText("4 failed")).toBeInTheDocument();

    expect(screen.getAllByText("Avg Duration").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("2.15s")).toBeInTheDocument();

    expect(screen.getByText("Error Rate")).toBeInTheDocument();
    expect(screen.getByText("9.5%")).toBeInTheDocument();
    expect(screen.getByText("Elevated")).toBeInTheDocument();

    // Check 24-Hour Trend Container
    expect(screen.getByText("24-Hour Execution Trend")).toBeInTheDocument();
    expect(screen.getByTestId("hourly-chart-container")).toBeInTheDocument();

    // Check Workflow Breakdown table
    expect(screen.getByText("Workflow Breakdown")).toBeInTheDocument();
    expect(screen.getByText("market_research")).toBeInTheDocument();
    expect(screen.getByText("pricing_calculator")).toBeInTheDocument();
    expect(screen.getByText("content_calendar_generator")).toBeInTheDocument();
    expect(screen.getByText("Count: 3 workflows active today")).toBeInTheDocument();

    // Check Top Users Leaderboard
    expect(screen.getByText("Top Active Users Today")).toBeInTheDocument();
    expect(screen.getByText("Fatima Ali")).toBeInTheDocument();
    expect(screen.getByText("fatima@example.com")).toBeInTheDocument();
    expect(screen.getByText("Zain Ahmed")).toBeInTheDocument();
    expect(screen.getByText("zain@example.com")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("handles error state and allows retrying", async () => {
    const errorSpy = vi
      .spyOn(AdminService, "getSystemUsageStatsApiV1AdminUsageGet")
      .mockRejectedValueOnce(new Error("Database connection timed out"))
      .mockResolvedValueOnce(mockUsageData);

    render(<UsageStatsPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load usage statistics")).toBeInTheDocument();
    });

    expect(screen.getByText("Database connection timed out")).toBeInTheDocument();

    // Click retry
    const retryBtn = screen.getByRole("button", { name: /try again/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText("System Usage & Health")).toBeInTheDocument();
    });
    expect(errorSpy).toHaveBeenCalledTimes(2);
  });

  it("renders empty states when no workflow or user activity has occurred today", async () => {
    const emptyUsageData: UsageStatsResponse = {
      active_users_today: 0,
      runs_today_total: 0,
      runs_today_succeeded: 0,
      runs_today_failed: 0,
      avg_latency_seconds: 0.0,
      error_rate_pct: 0.0,
      runs_per_hour: [],
      workflows: [],
      top_users: [],
    };

    vi.spyOn(AdminService, "getSystemUsageStatsApiV1AdminUsageGet").mockResolvedValue(emptyUsageData);

    render(<UsageStatsPage />);

    await waitFor(() => {
      expect(screen.getByText("System Usage & Health")).toBeInTheDocument();
    });

    expect(screen.getByText("Zero Errors")).toBeInTheDocument();
    expect(screen.getByText("No workflow activity")).toBeInTheDocument();
    expect(screen.getByText("No user executions")).toBeInTheDocument();
  });

  it("toggles auto-refresh and manual refresh button works", async () => {
    const fetchSpy = vi
      .spyOn(AdminService, "getSystemUsageStatsApiV1AdminUsageGet")
      .mockResolvedValue(mockUsageData);

    render(<UsageStatsPage />);

    await waitFor(() => {
      expect(screen.getByText("System Usage & Health")).toBeInTheDocument();
    });

    const autoRefreshBtn = screen.getByRole("button", { name: /auto-refresh/i });
    expect(autoRefreshBtn).toHaveTextContent("Auto-refresh (60s): OFF");

    fireEvent.click(autoRefreshBtn);
    expect(autoRefreshBtn).toHaveTextContent("Auto-refresh (60s): ON");

    const manualRefreshBtn = screen.getByRole("button", { name: "Refresh usage statistics" });
    fireEvent.click(manualRefreshBtn);

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
