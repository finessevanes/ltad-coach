"""Base repository class for Firestore operations."""

from typing import TypeVar, Generic, Optional, List, Dict, Any
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class BaseRepository(Generic[T]):
    """Generic base repository with CRUD operations for Firestore.

    Provides typed operations for any Pydantic model class.
    """

    def __init__(self, collection_name: str, model_class: type[T]):
        """Initialize repository.

        Args:
            collection_name: Name of the Firestore collection
            model_class: Pydantic model class for type conversion
        """
        self.collection_name = collection_name
        self.model_class = model_class

    @property
    def collection(self):
        """Get Firestore collection reference.

        Lazy loading to avoid import cycles and ensure Firebase is initialized.
        """
        from app.firebase import get_db
        return get_db().collection(self.collection_name)

    async def create(self, data: dict, doc_id: Optional[str] = None) -> str:
        """Create a new document.

        Args:
            data: Document data as dictionary
            doc_id: Optional document ID. If not provided, auto-generated.

        Returns:
            str: Document ID
        """
        if doc_id:
            doc_ref = self.collection.document(doc_id)
            doc_ref.set(data)
            return doc_id
        else:
            doc_ref = self.collection.document()
            doc_ref.set(data)
            return doc_ref.id

    async def get(self, doc_id: str) -> Optional[T]:
        """Get document by ID.

        Args:
            doc_id: Document ID

        Returns:
            Model instance or None if not found
        """
        doc = self.collection.document(doc_id).get()
        if doc.exists:
            data = doc.to_dict()
            data["id"] = doc.id
            return self.model_class(**data)
        return None

    async def update(self, doc_id: str, data: Dict[str, Any]) -> bool:
        """Update document fields.

        Args:
            doc_id: Document ID
            data: Fields to update

        Returns:
            bool: True if successful
        """
        self.collection.document(doc_id).update(data)
        return True

    async def delete(self, doc_id: str) -> bool:
        """Delete document by ID.

        Args:
            doc_id: Document ID

        Returns:
            bool: True if successful
        """
        self.collection.document(doc_id).delete()
        return True

    async def list_by_field(
        self,
        field: str,
        value: Any,
        limit: Optional[int] = None
    ) -> List[T]:
        """List documents where field equals value.

        Args:
            field: Field name to filter on
            value: Value to match
            limit: Optional maximum number of results

        Returns:
            List of model instances
        """
        query = self.collection.where(field, "==", value)
        if limit:
            query = query.limit(limit)

        docs = query.stream()
        results = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            results.append(self.model_class(**data))
        return results

    async def exists(self, doc_id: str) -> bool:
        """Check if document exists.

        Args:
            doc_id: Document ID

        Returns:
            bool: True if document exists
        """
        doc = self.collection.document(doc_id).get()
        return doc.exists
