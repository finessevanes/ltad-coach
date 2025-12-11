COMPLETED

---
id: BE-020
depends_on: [BE-004]
blocks: [BE-021, BE-022, BE-025]
status: COMPLETED
---

# BE-020: Benchmark Data Seeding

## Scope

**In Scope:**
- Create benchmark documents in Firestore
- LTAD duration tiers (1-5 scoring)
- Age-based expectations
- Seeding script to populate database

**Out of Scope:**
- National percentile data (future enhancement)
- Quality metric benchmarks (team-relative in MVP)

## Technical Decisions

- **Data Source**: PRD Section 11.4 (Hybrid Scoring Model)
- **Collection**: `benchmarks`
- **Document Structure**: One doc per age group
- **Seeding**: Python script, run once during deployment
- **Location**: `scripts/seed_benchmarks.py`

## Acceptance Criteria

- [ ] Benchmark documents created for ages 10-14
- [ ] Duration tier thresholds defined (1-9s = 1, 10-14s = 2, etc.)
- [ ] Age expectations match LTAD framework
- [ ] Script is idempotent (can run multiple times)
- [ ] Data accessible via API

## Files to Create/Modify

- `scripts/seed_benchmarks.py` (create)
- `app/api/benchmarks.py` (create - read endpoint)
- `app/main.py` (modify - include router)

## Implementation Notes

**scripts/seed_benchmarks.py**:
```python
import sys
sys.path.append('..')

from app.core.firebase import initialize_firebase
from app.services.database import db, Collections

def seed_benchmarks():
    """Seed benchmark data for One-Leg Balance Test"""

    initialize_firebase()

    # LTAD scoring tiers (from PRD Section 11.4)
    scoring_tiers = {
        "score1": {"min": 1, "max": 9, "label": "Beginning"},
        "score2": {"min": 10, "max": 14, "label": "Developing"},
        "score3": {"min": 15, "max": 19, "label": "Competent"},
        "score4": {"min": 20, "max": 24, "label": "Proficient"},
        "score5": {"min": 25, "max": None, "label": "Advanced"}
    }

    benchmarks = [
        {
            "testType": "one_leg_balance",
            "ageGroup": "10-11",
            "expectedScore": 4,  # Expected: Proficient (20-24s)
            "scoringTiers": scoring_tiers
        },
        {
            "testType": "one_leg_balance",
            "ageGroup": "12-13",
            "expectedScore": 5,  # Expected: Advanced (25s+)
            "scoringTiers": scoring_tiers
        },
        {
            "testType": "one_leg_balance",
            "ageGroup": "14",
            "expectedScore": 5,  # Expected: Advanced (25s+)
            "scoringTiers": scoring_tiers
        }
    ]

    for benchmark in benchmarks:
        doc_id = f"{benchmark['testType']}_{benchmark['ageGroup']}"

        # Check if exists
        existing = db.get(Collections.BENCHMARKS, doc_id)

        if existing:
            print(f"✓ Benchmark already exists: {doc_id}")
        else:
            db.create(Collections.BENCHMARKS, benchmark, doc_id=doc_id)
            print(f"✓ Created benchmark: {doc_id}")

    print("\n✅ Benchmark seeding complete!")

if __name__ == "__main__":
    seed_benchmarks()
```

**app/api/benchmarks.py**:
```python
from fastapi import APIRouter, HTTPException
from app.services.database import db, Collections

router = APIRouter(prefix="/api/benchmarks", tags=["Benchmarks"])

@router.get("/{test_type}/{age}")
async def get_benchmark(test_type: str, age: int):
    """Get benchmark data for test type and age"""

    # Determine age group
    if age <= 11:
        age_group = "10-11"
    elif age <= 13:
        age_group = "12-13"
    else:
        age_group = "14"

    doc_id = f"{test_type}_{age_group}"
    benchmark = db.get(Collections.BENCHMARKS, doc_id)

    if not benchmark:
        raise HTTPException(status_code=404, detail="Benchmark not found")

    return benchmark
```

**app/main.py** (add):
```python
from app.api import benchmarks

app.include_router(benchmarks.router)
```

## Testing

```bash
# Run seeding script
cd backend
source venv/bin/activate
python scripts/seed_benchmarks.py

# Test API
curl http://localhost:8000/api/benchmarks/one_leg_balance/12
```

## Estimated Complexity

**Size**: S (Small - ~1 hour)
