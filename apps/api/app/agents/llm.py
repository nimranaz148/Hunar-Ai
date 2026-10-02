"""LLM integration: Gemini 2.5 Flash via OpenAI Agents SDK compatibility endpoint."""

import asyncio
import logging
from collections.abc import Awaitable, Callable

from agents import OpenAIChatCompletionsModel
from openai import APIConnectionError, AsyncOpenAI, RateLimitError

from app.agents.config import agent_config

logger = logging.getLogger(__name__)


def get_openai_client() -> AsyncOpenAI:
    """Create an AsyncOpenAI client configured for Google Gemini's endpoint."""
    return AsyncOpenAI(
        base_url=agent_config.gemini_base_url,
        api_key=agent_config.api_key or "missing-key-for-test",
    )


def get_model(model_name: str | None = None) -> OpenAIChatCompletionsModel:
    """Return an OpenAIChatCompletionsModel configured for Gemini."""
    client = get_openai_client()
    return OpenAIChatCompletionsModel(
        model=model_name or agent_config.gemini_model_name,
        openai_client=client,
    )


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
