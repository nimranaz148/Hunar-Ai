import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MentorMenteesPage from "@/app/(dashboard)/mentor/mentees/page";
import {
  MentorsService,
  type MenteeListResponse,
  type MenteeDetailResponse,
} from "@/lib/api";

const mockPush = vi.fn();
let mockSearchParamId: string | null = null;

vi.mock("next/navigation", () => ({
  usePathname: () => "/mentor/mentees",
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === "id" ? mockSearchParamId : null),
  }),
}));

const mockMenteesListData: MenteeListResponse = {
  total_count: 2,
  mentees: [
    {
      entrepreneur_id: "mentee-001",
      name: "Amina Khan",
      email: "amina@crochetstudio.pk",
      business_name: "Amina Crochet Studio",
      business_niche: "handmade",
      business_city: "Karachi",
      total_bookings: 2,
      latest_booking_status: "accepted",
      latest_booking_date: "2026-10-12T10:00:00Z",
      tasks_completed: 12,
      tasks_total: 24,
    },
    {
      entrepreneur_id: "mentee-002",
      name: "Sara Ali",
      email: "sara@bakes.pk",
      business_name: "Sara Sweet Delights",
      business_niche: "food_baking",
      business_city: "Lahore",
      total_bookings: 1,
      latest_booking_status: "completed",
      latest_booking_date: "2026-10-05T15:00:00Z",
      tasks_completed: 4,
      tasks_total: 20,
    },
  ],
};

const mockMenteeDetailData: MenteeDetailResponse = {
  entrepreneur_id: "mentee-001",
  name: "Amina Khan",
  email: "amina@crochetstudio.pk",
  business_id: "biz-001",
  business_name: "Amina Crochet Studio",
  niche: "handmade",
  city: "Karachi",
  area: "Gulshan-e-Iqbal",
  budget_pkr: 25000,
  hours_per_week: 20,
  tone: "friendly",
  languages: ["ur", "en"],
  platforms: ["Instagram", "WhatsApp"],
  target_customer: "Gift shoppers and young mothers looking for customized baby blankets.",
  validation_confidence: "high",
  competitor_gap: "Personalized baby name embroidery on handmade crochet items.",
  products_count: 3,
  plan_status: "approved",
  tasks_total: 24,
  tasks_completed: 12,
  completion_rate: 50.0,
  recent_tasks: [
    {
      id: "task-001",
      title: "Set up WhatsApp Business Catalog with pricing",
      category: "setup",
      week: 1,
      status: "completed",
      due_date: "2026-10-08",
    },
    {
      id: "task-002",
      title: "Design and order branded packaging bags",
      category: "operations",
      week: 2,
      status: "in_progress",
      due_date: "2026-10-15",
    },
  ],
  content_items_total: 30,
  content_items_posted: 6,
  session_history: [
    {
      id: "booking-001",
      service_title: "Handmade Cost & Pricing Audit",
      service_type: "session",
      scheduled_at: "2026-10-12T10:00:00Z",
      status: "accepted",
      amount_pkr: 3500,
      duration_min: 60,
      notes: "Need guidance on volume discount margins for upcoming festival orders.",
      session_notes: null,
      created_at: "2026-10-06T10:00:00Z",
    },
  ],
  mentor_brief: {
    executive_summary:
      "Amina Khan operates Amina Crochet Studio in Karachi. She has completed 50% of her launch roadmap and has 6 published social posts.",
    stage: "Early Sales & Customer Discovery (Week 2)",
    key_blockers: [
      "Struggling to standardize yarn procurement costs.",
      "Mentee noted: 'Need guidance on volume discount margins for upcoming festival orders.'",
    ],
    focus_areas: [
      "Review direct packaging and raw material costs.",
      "Establish strict MOQ (minimum order quantity) rules for custom embroidery.",
    ],
    recommended_questions: [
      "Aap yarn local market se le rahi hain ya bulk supplier se?",
      "Pehlay orders par delivery charges customer pay kar raha hai ya aap absorb kar rahi hain?",
    ],
    growth_priorities: [
      "Complete Week 2 packaging milestones.",
      "Publish 3 behind-the-scenes reels on Instagram.",
    ],
  },
};

describe("MentorMenteesPage (Task 41 / F-025)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParamId = null;
  });

  it("renders empty state when mentor has no booked mentees", async () => {
    vi.spyOn(MentorsService, "listOwnMenteesApiV1MentorsMeMenteesGet").mockResolvedValue({
      total_count: 0,
      mentees: [],
    });

    render(<MentorMenteesPage />);

    expect(
      screen.getByText(/Loading your booked mentees\.\.\./i)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("No mentees booked yet")).toBeInTheDocument();
    });
    expect(screen.getByText("Total Booked Mentees")).toBeInTheDocument();
  });

  it("renders mentee cards and KPI metrics when mentees are available", async () => {
    vi.spyOn(MentorsService, "listOwnMenteesApiV1MentorsMeMenteesGet").mockResolvedValue(
      mockMenteesListData
    );

    render(<MentorMenteesPage />);

    await waitFor(() => {
      expect(screen.getByText("Amina Khan")).toBeInTheDocument();
      expect(screen.getByText("Sara Ali")).toBeInTheDocument();
    });

    expect(screen.getByText("Amina Crochet Studio")).toBeInTheDocument();
    expect(screen.getByText("Sara Sweet Delights")).toBeInTheDocument();
    expect(screen.getByText("Karachi")).toBeInTheDocument();
    expect(screen.getByText("Lahore")).toBeInTheDocument();

    // Check KPI Cards
    expect(screen.getByText("16")).toBeInTheDocument(); // 12 + 4 completed tasks
    expect(screen.getByText("36%")).toBeInTheDocument(); // 16 / 44 = 36%
  });

  it("filters mentees by search query input", async () => {
    vi.spyOn(MentorsService, "listOwnMenteesApiV1MentorsMeMenteesGet").mockResolvedValue(
      mockMenteesListData
    );

    render(<MentorMenteesPage />);

    await waitFor(() => {
      expect(screen.getByText("Amina Khan")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search mentees by name/i);
    fireEvent.change(searchInput, { target: { value: "Lahore" } });

    expect(screen.queryByText("Amina Khan")).not.toBeInTheDocument();
    expect(screen.getByText("Sara Ali")).toBeInTheDocument();
  });

  it("opens detailed Mentee Brief and Progress view when clicking View Mentee Brief", async () => {
    vi.spyOn(MentorsService, "listOwnMenteesApiV1MentorsMeMenteesGet").mockResolvedValue(
      mockMenteesListData
    );
    const getDetailSpy = vi
      .spyOn(
        MentorsService,
        "getOwnMenteeDetailApiV1MentorsMeMenteesMenteeIdGet"
      )
      .mockResolvedValue(mockMenteeDetailData);

    render(<MentorMenteesPage />);

    await waitFor(() => {
      expect(screen.getByText("Amina Khan")).toBeInTheDocument();
    });

    const briefButtons = screen.getAllByRole("button", { name: /View Mentee Brief/i });
    fireEvent.click(briefButtons[0]);

    await waitFor(() => {
      expect(getDetailSpy).toHaveBeenCalledWith({ menteeId: "mentee-001" });
      expect(screen.getByTestId("mentor-brief-card")).toBeInTheDocument();
    });

    // Check Briefing sections
    expect(
      screen.getByText("Early Sales & Customer Discovery (Week 2)")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Amina Khan operates Amina Crochet Studio in Karachi/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Struggling to standardize yarn procurement costs/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Review direct packaging and raw material costs/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Aap yarn local market se le rahi hain ya bulk supplier se/i)
    ).toBeInTheDocument();

    // Check Launch Plan Progress
    expect(screen.getByText("50% Completed")).toBeInTheDocument();
    expect(
      screen.getByText("Set up WhatsApp Business Catalog with pricing")
    ).toBeInTheDocument();

    // Check Session History
    expect(
      screen.getByText("Handmade Cost & Pricing Audit")
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Need guidance on volume discount margins/i).length
    ).toBeGreaterThan(0);

    // Navigate back to list
    const backBtn = screen.getByRole("button", { name: /Back to Mentees List/i });
    fireEvent.click(backBtn);

    await waitFor(() => {
      expect(screen.getByText("Mentees & Progress Reports")).toBeInTheDocument();
      expect(screen.queryByTestId("mentor-brief-card")).not.toBeInTheDocument();
    });
  });

  it("automatically loads detailed Mentee Brief when URL has id search parameter", async () => {
    mockSearchParamId = "mentee-001";
    vi.spyOn(MentorsService, "listOwnMenteesApiV1MentorsMeMenteesGet").mockResolvedValue(
      mockMenteesListData
    );
    vi.spyOn(
      MentorsService,
      "getOwnMenteeDetailApiV1MentorsMeMenteesMenteeIdGet"
    ).mockResolvedValue(mockMenteeDetailData);

    render(<MentorMenteesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("mentor-brief-card")).toBeInTheDocument();
      expect(screen.getByText("PKR 25,000")).toBeInTheDocument();
    });
  });

  it("handles and displays error state with retry on API failure", async () => {
    const listSpy = vi
      .spyOn(MentorsService, "listOwnMenteesApiV1MentorsMeMenteesGet")
      .mockRejectedValueOnce(new Error("Network timeout"));

    render(<MentorMenteesPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load mentees")).toBeInTheDocument();
      expect(screen.getByText("Network timeout")).toBeInTheDocument();
    });

    listSpy.mockResolvedValueOnce(mockMenteesListData);
    const retryBtn = screen.getByRole("button", { name: /Try Again/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText("Amina Khan")).toBeInTheDocument();
    });
  });
});
