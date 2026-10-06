import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MentorServicesPage from "@/app/(dashboard)/mentor/services/page";
import {
  MentorsService,
  type MentorServiceResponse,
} from "@/lib/api";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/mentor/services",
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

const mockServicesList: MentorServiceResponse[] = [
  {
    id: "svc-1",
    mentor_id: "mentor-1",
    title: "1-on-1 Product Pricing Strategy",
    description: "Detailed unit economics and wholesale markups for Pakistani artisans.",
    niche: "handmade",
    type: "session",
    price_pkr: 3500,
    duration_min: 60,
    active: true,
    created_at: "2026-10-01T10:00:00Z",
    updated_at: null,
  },
  {
    id: "svc-2",
    mentor_id: "mentor-1",
    title: "Fashion Collection Launch Review",
    description: "Pre-launch audit of stitching samples, pattern grading, and sizing.",
    niche: "stitching_fashion",
    type: "review",
    price_pkr: 6000,
    duration_min: 90,
    active: false,
    created_at: "2026-10-02T12:00:00Z",
    updated_at: null,
  },
];

describe("MentorServicesPage (Task 38 / F-022)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(
      MentorsService,
      "listOwnMentorServicesApiV1MentorsMeServicesGet"
    ).mockImplementation(() => {
      return Promise.resolve([...mockServicesList]) as unknown as ReturnType<
        typeof MentorsService.listOwnMentorServicesApiV1MentorsMeServicesGet
      >;
    });

    vi.spyOn(
      MentorsService,
      "createOwnMentorServiceApiV1MentorsMeServicesPost"
    ).mockImplementation(({ requestBody }) => {
      const created: MentorServiceResponse = {
        id: "svc-new",
        mentor_id: "mentor-1",
        title: requestBody.title,
        description: requestBody.description,
        niche: requestBody.niche,
        type: requestBody.type,
        price_pkr: requestBody.price_pkr,
        duration_min: requestBody.duration_min ?? 60,
        active: requestBody.active ?? true,
        created_at: "2026-10-06T12:00:00Z",
        updated_at: null,
      };
      return Promise.resolve(created) as unknown as ReturnType<
        typeof MentorsService.createOwnMentorServiceApiV1MentorsMeServicesPost
      >;
    });

    vi.spyOn(
      MentorsService,
      "updateOwnMentorServiceApiV1MentorsMeServicesServiceIdPatch"
    ).mockImplementation(({ serviceId, requestBody }) => {
      const existing = mockServicesList.find((s) => s.id === serviceId) || mockServicesList[0];
      const updated: MentorServiceResponse = {
        ...existing,
        title: requestBody.title ?? existing.title,
        description: requestBody.description ?? existing.description,
        niche: requestBody.niche ?? existing.niche,
        type: requestBody.type ?? existing.type,
        price_pkr:
          requestBody.price_pkr !== undefined && requestBody.price_pkr !== null
            ? requestBody.price_pkr
            : existing.price_pkr,
        duration_min:
          requestBody.duration_min !== undefined && requestBody.duration_min !== null
            ? requestBody.duration_min
            : existing.duration_min,
        active:
          requestBody.active !== undefined && requestBody.active !== null
            ? requestBody.active
            : existing.active,
        updated_at: "2026-10-06T15:00:00Z",
      };
      return Promise.resolve(updated) as unknown as ReturnType<
        typeof MentorsService.updateOwnMentorServiceApiV1MentorsMeServicesServiceIdPatch
      >;
    });

    vi.spyOn(
      MentorsService,
      "deleteOwnMentorServiceApiV1MentorsMeServicesServiceIdDelete"
    ).mockImplementation(() => {
      return Promise.resolve() as unknown as ReturnType<
        typeof MentorsService.deleteOwnMentorServiceApiV1MentorsMeServicesServiceIdDelete
      >;
    });
  });

  it("renders services list and calculates overview metrics", async () => {
    render(<MentorServicesPage />);

    expect(screen.getByText(/My Advisory Services/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText("1-on-1 Product Pricing Strategy")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Fashion Collection Launch Review")
      ).toBeInTheDocument();
    });

    // Overview KPIs
    expect(screen.getByText("2")).toBeInTheDocument(); // Total services
    expect(screen.getByText("1")).toBeInTheDocument(); // Active offerings
    expect(screen.getByText("PKR 4,750")).toBeInTheDocument(); // Average fee ( (3500+6000)/2 = 4750 )
  });

  it("opens create modal and adds a new service", async () => {
    render(<MentorServicesPage />);

    await waitFor(() => {
      expect(screen.getByText("1-on-1 Product Pricing Strategy")).toBeInTheDocument();
    });

    const addBtn = screen.getByRole("button", { name: /Add New Service/i });
    fireEvent.click(addBtn);

    expect(screen.getByText("Add New Advisory Service")).toBeInTheDocument();

    // Fill form
    const titleInput = screen.getByLabelText(/Service Title \*/i);
    fireEvent.change(titleInput, { target: { value: "Baking Cost Breakdown & Packaging" } });

    const descInput = screen.getByLabelText(/Service Description \*/i);
    fireEvent.change(descInput, {
      target: { value: "Step-by-step ingredient yield calculations and local box sourcing." },
    });

    const nicheSelect = screen.getByLabelText(/Specialty \/ Niche \*/i);
    fireEvent.change(nicheSelect, { target: { value: "food" } });

    const saveBtn = screen.getByRole("button", { name: /Save Service/i });
    fireEvent.submit(saveBtn.closest("form")!);

    await waitFor(() => {
      expect(
        MentorsService.createOwnMentorServiceApiV1MentorsMeServicesPost
      ).toHaveBeenCalledWith({
        requestBody: {
          title: "Baking Cost Breakdown & Packaging",
          description: "Step-by-step ingredient yield calculations and local box sourcing.",
          niche: "food",
          type: "session",
          price_pkr: 3000,
          duration_min: 60,
          active: true,
        },
      });
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Service "Baking Cost Breakdown & Packaging" created successfully!/i)
      ).toBeInTheDocument();
    });
  });

  it("opens edit modal and saves updated service", async () => {
    render(<MentorServicesPage />);

    await waitFor(() => {
      expect(screen.getByText("1-on-1 Product Pricing Strategy")).toBeInTheDocument();
    });

    const editBtn = screen.getByLabelText("Edit 1-on-1 Product Pricing Strategy");
    fireEvent.click(editBtn);

    expect(screen.getByText("Edit Advisory Service")).toBeInTheDocument();

    const priceInput = screen.getByLabelText(/Price \(PKR\) \*/i);
    fireEvent.change(priceInput, { target: { value: "4000" } });

    const saveBtn = screen.getByRole("button", { name: /Save Service/i });
    fireEvent.submit(saveBtn.closest("form")!);

    await waitFor(() => {
      expect(
        MentorsService.updateOwnMentorServiceApiV1MentorsMeServicesServiceIdPatch
      ).toHaveBeenCalledWith({
        serviceId: "svc-1",
        requestBody: {
          title: "1-on-1 Product Pricing Strategy",
          description: "Detailed unit economics and wholesale markups for Pakistani artisans.",
          niche: "handmade",
          type: "session",
          price_pkr: 4000,
          duration_min: 60,
          active: true,
        },
      });
    });
  });

  it("toggles active status directly on service card", async () => {
    render(<MentorServicesPage />);

    await waitFor(() => {
      expect(screen.getByText("1-on-1 Product Pricing Strategy")).toBeInTheDocument();
    });

    const toggleBtn = screen.getByTitle("Click to Pause");
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(
        MentorsService.updateOwnMentorServiceApiV1MentorsMeServicesServiceIdPatch
      ).toHaveBeenCalledWith({
        serviceId: "svc-1",
        requestBody: {
          active: false,
        },
      });
    });
  });

  it("opens delete confirmation modal and deletes service", async () => {
    render(<MentorServicesPage />);

    await waitFor(() => {
      expect(screen.getByText("1-on-1 Product Pricing Strategy")).toBeInTheDocument();
    });

    const deleteBtn = screen.getByLabelText("Delete 1-on-1 Product Pricing Strategy");
    fireEvent.click(deleteBtn);

    expect(screen.getByText("Delete Advisory Service?")).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: /Delete Service/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(
        MentorsService.deleteOwnMentorServiceApiV1MentorsMeServicesServiceIdDelete
      ).toHaveBeenCalledWith({
        serviceId: "svc-1",
      });
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Service "1-on-1 Product Pricing Strategy" was successfully deleted/i)
      ).toBeInTheDocument();
    });
  });
});
