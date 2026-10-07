"""reviews_table

Revision ID: 0012_reviews_table
Revises: 0011_mentor_availability
Create Date: 2026-10-07 21:40:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0012_reviews_table"
down_revision: str | None = "0011_mentor_availability"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Create reviews table
    op.create_table(
        "reviews",
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
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "rating >= 1 AND rating <= 5",
            name="check_review_rating",
        ),
    )
    op.create_index(
        "ix_reviews_booking_id",
        "reviews",
        ["booking_id"],
        unique=True,
    )
    op.create_index(
        "ix_reviews_mentor_id",
        "reviews",
        ["mentor_id"],
    )
    op.create_index(
        "ix_reviews_entrepreneur_id",
        "reviews",
        ["entrepreneur_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_reviews_entrepreneur_id", table_name="reviews")
    op.drop_index("ix_reviews_mentor_id", table_name="reviews")
    op.drop_index("ix_reviews_booking_id", table_name="reviews")
    op.drop_table("reviews")
