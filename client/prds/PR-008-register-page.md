---
id: FE-008
depends_on: [FE-004, FE-005]
blocks: []
---

# FE-008: Register Page

## Scope
- Registration form (name, email, password)
- Google OAuth option
- Link to login page
- Call backend /auth/token after Firebase registration

## Technical Decisions
- Create user in Firebase Auth
- Call backend to create user document
- Redirect to dashboard

## Acceptance Criteria
- [ ] Registration form works
- [ ] Backend user created
- [ ] Redirects to dashboard

## Files to Create
- `src/pages/RegisterPage.jsx`

## Estimated Complexity
**Size**: M (2-3 hours)
