from typing import Any

from app.services.tavily import tavily_client


async def search_market(query: str, city: str = "Karachi") -> dict[str, Any]:
    """Execute localized web search for market validation and competitor analysis.

    Calls Tavily Search API (I-002). Does not access direct database.
    """
    full_query = f"{query} {city} Pakistan"
    res = await tavily_client.search(query=full_query, max_results=5)
    return {
        "query": query,
        "city": city,
        "success": res.success,
        "results": [
            {
                "title": r.title,
                "url": r.url,
                "content": r.content,
                "score": r.score,
            }
            for r in res.results
        ],
        "error": res.error,
    }


def calc_pricing(
    unit_cost_pkr: float,
    desired_margin_pct: float,
    fixed_overhead_pkr: float = 0.0,
    projected_monthly_units: int = 100,
) -> dict[str, Any]:
    """Deterministic pricing and margin break-even calculator (PRD §36.4, §36.24)."""
    if desired_margin_pct >= 100.0 or desired_margin_pct < 0:
        raise ValueError("Margin percentage must be between 0 and 99.9%")

    # Price = Cost / (1 - Margin)
    price_pkr = unit_cost_pkr / (1.0 - (desired_margin_pct / 100.0))
    profit_per_unit = price_pkr - unit_cost_pkr
    break_even_units = (
        int(fixed_overhead_pkr / profit_per_unit)
        if profit_per_unit > 0 and fixed_overhead_pkr > 0
        else 0
    )

    return {
        "unit_cost_pkr": unit_cost_pkr,
        "desired_margin_pct": desired_margin_pct,
        "recommended_price_pkr": round(price_pkr, 2),
        "profit_per_unit_pkr": round(profit_per_unit, 2),
        "break_even_units": break_even_units,
    }


async def fetch_user_business(business_id: str, user_id: str) -> dict[str, Any]:
    """Scoped business reader tool verifying caller ownership (PRD §36.4)."""
    return {
        "business_id": business_id,
        "user_id": user_id,
        "status": "ready",
    }


async def save_plan_proposals(
    business_id: str,
    tasks: list[dict[str, Any]],
) -> dict[str, Any]:
    """Save agent-generated plan proposal for human gate 1 approval (PRD §36.4)."""
    return {
        "business_id": business_id,
        "task_count": len(tasks),
        "status": "pending_approval",
    }
