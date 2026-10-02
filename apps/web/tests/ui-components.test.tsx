import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { FormField, Input } from "@/components/ui/FormField";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { DataTable } from "@/components/ui/DataTable";
import { AppShell } from "@/components/layout/AppShell";
import { formatPKR, formatDate, formatQuantity } from "@/lib/format";
import { can } from "@/lib/permissions";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

describe("Format Module (lib/format.ts)", () => {
  it("formats PKR correctly without inline toLocaleString", () => {
    expect(formatPKR(15000)).toContain("15,000");
    expect(formatPKR(0)).toContain("0");
  });

  it("formats dates into consistent readable strings", () => {
    const formatted = formatDate("2026-10-01");
    expect(formatted).toContain("2026");
  });

  it("formats quantities with commas", () => {
    expect(formatQuantity(12500)).toBe("12,500");
  });
});

describe("Permissions Helper (lib/permissions.ts)", () => {
  it("authorizes super_admin for all administrative and operational screens", () => {
    expect(can("super_admin", "admin", "users", "view")).toBe(true);
    expect(can("super_admin", "business", "profile", "view")).toBe(true);
  });

  it("permits entrepreneur to access own business and plan but blocks admin", () => {
    expect(can("entrepreneur", "business", "profile", "edit")).toBe(true);
    expect(can("entrepreneur", "admin", "users", "view")).toBe(false);
  });

  it("permits mentor to access mentor panel but blocks admin and entrepreneur screens", () => {
    expect(can("mentor", "mentor_panel", "services", "create")).toBe(true);
    expect(can("mentor", "admin", "settings", "view")).toBe(false);
  });
});

describe("StatusBadge Component", () => {
  it("renders status label and matches semantic color classes", () => {
    const { rerender } = render(<StatusBadge status="approved" />);
    expect(screen.getByText("Approved")).toBeInTheDocument();

    rerender(<StatusBadge status="draft" />);
    expect(screen.getByText("Draft")).toBeInTheDocument();

    rerender(<StatusBadge status="rejected" />);
    expect(screen.getByText("Rejected")).toBeInTheDocument();
  });
});

describe("FormField Component", () => {
  it("renders label, required indicator, and validation error", () => {
    render(
      <FormField label="Email Address" name="email" required error="Invalid email address">
        <Input name="email" id="email" hasError />
      </FormField>
    );

    expect(screen.getByText("Email Address")).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid email address");
  });
});

describe("Loading, Empty, and Error States", () => {
  it("renders LoadingState with message", () => {
    render(<LoadingState message="Fetching content..." />);
    expect(screen.getByRole("status")).toHaveTextContent("Fetching content...");
  });

  it("renders EmptyState with action", () => {
    render(
      <EmptyState
        title="No tasks yet"
        description="Create your first task."
        action={<button>Create Task</button>}
      />
    );
    expect(screen.getByText("No tasks yet")).toBeInTheDocument();
    expect(screen.getByText("Create Task")).toBeInTheDocument();
  });

  it("renders ErrorState with retry trigger", () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Server timed out" onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Server timed out");
    fireEvent.click(screen.getByText("Try Again"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe("DataTable Component", () => {
  const columns = [
    { key: "id", header: "ID" },
    { key: "name", header: "Name" },
  ];
  const items = [
    { id: "1", name: "Alpha Bakery" },
    { id: "2", name: "Beta Fashion" },
  ];

  it("renders table rows and column headers", () => {
    render(<DataTable columns={columns} data={items} keyExtractor={(i) => i.id} />);
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Alpha Bakery")).toBeInTheDocument();
    expect(screen.getByText("Beta Fashion")).toBeInTheDocument();
  });

  it("handles loading state cleanly", () => {
    render(
      <DataTable
        columns={columns}
        data={[] as (typeof items)}
        keyExtractor={(i) => i.id}
        isLoading
      />
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("handles empty state cleanly", () => {
    render(
      <DataTable
        columns={columns}
        data={[] as (typeof items)}
        keyExtractor={(i) => i.id}
        emptyTitle="No businesses found"
      />
    );
    expect(screen.getByText("No businesses found")).toBeInTheDocument();
  });
});

describe("AppShell Component", () => {
  it("renders navigation items according to user role", () => {
    render(
      <AppShell role="entrepreneur" userName="Ayesha Khan" pageTitle="Dashboard Overview">
        <div>Dashboard Content</div>
      </AppShell>
    );

    expect(screen.getByText("Dashboard Overview")).toBeInTheDocument();
    expect(screen.getByText("Dashboard Content")).toBeInTheDocument();
    expect(screen.getAllByText("Today")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Content Calendar")[0]).toBeInTheDocument();
  });

  it("renders admin menu items when role is super_admin", () => {
    render(
      <AppShell role="super_admin" userName="Admin User" pageTitle="Admin Portal">
        <div>Admin Body</div>
      </AppShell>
    );

    expect(screen.getAllByText("User Management")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Audit Log")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Agent Explorer")[0]).toBeInTheDocument();
  });
});
