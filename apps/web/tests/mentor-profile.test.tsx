import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MentorProfilePage from "@/app/(dashboard)/mentor/profile/page";
import { MentorsService, type MentorProfileResponse } from "@/lib/api";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/mentor/profile",
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

const mockMentorProfile: MentorProfileResponse = {
  id: "mentor-profile-1",
  user_id: "user-mentor-1",
  name: "Dr. Ayesha Tariq",
  email: "ayesha.tariq@hunar.pk",
  avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2",
  bio: "12+ years advising handmade and apparel micro-brands on pricing and regional export.",
  city: "Lahore",
  niches: ["handmade", "stitching_fashion"],
  languages: ["ur", "en"],
  rating: 4.9,
  review_count: 18,
  status: "active",
  created_at: "2026-09-01T10:00:00Z",
  updated_at: "2026-10-01T12:00:00Z",
};

describe("MentorProfilePage (Task 37 / F-021)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(MentorsService, "getOwnMentorProfileApiV1MentorsMeGet").mockImplementation(() => {
      return Promise.resolve(mockMentorProfile) as unknown as ReturnType<
        typeof MentorsService.getOwnMentorProfileApiV1MentorsMeGet
      >;
    });

    vi.spyOn(MentorsService, "updateOwnMentorProfileApiV1MentorsMePatch").mockImplementation(
      ({ requestBody }) => {
        const updated: MentorProfileResponse = {
          ...mockMentorProfile,
          city: requestBody.city || mockMentorProfile.city,
          bio: requestBody.bio || mockMentorProfile.bio,
          avatar_url: requestBody.avatar_url ?? mockMentorProfile.avatar_url,
          niches: requestBody.niches || mockMentorProfile.niches,
          languages: requestBody.languages || mockMentorProfile.languages,
          updated_at: "2026-10-06T15:00:00Z",
        };
        return Promise.resolve(updated) as unknown as ReturnType<
          typeof MentorsService.updateOwnMentorProfileApiV1MentorsMePatch
        >;
      }
    );
  });

  it("renders profile editor and loads mentor details", async () => {
    render(<MentorProfilePage />);

    expect(
      screen.getByText(/Mentor Profile Editor/i)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByDisplayValue("Dr. Ayesha Tariq")).toBeInTheDocument();
      expect(screen.getByDisplayValue("ayesha.tariq@hunar.pk")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Lahore")).toBeInTheDocument();
      expect(
        screen.getByDisplayValue(/12\+ years advising handmade and apparel micro-brands/i)
      ).toBeInTheDocument();
    });

    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("4.9")).toBeInTheDocument();
    expect(screen.getByText("(18 reviews)")).toBeInTheDocument();
  });

  it("allows updating city, bio, and toggling specialties", async () => {
    render(<MentorProfilePage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Lahore")).toBeInTheDocument();
    });

    // Change city
    const citySelect = screen.getByLabelText(/Primary Location \/ City/i);
    fireEvent.change(citySelect, { target: { value: "Karachi" } });
    expect(screen.getByDisplayValue("Karachi")).toBeInTheDocument();

    // Toggle niche: click 'Food & Baking' to add it
    const foodNicheBtn = screen.getByRole("button", { name: /Food & Baking/i });
    fireEvent.click(foodNicheBtn);

    // Update bio
    const bioTextarea = screen.getByPlaceholderText(
      /Share your business journey, past executive roles/i
    );
    fireEvent.change(bioTextarea, {
      target: {
        value: "Updated bio focusing on nationwide logistics and scaling artisan workshops.",
      },
    });

    // Submit form
    const saveButton = screen.getByRole("button", { name: /Save Profile/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(MentorsService.updateOwnMentorProfileApiV1MentorsMePatch).toHaveBeenCalledWith({
        requestBody: {
          city: "Karachi",
          bio: "Updated bio focusing on nationwide logistics and scaling artisan workshops.",
          avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2",
          niches: ["handmade", "stitching_fashion", "food"],
          languages: ["ur", "en"],
        },
      });
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Your mentor profile has been successfully updated!/i)
      ).toBeInTheDocument();
    });
  });

  it("validates empty bio before submitting", async () => {
    render(<MentorProfilePage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Lahore")).toBeInTheDocument();
    });

    const bioTextarea = screen.getByPlaceholderText(
      /Share your business journey, past executive roles/i
    );
    fireEvent.change(bioTextarea, { target: { value: "   " } });

    const saveButton = screen.getByRole("button", { name: /Save Profile/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Bio cannot be empty. Please describe your mentoring expertise./i)
      ).toBeInTheDocument();
    });

    expect(MentorsService.updateOwnMentorProfileApiV1MentorsMePatch).not.toHaveBeenCalled();
  });

  it("resets modified fields when Reset Changes is clicked", async () => {
    render(<MentorProfilePage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Lahore")).toBeInTheDocument();
    });

    const citySelect = screen.getByLabelText(/Primary Location \/ City/i);
    fireEvent.change(citySelect, { target: { value: "Islamabad" } });
    expect(screen.getByDisplayValue("Islamabad")).toBeInTheDocument();

    const resetButton = screen.getByRole("button", { name: /Reset Changes/i });
    fireEvent.click(resetButton);

    expect(screen.getByDisplayValue("Lahore")).toBeInTheDocument();
  });
});
