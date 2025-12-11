---
id: BE-033
depends_on: [BE-032, BE-004]
blocks: [BE-034, BE-035]
---

# BE-033: Report PIN Generation & Storage

## Scope

**In Scope:**
- Generate 6-digit PIN
- Create parent_report document
- Store report content and metadata

**Out of Scope:**
- Sending email (BE-034)
- Public viewing (BE-035)

## Technical Decisions

- **PIN**: 6-digit numeric (000000-999999)
- **Uniqueness**: Check before creating
- **Document**: Store in `parent_reports` collection
- **Expiration**: No expiration for MVP

## Acceptance Criteria

- [ ] Generates unique 6-digit PIN
- [ ] Creates report document
- [ ] Stores content and metadata
- [ ] Returns report ID and PIN

## Files to Create/Modify

- `app/api/reports.py` (modify - add save endpoint)
- `app/models/report.py` (create)

## Implementation Notes

**app/models/report.py**:
```python
from pydantic import BaseModel
from typing import List
from app.models.base import FirestoreDocument

class ParentReport(FirestoreDocument):
    athleteId: str
    coachId: str
    accessPin: str
    reportContent: str
    assessmentIds: List[str]
    sentAt: Optional[str] = None
```

**app/api/reports.py** (add endpoint):
```python
import random
from datetime import datetime

def generate_pin() -> str:
    """Generate unique 6-digit PIN"""
    return str(random.randint(100000, 999999))

@router.post("/save/{athlete_id}")
async def save_report(
    athlete_id: str,
    user: dict = Depends(get_current_user)
):
    """Save report and generate PIN (not yet sent)"""
    # Generate report content (reuse from /generate)
    # ... (same logic as generate endpoint)

    # Generate unique PIN
    pin = generate_pin()

    # Check uniqueness (low collision probability, but verify)
    existing = db.query(
        Collections.PARENT_REPORTS,
        filters=[("accessPin", "==", pin)]
    )

    while existing:  # Regenerate if collision
        pin = generate_pin()
        existing = db.query(
            Collections.PARENT_REPORTS,
            filters=[("accessPin", "==", pin)]
        )

    # Create report document
    report_data = {
        "athleteId": athlete_id,
        "coachId": user["uid"],
        "accessPin": pin,
        "reportContent": report_content,
        "assessmentIds": [a["id"] for a in assessments],
        "sentAt": None  # Not sent yet
    }

    report_id = db.create(Collections.PARENT_REPORTS, report_data)

    return {
        "reportId": report_id,
        "accessPin": pin,
        "reportContent": report_content
    }
```

## Testing

Verify PIN generation and storage.

## Estimated Complexity

**Size**: S (Small - ~1 hour)
