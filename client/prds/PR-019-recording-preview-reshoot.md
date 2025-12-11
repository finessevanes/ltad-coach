COMPLETED
---
id: FE-019
depends_on: [FE-018]
blocks: []
status: COMPLETED
---

# FE-019: Recording Preview & Reshoot

## Scope
- Playback recorded video
- Analyze button
- Reshoot button
- Upload to backend

## Technical Decisions
- Video element for playback
- FormData for upload
- API: POST /api/assessments/upload-video
- Then: POST /api/assessments/analyze

## Acceptance Criteria
- [ ] Video plays back
- [ ] Analyze triggers upload & analysis
- [ ] Reshoot restarts flow
- [ ] Progress indicator during upload

## Files to Create
- `src/pages/RecordingPreviewPage.jsx`
- `src/components/Assessment/VideoPlayer.jsx`

## Estimated Complexity
**Size**: M (2-3 hours)
