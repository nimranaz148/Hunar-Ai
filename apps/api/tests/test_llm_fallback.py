"""OpenRouter-first, Gemini-fallback model selection and failover behaviour."""

from typing import Any
from unittest.mock import MagicMock

import pytest
from agents import Model, OpenAIChatCompletionsModel
from openai import RateLimitError

from app.agents import llm
from app.core.config import settings


class _Fake(Model):
    def __init__(self, name: str, error: Exception | None = None) -> None:
        self.name, self.error, self.calls = name, error, 0

    async def get_response(self, *a: Any, **k: Any) -> Any:
        self.calls += 1
        if self.error:
            raise self.error
        return self.name

    def stream_response(self, *a: Any, **k: Any) -> Any:
        raise NotImplementedError


def _rate_limit() -> RateLimitError:
    return RateLimitError("limit", response=MagicMock(status_code=429), body=None)


@pytest.fixture(autouse=True)
def _reset_cooldowns() -> None:
    llm._cooldowns.clear()


def test_provider_order_and_single_provider(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "OPENROUTER_API_KEY", "or-key")
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "g-key")
    both = llm.get_model()
    assert isinstance(both, llm.FallbackModel)
    assert [label for label, _ in both._providers] == ["openrouter", "gemini"]

    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")
    only_or = llm.get_model()
    assert isinstance(only_or, llm.FallbackModel)
    assert [label for label, _ in only_or._providers] == ["openrouter"]
    first = only_or._providers[0][1]
    assert isinstance(first, OpenAIChatCompletionsModel)
    assert first.model == settings.OPENROUTER_MODEL

    monkeypatch.setattr(settings, "OPENROUTER_API_KEY", "")
    assert llm.llm_available() is False


@pytest.mark.asyncio
async def test_falls_back_to_gemini_and_skips_exhausted_provider() -> None:
    primary, secondary = _Fake("or", _rate_limit()), _Fake("gemini")
    model = llm.FallbackModel([("openrouter", primary), ("gemini", secondary)])

    assert await model.get_response() == "gemini"
    assert (primary.calls, secondary.calls) == (1, 1)

    # OpenRouter is now cooling down: the next call goes straight to Gemini.
    assert await model.get_response() == "gemini"
    assert (primary.calls, secondary.calls) == (1, 2)


@pytest.mark.asyncio
async def test_primary_answers_when_healthy_and_all_failing_raises() -> None:
    ok = llm.FallbackModel([("openrouter", _Fake("or")), ("gemini", _Fake("gemini"))])
    assert await ok.get_response() == "or"

    llm._cooldowns.clear()
    bad = llm.FallbackModel(
        [("openrouter", _Fake("or", _rate_limit())), ("gemini", _Fake("g", RuntimeError("down")))]
    )
    with pytest.raises(RuntimeError):
        await bad.get_response()


def test_gemini_drops_forced_tool_choice_only_with_json_output() -> None:
    """Gemini 400s on tool_choice=required + JSON schema; other providers keep it."""
    from agents import ModelSettings

    forced = ModelSettings(tool_choice="required")
    args: tuple[Any, ...] = ("sys", "in", forced, [], object())
    gem_args, _ = llm._adapt_for_provider("gemini", args, {})
    assert gem_args[2].tool_choice is None
    or_args, _ = llm._adapt_for_provider("openrouter", args, {})
    assert or_args[2].tool_choice == "required"
    no_schema: tuple[Any, ...] = ("sys", "in", forced, [], None)
    assert llm._adapt_for_provider("gemini", no_schema, {})[0][2].tool_choice == "required"
