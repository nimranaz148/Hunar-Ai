"""validation_reports

Revision ID: 0004_validation_reports
Revises: 0003_businesses_and_onboarding
Create Date: 2026-10-02 00:45:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0004_validation_reports"
down_revision: str | None = "0003_businesses_and_onboarding"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "validation_reports",
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
            postgresql.ARRAY(sa.Text()),
            server_default="{}",
            nullable=False,
        ),
        sa.Column("confidence", sa.String(20), server_default="medium", nullable=False),
        sa.Column("demand_summary", sa.Text(), server_default="", nullable=False),
        sa.Column("pricing_insight", sa.Text(), server_default="", nullable=False),
        sa.Column("reasoning", sa.Text(), server_default="", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "confidence IN ('low', 'medium', 'high')",
            name="check_validation_report_confidence",
        ),
    )
    op.create_index("ix_validation_reports_business_id", "validation_reports", ["business_id"], unique=True)


def downgrade() -> None:
    op.drop_table("validation_reports")
