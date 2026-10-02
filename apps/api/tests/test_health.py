"""Smoke tests for API health and metadata."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_health_check() -> None:
    """Health check endpoint returns status ok and version."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["version"] == "0.1.0"


def test_app_title() -> None:
    """App metadata is configured correctly."""
    assert app.title == "Hunar v2 API"
