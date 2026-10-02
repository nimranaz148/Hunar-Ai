"""RFC 7807 global exception handlers and problem details formatting."""

import http
import logging
import uuid
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.middleware import request_id_ctx
from app.schemas.common import ErrorDetail

logger = logging.getLogger(__name__)

# Map standard HTTP status codes to RFC 7807 type slugs
STATUS_TYPE_MAP: dict[int, str] = {
    400: "bad_request",
    401: "authentication_error",
    403: "forbidden",
    404: "not_found",
    405: "method_not_allowed",
    409: "conflict",
    422: "validation_error",
    429: "rate_limited",
    500: "internal_error",
    502: "bad_gateway",
    503: "service_unavailable",
}


def _get_request_id(request: Request) -> str:
    """Retrieve or generate correlation ID for error responses."""
    ctx_id = request_id_ctx.get()
    if ctx_id:
        return str(ctx_id)
    state_id = getattr(request.state, "request_id", None)
    if state_id:
        return str(state_id)
    header_id = request.headers.get("X-Request-Id")
    if header_id:
        return header_id
    return str(uuid.uuid4())


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    """Handle 422 RequestValidationError per RFC 7807 specification."""
    req_id = _get_request_id(request)
    errors: list[ErrorDetail] = []
    detail_parts: list[str] = []

    for err in exc.errors():
        loc = err.get("loc", ())
        # Filter out "body", "query", "path" prefix if present
        field_parts = [str(part) for part in loc if part not in ("body", "query", "path")]
        field_name = ".".join(field_parts) if field_parts else None
        msg = err.get("msg", "Invalid value")
        errors.append(ErrorDetail(field=field_name, message=msg))
        if field_name:
            detail_parts.append(f"{field_name}: {msg}")
        else:
            detail_parts.append(msg)

    primary_detail = "; ".join(detail_parts) if detail_parts else "Validation error"

    content: dict[str, Any] = {
        "type": "validation_error",
        "title": "Invalid input",
        "status": 422,
        "detail": primary_detail,
        "instance": request.url.path,
        "errors": [e.model_dump() for e in errors],
    }

    return JSONResponse(
        status_code=422,
        content=content,
        headers={"X-Request-Id": req_id, "Content-Type": "application/problem+json"},
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Handle standard HTTPException per RFC 7807 specification."""
    req_id = _get_request_id(request)
    status_code = exc.status_code

    try:
        title = http.HTTPStatus(status_code).phrase
    except ValueError:
        title = "Error"

    type_slug = STATUS_TYPE_MAP.get(status_code, "http_error")
    detail = str(exc.detail) if exc.detail else title

    content: dict[str, Any] = {
        "type": type_slug,
        "title": title,
        "status": status_code,
        "detail": detail,
        "instance": request.url.path,
    }

    headers = dict(exc.headers or {})
    headers["X-Request-Id"] = req_id
    headers["Content-Type"] = "application/problem+json"

    return JSONResponse(
        status_code=status_code,
        content=content,
        headers=headers,
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected server errors without leaking internals (RFC 7807)."""
    req_id = _get_request_id(request)
    logger.exception("Unhandled server exception: %s (request_id=%s)", exc, req_id)

    content: dict[str, Any] = {
        "type": "internal_error",
        "title": "Internal Server Error",
        "status": 500,
        "detail": "An unexpected error occurred.",
        "instance": request.url.path,
    }

    return JSONResponse(
        status_code=500,
        content=content,
        headers={"X-Request-Id": req_id, "Content-Type": "application/problem+json"},
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Register all RFC 7807 exception handlers on the FastAPI application."""
    app.add_exception_handler(RequestValidationError, validation_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, unhandled_exception_handler)
