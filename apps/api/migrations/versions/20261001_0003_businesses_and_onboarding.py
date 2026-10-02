"""businesses_and_onboarding

Revision ID: 0003_businesses_and_onboarding
Revises: 0002_settings_table
Create Date: 2026-10-01 16:30:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0003_businesses_and_onboarding"
down_revision: str | None = "0002_settings_table"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Create businesses table
    op.create_table(
        "businesses",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.func.gen_random_uuid(),
        ),
        sa.Column(
            "owner_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column(
            "program_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("programs.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("niche", sa.String(50), nullable=False),
        sa.Column("city", sa.String(100), nullable=False),
        sa.Column("area", sa.String(100), nullable=True),
        sa.Column("budget_pkr", sa.Integer(), nullable=False),
        sa.Column("hours_per_week", sa.Integer(), nullable=False),
        sa.Column("tone", sa.String(50), server_default="friendly", nullable=False),
        sa.Column("languages", postgresql.ARRAY(sa.String(20)), nullable=False),
        sa.Column("platforms", postgresql.ARRAY(sa.String(50)), nullable=False),
        sa.Column("target_customer", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_businesses_owner_id", "businesses", ["owner_id"], unique=True)
    op.create_index("ix_businesses_program_id", "businesses", ["program_id"])

    # 2. Create products table
    op.create_table(
        "products",
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
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "cost_inputs",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="[]",
            nullable=False,
        ),
        sa.Column("price_pkr", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_products_business_id", "products", ["business_id"])

    # 3. Create onboarding_messages table
    op.create_table(
        "onboarding_messages",
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
        ),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column(
            "meta",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="{}",
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint(
            "role IN ('user', 'assistant', 'system')",
            name="check_onboarding_message_role",
        ),
    )
    op.create_index(
        "ix_onboarding_messages_user_id_created_at",
        "onboarding_messages",
        ["user_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_table("onboarding_messages")
    op.drop_table("products")
    op.drop_table("businesses")
