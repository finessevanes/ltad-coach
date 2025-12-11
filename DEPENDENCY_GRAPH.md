# PRD Dependency Graph

## Execution Order & Dependencies

### Layer 0: Foundation (No Dependencies)

#### Backend
- **BE-001**: Project setup (FastAPI, Python env, requirements.txt)
- **BE-002**: Firebase Admin SDK configuration
- **BE-003**: Environment variables & config management

#### Frontend
- **FE-001**: Project setup (React, Material-UI, build config)
- **FE-002**: Firebase client SDK configuration
- **FE-003**: Router setup (React Router)

---

### Layer 0.5: Early Deployment ⚡ HIGH PRIORITY (Execute Immediately After Layer 0)

#### Backend
- **BE-041**: Heroku deployment setup — *depends on: BE-001, BE-002, BE-003*
  - **Priority**: HIGH - Execute early for continuous deployment
  - Procfile, runtime.txt, environment variables
  - Live API URL for frontend integration testing
  - Health check endpoint

#### Frontend
- **FE-031**: Vercel deployment setup — *depends on: FE-001*
  - **Priority**: HIGH - Execute early for continuous deployment
  - vercel.json configuration
  - Auto-deploy on push to main
  - Preview URLs for PRs
  - Live URL for mobile testing and demos

---

### Layer 1: Core Services (Depends on Layer 0)

#### Backend
- **BE-004**: Database service wrapper (Firestore) — *depends on: BE-002*
- **BE-005**: Storage service wrapper (Firebase Storage) — *depends on: BE-002*
- **BE-006**: Authentication middleware — *depends on: BE-002, BE-004*
- **BE-007**: Email service (Resend integration) — *depends on: BE-003*

#### Frontend
- **FE-004**: Auth context provider — *depends on: FE-002*
- **FE-005**: API client service — *depends on: FE-001*
- **FE-006**: Protected route wrapper — *depends on: FE-003, FE-004*

---

### Layer 2: Authentication & User Management

#### Backend
- **BE-008**: Auth endpoints (token validation, logout) — *depends on: BE-006*

#### Frontend
- **FE-007**: Login page — *depends on: FE-004, FE-005*
- **FE-008**: Register page — *depends on: FE-004, FE-005*
- **FE-009**: Landing page (public) — *depends on: FE-001*

---

### Layer 3: Athlete Management Core

#### Backend
- **BE-009**: Athlete CRUD endpoints — *depends on: BE-006, BE-004*
- **BE-010**: Consent token generation — *depends on: BE-009, BE-007*
- **BE-011**: Consent form endpoints (public) — *depends on: BE-010, BE-004*

#### Frontend
- **FE-010**: Coach dashboard skeleton — *depends on: FE-006*
- **FE-011**: Athletes list page — *depends on: FE-010, FE-005*
- **FE-012**: Add athlete form — *depends on: FE-011*
- **FE-013**: Edit athlete form — *depends on: FE-011*
- **FE-014**: Athlete profile page — *depends on: FE-011*
- **FE-015**: Consent form (public page) — *depends on: FE-002, FE-005*

---

### Layer 4: Video Capture & Upload

#### Backend
- **BE-012**: Video upload endpoint — *depends on: BE-005, BE-006*
- **BE-013**: Video metadata storage — *depends on: BE-004, BE-012*

#### Frontend
- **FE-016**: Camera setup & preview — *depends on: FE-014*
- **FE-017**: MediaPipe.js skeleton overlay — *depends on: FE-016*
- **FE-018**: Video recording flow (countdown, timer) — *depends on: FE-017*
- **FE-019**: Recording preview & reshoot — *depends on: FE-018*
- **FE-020**: Video upload UI (backup flow) — *depends on: FE-014, FE-005*

---

### Layer 5: Computer Vision Analysis

#### Backend
- **BE-014**: MediaPipe Python setup & landmark extraction — *depends on: BE-012*
- **BE-015**: Failure detection logic — *depends on: BE-014*
- **BE-016**: Sway metrics calculation — *depends on: BE-014*
- **BE-017**: Arm excursion metrics — *depends on: BE-014*
- **BE-018**: Stability score calculation — *depends on: BE-016, BE-017*
- **BE-019**: Raw keypoints storage — *depends on: BE-014, BE-005*

---

### Layer 6: Benchmarks & Scoring

#### Backend
- **BE-020**: Benchmark data seeding script — *depends on: BE-004*
- **BE-021**: Duration score calculation (1-5 tiers) — *depends on: BE-020*
- **BE-022**: Percentile calculation logic — *depends on: BE-020, BE-004*
- **BE-023**: Team ranking logic — *depends on: BE-004*

---

### Layer 7: Deep Agent System

#### Backend
- **BE-024**: Agent orchestrator (routing logic) — *depends on: BE-001*
- **BE-025**: Prompt cache static content — *depends on: BE-020*
- **BE-026**: Compression agent — *depends on: BE-024, BE-025*
- **BE-027**: Assessment agent — *depends on: BE-024, BE-025*
- **BE-028**: Progress agent — *depends on: BE-024, BE-025, BE-026*

---

### Layer 8: Assessment Processing Pipeline

#### Backend
- **BE-029**: Assessment analysis endpoint — *depends on: BE-012, BE-018, BE-021, BE-027*
- **BE-030**: Assessment CRUD endpoints — *depends on: BE-029, BE-006*
- **BE-031**: Assessment history query endpoints — *depends on: BE-030*

#### Frontend
- **FE-021**: Assessment results display — *depends on: FE-014, FE-005*
- **FE-022**: Assessment history list — *depends on: FE-014, FE-005*
- **FE-023**: Progress chart visualization — *depends on: FE-022*

---

### Layer 9: Parent Reports

#### Backend
- **BE-032**: Report generation endpoint — *depends on: BE-028, BE-031*
- **BE-033**: Report PIN generation & storage — *depends on: BE-032, BE-004*
- **BE-034**: Report send email endpoint — *depends on: BE-033, BE-007*
- **BE-035**: Public report view endpoints — *depends on: BE-033*

#### Frontend
- **FE-024**: Report preview UI — *depends on: FE-014, FE-005*
- **FE-025**: Report send confirmation — *depends on: FE-024*
- **FE-026**: Public parent report view (PIN entry) — *depends on: FE-002, FE-005*

---

### Layer 10: Polish & Settings

#### Backend
- **BE-036**: Error handling middleware — *depends on: BE-001*
- **BE-037**: Request logging — *depends on: BE-001*
- **BE-038**: CORS configuration — *depends on: BE-001*

#### Frontend
- **FE-027**: Settings page — *depends on: FE-010*
- **FE-028**: Loading states & error boundaries — *depends on: FE-001*
- **FE-029**: Form validation helpers — *depends on: FE-001*
- **FE-030**: Responsive layout polish — *depends on: FE-001*

---

## Critical Path (For MVP)

### Must-Have PRs (Blocking Demo)
1. BE-001, BE-002, BE-003 (foundation)
2. **BE-041, FE-031 (deployment - HIGH PRIORITY, execute early!)**
3. BE-004, BE-005, BE-006 (core services)
4. BE-008, BE-009, BE-010, BE-011 (auth + athletes)
5. BE-012, BE-014, BE-016, BE-017, BE-018 (CV analysis)
6. BE-020, BE-021 (scoring)
7. BE-024, BE-025, BE-027 (basic AI feedback)
8. BE-029, BE-030 (assessment pipeline)
9. FE-001, FE-002, FE-003, FE-004, FE-005, FE-006 (foundation)
10. FE-007, FE-008 (auth UI)
11. FE-011, FE-012, FE-014 (athlete management)
12. FE-016, FE-017, FE-018, FE-019 (recording flow)
13. FE-021 (results display)

### Nice-to-Have (Can be mocked for demo)
- BE-026, BE-028 (compression & progress agents)
- BE-032, BE-033, BE-034, BE-035 (parent reports)
- FE-015 (consent form can be manual approval for demo)
- FE-024, FE-025, FE-026 (report UI)

### Can Skip for Demo
- BE-036, BE-037, BE-038 (polish)
- FE-027 (settings)
- FE-028, FE-029, FE-030 (polish)
- FE-020 (upload flow - can use live recording only)
- FE-022, FE-023 (history - can show single assessment)

---

## Parallel Work Opportunities

### Team A (Backend CV/AI Focus)
- BE-014 → BE-015, BE-016, BE-017 → BE-018
- BE-024, BE-025 → BE-027

### Team B (Backend Services Focus)
- BE-001, BE-002, BE-003 → BE-004, BE-005, BE-006, BE-007 → BE-008
- BE-009, BE-010 → BE-011
- BE-012 → BE-013

### Team C (Frontend Core)
- FE-001, FE-002, FE-003 → FE-004, FE-005, FE-006
- FE-007, FE-008, FE-009

### Team D (Frontend Features)
- FE-010, FE-011 → FE-012, FE-013, FE-014
- FE-016 → FE-017 → FE-018 → FE-019

---

## Total PR Count
- **Backend**: 41 PRs (39 feature + 2 testing)
- **Frontend**: 33 PRs (31 feature + 2 testing)
- **Total**: 74 PRs

## Estimated Timeline (with 4 engineers)
- **Foundation + Core (Layers 0-2)**: 3-4 days
- **Athlete Management (Layer 3)**: 2 days
- **Video + CV (Layers 4-5)**: 4-5 days
- **Scoring + AI (Layers 6-7)**: 3 days
- **Assessment Pipeline (Layer 8)**: 2 days
- **Reports (Layer 9)**: 2 days
- **Polish (Layer 10)**: 1-2 days

**Total**: ~17-20 days with parallelization
**MVP Path**: ~10-12 days (excluding nice-to-haves)
