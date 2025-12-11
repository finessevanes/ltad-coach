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
