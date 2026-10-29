"""Weekly Coach Agent: Analyzes metrics snapshots, evaluates traction, and proposes strategy shifts (PRD §10 W-004, §36.5, §36.7)."""

import logging
from typing import Any

from pydantic import BaseModel, Field

from app.agents.config import agent_config
from app.agents.llm import get_model
from app.schemas.weekly_review import ProposedContentAdjustment, WeeklyReviewDiagnosis

logger = logging.getLogger(__name__)


class WeeklyCoachAgentOutput(BaseModel):
    """Structured strategy and adjustments drafted by the Weekly Coach Agent."""

    summary_notes: str = Field(
        ...,
        description="Encouraging summary evaluation of weekly performance in culturally grounded English/Urdu.",
    )
    coach_rationale: str = Field(
        ...,
        description="Detailed strategic rationale explaining why adjustments are needed based on empirical stats.",
    )
    adjustments: list[ProposedContentAdjustment] = Field(
        default_factory=list,
        description="Specific modifications to upcoming content calendar draft items.",
    )
    mentor_recommendation: str | None = Field(
        default=None,
        description="Optional recommendation to book a relevant mentor session if growth is stalled or conversion is low.",
    )


def _rule_based_fallback_coach(
    business_name: str,
    niche: str,
    city: str,
    diagnosis: WeeklyReviewDiagnosis,
    upcoming_items: list[dict[str, Any]],
) -> WeeklyCoachAgentOutput:
    """Deterministic, commercially sound Weekly Coach recommendations for Pakistani micro-businesses."""
    clean_niche = niche.lower().replace(" ", "")
    niche_tags = [
        f"#{clean_niche}pk",
        f"#{city.lower()}makers",
        "#pakistanihandmade",
        "#smallbusinesspakistan",
    ]

    best_fmt = diagnosis.best_format or "reel"
    views = diagnosis.total_views
    inquiries = diagnosis.total_inquiries
    revenue = diagnosis.total_revenue_pkr

    summary = (
        f"Shabash! In the past week, {business_name} generated {views:,} views and {inquiries} direct customer inquiries, "
        f"bringing in Rs {revenue:,} in tracked sales. Video content ({best_fmt}s) delivered the highest engagement."
    )

    rationale = (
        f"Analysis of {diagnosis.days_analyzed} logged days reveals that {best_fmt.capitalize()} formats generate higher "
        f"reach and DM interactions than static image posts. To capitalize on algorithm momentum in {city}, we recommend "
        f"converting upcoming static slots into quick process/behind-the-scenes reels and refreshing niche hashtags."
    )

    adjustments: list[ProposedContentAdjustment] = []
    for item in upcoming_items[:3]:
        item_id = str(item.get("id")) if item.get("id") else None
        day = item.get("day", 1)
        curr_fmt = item.get("format", "static")
        curr_hook = item.get("hook", "")

        target_fmt = "reel" if curr_fmt != "reel" else "carousel"
        if target_fmt == "reel":
            new_hook = f"Dekhein yeh {niche} product kaise banta hai — step by step!"
            item_rationale = f"Reels generate 2.5x more reach than {curr_fmt}. Showcase craftsmanship behind the scenes."
        else:
            new_hook = f"Top 3 tips jab aap {niche} khareed rahe hon!"
            item_rationale = "Carousels encourage saves and shares, deepening buyer trust."

        merged_hashtags = list(dict.fromkeys(item.get("hashtags", []) + niche_tags))[:6]

        adjustments.append(
            ProposedContentAdjustment(
                item_id=item_id,
                day=day,
                current_format=curr_fmt,
                proposed_format=target_fmt,
                current_hook=curr_hook,
                proposed_hook=new_hook,
                recommended_hashtags=merged_hashtags,
                rationale=item_rationale,
            )
        )

    mentor_rec: str | None = None
    if revenue < 8000 or inquiries < 5:
        mentor_rec = (
            "Inquiries are coming in but conversion to paid orders could be higher. "
            "Consider booking a 1-on-1 session with a Sales & Pricing Mentor to polish your WhatsApp closing scripts."
        )

    return WeeklyCoachAgentOutput(
        summary_notes=summary,
        coach_rationale=rationale,
        adjustments=adjustments,
        mentor_recommendation=mentor_rec,
    )


async def run_weekly_coach_agent(
    business_name: str,
    niche: str,
    city: str,
    diagnosis: WeeklyReviewDiagnosis,
    upcoming_items: list[dict[str, Any]],
) -> WeeklyCoachAgentOutput:
    """Execute Weekly Coach Agent (Gemini with deterministic fallback)."""
    fallback = _rule_based_fallback_coach(
        business_name=business_name,
        niche=niche,
        city=city,
        diagnosis=diagnosis,
        upcoming_items=upcoming_items,
    )

    is_mock_key = agent_config.api_key in ("missing-key-for-test", "test-key-not-for-live")
    if not agent_config.api_key or is_mock_key:
        return fallback

    try:
        from agents import Agent, Runner

        upcoming_summary = "\n".join(
            [
                f"- Day {it.get('day')}: Format='{it.get('format')}', Hook='{it.get('hook')}', Pillar='{it.get('pillar')}'"
                for it in upcoming_items[:4]
            ]
        )

        prompt = (
            f"Business: '{business_name}' ({niche}) in {city}, Pakistan.\n"
            f"Weekly Performance Diagnosis:\n"
            f"- Analyzed Days: {diagnosis.days_analyzed}\n"
            f"- Best Format: {diagnosis.best_format}\n"
            f"- Best Day: {diagnosis.best_day}\n"
            f"- Views: {diagnosis.total_views:,}\n"
            f"- Reach: {diagnosis.total_reach:,}\n"
            f"- Inquiries: {diagnosis.total_inquiries}\n"
            f"- Orders: {diagnosis.total_orders}\n"
            f"- Revenue: PKR {diagnosis.total_revenue_pkr:,}\n"
            f"- Engagement Trend: {diagnosis.engagement_trend}\n"
            f"- Revenue Trend: {diagnosis.revenue_trend}\n\n"
            f"Upcoming Content Items:\n{upcoming_summary or 'No upcoming draft items'}\n\n"
            "As the Weekly Coach Agent, evaluate performance, provide actionable feedback, "
            "and suggest specific adjustments to the upcoming content items (e.g. format shifts, hook upgrades, hashtags). "
            "Suggest a mentor consultation if customer inquiries or conversion are low."
        )

        agent = Agent(
            name="weekly_coach",
            model=get_model(agent_config.gemini_model_name),
            instructions=(
                "You are Hunar's Weekly Coach Agent (L3 Specialist). You advise Pakistani women micro-entrepreneurs "
                "on weekly social marketing, sales conversion, and content optimization based strictly on empirical metrics. "
                "Output clear, culturally attuned Urdu/English recommendations and specific content adjustments."
            ),
            output_type=WeeklyCoachAgentOutput,
        )

        result = await Runner.run(agent, prompt)
        if (
            isinstance(result.final_output, WeeklyCoachAgentOutput)
            and len(result.final_output.adjustments) > 0
        ):
            return result.final_output
        return fallback
    except Exception as exc:
        logger.warning(
            "Weekly Coach Agent LLM call failed, returning deterministic coach output: %s", exc
        )
        return fallback
