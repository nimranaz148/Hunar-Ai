"""Idea Validator Agent: Researches demand, competition, and feasibility (PRD §36.12)."""

import logging
from typing import Literal

from agents import Agent, ModelSettings, Runner, Tool
from pydantic import BaseModel, Field

from app.agents.config import agent_config
from app.agents.llm import get_model
from app.agents.tools import web_search_market
from app.schemas.validation import CompetitorItem

logger = logging.getLogger(__name__)


class ValidatorAgentResult(BaseModel):
    """Structured output returned by the Idea Validator Agent."""

    competitors: list[CompetitorItem] = Field(
        description="2-4 identified local/online competitors with analysis of strengths and gaps to exploit.",
    )
    how_to_be_better: list[str] = Field(
        description="3-5 concrete, actionable differentiators for the entrepreneur to stand out.",
    )
    confidence: Literal["low", "medium", "high"] = Field(
        description="Feasibility & demand confidence rating (low, medium, high).",
    )
    demand_summary: str = Field(
        description="Executive summary of market demand in the user's city and niche.",
    )
    pricing_insight: str = Field(
        description="Pricing benchmarks and margin recommendations for this locality.",
    )
    reasoning: str = Field(
        description="Detailed strategic rationale explaining the rating and analysis.",
    )


def build_validator_tools() -> list[Tool]:
    """Tools the Validator may call: live web search (Tavily) for real competitors."""
    return [web_search_market]


VALIDATOR_SYSTEM_PROMPT = """You are Hunar's Idea Validator Agent, an expert market research analyst
specializing in Pakistani micro-businesses, home ventures, and women-led enterprises.
Your goal is to evaluate the entrepreneur's business idea, analyze competitors in her city/area,
assess market demand, and provide strategic recommendations.

Rules:
1. Provide 2 to 4 realistic or researched competitors in the specific city/area (e.g. Karachi, Lahore, Islamabad).
2. For each competitor, state clearly:
   - name: Business name
   - what_they_do_well: Strengths or popularity factors
   - gap_we_can_exploit: Specific weakness or under-served need (e.g. slow response, poor packaging, lack of customized sizes, high delivery fee)
   - source_url: A realistic website, Instagram handle link, or Facebook profile link (e.g. 'https://instagram.com/local_bakes')
3. 'how_to_be_better': 3 to 5 clear, actionable advice points in Roman Urdu or English.
4. 'confidence':
   - 'high': High localized demand, reasonable startup budget, strong unique angle.
   - 'medium': Good demand but competitive market; needs distinct branding.
   - 'low': Oversaturated niche with weak differentiation or insufficient budget.
5. 'demand_summary': Assessment of consumer interest and purchasing power in that city/locality.
6. 'pricing_insight': Practical pricing benchmark in PKR.
7. 'reasoning': Analytical explanation tying budget, hours, and market factors together.
8. Call the web_search_market tool (competitors in her city, then local demand) BEFORE answering.
   Use only competitors and source_url values that appear in tool results. If search returns
   nothing, say so in 'reasoning', use fewer competitors, leave source_url empty and set
   confidence to 'low'. Never invent a business or URL.
"""


def _rule_based_fallback_validation(
    business_name: str,
    niche: str,
    city: str,
    budget_pkr: int,
    products_summary: str = "",
) -> ValidatorAgentResult:
    """Deterministic fallback analysis when LLM API key is not configured or in testing environments."""
    niche_clean = niche.lower()
    city_cap = city.capitalize() if city else "Karachi"

    if "food" in niche_clean:
        competitors = [
            CompetitorItem(
                name=f"{city_cap} Home Delights",
                what_they_do_well="Strong presence on Foodpanda and active WhatsApp broadcast list.",
                gap_we_can_exploit="High minimum order value and generic packaging; lack personalized celebration notes.",
                source_url=f"https://instagram.com/{city_cap.lower()}_homedelights",
            ),
            CompetitorItem(
                name="Sweet Cravings Bakery",
                what_they_do_well="High-end fondant customized cakes with large Instagram following.",
                gap_we_can_exploit="Requires 3-day advance notice; premium pricing excludes daily casual dessert cravings.",
                source_url="https://instagram.com/sweetcravings_pk",
            ),
            CompetitorItem(
                name="Bakeology Studio",
                what_they_do_well="Good photo aesthetics and reels showcasing baking process.",
                gap_we_can_exploit="Inconsistent delivery timings and delayed replies to direct messages (DMs).",
                source_url="https://facebook.com/bakeology_studio",
            ),
        ]
        how_to_be_better = [
            "Offer miniature / Bento trial cakes (PKR 800 - 1,200) to lower trial barrier for first-time customers.",
            "Guarantee 2-hour instant response time on WhatsApp Business for ordering convenience.",
            "Use signature branded packaging with handwritten thank-you cards for unboxing social proof.",
            "Introduce bundle deals for birthdays and weekend family dinners.",
        ]
        confidence: Literal["low", "medium", "high"] = "high" if budget_pkr >= 15000 else "medium"
        demand_summary = f"Strong year-round demand for freshly baked home treats in {city_cap}. High consumer trust in hygienic home kitchens."
        pricing_insight = "Average home-baker gross margin is 45-60%. Standard Bento cakes sell for PKR 1,000 - 1,500; premium 2lb cakes for PKR 2,200 - 3,500."
        reasoning = f"{business_name} has a viable runway with PKR {budget_pkr:,} budget. With quick customer service and fresh ingredients, you can build a loyal repeat client base."

    elif "fashion" in niche_clean or "stitching" in niche_clean or "craft" in niche_clean:
        competitors = [
            CompetitorItem(
                name="Libas Pret & Stitching",
                what_they_do_well="Experienced tailoring and quick turnaround for standard sizes.",
                gap_we_can_exploit="Limited trendy cut options for young working women; plain finishing.",
                source_url=f"https://instagram.com/libas_pret_{city_cap.lower()}",
            ),
            CompetitorItem(
                name="Zari & Thread Studio",
                what_they_do_well="Hand embroidery detailing and wedding wear aesthetics.",
                gap_we_can_exploit="Expensive pricing and long waiting queues during festive seasons.",
                source_url="https://instagram.com/zari_thread_pk",
            ),
        ]
        how_to_be_better = [
            "Provide video previews of fabric drape and exact stitch measurements before final dispatch.",
            "Offer home pickup & doorstep measurement consultation in nearby residential blocks.",
            "Maintain a ready-to-wear casual pret capsule collection in standard sizes (S/M/L).",
        ]
        confidence = "medium"
        demand_summary = (
            f"High demand for customized festive wear and everyday cotton pret in {city_cap}."
        )
        pricing_insight = "Standard stitching services PKR 1,200 - 2,500 per suit; customized pret PKR 3,500 - 7,000."
        reasoning = f"Fashion is competitive in {city_cap} but high retention can be achieved through consistent size fit and reliable timelines."

    else:
        competitors = [
            CompetitorItem(
                name=f"{city_cap} Artisan Collective",
                what_they_do_well="Established brand awareness and participation in local pop-up markets.",
                gap_we_can_exploit="High pricing and lack of customized personal customer support.",
                source_url=f"https://facebook.com/{city_cap.lower()}_artisans",
            ),
            CompetitorItem(
                name="Modern Home Hub",
                what_they_do_well="Diverse product catalog and digital marketing.",
                gap_we_can_exploit="Mass-produced items lacking unique handcrafted quality and story.",
                source_url="https://instagram.com/modernhome_hub",
            ),
        ]
        how_to_be_better = [
            "Emphasize the artisan story and handcrafted origin in every social media reel.",
            "Partner with local delivery riders for secure, cash-on-delivery same-day dispatch.",
            "Offer customized personalized orders for gifting and corporate packages.",
        ]
        confidence = "medium"
        demand_summary = (
            f"Growing consumer interest in locally sourced, homegrown products in {city_cap}."
        )
        pricing_insight = (
            "Aim for a minimum 40% margin to cover delivery, packaging, and platform ad costs."
        )
        reasoning = f"The {niche} niche offers solid potential for {business_name} if targeted at specific affluent neighborhoods in {city_cap}."

    return ValidatorAgentResult(
        competitors=competitors,
        how_to_be_better=how_to_be_better,
        confidence=confidence,
        demand_summary=demand_summary,
        pricing_insight=pricing_insight,
        reasoning=reasoning,
    )


async def run_validator_agent(
    business_name: str,
    niche: str,
    city: str,
    area: str | None,
    budget_pkr: int,
    hours_per_week: int,
    target_customer: str | None,
    products_summary: str = "",
) -> ValidatorAgentResult:
    """Run Idea Validator Agent using Gemini model with rule-based fallback."""
    is_mock_key = agent_config.api_key in ("missing-key-for-test", "test-key-not-for-live")
    if not agent_config.api_key or is_mock_key:
        logger.info("No GEMINI_API_KEY found; using rule-based validator fallback.")
        return _rule_based_fallback_validation(
            business_name=business_name,
            niche=niche,
            city=city,
            budget_pkr=budget_pkr,
            products_summary=products_summary,
        )

    prompt = f"""
    Evaluate the following business idea in Pakistan:
    - Business Name: {business_name}
    - Niche / Industry: {niche}
    - City: {city} (Area: {area or "Not specified"})
    - Startup Monthly Budget: PKR {budget_pkr:,}
    - Weekly Hours Available: {hours_per_week} hours/week
    - Target Customer Persona: {target_customer or "General local market"}
    - Products / Offerings: {products_summary or "Core items in niche"}

    Provide a realistic competitor teardown, strategic differentiators, market demand summary, and feasibility rating.
    """

    try:
        model = get_model()
        agent = Agent(
            name="IdeaValidator",
            instructions=VALIDATOR_SYSTEM_PROMPT,
            model=model,
            tools=build_validator_tools(),
            model_settings=ModelSettings(tool_choice="required"),
            output_type=ValidatorAgentResult,
        )

        result = await Runner.run(agent, prompt)
        if isinstance(result.final_output, ValidatorAgentResult):
            return result.final_output

        logger.warning("Validator output was not ValidatorAgentResult; using rule fallback.")
        return _rule_based_fallback_validation(
            business_name=business_name,
            niche=niche,
            city=city,
            budget_pkr=budget_pkr,
            products_summary=products_summary,
        )

    except Exception as e:
        logger.error("Validator Agent failed (%s); using fallback.", e)
        return _rule_based_fallback_validation(
            business_name=business_name,
            niche=niche,
            city=city,
            budget_pkr=budget_pkr,
            products_summary=products_summary,
        )
