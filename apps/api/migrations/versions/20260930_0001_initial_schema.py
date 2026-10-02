"""initial_schema

Revision ID: 0001_initial_schema
Revises: None
Create Date: 2026-09-30 19:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0001_initial_schema"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. programs table
    op.create_table(
        "programs",
        sa.Column(
            "id",
            sa.UUID(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("invite_code", sa.String(length=50), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_programs_invite_code", "programs", ["invite_code"], unique=True)

    # 2. users table
    op.create_table(
        "users",
        sa.Column(
            "id",
            sa.UUID(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=50), server_default="active", nullable=False),
        sa.Column("program_id", sa.UUID(), nullable=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("language", sa.String(length=20), server_default="roman_ur", nullable=False),
        sa.Column("created_by", sa.UUID(), nullable=True),
        sa.Column("force_password_change", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("failed_login_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("locked_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "role IN ('entrepreneur', 'mentor', 'super_admin')",
            name="check_user_role",
        ),
        sa.CheckConstraint(
            "status IN ('pending', 'active', 'suspended')",
            name="check_user_status",
        ),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["program_id"], ["programs.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_program_id", "users", ["program_id"], unique=False)
    op.create_index("ix_users_role_status", "users", ["role", "status"], unique=False)

    # 3. refresh_tokens table
    op.create_table(
        "refresh_tokens",
        sa.Column(
            "id",
            sa.UUID(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("token_hash", sa.Text(), nullable=False),
        sa.Column("family_id", sa.UUID(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("replaced_by", sa.UUID(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["replaced_by"], ["refresh_tokens.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_refresh_tokens_family_id",
        "refresh_tokens",
        ["family_id"],
        unique=False,
    )
    op.create_index(
        "ix_refresh_tokens_token_hash",
        "refresh_tokens",
        ["token_hash"],
        unique=False,
    )
    op.create_index(
        "ix_refresh_tokens_user_id",
        "refresh_tokens",
        ["user_id"],
        unique=False,
    )

    # 4. audit_logs table
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column(
            "at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("request_id", sa.UUID(), nullable=True),
        sa.Column("actor_id", sa.UUID(), nullable=True),
        sa.Column("actor_role", sa.String(length=50), nullable=True),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("target_type", sa.String(length=100), nullable=True),
        sa.Column("target_id", sa.Text(), nullable=True),
        sa.Column("program_id", sa.UUID(), nullable=True),
        sa.Column("ip", postgresql.INET(), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("before", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("after", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "meta",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default="{}",
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["actor_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audit_logs_action_at", "audit_logs", ["action", "at"], unique=False)
    op.create_index("ix_audit_logs_actor_id_at", "audit_logs", ["actor_id", "at"], unique=False)
    op.create_index("ix_audit_logs_at", "audit_logs", ["at"], unique=False)

    # 4b. audit_logs_immutable() trigger preventing UPDATE and DELETE
    op.execute(
        """
        CREATE OR REPLACE FUNCTION audit_logs_immutable()
        RETURNS TRIGGER AS $$
        BEGIN
            RAISE EXCEPTION 'audit_logs rows are append-only and cannot be updated or deleted';
        END;
        $$ LANGUAGE plpgsql;
        """
    )
    op.execute(
        """
        CREATE TRIGGER audit_logs_immutable_trigger
        BEFORE UPDATE OR DELETE ON audit_logs
        FOR EACH ROW EXECUTE FUNCTION audit_logs_immutable();
        """
    )

    # 5. agent_runs table
    op.create_table(
        "agent_runs",
        sa.Column(
            "id",
            sa.UUID(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("trace_id", sa.String(length=100), nullable=True),
        sa.Column("workflow", sa.String(length=100), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=True),
        sa.Column("business_id", sa.UUID(), nullable=True),
        sa.Column("status", sa.String(length=50), server_default="queued", nullable=False),
        sa.Column("input_summary", sa.Text(), nullable=True),
        sa.Column("output_summary", sa.Text(), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "status IN ('queued', 'running', 'awaiting_approval', 'succeeded', "
            "'failed', 'blocked')",
            name="check_agent_run_status",
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_agent_runs_trace_id", "agent_runs", ["trace_id"], unique=True)
    op.create_index("ix_agent_runs_user_id", "agent_runs", ["user_id"], unique=False)
    op.create_index(
        "ix_agent_runs_workflow_status",
        "agent_runs",
        ["workflow", "status"],
        unique=False,
    )

    # 6. agent_steps table
    op.create_table(
        "agent_steps",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("trace_id", sa.String(length=100), nullable=False),
        sa.Column("span_id", sa.String(length=100), nullable=False),
        sa.Column("parent_id", sa.String(length=100), nullable=True),
        sa.Column("span_type", sa.String(length=50), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("data", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("error", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.CheckConstraint(
            "span_type IN ('agent', 'generation', 'function', 'handoff', 'guardrail', 'custom')",
            name="check_agent_step_span_type",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_agent_steps_span_id", "agent_steps", ["span_id"], unique=True)
    op.create_index("ix_agent_steps_trace_id", "agent_steps", ["trace_id"], unique=False)


def downgrade() -> None:
    # Drop trigger and function
    op.execute("DROP TRIGGER IF EXISTS audit_logs_immutable_trigger ON audit_logs;")
    op.execute("DROP FUNCTION IF EXISTS audit_logs_immutable();")

    op.drop_table("agent_steps")
    op.drop_table("agent_runs")
    op.drop_table("audit_logs")
    op.drop_table("refresh_tokens")
    op.drop_table("users")
    op.drop_table("programs")
