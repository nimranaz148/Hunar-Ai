"""mentor_availability

Revision ID: 0011_mentor_availability
Revises: 0010_bookings_and_payments_sim
Create Date: 2026-10-06 22:50:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0011_mentor_availability"
down_revision: str | None = "0010_bookings_and_payments_sim"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Create mentor_availability table
    op.create_table(
        "mentor_availability",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.func.gen_random_uuid(),
        ),
        sa.Column(
            "mentor_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("mentor_profiles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("weekday", sa.Integer(), nullable=False),
        sa.Column("start_time", sa.String(5), nullable=False),
        sa.Column("end_time", sa.String(5), nullable=False),
        sa.Column("is_available", sa.Boolean(), server_default="true", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "weekday >= 0 AND weekday <= 6",
            name="check_mentor_availability_weekday",
        ),
    )

    # 2. Create indices
    op.create_index(
        "ix_mentor_availability_mentor_id",
        "mentor_availability",
        ["mentor_id"],
    )
    op.create_index(
        "ix_mentor_availability_weekday",
        "mentor_availability",
        ["weekday"],
    )


def downgrade() -> None:
    op.drop_index("ix_mentor_availability_weekday", table_name="mentor_availability")
    op.drop_index("ix_mentor_availability_mentor_id", table_name="mentor_availability")
    op.drop_table("mentor_availability")
