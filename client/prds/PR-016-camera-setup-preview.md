COMPLETED
---
id: FE-016
depends_on: [FE-014]
blocks: [FE-017]
status: COMPLETED
---

# FE-016: Camera Setup & Preview

## Scope
- Camera source selection
- getUserMedia() access
- Live video preview
- Athlete framing guide

## Technical Decisions
- Browser MediaStream API
- Video element for preview
- Camera permission handling

## Acceptance Criteria
- [ ] Camera access requested
- [ ] Live preview displays
- [ ] Camera source selectable
- [ ] Start Recording button enabled

## Files to Create
- `src/pages/CameraSetupPage.jsx`
- `src/components/Assessment/CameraPreview.jsx`
- `src/hooks/useCamera.js`

## Estimated Complexity
**Size**: M (3 hours)
