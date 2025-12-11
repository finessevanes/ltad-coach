COMPLETED
---
id: FE-014
depends_on: [FE-011]
blocks: [FE-016, FE-020, FE-021, FE-024]
status: COMPLETED
---

# FE-014: Athlete Profile Page

## Scope
- Athlete details display
- Assessment history list
- New Assessment button
- Progress chart placeholder

## Technical Decisions
- API: GET /api/athletes/{id}
- API: GET /api/assessments/athlete/{id}
- Material-UI Cards

## Acceptance Criteria
- [ ] Displays athlete info
- [ ] Lists assessments
- [ ] New Assessment button navigates correctly
- [ ] Edit button works

## Files to Create
- `src/pages/AthleteProfilePage.jsx`

## Estimated Complexity
**Size**: M (2-3 hours)
