COMPLETED
---
id: FE-018
depends_on: [FE-017]
blocks: [FE-019]
status: COMPLETED
---

# FE-018: Video Recording Flow

## Scope
- 3-2-1 countdown
- 20-second timer
- MediaRecorder API
- Stop button
- Record video blob (no skeleton baked in)

## Technical Decisions
- MediaRecorder API
- Separate video track (no canvas)
- WebM or MP4 format
- Store blob in state

## Acceptance Criteria
- [ ] Countdown displays
- [ ] Timer counts down from 20
- [ ] Video records successfully
- [ ] Stop button works
- [ ] Auto-stops at 0

## Files to Create
- `src/pages/RecordingPage.jsx`
- `src/components/Assessment/CountdownTimer.jsx`
- `src/hooks/useVideoRecording.js`

## Estimated Complexity
**Size**: M (3 hours)
