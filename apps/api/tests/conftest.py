"""Shared test setup: never let a developer's real API keys leak into the test run."""

import pytest

from app.core.config import settings


@pytest.fixture(autouse=True)
def _no_live_llm_or_search_keys(monkeypatch: pytest.MonkeyPatch) -> None:
    """A local .env with real keys must not turn unit tests into live LLM/search calls."""
    monkeypatch.setattr(settings, "OPENROUTER_API_KEY", "")
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")
    monkeypatch.setattr(settings, "TAVILY_API_KEY", "")
