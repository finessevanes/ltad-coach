COMPLETED
---
id: FE-020
depends_on: [FE-014, FE-005]
blocks: []
status: COMPLETED
---

# FE-020: Video Upload UI (Backup Flow)

## Scope
- File picker
- Drag-and-drop
- Format validation
- Upload progress

## Technical Decisions
- Accept: .mp4, .mov, .avi, .m4v
- Max size: 100MB
- API: POST /api/assessments/upload-video

## Acceptance Criteria
- [ ] File picker works
- [ ] Drag-drop works
- [ ] Validates format and size
- [ ] Progress bar displays
- [ ] Proceeds to analysis

## Files to Create
- `src/pages/UploadVideoPage.jsx`
- `src/components/Assessment/FileUploader.jsx`

## Estimated Complexity
**Size**: M (2 hours)
