---
id: BE-023
depends_on: [BE-004]
blocks: [BE-029]
---

# BE-023: Team Ranking Logic

## Scope

**In Scope:**
- Rank athlete against coach's roster (team-relative)
- Rank by stability score
- Return rank position and total count

**Out of Scope:**
- National rankings (percentile is in BE-022)
- Cross-team comparisons

## Technical Decisions

- **Ranking Metric**: Stability score (from BE-018)
- **Scope**: All assessments for coach's athletes
- **Tie Handling**: Equal scores get same rank
- **Location**: Add to `scoring.py`

## Acceptance Criteria

- [ ] Returns rank position (e.g., 3)
- [ ] Returns total count (e.g., "of 12")
- [ ] Ranks by stability score
- [ ] Handles edge cases (only athlete, tie scores)

## Files to Create/Modify

- `app/services/scoring.py` (modify)

## Implementation Notes

**app/services/scoring.py** (add method):
```python
from typing import Dict

class ScoringService:
    # ... existing code ...

    def calculate_team_rank(
        self,
        stability_score: float,
        coach_id: str
    ) -> Dict[str, Any]:
        """
        Calculate athlete's rank within coach's roster

        Args:
            stability_score: Current assessment stability score
            coach_id: Coach ID to query their athletes

        Returns:
            {
                "rank": int,
                "totalAthletes": int,
                "percentile": int (team-relative)
            }
        """
        # Get all athletes for this coach
        athletes = db.query(
            Collections.ATHLETES,
            filters=[("coachId", "==", coach_id)]
        )

        if not athletes:
            return {"rank": 1, "totalAthletes": 1, "percentile": 100}

        # Get most recent assessment for each athlete
        athlete_scores = []

        for athlete in athletes:
            assessments = db.query(
                Collections.ASSESSMENTS,
                filters=[("athleteId", "==", athlete["id"])],
                order_by="createdAt",
                limit=1
            )

            if assessments and "metrics" in assessments[0]:
                metrics = assessments[0]["metrics"]
                if "stabilityScore" in metrics:
                    athlete_scores.append(metrics["stabilityScore"])

        # Add current score
        athlete_scores.append(stability_score)

        # Sort descending (higher is better)
        athlete_scores.sort(reverse=True)

        # Find rank
        rank = athlete_scores.index(stability_score) + 1
        total = len(athlete_scores)

        # Calculate team percentile
        team_percentile = int(((total - rank) / total) * 100) if total > 1 else 100

        return {
            "rank": rank,
            "totalAthletes": total,
            "percentile": team_percentile
        }
```

## Testing

```python
# Create test assessments for multiple athletes
# Verify ranking is correct

# Athlete A: stability 85 → rank 1 of 3
# Athlete B: stability 70 → rank 2 of 3
# Athlete C: stability 60 → rank 3 of 3
```

## Estimated Complexity

**Size**: S (Small - ~1 hour)
