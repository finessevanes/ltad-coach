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

### Key Features

- **Automated Assessment**: Replace subjective observations with objective CV-measured metrics
- **AI-Powered Insights**: Transform raw metrics into actionable coaching feedback using LLM agents
- **Progress Tracking**: Historical trend analysis with team ranking comparisons
- **Parent Communication**: Professional, shareable reports with PIN protection
- **LTAD Alignment**: Assessments tied to established youth athletic development frameworks

### Target Users

**Primary**: Youth sports coaches (PE teachers, club coaches, rec league coaches)
**Secondary**: Parents receiving progress reports

### MVP Scope

**Included**:
- Coach authentication (Google OAuth + email/password)
- Athlete roster management (max 25 per coach)
- Parental consent workflow with automated emails
- One-Leg Balance Test with live skeleton overlay
- Video recording and upload
- Full AI agent system (Assessment, Progress, Compression agents)
- Team ranking comparisons
- Parent report generation with PIN protection

**Post-MVP**:
- Additional test types (Superman reps, Y-Balance, etc.)
- Native mobile apps
- Payment/subscription system
- Multi-coach organizations

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (React)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Camera +   │  │  MediaPipe.js│  │  Firebase SDK│         │
│  │   Recording  │  │  (preview)   │  │  (auth/data) │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (FastAPI)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  MediaPipe   │  │   Metrics    │  │  AI Agents   │         │
│  │  (Python)    │─▶│  Calculator  │─▶│  (Claude)    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Firebase Services                           │
│    Firestore (DB)  │  Storage (Videos)  │  Auth (Google)       │
└─────────────────────────────────────────────────────────────────┘
```

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
| AI/LLM | Claude via OpenRouter | Assessment feedback |
| Email | Resend | Transactional emails |
| Frontend Deploy | Vercel | Static hosting |
| Backend Deploy | Render | Python hosting |

### Key Architectural Decisions

#### MediaPipe: Client vs Server

**Client-side (MediaPipe.js)**: Live preview only
- Real-time skeleton overlay for visual feedback
- Helps coach frame athlete correctly
- NOT used for metrics calculation

**Server-side (MediaPipe Python)**: Source of truth
- Official metric extraction
- Performs all calculations
- Results stored in database

#### AI Agent Architecture

Four-agent system using Claude via OpenRouter:

| Agent | Model | Purpose |
|-------|-------|---------|
| Orchestrator | Python Logic | Routes requests (no LLM) |
| Compression | Claude Haiku | Summarizes history (12 assessments → 150 tokens) |
| Assessment | Claude Sonnet | Single test feedback |
| Progress | Claude Sonnet | Historical trend analysis |

**Deep Agent Patterns**:
1. **Context Offloading**: Store raw keypoints externally, send only metrics to LLM
2. **Context Compression**: Summarize history before processing
3. **Context Isolation**: Each agent receives only relevant data
4. **Prompt Caching**: Cache static LTAD content (~90% cost savings)

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
FIREBASE_STORAGE_BUCKET=ltad-coach.firebasestorage.app
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1  # Optional
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
│   │   ├── components/       # Reusable MUI components
│   │   ├── pages/            # Route pages
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API calls (Firebase + backend)
│   │   ├── types/            # TypeScript interfaces
│   │   └── utils/            # Utility functions
│   ├── public/
│   ├── prds/                 # Frontend PRD specs (FE-001 to FE-016)
│   ├── package.json
│   └── README.md             # Frontend setup guide
│
├── backend/                   # Python FastAPI backend
│   ├── app/
│   │   ├── main.py           # FastAPI app initialization
│   │   ├── routes/           # API endpoints
│   │   ├── services/         # Business logic
│   │   ├── agents/           # AI agent implementations
│   │   ├── models/           # Pydantic schemas
│   │   └── utils/            # Helpers & config
│   ├── tests/
│   ├── prds/                 # Backend PRD specs (BE-001 to BE-015)
│   ├── pyproject.toml
│   └── README.md             # Backend setup guide
│
├── CLAUDE.md                  # Developer guide (patterns, standards)
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

### Assessment Processing Pipeline

1. Coach records video with live MediaPipe.js preview
2. Raw video uploaded to Firebase Storage
3. Backend creates assessment record (status: "processing")
4. Background task:
   - MediaPipe Python extracts pose landmarks (33 keypoints)
   - Calculate metrics: duration, sway, stability, arm excursion
   - Store raw keypoints to Storage (context offloading)
   - Pass derived metrics to AI agents
   - Generate coach-friendly feedback
5. Update assessment (status: "completed")
6. Frontend polls and displays results

**Performance Requirements**:
- **NFR-1**: Live skeleton overlay ≥15 FPS
- **NFR-2**: Server video analysis <30 seconds
- **NFR-3**: AI feedback <10 seconds
- **NFR-4**: Page load <3 seconds

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

**Current Phase**: Pre-implementation (documentation complete)
**Target Milestone**: Investor Demo - December 18, 2025
**Estimated Effort**: 86-112 hours

See [DEPENDENCY_GRAPH.md](./DEPENDENCY_GRAPH.md) for detailed phase breakdown.

### Implementation Phases

| Phase | Description | PRDs |
|-------|-------------|------|
| 0 | Infrastructure + Deployment | BE-001, FE-001 |
| 1 | Firebase Integration | BE-002, FE-002 |
| 2 | Authentication | BE-003, FE-003 |
| 3 | Athlete Management | BE-004, FE-004, FE-005 |
| 4 | Consent Workflow | BE-005, FE-006, FE-007 |
| 5 | Video Capture | FE-008, FE-009, FE-010 |
| 6 | CV Analysis | BE-006, BE-007, BE-008 |
| 7 | AI Agents | BE-009, BE-010, BE-011 |
| 8 | Assessment Results | BE-012, FE-011, FE-012 |
| 9 | Parent Reports | BE-013, BE-014, FE-013, FE-014 |
| 10 | Dashboard & Polish | BE-015, FE-015, FE-016 |

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
