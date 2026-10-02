"""pricing_results

Revision ID: 0005_pricing_results
Revises: 0004_validation_reports
Create Date: 2026-10-02 01:15:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0005_pricing_results"
down_revision: str | None = "0004_validation_reports"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "pricing_results",
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
            "product_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("products.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("product_name", sa.String(200), nullable=False),
        sa.Column(
            "assumptions",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="{}",
            nullable=False,
        ),
        sa.Column("unit_cost", sa.Integer(), nullable=False),
        sa.Column("price", sa.Integer(), nullable=False),
        sa.Column("margin_pct", sa.Float(), nullable=False),
        sa.Column("break_even_units", sa.Integer(), nullable=False),
        sa.Column(
            "risk_flags",
            postgresql.ARRAY(sa.Text()),
            server_default="{}",
            nullable=False,
        ),
        sa.Column("notes", sa.Text(), server_default="", nullable=False),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_pricing_results_business_id", "pricing_results", ["business_id"])
    op.create_index("ix_pricing_results_product_id", "pricing_results", ["product_id"])


def downgrade() -> None:
    op.drop_table("pricing_results")
