"""Acceptance tests for Agent Service Skeleton (Task 08 / PRD §36)."""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from agents import OpenAIChatCompletionsModel
from agents.tracing import function_span
from openai import RateLimitError

from app.agents.config import agent_config
from app.agents.llm import execute_with_retry, get_model, get_openai_client
from app.agents.runner import KillSwitchActiveError, get_agent_semaphore, run_agent
from app.agents.tools import calc_pricing, fetch_user_business, search_market
from app.agents.tracing import DbTraceProcessor, sanitize_and_truncate_data
from app.core.config import settings


def test_llm_client_configuration(monkeypatch: pytest.MonkeyPatch) -> None:
    """llm.py creates an AsyncOpenAI client pointed at Gemini base URL with API key."""
    # Pin the model so a developer's local .env (GEMINI_MODEL) cannot change the result.
    monkeypatch.setattr(settings, "GEMINI_MODEL", "gemini-2.5-flash")
    client = get_openai_client()
    assert str(client.base_url).startswith("https://generativelanguage.googleapis.com")

    wrapped = get_model()
    model = wrapped._providers[0][1]  # type: ignore[attr-defined]
    assert isinstance(model, OpenAIChatCompletionsModel)
    assert model.model == "gemini-2.5-flash"


@pytest.mark.asyncio
async def test_llm_retry_on_transient_failure() -> None:
    """execute_with_retry retries up to 3 times on RateLimitError with backoff."""
    call_count = 0

    async def flaky_call() -> str:
        nonlocal call_count
        call_count += 1
        if call_count < 3:
            raise RateLimitError("Quota exceeded", response=MagicMock(), body={})
        return "success"

    result = await execute_with_retry(flaky_call, max_retries=3, initial_delay=0.01)
    assert result == "success"
    assert call_count == 3


def test_sanitize_and_truncate_data() -> None:
    """DbTraceProcessor redacts secrets and truncates data > 1500 chars (PRD §36.19)."""
    # 1. Secret redaction
    sensitive_payload = {
        "api_key": "AIzaSySecretKey123",
        "gemini_api_key": "secret",
        "user_password": "PlainPassword",
        "normal_field": "Hunar platform",
    }
    cleaned = sanitize_and_truncate_data(sensitive_payload)
    assert cleaned["api_key"] == "[REDACTED]"
    assert cleaned["gemini_api_key"] == "[REDACTED]"
    assert cleaned["user_password"] == "[REDACTED]"
    assert cleaned["normal_field"] == "Hunar platform"

    # 2. Truncation
    large_payload = {"huge": "x" * 2000}
    truncated = sanitize_and_truncate_data(large_payload, max_chars=1500)
    assert len(str(truncated)) <= 1600


@pytest.mark.asyncio
async def test_db_trace_processor_records_spans() -> None:
    """DbTraceProcessor extracts spans and flushes them to agent_steps."""
    processor = DbTraceProcessor()

    # Create and complete a function span
    span = function_span("pricing_calculator")
    span.start()
    span.span_data.input = '{"cost": 500}'
    span.span_data.output = '{"price": 1000}'
    span.finish()

    processor.on_span_end(span)
    assert len(processor.buffered_spans) == 1

    buffered = processor.buffered_spans[0]
    assert buffered["span_type"] == "function"
    assert buffered["data"]["name"] == "pricing_calculator"

    # Mock AsyncSession flush
    mock_db = AsyncMock()
    mock_db.add = MagicMock()
    steps = await processor.flush_to_db(mock_db)

    assert len(steps) == 1
    assert mock_db.add.called
    assert steps[0].span_type == "function"


@pytest.mark.asyncio
async def test_agent_runner_lifecycle_success() -> None:
    """run_agent tracks queued -> running -> succeeded with audit log."""
    mock_db = AsyncMock()
    mock_db.add = MagicMock()

    user_id = uuid.uuid4()

    async def sample_work() -> dict[str, str]:
        return {"report": "Validation complete"}

    with patch("app.agents.runner.record_audit_log", new_callable=AsyncMock) as mock_audit:
        agent_run = await run_agent(
            db=mock_db,
            workflow="onboarding_intake",
            user_id=user_id,
            business_id=None,
            execute_fn=sample_work,
            input_summary="Home bakery in Karachi",
        )

        assert agent_run.status == "succeeded"
        assert agent_run.workflow == "onboarding_intake"
        assert agent_run.started_at is not None
        assert agent_run.ended_at is not None
        assert "Validation complete" in (agent_run.output_summary or "")
        assert mock_audit.call_count >= 1


@pytest.mark.asyncio
async def test_agent_runner_kill_switch() -> None:
    """run_agent halts execution when emergency kill switch is enabled."""
    mock_db = AsyncMock()
    mock_db.add = MagicMock()

    agent_config.kill_switch = True
    try:
        with patch("app.agents.runner.record_audit_log", new_callable=AsyncMock) as mock_audit:
            with pytest.raises(KillSwitchActiveError):
                await run_agent(
                    db=mock_db,
                    workflow="launch_planner",
                    user_id=uuid.uuid4(),
                    business_id=None,
                    execute_fn=AsyncMock(),
                )
            assert mock_audit.call_count == 1
            # Check blocked audit action
            assert mock_audit.call_args[1]["action"] == "agent.run.blocked"
    finally:
        agent_config.kill_switch = False


@pytest.mark.asyncio
async def test_agent_runner_concurrency_semaphore() -> None:
    """run_agent respects concurrency limits (max 5 runs)."""
    sem = get_agent_semaphore()
    assert sem._value == 5


def test_tool_catalog_deterministic_pricing() -> None:
    """calc_pricing calculates exact margin and break-even units."""
    result = calc_pricing(
        unit_cost_pkr=800.0,
        desired_margin_pct=20.0,
        fixed_overhead_pkr=10000.0,
    )
    # Price = 800 / 0.8 = 1000.0
    assert result["recommended_price_pkr"] == 1000.0
    assert result["profit_per_unit_pkr"] == 200.0
    # Break even = 10000 / 200 = 50 units
    assert result["break_even_units"] == 50


@pytest.mark.asyncio
async def test_tool_catalog_type_hints() -> None:
    """Tools have correct types and return expected signatures."""
    search_res = await search_market("custom cake design", city="Lahore")
    assert search_res["city"] == "Lahore"
    assert "results" in search_res

    biz_res = await fetch_user_business("biz-123", "usr-456")
    assert biz_res["business_id"] == "biz-123"
