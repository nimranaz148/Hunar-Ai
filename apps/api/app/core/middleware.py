"""HTTP middleware for correlation IDs and request tracking."""

import uuid
from contextvars import ContextVar

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

# Context variable accessible across async call stacks within a request
request_id_ctx: ContextVar[uuid.UUID | None] = ContextVar("request_id_ctx", default=None)


class RequestIdMiddleware(BaseHTTPMiddleware):
    """Middleware that injects and propagates X-Request-Id correlation headers."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        header_request_id = request.headers.get("X-Request-Id")
        correlation_id: uuid.UUID
        if header_request_id:
            try:
                correlation_id = uuid.UUID(header_request_id)
            except ValueError:
                correlation_id = uuid.uuid4()
        else:
            correlation_id = uuid.uuid4()

        token = request_id_ctx.set(correlation_id)
        request.state.request_id = correlation_id

        try:
            response = await call_next(request)
            response.headers["X-Request-Id"] = str(correlation_id)
            return response
        finally:
            request_id_ctx.reset(token)
