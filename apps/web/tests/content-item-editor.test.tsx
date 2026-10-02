import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ContentItemEditorPage from "@/app/(dashboard)/content/items/[id]/page";
import {
  BusinessService,
  ContentService,
  type BusinessResponse,
  type ContentItemResponse,
} from "@/lib/api";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/content/items/item-123",
  useParams: () => ({ id: "item-123" }),
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockBusiness: BusinessResponse = {
  id: "biz-test-123",
  owner_id: "user-test-123",
  name: "Fatima Handmades",
  niche: "apparel",
  city: "Lahore",
  area: "Gulberg",
  budget_pkr: 35000,
  hours_per_week: 20,
  tone: "friendly",
  languages: ["roman_ur"],
  platforms: ["instagram"],
  target_customer: "Women",
  created_at: "2026-10-01T00:00:00Z",
};

const mockItem: ContentItemResponse = {
  id: "item-123",
  calendar_id: "cal-test-123",
  day: 1,
  date: "2026-10-01",
  status: "draft",
  pillar: "behind_the_scenes",
  format: "reel",
  goal: "awareness",
  hook: "Dekhein kaisay banta hai pure raw silk dupatta",
  caption: "Har suit ke peechay 3 din ki mehnat hoti hai. Order karein!",
  cta: "Order on WhatsApp",
  hashtags: ["#handmadelahore", "#silkpakistan"],
  best_time_hint: "7:00 PM PKT",
  image_prompt: { prompt: "Close up shot of artisan hands weaving silk threads" },
  video_prompt: { prompt: "Fast paced cut of fabric dipping in vibrant dye" },
  alt_text: "Artisan working on raw silk loom",
  created_at: "2026-10-01T12:00:00Z",
  updated_at: null,
};

describe("ContentItemEditorPage Component (F-012 Content Item Detail/Editor)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(BusinessService, "getCurrentUserBusinessApiV1BusinessesGet").mockResolvedValue(
      mockBusiness
    );
    vi.spyOn(
      ContentService,
      "getItemApiV1BusinessesBusinessIdContentItemsItemIdGet"
    ).mockResolvedValue(mockItem);
  });

  it("renders item fields correctly", async () => {
    render(<ContentItemEditorPage />);

    expect(screen.getByText(/loading content item details/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Day 1 — Content Editor")).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue("Dekhein kaisay banta hai pure raw silk dupatta")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Har suit ke peechay 3 din ki mehnat hoti hai. Order karein!")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Order on WhatsApp")).toBeInTheDocument();
    expect(screen.getByDisplayValue("#handmadelahore #silkpakistan")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Close up shot of artisan hands weaving silk threads")).toBeInTheDocument();
  });

  it("allows updating item copy and saving updates", async () => {
    const updateSpy = vi
      .spyOn(
        ContentService,
        "updateItemApiV1BusinessesBusinessIdContentItemsItemIdPut"
      )
      .mockResolvedValue({
        ...mockItem,
        hook: "Updated Hook for Day 1",
        caption: "Updated Caption with even more detail.",
        status: "approved",
      });

    render(<ContentItemEditorPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Dekhein kaisay banta hai pure raw silk dupatta")).toBeInTheDocument();
    });

    const hookInput = screen.getByDisplayValue("Dekhein kaisay banta hai pure raw silk dupatta");
    fireEvent.change(hookInput, { target: { value: "Updated Hook for Day 1" } });

    const captionInput = screen.getByDisplayValue("Har suit ke peechay 3 din ki mehnat hoti hai. Order karein!");
    fireEvent.change(captionInput, { target: { value: "Updated Caption with even more detail." } });

    const statusSelect = screen.getByLabelText("Status");
    fireEvent.change(statusSelect, { target: { value: "approved" } });

    // Submit form by clicking Save Changes
    const saveButton = screen.getAllByRole("button", { name: /save changes/i })[0];
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith({
        businessId: "biz-test-123",
        itemId: "item-123",
        requestBody: expect.objectContaining({
          hook: "Updated Hook for Day 1",
          caption: "Updated Caption with even more detail.",
          status: "approved",
        }),
      });
    });

    expect(screen.getByText(/content item updated successfully/i)).toBeInTheDocument();
  });

  it("handles copy to clipboard actions", async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextSpy,
      },
    });

    render(<ContentItemEditorPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Dekhein kaisay banta hai pure raw silk dupatta")).toBeInTheDocument();
    });

    const copyHookBtn = screen.getByRole("button", { name: /copy hook/i });
    fireEvent.click(copyHookBtn);

    expect(writeTextSpy).toHaveBeenCalledWith("Dekhein kaisay banta hai pure raw silk dupatta");
  });
});
