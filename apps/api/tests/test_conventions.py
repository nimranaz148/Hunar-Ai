"""Acceptance tests for API conventions (Task 06 / PRD §13.1)."""

import uuid
from typing import Any

import pytest
from fastapi import APIRouter
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.schemas.common import PaginatedResponse

# Test router to verify pagination and error behaviors
conventions_test_router = APIRouter(prefix="/api/v1/test-conventions", tags=["test"])


@conventions_test_router.get("/paginated", response_model=PaginatedResponse[str])
async def get_test_paginated(page: int = 1, page_size: int = 20) -> dict[str, Any]:
    """Test endpoint returning paginated response."""
    items = [f"item_{i}" for i in range((page - 1) * page_size, page * page_size)]
    return {
        "items": items,
        "total": 100,
        "page": page,
        "page_size": page_size,
    }


@conventions_test_router.get("/raise-500")
async def get_test_raise_500() -> None:
    """Test endpoint raising unhandled exception."""
    raise RuntimeError("Sensitive internal database connection failed: secret_pw")


# Register router on app for testing
app.include_router(conventions_test_router)


@pytest.mark.asyncio
async def test_openapi_spec_served() -> None:
    """OpenAPI spec is served at /api/v1/openapi.json per PRD §13.1."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/openapi.json")
        assert response.status_code == 200
        data = response.json()
        assert "openapi" in data
        assert data["info"]["title"] == "Hunar v2 API"
        assert "/api/v1/health" in data["paths"]


@pytest.mark.asyncio
async def test_request_id_in_all_responses() -> None:
    """All responses must include X-Request-Id header per PRD §13.1."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Case 1: Client provides X-Request-Id
        custom_id = str(uuid.uuid4())
        resp1 = await client.get("/api/v1/health", headers={"X-Request-Id": custom_id})
        assert resp1.status_code == 200
        assert resp1.headers.get("X-Request-Id") == custom_id

        # Case 2: No X-Request-Id provided, server generates UUID
        resp2 = await client.get("/api/v1/health")
        assert resp2.status_code == 200
        returned_id = resp2.headers.get("X-Request-Id")
        assert returned_id is not None
        # Verify it is valid UUID
        assert uuid.UUID(returned_id)


@pytest.mark.asyncio
async def test_rfc7807_validation_error() -> None:
    """422 Validation errors return RFC 7807 problem details with field errors."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # POST invalid payload to /api/v1/auth/register
        response = await client.post(
            "/api/v1/auth/register",
            json={"name": "A", "email": "not-an-email", "password": "weak"},
        )
        assert response.status_code == 422
        assert response.headers.get("Content-Type") == "application/problem+json"
        assert response.headers.get("X-Request-Id") is not None

        body = response.json()
        assert body["type"] == "validation_error"
        assert body["title"] == "Invalid input"
        assert body["status"] == 422
        assert "email" in body["detail"]
        assert body["instance"] == "/api/v1/auth/register"
        assert isinstance(body["errors"], list)
        assert len(body["errors"]) > 0

        # Check field mappings
        field_names = [e["field"] for e in body["errors"]]
        assert "email" in field_names


@pytest.mark.asyncio
async def test_rfc7807_http_exception_401_and_404() -> None:
    """HTTPException returns RFC 7807 problem details with correct type and title."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 401 Unauthorized
        resp_401 = await client.get("/api/v1/auth/me")
        assert resp_401.status_code == 401
        assert resp_401.headers.get("Content-Type") == "application/problem+json"
        body_401 = resp_401.json()
        assert body_401["type"] == "authentication_error"
        assert body_401["title"] == "Unauthorized"
        assert body_401["status"] == 401
        assert body_401["instance"] == "/api/v1/auth/me"

        # 404 Not Found
        resp_404 = await client.get("/api/v1/non-existent-route")
        assert resp_404.status_code == 404
        assert resp_404.headers.get("Content-Type") == "application/problem+json"
        body_404 = resp_404.json()
        assert body_404["type"] == "not_found"
        assert body_404["title"] == "Not Found"
        assert body_404["status"] == 404


@pytest.mark.asyncio
async def test_rfc7807_unhandled_exception_500_masks_internals() -> None:
    """500 Internal error returns RFC 7807 without leaking internal secrets/stacktraces."""
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/test-conventions/raise-500")
        assert response.status_code == 500
        assert response.headers.get("Content-Type") == "application/problem+json"
        assert response.headers.get("X-Request-Id") is not None

        body = response.json()
        assert body["type"] == "internal_error"
        assert body["title"] == "Internal Server Error"
        assert body["status"] == 500
        assert body["detail"] == "An unexpected error occurred."
        # Sensitive database string must NOT appear
        assert "secret_pw" not in str(body)


@pytest.mark.asyncio
async def test_paginated_response_format() -> None:
    """Paginated endpoints return {items, total, page, page_size} per PRD §13.1."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/test-conventions/paginated?page=2&page_size=10")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 100
        assert data["page"] == 2
        assert data["page_size"] == 10
        assert len(data["items"]) == 10
        assert data["items"][0] == "item_10"
