---
id: FE-022
depends_on: [FE-014, FE-005]
blocks: [FE-023]
---

# FE-022: Assessment History List

## Scope
- List all assessments for athlete
- Sortable by date
- Click to view details
- Summary stats

## Technical Decisions
- API: GET /api/assessments/athlete/{id}
- Material-UI List or Table

## Acceptance Criteria
- [ ] Lists all assessments
- [ ] Click navigates to results
- [ ] Shows summary stats

## Files to Create
- `src/components/Assessment/AssessmentHistoryList.jsx`

## Estimated Complexity
**Size**: M (2 hours)
