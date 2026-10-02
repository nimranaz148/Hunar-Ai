"""launch_plans_and_proposals

Revision ID: 0006_launch_plans_and_proposals
Revises: 0005_pricing_results
Create Date: 2026-10-02 02:15:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0006_launch_plans_and_proposals"
down_revision: str | None = "0005_pricing_results"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. launch_plans
    op.create_table(
        "launch_plans",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.func.gen_random_uuid(),
        ),
        sa.Column(
            "business_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("businesses.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("status", sa.String(30), server_default="awaiting_approval", nullable=False),
        sa.Column("summary", sa.Text(), server_default="", nullable=False),
        sa.Column("revision_notes", sa.Text(), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "status IN ('not_started', 'in_progress', 'awaiting_approval', 'approved', 'revision_requested')",
            name="check_launch_plan_status",
        ),
    )
    op.create_index("ix_launch_plans_business_id", "launch_plans", ["business_id"], unique=True)

    # 2. plan_tasks
    op.create_table(
        "plan_tasks",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.func.gen_random_uuid(),
        ),
        sa.Column(
            "plan_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("launch_plans.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), server_default="", nullable=False),
        sa.Column("week", sa.Integer(), nullable=False),
        sa.Column("category", sa.String(50), server_default="setup", nullable=False),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("status", sa.String(30), server_default="pending", nullable=False),
        sa.Column("order_index", sa.Integer(), server_default="0", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "status IN ('pending', 'in_progress', 'completed', 'skipped')",
            name="check_plan_task_status",
        ),
        sa.CheckConstraint("week BETWEEN 1 AND 4", name="check_plan_task_week_range"),
    )
    op.create_index("ix_plan_tasks_plan_id", "plan_tasks", ["plan_id"])
    op.create_index("ix_plan_tasks_due_date", "plan_tasks", ["due_date"])

    # 3. proposals
    op.create_table(
        "proposals",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.func.gen_random_uuid(),
        ),
        sa.Column(
            "business_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("businesses.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "run_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("agent_runs.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("gate_type", sa.String(50), nullable=False),
        sa.Column(
            "payload",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="{}",
            nullable=False,
        ),
        sa.Column("status", sa.String(30), server_default="pending", nullable=False),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "status IN ('pending', 'approved', 'rejected')",
            name="check_proposal_status",
        ),
        sa.CheckConstraint(
            "gate_type IN ('plan_approval', 'content_outline', 'weekly_review')",
            name="check_proposal_gate_type",
        ),
    )
    op.create_index("ix_proposals_business_id", "proposals", ["business_id"])
    op.create_index("ix_proposals_gate_type_status", "proposals", ["gate_type", "status"])


def downgrade() -> None:
    op.drop_table("proposals")
    op.drop_table("plan_tasks")
    op.drop_table("launch_plans")
