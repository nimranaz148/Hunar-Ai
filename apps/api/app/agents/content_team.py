"""Content Engine agents: Strategist, Writer, Visual Prompt and QA (PRD §36.16-36.19).

Every ``run_*`` function returns None when Gemini is unavailable or fails, so the service layer
keeps its deterministic fallback. Agents never touch the database: services pass context in
and persist what comes back.
"""

import asyncio
import logging
from typing import Any, Literal

from agents import Agent
from pydantic import BaseModel, Field

from app.agents.llm import get_model, llm_available, run_structured

logger = logging.getLogger(__name__)

WRITER_BATCH_SIZE = 8  # 30 days -> 4 parallel batches

Format = Literal["reel", "carousel", "story", "static"]


# --------------------------------------------------------------------------- Strategist


class DayBrief(BaseModel):
    day: int = Field(ge=1, le=30)
    format: Format
    pillar: str = Field(description="e.g. behind_the_scenes, product_showcase, education_tips")
    goal: str = Field(description="awareness, sales, engagement or leads")
    key_idea: str = Field(description="One concrete, business-specific post idea.")


class StrategistOutput(BaseModel):
    day_briefs: list[DayBrief] = Field(description="Exactly 30 briefs, days 1..30.")


STRATEGIST_PROMPT = """You are Hunar's Content Strategist for a Pakistani home business.
Plan 30 days of Instagram/Facebook content as exactly 30 day briefs (day 1..30).
Rules:
- Mix formats: ~40% reel, 30% carousel, 20% story, 10% static.
- Rotate pillars; every key_idea must name this business's real products, city or customers.
  Never reuse generic ideas like 'workspace & material prep' across businesses.
- Use the competitor gaps and hashtag research given to choose angles competitors miss.
- Week 1 awareness, week 2 trust/education, week 3 sales, week 4 community + conversion."""


def build_strategist_agent(structured: bool = True) -> Agent:
    return Agent(
        name="ContentStrategist",
        instructions=STRATEGIST_PROMPT,
        model=get_model(),
        output_type=StrategistOutput if structured else None,
    )


async def run_strategist_agent(context: dict[str, Any]) -> list[dict[str, Any]] | None:
    """Return 30 validated day briefs, or None to use the default outline."""
    if not llm_available():
        return None
    out = await run_structured(
        build_strategist_agent(), f"Business context:\n{context}", StrategistOutput
    )
    if out is None:
        return None
    days = sorted(b.day for b in out.day_briefs)
    if days != list(range(1, 31)):
        logger.warning(
            "Strategist returned %d briefs / bad day numbers; using fallback.", len(days)
        )
        return None
    return [b.model_dump() for b in sorted(out.day_briefs, key=lambda b: b.day)]


# --------------------------------------------------------------------------- Writer


class WrittenPost(BaseModel):
    day: int
    hook: str = Field(description="First line, max 90 chars, stops the scroll.")
    caption: str = Field(description="Roman Urdu/English caption in the business tone.")
    cta: str
    hashtags: list[str] = Field(description="5-8 hashtags, each starting with '#'.")


class WriterOutput(BaseModel):
    posts: list[WrittenPost]


WRITER_PROMPT = """You are Hunar's Content Writer for a Pakistani home business.
Write one post per brief given. Voice: the business tone, natural Roman Urdu mixed with simple
English as customers actually write it. Each caption must be copy-paste ready, reference the real
product/city, and end with a clear WhatsApp/DM call to action. No invented prices, discounts,
reviews or customer names. Hashtags come from the research list when relevant."""


def build_writer_agent(structured: bool = True) -> Agent:
    return Agent(
        name="ContentWriter",
        instructions=WRITER_PROMPT,
        model=get_model(),
        output_type=WriterOutput if structured else None,
    )


async def _write_batch(context: dict[str, Any], briefs: list[dict[str, Any]]) -> list[WrittenPost]:
    out = await run_structured(
        build_writer_agent(), f"Business context:\n{context}\n\nBriefs:\n{briefs}", WriterOutput
    )
    return out.posts if out else []


async def run_writer_agent(
    context: dict[str, Any], briefs: list[dict[str, Any]]
) -> dict[int, WrittenPost]:
    """Write all briefs in parallel batches; missing days simply fall back per day."""
    if not llm_available():
        return {}
    batches = [briefs[i : i + WRITER_BATCH_SIZE] for i in range(0, len(briefs), WRITER_BATCH_SIZE)]
    results = await asyncio.gather(*(_write_batch(context, b) for b in batches))
    wanted = {b["day"] for b in briefs}
    return {p.day: p for posts in results for p in posts if p.day in wanted}


# --------------------------------------------------------------------------- Visual prompts


class VisualPrompt(BaseModel):
    day: int
    image_subject: str
    image_style: str
    image_composition: str
    video_scenes: list[str] = Field(
        description="3-5 shot descriptions for reels/stories, else []."
    )


class VisualOutput(BaseModel):
    prompts: list[VisualPrompt]


VISUAL_PROMPT = """You are Hunar's Visual Prompt Designer. For each post, write prompts a woman can
paste into an AI image/video tool (or brief a phone photo shoot) to get realistic, appetising,
culturally Pakistani visuals of THIS business's actual product. Be concrete: subject, lighting,
background, props. Video scenes only for reel/story formats, 3-5 short shots."""


def build_visual_agent(structured: bool = True) -> Agent:
    return Agent(
        name="VisualPromptDesigner",
        instructions=VISUAL_PROMPT,
        model=get_model(),
        output_type=VisualOutput if structured else None,
    )


async def run_visual_agent(
    context: dict[str, Any], posts: list[dict[str, Any]]
) -> dict[int, VisualPrompt]:
    if not llm_available() or not posts:
        return {}
    batches = [posts[i : i + WRITER_BATCH_SIZE] for i in range(0, len(posts), WRITER_BATCH_SIZE)]

    async def _one(batch: list[dict[str, Any]]) -> list[VisualPrompt]:
        out = await run_structured(
            build_visual_agent(), f"Business context:\n{context}\n\nPosts:\n{batch}", VisualOutput
        )
        return out.prompts if out else []

    results = await asyncio.gather(*(_one(b) for b in batches))
    return {p.day: p for prompts in results for p in prompts}


# --------------------------------------------------------------------------- QA


class QAFix(BaseModel):
    day: int
    problem: str
    corrected_caption: str


class QAOutput(BaseModel):
    fixes: list[QAFix] = Field(description="Only posts that need a change; empty if all are fine.")


QA_PROMPT = """You are Hunar's Content QA reviewer. Check each post against the business facts and
rules: no invented prices/discounts/reviews/guarantees, no claims the business cannot back up,
no medical/religious/political claims, caption matches the product and city, hashtags relevant,
clear call to action, no copied competitor names. Return a corrected_caption ONLY for posts that
break a rule. Return an empty list if everything passes."""


def build_qa_agent(structured: bool = True) -> Agent:
    return Agent(
        name="ContentQA",
        instructions=QA_PROMPT,
        model=get_model(),
        output_type=QAOutput if structured else None,
    )


async def run_qa_agent(context: dict[str, Any], posts: list[dict[str, Any]]) -> dict[int, QAFix]:
    if not llm_available() or not posts:
        return {}
    out = await run_structured(
        build_qa_agent(), f"Business context:\n{context}\n\nPosts:\n{posts}", QAOutput
    )
    return {f.day: f for f in out.fixes} if out else {}
