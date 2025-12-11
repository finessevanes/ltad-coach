import sys
import os

# Add parent directory to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

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
