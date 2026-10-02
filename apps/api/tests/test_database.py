"""Unit and schema tests for database models and migration definitions."""

from alembic.config import Config
from alembic.script import ScriptDirectory

from app.core.config import settings
from app.models import Base


def test_models_metadata_has_all_phase0_tables() -> None:
    """Verify all 6 core Phase 0 tables are registered in SQLAlchemy metadata."""
    expected_tables = {
        "programs",
        "users",
        "refresh_tokens",
        "audit_logs",
        "agent_runs",
        "agent_steps",
        "settings",
        "businesses",
        "products",
        "onboarding_messages",
    }
    registered_tables = set(Base.metadata.tables.keys())
    assert expected_tables.issubset(registered_tables)


def test_users_table_constraints() -> None:
    """Verify users table constraints: role check, status check, unique email."""
    users_table = Base.metadata.tables["users"]

    # Unique email
    assert users_table.columns["email"].unique is True

    # Check constraints
    check_constraints = {
        c.name: str(c.sqltext) for c in users_table.constraints if hasattr(c, "sqltext")
    }
    assert "check_user_role" in check_constraints
    assert "entrepreneur" in check_constraints["check_user_role"]
    assert "mentor" in check_constraints["check_user_role"]
    assert "super_admin" in check_constraints["check_user_role"]

    assert "check_user_status" in check_constraints
    assert "pending" in check_constraints["check_user_status"]
    assert "active" in check_constraints["check_user_status"]
    assert "suspended" in check_constraints["check_user_status"]


def test_audit_logs_table_structure() -> None:
    """Verify audit_logs table uses BigInteger autoincrement primary key."""
    audit_table = Base.metadata.tables["audit_logs"]
    id_col = audit_table.columns["id"]
    assert id_col.primary_key is True
    assert str(id_col.type) == "BIGINT"


def test_agent_steps_table_structure() -> None:
    """Verify agent_steps table has span_type check constraint and BigInteger PK."""
    steps_table = Base.metadata.tables["agent_steps"]
    id_col = steps_table.columns["id"]
    assert id_col.primary_key is True
    assert str(id_col.type) == "BIGINT"

    check_constraints = {
        c.name: str(c.sqltext) for c in steps_table.constraints if hasattr(c, "sqltext")
    }
    assert "check_agent_step_span_type" in check_constraints
    assert "guardrail" in check_constraints["check_agent_step_span_type"]


def test_alembic_migration_tree() -> None:
    """Verify Alembic script directory recognizes head revision."""
    from pathlib import Path

    base_dir = Path(__file__).resolve().parent.parent
    ini_path = base_dir / "alembic.ini"
    alembic_cfg = Config(str(ini_path))
    alembic_cfg.set_main_option("script_location", str(base_dir / "migrations"))
    script = ScriptDirectory.from_config(alembic_cfg)
    head_rev = script.get_current_head()
    assert head_rev == "0008_content_items"


def test_database_url_normalization() -> None:
    """Verify settings properties produce valid async and sync URLs."""
    assert "+asyncpg" in settings.async_database_url
    assert "+psycopg" in settings.sync_database_url
