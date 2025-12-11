COMPLETED

---
id: BE-004
depends_on: [BE-002]
blocks: [BE-009, BE-010, BE-011, BE-020, BE-022, BE-023, BE-030, BE-031, BE-033]
---

# BE-004: Firestore Database Service Wrapper

## Scope

**In Scope:**
- Create Firestore client wrapper
- Implement common CRUD operations
- Add type-safe collection helpers
- Create base models for Firestore documents

**Out of Scope:**
- Specific domain logic (athletes, assessments, etc.)
- Query optimization
- Indexes (handled in Firebase Console)

## Technical Decisions

- **ORM Pattern**: Lightweight wrapper, not full ORM
- **Collections**: Type-safe references via constants
- **Document Models**: Pydantic models for validation
- **Timestamps**: Server-side timestamps for consistency
- **Location**: `app/services/database.py`

## Acceptance Criteria

- [ ] Firestore client initialized from Firebase Admin SDK
- [ ] Generic CRUD methods: `create()`, `get()`, `update()`, `delete()`, `query()`
- [ ] Collection name constants defined
- [ ] Timestamp helpers for `createdAt`, `updatedAt`
- [ ] Type hints for all methods
- [ ] Basic error handling for document not found

## Files to Create/Modify

- `app/services/database.py` (create)
- `app/models/base.py` (create - base document model)
- `app/core/__init__.py` (modify - export db instance)

## Implementation Notes

**app/services/database.py**:
```python
from firebase_admin import firestore
from app.core.firebase import get_firebase_app
from typing import Optional, Dict, Any, List
from datetime import datetime

# Collection name constants
class Collections:
    USERS = "users"
    ATHLETES = "athletes"
    ASSESSMENTS = "assessments"
    PARENT_REPORTS = "parent_reports"
    BENCHMARKS = "benchmarks"

class DatabaseService:
    def __init__(self):
        get_firebase_app()  # Ensure Firebase is initialized
        self.db = firestore.client()

    def create(self, collection: str, data: Dict[str, Any], doc_id: Optional[str] = None) -> str:
        """Create a new document"""
        data["createdAt"] = firestore.SERVER_TIMESTAMP

        if doc_id:
            doc_ref = self.db.collection(collection).document(doc_id)
            doc_ref.set(data)
            return doc_id
        else:
            doc_ref = self.db.collection(collection).document()
            doc_ref.set(data)
            return doc_ref.id

    def get(self, collection: str, doc_id: str) -> Optional[Dict[str, Any]]:
        """Get a single document"""
        doc_ref = self.db.collection(collection).document(doc_id)
        doc = doc_ref.get()

        if not doc.exists:
            return None

        data = doc.to_dict()
        data["id"] = doc.id
        return data

    def update(self, collection: str, doc_id: str, data: Dict[str, Any]) -> bool:
        """Update a document"""
        doc_ref = self.db.collection(collection).document(doc_id)
        data["updatedAt"] = firestore.SERVER_TIMESTAMP
        doc_ref.update(data)
        return True

    def delete(self, collection: str, doc_id: str) -> bool:
        """Delete a document"""
        doc_ref = self.db.collection(collection).document(doc_id)
        doc_ref.delete()
        return True

    def query(
        self,
        collection: str,
        filters: Optional[List[tuple]] = None,
        order_by: Optional[str] = None,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Query documents with filters"""
        query = self.db.collection(collection)

        if filters:
            for field, op, value in filters:
                query = query.where(field, op, value)

        if order_by:
            query = query.order_by(order_by)

        if limit:
            query = query.limit(limit)

        docs = query.stream()
        results = []

        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            results.append(data)

        return results

# Global instance
db = DatabaseService()
```

**app/models/base.py**:
```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class FirestoreDocument(BaseModel):
    id: Optional[str] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True
```

## Testing

Add test endpoint to `app/main.py`:
```python
from app.services.database import db, Collections

@app.get("/test-db")
async def test_database():
    # Create
    doc_id = db.create(Collections.USERS, {"name": "Test User", "email": "test@example.com"})

    # Read
    user = db.get(Collections.USERS, doc_id)

    # Update
    db.update(Collections.USERS, doc_id, {"name": "Updated User"})

    # Query
    users = db.query(Collections.USERS, filters=[("email", "==", "test@example.com")])

    # Delete
    db.delete(Collections.USERS, doc_id)

    return {"message": "Database operations successful", "user": user}
```

Visit `/test-db` - should complete without errors and return user data.

## Estimated Complexity

**Size**: M (Medium - ~2-3 hours)

## Notes

- Firestore auto-generates IDs if not provided
- SERVER_TIMESTAMP ensures consistent timezone handling
- Security rules must be configured in Firebase Console separately
- This wrapper keeps things simple - no complex query builder needed for MVP
