"""Regression tests for the rule-based intake parser (used when no LLM is available)."""

import pytest

from app.agents.intake import _rule_based_fallback_extraction


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("Lahore mein clay pottery business, budget 30000 PKR", 30000),
        ("cake business Karachi 25k", 25000),
        ("cake business Karachi 25 hazar rupay", 25000),
        ("food business Lahore Rs 15000", 15000),
    ],
)
def test_budget_unit_is_matched_exactly(text: str, expected: int) -> None:
    """'30000 PKR' must stay 30000: the letter k inside 'pkr' is not a thousand multiplier."""
    result = _rule_based_fallback_extraction([{"role": "user", "content": text}])
    assert result.profile is not None
    assert result.profile.budget_pkr == expected
