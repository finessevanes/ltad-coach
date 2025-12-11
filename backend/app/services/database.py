from firebase_admin import firestore
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime


class Collections:
    """Firestore collection names"""
    USERS = "users"
    ATHLETES = "athletes"
    ASSESSMENTS = "assessments"
    PARENT_REPORTS = "parent_reports"
    BENCHMARKS = "benchmarks"
    VIDEO_UPLOADS = "video_uploads"


class DatabaseService:
    """Firestore database service"""

    def __init__(self):
        self._db = None

    @property
    def db(self):
        """Lazy initialization of Firestore client"""
        if self._db is None:
            self._db = firestore.client()
        return self._db

    def create(self, collection: str, data: Dict[str, Any], doc_id: Optional[str] = None) -> str:
        """
        Create a new document

        Args:
            collection: Collection name
            data: Document data
            doc_id: Optional document ID (auto-generated if not provided)

        Returns:
            Document ID
        """
        data["createdAt"] = datetime.utcnow()
        data["updatedAt"] = datetime.utcnow()

        if doc_id:
            self.db.collection(collection).document(doc_id).set(data)
            return doc_id
        else:
            doc_ref = self.db.collection(collection).add(data)
            return doc_ref[1].id

    def get(self, collection: str, doc_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a document by ID

        Args:
            collection: Collection name
            doc_id: Document ID

        Returns:
            Document data or None if not found
        """
        doc_ref = self.db.collection(collection).document(doc_id)
        doc = doc_ref.get()

        if doc.exists:
            data = doc.to_dict()
            data["id"] = doc.id
            return data
        return None

    def update(self, collection: str, doc_id: str, data: Dict[str, Any]) -> bool:
        """
        Update a document

        Args:
            collection: Collection name
            doc_id: Document ID
            data: Fields to update

        Returns:
            True if successful
        """
        data["updatedAt"] = datetime.utcnow()
        doc_ref = self.db.collection(collection).document(doc_id)
        doc_ref.update(data)
        return True

    def delete(self, collection: str, doc_id: str) -> bool:
        """
        Delete a document

        Args:
            collection: Collection name
            doc_id: Document ID

        Returns:
            True if successful
        """
        self.db.collection(collection).document(doc_id).delete()
        return True

    def query(
        self,
        collection: str,
        filters: Optional[List[Tuple[str, str, Any]]] = None,
        order_by: Optional[str] = None,
        limit: Optional[int] = None,
        descending: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Query documents with filters

        Args:
            collection: Collection name
            filters: List of (field, operator, value) tuples
            order_by: Field to order by
            limit: Maximum number of results
            descending: Sort descending (default True)

        Returns:
            List of documents
        """
        query = self.db.collection(collection)

        # Apply filters
        if filters:
            for field, operator, value in filters:
                query = query.where(field, operator, value)

        # Apply ordering
        if order_by:
            direction = firestore.Query.DESCENDING if descending else firestore.Query.ASCENDING
            query = query.order_by(order_by, direction=direction)

        # Apply limit
        if limit:
            query = query.limit(limit)

        # Execute query
        docs = query.stream()

        results = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            results.append(data)

        return results

    def batch_create(self, collection: str, documents: List[Dict[str, Any]]) -> List[str]:
        """
        Create multiple documents in a batch

        Args:
            collection: Collection name
            documents: List of document data

        Returns:
            List of document IDs
        """
        batch = self.db.batch()
        doc_ids = []

        for data in documents:
            data["createdAt"] = datetime.utcnow()
            data["updatedAt"] = datetime.utcnow()

            doc_ref = self.db.collection(collection).document()
            batch.set(doc_ref, data)
            doc_ids.append(doc_ref.id)

        batch.commit()
        return doc_ids


# Global instance
db = DatabaseService()
