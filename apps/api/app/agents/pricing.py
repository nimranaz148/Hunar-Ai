"""Pricing Agent: Calculates cost-based pricing, unit margins, and break-even (PRD §36.13, F-007)."""

import logging
import math
from typing import Any

from pydantic import BaseModel, Field

from app.agents.config import agent_config
from app.agents.llm import get_model

logger = logging.getLogger(__name__)


class PricingItemResult(BaseModel):
    """Calculated pricing economics for a single product offering."""

    product_id: str | None = None
    product_name: str
    unit_cost: int = Field(..., description="Calculated direct unit cost / COGS in PKR")
    price: int = Field(..., description="Recommended selling price in PKR")
    margin_pct: float = Field(..., description="Gross profit margin percentage")
    break_even_units: int = Field(
        ..., description="Monthly unit sales required to cover fixed overhead"
    )
    risk_flags: list[str] = Field(
        default_factory=list, description="Automated margin and volume risk alerts"
    )
    notes: str = Field(default="", description="Strategic pricing guidance and positioning notes")
    assumptions: dict[str, Any] = Field(
        default_factory=dict, description="Underlying fixed and variable assumptions"
    )


class PricingAgentOutput(BaseModel):
    """Aggregate output from the Pricing Agent."""

    items: list[PricingItemResult]
    overall_summary: str = ""


def calc_pricing(
    unit_cost: int,
    price: int,
    overhead_pkr: int = 10000,
    assumptions_extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Deterministic mathematical calculation of margins, break-even, and risk flags (PRD §36.13).

    Per PRD §36.13: The LLM does NOT do arithmetic; deterministic Python executes calculations.
    Rules:
      - Margins below 20% get a warning.
      - Break-even above 100 units/month gets a risk flag.
    """
    assumptions: dict[str, Any] = {
        "monthly_overhead_pkr": overhead_pkr,
        "pricing_formula": "Cost-Plus Value Pricing",
    }
    if assumptions_extra:
        assumptions.update(assumptions_extra)

    # Ensure price is at least unit_cost + 1
    effective_price = max(price, unit_cost + 1 if unit_cost > 0 else 100)

    # Gross margin percentage: (Price - Cost) / Price * 100
    if effective_price > 0:
        margin_pct = round(((effective_price - unit_cost) / effective_price) * 100.0, 1)
    else:
        margin_pct = 0.0

    # Unit contribution towards fixed overhead
    unit_contribution = max(1, effective_price - unit_cost)

    # Break-even units per month = ceil(monthly overhead / unit contribution)
    break_even_units = (
        math.ceil(overhead_pkr / unit_contribution) if unit_contribution > 0 else 999
    )

    risk_flags: list[str] = []
    if margin_pct < 20.0:
        risk_flags.append(
            "Margin below 20% - vulnerable to raw material cost increases (PRD §36.13)"
        )
    if break_even_units > 100:
        risk_flags.append(
            "Break-even above 100 units/month - high sales volume needed (PRD §36.13)"
        )
    if unit_cost <= 0:
        risk_flags.append("Missing cost inputs - direct unit cost is Rs. 0")

    return {
        "unit_cost": unit_cost,
        "price": effective_price,
        "margin_pct": margin_pct,
        "break_even_units": break_even_units,
        "risk_flags": risk_flags,
        "assumptions": assumptions,
    }


def compute_unit_cost_from_inputs(cost_inputs: list[dict[str, Any]] | None) -> int:
    """Calculate total direct cost from itemized cost inputs."""
    if not cost_inputs:
        return 0
    total = 0
    for item in cost_inputs:
        try:
            total += round(float(item.get("amount_pkr", 0)))
        except (ValueError, TypeError):
            continue
    return total


def _rule_based_fallback_pricing(
    business_name: str,
    niche: str,
    products_data: list[dict[str, Any]],
    overhead_pkr: int = 10000,
) -> PricingAgentOutput:
    """Deterministic fallback pricing when Gemini is in test mode or unconfigured."""
    results: list[PricingItemResult] = []

    for prod in products_data:
        prod_id = prod.get("id")
        prod_name = prod.get("name") or "Primary Offering"
        cost_inputs = prod.get("cost_inputs") or []
        unit_cost = compute_unit_cost_from_inputs(cost_inputs)

        # If product price is set and valid, use it; otherwise price for ~35-40% gross margin
        existing_price = prod.get("price_pkr")
        if existing_price and existing_price > unit_cost:
            selling_price = existing_price
        else:
            if unit_cost > 0:
                # 35% margin: price = cost / 0.65 rounded to nearest 50 PKR
                target = int(math.ceil((unit_cost / 0.65) / 50.0) * 50)
                selling_price = max(target, unit_cost + 100)
            else:
                unit_cost = 500
                selling_price = 850

        calc = calc_pricing(unit_cost=unit_cost, price=selling_price, overhead_pkr=overhead_pkr)

        notes = (
            f"Recommended pricing for {prod_name} provides a {calc['margin_pct']}% gross margin. "
            f"Selling {calc['break_even_units']} units monthly fully covers your estimated Rs. {overhead_pkr:,} overhead. "
            "Consider offering small bundles or promotional trial discounts for early neighborhood word-of-mouth."
        )

        results.append(
            PricingItemResult(
                product_id=str(prod_id) if prod_id else None,
                product_name=prod_name,
                unit_cost=calc["unit_cost"],
                price=calc["price"],
                margin_pct=calc["margin_pct"],
                break_even_units=calc["break_even_units"],
                risk_flags=calc["risk_flags"],
                notes=notes,
                assumptions=calc["assumptions"],
            )
        )

    summary = (
        f"Pricing strategy optimized for {business_name} in {niche}. "
        f"All products maintain positive contribution margins towards the Rs. {overhead_pkr:,} monthly operational budget."
    )
    return PricingAgentOutput(items=results, overall_summary=summary)


async def run_pricing_agent(
    business_name: str,
    niche: str,
    city: str,
    products_data: list[dict[str, Any]],
    overhead_pkr: int = 10000,
) -> PricingAgentOutput:
    """Run Pricing Agent to determine cost-based pricing, unit margins, and break-even (PRD §36.13)."""
    # If no products registered, provide a sensible default placeholder
    if not products_data:
        products_data = [
            {
                "id": None,
                "name": f"{business_name} Signature Offering",
                "cost_inputs": [
                    {"name": "Direct materials/ingredients", "amount_pkr": 600},
                    {"name": "Packaging & labels", "amount_pkr": 150},
                ],
                "price_pkr": 1250,
            }
        ]

    # Deterministic fallback check for test keys or missing API key
    is_mock_key = agent_config.api_key in ("missing-key-for-test", "test-key-not-for-live")
    if not agent_config.api_key or is_mock_key:
        return _rule_based_fallback_pricing(
            business_name=business_name,
            niche=niche,
            products_data=products_data,
            overhead_pkr=overhead_pkr,
        )

    # Calculate deterministic baseline first (the LLM does NOT do arithmetic)
    baseline_output = _rule_based_fallback_pricing(
        business_name=business_name,
        niche=niche,
        products_data=products_data,
        overhead_pkr=overhead_pkr,
    )

    try:
        # Prompt Gemini with deterministic figures to generate market positioning notes
        prompt = (
            f"Business: '{business_name}', Niche: '{niche}', City: '{city}'.\n"
            f"Monthly Overhead: Rs. {overhead_pkr:,}.\n"
            f"Here are the deterministic unit economics calculated for each product:\n"
        )
        for item in baseline_output.items:
            prompt += (
                f"- Product: '{item.product_name}', Unit Cost: Rs. {item.unit_cost}, "
                f"Price: Rs. {item.price}, Margin: {item.margin_pct}%, "
                f"Break-even: {item.break_even_units} units/month, "
                f"Flags: {item.risk_flags}\n"
            )
        prompt += (
            "\nProvide strategic, culturally grounded pricing advice in 2-3 sentences for each product, "
            "taking into account Pakistani local purchasing habits (e.g. delivery fee sensitivity, WhatsApp discounts, family bundling)."
        )

        from agents import Agent, Runner

        class ProductAdvice(BaseModel):
            product_name: str
            notes: str

        class AdviceResponse(BaseModel):
            advices: list[ProductAdvice]
            overall_summary: str

        agent = Agent(
            name="pricing_advisor",
            model=get_model(agent_config.gemini_model_name),
            instructions=(
                "You are Hunar's Pricing Advisor. Provide practical advice for Pakistani entrepreneurs. "
                "Do NOT change the arithmetic numbers; provide commercial and marketing advice for these prices."
            ),
            output_type=AdviceResponse,
        )

        result = await Runner.run(agent, prompt)
        advice_map = {a.product_name: a.notes for a in result.final_output.advices}

        for item in baseline_output.items:
            if item.product_name in advice_map:
                item.notes = advice_map[item.product_name]

        if result.final_output.overall_summary:
            baseline_output.overall_summary = result.final_output.overall_summary

        return baseline_output

    except Exception as exc:
        logger.warning(
            "Pricing Agent LLM call failed, returning deterministic calculations: %s", exc
        )
        return baseline_output
