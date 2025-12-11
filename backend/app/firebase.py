"""Firebase Admin SDK initialization."""

import json
import firebase_admin
from firebase_admin import credentials, firestore, storage
from app.config import get_settings

# Module-level singleton instances
_app = None
_db = None
_bucket = None


def init_firebase() -> None:
    """Initialize Firebase Admin SDK.

    Supports two modes:
    1. Local dev: Uses GOOGLE_APPLICATION_CREDENTIALS file path
    2. Production: Uses FIREBASE_SERVICE_ACCOUNT_JSON inline JSON string
    """
    global _app, _db, _bucket

    if firebase_admin._apps:
        # Already initialized, just update our references
        _db = firestore.client()
        _bucket = storage.bucket()
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

    _app = firebase_admin.initialize_app(cred, {
        'storageBucket': settings.firebase_storage_bucket
    })
    _db = firestore.client()
    _bucket = storage.bucket()


def get_db():
    """Get Firestore client instance.

    Returns:
        google.cloud.firestore.Client: Firestore client

    Raises:
        RuntimeError: If Firebase not initialized
    """
    if _db is None:
        raise RuntimeError("Firebase not initialized. Call init_firebase() first.")
    return _db


def get_bucket():
    """Get Firebase Storage bucket instance.

    Returns:
        google.cloud.storage.Bucket: Storage bucket

    Raises:
        RuntimeError: If Firebase not initialized
    """
    if _bucket is None:
        raise RuntimeError("Firebase not initialized. Call init_firebase() first.")
    return _bucket


def verify_connection() -> dict:
    """Verify Firebase connections are working.

    Returns:
        dict: Status of firestore and storage connections
    """
    status = {"firestore": False, "storage": False}

    try:
        # Verify Firestore - list collections to confirm connectivity
        db = get_db()
        list(db.collections())
        status["firestore"] = True
    except Exception:
        pass

    try:
        # Verify Storage - check bucket exists
        bucket = get_bucket()
        bucket.exists()
        status["storage"] = True
    except Exception:
        pass

    return status
