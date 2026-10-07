import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import MentorApprovalsPage from "@/app/(admin)/admin/mentors/page";
import { AdminService, type PendingMentorApplicationItem } from "@/lib/api";

const mockApplications: PendingMentorApplicationItem[] = [
  {
    id: "mentor-app-1",
    user_id: "user-1",
    name: "Dr. Fatima Zahra",
    email: "fatima.zahra@example.com",
    city: "Lahore",
    bio: "12 years in textile manufacturing and artisanal supply chain management.",
    niches: ["textiles", "export", "pricing"],
    languages: ["Urdu", "English", "Punjabi"],
    user_status: "pending",
    mentor_status: "pending",
    created_at: "2026-10-05T09:00:00Z",
  },
  {
    id: "mentor-app-2",
    user_id: "user-2",
    name: "Kamran Siddiqui",
    email: "kamran@ecomgrowth.pk",
    city: "Karachi",
    bio: "E-commerce growth lead, Shopify & Daraz scaling expert.",
    niches: ["ecommerce", "digital_marketing"],
    languages: ["Urdu", "English"],
    user_status: "pending",
    mentor_status: "pending",
    created_at: "2026-10-06T14:30:00Z",
  },
];

describe("MentorApprovalsPage (Task 44 / F-030)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads and displays pending mentor applications list", async () => {
    vi.spyOn(
      AdminService,
      "getPendingMentorApplicationsApiV1AdminMentorsPendingGet"
    ).mockResolvedValueOnce(mockApplications);

    render(<MentorApprovalsPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Mentor Approvals" })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Dr. Fatima Zahra")).toBeInTheDocument();
      expect(screen.getByText("Kamran Siddiqui")).toBeInTheDocument();
    });

    expect(screen.getByText("fatima.zahra@example.com")).toBeInTheDocument();
    expect(screen.getByText("Lahore")).toBeInTheDocument();
    expect(screen.getAllByText("textiles").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Speaks: Urdu, English, Punjabi/)).toBeInTheDocument();
  });

  it("displays empty state when there are no pending applications", async () => {
    vi.spyOn(
      AdminService,
      "getPendingMentorApplicationsApiV1AdminMentorsPendingGet"
    ).mockResolvedValueOnce([]);

    render(<MentorApprovalsPage />);

    await waitFor(() => {
      expect(screen.getByText("No Pending Applications")).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        "All mentor registration applications have been reviewed and approved."
      )
    ).toBeInTheDocument();
  });

  it("handles 1-click Approve action successfully", async () => {
    vi.spyOn(
      AdminService,
      "getPendingMentorApplicationsApiV1AdminMentorsPendingGet"
    ).mockResolvedValue(mockApplications);

    const approveSpy = vi
      .spyOn(
        AdminService,
        "approveMentorApplicationApiV1AdminMentorsMentorIdApprovePost"
      )
      .mockResolvedValueOnce({
        id: "mentor-app-1",
        user_id: "user-1",
        status: "active",
        message: "Mentor Dr. Fatima Zahra approved successfully.",
      });

    render(<MentorApprovalsPage />);

    await waitFor(() => {
      expect(screen.getByText("Dr. Fatima Zahra")).toBeInTheDocument();
    });

    const approveButtons = screen.getAllByRole("button", {
      name: /approve application/i,
    });
    fireEvent.click(approveButtons[0]);

    await waitFor(() => {
      expect(approveSpy).toHaveBeenCalledWith({ mentorId: "mentor-app-1" });
      expect(
        screen.getByText("Mentor Dr. Fatima Zahra approved successfully.")
      ).toBeInTheDocument();
    });
  });

  it("opens decline modal, submits decline with reason", async () => {
    vi.spyOn(
      AdminService,
      "getPendingMentorApplicationsApiV1AdminMentorsPendingGet"
    ).mockResolvedValue(mockApplications);

    const declineSpy = vi
      .spyOn(
        AdminService,
        "declineMentorApplicationApiV1AdminMentorsMentorIdDeclinePost"
      )
      .mockResolvedValueOnce({
        id: "mentor-app-2",
        user_id: "user-2",
        status: "declined",
        message: "Application for Kamran Siddiqui has been declined.",
      });

    render(<MentorApprovalsPage />);

    await waitFor(() => {
      expect(screen.getByText("Kamran Siddiqui")).toBeInTheDocument();
    });

    const declineButtons = screen.getAllByRole("button", {
      name: /decline/i,
    });
    // Click decline for Kamran (second button)
    fireEvent.click(declineButtons[1]);

    // Modal opens
    expect(screen.getByText("Decline Mentor Application")).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to decline the mentor application for/i)
    ).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(
      /Please provide more details on your industry experience/i
    );
    fireEvent.change(textarea, {
      target: { value: "Need more verifiable experience in e-commerce." },
    });

    const confirmButton = screen.getByRole("button", {
      name: /confirm decline/i,
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(declineSpy).toHaveBeenCalledWith({
        mentorId: "mentor-app-2",
        reason: "Need more verifiable experience in e-commerce.",
      });
      expect(
        screen.getByText("Application for Kamran Siddiqui has been declined.")
      ).toBeInTheDocument();
    });
  });

  it("filters applications by search query", async () => {
    vi.spyOn(
      AdminService,
      "getPendingMentorApplicationsApiV1AdminMentorsPendingGet"
    ).mockResolvedValueOnce(mockApplications);

    render(<MentorApprovalsPage />);

    await waitFor(() => {
      expect(screen.getByText("Dr. Fatima Zahra")).toBeInTheDocument();
      expect(screen.getByText("Kamran Siddiqui")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      /search by name, email, niche, or city.../i
    );
    fireEvent.change(searchInput, { target: { value: "Karachi" } });

    expect(screen.queryByText("Dr. Fatima Zahra")).not.toBeInTheDocument();
    expect(screen.getByText("Kamran Siddiqui")).toBeInTheDocument();
  });

  it("displays error message when API fails to load", async () => {
    vi.spyOn(
      AdminService,
      "getPendingMentorApplicationsApiV1AdminMentorsPendingGet"
    ).mockRejectedValueOnce(new Error("Network Error"));

    render(<MentorApprovalsPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Unable to connect to the administration service.")
      ).toBeInTheDocument();
    });
  });
});
