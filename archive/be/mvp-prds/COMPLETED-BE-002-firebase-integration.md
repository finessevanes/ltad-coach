---
id: BE-002
depends_on: [BE-001]
blocks: [BE-003, BE-004, BE-005, BE-006, BE-012, BE-013]
---

# BE-002: Firebase Admin SDK Integration

## Title
Integrate Firebase Admin SDK for Firestore and Storage access

## Scope

### In Scope
- Firebase Admin SDK initialization
- Firestore client setup with connection verification
- Firebase Storage client setup
- Base repository pattern for Firestore operations
- Connection health check endpoint

### Out of Scope
- Firebase Auth token validation (BE-003)
- Specific collection schemas (handled in respective PRs)
- Actual CRUD operations on collections

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| SDK | firebase-admin | Official Python SDK for server-side |
| Initialization | Service Account JSON | Secure, supports all Admin features |
| Repository Pattern | Base class with generics | Reusable CRUD operations per collection |

## Acceptance Criteria

- [x] Firebase Admin SDK initializes successfully on app startup
- [x] `GET /health` includes `"firebase": "connected"` status
- [x] Firestore connection is verified (can list collections)
- [x] Storage bucket is accessible (can check bucket exists)
- [x] Base repository class provides typed CRUD operations
- [x] Graceful error handling if Firebase connection fails

## Files to Create/Modify

```
backend/app/
├── main.py                      # Add Firebase init on startup
├── config.py                    # Add Firebase config parsing (modify)
├── firebase/
│   ├── __init__.py
│   ├── client.py               # Firebase Admin initialization
│   └── repository.py           # Base repository class
└── dependencies.py             # FastAPI dependency injection
```

## Implementation Details

### firebase/client.py
```python
import firebase_admin
from firebase_admin import credentials, firestore, storage
from app.config import settings

_app = None
_db = None
_bucket = None

def init_firebase():
    global _app, _db, _bucket

    cred = credentials.Certificate({
        "type": "service_account",
        "project_id": settings.firebase_project_id,
        "private_key": settings.firebase_private_key.replace("\\n", "\n"),
        "client_email": settings.firebase_client_email,
        # Minimal fields needed - add others if required
    })

    _app = firebase_admin.initialize_app(cred, {
        "storageBucket": f"{settings.firebase_project_id}.appspot.com"
    })
    _db = firestore.client()
    _bucket = storage.bucket()

    return _app

def get_db():
    if _db is None:
        raise RuntimeError("Firebase not initialized")
    return _db

def get_bucket():
    if _bucket is None:
        raise RuntimeError("Firebase not initialized")
    return _bucket

def verify_connection() -> dict:
    """Verify Firebase connections are working"""
    status = {"firestore": False, "storage": False}
    try:
        # Verify Firestore
        list(get_db().collections())
        status["firestore"] = True
    except Exception:
        pass
    try:
        # Verify Storage
        get_bucket().exists()
        status["storage"] = True
    except Exception:
        pass
    return status
```

### firebase/repository.py
```python
from typing import TypeVar, Generic, Optional, List
from google.cloud.firestore import DocumentReference
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)

class BaseRepository(Generic[T]):
    def __init__(self, collection_name: str, model_class: type[T]):
        self.collection_name = collection_name
        self.model_class = model_class

    @property
    def collection(self):
        from app.firebase.client import get_db
        return get_db().collection(self.collection_name)

    async def create(self, data: T) -> str:
        doc_ref = self.collection.document()
        doc_ref.set(data.model_dump())
        return doc_ref.id

    async def get(self, doc_id: str) -> Optional[T]:
        doc = self.collection.document(doc_id).get()
        if doc.exists:
            return self.model_class(**doc.to_dict(), id=doc.id)
        return None

    async def update(self, doc_id: str, data: dict) -> bool:
        self.collection.document(doc_id).update(data)
        return True

    async def delete(self, doc_id: str) -> bool:
        self.collection.document(doc_id).delete()
        return True

    async def list_by_field(self, field: str, value: any) -> List[T]:
        docs = self.collection.where(field, "==", value).stream()
        return [self.model_class(**doc.to_dict(), id=doc.id) for doc in docs]
```

### main.py Updates
```python
from contextlib import asynccontextmanager
from app.firebase.client import init_firebase, verify_connection

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_firebase()
    yield
    # Shutdown (cleanup if needed)

app = FastAPI(lifespan=lifespan)

@app.get("/health")
async def health():
    fb_status = verify_connection()
    return {
        "status": "ok",
        "version": "0.1.0",
        "firebase": {
            "firestore": "connected" if fb_status["firestore"] else "disconnected",
            "storage": "connected" if fb_status["storage"] else "disconnected",
        }
    }
```

## Dependencies to Add

```
# Add to requirements.txt
firebase-admin>=6.4.0
```

## Environment Variables Required

Already defined in BE-001:
- FIREBASE_PROJECT_ID
- FIREBASE_PRIVATE_KEY
- FIREBASE_CLIENT_EMAIL

## Estimated Complexity
**S** (Small) - 2-3 hours

## Testing Instructions

1. Verify Firebase initialization:
```bash
uvicorn app.main:app --reload
curl http://localhost:8000/health
# Should return: {"status": "ok", "firebase": {"firestore": "connected", "storage": "connected"}}
```

2. Test failure handling:
- Temporarily use invalid credentials
- Verify health check shows "disconnected" status
- Verify app doesn't crash, returns degraded status

## Firebase Security Rules

### Firestore Security Rules

Deploy these rules to Firestore via Firebase Console > Firestore > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users collection - coaches can only access their own document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Athletes collection
    match /athletes/{athleteId} {
      // Read/write own athletes (coach_id matches auth uid)
      allow read, write: if request.auth != null
                         && resource.data.coach_id == request.auth.uid;
      // Create if setting own coach_id
      allow create: if request.auth != null
                    && request.resource.data.coach_id == request.auth.uid;
    }

    // Assessments collection (server-managed via Admin SDK)
    match /assessments/{assessmentId} {
      // Coach can read their own assessments
      allow read: if request.auth != null
                  && resource.data.coach_id == request.auth.uid;
      // No client writes - server uses Admin SDK
      allow write: if false;
    }

    // Parent reports (server-managed via Admin SDK)
    match /parent_reports/{reportId} {
      // Coach can read their own reports
      allow read: if request.auth != null
                  && resource.data.coach_id == request.auth.uid;
      // No client writes - server uses Admin SDK
      allow write: if false;
    }

    // Benchmarks (read-only reference data)
    match /benchmarks/{benchmarkId} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
```

### Firebase Storage Security Rules

Deploy these rules to Storage via Firebase Console > Storage > Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Assessment videos
    // Path: assessments/{athleteId}/{filename}
    match /assessments/{athleteId}/{filename} {
      // Read: Any authenticated user (backend uses Admin SDK anyway)
      allow read: if request.auth != null;

      // Write: Authenticated users only
      // File size limit: 100MB
      // Allowed types: video/*
      allow write: if request.auth != null
                   && request.resource.size < 100 * 1024 * 1024
                   && request.resource.contentType.matches('video/.*');
    }

    // Raw keypoints JSON (written by server only via Admin SDK)
    // Path: keypoints/{assessmentId}/raw_keypoints.json
    match /keypoints/{assessmentId}/{filename} {
      // Read: Authenticated users
      allow read: if request.auth != null;

      // Write: Never from client (server uses Admin SDK)
      allow write: if false;
    }

    // Default: deny all other paths
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## Notes
- The service account JSON can be downloaded from Firebase Console > Project Settings > Service Accounts
- Private key must have newlines properly escaped in environment variable
- Consider adding retry logic for transient connection failures in production
- Deploy security rules before going live to protect data access
