"""Mentor Matcher Agent: ranks active mentors for an entrepreneur's business (PRD §36.20)."""

from typing import Any

from agents import Agent
from pydantic import BaseModel, Field

from app.agents.llm import get_model, llm_available, run_structured


class MentorMatch(BaseModel):
    mentor_id: str
    score: int = Field(ge=0, le=100)
    reason: str = Field(description="One sentence a first-time entrepreneur understands.")


class MentorMatchOutput(BaseModel):
    matches: list[MentorMatch] = Field(description="Best matches first, at most 5.")


MATCHER_PROMPT = """You are Hunar's Mentor Matcher. Given one entrepreneur's business and a list
of candidate mentors (the only data you may use), rank up to 5 mentors who best fit her biggest
current need. Weigh niche overlap, city/language fit, rating and review count, and service price
against her budget. Use only mentor_id values from the list. Reasons must be plain and specific.
Score each match 0-100 where 100 is a perfect fit; the best match must have the highest score and
scores must reflect real differences (e.g. 85 strong niche + city fit, 40 weak fit)."""


def build_mentor_matcher_agent(structured: bool = True) -> Agent:
    return Agent(
        name="MentorMatcher",
        instructions=MATCHER_PROMPT,
        model=get_model(),
        output_type=MentorMatchOutput if structured else None,
    )


async def run_mentor_matcher_agent(
    business: dict[str, Any], candidates: list[dict[str, Any]]
) -> list[MentorMatch] | None:
    """Ranked matches (ids validated against candidates), or None to use the rule-based ranking."""
    if not llm_available() or not candidates:
        return None
    out = await run_structured(
        build_mentor_matcher_agent(),
        f"Business:\n{business}\n\nCandidate mentors:\n{candidates}",
        MentorMatchOutput,
    )
    if out is None:
        return None
    valid = {c["mentor_id"] for c in candidates}
    matches = [m for m in out.matches if m.mentor_id in valid][:5]
    return matches or None
