---
id: BE-021
depends_on: [BE-020]
blocks: [BE-029]
---

# BE-021: Duration Score Calculation (1-5 Tiers)

## Scope

**In Scope:**
- Calculate LTAD score (1-5) from duration
- Map duration to tier labels
- Compare against age expectations

**Out of Scope:**
- Quality metrics (stability score)
- Percentile calculations

## Technical Decisions

- **Scoring Logic**: Use benchmark tiers from BE-020
- **Output**: Score (1-5), label, expectation status
- **Location**: `app/services/scoring.py`

## Acceptance Criteria

- [ ] Returns score 1-5 based on duration
- [ ] Returns tier label ("Beginning", "Developing", etc.)
- [ ] Returns expectation status ("meets", "above", "below")
- [ ] Handles edge cases (0s duration, >25s)

## Files to Create/Modify

- `app/services/scoring.py` (create)

## Implementation Notes

**app/services/scoring.py**:
```python
from app.services.database import db, Collections
from typing import Dict, Any

class ScoringService:
    def calculate_duration_score(self, duration: float, age: int) -> Dict[str, Any]:
        """
        Calculate LTAD score (1-5) from duration

        Args:
            duration: Balance duration in seconds
            age: Athlete age

        Returns:
            {
                "score": int (1-5),
                "label": str,
                "expectationStatus": "meets" | "above" | "below",
                "expectedScore": int
            }
        """
        # Get benchmark
        if age <= 11:
            age_group = "10-11"
        elif age <= 13:
            age_group = "12-13"
        else:
            age_group = "14"

        doc_id = f"one_leg_balance_{age_group}"
        benchmark = db.get(Collections.BENCHMARKS, doc_id)

        if not benchmark:
            raise ValueError("Benchmark not found")

        tiers = benchmark["scoringTiers"]
        expected_score = benchmark["expectedScore"]

        # Determine score based on duration
        score = 1
        label = "Beginning"

        for tier_key in ["score5", "score4", "score3", "score2", "score1"]:
            tier = tiers[tier_key]
            if tier["max"] is None:  # Score 5 has no max
                if duration >= tier["min"]:
                    score = int(tier_key[-1])
                    label = tier["label"]
                    break
            elif tier["min"] <= duration <= tier["max"]:
                score = int(tier_key[-1])
                label = tier["label"]
                break

        # Determine expectation status
        if score == expected_score:
            expectation_status = "meets"
        elif score > expected_score:
            expectation_status = "above"
        else:
            expectation_status = "below"

        return {
            "score": score,
            "label": label,
            "expectationStatus": expectation_status,
            "expectedScore": expected_score
        }

# Global instance
scoring_service = ScoringService()
```

## Testing

```python
# Test various durations
assert scoring_service.calculate_duration_score(8, 11)["score"] == 1
assert scoring_service.calculate_duration_score(12, 11)["score"] == 2
assert scoring_service.calculate_duration_score(17, 11)["score"] == 3
assert scoring_service.calculate_duration_score(22, 11)["score"] == 4
assert scoring_service.calculate_duration_score(26, 11)["score"] == 5

# Test expectations
result = scoring_service.calculate_duration_score(22, 11)  # Age 10-11
assert result["expectationStatus"] == "meets"  # Expected score is 4
```

## Estimated Complexity

**Size**: S (Small - ~1 hour)
