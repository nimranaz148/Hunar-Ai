"""metrics_snapshots

Revision ID: 0013_metrics_snapshots
Revises: 0012_reviews_table
Create Date: 2026-10-07 23:30:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0013_metrics_snapshots"
down_revision: str | None = "0012_reviews_table"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "metrics_snapshots",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.func.gen_random_uuid(),
            nullable=False,
        ),
        sa.Column(
            "business_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("businesses.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "content_item_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("content_items.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("platform", sa.String(length=30), nullable=False),
        sa.Column("period_start", sa.Date(), nullable=False),
        sa.Column("period_end", sa.Date(), nullable=False),
        sa.Column("views", sa.Integer(), server_default="0", nullable=False),
        sa.Column("reach", sa.Integer(), server_default="0", nullable=False),
        sa.Column("likes", sa.Integer(), server_default="0", nullable=False),
        sa.Column("comments", sa.Integer(), server_default="0", nullable=False),
        sa.Column("shares", sa.Integer(), server_default="0", nullable=False),
        sa.Column("saves", sa.Integer(), server_default="0", nullable=False),
        sa.Column("follower_delta", sa.Integer(), server_default="0", nullable=False),
        sa.Column("inquiries", sa.Integer(), server_default="0", nullable=False),
        sa.Column("orders", sa.Integer(), server_default="0", nullable=False),
        sa.Column("revenue_pkr", sa.Integer(), server_default="0", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_metrics_snapshots_business_id",
        "metrics_snapshots",
        ["business_id"],
    )
    op.create_index(
        "ix_metrics_snapshots_content_item_id",
        "metrics_snapshots",
        ["content_item_id"],
    )
    op.create_index(
        "ix_metrics_snapshots_business_platform",
        "metrics_snapshots",
        ["business_id", "platform"],
    )
    op.create_index(
        "ix_metrics_snapshots_business_period",
        "metrics_snapshots",
        ["business_id", "period_start", "period_end"],
    )


def downgrade() -> None:
    op.drop_index("ix_metrics_snapshots_business_period", table_name="metrics_snapshots")
    op.drop_index("ix_metrics_snapshots_business_platform", table_name="metrics_snapshots")
    op.drop_index("ix_metrics_snapshots_content_item_id", table_name="metrics_snapshots")
    op.drop_index("ix_metrics_snapshots_business_id", table_name="metrics_snapshots")
    op.drop_table("metrics_snapshots")
