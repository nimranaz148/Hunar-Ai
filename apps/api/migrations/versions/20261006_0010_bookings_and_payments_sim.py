"""bookings_and_payments_sim

Revision ID: 0010_bookings_and_payments_sim
Revises: 0009_mentor_profiles_and_services
Create Date: 2026-10-06 01:45:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0010_bookings_and_payments_sim"
down_revision: str | None = "0009_mentor_profiles_and_services"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Create bookings table
    op.create_table(
        "bookings",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.func.gen_random_uuid(),
        ),
        sa.Column(
            "service_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("mentor_services.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "mentor_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("mentor_profiles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "entrepreneur_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("status", sa.String(50), server_default="requested", nullable=False),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("session_notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "status IN ('requested', 'accepted', 'declined', 'scheduled', 'completed', 'cancelled', 'reviewed')",
            name="check_booking_status",
        ),
    )
    op.create_index(
        "ix_bookings_service_id",
        "bookings",
        ["service_id"],
    )
    op.create_index(
        "ix_bookings_mentor_id",
        "bookings",
        ["mentor_id"],
    )
    op.create_index(
        "ix_bookings_entrepreneur_id",
        "bookings",
        ["entrepreneur_id"],
    )
    op.create_index(
        "ix_bookings_status",
        "bookings",
        ["status"],
    )

    # 2. Create payments_sim table
    op.create_table(
        "payments_sim",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.func.gen_random_uuid(),
        ),
        sa.Column(
            "booking_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("bookings.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("amount_pkr", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(50), server_default="held", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "status IN ('held', 'released', 'refunded')",
            name="check_payment_sim_status",
        ),
        sa.CheckConstraint(
            "amount_pkr > 0",
            name="check_payment_sim_amount",
        ),
    )
    op.create_index(
        "ix_payments_sim_booking_id",
        "payments_sim",
        ["booking_id"],
        unique=True,
    )
    op.create_index(
        "ix_payments_sim_status",
        "payments_sim",
        ["status"],
    )


def downgrade() -> None:
    op.drop_table("payments_sim")
    op.drop_table("bookings")
