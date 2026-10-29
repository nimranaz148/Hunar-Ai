"""Acceptance tests for the multi-agent team: tools, handoffs, agents-as-tools, fallbacks."""

import uuid
from types import SimpleNamespace
from typing import cast
from unittest.mock import AsyncMock, MagicMock

import pytest
from agents import Agent
from httpx import ASGITransport, AsyncClient

from app.agents import content_team, llm, mentor_matcher, orchestrator, researcher
from app.agents.config import AgentConfig
from app.agents.content_team import DayBrief, StrategistOutput, WriterOutput, WrittenPost
from app.agents.validator import build_validator_tools
from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.main import app
from app.models.user import User
from app.services.guide import _rule_based_score


@pytest.fixture
def no_llm(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(AgentConfig, "api_key", property(lambda self: ""))


@pytest.fixture
def live_llm(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(AgentConfig, "api_key", property(lambda self: "real-key"))


def test_guide_uses_handoffs_and_agents_as_tools() -> None:
    """The orchestrator hands off to 5 specialists and exposes 2 agents as tools."""
    guide = orchestrator.build_guide_agent()
    assert sorted(cast(Agent, h).name for h in guide.handoffs) == [
        "ContentStrategist",
        "IdeaValidator",
        "LaunchPlanner",
        "MentorMatcher",
        "PricingAdvisor",
    ]
    assert sorted(t.name for t in guide.tools) == ["draft_post", "research_market"]


def test_specialists_have_real_tools() -> None:
    """Validator and Researcher can search the web; Pricing specialist has the calculator."""
    assert [t.name for t in build_validator_tools()] == ["web_search_market"]
    assert [t.name for t in researcher.build_researcher_agent().tools] == ["web_search_market"]
    guide = orchestrator.build_guide_agent()
    pricing = next(
        cast(Agent, h) for h in guide.handoffs if cast(Agent, h).name == "PricingAdvisor"
    )
    assert [t.name for t in pricing.tools] == ["pricing_calculator"]


@pytest.mark.asyncio
async def test_agents_return_none_without_ai_key(no_llm: None) -> None:
    """Without a key every agent signals 'use the deterministic fallback' instead of failing."""
    assert await researcher.run_researcher_agent("Biz", "food", "Lahore", None) is None
    assert await content_team.run_strategist_agent({}) is None
    assert await content_team.run_writer_agent({}, [{"day": 1}]) == {}
    assert await content_team.run_qa_agent({}, [{"day": 1}]) == {}
    assert await mentor_matcher.run_mentor_matcher_agent({}, [{"mentor_id": "x"}]) is None
    reply = await orchestrator.run_guide("hello", {})
    assert reply.mode == "offline"


@pytest.mark.asyncio
async def test_run_structured_returns_none_on_failure(
    monkeypatch: pytest.MonkeyPatch, live_llm: None
) -> None:
    async def boom(*_a: object, **_k: object) -> None:
        raise RuntimeError("quota")

    monkeypatch.setattr(llm, "execute_with_retry", boom)
    agent = MagicMock()
    agent.name = "x"
    assert await llm.run_structured(agent, "p", StrategistOutput) is None


@pytest.mark.asyncio
async def test_strategist_rejects_incomplete_outline(
    monkeypatch: pytest.MonkeyPatch, live_llm: None
) -> None:
    short = StrategistOutput(
        day_briefs=[
            DayBrief(day=d, format="reel", pillar="p", goal="sales", key_idea="k")
            for d in range(1, 11)
        ]
    )
    monkeypatch.setattr(content_team, "run_structured", AsyncMock(return_value=short))
    assert await content_team.run_strategist_agent({}) is None

    full = StrategistOutput(
        day_briefs=[
            DayBrief(day=d, format="reel", pillar="p", goal="sales", key_idea="k")
            for d in range(30, 0, -1)
        ]
    )
    monkeypatch.setattr(content_team, "run_structured", AsyncMock(return_value=full))
    briefs = await content_team.run_strategist_agent({})
    assert briefs is not None and [b["day"] for b in briefs] == list(range(1, 31))


@pytest.mark.asyncio
async def test_writer_runs_four_parallel_batches_and_merges(
    monkeypatch: pytest.MonkeyPatch, live_llm: None
) -> None:
    async def fake(_agent: object, prompt: str, _t: object) -> WriterOutput:
        days = [d for d in range(1, 31) if f"'day': {d}," in prompt]
        return WriterOutput(
            posts=[
                WrittenPost(day=d, hook="h", caption="c", cta="o", hashtags=["#a"]) for d in days
            ]
        )

    monkeypatch.setattr(content_team, "run_structured", fake)
    briefs = [{"day": d, "format": "reel"} for d in range(1, 31)]
    written = await content_team.run_writer_agent({}, briefs)
    assert sorted(written) == list(range(1, 31))


@pytest.mark.asyncio
async def test_matcher_drops_unknown_mentor_ids(
    monkeypatch: pytest.MonkeyPatch, live_llm: None
) -> None:
    good, bad = str(uuid.uuid4()), str(uuid.uuid4())
    out = mentor_matcher.MentorMatchOutput(
        matches=[
            mentor_matcher.MentorMatch(mentor_id=bad, score=90, reason="invented"),
            mentor_matcher.MentorMatch(mentor_id=good, score=80, reason="real"),
        ]
    )
    monkeypatch.setattr(mentor_matcher, "run_structured", AsyncMock(return_value=out))
    matches = await mentor_matcher.run_mentor_matcher_agent({}, [{"mentor_id": good}])
    assert matches is not None and [m.mentor_id for m in matches] == [good]


def test_summarize_run_reports_handoffs_and_tools() -> None:
    items = [
        SimpleNamespace(
            type="handoff_output_item", target_agent=SimpleNamespace(name="PricingAdvisor")
        ),
        SimpleNamespace(
            type="tool_call_item", raw_item=SimpleNamespace(name="pricing_calculator")
        ),
        SimpleNamespace(type="message_output_item"),
    ]
    handoffs, tools = orchestrator.summarize_run(SimpleNamespace(new_items=items))  # type: ignore[arg-type]
    assert handoffs == ["PricingAdvisor"]
    assert tools == ["pricing_calculator"]


def test_rule_based_mentor_ranking_prefers_niche_and_city() -> None:
    business = {"niche": "food", "city": "Lahore", "languages": ["roman_ur"]}
    strong = {
        "niches": ["food"],
        "city": "Lahore",
        "languages": ["roman_ur"],
        "rating": 4.8,
        "review_count": 9,
    }
    weak = {
        "niches": ["tech"],
        "city": "Quetta",
        "languages": ["en"],
        "rating": 4.8,
        "review_count": 9,
    }
    assert _rule_based_score(business, strong)[0] > _rule_based_score(business, weak)[0]


@pytest.mark.asyncio
async def test_guide_requires_login_and_entrepreneur_role() -> None:
    """Authorization is enforced by the API: anonymous gets 401, a mentor gets 403."""
    app.dependency_overrides[get_db] = lambda: MagicMock()
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://t") as client:
            anon = await client.post("/api/v1/agents/guide", json={"message": "hi"})
            assert anon.status_code == 401

            mentor = User(
                id=uuid.uuid4(), email="m@h.pk", name="M", role="mentor", status="active"
            )
            app.dependency_overrides[get_current_user] = lambda: mentor
            denied = await client.post("/api/v1/agents/guide", json={"message": "hi"})
            assert denied.status_code == 403
            denied_match = await client.get(
                "/api/v1/agents/mentor-match", params={"business_id": str(uuid.uuid4())}
            )
            assert denied_match.status_code == 403
    finally:
        app.dependency_overrides.clear()
