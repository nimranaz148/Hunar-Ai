"""LLM integration: OpenRouter (primary) with automatic Gemini fallback, via the Agents SDK.

Every agent calls ``get_model()``. When both providers are configured it returns a
``FallbackModel``: requests go to OpenRouter first; on rate-limit, credit, auth, model or
network errors the same request is retried on Gemini, and a quota-exhausted provider is skipped
for a cool-down so later calls do not waste time on it.
"""

import asyncio
import dataclasses
import logging
import time
from collections.abc import AsyncIterator, Awaitable, Callable
from typing import Any

from agents import Agent, Model, OpenAIChatCompletionsModel, Runner
from openai import APIConnectionError, APIStatusError, AsyncOpenAI, RateLimitError

from app.agents.config import PLACEHOLDER_KEYS, agent_config

logger = logging.getLogger(__name__)


def get_openai_client() -> AsyncOpenAI:
    """Create an AsyncOpenAI client configured for Google Gemini's endpoint."""
    return AsyncOpenAI(
        base_url=agent_config.gemini_base_url,
        api_key=agent_config.gemini_api_key or "missing-key-for-test",
    )


def get_openrouter_client() -> AsyncOpenAI:
    """Create an AsyncOpenAI client configured for OpenRouter."""
    return AsyncOpenAI(
        base_url=agent_config.openrouter_base_url,
        api_key=agent_config.openrouter_api_key,
        default_headers={"X-Title": "Hunar"},
    )


# provider label -> monotonic time until which it is skipped (quota/credit exhausted)
_cooldowns: dict[str, float] = {}
RATE_LIMIT_COOLDOWN_S = 60.0  # OpenRouter free tier is 20 requests/minute
CREDIT_COOLDOWN_S = 900.0
PROVIDER_TIMEOUT_S = 90.0  # a hung provider must not block the fallback


def _cooldown_for(exc: Exception) -> float:
    if isinstance(exc, APIStatusError):
        if exc.status_code == 429:
            return RATE_LIMIT_COOLDOWN_S
        if exc.status_code in (401, 402, 403):
            return CREDIT_COOLDOWN_S
    return 0.0


def _adapt_for_provider(
    label: str, args: tuple[Any, ...], kwargs: dict[str, Any]
) -> tuple[tuple[Any, ...], dict[str, Any]]:
    """Gemini rejects forced tool calls (tool_choice=required) combined with JSON output.

    Signature: get_response(system_instructions, input, model_settings, tools, output_schema, ...)
    """
    if label != "gemini":
        return args, kwargs
    items: list[Any] = list(args)
    settings_idx = 2
    schema = kwargs.get("output_schema", items[4] if len(items) > 4 else None)
    current = kwargs.get(
        "model_settings", items[settings_idx] if len(items) > settings_idx else None
    )
    if schema is not None and current is not None and current.tool_choice == "required":
        fixed = dataclasses.replace(current, tool_choice=None)
        if "model_settings" in kwargs:
            kwargs = {**kwargs, "model_settings": fixed}
        else:
            items[settings_idx] = fixed
    return tuple(items), kwargs


class FallbackModel(Model):
    """Tries providers in order; the first one that answers wins."""

    def __init__(self, providers: list[tuple[str, Model]]) -> None:
        self._providers = providers

    def _order(self) -> list[tuple[str, Model]]:
        now = time.monotonic()
        live = [p for p in self._providers if _cooldowns.get(p[0], 0.0) <= now]
        # If everything is cooling down, still try all of them rather than failing outright.
        return live or self._providers

    async def get_response(self, *args: Any, **kwargs: Any) -> Any:
        last: Exception | None = None
        for label, model in self._order():
            p_args, p_kwargs = _adapt_for_provider(label, args, kwargs)
            try:
                return await asyncio.wait_for(
                    model.get_response(*p_args, **p_kwargs), timeout=PROVIDER_TIMEOUT_S
                )
            except Exception as exc:
                last = exc
                _cooldowns[label] = time.monotonic() + _cooldown_for(exc)
                logger.warning("LLM provider %s failed (%s); trying next provider.", label, exc)
        raise last or RuntimeError("No LLM provider configured")

    async def stream_response(self, *args: Any, **kwargs: Any) -> AsyncIterator[Any]:
        last: Exception | None = None
        for label, model in self._order():
            started = False
            try:
                async for event in model.stream_response(*args, **kwargs):
                    started = True
                    yield event
                return
            except Exception as exc:
                if started:  # cannot switch providers mid-stream
                    raise
                last = exc
                _cooldowns[label] = time.monotonic() + _cooldown_for(exc)
                logger.warning("LLM provider %s failed (%s); trying next provider.", label, exc)
        raise last or RuntimeError("No LLM provider configured")


def get_model(model_name: str | None = None) -> Model:
    """Return the model every agent uses: OpenRouter first, Gemini as automatic fallback."""
    openrouter_live = agent_config.openrouter_api_key not in PLACEHOLDER_KEYS
    gemini_live = agent_config.gemini_api_key not in PLACEHOLDER_KEYS

    providers: list[tuple[str, Model]] = []
    if openrouter_live:
        providers.append(
            (
                "openrouter",
                OpenAIChatCompletionsModel(
                    model=agent_config.openrouter_model_name,
                    openai_client=get_openrouter_client(),
                ),
            )
        )
    if gemini_live or not providers:
        providers.append(
            (
                "gemini",
                OpenAIChatCompletionsModel(
                    model=model_name or agent_config.gemini_model_name,
                    openai_client=get_openai_client(),
                ),
            )
        )
    return FallbackModel(providers)


async def execute_with_retry[T](
    func: Callable[[], Awaitable[T]],
    max_retries: int = 3,
    initial_delay: float = 1.0,
    backoff_factor: float = 2.0,
) -> T:
    """Execute an async operation with exponential backoff on transient errors (I-001)."""
    delay = initial_delay
    last_exc: Exception | None = None

    for attempt in range(1, max_retries + 1):
        try:
            return await func()
        except (RateLimitError, APIConnectionError, TimeoutError) as exc:
            last_exc = exc
            logger.warning(
                "Transient error in LLM call (attempt %d/%d): %s. Retrying in %.2fs...",
                attempt,
                max_retries,
                exc,
                delay,
            )
            if attempt == max_retries:
                break
            await asyncio.sleep(delay)
            delay *= backoff_factor
        except Exception as exc:
            logger.error("Non-retryable exception in LLM call: %s", exc)
            raise

    if last_exc:
        raise last_exc
    raise RuntimeError("Unexpected failure during LLM execution retry loop")


def llm_available() -> bool:
    """True when at least one real LLM provider key is configured (not empty or a placeholder)."""
    return agent_config.api_key not in PLACEHOLDER_KEYS


async def run_with_failover(
    make_agent: Callable[[], Agent], prompt: str, max_turns: int = 8, attempts: int = 2
) -> Any:
    """Run an agent; on failure restart the whole run so it begins on the next healthy provider.

    Restarting (instead of switching provider mid-conversation) matters for tool-using agents:
    Gemini 3 rejects tool-call history that another provider produced (missing thought signature).
    """
    last: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            return await execute_with_retry(
                lambda: Runner.run(make_agent(), prompt, max_turns=max_turns), max_retries=2
            )
        except Exception as exc:
            last = exc
            logger.warning("Agent run attempt %d/%d failed: %s", attempt, attempts, exc)
    assert last is not None
    raise last


async def run_structured[T](agent: Agent, prompt: str, output_type: type[T]) -> T | None:
    """Run an agent and return its validated structured output, or None on any failure.

    Callers treat None as "use the deterministic fallback", so an LLM outage, quota
    error or malformed output never breaks a user-facing flow.
    """
    try:
        result = await run_with_failover(lambda: agent, prompt, max_turns=8)
    except Exception as exc:
        logger.error("Agent %s failed (%s); caller will use its fallback.", agent.name, exc)
        return None
    output = result.final_output
    if isinstance(output, output_type):
        return output
    logger.warning("Agent %s returned unexpected output type; using fallback.", agent.name)
    return None
