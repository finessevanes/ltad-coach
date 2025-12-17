# AI Coach MVP - Claude Development Guide

> Computer vision athletic assessment platform for youth sports coaches (ages 5-13)

## Project Overview

This is a full-stack application that uses MediaPipe pose detection to analyze youth athletes performing the One-Leg Balance Test, then provides AI-powered coaching feedback using Claude. The platform enables coaches to track athlete progress over time and share reports with parents.

**Target**: Investor demo December 18, 2025

## Tech Stack

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

## Project Structure

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
│   └── package.json
│
├── backend/                   # Python FastAPI backend
│   ├── app/
│   │   ├── main.py           # FastAPI app initialization
│   │   ├── routers/          # API endpoints
│   │   ├── services/         # Business logic
│   │   ├── models/           # Pydantic schemas
│   │   ├── agents/           # AI agent implementations (Phase 7)
│   │   └── repositories/     # Data access layer
│   └── requirements.txt
│
├── prd.md                     # Main product requirements
├── DEPENDENCY_GRAPH.md        # Implementation phase ordering
└── CLAUDE.md                  # This file
```

## Critical Performance Requirements

**NFR-1**: Live skeleton overlay ≥15 FPS
- MediaPipe.js client-side is SOURCE OF TRUTH for all metrics
- Skeleton overlay for visual feedback + metrics calculation

**NFR-3**: AI feedback <10 seconds
- Haiku for compression, Sonnet for assessment/progress
- Use static LTAD context in system prompts

**NFR-4**: Page load <3 seconds
- Lazy load analysis components
- Cache assessment results

## Development Commands

### Frontend (from `client/`)
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (port 5173)
npm run build        # Production build to dist/
npm run lint         # Run ESLint
npm run format       # Run Prettier
```

### Backend (from `backend/`)
```bash
python -m venv venv                         # Create virtual environment
source venv/bin/activate                    # Activate (Mac/Linux)
pip install -r requirements.txt             # Install dependencies
uvicorn app.main:app --reload               # Start dev server (port 8000)
pytest                                      # Run tests
black .                                     # Format code
```

## Environment Variables

### Frontend (`client/.env`)
```bash
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### Backend (`backend/.env`)
```bash
FRONTEND_URL=http://localhost:5173
GOOGLE_APPLICATION_CREDENTIALS=./ltad-coach-firebase-adminsdk-fbsvc-fc7b6b2a69.json
RESEND_API_KEY=
```

### Firebase Service Account
Backend uses a service account JSON file for Firebase Admin SDK authentication:
- File: `backend/ltad-coach-firebase-adminsdk-*.json`
- Contains: type, project_id, private_key_id, private_key, client_email, etc.
- **Do not commit to git** - already in `.gitignore`
- Set `GOOGLE_APPLICATION_CREDENTIALS` env var to the file path

## Architecture & Data Flow

```
Client (React)                    Backend (FastAPI)                 External
─────────────────                ──────────────────                ─────────
Camera capture
MediaPipe.js (metrics) ──────────► Validate auth/consent
17+ CV metrics calculated        Duration scoring (LTAD 1-5)
Video upload ────────────────────► ─────────────────────────────► Firebase Storage
                                  Agent orchestrator ─────────────► OpenRouter (Claude)
                                  Store results ──────────────────► Firestore
◄─────────────────────────────── Return completed assessment
Display results (synchronous)
```

**Important**: Client-side MediaPipe.js is the SOURCE OF TRUTH for all CV metrics. The backend only calculates LTAD duration scoring (1-5) and generates AI feedback. No server-side MediaPipe.

## Frontend Patterns

### Component Structure
```typescript
interface Props {
  athleteId: string;
  onComplete: (result: Assessment) => void;
}

export const AssessmentCard: React.FC<Props> = ({ athleteId, onComplete }) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => { /* ... */ };

  return (
    <Card sx={{ p: 2 }}>
      {/* MUI components */}
    </Card>
  );
};
```

### API Calls with Case Conversion
```typescript
// Backend uses snake_case, frontend uses camelCase
// Use camelcase-keys and snakecase-keys for automatic conversion
import camelcaseKeys from 'camelcase-keys';
import snakecaseKeys from 'snakecase-keys';
```

### State Management
- React Context + Hooks (no Redux)
- AuthContext for Firebase auth state
- Local component state for UI

## Backend Patterns

### FastAPI Route Structure
```python
from fastapi import APIRouter, Depends, HTTPException, status
from app.middleware.auth import get_current_user
from app.models.assessment import AssessmentCreate
from app.models.user import User

router = APIRouter(prefix="/assessments", tags=["assessments"])

@router.post("/analyze")
async def analyze_video(
    data: AssessmentCreate,
    current_user: User = Depends(get_current_user)
):
    # 1. Validate athlete ownership and consent status
    # 2. Receive client-calculated metrics (SOURCE OF TRUTH)
    # 3. Calculate duration_score (1-5) and age_expectation
    # 4. Store assessment as "completed" immediately
    # 5. Return assessment ID (synchronous - no polling needed)
    pass
```

> **Note**: Assessments complete synchronously. The client calculates all metrics via MediaPipe.js and sends them to this endpoint. No background processing or polling required.

## Database Schema (Firestore)

```
users/{userId}
  - email, name, createdAt, athleteCount

athletes/{athleteId}
  - coachId, name, age, gender, parentEmail
  - consentStatus: "pending" | "granted" | "denied"

assessments/{assessmentId}
  - athleteId, coachId, testType, legTested
  - videoUrl, status: "processing" | "completed" | "failed"
  - metrics: { holdTime, swayVelocity, durationScore, ... }
  - aiFeedback, createdAt

reports/{reportId}
  - athleteId, assessmentIds, accessPin (6-digit)
  - reportContent, sentAt
```

## AI Agent Architecture

| Agent | Model | Purpose |
|-------|-------|---------|
| Compression | Claude Haiku | Summarize history (12 assessments → 150 tokens) |
| Assessment | Claude Sonnet | Single test feedback |
| Progress | Claude Sonnet | Historical trend analysis |

### Context Management
- **Offloading**: Store raw keypoints in Cloud Storage, not LLM context
- **Compression**: Use Haiku to summarize before passing to Sonnet
- **Static Context**: Provide LTAD benchmarks in system prompts

## Implementation Order

Follow `DEPENDENCY_GRAPH.md`:
1. Phase 0: Project setup (BE-001, FE-001)
2. Phase 1: Firebase integration
3. Phase 2: Authentication
4. Phase 3: Athlete management
5. Phase 4: Consent workflow
6. Phase 5: Video recording
7. Phase 6: MediaPipe analysis
8. Phase 7: AI agents
9. Phase 8: Reports & dashboard

## PRD References

- Main PRD: `prd.md`
- Backend specs: `backend/prds/BE-001` through `BE-015`
- Frontend specs: `client/prds/FE-001` through `FE-016`

## Coding Standards

### TypeScript/React
- Functional components with hooks
- Props as interfaces
- 2-space indentation
- Use `sx` prop for MUI styling

### Python
- Type hints on all functions
- Google-style docstrings
- 4-space indentation (PEP 8)
- Async/await for all I/O

### Git
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`
- Branch from `develop`, PR to merge

## Security

- All protected routes require Firebase ID token
- Backend validates via Firebase Admin SDK
- Coaches only access their own data
- Parent reports require 6-digit PIN
