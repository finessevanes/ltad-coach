# AI Coach MVP - Dependency Graph

This document shows the execution order for all PRs. **Deployment must be done in Phase 0** as specified.

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
Phase 5: Video Capture (Frontend Heavy)
═══════════════════════════════════════════════════
    FE-008 ◄─── FE-002, FE-007
    (Camera + MediaPipe Preview)

    FE-009 ◄─── FE-008
    (Recording Flow)

    FE-010 ◄─── FE-002
    (Video Upload)

                    ▼
Phase 6: CV Analysis (Backend Heavy)
═══════════════════════════════════════════════════
    BE-006 ◄─── BE-002, BE-003, BE-004
    (Video Upload Endpoint)

    BE-007 ◄─── BE-006
    (MediaPipe Analysis)

    BE-008 ◄─── BE-007
    (Metrics Calculation)

                    ▼
Phase 7: AI Agents (Backend)
═══════════════════════════════════════════════════
    BE-009 ◄─── BE-008
    (Orchestrator + Compression)

    BE-010 ◄─── BE-009
    (Assessment Agent)

    BE-011 ◄─── BE-009, BE-010
    (Progress Agent)

                    ▼
Phase 8: Assessment Results
═══════════════════════════════════════════════════
    BE-012 ◄─── BE-006, BE-008, BE-010
    (Assessment CRUD)

    FE-011 ◄─── FE-009, FE-010
    (Results Display)

    FE-012 ◄─── FE-004, FE-011
    (Athlete Profile)

                    ▼
Phase 9: Parent Reports
═══════════════════════════════════════════════════
    BE-013 ◄─── BE-011, BE-012
    (Report Generation + PIN)

    BE-014 ◄─── BE-005, BE-013
    (Report Email)

    FE-013 ◄─── FE-004, FE-011, FE-012
    (Report Preview + Send)

    FE-014 ◄─── FE-001      (No auth needed - public)
    (Public Report View)

                    ▼
Phase 10: Dashboard & Polish
═══════════════════════════════════════════════════
    BE-015 ◄─── BE-004, BE-012
    (Dashboard Endpoint)

    FE-015 ◄─── FE-002, FE-004, FE-005, FE-011, BE-015
    (Coach Dashboard)

    FE-016 ◄─── FE-001      (No auth needed - public)
    (Landing Page)
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
| 5 | G | FE-008, FE-009, FE-010 | Video Capture | 10-12 | |
| 6 | H | BE-006, BE-007, BE-008 | CV Analysis | 13-16 | |
| 7 | I | BE-009, BE-010, BE-011 | AI Agents | 10-12 | |
| 8 | J | BE-012, FE-011, FE-012 | Results & Profile | 10-12 | |
| 9 | K | BE-013, BE-014, FE-013, FE-014 | Parent Reports | 12-14 | |
| 10 | L | BE-015, FE-015, FE-016 | Dashboard + Landing | 7-9 | |

**Total Estimated Hours: 86-112 hours**

## Critical Path

The minimum sequential path that determines total project duration:

```
BE-001 → BE-002 → BE-003 → BE-004 → BE-006 → BE-007 → BE-008 → BE-009 → BE-010 → BE-012 → BE-013 → BE-015
   ↓
FE-001 → FE-002 → FE-003 → FE-004 → FE-008 → FE-009 → FE-011 → FE-012 → FE-013 → FE-015
```

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
| BE-006 | Video Upload Endpoint | M | BE-002, BE-003, BE-004 | |
| BE-007 | MediaPipe Analysis | L | BE-006 | |
| BE-008 | Metrics Calculation | M | BE-007 | |
| BE-009 | Orchestrator + Compression | M | BE-008 | |
| BE-010 | Assessment Agent | S | BE-009 | |
| BE-011 | Progress Agent | S | BE-009, BE-010 | |
| BE-012 | Assessment CRUD | S | BE-006, BE-008, BE-010 | |
| BE-013 | Report Generation + PIN | M | BE-011, BE-012 | |
| BE-014 | Report Email | S | BE-005, BE-013 | |
| BE-015 | Dashboard Endpoint | S | BE-002, BE-004, BE-012 | |

### Frontend PRs (16 total)

| ID | Name | Complexity | Dependencies | Status |
|----|------|------------|--------------|--------|
| FE-001 | Project Setup + Vercel Deploy | S | None | ✅ Done |
| FE-002 | Firebase Auth Client | S | FE-001 | ✅ Done |
| FE-003 | Login/Register Pages | S | FE-001, FE-002 | ✅ Done |
| FE-004 | Athletes List | S | FE-002, FE-003 | ✅ Done |
| FE-005 | Add/Edit Athlete Forms | S | FE-002, FE-004 | ✅ Done |
| FE-006 | Public Consent Form | S | FE-001 | ✅ Done |
| FE-007 | Consent Status UI | S | FE-004, FE-005 | ✅ Done |
| FE-008 | Camera + MediaPipe Preview | M | FE-002, FE-007 | |
| FE-009 | Recording Flow | M | FE-008 | |
| FE-010 | Video Upload | M | FE-002 | |
| FE-011 | Assessment Results | M | FE-009, FE-010 | |
| FE-012 | Athlete Profile + History | M | FE-004, FE-011 | |
| FE-013 | Report Preview + Send | S | FE-004, FE-011, FE-012 | |
| FE-014 | Public Report View | S | FE-001 | |
| FE-015 | Coach Dashboard | S | FE-002, FE-004, FE-005, FE-011 | |
| FE-016 | Landing Page | S | FE-001 | |

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
