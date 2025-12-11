---
id: FE-021
depends_on: [FE-014, FE-005]
blocks: []
---

# FE-021: Assessment Results Display

## Scope
- Display all metrics
- AI feedback
- Duration score badge (1-5)
- Team ranking
- Peer comparison
- Coach notes editor

## Technical Decisions
- API: GET /api/assessments/{id}
- Material-UI Cards and Typography
- Charts for quality metrics (optional)

## Acceptance Criteria
- [ ] All metrics displayed
- [ ] AI feedback readable
- [ ] Score badge prominent
- [ ] Team rank shown
- [ ] Coach can add/edit notes

## Files to Create
- `src/pages/AssessmentResultsPage.jsx`
- `src/components/Assessment/MetricsCard.jsx`
- `src/components/Assessment/ScoreBadge.jsx`

## Estimated Complexity
**Size**: L (3-4 hours)
