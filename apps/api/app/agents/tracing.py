"""Database trace processor saving agent execution spans to agent_steps (PRD §36.9, §36.19)."""

import json
import logging
from datetime import datetime
from typing import Any

from agents.tracing import Span, Trace, TracingProcessor
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import FORBIDDEN_KEY_PATTERNS
from app.models.agent import AgentStep

logger = logging.getLogger(__name__)

MAX_DATA_CHARS = 1500


def sanitize_and_truncate_data(data: Any, max_chars: int = MAX_DATA_CHARS) -> dict[str, Any]:
    """Sanitize secrets and truncate serialized payload to max_chars (PRD §36.19)."""
    if not isinstance(data, dict):
        if hasattr(data, "__dict__"):
            data = dict(data.__dict__)
        elif hasattr(data, "model_dump"):
            data = data.model_dump()
        else:
            data = {"value": str(data)}

    sanitized: dict[str, Any] = {}
    for key, val in data.items():
        # Check forbidden key names
        key_lower = str(key).lower()
        if any(pattern in key_lower for pattern in FORBIDDEN_KEY_PATTERNS):
            sanitized[key] = "[REDACTED]"
            continue

        if isinstance(val, dict):
            sanitized[key] = sanitize_and_truncate_data(val, max_chars=max_chars)
        elif isinstance(val, str):
            # Check if value itself contains api keys
            if "ai_key" in key_lower or "api_key" in key_lower or "secret" in key_lower:
                sanitized[key] = "[REDACTED]"
            else:
                sanitized[key] = val[:max_chars] if len(val) > max_chars else val
        else:
            sanitized[key] = val

    # Verify overall JSON string length
    try:
        raw_json = json.dumps(sanitized)
        if len(raw_json) > max_chars:
            truncated_json_str = raw_json[: max_chars - 20] + '... [truncated]"}'
            return {
                "summary": truncated_json_str,
                "_truncated": True,
            }
    except (TypeError, ValueError) as exc:
        logger.debug("Non-critical serialization warning in sanitize_and_truncate_data: %s", exc)

    return sanitized


def parse_timestamp(ts: str | None) -> datetime | None:
    """Parse ISO timestamp string into datetime."""
    if not ts:
        return None
    try:
        return datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except Exception:
        return None


class DbTraceProcessor(TracingProcessor):
    """Trace processor exporting spans to the agent_steps PostgreSQL table."""

    def __init__(self, db_session_factory: Any = None) -> None:
        self.db_session_factory = db_session_factory
        self.buffered_spans: list[dict[str, Any]] = []

    def on_trace_start(self, trace: Trace) -> None:
        """Handle trace beginning."""
        logger.debug("Trace started: %s", trace.trace_id)

    def on_trace_end(self, trace: Trace) -> None:
        """Handle trace completion."""
        logger.debug("Trace ended: %s", trace.trace_id)

    def on_span_start(self, span: Span[Any]) -> None:
        """Handle span initiation."""
        pass

    def on_span_end(self, span: Span[Any]) -> None:
        """Export completed span into agent_steps data structure."""
        span_type = getattr(span.span_data, "type", "custom")
        if span_type not in ("agent", "generation", "function", "handoff", "guardrail", "custom"):
            span_type = "custom"

        raw_data: dict[str, Any] = {}
        if hasattr(span.span_data, "name"):
            raw_data["name"] = span.span_data.name
        if hasattr(span.span_data, "input"):
            raw_data["input"] = span.span_data.input
        if hasattr(span.span_data, "output"):
            raw_data["output"] = span.span_data.output
        if hasattr(span.span_data, "data"):
            raw_data["data"] = span.span_data.data

        cleaned_data = sanitize_and_truncate_data(raw_data)

        error_data = None
        if span.error:
            error_data = sanitize_and_truncate_data(
                {"message": str(span.error.get("message", "Span error"))}
                if isinstance(span.error, dict)
                else {"message": str(span.error)}
            )

        step_dict = {
            "trace_id": span.trace_id,
            "span_id": span.span_id,
            "parent_id": span.parent_id,
            "span_type": span_type,
            "started_at": parse_timestamp(span.started_at),
            "ended_at": parse_timestamp(span.ended_at),
            "data": cleaned_data,
            "error": error_data,
        }

        self.buffered_spans.append(step_dict)

    async def flush_to_db(self, session: AsyncSession) -> list[AgentStep]:
        """Persist buffered spans directly to the database."""
        created_steps: list[AgentStep] = []
        while self.buffered_spans:
            item = self.buffered_spans.pop(0)
            step = AgentStep(
                trace_id=item["trace_id"],
                span_id=item["span_id"],
                parent_id=item["parent_id"],
                span_type=item["span_type"],
                started_at=item["started_at"],
                ended_at=item["ended_at"],
                data=item["data"],
                error=item["error"],
            )
            session.add(step)
            created_steps.append(step)

        await session.flush()
        return created_steps

    def shutdown(self) -> None:
        """Clean up resources on shutdown."""
        self.buffered_spans.clear()

    def force_flush(self) -> None:
        """Force flush queued items."""
        pass
