"""Configuration settings and limits for the agent framework."""

from dataclasses import dataclass

from app.core.config import settings

PLACEHOLDER_KEYS = ("", "missing-key-for-test", "test-key-not-for-live")


@dataclass
class AgentConfig:
    """Agent runtime configuration and safety thresholds."""

    max_concurrent: int = 5
    per_user_daily_limit: int = 5
    kill_switch: bool = False
    gemini_base_url: str = "https://generativelanguage.googleapis.com/v1beta/openai/"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    @property
    def gemini_model_name(self) -> str:
        return settings.GEMINI_MODEL

    @property
    def openrouter_model_name(self) -> str:
        return settings.OPENROUTER_MODEL

    @property
    def gemini_api_key(self) -> str:
        return settings.GEMINI_API_KEY

    @property
    def openrouter_api_key(self) -> str:
        return settings.OPENROUTER_API_KEY

    @property
    def api_key(self) -> str:
        """Key of the first live provider (OpenRouter, then Gemini); empty when none is set.

        Agents gate on this value to decide between a live LLM call and their rule-based
        fallback, so any configured provider enables AI for every agent.
        """
        return self.openrouter_api_key or self.gemini_api_key


agent_config = AgentConfig()
