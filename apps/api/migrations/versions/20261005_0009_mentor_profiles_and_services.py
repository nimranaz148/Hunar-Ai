"""mentor_profiles_and_services

Revision ID: 0009_mentor_profiles_and_services
Revises: 0008_content_items
Create Date: 2026-10-05 19:10:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0009_mentor_profiles_and_services"
down_revision: str | None = "0008_content_items"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Create mentor_profiles table
    op.create_table(
        "mentor_profiles",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.func.gen_random_uuid(),
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column(
            "niches",
            postgresql.ARRAY(sa.String(50)),
            server_default="{}",
            nullable=False,
        ),
        sa.Column(
            "languages",
            postgresql.ARRAY(sa.String(20)),
            server_default="{}",
            nullable=False,
        ),
        sa.Column("city", sa.String(100), nullable=False),
        sa.Column("bio", sa.Text(), nullable=False),
        sa.Column("avatar_url", sa.String(500), nullable=True),
        sa.Column("rating", sa.Float(), server_default="0.0", nullable=False),
        sa.Column("review_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("status", sa.String(50), server_default="active", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "status IN ('pending', 'active', 'declined')",
            name="check_mentor_profile_status",
        ),
    )
    op.create_index(
        "ix_mentor_profiles_user_id",
        "mentor_profiles",
        ["user_id"],
        unique=True,
    )
    op.create_index(
        "ix_mentor_profiles_status",
        "mentor_profiles",
        ["status"],
    )

    # 2. Create mentor_services table
    op.create_table(
        "mentor_services",
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
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("niche", sa.String(50), nullable=False),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("price_pkr", sa.Integer(), nullable=False),
        sa.Column("duration_min", sa.Integer(), server_default="60", nullable=False),
        sa.Column("active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "type IN ('session', 'review', 'done_with_you', 'package')",
            name="check_mentor_service_type",
        ),
        sa.CheckConstraint(
            "price_pkr > 0",
            name="check_mentor_service_price",
        ),
        sa.CheckConstraint(
            "duration_min >= 15 AND duration_min <= 180",
            name="check_mentor_service_duration",
        ),
    )
    op.create_index(
        "ix_mentor_services_mentor_id",
        "mentor_services",
        ["mentor_id"],
    )
    op.create_index(
        "ix_mentor_services_niche",
        "mentor_services",
        ["niche"],
    )
    op.create_index(
        "ix_mentor_services_type",
        "mentor_services",
        ["type"],
    )
    op.create_index(
        "ix_mentor_services_active",
        "mentor_services",
        ["active"],
    )


def downgrade() -> None:
    op.drop_table("mentor_services")
    op.drop_table("mentor_profiles")
