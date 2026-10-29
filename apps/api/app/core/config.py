"""Application configuration settings using Pydantic Settings."""

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://hunar:hunar_dev@localhost:5432/hunar",
        description="Async database connection string",
    )

    # Authentication
    JWT_SECRET: str = Field(
        default="change-me-in-production-min-32-chars",
        description="JWT secret key",
    )
    JWT_ALGORITHM: str = Field(default="HS256", description="JWT signing algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=15,
        description="Access token lifespan in minutes",
    )
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, description="Refresh token lifespan in days")

    # External APIs
    OPENROUTER_API_KEY: str = Field(
        default="", description="OpenRouter API key (primary LLM provider when set)"
    )
    OPENROUTER_MODEL: str = Field(
        default="openrouter/free",
        description="OpenRouter model id, e.g. google/gemini-2.5-flash once credits are added",
    )
    GEMINI_API_KEY: str = Field(
        default="", description="Google Gemini API key (fallback provider)"
    )
    GEMINI_MODEL: str = Field(default="gemini-3.1-flash-lite", description="Gemini model name")
    TAVILY_API_KEY: str = Field(default="", description="Tavily search API key")

    # Super Admin (seed)
    SUPER_ADMIN_EMAIL: str = Field(default="", description="Initial super admin email")
    SUPER_ADMIN_PASSWORD: str = Field(default="", description="Initial super admin password")

    # Application
    ENVIRONMENT: str = Field(default="development", description="Application environment")
    CORS_ORIGINS: str = Field(
        default="http://localhost:3000",
        description="Comma-separated CORS origins",
    )
    API_PORT: int = Field(default=8000, description="API port")

    @property
    def cors_origin_list(self) -> list[str]:
        """Return CORS origins as a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def async_database_url(self) -> str:
        """Ensure URL uses an async dialect (asyncpg) for SQLAlchemy AsyncEngine."""
        url = self.DATABASE_URL
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+asyncpg://", 1)
        if url.startswith("postgresql+psycopg://"):
            return url.replace("postgresql+psycopg://", "postgresql+asyncpg://", 1)
        return url

    @property
    def sync_database_url(self) -> str:
        """Return sync database URL for Alembic or sync drivers."""
        url = self.DATABASE_URL
        if url.startswith("postgresql+asyncpg://"):
            return url.replace("postgresql+asyncpg://", "postgresql+psycopg://", 1)
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+psycopg://", 1)
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url


settings = Settings()
