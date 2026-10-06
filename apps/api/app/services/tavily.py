"""Tavily Search API client for market and competitor research (I-002 / PRD §13.3, W-002)."""

import asyncio
import logging
from dataclasses import dataclass, field
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

TAVILY_SEARCH_URL = "https://api.tavily.com/search"


@dataclass
class TavilySearchResult:
    """Single search result item returned from Tavily."""

    title: str
    url: str
    content: str
    score: float = 0.0


@dataclass
class TavilySearchResponse:
    """Structured response from Tavily search execution."""

    query: str
    results: list[TavilySearchResult] = field(default_factory=list)
    answer: str | None = None
    response_time: float = 0.0
    success: bool = True
    error: str | None = None


class TavilyClient:
    """Async Tavily Search client with 2x retry and graceful failure handling (I-002)."""

    def __init__(self, api_key: str | None = None, base_url: str = TAVILY_SEARCH_URL) -> None:
        self.api_key = api_key or settings.TAVILY_API_KEY
        self.base_url = base_url

    async def search(
        self,
        query: str,
        search_depth: str = "basic",
        max_results: int = 5,
        include_domains: list[str] | None = None,
        exclude_domains: list[str] | None = None,
        include_answer: bool = False,
    ) -> TavilySearchResponse:
        """Execute web search with 2x retry on network/server errors (PRD §13.3)."""
        if not self.api_key:
            logger.warning("TAVILY_API_KEY is not configured; returning empty search response")
            return TavilySearchResponse(
                query=query,
                results=[],
                success=False,
                error="TAVILY_API_KEY is not set",
            )

        payload: dict[str, Any] = {
            "api_key": self.api_key,
            "query": query,
            "search_depth": search_depth,
            "max_results": max_results,
            "include_answer": include_answer,
        }
        if include_domains:
            payload["include_domains"] = include_domains
        if exclude_domains:
            payload["exclude_domains"] = exclude_domains

        max_attempts = 3  # Initial try + 2 retries (PRD §13.3)
        last_error = ""

        for attempt in range(1, max_attempts + 1):
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(
                        self.base_url,
                        json=payload,
                        headers={"Content-Type": "application/json"},
                    )

                    if resp.status_code == 200:
                        data = resp.json()
                        raw_results = data.get("results", [])
                        results = [
                            TavilySearchResult(
                                title=r.get("title", ""),
                                url=r.get("url", ""),
                                content=r.get("content", ""),
                                score=float(r.get("score", 0.0)),
                            )
                            for r in raw_results
                        ]
                        return TavilySearchResponse(
                            query=query,
                            results=results,
                            answer=data.get("answer"),
                            response_time=float(data.get("response_time", 0.0)),
                            success=True,
                        )

                    if 500 <= resp.status_code < 600:
                        last_error = f"Tavily server error HTTP {resp.status_code}"
                        logger.warning(
                            "Tavily search attempt %d/%d failed with %s; retrying...",
                            attempt,
                            max_attempts,
                            last_error,
                        )
                        if attempt < max_attempts:
                            await asyncio.sleep(0.5 * attempt)
                            continue

                    error_data = resp.text
                    last_error = f"HTTP {resp.status_code}: {error_data}"
                    break

            except (httpx.RequestError, httpx.TimeoutException) as exc:
                last_error = f"Network error: {exc}"
                logger.warning(
                    "Tavily search attempt %d/%d encountered exception: %s",
                    attempt,
                    max_attempts,
                    exc,
                )
                if attempt < max_attempts:
                    await asyncio.sleep(0.5 * attempt)
                    continue

        logger.error(
            "Tavily search failed after %d attempts for query '%s': %s",
            max_attempts,
            query,
            last_error,
        )
        return TavilySearchResponse(
            query=query,
            results=[],
            success=False,
            error=last_error,
        )

    async def search_competitors(
        self,
        niche: str,
        city: str = "Pakistan",
        max_results: int = 5,
    ) -> TavilySearchResponse:
        """Search local competitors and trending hashtags for a given niche and city."""
        query = f"top handmade {niche} brands Instagram {city} Pakistan price"
        return await self.search(query=query, max_results=max_results)


# Default singleton client instance
tavily_client = TavilyClient()
