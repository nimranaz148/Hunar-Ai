"""Configuration settings and limits for the agent framework."""

from dataclasses import dataclass

from app.core.config import settings


@dataclass
class AgentConfig:
    """Agent runtime configuration and safety thresholds."""

    max_concurrent: int = 5
    per_user_daily_limit: int = 5
    kill_switch: bool = False
    gemini_base_url: str = "https://generativelanguage.googleapis.com/v1beta/openai/"

    @property
    def gemini_model_name(self) -> str:
        return settings.GEMINI_MODEL

    @property
    def api_key(self) -> str:
        return settings.GEMINI_API_KEY


agent_config = AgentConfig()
