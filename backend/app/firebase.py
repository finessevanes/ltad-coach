"""Firebase Admin SDK initialization."""

import json
import firebase_admin
from firebase_admin import credentials
from app.config import get_settings


def init_firebase() -> None:
    """Initialize Firebase Admin SDK.

    Supports two modes:
    1. Local dev: Uses GOOGLE_APPLICATION_CREDENTIALS file path
    2. Production: Uses FIREBASE_SERVICE_ACCOUNT_JSON inline JSON string
    """
    if firebase_admin._apps:
        # Already initialized
        return

    settings = get_settings()

    # Option 1: Inline JSON (for Render/production)
    if settings.firebase_service_account_json:
        cred_dict = json.loads(settings.firebase_service_account_json)
        cred = credentials.Certificate(cred_dict)
    # Option 2: File path (for local development)
    elif settings.google_application_credentials:
        cred = credentials.Certificate(settings.google_application_credentials)
    else:
        raise ValueError(
            "Either FIREBASE_SERVICE_ACCOUNT_JSON or "
            "GOOGLE_APPLICATION_CREDENTIALS must be set"
        )

    firebase_admin.initialize_app(cred, {
        'storageBucket': settings.firebase_storage_bucket
    })
