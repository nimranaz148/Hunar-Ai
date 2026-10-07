import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import MentorApplyPage from "@/app/(auth)/mentor-apply/page";
import { AuthService, ApiError } from "@/lib/api";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText(/full name/i), {
    target: { name: "name", value: "Nadia Malik" },
  });
  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { name: "email", value: "nadia@example.com" },
  });
  const passwordInputs = screen.getAllByPlaceholderText("••••••••");
  fireEvent.change(passwordInputs[0], {
    target: { name: "password", value: "Secure123" },
  });
  fireEvent.change(passwordInputs[1], {
    target: { name: "confirm_password", value: "Secure123" },
  });
  fireEvent.change(screen.getByLabelText(/city/i), {
    target: { name: "city", value: "Lahore" },
  });
  fireEvent.change(screen.getByLabelText(/bio/i), {
    target: {
      name: "bio",
      value: "I have 10 years of experience in textile manufacturing.",
    },
  });
  fireEvent.click(screen.getByRole("button", { name: "Embroidery" }));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe("MentorApplyPage", () => {
  it("renders the form with all required fields", () => {
    render(<MentorApplyPage />);

    expect(
      screen.getByRole("heading", { name: /apply as a mentor/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bio/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /submit application/i })
    ).toBeInTheDocument();
  });

  it("shows validation errors on empty submit", async () => {
    render(<MentorApplyPage />);

    fireEvent.click(screen.getByRole("button", { name: /submit application/i }));

    await waitFor(() => {
      expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/at least one niche/i)).toBeInTheDocument();
  });

  it("shows password mismatch error", async () => {
    render(<MentorApplyPage />);

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { name: "name", value: "Nadia Malik" },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { name: "email", value: "nadia@example.com" },
    });
    const passwordInputs = screen.getAllByPlaceholderText("••••••••");
    fireEvent.change(passwordInputs[0], {
      target: { name: "password", value: "Secure123" },
    });
    fireEvent.change(passwordInputs[1], {
      target: { name: "confirm_password", value: "Different456" },
    });
    fireEvent.change(screen.getByLabelText(/city/i), {
      target: { name: "city", value: "Lahore" },
    });
    fireEvent.change(screen.getByLabelText(/bio/i), {
      target: {
        name: "bio",
        value: "10+ years experience in embroidery teaching.",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Embroidery" }));

    fireEvent.click(screen.getByRole("button", { name: /submit application/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it("shows success state after successful submission", async () => {
    vi.spyOn(
      AuthService,
      "mentorApplyApiV1AuthMentorApplyPost"
    ).mockResolvedValueOnce({
      user_id: "new-mentor-uuid",
      mentor_id: "new-profile-uuid",
      name: "Nadia Malik",
      email: "nadia@example.com",
      status: "pending",
      message: "Application submitted successfully",
    });

    render(<MentorApplyPage />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: /submit application/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /application submitted/i })
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/our team will review/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in once/i })).toBeInTheDocument();
  });

  it("shows server error on 500 API failure", async () => {
    vi.spyOn(
      AuthService,
      "mentorApplyApiV1AuthMentorApplyPost"
    ).mockRejectedValueOnce({
      status: 500,
      body: { detail: "Internal server error" },
    });

    render(<MentorApplyPage />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: /submit application/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("shows duplicate email error on 409 conflict", async () => {
    const apiError = new ApiError(
      { method: "POST", url: "/api/v1/auth/mentor-apply" },
      {
        url: "/api/v1/auth/mentor-apply",
        ok: false,
        status: 409,
        statusText: "Conflict",
        body: { detail: "Email already registered" },
      },
      "Conflict"
    );

    vi.spyOn(
      AuthService,
      "mentorApplyApiV1AuthMentorApplyPost"
    ).mockRejectedValueOnce(apiError);

    render(<MentorApplyPage />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: /submit application/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/already exists/i)
      ).toBeInTheDocument();
    });
  });

  it("renders login and signup links in footer", () => {
    render(<MentorApplyPage />);

    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/login"
    );
    expect(
      screen.getByRole("link", { name: /sign up here/i })
    ).toHaveAttribute("href", "/signup");
  });
});
