"""settings_table

Revision ID: 0002_settings_table
Revises: 0001_initial_schema
Create Date: 2026-10-01 03:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0002_settings_table"
down_revision: str | None = "0001_initial_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    settings_table = op.create_table(
        "settings",
        sa.Column("key", sa.String(100), primary_key=True, nullable=False),
        sa.Column("value", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # Seed initial configuration settings (F-035)
    op.bulk_insert(
        settings_table,
        [
            {"key": "agent_max_concurrent", "value": 5},
            {"key": "agent_per_user_daily_limit", "value": 5},
            {"key": "agent_kill_switch", "value": False},
            {"key": "rate_limit_per_minute", "value": 100},
        ],
    )


def downgrade() -> None:
    op.drop_table("settings")
