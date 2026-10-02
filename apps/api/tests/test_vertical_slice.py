"""Acceptance tests for Task 09 — Vertical Slice (PRD §13.2, §3.1)."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_health_endpoint_response() -> None:
    """GET /api/v1/health returns status ok and version 0.1.0."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["version"] == "0.1.0"


@pytest.mark.asyncio
async def test_cors_preflight_and_origin_allowed() -> None:
    """CORS allows requests from http://localhost:3000 to http://localhost:8000."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Preflight OPTIONS request
        response = await client.options(
            "/api/v1/health",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "X-Request-Id",
            },
        )
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"
        assert response.headers.get("access-control-allow-credentials") == "true"

        # Direct GET with Origin header
        get_resp = await client.get(
            "/api/v1/health",
            headers={"Origin": "http://localhost:3000"},
        )
        assert get_resp.status_code == 200
        assert get_resp.headers.get("access-control-allow-origin") == "http://localhost:3000"
