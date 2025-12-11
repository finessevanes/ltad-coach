from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Environment
    environment: str = "development"
    debug: bool = True

    # Firebase Admin SDK - Local development (JSON file path)
    google_application_credentials: Optional[str] = None
    firebase_storage_bucket: str

    # Firebase Admin SDK - Production (individual env vars for Heroku)
    firebase_project_id: Optional[str] = None
    firebase_private_key_id: Optional[str] = None
    firebase_private_key: Optional[str] = None
    firebase_client_email: Optional[str] = None
    firebase_client_id: Optional[str] = None
    firebase_client_cert_url: Optional[str] = None

    # Alternative: Base64 encoded service account JSON
    google_application_credentials_json: Optional[str] = None

    # OpenRouter API (replaces direct Anthropic API)
    openrouter_api_key: str
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

    # Email Service (Resend)
    resend_api_key: str
    resend_from_email: str = "AI Coach <noreply@aicoach.dev>"

    # URLs
    frontend_url: str = "http://localhost:5173"
    api_base_url: str = "http://localhost:8000"

    # CORS (comma-separated)
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"

    class Config:
        env_file = ".env"
        case_sensitive = False

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse comma-separated CORS origins into list"""
        return [origin.strip() for origin in self.allowed_origins.split(",")]


# Global settings instance
settings = Settings()
