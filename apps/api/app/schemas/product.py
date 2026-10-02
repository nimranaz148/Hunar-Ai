"""Pydantic schemas for Product Editor (F-005 / PRD §5.2, §12.3)."""

import uuid
from datetime import UTC, datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class CostInput(BaseModel):
    """Itemized cost component of a product or service."""

    model_config = ConfigDict(from_attributes=True)

    item: str = Field(..., min_length=1, max_length=100, description="Description of the cost component")
    amount_pkr: int = Field(..., ge=0, description="Cost amount in PKR")


class ProductResponse(BaseModel):
    """Product response schema."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    business_id: uuid.UUID
    name: str
    description: str | None = None
    cost_inputs: list[CostInput]
    price_pkr: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime | None = None


class CreateProductRequest(BaseModel):
    """Payload to create a product offering for a business (F-005)."""

    name: str = Field(..., min_length=2, max_length=200, description="Product or service name")
    description: str | None = Field(default=None, max_length=1000)
    cost_inputs: list[CostInput] = Field(default_factory=list, description="Array of itemized costs")
    price_pkr: int = Field(..., gt=0, description="Selling price in PKR")

    @model_validator(mode="after")
    def validate_price_exceeds_costs(self) -> "CreateProductRequest":
        total_costs = sum(c.amount_pkr for c in self.cost_inputs)
        if self.price_pkr < total_costs:
            raise ValueError(
                f"Selling price (PKR {self.price_pkr:,}) must be greater than or equal to total costs (PKR {total_costs:,})."
            )
        return self


class UpdateProductRequest(BaseModel):
    """Payload to update an existing product offering (F-005)."""

    name: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=1000)
    cost_inputs: list[CostInput] | None = None
    price_pkr: int | None = Field(default=None, gt=0)

    @model_validator(mode="after")
    def validate_price_exceeds_costs_if_both_present(self) -> "UpdateProductRequest":
        if self.cost_inputs is not None and self.price_pkr is not None:
            total_costs = sum(c.amount_pkr for c in self.cost_inputs)
            if self.price_pkr < total_costs:
                raise ValueError(
                    f"Selling price (PKR {self.price_pkr:,}) must be greater than or equal to total costs (PKR {total_costs:,})."
                )
        return self
