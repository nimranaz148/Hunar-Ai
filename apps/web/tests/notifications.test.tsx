import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NotificationsInboxPage from "@/app/(dashboard)/notifications/page";
import { NotificationBell } from "@/components/layout/NotificationBell";
import {
  AuthService,
  NotificationsService,
  type NotificationListResponse,
  type UnreadCountResponse,
  type UserResponse,
} from "@/lib/api";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/notifications",
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

const mockUser: UserResponse = {
  id: "user-123",
  email: "fatima@hunar.pk",
  name: "Fatima Ali",
  role: "entrepreneur",
  status: "active",
  language: "roman_ur",
  created_at: "2026-10-01T00:00:00Z",
};

const mockNotificationsData: NotificationListResponse = {
  items: [
    {
      id: 1,
      user_id: "user-123",
      title: "Weekly Review Ready",
      message: "Your weekly AI coach recommendations are ready for review.",
      type: "agent",
      link: "/metrics",
      is_read: false,
      created_at: "2026-10-09T18:00:00Z",
    },
    {
      id: 2,
      user_id: "user-123",
      title: "Mentor Session Confirmed",
      message: "Ayesha Siddiqua accepted your booking for tomorrow.",
      type: "booking",
      link: "/mentors/bookings",
      is_read: false,
      created_at: "2026-10-09T17:30:00Z",
    },
    {
      id: 3,
      user_id: "user-123",
      title: "Plan Milestone Complete",
      message: "You marked Launch Plan Task #2 as complete.",
      type: "milestone",
      link: "/plan",
      is_read: true,
      created_at: "2026-10-08T12:00:00Z",
    },
  ],
  total: 3,
  unread_count: 2,
  page: 1,
  page_size: 20,
};

describe("NotificationBell Component (F-038)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders notification bell with unread badge when unread notifications exist", async () => {
    vi.spyOn(
      NotificationsService,
      "getNotificationsUnreadCountApiV1NotificationsUnreadCountGet"
    ).mockResolvedValue({ unread_count: 5 });

    render(<NotificationBell />);

    await waitFor(() => {
      expect(screen.getByTestId("notification-unread-badge")).toBeInTheDocument();
    });

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "5 unread notifications" })).toHaveAttribute(
      "href",
      "/notifications"
    );
  });

  it("renders notification bell without badge when zero unread notifications", async () => {
    vi.spyOn(
      NotificationsService,
      "getNotificationsUnreadCountApiV1NotificationsUnreadCountGet"
    ).mockResolvedValue({ unread_count: 0 });

    render(<NotificationBell />);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Notifications inbox" })).toBeInTheDocument();
    });

    expect(screen.queryByTestId("notification-unread-badge")).not.toBeInTheDocument();
  });
});

describe("NotificationsInboxPage (Task 55 / F-038)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthService, "getMeApiV1AuthMeGet").mockResolvedValue(mockUser);
  });

  it("shows loading state initially and renders notifications list upon fetch", async () => {
    vi.spyOn(
      NotificationsService,
      "listNotificationsApiV1NotificationsGet"
    ).mockResolvedValue(mockNotificationsData);

    render(<NotificationsInboxPage />);

    expect(screen.getByText("Loading notifications...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Loading notifications...")).not.toBeInTheDocument();
    });

    // Check header
    expect(screen.getByText("Notifications Inbox")).toBeInTheDocument();

    // Check items
    expect(screen.getByText("Weekly Review Ready")).toBeInTheDocument();
    expect(screen.getByText("Mentor Session Confirmed")).toBeInTheDocument();
    expect(screen.getByText("Plan Milestone Complete")).toBeInTheDocument();

    // Check unread counter pills and dots
    expect(screen.getAllByTestId("unread-dot").length).toBe(2);
    expect(screen.getByTestId("filter-tab-unread")).toHaveTextContent("2");

    // Check detail links
    expect(screen.getAllByRole("link", { name: /view details/i }).length).toBe(3);
  });

  it("filters unread notifications when unread tab is clicked", async () => {
    const listSpy = vi
      .spyOn(NotificationsService, "listNotificationsApiV1NotificationsGet")
      .mockResolvedValue(mockNotificationsData);

    render(<NotificationsInboxPage />);

    await waitFor(() => {
      expect(screen.getByText("Weekly Review Ready")).toBeInTheDocument();
    });

    const unreadTab = screen.getByTestId("filter-tab-unread");
    fireEvent.click(unreadTab);

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith({
        unreadOnly: true,
        page: 1,
        pageSize: 20,
      });
    });
  });

  it("marks a single notification as read", async () => {
    vi.spyOn(
      NotificationsService,
      "listNotificationsApiV1NotificationsGet"
    ).mockResolvedValue(mockNotificationsData);

    const markSingleSpy = vi
      .spyOn(
        NotificationsService,
        "markSingleNotificationReadApiV1NotificationsNotificationIdReadPatch"
      )
      .mockResolvedValue({
        id: 1,
        is_read: true,
        read_at: "2026-10-09T18:05:00Z",
      });

    render(<NotificationsInboxPage />);

    await waitFor(() => {
      expect(screen.getByText("Weekly Review Ready")).toBeInTheDocument();
    });

    const markBtn = screen.getByTestId("mark-read-btn-1");
    fireEvent.click(markBtn);

    await waitFor(() => {
      expect(markSingleSpy).toHaveBeenCalledWith({ notificationId: 1 });
    });

    // That notification should now be marked read (no longer show Mark read button)
    await waitFor(() => {
      expect(screen.queryByTestId("mark-read-btn-1")).not.toBeInTheDocument();
    });
  });

  it("marks all notifications as read upon clicking Mark all as read", async () => {
    vi.spyOn(
      NotificationsService,
      "listNotificationsApiV1NotificationsGet"
    ).mockResolvedValue(mockNotificationsData);

    const markAllSpy = vi
      .spyOn(
        NotificationsService,
        "markAllNotificationsReadApiV1NotificationsReadAllPost"
      )
      .mockResolvedValue({ marked_count: 2 });

    render(<NotificationsInboxPage />);

    await waitFor(() => {
      expect(screen.getByText("Weekly Review Ready")).toBeInTheDocument();
    });

    const markAllBtn = screen.getByTestId("mark-all-read-button");
    fireEvent.click(markAllBtn);

    await waitFor(() => {
      expect(markAllSpy).toHaveBeenCalled();
    });

    // Both unread dots should disappear
    await waitFor(() => {
      expect(screen.queryAllByTestId("unread-dot").length).toBe(0);
    });
  });

  it("renders empty state when no notifications exist", async () => {
    vi.spyOn(
      NotificationsService,
      "listNotificationsApiV1NotificationsGet"
    ).mockResolvedValue({
      items: [],
      total: 0,
      unread_count: 0,
      page: 1,
      page_size: 20,
    });

    render(<NotificationsInboxPage />);

    await waitFor(() => {
      expect(screen.getByText("You're all caught up!")).toBeInTheDocument();
    });

    expect(screen.getByText("No notifications found in your inbox.")).toBeInTheDocument();
  });

  it("handles error state and provides retry action", async () => {
    const errorSpy = vi
      .spyOn(NotificationsService, "listNotificationsApiV1NotificationsGet")
      .mockRejectedValueOnce(new Error("Network connection failed"))
      .mockResolvedValueOnce(mockNotificationsData);

    render(<NotificationsInboxPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load notifications")).toBeInTheDocument();
    });

    expect(screen.getByText("Network connection failed")).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: /try again/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText("Notifications Inbox")).toBeInTheDocument();
    });

    expect(errorSpy).toHaveBeenCalledTimes(2);
  });
});
