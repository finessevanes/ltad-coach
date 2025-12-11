import os
import json
import base64
import firebase_admin
from firebase_admin import credentials
from typing import Optional
from app.core.config import settings


_firebase_app: Optional[firebase_admin.App] = None


def initialize_firebase() -> firebase_admin.App:
    """
    Initialize Firebase Admin SDK (singleton pattern)
    Works in multiple environments:
    - Cloud Run: Uses Application Default Credentials (automatic)
    - Heroku: Uses environment variables
    - Local: Uses service account file
    """
    global _firebase_app

    if _firebase_app is not None:
        return _firebase_app

    cred = None

    # Check if running on Cloud Run (K_SERVICE env var is set by Cloud Run)
    is_cloud_run = os.getenv("K_SERVICE") is not None

    if is_cloud_run:
        # Cloud Run - use Application Default Credentials (ADC)
        # This automatically uses the service account attached to the Cloud Run service
        # No need for JSON files or environment variables
        cred = credentials.ApplicationDefault()

    elif settings.environment == "production":
        # Production (Heroku or other) - use environment variables
        # Option 1: Base64 encoded JSON (if provided)
        if settings.google_application_credentials_json:
            try:
                cred_json = base64.b64decode(settings.google_application_credentials_json)
                cred_dict = json.loads(cred_json)
                cred = credentials.Certificate(cred_dict)
            except Exception as e:
                raise ValueError(f"Failed to decode GOOGLE_APPLICATION_CREDENTIALS_JSON: {e}")

        # Option 2: Individual environment variables
        elif settings.firebase_project_id:
            cred_dict = {
                "type": "service_account",
                "project_id": settings.firebase_project_id,
                "private_key_id": settings.firebase_private_key_id,
                "private_key": settings.firebase_private_key.replace("\\n", "\n") if settings.firebase_private_key else None,
                "client_email": settings.firebase_client_email,
                "client_id": settings.firebase_client_id,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_x509_cert_url": settings.firebase_client_cert_url
            }
            cred = credentials.Certificate(cred_dict)
        else:
            raise ValueError(
                "Production environment requires either GOOGLE_APPLICATION_CREDENTIALS_JSON "
                "or individual Firebase environment variables (FIREBASE_PROJECT_ID, etc.)"
            )
    else:
        # Local development - use service account file
        if not settings.google_application_credentials:
            raise ValueError("GOOGLE_APPLICATION_CREDENTIALS is required for local development")

        creds_path = settings.google_application_credentials

        if not os.path.exists(creds_path):
            raise ValueError(f"Firebase credentials file not found: {creds_path}")

        cred = credentials.Certificate(creds_path)

    # Initialize with service account credentials and storage bucket
    _firebase_app = firebase_admin.initialize_app(cred, {
        'storageBucket': settings.firebase_storage_bucket
    })

    return _firebase_app


def get_firebase_app() -> firebase_admin.App:
    """Get initialized Firebase app instance"""
    if _firebase_app is None:
        raise RuntimeError("Firebase not initialized. Call initialize_firebase() first.")
    return _firebase_app
