COMPLETED
---
id: FE-012
depends_on: [FE-011]
blocks: []
status: COMPLETED
---

# FE-012: Add Athlete Form

## Scope
- Form: name, age, gender, parent email
- Validation
- API call to create athlete
- Auto-sends consent email

## Technical Decisions
- Material-UI form components
- API: POST /api/athletes
- Show success message

## Acceptance Criteria
- [ ] Form validation works
- [ ] Creates athlete successfully
- [ ] Shows confirmation
- [ ] Navigates to athlete profile or list

## Files to Create
- `src/pages/AddAthletePage.jsx`
- `src/components/Athletes/AthleteForm.jsx`

## Estimated Complexity
**Size**: M (2 hours)
