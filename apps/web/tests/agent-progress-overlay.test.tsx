import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AgentProgressOverlay } from "@/components/agents/AgentProgressOverlay";
import {
  AgentsService,
  AgentProgressEvent,
  AgentProgressStep,
} from "@/lib/api";

const mockEvent: AgentProgressEvent = {
  run_id: "run-test-123",
  workflow: "content_calendar",
  status: AgentProgressEvent.status.RUNNING,
  steps: [
    {
      name: "Research complete",
      status: AgentProgressStep.status.COMPLETED,
      detail: "3 competitors found",
    },
    {
      name: "Strategy outline ready",
      status: AgentProgressStep.status.COMPLETED,
      detail: "Hooks defined",
    },
    {
      name: "Writing batch 1/4 (days 1-8)",
      status: AgentProgressStep.status.IN_PROGRESS,
      detail: "Generating captions",
    },
    {
      name: "Writing batch 2/4",
      status: AgentProgressStep.status.PENDING,
      detail: "",
    },
  ],
};

describe("AgentProgressOverlay Component (F-042 / PRD §648-669)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AgentsService, "getRunProgressApiV1AgentsRunsRunIdGet").mockResolvedValue(
      mockEvent
    );
    vi.spyOn(AgentsService, "cancelRunApiV1AgentsRunsRunIdCancelPost").mockResolvedValue({
      run_id: "run-test-123",
      status: "failed",
      message: "Agent run cancelled successfully.",
    });
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <AgentProgressOverlay
        runId="run-test-123"
        isOpen={false}
        onClose={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("does not render when runId is null", () => {
    const { container } = render(
      <AgentProgressOverlay
        runId={null}
        isOpen={true}
        onClose={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders overlay with header, steps, and progress indicators", async () => {
    render(
      <AgentProgressOverlay
        runId="run-test-123"
        workflowName="content calendar"
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    // Initial render shows generation title
    expect(screen.getByText(/Generating your content calendar/i)).toBeInTheDocument();

    // Verify steps render after polling/streaming resolves
    await waitFor(() => {
      expect(screen.getByText("Research complete")).toBeInTheDocument();
      expect(screen.getByText("(3 competitors found)")).toBeInTheDocument();
      expect(screen.getByText("Writing batch 1/4 (days 1-8)")).toBeInTheDocument();
      expect(screen.getByText("Writing batch 2/4")).toBeInTheDocument();
    });
  });

  it("minimizes to floating pill on 'Dismiss to background' and expands back", async () => {
    render(
      <AgentProgressOverlay
        runId="run-test-123"
        workflowName="content calendar"
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Research complete")).toBeInTheDocument();
    });

    // Click Dismiss to background
    const dismissBtn = screen.getByText("Dismiss to background");
    fireEvent.click(dismissBtn);

    // Modal dialog disappears, floating status pill appears
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();

    // Expand back
    const expandBtn = screen.getByLabelText("Expand progress overlay");
    fireEvent.click(expandBtn);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("invokes cancellation when 'Cancel Run' is clicked", async () => {
    const onCancelledMock = vi.fn();
    render(
      <AgentProgressOverlay
        runId="run-test-123"
        workflowName="content calendar"
        isOpen={true}
        onClose={vi.fn()}
        onCancelled={onCancelledMock}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Cancel Run")).toBeInTheDocument();
    });

    const cancelBtn = screen.getByText("Cancel Run");
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(
        AgentsService.cancelRunApiV1AgentsRunsRunIdCancelPost
      ).toHaveBeenCalledWith({ runId: "run-test-123" });
      expect(onCancelledMock).toHaveBeenCalled();
    });
  });
});
