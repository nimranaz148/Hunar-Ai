"""Hunar Guide (orchestrator) and Mentor Matcher service layer (PRD §36.20).

Agents receive plain facts only; this layer owns data access, ownership scoping and tracing.
"""

import uuid
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.agents.mentor_matcher import run_mentor_matcher_agent
from app.agents.orchestrator import GuideReply, run_guide
from app.agents.runner import KillSwitchActiveError, run_agent
from app.models.business import Business
from app.models.mentor import MentorProfile
from app.models.user import User
from app.schemas.guide import GuideResponse, MentorMatchItem, MentorMatchResponse
from app.services.business import get_business_by_id

MAX_CANDIDATES = 20


async def _own_business(db: AsyncSession, user: User) -> Business | None:
    res = await db.execute(select(Business).where(Business.owner_id == user.id))
    return res.scalar_one_or_none()


async def _active_mentors(db: AsyncSession) -> list[MentorProfile]:
    stmt = (
        select(MentorProfile)
        .where(MentorProfile.status == "active")
        .options(selectinload(MentorProfile.services))
        .order_by(MentorProfile.rating.desc(), MentorProfile.review_count.desc())
        .limit(MAX_CANDIDATES)
    )
    return list((await db.execute(stmt)).scalars().all())


def _mentor_facts(m: MentorProfile) -> dict[str, Any]:
    prices = [s.price_pkr for s in m.services if s.active]
    return {
        "mentor_id": str(m.id),
        "name": m.user.name,
        "niches": list(m.niches),
        "languages": list(m.languages),
        "city": m.city,
        "rating": m.rating,
        "review_count": m.review_count,
        "min_service_price_pkr": min(prices) if prices else None,
        "bio": m.bio[:200],
    }


def _business_facts(b: Business) -> dict[str, Any]:
    return {
        "name": b.name,
        "niche": b.niche,
        "city": b.city,
        "budget_pkr": b.budget_pkr,
        "languages": b.languages,
        "target_customer": b.target_customer,
    }


def _rule_based_score(business: dict[str, Any], mentor: dict[str, Any]) -> tuple[int, str]:
    """Deterministic ranking used when the AI matcher is unavailable."""
    score, reasons = 0, []
    if business["niche"] in mentor["niches"]:
        score += 50
        reasons.append(f"works in {business['niche']}")
    if business["city"].lower() == mentor["city"].lower():
        score += 20
        reasons.append(f"is based in {mentor['city']}")
    if set(business["languages"] or []) & set(mentor["languages"]):
        score += 10
        reasons.append("speaks your language")
    score += min(20, int(mentor["rating"] * 4))
    if mentor["review_count"]:
        reasons.append(f"rated {mentor['rating']:.1f} by {mentor['review_count']} clients")
    return min(score, 100), (
        "Matches because it " + ", ".join(reasons)
    ) if reasons else "Active mentor"


async def match_mentors(
    db: AsyncSession, user: User, business_id: uuid.UUID
) -> MentorMatchResponse:
    """Rank active mentors for one business (AI when available, rules otherwise)."""
    business = await get_business_by_id(db, business_id, user)
    facts = _business_facts(business)
    mentors = await _active_mentors(db)
    candidates = [_mentor_facts(m) for m in mentors]
    by_id = {c["mentor_id"]: c for c in candidates}

    ai = await run_mentor_matcher_agent(facts, candidates)
    if ai is not None:
        ranked = [(m.mentor_id, m.score, m.reason) for m in ai]
        source = "ai"
    else:
        scored = [(c["mentor_id"], *_rule_based_score(facts, c)) for c in candidates]
        ranked = sorted(scored, key=lambda t: t[1], reverse=True)[:5]
        source = "rules"

    return MentorMatchResponse(
        source=source,
        items=[
            MentorMatchItem(
                mentor_id=uuid.UUID(mid),
                name=by_id[mid]["name"],
                city=by_id[mid]["city"],
                niches=by_id[mid]["niches"],
                rating=by_id[mid]["rating"],
                min_service_price_pkr=by_id[mid]["min_service_price_pkr"],
                score=score,
                reason=reason,
            )
            for mid, score, reason in ranked
        ],
    )


async def ask_guide(db: AsyncSession, user: User, message: str) -> GuideResponse:
    """Route a question through the HunarGuide orchestrator inside a traced agent run."""
    business = await _own_business(db, user)
    context: dict[str, Any] = {"business": _business_facts(business) if business else None}
    if business:
        context["mentor_candidates"] = [_mentor_facts(m) for m in await _active_mentors(db)]

    captured: dict[str, GuideReply] = {}

    async def _execute() -> str:
        captured["reply"] = await run_guide(message, context)
        return captured["reply"].reply

    try:
        await run_agent(
            db=db,
            workflow="guide",
            user_id=user.id,
            business_id=business.id if business else None,
            execute_fn=_execute,
            input_summary=message[:100],
        )
    except KillSwitchActiveError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    reply = captured["reply"]
    await db.commit()
    return GuideResponse(
        reply=reply.reply,
        mode=reply.mode,
        handoffs=reply.handoffs,
        tools_used=reply.tools_used,
    )
