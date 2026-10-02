"""Acceptance tests for Gemini API integration (Task 18 / I-001 / PRD §36.22, Q-004)."""

import os
import uuid
from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest
from agents import Agent, Runner, function_tool
from openai import APIConnectionError, AuthenticationError, RateLimitError
from pydantic import BaseModel, Field

from app.agents.llm import execute_with_retry, get_model
from app.agents.runner import run_agent
from app.agents.tracing import DbTraceProcessor

# ---------------------------------------------------------------------------
# Unit Tests (I-001) — Transient Retries & Error Handling
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_llm_retries_transient_failures_with_backoff() -> None:
    """execute_with_retry retries 3x with backoff on transient errors and succeeds."""
    attempts = 0

    async def transient_op() -> str:
        nonlocal attempts
        attempts += 1
        if attempts < 3:
            raise RateLimitError(
                "Resource exhausted",
                response=MagicMock(status_code=429),
                body={"error": {"message": "Resource exhausted"}},
            )
        return "operation_success"

    result = await execute_with_retry(transient_op, max_retries=3, initial_delay=0.01)
    assert result == "operation_success"
    assert attempts == 3


@pytest.mark.asyncio
async def test_llm_exhausted_retries_raises() -> None:
    """execute_with_retry raises after exceeding max retries."""
    attempts = 0

    async def failing_op() -> str:
        nonlocal attempts
        attempts += 1
        raise APIConnectionError(request=MagicMock())

    with pytest.raises(APIConnectionError):
        await execute_with_retry(failing_op, max_retries=3, initial_delay=0.01)
    assert attempts == 3


@pytest.mark.asyncio
async def test_llm_non_retryable_error_raises_immediately() -> None:
    """execute_with_retry does not retry permanent errors (e.g. ValueError)."""
    attempts = 0

    async def invalid_op() -> str:
        nonlocal attempts
        attempts += 1
        raise ValueError("Invalid argument supplied")

    with pytest.raises(ValueError, match="Invalid argument supplied"):
        await execute_with_retry(invalid_op, max_retries=3, initial_delay=0.01)
    assert attempts == 1


@pytest.mark.asyncio
async def test_invalid_api_key_caught_and_handled() -> None:
    """Failed API call due to invalid credentials is caught and logged, not crashing."""
    mock_db = AsyncMock()

    async def failing_workflow() -> None:
        raise AuthenticationError(
            "API key not valid",
            response=MagicMock(status_code=401),
            body={"error": {"message": "API key not valid"}},
        )

    with pytest.raises(AuthenticationError):
        await run_agent(
            db=mock_db,
            workflow="smoke_test_failure",
            user_id=uuid.uuid4(),
            business_id=None,
            execute_fn=failing_workflow,
            input_summary="Testing error handling on bad credentials",
        )

    # Verification: run_agent marks run as failed in db
    assert mock_db.add.called
    assert mock_db.flush.called


# ---------------------------------------------------------------------------
# Live Smoke Tests (I-001, §36.22, Q-004) — Gemini 2.5 Flash via OpenAI SDK
# ---------------------------------------------------------------------------

LIVE_KEY = os.getenv("GEMINI_API_KEY")
HAS_LIVE_KEY = bool(LIVE_KEY and LIVE_KEY not in ("missing-key-for-test", "test-key-not-for-live"))
skip_unless_live = pytest.mark.skipif(
    not HAS_LIVE_KEY,
    reason="GEMINI_API_KEY is not set or is a mock placeholder. Skipping live Gemini test.",
)


class SmokeBusinessEvaluation(BaseModel):
    """Structured output schema for smoke test."""

    business_type: str = Field(description="Categorized business type")
    viable: bool = Field(description="Whether the business idea is viable")
    initial_budget_pkr: int = Field(description="Estimated startup capital in PKR")


@function_tool
def calculate_startup_cost(materials_pkr: int, packaging_pkr: int) -> int:
    """Calculate the total startup cost in PKR."""
    return materials_pkr + packaging_pkr


@pytest.mark.live
@skip_unless_live
@pytest.mark.asyncio
async def test_live_gemini_tool_calling() -> None:
    """Integration (1/3): Agent invokes calculate_startup_cost tool and returns result (I-001)."""
    model = get_model()
    agent = Agent(
        name="CostEstimatorAgent",
        instructions="You calculate startup costs. Always call the calculate_startup_cost tool.",
        tools=[calculate_startup_cost],
        model=model,
    )

    result = await Runner.run(
        agent,
        input="Please calculate total startup cost for materials 5000 and packaging 1200 PKR.",
    )
    assert result.final_output is not None
    assert "6200" in str(result.final_output)


@pytest.mark.live
@skip_unless_live
@pytest.mark.asyncio
async def test_live_gemini_structured_output() -> None:
    """Integration (2/3): Agent returns valid structured output (I-001)."""
    model = get_model()
    agent = Agent(
        name="IdeaValidatorAgent",
        instructions="Validate the business idea and return the structured response.",
        output_type=SmokeBusinessEvaluation,
        model=model,
    )

    result = await Runner.run(
        agent,
        input="Business idea: Homemade samosas in Lahore with 15000 PKR budget.",
    )
    evaluation = result.final_output
    assert isinstance(evaluation, SmokeBusinessEvaluation)
    assert evaluation.viable is True
    assert evaluation.initial_budget_pkr > 0


@pytest.mark.live
@skip_unless_live
@pytest.mark.asyncio
async def test_live_gemini_handoff_and_tracing() -> None:
    """Integration (3/3): Agent A hands off to Agent B; both execute (Q-004)."""
    model = get_model()

    pricing_specialist = Agent(
        name="PricingSpecialist",
        instructions="You are a pricing specialist. Calculate and recommend prices in PKR.",
        model=model,
    )

    intake_agent = Agent(
        name="IntakeAgent",
        instructions="If user asks for pricing assistance, hand off to PricingSpecialist.",
        handoffs=[pricing_specialist],
        model=model,
    )

    mock_db = AsyncMock()
    trace_processor = DbTraceProcessor(db_session_factory=lambda: mock_db)

    async def execute_handoff_flow() -> Any:
        return await Runner.run(
            intake_agent,
            input="I want to know the pricing strategy for my crochet business in Karachi.",
        )

    run = await run_agent(
        db=mock_db,
        workflow="live_smoke_handoff",
        user_id=uuid.uuid4(),
        business_id=None,
        execute_fn=execute_handoff_flow,
        input_summary="Live smoke test: Intake -> PricingSpecialist handoff",
        trace_processor=trace_processor,
    )

    assert run.status == "completed"
