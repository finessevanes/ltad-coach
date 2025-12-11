---
id: BE-022
depends_on: [BE-020, BE-004]
blocks: []
---

# BE-022: Percentile Calculation Logic

## Scope

**In Scope:**
- Calculate national percentile for duration (mock for MVP)
- Return percentile value (0-100)

**Out of Scope:**
- Real national data (use mock for MVP)
- Quality metric percentiles (team-relative in BE-023)

## Technical Decisions

- **MVP Approach**: Mock percentile based on score
- **Post-MVP**: Calculate from aggregated anonymized data
- **Formula**: Simple mapping for now (score 1 = 20th, score 5 = 95th)
- **Location**: Add to `scoring.py`

## Acceptance Criteria

- [ ] Returns percentile (0-100)
- [ ] Reasonable mapping from scores
- [ ] Documented as mock data

## Files to Create/Modify

- `app/services/scoring.py` (modify)

## Implementation Notes

**app/services/scoring.py** (add method):
```python
class ScoringService:
    # ... existing code ...

    def calculate_percentile(self, score: int, duration: float) -> int:
        """
        Calculate national percentile (MOCK for MVP)

        In production, this would query aggregated data.
        For MVP, use score-based approximation.

        Args:
            score: LTAD score (1-5)
            duration: Balance duration

        Returns:
            Percentile (0-100)
        """
        # Mock percentile mapping
        base_percentiles = {
            1: 15,   # Beginning
            2: 35,   # Developing
            3: 55,   # Competent
            4: 75,   # Proficient
            5: 90    # Advanced
        }

        percentile = base_percentiles.get(score, 50)

        # Fine-tune based on duration within tier
        # Add up to ±10 percentile points
        if score == 5 and duration > 30:
            percentile = min(98, percentile + 5)
        elif score == 1 and duration < 5:
            percentile = max(5, percentile - 5)

        return percentile
```

## Testing

```python
assert scoring_service.calculate_percentile(1, 5) == 10  # Low
assert scoring_service.calculate_percentile(5, 30) == 95  # High
```

## Estimated Complexity

**Size**: S (Small - ~0.5 hours)

## Notes

- Mark as "estimated" in UI
- Replace with real data post-MVP
- Future: Query aggregated assessment data filtered by age/gender
