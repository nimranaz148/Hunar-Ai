import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import BrowseMentorsPage from "@/app/(dashboard)/mentors/page";
import {
  ServicesService,
  type MentorServiceItemResponse,
  type MentorServiceDetailResponse,
} from "@/lib/api";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/mentors",
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockItems: MentorServiceItemResponse[] = [
  {
    id: "svc-1",
    mentor_id: "m-1",
    mentor_name: "Tariq Mansoor",
    mentor_avatar_url: null,
    mentor_city: "Lahore",
    mentor_rating: 4.9,
    mentor_review_count: 18,
    title: "1-on-1 Artisanal Product Pricing & Margins",
    description: "Deep dive review of your unit economics, material costs, and packaging margins.",
    niche: "handmade",
    type: "session",
    price_pkr: 3500,
    duration_min: 60,
    active: true,
    created_at: "2026-10-05T12:00:00Z",
  },
  {
    id: "svc-2",
    mentor_id: "m-2",
    mentor_name: "Zainab Raza",
    mentor_avatar_url: null,
    mentor_city: "Karachi",
    mentor_rating: 5.0,
    mentor_review_count: 24,
    title: "Fashion Catalog & Reels Audit",
    description: "Review your Instagram styling, visual hooks, and catalog layout.",
    niche: "stitching_fashion",
    type: "review",
    price_pkr: 4500,
    duration_min: 45,
    active: true,
    created_at: "2026-10-05T12:00:00Z",
  },
];

const mockServicesList = {
  items: mockItems,
  total: 2,
  page: 1,
  page_size: 20,
};

const mockServiceDetail: MentorServiceDetailResponse = {
  ...mockItems[0],
  mentor_bio: "10+ years helping Pakistani artisanal brands scale.",
  mentor_languages: ["ur", "en"],
  mentor_niches: ["handmade"],
};

describe("Task 34: Browse Mentor Services (F-018 / PRD §5, §13.2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page header, search input, and filter controls", async () => {
    vi.spyOn(ServicesService, "browseServicesApiV1ServicesGet").mockReturnValue({
      then: (resolve: (val: unknown) => unknown) => Promise.resolve(resolve(mockServicesList)),
    } as ReturnType<typeof ServicesService.browseServicesApiV1ServicesGet>);

    render(<BrowseMentorsPage />);

    expect(screen.getByText("Browse Mentor Services")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search services, mentors, or keywords...")).toBeInTheDocument();
    expect(screen.getByText("All Specialties")).toBeInTheDocument();
    expect(screen.getByText("Handmade Crafts")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("1-on-1 Artisanal Product Pricing & Margins")).toBeInTheDocument();
      expect(screen.getByText("Fashion Catalog & Reels Audit")).toBeInTheDocument();
    });
  });

  it("displays service card metadata including mentor name, rating, duration, and price", async () => {
    vi.spyOn(ServicesService, "browseServicesApiV1ServicesGet").mockReturnValue({
      then: (resolve: (val: unknown) => unknown) => Promise.resolve(resolve(mockServicesList)),
    } as ReturnType<typeof ServicesService.browseServicesApiV1ServicesGet>);

    render(<BrowseMentorsPage />);

    await waitFor(() => {
      expect(screen.getByText("Tariq Mansoor")).toBeInTheDocument();
      expect(screen.getByText("Lahore")).toBeInTheDocument();
      expect(screen.getByText("Rs 3,500")).toBeInTheDocument();
      expect(screen.getByText("60 minutes")).toBeInTheDocument();

      expect(screen.getByText("Zainab Raza")).toBeInTheDocument();
      expect(screen.getByText("Karachi")).toBeInTheDocument();
      expect(screen.getByText("Rs 4,500")).toBeInTheDocument();
      expect(screen.getByText("45 minutes")).toBeInTheDocument();
    });
  });

  it("renders empty state when no services match search", async () => {
    vi.spyOn(ServicesService, "browseServicesApiV1ServicesGet").mockReturnValue({
      then: (resolve: (val: unknown) => unknown) =>
        Promise.resolve(
          resolve({
            items: [],
            total: 0,
            page: 1,
            page_size: 20,
          })
        ),
    } as ReturnType<typeof ServicesService.browseServicesApiV1ServicesGet>);

    render(<BrowseMentorsPage />);

    await waitFor(() => {
      expect(screen.getByText("No mentor services found")).toBeInTheDocument();
    });
  });

  it("opens slide-over detail drawer when clicking Details button", async () => {
    vi.spyOn(ServicesService, "browseServicesApiV1ServicesGet").mockReturnValue({
      then: (resolve: (val: unknown) => unknown) => Promise.resolve(resolve(mockServicesList)),
    } as ReturnType<typeof ServicesService.browseServicesApiV1ServicesGet>);
    vi.spyOn(ServicesService, "getServiceApiV1ServicesServiceIdGet").mockReturnValue({
      then: (resolve: (val: unknown) => unknown) => Promise.resolve(resolve(mockServiceDetail)),
    } as ReturnType<typeof ServicesService.getServiceApiV1ServicesServiceIdGet>);

    render(<BrowseMentorsPage />);

    await waitFor(() => {
      expect(screen.getByText("1-on-1 Artisanal Product Pricing & Margins")).toBeInTheDocument();
    });

    const detailsButtons = screen.getAllByRole("button", { name: /view details for/i });
    fireEvent.click(detailsButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("What this session includes")).toBeInTheDocument();
      expect(screen.getByText("Continue to Book")).toBeInTheDocument();
    });
  });
});
