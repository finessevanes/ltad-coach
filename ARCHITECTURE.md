# LTAD Coach MVP - System Architecture

> Computer vision athletic assessment platform for youth sports coaches

**Version**: 0.1.0
**Target Demo**: December 18, 2025
**Status**: Documentation complete, implementation pending

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#1-system-architecture)
3. [Data Flow](#2-data-flow)
4. [AI Agent Architecture](#3-ai-agent-architecture)
5. [Database Schema](#4-database-schema)
6. [Backend Services](#5-backend-services)
7. [Frontend Architecture](#6-frontend-architecture)
8. [Performance Requirements](#performance-requirements)
9. [Technology Stack](#technology-stack)

---

## Overview

The LTAD Coach MVP is a full-stack web application that enables youth sports coaches to:
- Record/upload videos of athletes performing the One-Leg Balance Test
- Analyze balance and stability using computer vision (MediaPipe)
- Receive AI-powered coaching feedback (Claude via OpenRouter)
- Track athlete progress over time
- Share reports with parents

**Key Architectural Principles:**
- **Client-side preview, server-side truth**: MediaPipe.js provides real-time skeleton overlay for coaches, but server-side MediaPipe Python is the source of truth for all metrics
- **Async processing**: Video analysis happens in background tasks to avoid blocking user experience
- **Context optimization**: Four-agent AI system with offloading, compression, isolation, and caching patterns
- **Firebase-centric**: Firestore for data, Storage for files, Auth for authentication

---

## 1. System Architecture

High-level component diagram showing all system actors, services, and deployment platforms.

```mermaid
graph TB
    subgraph Users
        Coach[Coach<br/>Desktop/Mobile Browser]
        Parent[Parent<br/>Mobile Browser]
        Athlete[Athlete<br/>Subject of Assessment]
    end

    subgraph "Frontend (Vercel)"
        React[React SPA<br/>Vite + TypeScript + MUI<br/>Port 5173 dev]
        MediaPipeJS[MediaPipe.js<br/>Client-side Preview<br/>≥15 FPS skeleton overlay]
    end

    subgraph "Backend (Render)"
        FastAPI[FastAPI<br/>Python 3.11<br/>Port 8000]
        MediaPipePy[MediaPipe Python<br/>Server-side Analysis<br/>Source of Truth]
        AgentOrch[AI Agent Orchestrator]
    end

    subgraph "Firebase (Google Cloud)"
        FireAuth[Firebase Auth<br/>Google OAuth + Email/Password]
        Firestore[Cloud Firestore<br/>NoSQL Document Store]
        FireStorage[Firebase Storage<br/>Video & Keypoint Files]
    end

    subgraph "External Services"
        OpenRouter[OpenRouter API<br/>Claude Sonnet 4.5 + Haiku]
        Resend[Resend API<br/>Transactional Email]
    end

    Coach -->|Records Video| React
    Coach -->|Views Dashboard| React
    Parent -->|Accesses Report| React

    React -->|Live Preview| MediaPipeJS
    React -->|Upload Video| FireStorage
    React -->|Auth| FireAuth
    React -->|API Calls| FastAPI
    React -->|Read Data| Firestore

    FastAPI -->|Validate Token| FireAuth
    FastAPI -->|Read/Write Data| Firestore
    FastAPI -->|Fetch Video| FireStorage
    FastAPI -->|Store Keypoints| FireStorage
    FastAPI -->|Extract Pose| MediaPipePy
    FastAPI -->|Generate Feedback| AgentOrch

    AgentOrch -->|API Requests| OpenRouter
    FastAPI -->|Send Emails| Resend

    classDef userClass fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef frontendClass fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef backendClass fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef firebaseClass fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef externalClass fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px

    class Coach,Parent,Athlete userClass
    class React,MediaPipeJS frontendClass
    class FastAPI,MediaPipePy,AgentOrch backendClass
    class FireAuth,Firestore,FireStorage firebaseClass
    class OpenRouter,Resend externalClass
```

**Key Points:**
- **Deployment**: Frontend on Vercel (static), Backend on Render (Python)
- **Authentication**: Firebase handles all auth; backend validates tokens
- **Storage Strategy**: Videos and raw keypoints in Firebase Storage, metadata in Firestore
- **AI Processing**: Orchestrator routes requests to appropriate Claude model (Haiku or Sonnet)

---

## 2. Data Flow

End-to-end pipeline from video capture to AI feedback display.

```mermaid
sequenceDiagram
    actor Coach
    participant React as React Frontend
    participant MediaPipeJS as MediaPipe.js<br/>(Preview Only)
    participant FireStorage as Firebase Storage
    participant FastAPI as FastAPI Backend
    participant Firestore as Cloud Firestore
    participant MediaPipePy as MediaPipe Python<br/>(Source of Truth)
    participant MetricsCalc as Metrics Calculator
    participant AgentOrch as Agent Orchestrator
    participant Claude as Claude (OpenRouter)

    Coach->>React: 1. Start recording
    React->>MediaPipeJS: 2. Initialize camera stream
    MediaPipeJS-->>React: 3. Display skeleton overlay (≥15 FPS)
    Coach->>React: 4. Stop recording (30s max)

    React->>FireStorage: 5. Upload raw video blob
    FireStorage-->>React: 6. Return video URL

    React->>FastAPI: 7. POST /assessments/analyze<br/>(video_url, athlete_id, leg_tested)
    FastAPI->>Firestore: 8. Create assessment<br/>status: "processing"
    FastAPI-->>React: 9. Return assessment_id (immediate)

    Note over FastAPI: Async background task starts

    FastAPI->>FireStorage: 10. Download video
    FastAPI->>MediaPipePy: 11. Extract keypoints<br/>(33 landmarks per frame)
    MediaPipePy-->>FastAPI: 12. Return landmark array

    FastAPI->>MetricsCalc: 13. Calculate metrics<br/>(stability, sway, arm excursion)
    MetricsCalc-->>FastAPI: 14. Return 11 derived metrics

    FastAPI->>FireStorage: 15. Store raw keypoints JSON<br/>(context offloading)

    FastAPI->>AgentOrch: 16. Request feedback<br/>(metrics, athlete history)
    AgentOrch->>Claude: 17. Haiku: Compress history<br/>(6000 tokens → 150 tokens)
    Claude-->>AgentOrch: 18. Return summary
    AgentOrch->>Claude: 19. Sonnet: Generate assessment<br/>(cached LTAD benchmarks)
    Claude-->>AgentOrch: 20. Return AI feedback

    AgentOrch-->>FastAPI: 21. Return feedback
    FastAPI->>Firestore: 22. Update assessment<br/>status: "completed"<br/>metrics + aiFeedback

    loop Polling (every 2 seconds)
        React->>FastAPI: 23. GET /assessments/:id
        FastAPI->>Firestore: 24. Fetch assessment
        Firestore-->>FastAPI: 25. Return data
        FastAPI-->>React: 26. Return status
    end

    React->>Coach: 27. Display results<br/>(metrics + AI feedback)
```

**Performance Targets (NFRs):**
- **NFR-1**: Live skeleton overlay ≥15 FPS (client-side)
- **NFR-2**: Server video analysis <30 seconds
- **NFR-3**: AI feedback generation <10 seconds (with prompt caching)
- **NFR-4**: Page load time <3 seconds

**Critical Design Decisions:**
- **Non-blocking upload**: Backend returns assessment ID immediately, processes in background
- **Polling strategy**: Frontend polls every 2 seconds until status changes to "completed"
- **Context offloading**: Raw keypoints stored in Firebase Storage (not sent to LLM)
- **Two MediaPipe instances**: Client for preview UX, server for metric accuracy

---

## 3. AI Agent Architecture

Four-agent system using Claude models via OpenRouter with context optimization patterns.

```mermaid
graph TD
    Request[API Request] --> Orchestrator{Agent Orchestrator<br/>Pure Python Logic}

    Orchestrator -->|new_assessment| AssessFlow[Assessment Flow]
    Orchestrator -->|generate_report| ReportFlow[Report Flow]
    Orchestrator -->|view_progress| ProgressFlow[Progress Flow]

    subgraph AssessFlow["Assessment Agent Flow"]
        A1[Load: Current Metrics<br/>~500 tokens]
        A2[Load: Cached LTAD Benchmarks<br/>~2000 tokens cached]
        A3[Claude Sonnet 4.5<br/>Assessment Agent]
        A4[Coach Feedback<br/>Strengths + Areas to Improve]

        A1 --> A3
        A2 --> A3
        A3 --> A4
    end

    subgraph ReportFlow["Parent Report Flow"]
        R1[Load: Last 12 Assessments<br/>~6000 tokens]
        R2[Claude Haiku<br/>Compression Agent]
        R3[Historical Summary<br/>~150 tokens]
        R4[Load: Team Context<br/>~800 tokens]
        R5[Claude Sonnet 4.5<br/>Progress Agent]
        R6[Parent Report<br/>Progress + Recommendations]

        R1 --> R2
        R2 --> R3
        R3 --> R5
        R4 --> R5
        R5 --> R6
    end

    subgraph ProgressFlow["Progress Analysis Flow"]
        P1[Load: Last 12 Assessments<br/>~6000 tokens]
        P2[Claude Haiku<br/>Compression Agent]
        P3[Historical Summary<br/>~150 tokens]
        P4[Claude Sonnet 4.5<br/>Progress Agent]
        P5[Trend Analysis<br/>Improvement Areas]

        P1 --> P2
        P2 --> P3
        P3 --> P4
        P4 --> P5
    end

    subgraph ContextPatterns["Context Optimization Patterns"]
        CO1[Offloading:<br/>Raw keypoints in Storage]
        CO2[Compression:<br/>Haiku summarizes history]
        CO3[Isolation:<br/>Only relevant data per agent]
        CO4[Caching:<br/>Static LTAD benchmarks cached]
    end

    style Orchestrator fill:#e1bee7,stroke:#4a148c,stroke-width:3px
    style AssessFlow fill:#fff3e0,stroke:#e65100,stroke-width:2px
    style ReportFlow fill:#e3f2fd,stroke:#01579b,stroke-width:2px
    style ProgressFlow fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    style ContextPatterns fill:#fff9c4,stroke:#f57f17,stroke-width:2px
```

**Agent Specifications:**

| Agent | Model | Input Size | Output Size | Cost/Call | Purpose |
|-------|-------|------------|-------------|-----------|---------|
| **Orchestrator** | Python logic (no LLM) | - | - | $0 | Route requests to appropriate agent |
| **Compression** | Claude Haiku | ~6000 tokens (12 assessments) | ~150 tokens (summary) | ~$0.002 | Summarize athlete history for context efficiency |
| **Assessment** | Claude Sonnet 4.5 | ~2500 tokens (metrics + cached benchmarks) | ~400 tokens | ~$0.05 | Generate single-test coaching feedback |
| **Progress** | Claude Sonnet 4.5 | ~1100 tokens (summary + team context) | ~600 tokens | ~$0.08 | Generate trend analysis and parent reports |

**Context Optimization Strategies:**

1. **Offloading**: Store raw keypoints (33 landmarks × 900 frames = ~30KB JSON) in Firebase Storage instead of LLM context
2. **Compression**: Use fast/cheap Haiku model to summarize 12 assessments (6000 tokens → 150 tokens) before passing to expensive Sonnet
3. **Isolation**: Each agent receives only data relevant to its task (no unnecessary context)
4. **Caching**: Cache static LTAD age-based benchmarks in system prompt (~90% cache hit rate = ~90% cost savings)

**Cost Projections:**
- Assessment feedback: $0.05 per test
- Parent report: $0.08 per report (includes compression)
- 1000 assessments/month: ~$50-80/month in AI costs

---

## 4. Database Schema

Firestore NoSQL collections and relationships.

```mermaid
erDiagram
    USERS ||--o{ ATHLETES : "coaches"
    USERS ||--o{ ASSESSMENTS : "creates"
    ATHLETES ||--o{ ASSESSMENTS : "tested_in"
    ATHLETES ||--o{ PARENT_REPORTS : "subject_of"
    ASSESSMENTS }o--o{ PARENT_REPORTS : "included_in"

    USERS {
        string userId PK
        string email UK
        string name
        timestamp createdAt
        int athleteCount "soft limit: 25"
    }

    ATHLETES {
        string athleteId PK
        string coachId FK
        string name
        int age "5-13 years"
        enum gender "male|female|other"
        string parentEmail
        enum consentStatus "pending|active|declined"
        string consentToken "UUID for consent link"
        timestamp consentTimestamp "null if pending"
        timestamp createdAt
    }

    ASSESSMENTS {
        string assessmentId PK
        string athleteId FK
        string coachId FK
        enum testType "one_leg_balance (MVP)"
        enum legTested "left|right"
        string videoUrl "Firebase Storage path"
        string rawKeypointsUrl "Firebase Storage JSON path"
        enum status "processing|completed|failed"
        object metrics "11 derived metrics (see below)"
        string aiFeedback "AI-generated coaching text"
        string coachNotes "optional annotations"
        timestamp createdAt
    }

    PARENT_REPORTS {
        string reportId PK
        string athleteId FK
        string coachId FK
        array assessmentIds "list of included assessment IDs"
        string accessPin "6-digit PIN"
        string reportContent "AI-generated report text"
        timestamp createdAt
        timestamp sentAt "email sent timestamp"
    }
```

**Assessment Metrics Object** (11 fields):
```typescript
{
  durationSeconds: number;        // 0-30 seconds
  stabilityScore: number;         // 0-100 composite score
  swayStdX: number;              // Hip horizontal variance (cm)
  swayStdY: number;              // Hip vertical variance (cm)
  swayPathLength: number;        // Total hip trajectory (cm)
  swayVelocity: number;          // Average hip speed (cm/s)
  armExcursionLeft: number;      // Left arm movement from hips (cm)
  armExcursionRight: number;     // Right arm movement from hips (cm)
  armAsymmetryRatio: number;     // Left/right compensation ratio
  correctionsCount: number;      // Balance adjustment events
  failureReason: string | null;  // "foot_touchdown"|"hands_off_hips"|"support_foot_moved"|null
}
```

**Access Patterns:**
- Coaches query their own athletes: `athletes.where('coachId', '==', userId)`
- Athlete assessment history: `assessments.where('athleteId', '==', athleteId).orderBy('createdAt', 'desc')`
- Recent coach activity: `assessments.where('coachId', '==', userId).orderBy('createdAt', 'desc').limit(10)`
- Parent report lookup: `parent_reports.doc(reportId)` (public access with PIN verification)

**Firestore Security Rules:**
- Coaches can only access their own data
- Parents can view reports with correct 6-digit PIN (public read with PIN validation function)
- Consent forms are publicly accessible via token (no auth required)

---

## 5. Backend Services

Service layer architecture and API route mapping.

```mermaid
graph TB
    subgraph "API Routes (app/routes/)"
        AuthRoutes[auth.py<br/>POST /auth/token<br/>POST /auth/logout]
        AthleteRoutes[athletes.py<br/>CRUD + List<br/>POST/GET/PUT/DELETE]
        ConsentRoutes[consent.py<br/>Public consent workflow<br/>GET/POST /consent/:token]
        AssessRoutes[assessments.py<br/>Upload + CRUD<br/>POST /analyze, GET/PUT/DELETE]
        ReportRoutes[reports.py<br/>Generate + Send<br/>POST /generate, POST /send]
        DashRoutes[dashboard.py<br/>Aggregate data<br/>GET /dashboard]
    end

    subgraph "Service Layer (app/services/)"
        AuthSvc[auth.py<br/>Firebase JWT validation<br/>User creation]
        MediaPipeSvc[mediapipe_service.py<br/>Pose detection<br/>Keypoint extraction<br/>Failure detection]
        MetricsSvc[metrics_calculator.py<br/>11 derived metrics<br/>Butterworth filtering<br/>Stability scoring]
        EmailSvc[email_service.py<br/>Resend API client<br/>Consent emails<br/>Parent reports]
        StorageSvc[storage_service.py<br/>Firebase Storage ops<br/>Upload/download<br/>Signed URLs]
        AnalysisSvc[analysis.py<br/>Pipeline orchestrator<br/>MediaPipe → Metrics → AI]
    end

    subgraph "AI Agents (app/agents/)"
        Orchestrator[orchestrator.py<br/>Request routing<br/>Pure Python logic]
        CompressionAgent[compression.py<br/>Haiku summarization<br/>6000→150 tokens]
        AssessmentAgent[assessment.py<br/>Sonnet feedback<br/>Single test analysis]
        ProgressAgent[progress.py<br/>Sonnet reports<br/>Trend analysis]
        AgentClient[client.py<br/>OpenRouter API<br/>Prompt caching]
    end

    subgraph "External Dependencies"
        Firebase[Firebase Admin SDK<br/>Auth, Firestore, Storage]
        OpenRouter[OpenRouter API<br/>Claude models]
        ResendAPI[Resend API<br/>Email delivery]
        MediaPipe[MediaPipe v0.10.9<br/>BlazePose 33 landmarks]
    end

    AuthRoutes --> AuthSvc
    AthleteRoutes --> AuthSvc
    ConsentRoutes --> EmailSvc
    ConsentRoutes --> Firebase

    AssessRoutes --> AnalysisSvc
    AnalysisSvc --> MediaPipeSvc
    AnalysisSvc --> MetricsSvc
    AnalysisSvc --> Orchestrator
    AnalysisSvc --> StorageSvc

    MediaPipeSvc --> MediaPipe

    ReportRoutes --> Orchestrator
    ReportRoutes --> EmailSvc
    DashRoutes --> Firebase

    Orchestrator --> CompressionAgent
    Orchestrator --> AssessmentAgent
    Orchestrator --> ProgressAgent

    CompressionAgent --> AgentClient
    AssessmentAgent --> AgentClient
    ProgressAgent --> AgentClient
    AgentClient --> OpenRouter

    AuthSvc --> Firebase
    EmailSvc --> ResendAPI
    StorageSvc --> Firebase

    classDef routeClass fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef serviceClass fill:#e3f2fd,stroke:#01579b,stroke-width:2px
    classDef agentClass fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef externalClass fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px

    class AuthRoutes,AthleteRoutes,ConsentRoutes,AssessRoutes,ReportRoutes,DashRoutes routeClass
    class AuthSvc,MediaPipeSvc,MetricsSvc,EmailSvc,StorageSvc,AnalysisSvc serviceClass
    class Orchestrator,CompressionAgent,AssessmentAgent,ProgressAgent,AgentClient agentClass
    class Firebase,OpenRouter,ResendAPI,MediaPipe externalClass
```

**Key API Endpoints:**

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/auth/token` | Validate Firebase JWT | No (public) |
| POST | `/athletes` | Create athlete | Yes (coach) |
| GET | `/athletes` | List coach's athletes | Yes (coach) |
| POST | `/athletes/:id/resend-consent` | Resend consent email | Yes (coach) |
| GET | `/consent/:token` | Display consent form | No (public) |
| POST | `/consent/:token/sign` | Submit signed consent | No (public) |
| POST | `/assessments/analyze` | Upload video for analysis | Yes (coach) |
| GET | `/assessments/:id` | Get assessment (polling) | Yes (coach) |
| POST | `/reports/generate/:athleteId` | Preview parent report | Yes (coach) |
| POST | `/reports/:athleteId/send` | Send report to parent | Yes (coach) |
| GET | `/reports/view/:id` | View report (PIN required) | No (public) |
| GET | `/dashboard` | Coach dashboard data | Yes (coach) |

**Service Responsibilities:**

- **auth.py**: Firebase token validation, create middleware dependency `get_current_user()`
- **mediapipe_service.py**: Frame extraction, pose detection, Butterworth filtering (2Hz cutoff), failure detection
- **metrics_calculator.py**: Derive 11 metrics from raw landmarks using biomechanical formulas
- **email_service.py**: Send consent requests and parent reports via Resend with HTML templates
- **storage_service.py**: Upload videos/keypoints, generate signed URLs, manage file lifecycle
- **analysis.py**: Orchestrate the full pipeline: MediaPipe → metrics → AI agents → Firestore update

---

## 6. Frontend Architecture

React SPA structure with components, services, contexts, and hooks.

```mermaid
graph TB
    subgraph "Entry Point"
        Main[main.tsx<br/>App Bootstrap]
        App[App.tsx<br/>React Router + Providers]
    end

    subgraph "Context Providers (src/contexts/)"
        AuthContext[AuthContext.tsx<br/>Firebase auth state<br/>useAuth hook]
    end

    subgraph "Page Components (src/pages/)"
        Landing[Landing.tsx<br/>Public landing page]
        Login[Login.tsx<br/>Firebase email + Google OAuth]
        Dashboard[Dashboard.tsx<br/>Coach home with stats]
        Athletes[Athletes.tsx<br/>Athlete roster list]
        AthleteProfile[AthleteProfile.tsx<br/>Individual athlete view]
        AssessmentResults[AssessmentResults.tsx<br/>Test results display]
        ConsentForm[ConsentForm.tsx<br/>Public parent consent]
        ReportView[ReportView.tsx<br/>Public parent report]
    end

    subgraph "Reusable Components (src/components/)"
        VideoRecorder[VideoRecorder.tsx<br/>Camera + MediaPipe.js preview]
        VideoUpload[VideoUpload.tsx<br/>Drag-and-drop file upload]
        AssessmentCard[AssessmentCard.tsx<br/>Metrics display]
        ScoreBadge[ScoreBadge.tsx<br/>Visual score indicator]
        ConsentBadge[ConsentBadge.tsx<br/>Status badge]
        AthleteForm[AthleteForm.tsx<br/>Add/edit athlete]
        AthleteList[AthleteList.tsx<br/>Roster table]
    end

    subgraph "Custom Hooks (src/hooks/)"
        useAuth[useAuth.tsx<br/>Auth context consumer]
        useEditLock[useEditLock.tsx<br/>Prevent concurrent edits]
        useCamera[useCamera.tsx<br/>Camera access management]
        useVideoRecorder[useVideoRecorder.tsx<br/>Recording state]
    end

    subgraph "Services (src/services/)"
        ApiClient[api.ts<br/>Backend HTTP client<br/>snake_case ↔ camelCase]
        FirebaseInit[firebase.ts<br/>Firebase SDK initialization]
        FirestoreService[firestore.ts<br/>Firestore queries]
        StorageService[storage.ts<br/>Firebase Storage uploads]
    end

    subgraph "External SDKs"
        FirebaseSDK[Firebase JS SDK<br/>Auth + Firestore + Storage]
        MediaPipeJS[MediaPipe.js<br/>Pose Landmarker API]
        MUI[Material-UI v5<br/>Component library]
    end

    Main --> App
    App --> AuthContext
    App --> Landing
    App --> Login
    App --> Dashboard

    Dashboard --> Athletes
    Athletes --> AthleteList
    Athletes --> AthleteForm
    AthleteList --> AthleteProfile

    AthleteProfile --> VideoRecorder
    AthleteProfile --> VideoUpload
    AthleteProfile --> AssessmentCard

    VideoRecorder --> useCamera
    VideoRecorder --> useVideoRecorder
    VideoRecorder --> MediaPipeJS
    VideoRecorder --> StorageService

    AssessmentCard --> ScoreBadge
    AthleteList --> ConsentBadge

    Login --> useAuth
    Dashboard --> useAuth
    AthleteForm --> useEditLock

    ApiClient --> |HTTP requests| Backend[Backend API<br/>FastAPI]
    FirestoreService --> FirebaseSDK
    StorageService --> FirebaseSDK
    AuthContext --> FirebaseSDK

    useAuth --> AuthContext

    classDef entryClass fill:#e1bee7,stroke:#4a148c,stroke-width:2px
    classDef contextClass fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef pageClass fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef componentClass fill:#e3f2fd,stroke:#01579b,stroke-width:2px
    classDef hookClass fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef serviceClass fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px

    class Main,App entryClass
    class AuthContext contextClass
    class Landing,Login,Dashboard,Athletes,AthleteProfile,AssessmentResults,ConsentForm,ReportView pageClass
    class VideoRecorder,VideoUpload,AssessmentCard,ScoreBadge,ConsentBadge,AthleteForm,AthleteList componentClass
    class useAuth,useEditLock,useCamera,useVideoRecorder hookClass
    class ApiClient,FirebaseInit,FirestoreService,StorageService,FirebaseSDK,MediaPipeJS,MUI serviceClass
```

**Key Frontend Patterns:**

1. **Route Protection**:
   - `useAuth()` hook checks Firebase auth state
   - Protected routes redirect to `/login` if not authenticated

2. **Case Conversion**:
   - Backend uses `snake_case`, frontend uses `camelCase`
   - Automatic conversion via `snakecase-keys` and `camelcase-keys` in API client

3. **MediaPipe.js Usage**:
   - Initialize Pose Landmarker for real-time skeleton overlay
   - Preview-only (≥15 FPS target)
   - Server-side Python MediaPipe is source of truth

4. **Video Recording Flow**:
   ```
   Coach clicks "Start"
   → 3-second countdown
   → Record for 30 seconds (or until failure)
   → Preview playback
   → Confirm or reshoot
   → Upload to Firebase Storage
   → POST to backend API
   ```

5. **Edit Locking**:
   - `useEditLock(resourceType, resourceId)` prevents concurrent athlete edits
   - Uses Firestore transactions to ensure only one coach can edit at a time

6. **State Management**:
   - Global: AuthContext for user state
   - Local: `useState` for component UI state
   - Optional: React Query for server state caching

---

## Performance Requirements

**NFR-1: Live Skeleton Overlay**
- Target: ≥15 FPS
- Technology: MediaPipe.js Pose Landmarker (client-side)
- Optimization: Use lightweight BlazePose model, render on Canvas

**NFR-2: Server Video Analysis**
- Target: <30 seconds for full processing pipeline
- Includes: Video download + MediaPipe analysis + metric calculation + keypoint storage
- Optimization: Async background task, process frames in batches

**NFR-3: AI Feedback Generation**
- Target: <10 seconds
- Includes: Orchestrator routing + compression (if needed) + Sonnet inference
- Optimization: Prompt caching for static LTAD benchmarks (~90% cost savings + speed boost)

**NFR-4: Page Load Time**
- Target: <3 seconds for initial load
- Optimization: Code splitting, lazy load assessment components, cache API responses

**NFR-5: Concurrent Users**
- Target: Support 50 concurrent coaches
- Backend: Render.com scaling (horizontal for backend, Firebase auto-scales)

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool & dev server |
| Material-UI | 5.x | Component library |
| React Router | 6.x | Client-side routing |
| Firebase JS SDK | 10.x | Auth, Firestore, Storage |
| MediaPipe.js | 0.10.9 | Client-side pose detection |
| Axios | 1.x | HTTP client |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11 | Runtime |
| FastAPI | 0.104+ | Web framework |
| pip + requirements.txt | - | Dependency management |
| Firebase Admin SDK | 6.x | Server-side Firebase |
| MediaPipe Python | 0.10.9 | Server-side pose detection |
| OpenCV | 4.8+ | Video processing |
| SciPy | 1.11+ | Signal processing (Butterworth filter) |
| OpenRouter SDK | Custom | Claude API access |
| Resend SDK | 0.7+ | Email delivery |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Vercel | Frontend hosting |
| Render.com | Backend hosting |
| Firebase Auth | Authentication |
| Cloud Firestore | NoSQL database |
| Firebase Storage | File storage |
| OpenRouter | Claude API gateway |
| Resend | Transactional email |

---

## References

- **Main PRD**: `prd.md`
- **Development Guide**: `CLAUDE.md`
- **Backend README**: `backend/README.md`
- **Backend PRDs**: `backend/prds/BE-001` through `BE-015`
- **Frontend README**: `client/README.md`
- **Frontend PRDs**: `client/prds/FE-001` through `FE-016`
- **Dependency Graph**: `DEPENDENCY_GRAPH.md`

---

**Last Updated**: 2025-12-11
**Document Version**: 1.0.0
**Status**: Documentation complete, implementation pending
