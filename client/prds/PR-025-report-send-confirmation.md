---
id: FE-025
depends_on: [FE-024]
blocks: []
---

# FE-025: Report Send Confirmation

## Scope
- Confirm parent email
- Send button
- Success confirmation with PIN display

## Technical Decisions
- API: POST /api/reports/{id}/send
- Show success message + PIN

## Acceptance Criteria
- [ ] Confirms email
- [ ] Sends successfully
- [ ] Displays PIN for reference

## Files to Create
- `src/components/Reports/SendConfirmation.jsx`

## Estimated Complexity
**Size**: S (1 hour)
