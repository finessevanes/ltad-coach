"""Application configuration using Pydantic Settings."""

from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Frontend URL for CORS and email links
    frontend_url: str

    # API Base URL (this backend's own URL)
    api_base_url: str = "http://localhost:8000"

    # Firebase Configuration
    # Option 1: Path to service account JSON file (local dev)
    google_application_credentials: Optional[str] = None
    # Option 2: Inline JSON string (for Render deployment)
    firebase_service_account_json: Optional[str] = None
    firebase_project_id: str
    firebase_storage_bucket: str

    # Anthropic API (Direct Claude access)
    anthropic_api_key: Optional[str] = None

    # OpenRouter API (Alternative to direct Anthropic)
    openrouter_api_key: Optional[str] = None
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    # Claude Model IDs (Direct Anthropic API)
    haiku_model: str = "claude-3-haiku-20240307"
    sonnet_model: str = "claude-3-haiku-20240307"  # Using Haiku temporarily until Sonnet access enabled

    # OpenAI API (for Chat Assistant)
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4o"

    # Email Service (Resend)
    resend_api_key: str

    # CORS Configuration
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins(self) -> list[str]:
        """Parse ALLOWED_ORIGINS into a list of origins."""
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
