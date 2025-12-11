---
id: FE-013
depends_on: [FE-011]
blocks: []
---

# FE-013: Edit Athlete Form

## Scope
- Pre-populated form
- Update athlete info
- Resend consent button

## Technical Decisions
- Reuse AthleteForm component
- API: PUT /api/athletes/{id}
- API: POST /api/athletes/{id}/resend-consent

## Acceptance Criteria
- [ ] Form loads with existing data
- [ ] Updates save successfully
- [ ] Resend consent works

## Files to Create
- `src/pages/EditAthletePage.jsx`

## Estimated Complexity
**Size**: S (1-2 hours)
