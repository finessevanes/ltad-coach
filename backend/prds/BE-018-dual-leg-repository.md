---
id: BE-018
status: 🔵 READY FOR DEVELOPMENT
depends_on: [BE-016, BE-017]
blocks: [BE-019]
---

# BE-018: Dual-Leg Assessment Repository

## Title
Add repository method to create dual-leg assessments with bilateral comparison data

## Scope

### In Scope
- Add `create_completed_dual_leg()` method to `AssessmentRepository`
- Store dual-leg assessment with left/right metrics and bilateral comparison
- Maintain consistency with existing single-leg `create_completed()` method
- Firestore document structure for dual-leg assessments
- Convert Pydantic models to Firestore-compatible dicts

### Out of Scope
- Data model definitions (BE-016)
- Bilateral comparison calculation logic (BE-017)
- API endpoint implementation (BE-019)
- Single-leg assessment methods (already implemented)
- Assessment querying/listing methods (no changes needed)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Method Name | `create_completed_dual_leg()` | Explicit naming distinguishes from single-leg; status is "completed" by default |
| Document Structure | Flat fields with left_leg_*/right_leg_* prefixes | Consistent with BE-016 naming; simpler Firestore queries |
| Parameter Style | Individual parameters vs. single dict | Explicit parameters provide better type safety and IDE support |
| Firestore Conversion | `.model_dump()` for nested dicts | Pydantic's native serialization handles datetime, enums correctly |
| Backward Compatibility | No migration needed | New fields are optional in Firestore; old assessments still valid |
| Status Field | Always "completed" for dual-leg | Client provides all metrics; no server-side processing needed |

## Acceptance Criteria

- [ ] `create_completed_dual_leg()` method accepts 8 parameters (coach_id, athlete_id, test_type, left/right video URLs/paths, left/right metrics, bilateral_comparison)
- [ ] Method creates Firestore document with all dual-leg fields
- [ ] `leg_tested` is set to "both" automatically
- [ ] `status` is set to "completed" automatically
- [ ] Returns `Assessment` model instance with generated ID
- [ ] Temporal data preserved in both left_leg_metrics and right_leg_metrics
- [ ] Type hints on all parameters
- [ ] Google-style docstring with example usage

## Files to Create/Modify

```
backend/app/repositories/
└── assessment.py              # MODIFY: Add create_completed_dual_leg() method
```

## Implementation Details

### Modify `AssessmentRepository` Class

**File**: `backend/app/repositories/assessment.py`

**Add Method** (after existing `create_completed()` method):

```python
async def create_completed_dual_leg(
    self,
    coach_id: str,
    athlete_id: str,
    test_type: str,
    left_leg_video_url: str,
    left_leg_video_path: str,
    left_leg_metrics: Dict[str, Any],
    right_leg_video_url: str,
    right_leg_video_path: str,
    right_leg_metrics: Dict[str, Any],
    bilateral_comparison: Dict[str, Any],
) -> Assessment:
    """
    Create a completed dual-leg assessment with bilateral comparison.

    Stores assessment with left and right leg metrics plus symmetry analysis.
    Status is always "completed" since client provides all metrics.

    Args:
        coach_id: ID of the coach who created the assessment
        athlete_id: ID of the athlete being assessed
        test_type: Type of test (e.g., "one_leg_balance")
        left_leg_video_url: Public URL to left leg video in Firebase Storage
        left_leg_video_path: Storage path for left leg video (e.g., "videos/abc123.mp4")
        left_leg_metrics: Dictionary of left leg metrics (includes temporal data)
        right_leg_video_url: Public URL to right leg video in Firebase Storage
        right_leg_video_path: Storage path for right leg video
        right_leg_metrics: Dictionary of right leg metrics (includes temporal data)
        bilateral_comparison: Dictionary of bilateral comparison metrics

    Returns:
        Assessment model instance with generated ID

    Example:
        >>> repo = AssessmentRepository()
        >>> assessment = await repo.create_completed_dual_leg(
        ...     coach_id="coach123",
        ...     athlete_id="athlete456",
        ...     test_type="one_leg_balance",
        ...     left_leg_video_url="https://storage.example.com/left.mp4",
        ...     left_leg_video_path="videos/left.mp4",
        ...     left_leg_metrics={"hold_time": 25.3, "duration_score": 4, ...},
        ...     right_leg_video_url="https://storage.example.com/right.mp4",
        ...     right_leg_video_path="videos/right.mp4",
        ...     right_leg_metrics={"hold_time": 23.8, "duration_score": 4, ...},
        ...     bilateral_comparison={"overall_symmetry_score": 82.0, ...},
        ... )
        >>> assert assessment.leg_tested == LegTested.BOTH
        >>> assert assessment.status == AssessmentStatus.COMPLETED
    """
    # Generate new assessment ID
    assessment_ref = self.db.collection("assessments").document()
    assessment_id = assessment_ref.id

    # Build Firestore document
    data = {
        "id": assessment_id,
        "coach_id": coach_id,
        "athlete_id": athlete_id,
        "test_type": test_type,
        "leg_tested": "both",
        "status": "completed",
        "created_at": datetime.utcnow(),
        # Left leg fields
        "left_leg_video_url": left_leg_video_url,
        "left_leg_video_path": left_leg_video_path,
        "left_leg_metrics": left_leg_metrics,
        # Right leg fields
        "right_leg_video_url": right_leg_video_url,
        "right_leg_video_path": right_leg_video_path,
        "right_leg_metrics": right_leg_metrics,
        # Bilateral comparison
        "bilateral_comparison": bilateral_comparison,
        # Optional fields (may be added later)
        "ai_coach_assessment": None,
        "error_message": None,
    }

    # Save to Firestore
    assessment_ref.set(data)

    # Convert to Assessment model and return
    from app.models.assessment import Assessment
    return Assessment(**data)
```

**Important Notes**:
- No need to call `.model_dump()` on metrics dicts - they're already dictionaries from the service layer
- `created_at` uses `datetime.utcnow()` for consistency with single-leg method
- All temporal data (5-second segments, events) is preserved in the metrics dicts
- The method is async to match repository pattern (even though Firestore SDK is synchronous)

## API Specification

Not applicable - this is an internal repository method.

## Environment Variables

None required (uses existing Firebase credentials).

## Estimated Complexity

**S** (Small) - 2-3 hours

**Breakdown**:
- Add method signature and docstring: 0.5 hours
- Implement Firestore document creation: 1 hour
- Testing and validation: 1 hour
- Edge case handling: 0.5 hours

## Testing Instructions

### 1. Unit Tests

Create test file: `backend/tests/test_assessment_repository_dual_leg.py`

**Test successful dual-leg creation:**

```python
import pytest
from datetime import datetime
from backend.app.repositories.assessment import AssessmentRepository
from backend.app.models.assessment import AssessmentStatus, LegTested


@pytest.mark.asyncio
async def test_create_completed_dual_leg_success(firestore_client):
    """Test creating a completed dual-leg assessment."""
    repo = AssessmentRepository()

    # Sample metrics (simplified for test)
    left_metrics = {
        "success": True,
        "hold_time": 25.3,
        "duration_score": 4,
        "sway_velocity": 1.8,
        "corrections_count": 8,
        "arm_angle_left": 8.5,
        "arm_angle_right": 12.3,
        "temporal": {
            "first_third": {"sway_velocity": 1.5, "corrections_count": 2},
            "middle_third": {"sway_velocity": 1.8, "corrections_count": 3},
            "last_third": {"sway_velocity": 2.1, "corrections_count": 3},
        },
    }

    right_metrics = {
        "success": True,
        "hold_time": 23.8,
        "duration_score": 4,
        "sway_velocity": 2.0,
        "corrections_count": 10,
        "arm_angle_left": 9.0,
        "arm_angle_right": 11.5,
        "temporal": {
            "first_third": {"sway_velocity": 1.7, "corrections_count": 3},
            "middle_third": {"sway_velocity": 2.0, "corrections_count": 4},
            "last_third": {"sway_velocity": 2.3, "corrections_count": 3},
        },
    }

    bilateral_comparison = {
        "duration_difference": 1.5,
        "duration_difference_pct": 5.9,
        "dominant_leg": "left",
        "overall_symmetry_score": 82.0,
        "symmetry_assessment": "good",
    }

    # Create assessment
    assessment = await repo.create_completed_dual_leg(
        coach_id="coach123",
        athlete_id="athlete456",
        test_type="one_leg_balance",
        left_leg_video_url="https://storage.example.com/left.mp4",
        left_leg_video_path="videos/left.mp4",
        left_leg_metrics=left_metrics,
        right_leg_video_url="https://storage.example.com/right.mp4",
        right_leg_video_path="videos/right.mp4",
        right_leg_metrics=right_metrics,
        bilateral_comparison=bilateral_comparison,
    )

    # Assertions
    assert assessment.id is not None
    assert assessment.coach_id == "coach123"
    assert assessment.athlete_id == "athlete456"
    assert assessment.leg_tested == LegTested.BOTH
    assert assessment.status == AssessmentStatus.COMPLETED
    assert assessment.left_leg_video_url == "https://storage.example.com/left.mp4"
    assert assessment.right_leg_video_url == "https://storage.example.com/right.mp4"
    assert assessment.left_leg_metrics["hold_time"] == 25.3
    assert assessment.right_leg_metrics["hold_time"] == 23.8
    assert assessment.bilateral_comparison["overall_symmetry_score"] == 82.0
    assert isinstance(assessment.created_at, datetime)
```

**Test temporal data preservation:**

```python
@pytest.mark.asyncio
async def test_dual_leg_preserves_temporal_data(firestore_client):
    """Verify that temporal data (5-second segments, events) is preserved."""
    repo = AssessmentRepository()

    # Metrics with rich temporal data
    left_metrics = {
        "hold_time": 25.3,
        "duration_score": 4,
        "sway_velocity": 1.8,
        "corrections_count": 8,
        "temporal": {
            "first_third": {"sway_velocity": 1.5, "corrections_count": 2},
            "middle_third": {"sway_velocity": 1.8, "corrections_count": 3},
            "last_third": {"sway_velocity": 2.1, "corrections_count": 3},
        },
        "five_second_segments": [
            {"start_time": 0, "end_time": 5, "avg_velocity": 1.3, "corrections": 1},
            {"start_time": 5, "end_time": 10, "avg_velocity": 1.6, "corrections": 2},
            {"start_time": 10, "end_time": 15, "avg_velocity": 1.8, "corrections": 2},
            {"start_time": 15, "end_time": 20, "avg_velocity": 2.0, "corrections": 2},
            {"start_time": 20, "end_time": 25.3, "avg_velocity": 2.2, "corrections": 1},
        ],
        "events": [
            {"time": 3.2, "type": "flapping", "severity": "medium", "detail": "Rapid arm movements"},
            {"time": 18.5, "type": "stabilized", "severity": "low", "detail": "Smooth control achieved"},
        ],
    }

    right_metrics = {
        **left_metrics,
        "hold_time": 23.8,
        "five_second_segments": [
            {"start_time": 0, "end_time": 5, "avg_velocity": 1.5, "corrections": 2},
            {"start_time": 5, "end_time": 10, "avg_velocity": 1.8, "corrections": 3},
            {"start_time": 10, "end_time": 15, "avg_velocity": 2.1, "corrections": 2},
            {"start_time": 15, "end_time": 20, "avg_velocity": 2.3, "corrections": 2},
            {"start_time": 20, "end_time": 23.8, "avg_velocity": 2.5, "corrections": 1},
        ],
        "events": [
            {"time": 12.5, "type": "correction_burst", "severity": "high", "detail": "3 corrections in 2s"},
        ],
    }

    bilateral_comparison = {
        "duration_difference": 1.5,
        "overall_symmetry_score": 82.0,
        "symmetry_assessment": "good",
    }

    assessment = await repo.create_completed_dual_leg(
        coach_id="coach123",
        athlete_id="athlete456",
        test_type="one_leg_balance",
        left_leg_video_url="https://example.com/left.mp4",
        left_leg_video_path="videos/left.mp4",
        left_leg_metrics=left_metrics,
        right_leg_video_url="https://example.com/right.mp4",
        right_leg_video_path="videos/right.mp4",
        right_leg_metrics=right_metrics,
        bilateral_comparison=bilateral_comparison,
    )

    # Verify temporal data is preserved
    assert "five_second_segments" in assessment.left_leg_metrics
    assert len(assessment.left_leg_metrics["five_second_segments"]) == 5
    assert "events" in assessment.left_leg_metrics
    assert len(assessment.left_leg_metrics["events"]) == 2

    assert "five_second_segments" in assessment.right_leg_metrics
    assert len(assessment.right_leg_metrics["five_second_segments"]) == 5
    assert "events" in assessment.right_leg_metrics
    assert len(assessment.right_leg_metrics["events"]) == 1
```

### 2. Integration Test with Repository

**Test retrieval of created assessment:**

```python
@pytest.mark.asyncio
async def test_dual_leg_create_and_retrieve(firestore_client):
    """Test creating and then retrieving a dual-leg assessment."""
    repo = AssessmentRepository()

    left_metrics = {
        "hold_time": 25.3,
        "duration_score": 4,
        "sway_velocity": 1.8,
        "corrections_count": 8,
    }
    right_metrics = {
        "hold_time": 23.8,
        "duration_score": 4,
        "sway_velocity": 2.0,
        "corrections_count": 10,
    }
    bilateral_comparison = {
        "overall_symmetry_score": 82.0,
        "symmetry_assessment": "good",
    }

    # Create
    created = await repo.create_completed_dual_leg(
        coach_id="coach123",
        athlete_id="athlete456",
        test_type="one_leg_balance",
        left_leg_video_url="https://example.com/left.mp4",
        left_leg_video_path="videos/left.mp4",
        left_leg_metrics=left_metrics,
        right_leg_video_url="https://example.com/right.mp4",
        right_leg_video_path="videos/right.mp4",
        right_leg_metrics=right_metrics,
        bilateral_comparison=bilateral_comparison,
    )

    # Retrieve
    retrieved = await repo.get(created.id)

    # Verify match
    assert retrieved.id == created.id
    assert retrieved.leg_tested == LegTested.BOTH
    assert retrieved.bilateral_comparison["overall_symmetry_score"] == 82.0
```

### 3. Manual Testing

**Test in Python REPL with Firestore:**

```bash
cd backend
source venv/bin/activate
python
```

```python
import asyncio
from app.repositories.assessment import AssessmentRepository

repo = AssessmentRepository()

# Sample data
left_metrics = {
    "success": True,
    "hold_time": 25.3,
    "duration_score": 4,
    "sway_velocity": 1.8,
    "corrections_count": 8,
    "arm_angle_left": 8.5,
    "arm_angle_right": 12.3,
}

right_metrics = {
    "success": True,
    "hold_time": 23.8,
    "duration_score": 4,
    "sway_velocity": 2.0,
    "corrections_count": 10,
    "arm_angle_left": 9.0,
    "arm_angle_right": 11.5,
}

bilateral_comparison = {
    "duration_difference": 1.5,
    "duration_difference_pct": 5.9,
    "dominant_leg": "left",
    "sway_difference": 0.2,
    "sway_symmetry_score": 0.9,
    "overall_symmetry_score": 82.0,
    "symmetry_assessment": "good",
}

# Create assessment
assessment = asyncio.run(repo.create_completed_dual_leg(
    coach_id="test_coach",
    athlete_id="test_athlete",
    test_type="one_leg_balance",
    left_leg_video_url="https://storage.example.com/left.mp4",
    left_leg_video_path="videos/left.mp4",
    left_leg_metrics=left_metrics,
    right_leg_video_url="https://storage.example.com/right.mp4",
    right_leg_video_path="videos/right.mp4",
    right_leg_metrics=right_metrics,
    bilateral_comparison=bilateral_comparison,
))

print(f"Created assessment: {assessment.id}")
print(f"Leg tested: {assessment.leg_tested}")
print(f"Status: {assessment.status}")
print(f"Symmetry score: {assessment.bilateral_comparison['overall_symmetry_score']}")

# Verify in Firestore console that document exists
```

**Verify in Firestore Console:**

1. Open Firebase Console → Firestore Database
2. Navigate to `assessments` collection
3. Find document with created ID
4. Verify fields:
   - `leg_tested: "both"`
   - `status: "completed"`
   - `left_leg_video_url`, `right_leg_video_url` present
   - `left_leg_metrics`, `right_leg_metrics` with nested data
   - `bilateral_comparison` object

## Notes

### Design Rationale

**Why separate method instead of adding parameter to `create_completed()`?**

Considered:
```python
# Rejected approach
async def create_completed(
    self,
    ...,
    dual_leg: bool = False,
    right_leg_video_url: Optional[str] = None,
    ...
):
    if dual_leg:
        # dual-leg logic
    else:
        # single-leg logic
```

Rejected because:
- Complex conditional logic in single method
- Type safety issues (right_leg_video_url optional but required when dual_leg=True)
- Harder to test edge cases
- Less clear API for callers

**Chosen approach**: Separate methods provide:
- Clear intent (`create_completed()` vs `create_completed_dual_leg()`)
- Better type safety (all parameters required)
- Easier testing (mock one method at a time)
- Single Responsibility Principle

**Why not use nested `DualLegData` parameter object?**

Considered:
```python
async def create_completed_dual_leg(
    self,
    coach_id: str,
    athlete_id: str,
    test_type: str,
    dual_leg_data: DualLegData,  # Contains all left/right fields
):
```

Rejected because:
- Hides parameter names from IDE autocomplete
- Adds extra layer of indirection
- Caller must construct object first
- Current flat parameters align with single-leg method signature

**Why store temporal data in metrics dicts?**

Temporal data (5-second segments, events) is crucial for:
- AI agent bilateral feedback (BE-020)
- Historical analysis (Phase 8+)
- Debugging balance test issues

Storing in Firestore (not just passing to AI) enables:
- Re-generating feedback without re-testing
- Querying for specific event patterns
- Comparing temporal asymmetry over time

### Firestore Document Structure

**Example dual-leg assessment document**:

```json
{
  "id": "assess_abc123",
  "coach_id": "coach_xyz",
  "athlete_id": "athlete_789",
  "test_type": "one_leg_balance",
  "leg_tested": "both",
  "status": "completed",
  "created_at": "2025-12-14T10:30:00Z",

  "left_leg_video_url": "https://storage.firebase.com/left.mp4",
  "left_leg_video_path": "videos/left.mp4",
  "left_leg_metrics": {
    "success": true,
    "hold_time": 25.3,
    "duration_score": 4,
    "sway_velocity": 1.8,
    "corrections_count": 8,
    "temporal": { "first_third": {...}, "middle_third": {...}, "last_third": {...} },
    "five_second_segments": [...],
    "events": [...]
  },

  "right_leg_video_url": "https://storage.firebase.com/right.mp4",
  "right_leg_video_path": "videos/right.mp4",
  "right_leg_metrics": {
    "success": true,
    "hold_time": 23.8,
    "duration_score": 4,
    "sway_velocity": 2.0,
    "corrections_count": 10,
    "temporal": {...},
    "five_second_segments": [...],
    "events": [...]
  },

  "bilateral_comparison": {
    "duration_difference": 1.5,
    "duration_difference_pct": 5.9,
    "dominant_leg": "left",
    "sway_difference": 0.2,
    "sway_symmetry_score": 0.9,
    "arm_angle_difference": 1.2,
    "corrections_difference": -2,
    "overall_symmetry_score": 82.0,
    "symmetry_assessment": "good"
  },

  "ai_coach_assessment": null,
  "error_message": null
}
```

### Backward Compatibility

**Existing single-leg assessments** remain valid:

```json
{
  "id": "old_assess",
  "leg_tested": "left",
  "video_url": "https://...",
  "video_path": "videos/...",
  "metrics": {...},
  // No left_leg_metrics, right_leg_metrics, bilateral_comparison
}
```

**Reading strategy**:
```python
# Repository get() method handles both formats
if assessment.leg_tested == "both":
    left_metrics = assessment.left_leg_metrics
    right_metrics = assessment.right_leg_metrics
else:
    metrics = assessment.metrics  # Old format
```

No migration script needed - optional fields in `Assessment` model allow both formats.

### Error Handling

| Scenario | Detection | Behavior |
|----------|-----------|----------|
| Missing required parameter | Python type checker | Raises TypeError before execution |
| Firestore write failure | Exception during `set()` | Propagates exception to caller (API layer handles) |
| Invalid metrics dict | None (trusts caller) | Stored as-is; validation happens at Pydantic layer |
| Duplicate assessment ID | Firestore generates unique IDs | Impossible (UUIDs are collision-resistant) |

**No explicit validation** in repository layer - assumes:
- Caller (API endpoint) has validated input
- Pydantic models validated at API boundary
- Repository is trusted internal interface

### Future Considerations

**Historical analysis queries** (Phase 8+):

```python
# Query for athletes with poor symmetry
assessments = await repo.query(
    filters=[
        ("leg_tested", "==", "both"),
        ("bilateral_comparison.symmetry_assessment", "==", "poor")
    ]
)
```

**Composite indexes** may be needed for:
- `(athlete_id, leg_tested, created_at)` - Athlete's dual-leg history
- `(coach_id, bilateral_comparison.symmetry_assessment)` - Dashboard filtering

**Update method** for AI feedback:

```python
# After AI agent generates feedback
await repo.update(
    assessment.id,
    {"ai_coach_assessment": bilateral_feedback}
)
```

This is already supported by existing `update()` method - no changes needed.
