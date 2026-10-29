"""Integration and unit tests for Task 33: Tavily Search API (I-002 / PRD §13.3)."""

from unittest.mock import AsyncMock, patch

import httpx
import pytest

from app.agents.tools import search_market
from app.core.config import settings
from app.services.tavily import TavilyClient, TavilySearchResult


@pytest.mark.asyncio
async def test_tavily_search_success() -> None:
    """Test successful Tavily search parses results correctly (I-002)."""
    mock_payload = {
        "query": "handmade pottery Karachi",
        "results": [
            {
                "title": "Clay Studio Karachi - Handmade Ceramics",
                "url": "https://instagram.com/claystudiopk",
                "content": "Artisan handmade terracotta and ceramic dinnerware made in Karachi.",
                "score": 0.94,
            },
            {
                "title": "Karachi Pottery Marketplace",
                "url": "https://karachipottery.example.com",
                "content": "Wholesale and retail custom clay pots with nationwide shipping.",
                "score": 0.88,
            },
        ],
        "answer": "Karachi has several established handmade pottery studios.",
        "response_time": 0.42,
    }

    client = TavilyClient(api_key="tvly-test-mock-key")

    mock_resp = AsyncMock(spec=httpx.Response)
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_payload

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        res = await client.search(query="handmade pottery Karachi", max_results=2)

    assert res.success is True
    assert res.error is None
    assert len(res.results) == 2
    assert isinstance(res.results[0], TavilySearchResult)
    assert res.results[0].title == "Clay Studio Karachi - Handmade Ceramics"
    assert res.results[0].url == "https://instagram.com/claystudiopk"
    assert res.results[0].score == 0.94
    assert res.answer == "Karachi has several established handmade pottery studios."


@pytest.mark.asyncio
async def test_tavily_search_retry_on_server_error() -> None:
    """Test Tavily 2x retry on 500/502 server errors (PRD §13.3)."""
    mock_fail_resp = AsyncMock(spec=httpx.Response)
    mock_fail_resp.status_code = 502
    mock_fail_resp.text = "Bad Gateway"

    mock_ok_resp = AsyncMock(spec=httpx.Response)
    mock_ok_resp.status_code = 200
    mock_ok_resp.json.return_value = {
        "query": "test query",
        "results": [
            {
                "title": "Success Result",
                "url": "https://example.com",
                "content": "Text",
                "score": 0.9,
            }
        ],
    }

    client = TavilyClient(api_key="tvly-test-mock-key")

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        # First 2 attempts fail with 502, 3rd succeeds with 200
        mock_post.side_effect = [mock_fail_resp, mock_fail_resp, mock_ok_resp]

        res = await client.search(query="test query")

    assert res.success is True
    assert len(res.results) == 1
    assert res.results[0].title == "Success Result"
    assert mock_post.call_count == 3


@pytest.mark.asyncio
async def test_tavily_search_exhausted_retries_graceful_failure() -> None:
    """Test Tavily returns graceful failure structure when retries are exhausted."""
    mock_fail_resp = AsyncMock(spec=httpx.Response)
    mock_fail_resp.status_code = 503
    mock_fail_resp.text = "Service Unavailable"

    client = TavilyClient(api_key="tvly-test-mock-key")

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_fail_resp

        res = await client.search(query="failing query")

    assert res.success is False
    assert len(res.results) == 0
    assert "HTTP 503" in (res.error or "")
    assert mock_post.call_count == 3


@pytest.mark.asyncio
async def test_tavily_missing_api_key_graceful_handling(monkeypatch: pytest.MonkeyPatch) -> None:
    """Test Tavily client returns safe response if API key is not configured."""
    # Without this, an empty key falls back to a developer's local .env TAVILY_API_KEY.
    monkeypatch.setattr(settings, "TAVILY_API_KEY", "")
    client = TavilyClient(api_key="")
    res = await client.search(query="search without key")

    assert res.success is False
    assert res.error == "TAVILY_API_KEY is not set"
    assert len(res.results) == 0


@pytest.mark.asyncio
async def test_tavily_search_competitors_query_formulation() -> None:
    """Test search_competitors sets localized search terms for Pakistan markets."""
    client = TavilyClient(api_key="tvly-test-mock-key")

    with patch.object(client, "search", new_callable=AsyncMock) as mock_search:
        mock_search.return_value = AsyncMock(success=True, results=[])

        await client.search_competitors(niche="apparel", city="Lahore", max_results=3)

        mock_search.assert_called_once_with(
            query="top handmade apparel brands Instagram Lahore Pakistan price",
            max_results=3,
        )


@pytest.mark.asyncio
async def test_search_market_tool_integration() -> None:
    """Test search_market agent tool returns structured results via Tavily."""
    with patch("app.services.tavily.tavily_client.search", new_callable=AsyncMock) as mock_search:
        mock_search.return_value = AsyncMock(
            success=True,
            results=[
                TavilySearchResult(
                    title="Lahore Dupattas",
                    url="https://dupattas.pk",
                    content="Pure silk dupattas",
                    score=0.91,
                )
            ],
            error=None,
        )

        res = await search_market(query="pure silk dupattas", city="Lahore")

    assert res["query"] == "pure silk dupattas"
    assert res["city"] == "Lahore"
    assert res["success"] is True
    assert len(res["results"]) == 1
    assert res["results"][0]["title"] == "Lahore Dupattas"
    assert res["results"][0]["score"] == 0.91
