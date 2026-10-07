"""Mentor Brief Agent: Generates synthesized one-page brief and progress report for mentors (PRD §5 F-025, §10 W-005, §36.23)."""

import logging

from pydantic import BaseModel, Field

from app.agents.config import agent_config
from app.agents.llm import get_model

logger = logging.getLogger(__name__)


class MentorBriefOutput(BaseModel):
    """Synthesized one-page brief for a mentor before a 1-on-1 session (PRD §10 W-005)."""

    executive_summary: str = Field(
        ...,
        description="High-level 2-3 sentence overview of the mentee, her venture, current phase, and primary challenge.",
    )
    stage: str = Field(
        ...,
        description="Current business maturity stage (e.g., 'Foundation & Setup', 'First Sales', 'Growth & Scaling').",
    )
    key_blockers: list[str] = Field(
        default_factory=list,
        description="Primary bottlenecks, overdue tasks, or uncertainties flagged by the system or mentee.",
    )
    focus_areas: list[str] = Field(
        default_factory=list,
        description="Suggested strategic and tactical focal points for the upcoming mentoring session.",
    )
    recommended_questions: list[str] = Field(
        default_factory=list,
        description="Probing questions the mentor can ask to uncover hidden blockers and guide the entrepreneur.",
    )
    growth_priorities: list[str] = Field(
        default_factory=list,
        description="Top 2-3 actionable milestones for the mentee over the next 1-2 weeks.",
    )


def _rule_based_fallback_brief(
    entrepreneur_name: str,
    business_name: str,
    niche: str,
    city: str,
    budget_pkr: int = 20000,
    tasks_total: int = 0,
    tasks_completed: int = 0,
    content_posted: int = 0,
    mentee_notes: str | None = None,
) -> MentorBriefOutput:
    """Deterministic, high-quality mentor brief tailored to Pakistani micro-businesses."""
    completion_rate = (tasks_completed / tasks_total * 100) if tasks_total > 0 else 0.0

    if completion_rate < 25:
        stage = "Foundation & Setup (Week 1)"
        blockers = [
            "Early stage setup: foundational operational and social presence tasks are still pending.",
            "Potential hesitation regarding packaging, pricing tiers, or neighborhood outreach.",
        ]
        focus = [
            "Review WhatsApp Business catalog setup and initial profile branding.",
            "Confirm unit economics and initial ingredient/raw material procurement.",
            "Establish a simple daily routine of 1 hour to maintain momentum.",
        ]
        questions = [
            f"Aap ko {business_name} shuru karne mein sab se bara masla kya aa raha hai?",
            "Kya packaging aur ingredient costs aap ke budget mein theek manage ho rahe hain?",
            "Family aur neighbors se pehla response kaisa mila?",
        ]
    elif completion_rate < 60:
        stage = "Early Sales & Customer Discovery (Week 2)"
        blockers = [
            "Conversion barrier: reaching out beyond immediate family/friends to organic paying customers.",
            "Consistency in publishing social media content and responding to WhatsApp inquiries.",
        ]
        focus = [
            "Optimizing the direct message / WhatsApp closing script for inquiries.",
            "Encouraging first customers to send photo reviews and testimonials for social proof.",
            "Setting up clean order tracking to prevent delivery delays or missed messages.",
        ]
        questions = [
            "Pehlay 5 paying customers tak pohnchne ke liye kya strategy use kar rahi hain?",
            "Customer inquiries ko close karne mein kya objections aati hain?",
            "Orders receive karne aur deliver karne ka process kitna smooth hai?",
        ]
    else:
        stage = "Growth & Operations Scaling (Weeks 3-4)"
        blockers = [
            "Capacity constraints: balancing production, delivery logistics, and social marketing.",
            "Maintaining healthy profit margins while exploring paid boosts or new product bundles.",
        ]
        focus = [
            "Refining repeat-order incentives (e.g. loyalty discounts, bundle offers).",
            "Streamlining supplier bulk purchases to reduce cost per unit.",
            "Standardizing batch preparation to save time.",
        ]
        questions = [
            "Repeat orders ka ratio kaisa hai aur regular customers kitne hain?",
            "Production volume barhane ke liye packaging ya ingredients ka koi issue toh nahi?",
            "Next month ke liye revenue target kya set kiya hai?",
        ]

    if mentee_notes and mentee_notes.strip():
        blockers.append(f"Mentee noted in booking request: '{mentee_notes.strip()}'")

    if content_posted == 0:
        blockers.append("No organic content posted yet from the 30-day marketing calendar.")

    summary = (
        f"{entrepreneur_name} operates '{business_name}', a home-based {niche} business in {city} "
        f"with an operating budget of PKR {budget_pkr:,}. She has completed {tasks_completed}/{tasks_total} "
        f"launch tasks ({completion_rate:.0f}%) and posted {content_posted} social content items. "
        f"She is currently in the {stage} phase."
    )

    priorities = [
        f"Complete remaining {max(0, tasks_total - tasks_completed)} launch plan milestones.",
        "Post at least 3 content pieces this week on chosen platforms.",
        "Secure and record customer feedback on product quality and pricing.",
    ]

    return MentorBriefOutput(
        executive_summary=summary,
        stage=stage,
        key_blockers=blockers,
        focus_areas=focus,
        recommended_questions=questions,
        growth_priorities=priorities,
    )


async def run_mentor_brief_agent(
    entrepreneur_name: str,
    business_name: str,
    niche: str,
    city: str,
    budget_pkr: int = 20000,
    tasks_total: int = 0,
    tasks_completed: int = 0,
    content_posted: int = 0,
    mentee_notes: str | None = None,
    competitor_gap: str | None = None,
    products_summary: str | None = None,
) -> MentorBriefOutput:
    """Run Mentor Brief Agent to synthesize a customized one-page briefing for a mentor session (PRD §5 F-025, §10 W-005)."""
    fallback = _rule_based_fallback_brief(
        entrepreneur_name=entrepreneur_name,
        business_name=business_name,
        niche=niche,
        city=city,
        budget_pkr=budget_pkr,
        tasks_total=tasks_total,
        tasks_completed=tasks_completed,
        content_posted=content_posted,
        mentee_notes=mentee_notes,
    )

    is_mock_key = agent_config.api_key in ("missing-key-for-test", "test-key-not-for-live")
    if not agent_config.api_key or is_mock_key:
        return fallback

    try:
        from agents import Agent, Runner

        prompt = (
            f"Mentee: {entrepreneur_name}\n"
            f"Business: '{business_name}' ({niche}) in {city}, Pakistan.\n"
            f"Budget: PKR {budget_pkr:,}.\n"
            f"Launch Plan Progress: {tasks_completed}/{tasks_total} tasks completed.\n"
            f"Content Published: {content_posted} posts.\n"
            f"Products: {products_summary or 'Standard catalog'}\n"
            f"Market Opportunity / Gap: {competitor_gap or 'Local hyper-convenience'}\n"
            f"Mentee's Booking Notes: {mentee_notes or 'General session guidance requested'}\n\n"
            "Generate a structured, insightful 1-page Mentor Brief. "
            "Tailor questions in culturally grounded Urdu/English for Pakistani women micro-entrepreneurs. "
            "Identify key blockers and give high-leverage focus areas."
        )

        agent = Agent(
            name="mentor_brief",
            model=get_model(agent_config.gemini_model_name),
            instructions=(
                "You are Hunar's Mentor Brief Agent. Prepare an executive one-page briefing for a mentor "
                "prior to a 1-on-1 advisory session with a Pakistani woman micro-entrepreneur. "
                "Be actionable, empathetic, and commercially focused."
            ),
            output_type=MentorBriefOutput,
        )

        result = await Runner.run(agent, prompt)
        if (
            isinstance(result.final_output, MentorBriefOutput)
            and len(result.final_output.focus_areas) > 0
        ):
            return result.final_output
        return fallback
    except Exception as exc:
        logger.warning(
            "Mentor Brief Agent LLM call failed, returning deterministic briefing: %s", exc
        )
        return fallback
