---
id: FE-011
depends_on: [FE-010, FE-005]
blocks: [FE-012, FE-013, FE-014]
---

# FE-011: Athletes List Page

## Scope
- Display all athletes for coach
- Status badges (pending/active)
- Add athlete button
- Search/filter

## Technical Decisions
- Material-UI Table or List
- API: GET /api/athletes
- Real-time status display

## Acceptance Criteria
- [ ] Displays all athletes
- [ ] Status badges visible
- [ ] Click athlete → navigate to profile
- [ ] Add button navigates to form

## Files to Create
- `src/pages/AthletesListPage.jsx`
- `src/components/Athletes/AthleteCard.jsx`

## Estimated Complexity
**Size**: M (2-3 hours)
