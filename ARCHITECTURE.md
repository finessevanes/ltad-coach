# LTAD Coach MVP - System Architecture

> Computer vision athletic assessment platform for youth sports coaches

**Version**: 0.3.0
**Target Demo**: December 18, 2025
**Status**: Phases 0-7 implemented, Phase 8+ pending

> **Architecture Evolution**: The implementation has diverged from the original PRD. Key change: MediaPipe analysis now runs client-side (not server-side). The client is the source of truth for all CV metrics. See details below.

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

**Key Architectural Principles (Current Implementation):**
- **Client-side metrics**: MediaPipe.js calculates all CV metrics client-side; backend validates and stores
- **Synchronous processing**: Assessments complete immediately (no background tasks needed)
- **Backend as proxy**: Backend validates auth/consent, calculates LTAD scores, and generates AI feedback
- **Firebase-centric**: Firestore for data, Storage for videos, Auth for authentication
- **AI agents operational**: Phase 7 AI feedback fully implemented via orchestrator

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
        MediaPipeJS[MediaPipe.js<br/>Client-side Analysis<br/>SOURCE OF TRUTH for metrics]
        MetricsCalc[Metrics Calculator<br/>utils/metricsCalculation.ts]
    end

    subgraph "Backend (Render)"
        FastAPI[FastAPI<br/>Python 3.11<br/>Port 8000]
        DurationScore[Duration Scoring<br/>LTAD benchmarks only]
    end

    subgraph "Firebase (Google Cloud)"
        FireAuth[Firebase Auth<br/>Google OAuth + Email/Password]
        Firestore[Cloud Firestore<br/>NoSQL Document Store]
        FireStorage[Firebase Storage<br/>Videos only]
    end

    subgraph "External Services"
        Anthropic[Anthropic API<br/>Claude Haiku for AI Agents]
        Resend[Resend API<br/>Transactional Email]
    end

    Coach -->|Records Video| React
    Coach -->|Views Results| React
    Parent -->|Accesses Consent| React

    React -->|Pose Detection| MediaPipeJS
    MediaPipeJS -->|Landmarks| MetricsCalc
    React -->|Upload Video| FireStorage
    React -->|Auth| FireAuth
    React -->|Send Metrics| FastAPI
    React -->|Read Data| Firestore

    FastAPI -->|Validate Token| FireAuth
    FastAPI -->|Store Assessment| Firestore
    FastAPI -->|Calculate Score| DurationScore
    FastAPI -->|Generate Feedback| Anthropic
    FastAPI -->|Send Emails| Resend

    classDef userClass fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef frontendClass fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef backendClass fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef firebaseClass fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef externalClass fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef notImplemented fill:#ffcdd2,stroke:#c62828,stroke-width:2px

    class Coach,Parent,Athlete userClass
    class React,MediaPipeJS,MetricsCalc frontendClass
    class FastAPI,DurationScore backendClass
    class FireAuth,Firestore,FireStorage firebaseClass
    class Anthropic,Resend externalClass
```

**Key Points (Current Implementation):**
- **Deployment**: Frontend on Vercel (static), Backend on Render (Python)
- **Authentication**: Firebase handles all auth; backend validates tokens
- **Metrics Calculation**: Client-side MediaPipe.js is source of truth (not server-side)
- **Storage Strategy**: Videos in Firebase Storage, metrics in Firestore
- **AI Processing**: Fully operational via orchestrator (Phase 7 complete)

---

## 2. Data Flow

End-to-end pipeline from video capture to results display.

> **Note**: This diagram reflects the CURRENT implementation, which differs from the original PRD. Client-side MediaPipe is the source of truth.

```mermaid
sequenceDiagram
    actor Coach
    participant React as React Frontend
    participant MediaPipeJS as MediaPipe.js<br/>(Source of Truth)
    participant MetricsCalc as Client Metrics<br/>(metricsCalculation.ts)
    participant FireStorage as Firebase Storage
    participant FastAPI as FastAPI Backend
    participant Firestore as Cloud Firestore

    Coach->>React: 1. Start recording
    React->>MediaPipeJS: 2. Initialize camera stream

    loop During Recording (30s max)
        MediaPipeJS-->>React: 3. Stream landmarks (≥15 FPS)
        React->>MetricsCalc: 4. Track positions in real-time
    end

    Coach->>React: 5. Stop recording (or auto-stop on failure)
    React->>MetricsCalc: 6. Calculate final metrics
    MetricsCalc-->>React: 7. Return all 11 metrics

    React->>FireStorage: 8. Upload video blob
    FireStorage-->>React: 9. Return video URL

    React->>FastAPI: 10. POST /assessments/analyze<br/>(video_url, athlete_id, client_metrics)

    Note over FastAPI: Validate ownership & consent

    FastAPI->>FastAPI: 11. Calculate duration_score<br/>+ age_expectation (LTAD)
    FastAPI->>Firestore: 12. Create assessment<br/>status: "completed"

    Note over FastAPI: Generate AI feedback via orchestrator

    FastAPI->>Anthropic: 13. Generate coach feedback<br/>(assessment agent)
    Anthropic-->>FastAPI: 14. Return AI feedback
    FastAPI->>Firestore: 15. Update with ai_coach_assessment
    FastAPI-->>React: 16. Return assessment_id + status

    React->>Coach: 17. Display results<br/>(metrics + AI feedback)
```

**Performance Targets (NFRs):**
- **NFR-1**: Live skeleton overlay ≥15 FPS (client-side) ✅ Achieved
- **NFR-2**: Assessment storage <2 seconds (no server-side video processing)
- **NFR-3**: AI feedback generation <10 seconds ✅ Achieved (3-6 seconds typical)
- **NFR-4**: Page load time <3 seconds ✅ Achieved

**Current Design Decisions:**
- **Client as source of truth**: All CV metrics calculated in browser via MediaPipe.js
- **Synchronous flow**: No background processing, assessments complete immediately
- **Backend validation only**: Backend validates auth, consent, calculates LTAD scores
- **No polling needed**: Assessment returns as "completed" immediately

---

## 3. AI Agent Architecture

> **✅ STATUS: IMPLEMENTED (Phase 7 Complete)**
>
> The AI agent system is fully operational. All four agents are implemented in `backend/app/agents/` with static LTAD context in `backend/app/prompts/static_context.py`. Currently using Claude Haiku for all agents via Anthropic API (direct, not OpenRouter).

Four-agent system using Claude models via Anthropic API with context optimization patterns.

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

**Implemented Agent Specifications:**

| Agent | Model | Input Size | Output Size | Cost/Call | Purpose |
|-------|-------|------------|-------------|-----------|---------|
| **Orchestrator** | Python logic (no LLM) | - | - | $0 | Route requests and execute appropriate workflow |
| **Compression** | Claude Haiku | ~6000 tokens (12 assessments) | ~150 words (summary) | ~$0.002 | Summarize athlete history for context efficiency |
| **Assessment** | Claude Haiku | ~2500 tokens (metrics + LTAD context) | ~200 words | ~$0.005 | Generate single-test coaching feedback |
| **Progress** | Claude Haiku | ~1100 tokens (summary + team context) | ~350 words | ~$0.008 | Generate trend analysis and parent reports |

**Implemented Context Optimization Strategies:**

1. **Offloading**: Raw keypoints (33 landmarks × 900 frames = ~30KB JSON) stored in Firebase Storage, not sent to LLM
2. **Compression**: Haiku model summarizes 12 assessments (~6000 tokens → ~150 words) before passing to Progress agent
3. **Isolation**: Each agent receives only relevant data via orchestrator routing
4. **Unified Entry Point**: All AI operations go through `orchestrator.generate_feedback()` for consistency
5. **Fallback Mechanisms**: Template-based responses provided when API calls fail

**Actual Costs:**
- Assessment feedback: ~$0.005 per test (Haiku)
- Progress report: ~$0.010 per report (includes compression)
- 1000 assessments/month: ~$5-10/month in AI costs (using Haiku)
- System designed to support Sonnet upgrade when access is granted

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

**Assessment Metrics Object** (all metrics in real-world units):
```typescript
{
  // Time
  holdTime: number;              // 0-30 seconds

  // Sway metrics (cm)
  swayStdX: number;              // Hip horizontal variance (cm)
  swayStdY: number;              // Hip vertical variance (cm)
  swayPathLength: number;        // Total hip trajectory (cm)
  swayVelocity: number;          // Average hip speed (cm/s)
  correctionsCount: number;      // Balance adjustment events

  // Arm metrics (degrees)
  armAngleLeft: number;          // Left arm angle from horizontal (degrees, 0° = T-position)
  armAngleRight: number;         // Right arm angle from horizontal (degrees)
  armAsymmetryRatio: number;     // Left/right angle ratio

  // Scores
  stabilityScore: number;        // 0-100 composite score
  durationScore: number;         // 1-5 LTAD score
  durationScoreLabel: string;    // "Beginning"|"Developing"|"Competent"|"Proficient"|"Advanced"
  ageExpectation?: string;       // "above"|"meets"|"below"

  // Temporal analysis (fatigue pattern)
  temporal?: {
    firstThird: SegmentMetrics;  // Metrics for first 33% of test
    middleThird: SegmentMetrics; // Metrics for 33-66% of test
    lastThird: SegmentMetrics;   // Metrics for final 33% of test
  }
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

> **Note**: This section reflects the CURRENT implementation, which differs from the original PRD. The backend serves as a validated write proxy - receiving pre-calculated metrics from the client.

Service layer architecture and API route mapping.

```mermaid
graph TB
    subgraph "API Routers (app/routers/)"
        AuthRoutes[auth.py<br/>POST /auth/me<br/>Firebase token validation]
        AthleteRoutes[athletes.py<br/>CRUD + List<br/>POST/GET/PUT/DELETE]
        ConsentRoutes[consent.py<br/>Public consent workflow<br/>GET/POST /consent/:token]
        AssessRoutes[assessments.py<br/>Store client metrics<br/>POST /analyze, GET /:id]
    end

    subgraph "Repository Layer (app/repositories/)"
        BaseRepo[base.py<br/>Firestore base operations]
        UserRepo[user.py<br/>User document access]
        AthleteRepo[athlete.py<br/>Athlete CRUD + ownership]
        AssessmentRepo[assessment.py<br/>Assessment storage]
    end

    subgraph "Service Layer (app/services/)"
        MetricsSvc[metrics.py<br/>Duration scoring only<br/>LTAD age expectations]
        EmailSvc[email.py<br/>Resend API client<br/>Consent emails]
        VideoSvc[video.py<br/>Video URL handling]
    end

    subgraph "Middleware (app/middleware/)"
        AuthMiddleware[auth.py<br/>Firebase JWT validation<br/>get_current_user dependency]
        RateLimitMiddleware[rate_limit.py<br/>In-memory rate limiting]
    end

    subgraph "Models (app/models/)"
        AssessmentModel[assessment.py<br/>AssessmentCreate, ClientMetrics]
        AthleteModel[athlete.py<br/>Athlete schemas]
        ConsentModel[consent.py<br/>Consent schemas]
        UserModel[user.py<br/>User schema]
        ErrorModel[errors.py<br/>Error response schemas]
    end

    subgraph "Constants (app/constants/)"
        ScoringConst[scoring.py<br/>LTAD duration thresholds<br/>Age expectations]
    end

    subgraph "External Dependencies"
        Firebase[Firebase Admin SDK<br/>Auth, Firestore, Storage]
        ResendAPI[Resend API<br/>Email delivery]
    end

    subgraph "NOT IMPLEMENTED (Phase 7)"
        Agents[agents/<br/>EMPTY]
        Prompts[prompts/<br/>EMPTY]
    end

    AuthRoutes --> AuthMiddleware
    AthleteRoutes --> AuthMiddleware
    AthleteRoutes --> AthleteRepo
    ConsentRoutes --> EmailSvc
    ConsentRoutes --> AthleteRepo

    AssessRoutes --> AuthMiddleware
    AssessRoutes --> RateLimitMiddleware
    AssessRoutes --> AthleteRepo
    AssessRoutes --> AssessmentRepo
    AssessRoutes --> MetricsSvc

    AthleteRepo --> BaseRepo
    AssessmentRepo --> BaseRepo
    UserRepo --> BaseRepo
    BaseRepo --> Firebase

    MetricsSvc --> ScoringConst
    EmailSvc --> ResendAPI
    AuthMiddleware --> Firebase

    classDef routeClass fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef repoClass fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef serviceClass fill:#e3f2fd,stroke:#01579b,stroke-width:2px
    classDef middlewareClass fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef modelClass fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef externalClass fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef notImplemented fill:#ffcdd2,stroke:#c62828,stroke-width:2px

    class AuthRoutes,AthleteRoutes,ConsentRoutes,AssessRoutes routeClass
    class BaseRepo,UserRepo,AthleteRepo,AssessmentRepo repoClass
    class MetricsSvc,EmailSvc,VideoSvc serviceClass
    class AuthMiddleware,RateLimitMiddleware middlewareClass
    class AssessmentModel,AthleteModel,ConsentModel,UserModel,ErrorModel,ScoringConst modelClass
    class Firebase,ResendAPI externalClass
    class Agents,Prompts notImplemented
```

**Implemented API Endpoints:**

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| GET | `/auth/me` | Validate Firebase JWT, return user | Yes |
| POST | `/athletes` | Create athlete | Yes (coach) |
| GET | `/athletes` | List coach's athletes | Yes (coach) |
| GET | `/athletes/:id` | Get single athlete | Yes (coach) |
| PUT | `/athletes/:id` | Update athlete | Yes (coach) |
| DELETE | `/athletes/:id` | Delete athlete | Yes (coach) |
| POST | `/athletes/:id/resend-consent` | Resend consent email | Yes (coach) |
| GET | `/consent/:token` | Display consent form | No (public) |
| POST | `/consent/:token/respond` | Submit consent response | No (public) |
| POST | `/assessments/analyze` | Store client-calculated metrics | Yes (coach) |
| GET | `/assessments/:id` | Get assessment | Yes (coach) |

**Not Yet Implemented (Phase 7+):**

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| POST | `/reports/generate/:athleteId` | AI parent report | Phase 7 |
| POST | `/reports/:athleteId/send` | Send report to parent | Phase 7 |
| GET | `/reports/view/:id` | View report (PIN) | Phase 7 |
| GET | `/dashboard` | Coach dashboard data | Phase 8 |

**Current Service Responsibilities:**

- **middleware/auth.py**: Firebase token validation, `get_current_user()` dependency
- **middleware/rate_limit.py**: In-memory rate limiting (10 assessments/hour)
- **services/metrics.py**: Duration scoring (1-5 scale), age expectations lookup
- **services/email.py**: Send consent requests via Resend
- **repositories/base.py**: Common Firestore CRUD operations
- **repositories/assessment.py**: `create_completed()` for storing client metrics
- **constants/scoring.py**: LTAD duration thresholds and age-based expectations

---

## 6. Frontend Architecture

> **Note**: The frontend is the SOURCE OF TRUTH for all CV metrics. MediaPipe.js runs client-side and calculates all 11 metrics before sending to the backend.

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
        AthleteDetail[AthleteDetail.tsx<br/>Individual athlete view]
        NewAssessment[NewAssessment.tsx<br/>Balance test recording]
        AssessmentResults[AssessmentResults.tsx<br/>Test results display]
        ConsentPage[ConsentPage.tsx<br/>Public parent consent]
    end

    subgraph "Balance Test Components (src/components/)"
        BalanceTest[BalanceTest.tsx<br/>Main test orchestrator]
        CameraView[CameraView.tsx<br/>Camera + skeleton overlay]
        TestControls[TestControls.tsx<br/>Start/stop controls]
        CountdownOverlay[CountdownOverlay.tsx<br/>3-second countdown]
        TestResults[TestResults.tsx<br/>Metrics display]
    end

    subgraph "Utils - Metrics (src/utils/) - SOURCE OF TRUTH"
        MetricsCalc[metricsCalculation.ts<br/>17+ CV metrics<br/>sway, arm angles, temporal, events]
        PositionDetect[positionDetection.ts<br/>Pose state machine<br/>Failure detection]
        MetricsCompare[metricsComparison.ts<br/>Compare test results]
        Validation[validation.ts<br/>Form validation]
    end

    subgraph "Custom Hooks (src/hooks/)"
        useAuth[useAuth.tsx<br/>Auth context consumer]
        useBalanceTest[useBalanceTest.tsx<br/>Full test state machine<br/>Metrics accumulation]
        useMediaPipe[useMediaPipe.tsx<br/>Pose detection loop<br/>Landmark streaming]
        useCamera[useCamera.tsx<br/>Camera access management]
    end

    subgraph "Services (src/services/)"
        ApiClient[api.ts<br/>Backend HTTP client<br/>snake_case ↔ camelCase]
        FirebaseInit[firebase.ts<br/>Firebase SDK initialization]
        AssessmentService[assessments.ts<br/>POST metrics to backend]
        AthleteService[athletes.ts<br/>Athlete CRUD]
    end

    subgraph "External SDKs"
        FirebaseSDK[Firebase JS SDK<br/>Auth + Firestore + Storage]
        MediaPipeJS[MediaPipe.js<br/>Pose Landmarker API<br/>SOURCE OF TRUTH]
        MUI[Material-UI v5<br/>Component library]
    end

    Main --> App
    App --> AuthContext
    App --> Landing
    App --> Login
    App --> Dashboard

    Dashboard --> Athletes
    Athletes --> AthleteDetail
    AthleteDetail --> NewAssessment
    AthleteDetail --> AssessmentResults

    NewAssessment --> BalanceTest
    BalanceTest --> CameraView
    BalanceTest --> TestControls
    BalanceTest --> CountdownOverlay
    BalanceTest --> TestResults

    BalanceTest --> useBalanceTest
    useBalanceTest --> useMediaPipe
    useBalanceTest --> MetricsCalc
    useBalanceTest --> PositionDetect
    useMediaPipe --> MediaPipeJS
    CameraView --> useCamera

    TestResults --> AssessmentService
    AssessmentService --> ApiClient
    ApiClient --> |POST client_metrics| Backend[Backend API<br/>FastAPI]

    AthleteService --> FirebaseSDK
    AuthContext --> FirebaseSDK

    useAuth --> AuthContext

    classDef entryClass fill:#e1bee7,stroke:#4a148c,stroke-width:2px
    classDef contextClass fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef pageClass fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef componentClass fill:#e3f2fd,stroke:#01579b,stroke-width:2px
    classDef utilsClass fill:#c8e6c9,stroke:#2e7d32,stroke-width:3px
    classDef hookClass fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef serviceClass fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef sdkClass fill:#e1f5ff,stroke:#01579b,stroke-width:2px

    class Main,App entryClass
    class AuthContext contextClass
    class Landing,Login,Dashboard,Athletes,AthleteDetail,NewAssessment,AssessmentResults,ConsentPage pageClass
    class BalanceTest,CameraView,TestControls,CountdownOverlay,TestResults componentClass
    class MetricsCalc,PositionDetect,MetricsCompare,Validation utilsClass
    class useAuth,useBalanceTest,useMediaPipe,useCamera hookClass
    class ApiClient,FirebaseInit,AssessmentService,AthleteService serviceClass
    class FirebaseSDK,MediaPipeJS,MUI sdkClass
```

**Key Frontend Patterns:**

1. **Client-Side Metrics Calculation (SOURCE OF TRUTH)**:
   ```typescript
   // utils/metricsCalculation.ts
   export function calculateMetrics(landmarks: NormalizedLandmark[][]): ClientMetrics {
     return {
       holdTime,           // Seconds in valid position
       stabilityScore,     // 0-100 composite score
       swayStdX,          // Hip horizontal variance
       swayStdY,          // Hip vertical variance
       swayPathLength,    // Total hip trajectory
       swayVelocity,      // Average hip speed
       armDeviationLeft,  // Left arm movement
       armDeviationRight, // Right arm movement
       armAsymmetryRatio, // L/R compensation ratio
       correctionsCount,  // Balance adjustments
       failureReason,     // null or failure type
     };
   }
   ```

2. **Balance Test State Machine (useBalanceTest)**:
   ```
   idle → countdown → recording → calculating → completed
                  ↓                    ↓
               failed ←──────────── failed
   ```

3. **Route Protection**:
   - `useAuth()` hook checks Firebase auth state
   - Protected routes redirect to `/login` if not authenticated

4. **Case Conversion**:
   - Backend uses `snake_case`, frontend uses `camelCase`
   - Automatic conversion via `snakecase-keys` and `camelcase-keys` in API client

5. **MediaPipe.js Usage**:
   - Initialize Pose Landmarker in `useMediaPipe` hook
   - Stream landmarks at ≥15 FPS to `useBalanceTest`
   - `useBalanceTest` accumulates positions for metric calculation
   - **Client is source of truth** - backend only stores and adds duration score

6. **Video Recording Flow**:
   ```
   Coach clicks "Start"
   → 3-second countdown (CountdownOverlay)
   → Record for 30 seconds (or until failure detected)
   → Calculate all 11 metrics (metricsCalculation.ts)
   → Upload video to Firebase Storage
   → POST metrics to backend (/assessments/analyze)
   → Backend adds duration_score + age_expectation
   → Display results (TestResults)
   ```

7. **State Management**:
   - Global: AuthContext for user state
   - Local: `useState` for component UI state
   - Hook-based: `useBalanceTest` manages full test lifecycle

---

## Performance Requirements

**NFR-1: Live Skeleton Overlay** ✅ ACHIEVED
- Target: ≥15 FPS
- Technology: MediaPipe.js Pose Landmarker (client-side)
- Optimization: Use lightweight BlazePose model, render on Canvas
- Status: Implemented in `useMediaPipe` hook

**NFR-2: Assessment Storage** ✅ ACHIEVED (changed from original)
- Target: <2 seconds
- Original: <30 seconds for server-side video analysis
- Current: Client calculates metrics, backend only stores - no server-side processing
- Note: Server-side MediaPipe analysis NOT IMPLEMENTED

**NFR-3: AI Feedback Generation** ❌ NOT IMPLEMENTED
- Target: <10 seconds
- Status: Phase 7 - AI agents not yet implemented
- Planned: Orchestrator routing + compression + Sonnet inference

**NFR-4: Page Load Time** ✅ ACHIEVED
- Target: <3 seconds for initial load
- Optimization: Code splitting, lazy load assessment components, cache API responses

**NFR-5: Concurrent Users**
- Target: Support 50 concurrent coaches
- Backend: Render.com scaling (horizontal for backend, Firebase auto-scales)
- Rate limiting: 10 assessments/hour per coach (in-memory)

---

## Technology Stack

### Frontend (Implemented)
| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| React | 18.x | UI framework | ✅ |
| TypeScript | 5.x | Type safety | ✅ |
| Vite | 5.x | Build tool & dev server | ✅ |
| Material-UI | 5.x | Component library | ✅ |
| React Router | 6.x | Client-side routing | ✅ |
| Firebase JS SDK | 10.x | Auth, Firestore, Storage | ✅ |
| MediaPipe.js | 0.10.x | Client-side pose detection (SOURCE OF TRUTH) | ✅ |
| Axios | 1.x | HTTP client | ✅ |

### Backend (Implemented)
| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| Python | 3.11 | Runtime | ✅ |
| FastAPI | 0.104+ | Web framework | ✅ |
| pip + requirements.txt | - | Dependency management | ✅ |
| Firebase Admin SDK | 6.x | Server-side Firebase | ✅ |
| Resend SDK | 0.7+ | Email delivery | ✅ |
| Pydantic | 2.x | Data validation | ✅ |

### Backend (NOT Implemented - Phase 7)
| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| MediaPipe Python | 0.10.9 | Server-side pose detection | ❌ Not used |
| OpenCV | 4.8+ | Video processing | ❌ Not used |
| SciPy | 1.11+ | Signal processing | ❌ Not used |
| OpenRouter SDK | Custom | Claude API access | ❌ Phase 7 |

### Infrastructure
| Service | Purpose | Status |
|---------|---------|--------|
| Vercel | Frontend hosting | ✅ |
| Render.com | Backend hosting | ✅ |
| Firebase Auth | Authentication | ✅ |
| Cloud Firestore | NoSQL database | ✅ |
| Firebase Storage | Video storage | ✅ |
| Resend | Transactional email | ✅ |
| OpenRouter | Claude API gateway | ❌ Phase 7 |

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

**Last Updated**: 2025-12-13
**Document Version**: 0.3.0
**Status**: Updated to reflect actual implementation (Phases 0-7 complete, Phase 8+ pending)
