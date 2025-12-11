# PR Quick Reference by Feature

## Backend PRs

### Foundation & Infrastructure
- BE-001: FastAPI project setup
- BE-002: Firebase Admin SDK configuration
- BE-003: Environment variables & config management
- **BE-041: Heroku deployment setup ⚡ (HIGH PRIORITY - Execute early!)**
- BE-036: Error handling middleware
- BE-037: Request logging
- BE-038: CORS configuration

### Core Services
- BE-004: Firestore database service wrapper
- BE-005: Firebase Storage service wrapper
- BE-006: Authentication middleware
- BE-007: Email service (Resend integration)

### Authentication
- BE-008: Auth endpoints (token validation, logout)

### Athlete Management
- BE-009: Athlete CRUD endpoints
- BE-010: Consent email trigger
- BE-011: Consent form endpoints (public)

### Video Processing
- BE-012: Video upload endpoint
- BE-014: MediaPipe Python setup & landmark extraction
- BE-019: Raw keypoints storage

### Computer Vision Metrics
- BE-015: Failure detection logic
- BE-016: Sway metrics calculation
- BE-017: Arm excursion metrics
- BE-018: Stability score calculation

### Scoring & Benchmarks
- BE-020: Benchmark data seeding
- BE-021: Duration score calculation (1-5 tiers)
- BE-022: Percentile calculation logic
- BE-023: Team ranking logic

### Deep Agent System
- BE-024: Agent orchestrator (routing logic)
- BE-025: Prompt cache static content
- BE-026: Compression agent (Claude Haiku)
- BE-027: Assessment agent (Claude Sonnet)
- BE-028: Progress agent (Claude Sonnet)

### Assessment Pipeline
- BE-029: Assessment analysis endpoint (main pipeline)
- BE-030: Assessment CRUD endpoints
- BE-031: Assessment history query endpoints

### Parent Reports
- BE-032: Report generation endpoint
- BE-033: Report PIN generation & storage
- BE-034: Report send email endpoint
- BE-035: Public report view endpoints

---

## Frontend PRs

### Foundation & Infrastructure
- FE-001: React project setup (Vite + Material-UI)
- **FE-031: Vercel deployment setup ⚡ (HIGH PRIORITY - Execute early!)**
- FE-002: Firebase client SDK configuration
- FE-003: React Router setup
- FE-028: Loading states & error boundaries
- FE-029: Form validation helpers
- FE-030: Responsive layout polish

### Core Services & Auth
- FE-004: Auth context provider
- FE-005: API client service
- FE-006: Protected route wrapper

### Public Pages
- FE-007: Login page
- FE-008: Register page
- FE-009: Landing page
- FE-015: Consent form (public page)
- FE-026: Public parent report view

### Dashboard & Navigation
- FE-010: Coach dashboard skeleton
- FE-027: Settings page

### Athlete Management
- FE-011: Athletes list page
- FE-012: Add athlete form
- FE-013: Edit athlete form
- FE-014: Athlete profile page

### Assessment - Camera & Recording
- FE-016: Camera setup & preview
- FE-017: MediaPipe.js skeleton overlay
- FE-018: Video recording flow (countdown, timer)
- FE-019: Recording preview & reshoot
- FE-020: Video upload UI (backup flow)

### Assessment - Results & History
- FE-021: Assessment results display
- FE-022: Assessment history list
- FE-023: Progress chart visualization

### Parent Reports
- FE-024: Report preview UI
- FE-025: Report send confirmation

---

## By Layer (Execution Order)

### Layer 0: Foundation (No Dependencies)
**Backend**: BE-001, BE-002, BE-003
**Frontend**: FE-001, FE-002, FE-003

### Layer 0.5: Early Deployment ⚡ (HIGH PRIORITY)
**Backend**: BE-041 (Heroku deployment)
**Frontend**: FE-031 (Vercel deployment)

### Layer 1: Core Services
**Backend**: BE-004, BE-005, BE-006, BE-007
**Frontend**: FE-004, FE-005, FE-006

### Layer 2: Authentication
**Backend**: BE-008
**Frontend**: FE-007, FE-008, FE-009

### Layer 3: Athlete Management
**Backend**: BE-009, BE-010, BE-011
**Frontend**: FE-010, FE-011, FE-012, FE-013, FE-014, FE-015

### Layer 4: Video Capture
**Backend**: BE-012
**Frontend**: FE-016, FE-017, FE-018, FE-019, FE-020

### Layer 5: CV Analysis
**Backend**: BE-014, BE-015, BE-016, BE-017, BE-018, BE-019

### Layer 6: Benchmarks & Scoring
**Backend**: BE-020, BE-021, BE-022, BE-023

### Layer 7: Deep Agents
**Backend**: BE-024, BE-025, BE-026, BE-027, BE-028

### Layer 8: Assessment Pipeline
**Backend**: BE-029, BE-030, BE-031
**Frontend**: FE-021, FE-022, FE-023

### Layer 9: Parent Reports
**Backend**: BE-032, BE-033, BE-034, BE-035
**Frontend**: FE-024, FE-025, FE-026

### Layer 10: Polish
**Backend**: BE-036, BE-037, BE-038
**Frontend**: FE-027, FE-028, FE-029, FE-030

---

## By Complexity

### Small (S) - ~1 hour each

**Backend (21)**:
BE-001, BE-002, BE-003, BE-007, BE-008, BE-010, BE-019, BE-020, BE-021, BE-022, BE-023, BE-024, BE-031, BE-033, BE-034, BE-035, BE-036, BE-037, BE-038

**Frontend (8)**:
FE-003, FE-005, FE-006, FE-009, FE-013, FE-025, FE-027, FE-029

### Medium (M) - ~2-3 hours each

**Backend (15)**:
BE-004, BE-005, BE-006, BE-011, BE-012, BE-014, BE-015, BE-016, BE-017, BE-018, BE-025, BE-026, BE-027, BE-028, BE-030, BE-032

**Frontend (21)**:
FE-001, FE-002, FE-004, FE-007, FE-008, FE-010, FE-011, FE-012, FE-014, FE-015, FE-016, FE-018, FE-019, FE-020, FE-022, FE-023, FE-024, FE-026, FE-028, FE-030

### Large (L) - ~4 hours each

**Backend (1)**:
BE-029

**Frontend (1)**:
FE-017, FE-021

---

## Search by File Type

### Python (Backend)
- Services: BE-004, BE-005, BE-006, BE-007, BE-014-019, BE-024-028
- API Routes: BE-008-012, BE-029-035
- Scripts: BE-020
- Middleware: BE-036, BE-037, BE-038

### JavaScript/React (Frontend)
- Pages: FE-007-016, FE-021, FE-024, FE-026, FE-027
- Components: FE-011-023, FE-025
- Contexts: FE-004, FE-028
- Services: FE-002, FE-005
- Config: FE-001, FE-003, FE-029, FE-030

---

## Common Patterns

### Full Feature Implementation (Athlete Management Example)
1. Backend data model (BE-004)
2. Backend API endpoints (BE-009)
3. Backend business logic (BE-010, BE-011)
4. Frontend API client (FE-005)
5. Frontend UI components (FE-011, FE-012, FE-013)
6. Frontend pages (FE-014)

### Adding a New Test Type (Future)
1. Update MediaPipe service (BE-014)
2. Add new metric calculations (BE-016, BE-017)
3. Update benchmarks (BE-020)
4. Update agent prompts (BE-025)
5. Add frontend UI for new test (FE-016-019)
6. Update results display (FE-021)

---

**Last Updated**: December 10, 2025
**Total PRs**: 73 (40 Backend + 33 Frontend)
**Includes**: 2 Deployment PRs (HIGH PRIORITY - Execute early!), 4 Testing PRs
