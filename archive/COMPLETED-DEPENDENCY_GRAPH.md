-- ✅ COMPLETE --
# AI Coach MVP - Dependency Graph

This document shows the execution order for all PRs. **Deployment must be done in Phase 0** as specified.

> **Implementation Note (December 2025)**: Phase 6 was implemented differently than originally planned. See [Phase 6 Implementation Notes](#phase-6-implementation-notes) below for details.

## Visual Dependency Graph

```
Phase 0: Infrastructure (MUST BE FIRST - Deployment) ✅ COMPLETE
═══════════════════════════════════════════════════
    BE-001 ✅ ───────────────────────────────────┐
    (Backend Setup + Render Deploy)              │
                                                 │
    FE-001 ✅ ───────────────────────────────────┤
    (Frontend Setup + Vercel Deploy)             │
                                                 │
                    ┌────────────────────────────┘
                    ▼
Phase 1: Foundation ✅ COMPLETE
═══════════════════════════════════════════════════
    BE-002 ✅ ◄─── BE-001
    (Firebase Integration)

    FE-002 ✅ ◄─── FE-001
    (Firebase Auth Client)

                    ▼
Phase 2: Authentication ✅ COMPLETE
═══════════════════════════════════════════════════
    BE-003 ✅ ◄─── BE-001, BE-002
    (Auth Endpoints)

    FE-003 ✅ ◄─── FE-001, FE-002
    (Login/Register UI)

                    ▼
Phase 3: Athlete Management ✅ COMPLETE
═══════════════════════════════════════════════════
    BE-004 ✅ ◄─── BE-002, BE-003
    (Athlete CRUD)

    FE-004 ✅ ◄─── FE-002, FE-003
    (Athletes List)

    FE-005 ✅ ◄─── FE-002, FE-004
    (Add/Edit Athlete)

                    ▼
Phase 4: Consent Workflow ✅ COMPLETE
═══════════════════════════════════════════════════
    BE-005 ✅ ◄─── BE-002, BE-004
    (Consent + Email)

    FE-006 ✅ ◄─── FE-001      (No auth needed - public)
    (Public Consent Form)

    FE-007 ✅ ◄─── FE-004, FE-005
    (Consent Status UI)

                    ▼
Phase 5: Video Capture (Frontend Heavy) ✅ COMPLETE
═══════════════════════════════════════════════════
    FE-008 ✅ ◄─── FE-002, FE-007
    (Camera + MediaPipe Preview)

    FE-009 ✅ ◄─── FE-008
    (Recording Flow)

    FE-010 ✅ ◄─── FE-002
    (Video Upload)

                    ▼
Phase 6: CV Analysis ✅ COMPLETE (IMPLEMENTED DIFFERENTLY)
═══════════════════════════════════════════════════
    BE-006 ✅ ◄─── BE-002, BE-003, BE-004
    (Assessment Endpoint - receives client metrics)

    BE-007 ⚠️ ◄─── BE-006
    (MediaPipe Analysis - CLIENT-SIDE INSTEAD)

    BE-008 ⚠️ ◄─── BE-007
    (Metrics Calculation - DURATION SCORING ONLY)

                    ▼
Phase 7: AI Agents (Backend) ✅ COMPLETE
═══════════════════════════════════════════════════
    BE-009 ✅ ◄─── BE-008
    (Orchestrator + Compression)

    BE-010 ✅ ◄─── BE-009
    (Assessment Agent)

    BE-011 ✅ ◄─── BE-009, BE-010
    (Progress Agent)

                    ▼
Phase 8: Assessment Results ✅ COMPLETE
═══════════════════════════════════════════════════
    BE-012 ✅ ◄─── BE-006, BE-008, BE-010
    (Assessment CRUD)

    FE-011 ✅ ◄─── FE-009, FE-010
    (Results Display)

    FE-012 ✅ ◄─── FE-004, FE-011
    (Athlete Profile)

                    ▼
Phase 9: Parent Reports ✅ COMPLETE
═══════════════════════════════════════════════════
    BE-013 ✅ ◄─── BE-011, BE-012
    (Report Generation + PIN)

    BE-014 ✅ ◄─── BE-005, BE-013
    (Report Email)

    FE-013 ✅ ◄─── FE-004, FE-011, FE-012
    (Report Preview + Send)

    FE-014 ✅ ◄─── FE-001      (No auth needed - public)
    (Public Report View)

                    ▼
Phase 10: Dashboard & Polish ✅ COMPLETE
═══════════════════════════════════════════════════
    BE-015 ✅ ◄─── BE-004, BE-012
    (Dashboard Endpoint)

    FE-015 ✅ ◄─── FE-002, FE-004, FE-005, FE-011, BE-015
    (Coach Dashboard)

    FE-016 ✅ ◄─── FE-001      (No auth needed - public)
    (Landing Page)

    FE-017 ✅ ◄─── FE-002, FE-011
    (Assessments List Page)
```

## Execution Order (Flat List)

### Parallelizable Groups

Items in the same group can be worked on in parallel by different engineers.

| Phase | Group | PRs | Description | Est. Hours | Status |
|-------|-------|-----|-------------|------------|--------|
| 0 | A | BE-001, FE-001 | Infrastructure + Deployment | 4-6 | ✅ Done |
| 1 | B | BE-002, FE-002 | Firebase Integration | 4-6 | ✅ Done |
| 2 | C | BE-003, FE-003 | Authentication | 5-7 | ✅ Done |
| 3 | D | BE-004, FE-004 | Athlete Base | 6-8 | ✅ Done |
| 3 | E | FE-005 | Add/Edit Forms | 2-3 | ✅ Done |
| 4 | F | BE-005, FE-006, FE-007 | Consent Workflow | 7-9 | ✅ Done |
| 5 | G | FE-008, FE-009, FE-010 | Video Capture | 10-12 | ✅ Done |
| 6 | H | BE-006, BE-007, BE-008 | CV Analysis | 13-16 | ⚠️ Different |
| 7 | I | BE-009, BE-010, BE-011 | AI Agents | 10-12 | ✅ Done |
| 8 | J | BE-012, FE-011, FE-012 | Results & Profile | 10-12 | ✅ Done |
| 9 | K | BE-013, BE-014, FE-013, FE-014 | Parent Reports | 12-14 | ✅ Done |
| 10 | L | BE-015, FE-015, FE-016, FE-017 | Dashboard + Landing + List | 9-12 | ✅ Done |

**Total Estimated Hours: 88-115 hours**

## Critical Path

The minimum sequential path that determines total project duration:

```
BE-001 → BE-002 → BE-003 → BE-004 → BE-006 → BE-009 → BE-010 → BE-012 → BE-013 → BE-015
                                        ↑
                         (BE-007/BE-008 moved to client-side)

FE-001 → FE-002 → FE-003 → FE-004 → FE-008 → FE-009 → FE-011 → FE-012 → FE-013 → FE-015
                                        ↑
                    (Client now calculates all metrics here)
```

> **Note**: BE-007 (MediaPipe Analysis) and BE-008 (full Metrics Calculation) were moved to the client-side. The critical path for remaining work skips these backend items.

## Recommended Execution Strategy

### With 2 Engineers (Frontend + Backend)

```
Week 1:
├── BE Engineer: BE-001 → BE-002 → BE-003 → BE-004
└── FE Engineer: FE-001 → FE-002 → FE-003 → FE-004 → FE-005

Week 2:
├── BE Engineer: BE-005 → BE-006 → BE-007
└── FE Engineer: FE-006 → FE-007 → FE-008 → FE-009 → FE-010

Week 3:
├── BE Engineer: BE-008 → BE-009 → BE-010 → BE-011
└── FE Engineer: FE-011 → FE-012

Week 4:
├── BE Engineer: BE-012 → BE-013 → BE-014
└── FE Engineer: FE-013 → FE-014 → FE-015
```

### With 3 Engineers

```
Week 1-2:
├── BE Engineer 1: BE-001 → BE-002 → BE-003 → BE-004 → BE-005
├── BE Engineer 2: (after BE-006) BE-006 → BE-007 → BE-008
└── FE Engineer: FE-001 → FE-002 → FE-003 → FE-004 → FE-005 → FE-006 → FE-007

Week 2-3:
├── BE Engineer 1: BE-009 → BE-010 → BE-011
├── BE Engineer 2: BE-012 → BE-013 → BE-014
└── FE Engineer: FE-008 → FE-009 → FE-010 → FE-011 → FE-012

Week 3-4:
└── FE Engineer: FE-013 → FE-014 → FE-015
```

## PR Summary

### Backend PRs (15 total)

| ID | Name | Complexity | Dependencies | Status |
|----|------|------------|--------------|--------|
| BE-001 | Project Setup + Render Deploy | S | None | ✅ Done |
| BE-002 | Firebase Integration | S | BE-001 | ✅ Done |
| BE-003 | Auth Endpoints | S | BE-001, BE-002 | ✅ Done |
| BE-004 | Athlete CRUD | M | BE-002, BE-003 | ✅ Done |
| BE-005 | Consent + Email | M | BE-002, BE-004 | ✅ Done |
| BE-006 | Assessment Endpoint | M | BE-002, BE-003, BE-004 | ✅ Done |
| BE-007 | MediaPipe Analysis | L | BE-006 | ⚠️ Client-side |
| BE-008 | Metrics Calculation | M | BE-007 | ⚠️ Duration only |
| BE-009 | Orchestrator + Compression | M | BE-008 | ✅ Done |
| BE-010 | Assessment Agent | S | BE-009 | ✅ Done |
| BE-011 | Progress Agent | S | BE-009, BE-010 | ✅ Done |
| BE-012 | Assessment CRUD | S | BE-006, BE-008, BE-010 | ✅ Done |
| BE-013 | Report Generation + PIN | M | BE-011, BE-012 | ✅ Done |
| BE-014 | Report Email | S | BE-005, BE-013 | ✅ Done |
| BE-015 | Dashboard Endpoint | S | BE-002, BE-004, BE-012 | ✅ Done |

### Frontend PRs (17 total)

| ID | Name | Complexity | Dependencies | Status |
|----|------|------------|--------------|--------|
| FE-001 | Project Setup + Vercel Deploy | S | None | ✅ Done |
| FE-002 | Firebase Auth Client | S | FE-001 | ✅ Done |
| FE-003 | Login/Register Pages | S | FE-001, FE-002 | ✅ Done |
| FE-004 | Athletes List | S | FE-002, FE-003 | ✅ Done |
| FE-005 | Add/Edit Athlete Forms | S | FE-002, FE-004 | ✅ Done |
| FE-006 | Public Consent Form | S | FE-001 | ✅ Done |
| FE-007 | Consent Status UI | S | FE-004, FE-005 | ✅ Done |
| FE-008 | Camera + MediaPipe Preview | M | FE-002, FE-007 | ✅ Done |
| FE-009 | Recording Flow | M | FE-008 | ✅ Done |
| FE-010 | Video Upload | M | FE-002 | ✅ Done |
| FE-011 | Assessment Results | M | FE-009, FE-010 | ✅ Done |
| FE-012 | Athlete Profile + History | M | FE-004, FE-011 | ✅ Done |
| FE-013 | Report Preview + Send | S | FE-004, FE-011, FE-012 | ✅ Done |
| FE-014 | Public Report View | S | FE-001 | ✅ Done |
| FE-015 | Coach Dashboard | S | FE-002, FE-004, FE-005, FE-011 | ✅ Done |
| FE-016 | Landing Page | S | FE-001 | ✅ Done |
| FE-017 | Assessments List Page | S | FE-002, FE-011 | ✅ Done |

## Complexity Legend

- **S (Small)**: 2-3 hours
- **M (Medium)**: 3-5 hours
- **L (Large)**: 6-8 hours

## Integration Points

These are key moments where frontend and backend must sync:

1. **After Phase 2**: Auth flow end-to-end testing
2. **After Phase 4**: Consent workflow end-to-end testing
3. **After Phase 8**: Full assessment flow testing
4. **After Phase 9**: Parent report flow testing

## Risk Mitigation

### High-Risk PRs

1. **BE-007 (MediaPipe Analysis)**: Most complex backend work
   - Mitigation: Start early, have fallback with mock data

2. **FE-008/FE-009 (Camera + Recording)**: Browser compatibility
   - Mitigation: Test on target browsers early

3. **BE-009/BE-010/BE-011 (AI Agents)**: External API dependency
   - Mitigation: Have fallback responses, mock during development

### Dependencies on External Services

- Firebase: Required for all auth and data
- OpenRouter: Required for AI features (can mock)
- Resend: Required for emails (can mock)
- Render/Vercel: Required for deployment

---

## Phase 6 Implementation Notes

Phase 6 (CV Analysis) was implemented differently than originally planned in the PRD. This section documents the changes.

### Original Plan (PRD)

```
Client (preview only) → Upload video → Backend MediaPipe Python →
Calculate all metrics → AI Agents → Store results
```

- **BE-007**: Server-side MediaPipe Python extracts 33 landmarks from video
- **BE-008**: Backend calculates all 11 metrics using biomechanical formulas
- Background processing with async tasks
- Client polls for completion

### Actual Implementation

```
Client MediaPipe.js (SOURCE OF TRUTH) → Calculate all metrics →
POST to backend → Backend validates + adds duration score → Store immediately
```

- **BE-007**: NOT IMPLEMENTED - MediaPipe runs CLIENT-SIDE in `useMediaPipe` hook
- **BE-008**: Only duration scoring (1-5 LTAD scale) implemented in `services/metrics.py`
- Synchronous processing - no background tasks
- No polling needed - assessment completes immediately

### Key Changes

| Component | PRD Plan | Actual Implementation |
|-----------|----------|----------------------|
| MediaPipe | Server-side Python | Client-side JavaScript |
| Metrics Calculation | Backend | Client (`utils/metricsCalculation.ts`) |
| Failure Detection | Backend | Client (`utils/positionDetection.ts`) |
| Processing Model | Async background | Synchronous |
| Backend Role | Full analysis | Validated write proxy |

### Why the Change?

1. **Better UX**: Immediate results instead of waiting for processing
2. **Simpler Backend**: No MediaPipe Python, OpenCV, or SciPy dependencies
3. **Lower Infrastructure Cost**: No compute-intensive video processing
4. **Reduced Complexity**: No async task management or polling logic

### Status Legend

- ✅ = Implemented as planned
- ⚠️ = Implemented differently (see notes)
- ⏳ = Partially implemented
- (empty) = Not yet implemented
