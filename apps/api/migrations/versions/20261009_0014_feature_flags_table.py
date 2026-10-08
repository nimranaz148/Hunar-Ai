"""feature_flags_table

Revision ID: 0014_feature_flags_table
Revises: 0013_metrics_snapshots
Create Date: 2026-10-09 03:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0014_feature_flags_table"
down_revision: str | None = "0013_metrics_snapshots"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    feature_flags_table = op.create_table(
        "feature_flags",
        sa.Column("key", sa.String(100), primary_key=True, nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("is_enabled", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )

    # Seed default system feature flags (PRD §12.1, §13.2 line 1079, §26)
    op.bulk_insert(
        feature_flags_table,
        [
            {
                "key": "weekly_coach_agent",
                "name": "Weekly AI Coach",
                "description": "Enables AI-driven weekly marketing diagnostics and content adjustment proposals (Human Gate 3).",
                "is_enabled": True,
                "updated_by": None,
            },
            {
                "key": "mentor_marketplace",
                "name": "Mentor Marketplace",
                "description": "Enables browsing, booking, and reviews for mentor pro sessions.",
                "is_enabled": True,
                "updated_by": None,
            },
            {
                "key": "meta_connect",
                "name": "Meta / Social Auto-Publish",
                "description": "Enables direct API integration for automatic posting to Instagram and Facebook.",
                "is_enabled": False,
                "updated_by": None,
            },
            {
                "key": "vision_metrics",
                "name": "Vision Metric Extraction",
                "description": "Enables screenshot OCR/vision extraction for marketing performance metrics.",
                "is_enabled": False,
                "updated_by": None,
            },
            {
                "key": "user_registration",
                "name": "Public User Registration",
                "description": "Allows new entrepreneurs to self-register on the platform.",
                "is_enabled": True,
                "updated_by": None,
            },
        ],
    )


def downgrade() -> None:
    op.drop_table("feature_flags")
