"""Schemas for the Hunar Guide orchestrator and Mentor Matcher endpoints."""

import uuid
from typing import Literal

from pydantic import BaseModel, Field


class GuideRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)


class GuideResponse(BaseModel):
    reply: str
    mode: Literal["live", "offline"] = Field(
        description="'offline' means no AI key or the AI failed; the reply is a fixed notice."
    )
    handoffs: list[str] = Field(default_factory=list, description="Specialists that took over.")
    tools_used: list[str] = Field(default_factory=list, description="Tools/agent-tools called.")


class MentorMatchItem(BaseModel):
    mentor_id: uuid.UUID
    name: str
    city: str
    niches: list[str]
    rating: float
    min_service_price_pkr: int | None
    score: int = Field(ge=0, le=100)
    reason: str


class MentorMatchResponse(BaseModel):
    source: Literal["ai", "rules"]
    items: list[MentorMatchItem]
