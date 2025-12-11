COMPLETED
---
id: FE-024
depends_on: [FE-014, FE-005]
blocks: [FE-025]
status: COMPLETED
---

# FE-024: Report Preview UI

**COMPLETED**

## Scope
- Generate report preview
- Display parent-friendly content
- Send button

## Technical Decisions
- API: POST /api/reports/generate/{athleteId}
- Display in modal or page

## Acceptance Criteria
- [ ] Generates preview
- [ ] Content displays nicely
- [ ] Send button works

## Files to Create
- `src/components/Reports/ReportPreview.jsx`
- `src/pages/ReportPreviewPage.jsx`

## Estimated Complexity
**Size**: M (2 hours)
