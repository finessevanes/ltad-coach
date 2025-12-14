# Two-Leg Balance Implementation: PRD Index

> **Feature**: Transform single-leg balance test into sequential two-leg flow with bilateral symmetry analysis

## Overview

This directory index contains 13 PRD documents (7 frontend, 6 backend) that implement the dual-leg balance testing feature for the LTAD Coach platform. Each PRD is designed to be independently implementable with clear acceptance criteria, complete code examples, and comprehensive testing instructions.

**Total Estimated Time**: 47 hours sequential / ~15 hours with 3 full-stack developers

## PRD Index (Implementation Order)

| Phase | ID | Name | Layer | Complexity | Est. Hours | Status |
|-------|----|----|------|------------|-----------|---------|
| **Foundation** | [BE-016](./backend/prds/BE-016-dual-leg-data-models.md) | Data Models for Dual-Leg Assessments | Backend | M | 4h | ✅ Complete |
| | [FE-018](./client/prds/FE-018-dual-leg-type-definitions.md) | Type Definitions for Dual-Leg Flow | Frontend | S | 2-3h | ✅ Complete |
| **Components** | [FE-019](./client/prds/FE-019-transition-modal.md) | TransitionModal Component | Frontend | S | 2-3h | ✅ Complete |
| | [FE-020](./client/prds/FE-020-recording-step-autostart.md) | RecordingStep AutoStart Enhancement | Frontend | S | 2-3h | ✅ Complete |
| **Services** | [BE-017](./backend/prds/BE-017-bilateral-comparison-service.md) | Bilateral Comparison Service | Backend | M | 4h | ✅ Complete |
| | [BE-021](./backend/prds/BE-021-bilateral-static-context.md) | Static Context - Bilateral Benchmarks | Backend | S | 2h | ✅ Complete |
| **Upload** | [FE-021](./client/prds/FE-021-two-leg-upload-step.md) | TwoLegUploadStep Component | Frontend | M | 4h | ✅ Complete |
| **Data Layer** | [BE-018](./backend/prds/BE-018-dual-leg-repository.md) | Dual-Leg Assessment Repository | Backend | S | 2-3h | ✅ Complete |
| **API** | [BE-019](./backend/prds/BE-019-assessment-api-dual-leg.md) | Assessment API Endpoint - Dual-Leg Support | Backend | M | 4h | ✅ Complete |
| **Integration** | [FE-022](./client/prds/FE-022-assessment-flow-refactor.md) | AssessmentFlow State Machine Refactor | Frontend | L | 6h | ✅ Complete |
| **Results** | [FE-023](./client/prds/FE-023-two-leg-results-view.md) | TwoLegResultsView Component | Frontend | L | 6h | ✅ Complete |
| | [FE-024](./client/prds/FE-024-assessment-results-routing.md) | AssessmentResults Routing Logic | Frontend | S | 2h | ✅ Complete |
| **AI** | [BE-020](./backend/prds/BE-020-bilateral-ai-agent.md) | Bilateral Assessment AI Agent | Backend | M | 4h | ✅ Complete |

## Dependency Graph (Full-Stack View)

```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1: FOUNDATION ✅ COMPLETE (6-7h)                         │
└─────────────────────────────────────────────────────────────────┘
    BE-016 ✅ (Data Models) ────► FE-018 ✅ (Type Definitions)
            │
            └───────────────┬─────────────────┬──────────────────┐
                            │                 │                  │
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2: COMPONENTS & SERVICES ✅ COMPLETE (4h with 4 devs)    │
└─────────────────────────────────────────────────────────────────┘
                      FE-019 ✅       FE-020 ✅       FE-021 ✅
                   (Transition)   (AutoStart)     (TwoLegUpload)
                                                        │
                   BE-017 ✅       BE-021 ✅            │
                (Comparison)   (Static Context)         │
                      │              │                  │
                      └──────┬───────┴──────────────────┘
                             │
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3: DATA & API ✅ COMPLETE (Sequential - 6-7h)           │
└─────────────────────────────────────────────────────────────────┘
                    BE-018 ✅ (Repository)
                             │
                    BE-019 ✅ (API Endpoint)
                             │
                    ┌────────┴─────────┐
                    │                  │
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 4: INTEGRATION & AI ✅ COMPLETE (Parallel - 6h with 3 devs) │
└─────────────────────────────────────────────────────────────────┘
              FE-022 ✅         FE-023 ✅        FE-024 ✅
           (AssessmentFlow) (ResultsView)   (Routing)

                        BE-020 ✅ (AI Agent)
```

## Timeline Estimates

### Sequential Execution (1 Full-Stack Developer)
```
Phase 1:  BE-016 + FE-018           6-7 hours  ✅ COMPLETE
Phase 2:  Components + Services     18 hours   ✅ COMPLETE
Phase 3:  Data Layer + API          6-7 hours  ✅ COMPLETE
Phase 4:  Integration + AI          16 hours   ✅ COMPLETE
──────────────────────────────────────────────
TOTAL:                              ~47 hours (~6 working days)
REMAINING:                          0 hours - ALL COMPLETE! 🎉
```

### Parallel Execution (3 Full-Stack Developers)
```
Phase 1:  Foundation                6-7 hours  (sequential)  ✅ COMPLETE
Phase 2:  4 parallel tracks         4 hours    (parallelized) ✅ COMPLETE
Phase 3:  Data + API                6-7 hours  (sequential)   ✅ COMPLETE
Phase 4:  3 parallel tracks         6 hours    (parallelized) ✅ COMPLETE
──────────────────────────────────────────────
TOTAL:                              ~23 hours  (~3 working days)
REMAINING:                          0 hours - ALL COMPLETE! 🎉
```

### Optimal Execution (4 Full-Stack Developers)
```
Phase 1:  Foundation                6-7 hours  (sequential)  ✅ COMPLETE
Phase 2:  4 parallel tracks         4 hours    (4 devs)      ✅ COMPLETE
Phase 3:  Data + API                6-7 hours  (sequential)  ✅ COMPLETE
Phase 4:  4 parallel tracks         4 hours    (4 devs)      ✅ COMPLETE
──────────────────────────────────────────────
TOTAL:                              ~21 hours  (~2.5 working days)
REMAINING:                          0 hours - ALL COMPLETE! 🎉
```

## Implementation Strategy

### Phase 1: Foundation ✅ COMPLETE (2025-12-14)
**Duration**: 6-7 hours | **Status**: ✅ Complete

1. **BE-016**: Data Models for Dual-Leg Assessments ✅
   - Pydantic models with dual-leg fields
   - Backward-compatible with existing assessments
   - **Unblocks**: All backend PRDs + FE-018

2. **FE-018**: Type Definitions for Dual-Leg Flow ✅
   - TypeScript interfaces mirroring BE-016
   - `DualLegMetrics`, `BilateralComparison` types
   - **Unblocks**: All frontend PRDs

### Phase 2: Components & Services ✅ COMPLETE (2025-12-14)
**Duration**: 4 hours with 4 developers | **Status**: ✅ Complete

**Track A (Frontend Components)**:
- **FE-019**: TransitionModal ✅
  - Modal dialog for left→right leg transition
  - Success/failure display with hold time
  - Continue and reshoot options
- **FE-020**: RecordingStep AutoStart ✅
  - `autoStart` prop to skip setup phase
  - `instructionText` prop for custom banner
  - Auto-start on person detection with 1s delay
- **FE-021**: TwoLegUploadStep ✅
  - Sequential video upload (left then right)
  - Client-side symmetry calculation
  - Dual-leg assessment submission

**Track B (Backend Services)**:
- **BE-017**: Bilateral Comparison Service ✅
  - Symmetry score calculation (0-100)
  - Dominant leg detection (20% threshold)
  - Weighted formula: 50% duration, 30% sway, 10% arms, 10% corrections
- **BE-021**: Static Context - Bilateral Benchmarks ✅
  - Age-based asymmetry expectations (5-7, 8-9, 10-11, 12-13)
  - Training splits (50/50, 60/40, 70/30)
  - 3,747 characters of bilateral coaching guidance

### Phase 3: Data Layer & API ✅ COMPLETE (2025-12-14)
**Duration**: 6-7 hours | **Status**: ✅ Complete

1. **BE-018**: Dual-Leg Assessment Repository ✅
   - Added `create_completed_dual_leg()` method to AssessmentRepository
   - Stores dual-leg assessments with bilateral comparison data
   - Preserves temporal data in both left and right leg metrics

2. **BE-019**: Assessment API Endpoint ✅
   - Refactored `/assessments/analyze` endpoint with routing logic
   - Added `_process_dual_leg_assessment()` handler
   - Added `_build_metrics_dict()` helper function
   - Routes based on `leg_tested` value (single vs dual)
   - Validates dual-leg requirements and calculates bilateral comparison

### Phase 4: Integration & AI ✅ COMPLETE (2025-12-14)
**Duration**: 6 hours with 4 developers | **Status**: ✅ Complete

**Track C (Frontend Integration)**:
- **FE-022**: AssessmentFlow State Machine ✅
- **FE-023**: TwoLegResultsView ✅
- **FE-024**: AssessmentResults Routing ✅

**Track D (Backend AI)**:
- **BE-020**: Bilateral AI Agent ✅

## Critical Dependencies

### Backend → Frontend
| Backend PRD | Frontend Consumer | What It Enables |
|-------------|-------------------|-----------------|
| BE-016 | FE-018 | Type definitions mirror backend models |
| BE-017 | FE-023 | Results view displays backend-calculated symmetry |
| BE-019 | FE-021 | Upload component POSTs to `/assessments/analyze` |
| BE-020 | FE-023 | AI bilateral feedback rendered in results view |

### Within Backend
```
BE-016 ──► BE-017 ──► BE-018 ──► BE-019 ──► BE-020
   │                                           ▲
   └───────────────► BE-021 ───────────────────┘
```

### Within Frontend
```
FE-018 ──┬──► FE-019
         ├──► FE-020
         └──► FE-021 ──► FE-022 ──┬──► FE-023
                                   └──► FE-024
```

## Getting Started

### For Individual Contributors

1. **Check dependencies**: Review the dependency graph above
2. **Pick a track**: Choose based on your full-stack comfort level
3. **Read the PRD**: Understand scope, technical decisions, acceptance criteria
4. **Implement**: Follow code examples (complete, not pseudocode)
5. **Test**: Run both unit tests and manual browser/REPL tests
6. **Mark complete**: Update PRD status after all criteria met

### For Team Leads (3-4 Developers)

**Week 1, Day 1 (6-7 hours)**: ✅ COMPLETE
- ~~Assign Phase 1 to most senior dev (foundation work)~~
- Phase 1 completed: BE-016 + FE-018

**Week 1, Day 2 (4 hours)**: ✅ COMPLETE
- ~~Assign Phase 2 tracks to 4 devs in parallel~~
- ~~Dev 1: FE-019 (TransitionModal)~~
- ~~Dev 2: FE-020 (RecordingStep)~~
- ~~Dev 3: FE-021 (TwoLegUploadStep)~~
- ~~Dev 4: BE-017 + BE-021 (Services)~~

**Week 1, Day 3 (6-7 hours)**: ✅ COMPLETE
- ~~Assign Phase 3 to backend-focused dev (sequential work)~~
- ~~Dev 4: BE-018 → BE-019~~

**Week 2, Day 1 (6 hours)**: ✅ COMPLETE
- ~~Assign Phase 4 tracks to 4 devs in parallel~~
- ~~Dev 1: FE-022 (AssessmentFlow)~~
- ~~Dev 2: FE-023 (ResultsView)~~
- ~~Dev 3: FE-024 (Routing)~~
- ~~Dev 4: BE-020 (AI Agent)~~

**Total**: ~23 hours across 2-3 working days - ✅ ALL PHASES COMPLETE!

## Key Technical Decisions

### Breaking Changes (Accepted for Development Phase)

**Field Renaming**:
- Backend: `video_url` → `left_video_url`, `video_path` → `left_video_path`, `duration` → `left_duration`
- Frontend: `videoUrl` → `leftVideoUrl`, `videoPath` → `leftVideoPath`, `duration` → `leftDuration`

**Rationale**: Consistency across single-leg and dual-leg modes; eliminates ambiguity

**Impact**: All assessment creation payloads must be updated

### Data Storage Strategy

**Single assessment document**:
- One Firestore document per dual-leg test
- Fields: `left_leg_metrics`, `right_leg_metrics`, `bilateral_comparison`
- No separate documents for left/right legs

**Backward Compatibility**:
- Old assessments use `video_url`, `metrics` (single-leg)
- New `Assessment` model makes all dual-leg fields optional
- Reading old data: `video_url or left_leg_video_url` pattern

### Symmetry Score Calculation

**Weighted formula** (BE-017):
```python
overall_symmetry = (
    duration_symmetry * 0.50 +  # 50% weight
    sway_symmetry * 0.30 +      # 30% weight
    arm_symmetry * 0.10 +       # 10% weight
    corrections_symmetry * 0.10  # 10% weight
) * 100  # Scale to 0-100
```

**Thresholds**:
- **Excellent**: ≥85
- **Good**: 70-84
- **Fair**: 50-69
- **Poor**: <50

### UI/UX Flow

**No Stepper component**: Direct to camera for faster flow
**Modal transition**: Brief pause between legs with summary + continue button
**No video review**: Auto-proceed after each leg completes
**Single assessment**: One document with dual metrics + bilateral comparison

## File Structure

```
ltad-coach/
├── backend/app/
│   ├── models/
│   │   └── assessment.py                      # BE-016: Updated models
│   ├── services/
│   │   └── bilateral_comparison.py            # BE-017: NEW service
│   ├── repositories/
│   │   └── assessment.py                      # BE-018: Updated repository
│   ├── routers/
│   │   └── assessments.py                     # BE-019: Updated endpoint
│   ├── agents/
│   │   ├── bilateral_assessment.py            # BE-020: NEW agent
│   │   └── orchestrator.py                    # BE-020: Updated orchestrator
│   └── prompts/
│       └── static_context.py                  # BE-021: Updated context
│
├── client/src/
│   ├── types/
│   │   └── assessment.ts                      # FE-018: Updated types
│   ├── pages/Assessment/
│   │   ├── AssessmentFlow.tsx                 # FE-022: Refactored flow
│   │   ├── AssessmentResults.tsx              # FE-024: Updated routing
│   │   ├── steps/
│   │   │   └── RecordingStep.tsx              # FE-020: Enhanced autostart
│   │   └── components/
│   │       ├── TransitionModal.tsx            # FE-019: NEW modal
│   │       ├── TwoLegUploadStep.tsx           # FE-021: NEW upload step
│   │       └── TwoLegResultsView.tsx          # FE-023: NEW results view
```

## API Contract

### Updated Endpoint: POST `/assessments/analyze`

**Request** (dual-leg mode):
```json
{
  "athlete_id": "abc123",
  "test_type": "one_leg_balance",
  "leg_tested": "both",

  "left_video_url": "https://...",
  "left_video_path": "videos/...",
  "left_duration": 25.3,

  "right_video_url": "https://...",
  "right_video_path": "videos/...",
  "right_duration": 23.8,

  "dual_leg_metrics": {
    "left_leg": { /* ClientMetricsData */ },
    "right_leg": { /* ClientMetricsData */ }
  }
}
```

**Response**:
```json
{
  "id": "assess_xyz",
  "status": "completed",
  "message": "Bilateral assessment completed"
}
```

**Routing Logic** (BE-019):
```python
if data.leg_tested in ["left", "right"]:
    assessment = await _process_single_leg_assessment(...)
elif data.leg_tested == "both":
    assessment = await _process_dual_leg_assessment(...)
```

## Data Flow (End-to-End)

```
1. Frontend: User starts dual-leg assessment
2. Frontend: MediaPipe.js processes left leg video → metrics
3. Frontend: TransitionModal shows summary, "Continue to right leg"
4. Frontend: MediaPipe.js processes right leg video → metrics
5. Frontend: TwoLegUploadStep uploads both videos to Firebase
6. Frontend: POST /assessments/analyze with dual_leg_metrics
7. Backend: BE-019 validates, routes to _process_dual_leg_assessment()
8. Backend: BE-017 calculates bilateral_comparison
9. Backend: BE-018 stores assessment in Firestore
10. Backend: BE-020 generates AI bilateral feedback (async)
11. Backend: Returns assessment ID (status: "completed")
12. Frontend: GET /assessments/:id → display TwoLegResultsView
```

## Common Pitfalls

### 1. Starting without foundation work
❌ **Don't**: Jump to FE-019 or BE-017 without completing BE-016 + FE-018
✅ **Do**: Complete Phase 1 first (data models + types)

### 2. Inconsistent field naming
❌ **Don't**: Mix old (`videoUrl`) and new (`leftVideoUrl`) naming
✅ **Do**: Use consistent `left*` / `right*` prefixes throughout

### 3. Skipping temporal data
❌ **Don't**: Omit `fiveSecondSegments` or `events` from metrics
✅ **Do**: Include full temporal granularity for AI analysis

### 4. Breaking backward compatibility
❌ **Don't**: Remove support for `video_url` field in old assessments
✅ **Do**: Make all dual-leg fields optional; handle both formats

### 5. Hardcoding magic numbers
❌ **Don't**: Use `if score > 85` without context
✅ **Do**: Define named constants (e.g., `SYMMETRY_EXCELLENT_THRESHOLD = 85`)

## Testing Strategy

### Unit Tests (Backend)
```bash
cd backend
source venv/bin/activate
pytest tests/services/test_bilateral_comparison.py -v
```

### Integration Tests (Full-Stack)
1. Start backend: `uvicorn app.main:app --reload`
2. Start frontend: `npm run dev`
3. Navigate to `/assessment/:athleteId`
4. Complete dual-leg flow
5. Verify bilateral comparison in results

### Manual Testing Checklist
- [ ] Left leg recording → modal transition → right leg recording
- [ ] Upload progress shows both videos
- [ ] Results view displays bilateral comparison chart
- [ ] Symmetry score matches formula in BE-017
- [ ] AI feedback addresses bilateral differences
- [ ] Old single-leg assessments still load correctly

## Success Metrics

### Development Velocity
- **Target**: Complete all 13 PRDs in 2-3 working days (with 3-4 devs)
- **Actual**: _[Track progress here]_

### Code Quality
- [ ] All TypeScript type checks pass
- [ ] All Pydantic models validate
- [ ] All acceptance criteria met
- [ ] No console errors/warnings
- [ ] Unit tests pass (pytest + vitest if applicable)

### UX Validation
- [ ] Transition between legs feels smooth
- [ ] Results page loads in <3 seconds
- [ ] Bilateral comparison is visually clear
- [ ] Mobile responsive (tested on iPhone/Android)

## Environment Variables

No new environment variables required. Existing variables used:

**Backend**:
- `OPENROUTER_API_KEY`: For BE-020 (AI agent)
- `GOOGLE_APPLICATION_CREDENTIALS`: For Firestore + Storage
- `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`

**Frontend**:
- `VITE_API_URL`: Backend endpoint
- `VITE_FIREBASE_*`: Firebase config

## Support & References

### PRD Documentation
- Frontend PRDs: [client/prds/](./client/prds/)
- Backend PRDs: [backend/prds/](./backend/prds/)

### Related Docs
- [TWO_LEG_IMPLEMENTATION_PLAN.md](./TWO_LEG_IMPLEMENTATION_PLAN.md) - Original requirements
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [CLAUDE.md](./CLAUDE.md) - Development guide
- [docs/cv/CV_METRICS_TECHNICAL.md](./docs/cv/CV_METRICS_TECHNICAL.md) - Computer vision details

### Questions?
- Review "Notes" section in each PRD for design rationale
- Check dependency graph for implementation order
- Consult [ARCHITECTURE.md](./ARCHITECTURE.md) for system context

## Version History

- **v1.0** (2025-12-14): Initial PRD creation for two-leg implementation
  - All 13 PRDs marked as 🔵 READY FOR DEVELOPMENT
- **v1.1** (2025-12-14): Phase 1 Foundation Complete ✅
  - BE-016: Data Models for Dual-Leg Assessments - COMPLETE
  - FE-018: Type Definitions for Dual-Leg Flow - COMPLETE
  - All models validated, type checking passes, builds succeed
  - Backward compatibility verified
  - Breaking changes documented and fixed in UploadStep.tsx
- **v1.2** (2025-12-14): Phase 2 Components & Services Complete ✅
  - **Frontend (3 PRDs)**:
    - FE-019: TransitionModal Component - COMPLETE
    - FE-020: RecordingStep AutoStart Enhancement - COMPLETE
    - FE-021: TwoLegUploadStep Component - COMPLETE
  - **Backend (2 PRDs)**:
    - BE-017: Bilateral Comparison Service - COMPLETE
    - BE-021: Static Context - Bilateral Benchmarks - COMPLETE
  - All TypeScript/Python compilation successful
  - Functional tests passing (bilateral comparison verified)
  - Context integration complete (3,747 chars added)
- **v1.3** (2025-12-14): Phase 3 Data Layer & API Complete ✅
  - **Backend (2 PRDs)**:
    - BE-018: Dual-Leg Assessment Repository - COMPLETE
    - BE-019: Assessment API Endpoint - Dual-Leg Support - COMPLETE
  - Repository method `create_completed_dual_leg()` implemented and tested
  - API endpoint refactored with routing logic for single-leg and dual-leg
  - Helper functions `_build_metrics_dict()`, `_process_single_leg_assessment()`, `_process_dual_leg_assessment()` added
  - Python syntax validation passed
  - Bilateral comparison service integration verified
  - All temporal data preservation confirmed
- **v1.4** (2025-12-14): Phase 4 Integration & AI Complete ✅ **FEATURE COMPLETE!**
  - **Frontend (3 PRDs)**:
    - FE-022: AssessmentFlow State Machine Refactor - COMPLETE
    - FE-023: TwoLegResultsView Component - COMPLETE
    - FE-024: AssessmentResults Routing Logic - COMPLETE
  - **Backend (1 PRD)**:
    - BE-020: Bilateral Assessment AI Agent - COMPLETE
  - Phase-based state machine replaces stepper UI (left-leg-testing → transition-modal → right-leg-testing → uploading)
  - TwoLegResultsView with bilateral comparison cards, side-by-side videos, metrics table, AI feedback
  - AssessmentResults routing detects `legTested === 'both'` and renders appropriate view
  - BilateralAssessmentAgent generates 250-300 word structured feedback via Claude Sonnet
  - Orchestrator routes "bilateral_assessment" requests to new agent
  - TypeScript compilation successful (build passed)
  - Python syntax validation successful
  - All 13 PRDs implemented across 4 phases
  - **TOTAL TIME**: ~47 hours sequential / ~23 hours with 3 developers

---

**Phase 1 Status**: ✅ COMPLETE (6-7 hours)
**Phase 2 Status**: ✅ COMPLETE (18 hours sequential / 4 hours parallel)
**Phase 3 Status**: ✅ COMPLETE (6-7 hours sequential)
**Phase 4 Status**: ✅ COMPLETE (16 hours sequential / 6 hours parallel)
**ALL PHASES COMPLETE!** 🎉 Two-leg balance assessment feature fully implemented!
