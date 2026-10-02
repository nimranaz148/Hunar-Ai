"""Agent run and step (trace span) database models."""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import BigInteger, CheckConstraint, DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, UUIDPrimaryKeyMixin


class AgentRun(Base, UUIDPrimaryKeyMixin):
    """Execution records of agent workflows."""

    __tablename__ = "agent_runs"
    __table_args__ = (
        CheckConstraint(
            "status IN ('queued', 'running', 'awaiting_approval', "
            "'succeeded', 'failed', 'blocked')",
            name="check_agent_run_status",
        ),
        Index("ix_agent_runs_user_id", "user_id"),
        Index("ix_agent_runs_workflow_status", "workflow", "status"),
    )

    trace_id: Mapped[str | None] = mapped_column(
        String(100), unique=True, index=True, nullable=True
    )
    workflow: Mapped[str] = mapped_column(String(100), nullable=False)
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    business_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    status: Mapped[str] = mapped_column(String(50), server_default="queued", nullable=False)
    input_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    output_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class AgentStep(Base):
    """Detailed execution spans for an agent workflow run."""

    __tablename__ = "agent_steps"
    __table_args__ = (
        CheckConstraint(
            "span_type IN ('agent', 'generation', 'function', 'handoff', 'guardrail', 'custom')",
            name="check_agent_step_span_type",
        ),
        Index("ix_agent_steps_trace_id", "trace_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    trace_id: Mapped[str] = mapped_column(String(100), nullable=False)
    span_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    parent_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    span_type: Mapped[str] = mapped_column(String(50), nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    data: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    error: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
