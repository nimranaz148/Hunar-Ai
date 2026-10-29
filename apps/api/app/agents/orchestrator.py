"""Hunar Guide: orchestrator that routes an entrepreneur's question to specialist agents.

Uses both multi-agent patterns of the OpenAI Agents SDK:
- handoffs: control transfers to a specialist who answers directly
  (Validator, Pricing Advisor, Launch Planner, Content Strategist, Mentor Matcher)
- agents-as-tools: the Guide stays in charge and calls Researcher/Writer for a sub-result
"""

import logging
from dataclasses import dataclass, field
from typing import Any

from agents import Agent, ModelSettings, RunResult

from app.agents.content_team import STRATEGIST_PROMPT, WRITER_PROMPT
from app.agents.llm import get_model, llm_available, run_with_failover
from app.agents.mentor_matcher import MATCHER_PROMPT
from app.agents.researcher import build_researcher_agent
from app.agents.tools import pricing_calculator, web_search_market
from app.agents.validator import VALIDATOR_SYSTEM_PROMPT

logger = logging.getLogger(__name__)

GUIDE_PROMPT = """You are Hunar Guide, the first point of contact for a Pakistani woman building a
home business. Reply in the language she writes in (Roman Urdu or English), short and warm.
Decide who should answer:
- validate idea / competitors / is there demand -> hand off to IdeaValidator
- price, margin, cost, break-even -> hand off to PricingAdvisor
- launch steps, first 30 days, what to do this week -> hand off to LaunchPlanner
- what to post, content ideas, captions -> hand off to ContentStrategist
- which mentor / who can help me -> hand off to MentorMatcher
- needs fresh market facts before you can answer -> call research_market
- needs a sample caption before you can answer -> call draft_post
For the topics above you MUST hand off or call a tool; never answer them yourself and never
claim you 'sent a request' or 'will check later' - you have no such ability.
Only greetings and off-topic questions are answered briefly by you, then steer back to her business.
Never invent numbers, prices, reviews or guarantees. If you do not know, say so."""

_STYLE = (
    " Answer conversationally in under 150 words, in her language, using only the context given."
)

OFFLINE_REPLY = (
    "Hunar Guide abhi offline hai (AI service configure nahi hai). "
    "Aap apna plan, pricing aur content calendar menu se dekh sakti hain."
)


def build_guide_agent() -> Agent:
    """Build the orchestrator with its five handoff specialists and two agent-tools."""
    model = get_model()
    validator = Agent(
        name="IdeaValidator",
        handoff_description="Checks demand, competitors and feasibility of her business idea.",
        instructions=VALIDATOR_SYSTEM_PROMPT + _STYLE + " Use web_search_market before claims.",
        model=model,
        tools=[web_search_market],
        model_settings=ModelSettings(tool_choice="required"),
    )
    pricing = Agent(
        name="PricingAdvisor",
        handoff_description="Prices products, margins and break-even in PKR.",
        instructions=(
            "You are Hunar's Pricing Advisor for Pakistani home businesses. Always compute numbers "
            "with the pricing_calculator tool, never by hand." + _STYLE
        ),
        model=model,
        tools=[pricing_calculator],
    )
    planner = Agent(
        name="LaunchPlanner",
        handoff_description="Turns her situation into concrete launch tasks for the next days.",
        instructions=(
            "You are Hunar's Launch Planner. Give a short, dated, realistic task list that fits her "
            "weekly hours and budget." + _STYLE
        ),
        model=model,
    )
    strategist = Agent(
        name="ContentStrategist",
        handoff_description="Plans what to post on Instagram/Facebook and why.",
        instructions=STRATEGIST_PROMPT + _STYLE,
        model=model,
    )
    matcher = Agent(
        name="MentorMatcher",
        handoff_description="Recommends mentors from the candidate list in the context.",
        instructions=MATCHER_PROMPT + _STYLE,
        model=model,
    )

    researcher_tool = build_researcher_agent(structured=False).as_tool(
        tool_name="research_market",
        tool_description="Search the web for competitors, demand and hashtags for her business.",
    )
    writer_tool = Agent(
        name="ContentWriter",
        instructions=WRITER_PROMPT + " Return one ready-to-post caption.",
        model=model,
    ).as_tool(
        tool_name="draft_post",
        tool_description="Write one copy-paste-ready caption for a topic.",
    )

    return Agent(
        name="HunarGuide",
        instructions=GUIDE_PROMPT,
        model=model,
        handoffs=[validator, pricing, planner, strategist, matcher],
        tools=[researcher_tool, writer_tool],
    )


@dataclass
class GuideReply:
    reply: str
    mode: str  # "live" (Gemini answered) or "offline" (no key / failure)
    handoffs: list[str] = field(default_factory=list)
    tools_used: list[str] = field(default_factory=list)


def summarize_run(result: RunResult) -> tuple[list[str], list[str]]:
    """Extract which specialists took over and which tools were called from a finished run."""
    handoffs: list[str] = []
    tools: list[str] = []
    for item in result.new_items:
        kind = getattr(item, "type", "")
        if kind == "handoff_output_item":
            target = getattr(getattr(item, "target_agent", None), "name", None)
            if target:
                handoffs.append(target)
        elif kind == "tool_call_item":
            name = getattr(item.raw_item, "name", None)
            if name:
                tools.append(name)
    return handoffs, tools


async def run_guide(message: str, context: dict[str, Any]) -> GuideReply:
    """Ask the Guide. Falls back to a plain offline notice instead of failing."""
    if not llm_available():
        return GuideReply(reply=OFFLINE_REPLY, mode="offline")

    prompt = f"Her context (only data you may use):\n{context}\n\nHer message:\n{message}"
    try:
        result = await run_with_failover(build_guide_agent, prompt, max_turns=10)
    except Exception as exc:
        logger.error("HunarGuide failed: %s", exc)
        return GuideReply(reply=OFFLINE_REPLY, mode="offline")
    handoffs, tools = summarize_run(result)
    return GuideReply(
        reply=str(result.final_output), mode="live", handoffs=handoffs, tools_used=tools
    )
