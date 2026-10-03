import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TodayPostPage from "@/app/(dashboard)/content/today/page";
import {
  BusinessService,
  ContentService,
  type BusinessResponse,
  type ContentItemResponse,
} from "@/lib/api";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/content/today",
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockBusiness: BusinessResponse = {
  id: "biz-test-today",
  owner_id: "user-test-today",
  name: "Crafty Studio",
  niche: "crafts",
  city: "Karachi",
  area: "Clifton",
  budget_pkr: 25000,
  hours_per_week: 15,
  tone: "inspirational",
  languages: ["roman_ur", "en"],
  platforms: ["instagram"],
  target_customer: "Youth",
  created_at: "2026-10-01T00:00:00Z",
};

const mockTodayItem: ContentItemResponse = {
  id: "item-today-1",
  calendar_id: "cal-today-1",
  day: 5,
  date: "2026-10-03",
  status: "approved",
  pillar: "behind_the_scenes",
  format: "reel",
  goal: "awareness",
  hook: "Kiya aapne kabhi clay pot making dekha hai?",
  caption: "Handmade ceramic pottery made right here in Karachi. Order yours now!",
  cta: "Link in bio to shop collection",
  hashtags: ["#potterypakistan", "#handmadeceramics"],
  best_time_hint: "6:30 PM PKT",
  image_prompt: { prompt: "Spinning ceramic wheel with potter clay hands" },
  video_prompt: { prompt: "15-second process video of carving delicate patterns" },
  alt_text: "Artisan shaping clay pot",
  created_at: "2026-10-01T12:00:00Z",
  updated_at: null,
};

describe("TodayPostPage Component (F-013 Today View)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(BusinessService, "getCurrentUserBusinessApiV1BusinessesGet").mockResolvedValue(
      mockBusiness
    );
  });

  it("renders today's scheduled post details and prompts", async () => {
    vi.spyOn(
      ContentService,
      "getTodayItemApiV1BusinessesBusinessIdContentTodayGet"
    ).mockResolvedValue(mockTodayItem);

    render(<TodayPostPage />);

    expect(screen.getByText(/loading today's scheduled post/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Kiya aapne kabhi clay pot making dekha hai?")).toBeInTheDocument();
    });

    expect(
      screen.getByText("Handmade ceramic pottery made right here in Karachi. Order yours now!")
    ).toBeInTheDocument();
    expect(screen.getByText("Link in bio to shop collection")).toBeInTheDocument();
    expect(screen.getByText("#potterypakistan")).toBeInTheDocument();
    expect(screen.getByText("#handmadeceramics")).toBeInTheDocument();
    expect(screen.getByText("6:30 PM PKT")).toBeInTheDocument();
    expect(
      screen.getByText('"Spinning ceramic wheel with potter clay hands"')
    ).toBeInTheDocument();
  });

  it("copies caption to clipboard on button click", async () => {
    vi.spyOn(
      ContentService,
      "getTodayItemApiV1BusinessesBusinessIdContentTodayGet"
    ).mockResolvedValue(mockTodayItem);

    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextSpy,
      },
    });

    render(<TodayPostPage />);

    await waitFor(() => {
      expect(screen.getByText("Kiya aapne kabhi clay pot making dekha hai?")).toBeInTheDocument();
    });

    const copyCaptionBtn = screen.getByRole("button", { name: /copy full caption/i });
    fireEvent.click(copyCaptionBtn);

    expect(writeTextSpy).toHaveBeenCalledWith(
      "Handmade ceramic pottery made right here in Karachi. Order yours now!"
    );
  });

  it("opens Mark as Posted modal and updates post status", async () => {
    vi.spyOn(
      ContentService,
      "getTodayItemApiV1BusinessesBusinessIdContentTodayGet"
    ).mockResolvedValue(mockTodayItem);

    const postSpy = vi
      .spyOn(
        ContentService,
        "postItemApiV1BusinessesBusinessIdContentItemsItemIdPostPost"
      )
      .mockResolvedValue({
        ...mockTodayItem,
        status: "posted",
        post_url: "https://instagram.com/p/test12345",
        posted_at: "2026-10-03T18:30:00Z",
      });

    render(<TodayPostPage />);

    await waitFor(() => {
      expect(screen.getByText("Kiya aapne kabhi clay pot making dekha hai?")).toBeInTheDocument();
    });

    const markBtn = screen.getByRole("button", { name: /mark as posted/i });
    fireEvent.click(markBtn);

    // Modal dialog is displayed
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Mark Day 5 as Posted")).toBeInTheDocument();

    const urlInput = screen.getByPlaceholderText("https://www.instagram.com/p/...");
    fireEvent.change(urlInput, { target: { value: "https://instagram.com/p/test12345" } });

    const confirmBtn = screen.getByRole("button", { name: /confirm & save/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith({
        businessId: "biz-test-today",
        itemId: "item-today-1",
        requestBody: {
          post_url: "https://instagram.com/p/test12345",
        },
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/post marked as published/i)).toBeInTheDocument();
    });
  });

  it("displays empty state when no post is scheduled", async () => {
    vi.spyOn(
      ContentService,
      "getTodayItemApiV1BusinessesBusinessIdContentTodayGet"
    ).mockResolvedValue(null as unknown as ContentItemResponse);

    render(<TodayPostPage />);

    await waitFor(() => {
      expect(screen.getByText(/no post scheduled for today/i)).toBeInTheDocument();
    });
  });
});
