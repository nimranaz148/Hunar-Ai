"""content_items

Revision ID: 0008_content_items
Revises: 0007_content_calendars_and_research
Create Date: 2026-10-02 20:15:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0008_content_items"
down_revision: str | None = "0007_content_calendars_and_research"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "content_items",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.func.gen_random_uuid(),
        ),
        sa.Column(
            "calendar_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("content_calendars.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("day", sa.Integer(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column(
            "platform",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="[]",
            nullable=False,
        ),
        sa.Column("format", sa.String(30), nullable=False),
        sa.Column("pillar", sa.String(50), nullable=False),
        sa.Column("goal", sa.String(50), nullable=False),
        sa.Column("hook", sa.Text(), nullable=False),
        sa.Column("caption", sa.Text(), nullable=False),
        sa.Column("cta", sa.Text(), nullable=False),
        sa.Column(
            "hashtags",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="[]",
            nullable=False,
        ),
        sa.Column("best_time_hint", sa.String(100), nullable=True),
        sa.Column(
            "image_prompt",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="{}",
            nullable=False,
        ),
        sa.Column(
            "video_prompt",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
        sa.Column("alt_text", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.String(30),
            server_default="draft",
            nullable=False,
        ),
        sa.Column("posted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("post_url", sa.String(500), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "status IN ('draft', 'approved', 'posted', 'skipped', 'needs_review')",
            name="check_content_item_status",
        ),
    )
    op.create_index(
        "ix_content_items_calendar_id_day",
        "content_items",
        ["calendar_id", "day"],
        unique=True,
    )
    op.create_index(
        "ix_content_items_status",
        "content_items",
        ["status"],
    )


def downgrade() -> None:
    op.drop_index("ix_content_items_status", table_name="content_items")
    op.drop_index("ix_content_items_calendar_id_day", table_name="content_items")
    op.drop_table("content_items")
