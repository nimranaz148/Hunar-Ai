"""Pydantic schemas for Idea Validator & Validation Report (F-006 / PRD §5.2, §36.12)."""

import uuid
from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class CompetitorItem(BaseModel):
    """Competitor teardown item extracted/researched by Validator agent."""

    model_config = ConfigDict(from_attributes=True)

    name: str = Field(..., min_length=1, max_length=200, description="Competitor brand or business name")
    what_they_do_well: str = Field(..., min_length=1, description="Their key strengths, offerings, or social proof")
    gap_we_can_exploit: str = Field(..., min_length=1, description="Under-served customer pain point or market gap")
    source_url: str = Field(..., description="Source reference link or platform profile")


class ValidationReportResponse(BaseModel):
    """Validation report response schema."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    business_id: uuid.UUID
    competitors: list[CompetitorItem] = Field(default_factory=list)
    how_to_be_better: list[str] = Field(default_factory=list)
    confidence: Literal["low", "medium", "high"] = "medium"
    demand_summary: str = ""
    pricing_insight: str = ""
    reasoning: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime | None = None


class GenerateValidationReportRequest(BaseModel):
    """Optional parameters to trigger or refresh validation analysis."""

    force_refresh: bool = Field(default=False, description="Re-run agent even if cached report exists")
