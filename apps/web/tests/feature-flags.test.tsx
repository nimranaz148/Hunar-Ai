import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import FeatureFlagsPage from "@/app/(admin)/admin/feature-flags/page";
import { AdminService, type FeatureFlagResponse } from "@/lib/api";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/feature-flags",
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

const mockFeatureFlags: FeatureFlagResponse[] = [
  {
    key: "weekly_coach_agent",
    name: "Weekly AI Coach",
    description: "Enables AI-driven weekly marketing diagnostics and proposals.",
    is_enabled: true,
    updated_at: "2026-10-08T12:00:00Z",
    updated_by: "admin-uuid-1",
  },
  {
    key: "mentor_marketplace",
    name: "Mentor Marketplace",
    description: "Enables browsing, booking, and reviews for mentor pro sessions.",
    is_enabled: true,
    updated_at: "2026-10-08T12:00:00Z",
    updated_by: null,
  },
  {
    key: "meta_connect",
    name: "Meta / Social Auto-Publish",
    description: "Enables direct API integration for automatic posting.",
    is_enabled: false,
    updated_at: "2026-10-08T12:00:00Z",
    updated_by: null,
  },
];

describe("FeatureFlagsPage (Task 53 / F-036)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads and renders feature flags and KPI counters on mount", async () => {
    vi.spyOn(AdminService, "getAdminFeatureFlagsApiV1AdminFeatureFlagsGet").mockResolvedValue(
      mockFeatureFlags
    );

    render(<FeatureFlagsPage />);

    expect(screen.getByText("Loading feature flags configuration...")).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText("Weekly AI Coach")).toBeDefined();
    });

    expect(screen.getByText("Mentor Marketplace")).toBeDefined();
    expect(screen.getByText("Meta / Social Auto-Publish")).toBeDefined();

    // Check KPI counters (Total: 3, Active: 2, Inactive: 1)
    expect(screen.getByText("3")).toBeDefined();
    expect(screen.getByText("2")).toBeDefined();
    expect(screen.getByText("1")).toBeDefined();
  });

  it("filters flags by search input", async () => {
    vi.spyOn(AdminService, "getAdminFeatureFlagsApiV1AdminFeatureFlagsGet").mockResolvedValue(
      mockFeatureFlags
    );

    render(<FeatureFlagsPage />);

    await waitFor(() => {
      expect(screen.getByText("Weekly AI Coach")).toBeDefined();
    });

    const searchInput = screen.getByPlaceholderText("Search flags by name, key, or description...");
    fireEvent.change(searchInput, { target: { value: "auto-publish" } });

    expect(screen.getByText("Meta / Social Auto-Publish")).toBeDefined();
    expect(screen.queryByText("Weekly AI Coach")).toBeNull();
    expect(screen.queryByText("Mentor Marketplace")).toBeNull();
  });

  it("filters flags by status tab pills", async () => {
    vi.spyOn(AdminService, "getAdminFeatureFlagsApiV1AdminFeatureFlagsGet").mockResolvedValue(
      mockFeatureFlags
    );

    render(<FeatureFlagsPage />);

    await waitFor(() => {
      expect(screen.getByText("Weekly AI Coach")).toBeDefined();
    });

    // Click Inactive tab
    const inactiveTab = screen.getByRole("button", { name: "Inactive (1)" });
    fireEvent.click(inactiveTab);

    expect(screen.getByText("Meta / Social Auto-Publish")).toBeDefined();
    expect(screen.queryByText("Weekly AI Coach")).toBeNull();
    expect(screen.queryByText("Mentor Marketplace")).toBeNull();

    // Click Active tab
    const activeTab = screen.getByRole("button", { name: "Active (2)" });
    fireEvent.click(activeTab);

    expect(screen.getByText("Weekly AI Coach")).toBeDefined();
    expect(screen.getByText("Mentor Marketplace")).toBeDefined();
    expect(screen.queryByText("Meta / Social Auto-Publish")).toBeNull();
  });

  it("toggles a flag and displays success confirmation toast", async () => {
    vi.spyOn(AdminService, "getAdminFeatureFlagsApiV1AdminFeatureFlagsGet").mockResolvedValue(
      mockFeatureFlags
    );

    const updatedFlags: FeatureFlagResponse[] = [
      mockFeatureFlags[0],
      mockFeatureFlags[1],
      { ...mockFeatureFlags[2], is_enabled: true },
    ];

    const patchSpy = vi
      .spyOn(AdminService, "modifyAdminFeatureFlagsApiV1AdminFeatureFlagsPatch")
      .mockResolvedValue(updatedFlags);

    render(<FeatureFlagsPage />);

    await waitFor(() => {
      expect(screen.getByText("Meta / Social Auto-Publish")).toBeDefined();
    });

    const toggleButton = screen.getByRole("switch", { name: "Toggle Meta / Social Auto-Publish" });
    expect(toggleButton.getAttribute("aria-checked")).toBe("false");

    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith({
        requestBody: {
          flags: [{ key: "meta_connect", is_enabled: true }],
        },
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/Flag "Meta \/ Social Auto-Publish" is now Active/)).toBeDefined();
    });
  });

  it("displays error toast when update fails", async () => {
    vi.spyOn(AdminService, "getAdminFeatureFlagsApiV1AdminFeatureFlagsGet").mockResolvedValue(
      mockFeatureFlags
    );

    vi.spyOn(AdminService, "modifyAdminFeatureFlagsApiV1AdminFeatureFlagsPatch").mockRejectedValue(
      new Error("Server error")
    );

    render(<FeatureFlagsPage />);

    await waitFor(() => {
      expect(screen.getByText("Weekly AI Coach")).toBeDefined();
    });

    const toggleButton = screen.getByRole("switch", { name: "Toggle Weekly AI Coach" });
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText("Failed to update feature flag.")).toBeDefined();
    });
  });

  it("refreshes feature flags when refresh button is clicked", async () => {
    const getSpy = vi
      .spyOn(AdminService, "getAdminFeatureFlagsApiV1AdminFeatureFlagsGet")
      .mockResolvedValue(mockFeatureFlags);

    render(<FeatureFlagsPage />);

    await waitFor(() => {
      expect(screen.getByText("Weekly AI Coach")).toBeDefined();
    });

    expect(getSpy).toHaveBeenCalledTimes(1);

    const refreshButton = screen.getByRole("button", { name: "Refresh feature flags" });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledTimes(2);
    });
  });
});
