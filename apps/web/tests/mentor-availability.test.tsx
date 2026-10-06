import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MentorAvailabilityPage from "@/app/(dashboard)/mentor/availability/page";
import {
  MentorsService,
  type MentorAvailabilityResponse,
  type MentorAvailabilityUpdateRequest,
} from "@/lib/api";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/mentor/availability",
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

const mockAvailabilityResponse: MentorAvailabilityResponse = {
  slots: [
    { weekday: 0, start_time: "09:00", end_time: "17:00", is_available: true },
    { weekday: 1, start_time: "09:00", end_time: "17:00", is_available: true },
    { weekday: 2, start_time: "09:00", end_time: "17:00", is_available: true },
    { weekday: 3, start_time: "09:00", end_time: "17:00", is_available: true },
    { weekday: 4, start_time: "09:00", end_time: "17:00", is_available: true },
    { weekday: 5, start_time: "10:00", end_time: "14:00", is_available: false },
    { weekday: 6, start_time: "10:00", end_time: "14:00", is_available: false },
  ],
};

describe("MentorAvailabilityPage (Task 39 / F-023)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(
      MentorsService,
      "getOwnAvailabilityApiV1MentorsMeAvailabilityGet"
    ).mockImplementation(() => {
      return Promise.resolve(mockAvailabilityResponse) as unknown as ReturnType<
        typeof MentorsService.getOwnAvailabilityApiV1MentorsMeAvailabilityGet
      >;
    });

    vi.spyOn(
      MentorsService,
      "updateOwnAvailabilityApiV1MentorsMeAvailabilityPut"
    ).mockImplementation(({ requestBody }: { requestBody: MentorAvailabilityUpdateRequest }) => {
      return Promise.resolve({
        slots: requestBody.slots,
      }) as unknown as ReturnType<
        typeof MentorsService.updateOwnAvailabilityApiV1MentorsMeAvailabilityPut
      >;
    });
  });

  it("renders weekly schedule and KPI summary after loading", async () => {
    render(<MentorAvailabilityPage />);

    expect(screen.getByText("Loading your weekly schedule...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Weekly Availability")).toBeInTheDocument();
      expect(screen.getByText("Monday")).toBeInTheDocument();
      expect(screen.getByText("Sunday")).toBeInTheDocument();
    });

    // 5 active days * 8 hours = 40.0 hrs
    expect(screen.getByText("40.0 hrs")).toBeInTheDocument();
    expect(screen.getByText("5 of 7 days")).toBeInTheDocument();
  });

  it("toggles day availability and updates active day count", async () => {
    render(<MentorAvailabilityPage />);

    await waitFor(() => {
      expect(screen.getByText("Monday")).toBeInTheDocument();
    });

    const saturdayCheckbox = screen.getByLabelText("Toggle Saturday availability");
    expect(saturdayCheckbox).not.toBeChecked();

    fireEvent.click(saturdayCheckbox);

    expect(saturdayCheckbox).toBeChecked();
    // 5 weekdays (40 hrs) + Saturday (10:00 to 14:00 = 4 hrs) = 44.0 hrs, 6 days
    await waitFor(() => {
      expect(screen.getByText("6 of 7 days")).toBeInTheDocument();
      expect(screen.getByText("44.0 hrs")).toBeInTheDocument();
    });
  });

  it("updates time slots and recalculates duration", async () => {
    render(<MentorAvailabilityPage />);

    await waitFor(() => {
      expect(screen.getByLabelText("Monday Start Time")).toBeInTheDocument();
    });

    const startTimeSelect = screen.getByLabelText("Monday Start Time");
    const endTimeSelect = screen.getByLabelText("Monday End Time");

    fireEvent.change(startTimeSelect, { target: { value: "10:00" } });
    fireEvent.change(endTimeSelect, { target: { value: "16:00" } });

    // Duration is now 6 hrs instead of 8 hrs -> Total: 4*8 + 6 = 38.0 hrs
    await waitFor(() => {
      expect(screen.getByText("38.0 hrs")).toBeInTheDocument();
    });
  });

  it("applies Monday schedule to all weekdays when helper button is clicked", async () => {
    render(<MentorAvailabilityPage />);

    await waitFor(() => {
      expect(screen.getByLabelText("Monday Start Time")).toBeInTheDocument();
    });

    // Change Monday to 10:00 to 15:00 (5 hrs)
    fireEvent.change(screen.getByLabelText("Monday Start Time"), {
      target: { value: "10:00" },
    });
    fireEvent.change(screen.getByLabelText("Monday End Time"), {
      target: { value: "15:00" },
    });

    const copyBtn = screen.getByRole("button", { name: /Copy Mon to Weekdays/i });
    fireEvent.click(copyBtn);

    // Tuesday to Friday should also now be 10:00 to 15:00
    // Total: 5 days * 5 hrs = 25.0 hrs
    await waitFor(() => {
      expect(screen.getByText("25.0 hrs")).toBeInTheDocument();
      expect(
        screen.getByText(/Applied Monday schedule to all weekdays/i)
      ).toBeInTheDocument();
    });
  });

  it("validates time order (start_time < end_time) and halts submission if invalid", async () => {
    render(<MentorAvailabilityPage />);

    await waitFor(() => {
      expect(screen.getByLabelText("Monday Start Time")).toBeInTheDocument();
    });

    // Set Monday start time after end time (18:00 to 09:00)
    fireEvent.change(screen.getByLabelText("Monday Start Time"), {
      target: { value: "18:00" },
    });
    fireEvent.change(screen.getByLabelText("Monday End Time"), {
      target: { value: "09:00" },
    });

    const saveButtons = screen.getAllByRole("button", { name: /Save Schedule/i });
    fireEvent.click(saveButtons[0]);

    await waitFor(() => {
      expect(
        screen.getByText("Please fix time slot errors before saving.")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Start time must be before end time.")
      ).toBeInTheDocument();
    });

    expect(
      MentorsService.updateOwnAvailabilityApiV1MentorsMeAvailabilityPut
    ).not.toHaveBeenCalled();
  });

  it("saves updated availability to backend API on form submit", async () => {
    render(<MentorAvailabilityPage />);

    await waitFor(() => {
      expect(screen.getByLabelText("Monday Start Time")).toBeInTheDocument();
    });

    // Change Monday time
    fireEvent.change(screen.getByLabelText("Monday Start Time"), {
      target: { value: "08:00" },
    });

    const saveButtons = screen.getAllByRole("button", { name: /Save Schedule/i });
    fireEvent.click(saveButtons[0]);

    await waitFor(() => {
      expect(
        MentorsService.updateOwnAvailabilityApiV1MentorsMeAvailabilityPut
      ).toHaveBeenCalledTimes(1);
      expect(
        screen.getByText("Weekly availability schedule saved successfully!")
      ).toBeInTheDocument();
    });
  });
});
