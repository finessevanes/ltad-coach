COMPLETED
---
id: FE-017
depends_on: [FE-016]
blocks: [FE-018]
status: COMPLETED
---

# FE-017: MediaPipe.js Skeleton Overlay

## Scope
- MediaPipe.js integration
- Real-time pose detection
- Canvas overlay on video
- Skeleton rendering

## Technical Decisions
- MediaPipe Pose (JavaScript)
- Canvas element overlay
- 15+ FPS rendering
- Visual feedback only (not source of truth)

## Acceptance Criteria
- [ ] Skeleton displays on live video
- [ ] Updates in real-time (15+ FPS)
- [ ] Landmarks visible
- [ ] Performance acceptable

## Files to Create
- `src/components/Assessment/SkeletonOverlay.jsx`
- `src/hooks/useMediaPipe.js`

## Implementation Notes
```bash
npm install @mediapipe/pose @mediapipe/camera_utils @mediapipe/drawing_utils
```

## Estimated Complexity
**Size**: L (4 hours)
