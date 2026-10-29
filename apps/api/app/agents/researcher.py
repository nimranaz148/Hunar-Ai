"""Market Researcher Agent: competitor teardown and hashtag research via web search (PRD §36.15)."""

import logging

from agents import Agent, ModelSettings
from pydantic import BaseModel, Field

from app.agents.llm import get_model, llm_available, run_structured
from app.agents.tools import web_search_market

logger = logging.getLogger(__name__)


class ResearchCompetitor(BaseModel):
    name: str
    handle: str = Field(description="Instagram/Facebook handle, or empty if unknown.")
    price_point: str = Field(description="One of: affordable, mid, mid-high, premium.")
    key_advantage: str


class ResearchHashtags(BaseModel):
    broad: list[str]
    niche: list[str]
    local: list[str]


class ResearchOutput(BaseModel):
    """Structured research report content produced by the Researcher."""

    competitors: list[ResearchCompetitor] = Field(description="2-4 real competitors found.")
    how_to_be_better: list[str] = Field(description="3-5 actionable differentiators.")
    hashtags: ResearchHashtags
    source_urls: list[str] = Field(description="URLs actually returned by the search tool.")
    confidence: float = Field(ge=0.0, le=1.0, description="0.9 only if backed by several sources.")


RESEARCHER_PROMPT = """You are Hunar's Market Researcher for Pakistani home businesses.
You MUST call the web_search_market tool at least twice (competitors, then hashtags/demand)
before answering. Base every competitor and source URL on tool results only; never invent URLs.
If the tool returns no results, return fewer competitors, empty source_urls and confidence <= 0.3.
Hashtags: 3 broad, 3 niche, 3 local (city) - each starting with '#'.
Advice may be in Roman Urdu or English."""


def build_researcher_agent(structured: bool = True) -> Agent:
    """Build the Researcher. Used directly and as an agent-as-tool by the orchestrator."""
    return Agent(
        name="MarketResearcher",
        instructions=RESEARCHER_PROMPT,
        model=get_model(),
        tools=[web_search_market],
        model_settings=ModelSettings(tool_choice="required"),
        output_type=ResearchOutput if structured else None,
    )


async def run_researcher_agent(
    business_name: str, niche: str, city: str, target_customer: str | None
) -> ResearchOutput | None:
    """Research competitors and hashtags with live web search; None means use the fallback."""
    if not llm_available():
        return None
    prompt = (
        f"Research the market for '{business_name}', a {niche} business in {city}, Pakistan. "
        f"Target customer: {target_customer or 'general local market'}."
    )
    return await run_structured(build_researcher_agent(), prompt, ResearchOutput)
