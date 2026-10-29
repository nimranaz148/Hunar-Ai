"""Intake Agent: Extracts structured BusinessProfile from conversational input (PRD §36.11)."""

import logging
import re

from agents import Agent, Runner
from pydantic import BaseModel, Field

from app.agents.config import agent_config
from app.agents.llm import get_model
from app.schemas.onboarding import BusinessProfile

logger = logging.getLogger(__name__)


class IntakeAgentResult(BaseModel):
    """Structured output returned by the Intake Agent analysis."""

    is_complete: bool = Field(
        description="True if business idea has enough info (niche, city, budget_pkr >= 1000).",
    )
    reply: str = Field(
        description="Friendly, encouraging message in Roman Urdu / English.",
    )
    profile: BusinessProfile | None = Field(
        default=None,
        description="The extracted structured BusinessProfile if complete, else None.",
    )


INTAKE_SYSTEM_PROMPT = """You are Hunar's Intake Agent, a warm, supportive, and business-savvy
female entrepreneur advisor in Pakistan.
Your goal is to extract a structured BusinessProfile from the entrepreneur's chat messages.
Communicate primarily in natural, friendly Roman Urdu (or English if the user speaks English).

Required information to complete a profile:
1. Business idea / niche (allowed: food, stitching_fashion, beauty, handmade, tutoring, digital)
2. City and neighborhood/area (e.g. Karachi, Gulshan-e-Iqbal)
3. Initial monthly startup budget in PKR (must be at least 1,000 PKR, e.g. 20,000 PKR)
4. Approximate hours per week (default to 20 if not specified)
5. Business name (suggest a fitting name if the user hasn't named it yet)
6. Target platforms (default to ['instagram', 'facebook'])
7. Languages (default to ['roman_ur', 'en'])

Rules:
- If key details are missing, set is_complete=False, ask clarifying questions.
- If all required details are provided, set is_complete=True and populate profile.
- Never be dry or robotic. Use culturally appropriate Pakistani business context.
"""

ALLOWED_CITIES = [
    "karachi",
    "lahore",
    "islamabad",
    "rawalpindi",
    "peshawar",
    "quetta",
    "faisalabad",
    "multan",
]


def _rule_based_fallback_extraction(
    messages: list[dict[str, str]],
    user_name: str = "Entrepreneur",
) -> IntakeAgentResult:
    """Deterministic fallback extraction when LLM API key is not configured or in tests."""
    full_text = " ".join(m.get("content", "") for m in messages if m.get("role") == "user")
    lower_text = full_text.lower()

    # Niche detection
    detected_niche = "other"
    if any(w in lower_text for w in ["cake", "bake", "bakery", "food", "khana", "biryani"]):
        detected_niche = "food"
    elif any(w in lower_text for w in ["kapray", "stitching", "dress", "fashion", "boutique"]):
        detected_niche = "stitching_fashion"
    elif any(w in lower_text for w in ["beauty", "makeup", "parlor", "salon", "facial"]):
        detected_niche = "beauty"
    elif any(w in lower_text for w in ["craft", "handmade", "resin", "crochet", "jewel"]):
        detected_niche = "handmade"
    elif any(w in lower_text for w in ["tutor", "tuition", "academy", "teaching", "parhana"]):
        detected_niche = "tutoring"

    # City detection
    detected_city = "Karachi"
    for c in ALLOWED_CITIES:
        if c in lower_text:
            detected_city = c.capitalize()
            break

    # Area detection
    detected_area = None
    for a in ["gulshan", "johar", "clifton", "dha", "model town", "bahria", "saddar", "gulberg"]:
        if a in lower_text:
            detected_area = a.title()
            break

    # Budget detection
    budget = None
    cleaned_text = lower_text.replace(",", "")
    budget_match = re.search(
        r"(\d+)\s*(k|thousand|hazar|rupay|rs|pkr|budget|budgt)\b", cleaned_text
    )
    if budget_match:
        val = int(budget_match.group(1))
        # Match the captured unit exactly: a substring test treated "pkr" as "k" (x1000).
        if budget_match.group(2) in ("k", "thousand", "hazar"):
            val *= 1000
        budget = val
    else:
        num_matches = re.findall(r"\b\d{4,7}\b", cleaned_text)
        if num_matches:
            budget = int(num_matches[0])

    has_niche = detected_niche != "other" or "business" in lower_text
    has_budget = budget is not None and budget >= 1000

    if has_niche and has_budget:
        business_name = f"{user_name}'s {detected_niche.title().replace('_', ' ')}"
        if detected_niche == "food" and "bake" in lower_text:
            business_name = f"{detected_area or detected_city} Home Bakes"

        profile = BusinessProfile(
            name=business_name,
            niche=detected_niche,
            city=detected_city,
            area=detected_area,
            budget_pkr=budget,
            hours_per_week=20,
            tone="friendly",
            languages=["roman_ur", "en"],
            platforms=["instagram", "facebook"],
            target_customer=f"Customers looking for quality {detected_niche} in {detected_city}",
        )
        reply = (
            f"Zabardast! Aapki details note kar li hain: {business_name} in {detected_city}, "
            f"budget Rs. {budget:,}. Launch plan generate karne ke liye hum tayar hain!"
        )

        return IntakeAgentResult(is_complete=True, reply=reply, profile=profile)

    # Incomplete details
    if not has_budget:
        reply = (
            "Bohat khoob! Aapka business idea bohat dilchasp hai. "
            "Aapka shuruati monthly budget kitna hoga (e.g. Rs. 15,000 ya 25,000)?"
        )
    else:
        reply = (
            "Assalamu alaikum! Apne business idea ke baare mein mazeed batayein — "
            "aap kya banana ya bechna chahti hain, aur kis sheher se shuru karengi?"
        )
    return IntakeAgentResult(is_complete=False, reply=reply, profile=None)


async def process_intake_chat(
    messages: list[dict[str, str]],
    user_name: str = "Entrepreneur",
) -> IntakeAgentResult:
    """Analyze chat messages and extract BusinessProfile via Gemini or fallback."""
    # If no live API key is set, use deterministic fallback
    is_mock_key = agent_config.api_key in ("missing-key-for-test", "test-key-not-for-live")
    if not agent_config.api_key or is_mock_key:
        return _rule_based_fallback_extraction(messages, user_name)

    try:
        model = get_model()
        agent = Agent(
            name="IntakeAgent",
            instructions=INTAKE_SYSTEM_PROMPT,
            output_type=IntakeAgentResult,
            model=model,
        )

        # Build conversation prompt
        formatted_history = "\n".join(
            f"{m.get('role', 'user').capitalize()}: {m.get('content', '')}" for m in messages
        )
        input_prompt = (
            f"Entrepreneur Name: {user_name}\n\n"
            f"Conversation History:\n{formatted_history}\n\n"
            "Analyze whether the business profile is complete. Return IntakeAgentResult."
        )

        result = await Runner.run(agent, input=input_prompt)
        final_output = result.final_output

        if isinstance(final_output, IntakeAgentResult):
            return final_output
        elif isinstance(final_output, dict):
            return IntakeAgentResult.model_validate(final_output)
        else:
            return _rule_based_fallback_extraction(messages, user_name)

    except Exception as exc:
        logger.warning("Intake agent LLM call failed, falling back to rule parser: %s", exc)
        return _rule_based_fallback_extraction(messages, user_name)
