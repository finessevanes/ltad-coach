"""Application configuration using Pydantic Settings."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Frontend URL for CORS and email links
    frontend_url: str

    # API Base URL (this backend's own URL)
    api_base_url: str = "http://localhost:8000"

    # Firebase Configuration
    google_application_credentials: str
    firebase_project_id: str
    firebase_storage_bucket: str

    # OpenRouter API (Claude access)
    openrouter_api_key: str
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

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
