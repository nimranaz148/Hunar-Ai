"""Pydantic schemas for Pricing Agent & Break-even View (F-007 / PRD §5.2, §36.13)."""

import uuid
from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class PricingCalculateRequest(BaseModel):
    """Request payload to calculate or update pricing results."""

    overhead_pkr: int | None = Field(
        default=None,
        ge=0,
        description="Optional estimated monthly overhead in PKR (e.g. utilities, rent, tools)",
    )


class PricingResultResponse(BaseModel):
    """Pricing calculation and unit economics report for a product."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    business_id: uuid.UUID
    product_id: uuid.UUID | None = None
    product_name: str
    assumptions: dict[str, Any] = Field(default_factory=dict)
    unit_cost: int = Field(..., description="Cost of goods sold / direct cost per unit in PKR")
    price: int = Field(..., description="Recommended selling price in PKR")
    margin_pct: float = Field(..., description="Gross profit margin percentage")
    break_even_units: int = Field(..., description="Units required per month to break even")
    risk_flags: list[str] = Field(default_factory=list, description="Automated risk flags")
    notes: str = Field(default="", description="Strategic pricing guidance or recommendations")
    approved_at: datetime | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime | None = None
