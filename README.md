# AI Coach MVP

> Computer vision athletic assessment platform for youth sports coaches (ages 5-13)

**Target Milestone**: Investor Demo - December 18, 2025

## Quick Links

- [Backend Setup](./backend/README.md)
- [Frontend Setup](./client/README.md)
- [Developer Guide](./CLAUDE.md) - Comprehensive development patterns and standards
- [Product Requirements](./prd.md) - Full PRD with technical specifications
- [Implementation Roadmap](./DEPENDENCY_GRAPH.md) - Phased execution plan

---

## Project Overview

AI Coach is a computer vision-powered athletic assessment platform designed for youth sports coaches working with athletes ages 5-13. The platform enables coaches to conduct standardized athletic tests, automatically analyze performance using MediaPipe pose estimation, and generate AI-powered feedback using a multi-agent system built on Claude.

> **Implementation Status (December 2025)**: Phases 0-7 complete. Client-side MediaPipe is source of truth for metrics. AI agents fully implemented and operational.

### Key Features

- **Automated Assessment**: Replace subjective observations with objective CV-measured metrics
- **Client-Side Analysis**: MediaPipe.js calculates all 11 metrics directly in the browser
- **AI-Powered Insights**: Transform raw metrics into actionable coaching feedback using Claude AI
- **Progress Tracking**: (Phase 8 - planned) Historical trend analysis with team ranking comparisons
- **Parent Communication**: (Phase 9 - planned) Professional, shareable reports with PIN protection
- **LTAD Alignment**: Duration scoring tied to established youth athletic development frameworks

### Target Users

**Primary**: Youth sports coaches (PE teachers, club coaches, rec league coaches)
**Secondary**: Parents receiving progress reports

### MVP Scope

**Implemented (Phases 0-6)**:
- Coach authentication (Google OAuth + email/password)
- Athlete roster management (max 25 per coach)
- Parental consent workflow with automated emails
- One-Leg Balance Test with live skeleton overlay
- Video recording with client-side metrics calculation
- Backend storage of client-calculated metrics
- LTAD duration scoring and age expectations

**Implemented (Phase 7)**:
- AI agent system (Assessment, Progress, Compression agents via orchestrator)
- Real-time coaching feedback generation
- Progress report generation with historical analysis

**Planned (Phases 8-10)**:
- Team ranking comparisons
- Parent report distribution with PIN protection
- Coach dashboard with statistics

**Post-MVP**:
- Additional test types (Superman reps, Y-Balance, etc.)
- Native mobile apps
- Payment/subscription system
- Multi-coach organizations

---

## Architecture

### High-Level Overview (Current Implementation)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (React)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Camera +   │  │ MediaPipe.js │  │  Firebase SDK│         │
│  │   Recording  │  │ SOURCE OF   │  │  (auth/data) │         │
│  │              │  │ TRUTH       │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                           │                                      │
│               ┌───────────▼──────────┐                          │
│               │  Metrics Calculator  │                          │
│               │  (17+ CV metrics)    │                          │
│               └──────────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS (POST client_metrics)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (FastAPI)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Validate    │  │   Duration   │  │  AI Agents   │         │
│  │  Auth/Consent│─▶│   Scoring    │  │  (Phase 7)   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Firebase Services                           │
│    Firestore (DB)  │  Storage (Videos)  │  Auth (Google)       │
└─────────────────────────────────────────────────────────────────┘
```

> **Note**: The architecture has evolved from the original PRD. MediaPipe now runs client-side and is the source of truth for all CV metrics. The backend validates auth/consent and adds LTAD duration scoring.

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 + Vite + TypeScript | Coach dashboard SPA |
| UI Library | Material-UI v5 | Component library |
| Backend | Python 3.11 + FastAPI | REST API |
| Package Mgmt | pip + requirements.txt (backend), npm (frontend) | Dependencies |
| Database | Firebase Firestore | NoSQL document store |
| Storage | Firebase Storage | Video & keypoint files |
| Auth | Firebase Auth | Google OAuth + email/password |
| Computer Vision | MediaPipe v0.10.9 | Pose detection (33 landmarks) |
| AI/LLM | Claude via Anthropic API | Assessment & progress feedback |
| Email | Resend | Transactional emails |
| Frontend Deploy | Vercel | Static hosting |
| Backend Deploy | Render | Python hosting |

### Key Architectural Decisions

#### MediaPipe: Client-Side Source of Truth (Current Implementation)

**Client-side (MediaPipe.js)**: SOURCE OF TRUTH
- Real-time skeleton overlay for visual feedback
- **Calculates 17+ CV metrics** in `utils/metricsCalculation.ts` (sway, arm angles, temporal analysis, events)
- Detects failures via `utils/positionDetection.ts`
- Sends pre-calculated metrics to backend

**Server-side (MediaPipe Python)**: NOT IMPLEMENTED
- Originally planned as source of truth
- Current implementation: backend only stores client metrics
- Backend adds duration_score and age_expectation (LTAD benchmarks)

#### AI Agent Architecture (Phase 7 - IMPLEMENTED)

Four-agent system using Claude via Anthropic API:

| Agent | Model | Purpose | Status |
|-------|-------|---------|--------|
| Orchestrator | Python Logic | Routes requests (no LLM) | ✅ Implemented |
| Compression | Claude Haiku | Summarizes history (12 assessments → 150 words) | ✅ Implemented |
| Assessment | Claude Haiku | Single test feedback (coach-friendly) | ✅ Implemented |
| Progress | Claude Haiku | Historical trend analysis (parent-friendly) | ✅ Implemented |

**Implemented Agent Patterns**:
1. **Context Offloading**: Raw keypoints stored in Firebase Storage, only metrics sent to LLM
2. **Context Compression**: Haiku summarizes up to 12 assessments before progress analysis
3. **Context Isolation**: Each agent receives only relevant data via orchestrator routing
4. **Unified Entry Point**: All AI operations go through `orchestrator.generate_feedback()`

**Note**: Currently using Haiku for all agents. System designed to support Sonnet when access is enabled.

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm 9+
- **Python** 3.11+ (MediaPipe requires 3.11, not 3.12+)
- **pip** for Python package management
- **Firebase** account with project created
- **OpenRouter** API key for Claude
- **Resend** API key for emails
- **Git** for version control

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd ltad-coach
   ```

2. **Set up Firebase**
   - Create Firebase project
   - Enable Authentication (Google OAuth + Email/Password)
   - Enable Firestore Database
   - Enable Storage
   - Download service account JSON for backend

3. **Start the Backend** (see [backend/README.md](./backend/README.md))
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Mac/Linux
   pip install -r requirements.txt
   # Configure .env file
   uvicorn app.main:app --reload
   ```

4. **Start the Frontend** (see [client/README.md](./client/README.md))
   ```bash
   cd client
   npm install
   # Configure .env file
   npm run dev
   ```

5. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Environment Variables

**Backend** (`backend/.env`):
```bash
FRONTEND_URL=http://localhost:5173
API_BASE_URL=http://localhost:8000
GOOGLE_APPLICATION_CREDENTIALS=./ltad-coach-firebase-adminsdk-*.json
FIREBASE_PROJECT_ID=ltad-coach
FIREBASE_STORAGE_BUCKET=ltad-coach.firebasestorage.app # Optional
RESEND_API_KEY=re_...
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000  # Optional
```

**Frontend** (`client/.env`):
```bash
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

See component-specific READMEs for detailed setup instructions.

---

## Repository Structure

```
ltad-coach/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # Reusable MUI components (BalanceTest, etc.)
│   │   ├── pages/            # Route pages
│   │   ├── hooks/            # Custom React hooks (useBalanceTest, useMediaPipe)
│   │   ├── services/         # API calls (Firebase + backend)
│   │   ├── contexts/         # React contexts (AuthContext)
│   │   ├── types/            # TypeScript interfaces
│   │   └── utils/            # Metrics calculation (SOURCE OF TRUTH)
│   │       ├── metricsCalculation.ts  # 17+ CV metrics
│   │       ├── positionDetection.ts   # Pose state machine
│   │       └── metricsComparison.ts   # Compare test results
│   ├── public/
│   ├── prds/                 # Frontend PRD specs (FE-001 to FE-016)
│   ├── package.json
│   └── README.md             # Frontend setup guide
│
├── backend/                   # Python FastAPI backend
│   ├── app/
│   │   ├── main.py           # FastAPI app initialization
│   │   ├── routers/          # API endpoints (NOT routes/)
│   │   │   ├── auth.py
│   │   │   ├── athletes.py
│   │   │   ├── consent.py
│   │   │   └── assessments.py
│   │   ├── repositories/     # Data access layer
│   │   ├── services/         # Business logic (email, metrics, video)
│   │   ├── middleware/       # Auth, rate limiting
│   │   ├── models/           # Pydantic schemas
│   │   ├── constants/        # LTAD scoring thresholds
│   │   ├── agents/           # AI agents (orchestrator, assessment, progress, compression)
│   │   └── prompts/          # Static LTAD context for AI agents
│   ├── tests/
│   ├── prds/                 # Backend PRD specs (BE-001 to BE-015)
│   ├── requirements.txt
│   └── README.md             # Backend setup guide
│
├── CLAUDE.md                  # Developer guide (patterns, standards)
├── ARCHITECTURE.md            # System architecture diagrams
├── prd.md                     # Product requirements document
├── DEPENDENCY_GRAPH.md        # Implementation phase ordering
├── .gitignore
└── README.md                  # This file
```

---

## Development Workflow

### Branch Strategy

- **main**: Production-ready code
- **develop**: Integration branch for features
- Feature branches: Branch from `develop`, PR to merge back

### Commit Conventions

Use Conventional Commits format:
```
feat: add athlete consent workflow
fix: resolve camera permission issue
docs: update setup instructions
refactor: simplify metrics calculation
```

### Pull Request Process

1. Create feature branch from `develop`
2. Implement feature following [CLAUDE.md](./CLAUDE.md) standards
3. Test locally (frontend + backend)
4. Submit PR to `develop`
5. After review and approval, merge
6. Periodically merge `develop` → `main` for releases

### Running Locally

Run both servers concurrently:

**Terminal 1 (Backend)**:
```bash
cd backend
source venv/bin/activate  # If not already activated
uvicorn app.main:app --reload
```

**Terminal 2 (Frontend)**:
```bash
cd client
npm run dev
```

---

## Deployment

### Frontend (Vercel)

1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to `main` branch
4. Build command: `npm run build`
5. Output directory: `dist`

### Backend (Render)

1. Connect GitHub repository to Render
2. Create Web Service
3. Configure environment variables
4. Deploy automatically on push to `main` branch
5. Build command: `pip install -r requirements.txt`
6. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Firebase Configuration

Configure Firebase Security Rules:
- Coaches can only access their own data
- Parents can access reports with valid PIN
- Public endpoints: consent forms, report views

---

## Key Technical Details

### Assessment Processing Pipeline (Current Implementation)

1. Coach records video with live MediaPipe.js skeleton overlay
2. During recording: MediaPipe.js streams landmarks at ≥15 FPS
3. Client tracks positions in real-time via `useBalanceTest` hook
4. On stop: `metricsCalculation.ts` calculates all 11 metrics
5. Video uploaded to Firebase Storage
6. **POST /assessments/analyze** with client_metrics
7. Backend validates auth/consent
8. Backend calculates duration_score + age_expectation (LTAD)
9. Agent orchestrator generates AI coaching feedback (3-6 seconds)
10. Assessment stored as "completed" with AI feedback
11. Frontend displays results with AI insights

> **Note**: No background processing, no server-side MediaPipe, no polling. Assessment completes in <2 seconds.

**Performance Requirements**:
- **NFR-1**: Live skeleton overlay ≥15 FPS - ACHIEVED
- **NFR-2**: Assessment storage <2 seconds - ACHIEVED (changed from server video analysis)
- **NFR-3**: AI feedback <10 seconds - ACHIEVED (3-6 seconds typical)
- **NFR-4**: Page load <3 seconds - ACHIEVED

### Metrics Calculated

From MediaPipe landmarks, the system calculates:

- **Duration**: Time athlete maintained balance (0-30s)
- **Stability Score**: Composite score (0-100)
- **Sway Metrics**: Hip movement (std dev, path length, velocity)
- **Arm Excursion**: Total arm movement (compensation indicator)
- **Corrections Count**: Number of balance adjustments
- **Failure Reason**: Foot touchdown, hands left hips, or support foot moved

See [prd.md Section 11](./prd.md#11-cv-metrics-specification) for detailed formulas.

### Hybrid Scoring Model

**Tier 1**: Duration Score (1-5) based on LTAD benchmarks

| Score | Label | Duration | Ages 5-6 | Age 7 | Ages 8-9 | Ages 10-11 | Ages 12-13 |
|-------|-------|----------|----------|-------|----------|------------|------------|
| 1 | Beginning | 1-9 sec | Expected | Below | Below | Below | Below |
| 2 | Developing | 10-14 sec | Above | Expected | Below | Below | Below |
| 3 | Competent | 15-19 sec | Above | Above | Expected | Below | Below |
| 4 | Proficient | 20-24 sec | Above | Above | Above | Expected | Below |
| 5 | Advanced | 25+ sec | Above | Above | Above | Above | Expected |

**Tier 2**: Quality Ranking based on form metrics (team-relative)

Example: Two athletes both score "4" (20-24 sec), but one has better form quality and ranks 1st on team, while the other ranks 8th due to arm compensation.

See [prd.md Section 11.4](./prd.md#114-hybrid-scoring-model) for complete scoring details.

---

## Roadmap & Status

**Current Phase**: Phase 7 Complete (Phases 8+ pending)
**Target Milestone**: Investor Demo - December 18, 2025

> **Implementation Note**: Phase 6 was implemented differently than planned. Client-side MediaPipe is source of truth instead of server-side. See ARCHITECTURE.md for details.

See [DEPENDENCY_GRAPH.md](./DEPENDENCY_GRAPH.md) for detailed phase breakdown.

### Implementation Phases

| Phase | Description | PRDs | Status |
|-------|-------------|------|--------|
| 0 | Infrastructure + Deployment | BE-001, FE-001 | COMPLETE |
| 1 | Firebase Integration | BE-002, FE-002 | COMPLETE |
| 2 | Authentication | BE-003, FE-003 | COMPLETE |
| 3 | Athlete Management | BE-004, FE-004, FE-005 | COMPLETE |
| 4 | Consent Workflow | BE-005, FE-006, FE-007 | COMPLETE |
| 5 | Video Capture | FE-008, FE-009, FE-010 | COMPLETE |
| 6 | CV Analysis | BE-006, BE-007, BE-008 | COMPLETE (client-side) |
| 7 | AI Agents | BE-009, BE-010, BE-011 | COMPLETE |
| 8 | Assessment Results | BE-012, FE-011, FE-012 | PARTIAL (list endpoint done) |
| 9 | Parent Reports | BE-013, BE-014, FE-013, FE-014 | PENDING |
| 10 | Dashboard & Polish | BE-015, FE-015, FE-016 | PENDING |

---

## Contributing

### Code Standards

**TypeScript/React**:
- Functional components with hooks
- Props as interfaces
- 2-space indentation
- Use `sx` prop for MUI styling

**Python**:
- Type hints on all functions
- Google-style docstrings
- 4-space indentation (PEP 8)
- Async/await for all I/O

See [CLAUDE.md](./CLAUDE.md) for comprehensive coding standards and patterns.

### Testing

**Frontend**:
```bash
cd client
npm run lint
npm run format
```

**Backend**:
```bash
cd backend
source venv/bin/activate  # If not already activated
pytest
black .
mypy .
```

### Adding New Features

1. Review [prd.md](./prd.md) for requirements
2. Check [DEPENDENCY_GRAPH.md](./DEPENDENCY_GRAPH.md) for dependencies
3. Follow patterns in [CLAUDE.md](./CLAUDE.md)
4. Write tests
5. Update documentation

---

## Support

For questions, issues, or contributions:
- Create an issue on GitHub
- Review existing documentation in this repository
- Check PRD files for detailed specifications

---

## License

(Specify license here if applicable)
