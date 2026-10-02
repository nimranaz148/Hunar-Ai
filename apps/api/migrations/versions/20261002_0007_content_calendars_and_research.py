"""content_calendars_and_research

Revision ID: 0007_content_calendars_and_research
Revises: 0006_launch_plans_and_proposals
Create Date: 2026-10-02 04:30:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0007_content_calendars_and_research"
down_revision: str | None = "0006_launch_plans_and_proposals"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. content_calendars
    op.create_table(
        "content_calendars",
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
        sa.Column(
            "status",
            sa.String(30),
            server_default="awaiting_approval",
            nullable=False,
        ),
        sa.Column(
            "pillars",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="[]",
            nullable=False,
        ),
        sa.Column(
            "weekly_themes",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="[]",
            nullable=False,
        ),
        sa.Column(
            "format_distribution",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="{}",
            nullable=False,
        ),
        sa.Column(
            "day_briefs",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="[]",
            nullable=False,
        ),
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
            "status IN ('not_started', 'researching', 'strategizing', 'awaiting_approval', 'generating', 'qa', 'ready', 'approved', 'revision_requested')",
            name="check_content_calendar_status",
        ),
    )
    op.create_index(
        "ix_content_calendars_business_id",
        "content_calendars",
        ["business_id"],
        unique=True,
    )

    # 2. research_reports
    op.create_table(
        "research_reports",
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
        sa.Column(
            "competitors",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="[]",
            nullable=False,
        ),
        sa.Column(
            "how_to_be_better",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="[]",
            nullable=False,
        ),
        sa.Column(
            "hashtags",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="{}",
            nullable=False,
        ),
        sa.Column(
            "confidence",
            sa.Float(),
            server_default="0.8",
            nullable=False,
        ),
        sa.Column(
            "source_urls",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="[]",
            nullable=False,
        ),
        sa.Column("researched_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_research_reports_business_id",
        "research_reports",
        ["business_id"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_research_reports_business_id", table_name="research_reports")
    op.drop_table("research_reports")
    op.drop_index("ix_content_calendars_business_id", table_name="content_calendars")
    op.drop_table("content_calendars")
