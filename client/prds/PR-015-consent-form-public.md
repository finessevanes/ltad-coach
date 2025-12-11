---
id: FE-015
depends_on: [FE-002, FE-005]
blocks: []
---

# FE-015: Consent Form (Public Page)

## Scope
- Public page (no auth)
- Display athlete name, coach name
- Legal language
- Signature checkbox
- Submit consent

## Technical Decisions
- API: GET /api/consent/{token}
- API: POST /api/consent/{token}/sign
- Public route

## Acceptance Criteria
- [ ] Loads via unique token URL
- [ ] Displays form
- [ ] Submit works
- [ ] Shows confirmation

## Files to Create
- `src/pages/ConsentFormPage.jsx`

## Estimated Complexity
**Size**: M (2 hours)
