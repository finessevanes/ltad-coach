COMPLETED

---
id: BE-002
depends_on: [BE-001]
blocks: [BE-004, BE-005, BE-006]
---

# BE-002: Firebase Admin SDK Configuration

## Scope

**In Scope:**
- Install Firebase Admin SDK
- Create Firebase initialization module
- Configure Firebase credentials loading
- Verify connection to Firebase project

**Out of Scope:**
- Firestore-specific operations (BE-004)
- Storage-specific operations (BE-005)
- Auth middleware (BE-006)
- Firebase project creation (assumed to exist)

## Technical Decisions

- **SDK**: Firebase Admin SDK for Python
- **Credentials**: Service account JSON key (loaded via environment variable)
- **Initialization**: Singleton pattern to prevent multiple initializations
- **Configuration Location**: `app/core/firebase.py`

## Acceptance Criteria

- [ ] `firebase-admin` added to requirements.txt
- [ ] Firebase app initializes successfully on server startup
- [ ] Service account credentials load from environment variable
- [ ] Graceful error handling if credentials are missing
- [ ] Firebase connection verified via test endpoint
- [ ] No credentials committed to git

## Files to Create/Modify

- `app/core/firebase.py` (create)
- `requirements.txt` (modify - add firebase-admin)
- `.env.example` (modify - add Firebase vars)
- `.gitignore` (modify - ensure *.json excluded)

## Implementation Notes

**app/core/firebase.py**:
```python
import os
import json
import firebase_admin
from firebase_admin import credentials
from typing import Optional

_firebase_app: Optional[firebase_admin.App] = None

def initialize_firebase() -> firebase_admin.App:
    """Initialize Firebase Admin SDK (singleton pattern)"""
    global _firebase_app

    if _firebase_app is not None:
        return _firebase_app

    # Load credentials from environment
    firebase_creds = os.getenv("FIREBASE_CREDENTIALS_JSON")

    if not firebase_creds:
        raise ValueError("FIREBASE_CREDENTIALS_JSON environment variable not set")

    # Parse JSON credentials
    creds_dict = json.loads(firebase_creds)
    cred = credentials.Certificate(creds_dict)

    # Initialize app
    _firebase_app = firebase_admin.initialize_app(cred)

    return _firebase_app

def get_firebase_app() -> firebase_admin.App:
    """Get initialized Firebase app instance"""
    if _firebase_app is None:
        raise RuntimeError("Firebase not initialized. Call initialize_firebase() first.")
    return _firebase_app
```

**app/main.py** (add to startup):
```python
from app.core.firebase import initialize_firebase

@app.on_event("startup")
async def startup_event():
    try:
        initialize_firebase()
        print("✓ Firebase Admin SDK initialized")
    except Exception as e:
        print(f"✗ Firebase initialization failed: {e}")
        # Don't crash server, but log the error
```

**.env.example** (add):
```
FIREBASE_CREDENTIALS_JSON={"type":"service_account","project_id":"your-project",...}
```

**requirements.txt** (add):
```
firebase-admin==6.3.0
```

## Testing

1. Create a Firebase project at https://console.firebase.google.com
2. Generate service account key (Project Settings → Service Accounts → Generate new private key)
3. Copy JSON content
4. Create `.env` file:
   ```
   FIREBASE_CREDENTIALS_JSON='{"type":"service_account",...}'
   ```
5. Run server - should see "✓ Firebase Admin SDK initialized" in console

## Estimated Complexity

**Size**: S (Small - ~1.5 hours)

## Notes

- Store service account JSON as environment variable (not as file) for easier deployment to Heroku
- For local development, can use `.env` file with full JSON
- Never commit actual credentials
- Firebase project must be created manually before this PR
