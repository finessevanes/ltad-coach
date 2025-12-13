# AI Coach MVP - Product Requirements Document

**Computer Vision Athletic Assessment Platform for Youth Sports**

| Field | Value |
|-------|-------|
| Document Version | 1.0 |
| Last Updated | December 10, 2025 |
| Target Milestone | Investor Demo - December 18, 2025 |

---

## 1. Executive Summary

### 1.1 Purpose

This document serves as the single source of truth for the AI Coach MVP engineering team. It consolidates all technical requirements, architectural decisions, and implementation details for delivering a functional demo featuring live athletic assessment analysis.

### 1.2 Product Vision

AI Coach is a computer vision-powered athletic assessment platform designed for youth sports coaches. The platform enables coaches to conduct standardized athletic tests (starting with the One-Leg Balance Test), automatically analyze performance using MediaPipe pose estimation, and generate AI-powered feedback using a multi-agent system built on Claude. The platform follows the Long Term Athlete Development (LTAD) framework, supporting youth athletes ages 5-13 based on Jeremy Frisch's athletic development benchmarks.

### 1.3 Key Decisions Summary

| Decision Area | Decision |
|---------------|----------|
| Video Capture | Local browser camera (webcam or iPhone Continuity) + upload. No WebRTC peer-to-peer streaming. |
| AI Architecture | Custom orchestration with Claude via OpenRouter (Haiku for compression, Sonnet for assessment/progress agents) |
| Target Population | Youth athletes ages 5-13, LTAD framework (Jeremy Frisch benchmarks) |
| MVP Test | One-Leg Balance Test only, architecture designed for extensibility |
| Parental Consent | Required workflow with automated email, token-protected consent form |
| Parent Reports | Shareable link with PIN protection, auto-emailed via Resend |
| Deployment | Vercel (Frontend), Render (Backend), Firebase (Database/Storage/Auth) |

---

> ## ⚠️ Implementation Note (December 2025)
>
> **Phase 6 was implemented differently than specified below.** The architecture changed to use client-side MediaPipe.js as the SOURCE OF TRUTH for all CV metrics.
>
> **Key changes from this PRD:**
> - MediaPipe runs in the browser (not server-side Python)
> - All 11 CV metrics calculated client-side before upload
> - Backend validates auth/consent and adds LTAD duration scoring only
> - Assessments complete synchronously (no background processing or polling)
> - AI agents (Phase 7) are not yet implemented
>
> See [ARCHITECTURE.md](./ARCHITECTURE.md) for the current implementation design.

---

## 2. Product Overview

### 2.1 Target Users

**Primary: Youth Sports Coaches**

- Youth athletic coaches (PE teachers, club coaches, rec league coaches)
- Working with athletes ages 5-13
- Need to assess athlete development without expensive equipment
- Want objective data to track progress over time
- Need to communicate progress to parents

**Secondary: Parents**

- Receive progress reports from coaches
- View-only access via shared links (no account required)
- Must provide consent for their child to be assessed

### 2.2 Core Value Proposition

1. **Automated Assessment**: Replace subjective coach observations with objective CV-measured metrics
2. **AI-Powered Insights**: Transform raw metrics into actionable coaching feedback using LLM agents
3. **Progress Tracking**: Historical trend analysis with team ranking comparisons
4. **Parent Communication**: Professional, shareable reports that build trust and demonstrate value
5. **LTAD Alignment**: Assessments tied to established youth athletic development frameworks

### 2.3 MVP Scope Boundaries

#### In Scope for MVP

- Coach registration and authentication (Google OAuth, email/password)
- Athlete roster management (max 25 per coach)
- Parental consent workflow with automated emails
- One-Leg Balance Test with live skeleton overlay
- Video recording with preview and reshoot capability
- Backup video upload workflow
- Full deep agent system (Orchestrator, Assessment, Progress, Compression agents)
- Team ranking comparisons
- Parent report generation and sharing with PIN protection
- Assessment history and progress visualization

#### Out of Scope (Post-MVP)

- Additional test types (Superman reps, Y-Balance, etc.)
- Team entity management (multiple teams per coach)
- Native mobile apps
- Payment/subscription system
- Multi-coach organizations
- Video re-analysis capability

---

## 3. System Architecture

### 3.1 Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | React + Material-UI | Responsive web interface with component library |
| Backend | Python + FastAPI | High-performance REST API |
| Database | Firebase Firestore | NoSQL document database for flexible schemas |
| Authentication | Firebase Auth | Google OAuth and email/password auth |
| Storage | Firebase Storage | Video and media file storage |
| CV Processing | MediaPipe | Client-side (JS) for metrics calculation (SOURCE OF TRUTH) |
| AI/LLM | Claude via OpenRouter API | Haiku for compression, Sonnet for assessment/progress |
| Email | Resend | Transactional emails (consent, reports) |
| Frontend Hosting | Vercel | Static site hosting with edge functions |
| Backend Hosting | Render | Python application hosting |

### 3.2 Architecture Overview

The system follows a client-server architecture with client-side MediaPipe.js as the source of truth for all CV metrics.

#### Client Layer (Browser)

- Camera access via `getUserMedia()` API (webcam or iPhone Continuity Camera)
- MediaPipe.js (v0.10.9) for real-time skeleton overlay AND metrics calculation (SOURCE OF TRUTH)
- MediaRecorder for capturing raw video (no skeleton baked in)
- Canvas overlay for skeleton visualization during preview
- All 11 CV metrics calculated client-side before upload

#### Server Layer (Cloud)

- FastAPI receives pre-calculated metrics from client
- Duration-only scoring (LTAD 1-5 scale) and age expectations
- Deep Agent System generates AI feedback from metrics
- Results persisted to Firestore

> **Key Architectural Decision**: Client-side MediaPipe.js is the SOURCE OF TRUTH for all CV metrics. The client calculates all 11 metrics (duration, sway, arm excursion, stability score, etc.) and sends them to the backend. The server only calculates the LTAD duration score (1-5) and generates AI feedback. This simplifies the backend and enables synchronous assessment completion.

### 3.3 Data Flow

#### Primary Flow: Live Recording

1. **Authentication**: Coach logs in via Firebase Auth
2. **Athlete Selection**: Coach selects athlete from roster (must have active consent)
3. **Test Setup**: Coach selects test type and which leg to test
4. **Camera Setup**: Coach selects camera source, positions athlete in frame
5. **Live Preview**: Real-time skeleton overlay via MediaPipe.js
6. **Recording**: 3-2-1 countdown, then 30-second test with visible timer
7. **Preview**: Playback of recorded video, coach chooses Analyze or Reshoot
8. **Client Metrics**: MediaPipe.js calculates all 11 CV metrics client-side
9. **Upload**: Video blob + pre-calculated metrics uploaded to backend
10. **Server Processing**: Backend validates auth/consent, calculates LTAD duration score (1-5)
11. **AI Processing**: Deep Agent System generates feedback from metrics
12. **Storage**: Results saved to Firestore, video URL stored
13. **Display**: Results shown with metrics, AI feedback, peer comparison (synchronous - no polling needed)

#### Backup Flow: Video Upload

For pre-recorded videos or when live recording is impractical, coaches can upload video files directly. The flow starts at step 8 (Upload) and proceeds identically from there.

**Supported formats**: `.mp4`, `.mov`, `.avi`, `.m4v`, `.webm`, HEVC

**Maximum file size**: 100MB (larger files should be compressed or trimmed before upload)

### 3.4 Assessment Processing Pipeline (Sequence Diagram)

The following sequence shows the synchronous processing flow with client-side metrics:

```
┌─────────┐    ┌──────────┐    ┌─────────┐    ┌──────────┐    ┌──────────┐
│ Client  │    │ Firebase │    │ Backend │    │  Agents  │    │Firestore │
│(FE-010) │    │ Storage  │    │(BE-006) │    │(BE-009+) │    │          │
└────┬────┘    └────┬─────┘    └────┬────┘    └────┬─────┘    └────┬─────┘
     │              │               │               │               │
     │ MediaPipe.js │               │               │               │
     │ calculates   │               │               │               │
     │ 11 metrics   │               │               │               │
     │              │               │               │               │
     │ uploadVideo()│               │               │               │
     │─────────────>│               │               │               │
     │              │               │               │               │
     │   videoUrl   │               │               │               │
     │<─────────────│               │               │               │
     │              │               │               │               │
     │ POST /assessments/analyze    │               │               │
     │ { videoUrl, metrics, ... }   │               │               │
     │─────────────────────────────>│               │               │
     │              │               │               │               │
     │              │               │ Calculate LTAD│               │
     │              │               │ duration score│               │
     │              │               │ (1-5)         │               │
     │              │               │               │               │
     │              │               │ orchestrator.route("assessment")
     │              │               │──────────────>│               │
     │              │               │               │               │
     │              │               │   aiFeedback  │               │
     │              │               │<──────────────│               │
     │              │               │               │               │
     │              │               │ Save assessment               │
     │              │               │──────────────────────────────>│
     │              │               │               │               │
     │ { metrics, aiFeedback, ltadScore }          │               │
     │<─────────────────────────────│               │               │
     │              │               │               │               │
```

**Key Implementation Notes:**
- Client calculates all 11 CV metrics using MediaPipe.js before upload
- Backend receives pre-calculated metrics (no server-side MediaPipe)
- Processing is synchronous - no polling required
- Backend only calculates LTAD duration score (1-5) and age expectations
- Derived metrics (~500 tokens) passed to AI agents
- NFR-3: AI feedback must complete in <10 seconds

---

## 4. Deep Agent Architecture

### 4.1 Architecture Overview

The AI system uses a custom orchestration pattern with Claude models via OpenRouter API, implementing four key deep agent patterns: context offloading, context compression, context isolation, and prompt caching. This architecture minimizes token costs while maximizing output quality.

### 4.2 Agent System Components

| Agent | Model | Responsibility |
|-------|-------|----------------|
| Orchestrator | Python Logic (no LLM) | Routes requests to appropriate agents based on request type. No LLM needed - pure conditional logic. |
| Compression Agent | Claude Haiku | Summarizes historical assessment data to reduce token costs. Converts 12 assessments (~6000 tokens) into ~150 token summary. |
| Assessment Agent | Claude Sonnet | Interprets single test results. Generates coach-friendly feedback with coaching cues, progress context, and improvement suggestions. |
| Progress Agent | Claude Sonnet | Analyzes historical trends. Generates parent-friendly reports with progress visualization, team ranking, and developmental context. |

### 4.3 Deep Agent Patterns

#### Pattern 1: Context Offloading

**Problem**: MediaPipe outputs ~30,000+ data points for a 30-second video. Sending this to an LLM would consume 50K+ tokens.

**Solution**: Store raw keypoint data externally in Firestore/Cloud Storage. Only send derived metrics (~500 tokens) to the LLM.

**Implementation**: Raw keypoints saved to `assessments/{id}/raw_keypoints.json`. Derived metrics object passed to agents.

#### Pattern 2: Context Compression

**Problem**: Historical data for progress reports can explode token costs (12 assessments × 500 tokens = 6,000 tokens).

**Solution**: Use Compression Agent (Claude Haiku) to summarize history before sending to Progress Agent.

**Implementation**: Compression Agent produces ~150 token summary capturing key trends, improvements, and patterns.

#### Pattern 3: Context Isolation

**Problem**: Unfocused context leads to unfocused outputs.

**Solution**: Each agent receives only the context it needs. Assessment Agent gets single test data only. Progress Agent gets compressed history + team context.

**Implementation**: Orchestrator filters and routes appropriate data to each agent.

#### Pattern 4: Prompt Caching

**Problem**: Repeated static content (LTAD definitions, benchmarks, scoring rules) wastes tokens.

**Solution**: Use Claude's native prompt caching for static system prompts. Cache LTAD stages, benchmark tables, scoring interpretation, and output templates.

**Cost Impact**: ~90% savings on repeated calls. Without caching: ~$0.44/day. With caching: ~$0.04/day (at 100 calls/day).

### 4.4 Prompt Cache Contents (Static Context)

The following content is cached using Claude's native prompt caching to reduce token costs by ~90%:

- LTAD developmental stage definitions (FUNdamentals, Learn to Train)
- One-Leg Balance Test protocol and failure detection rules
- Hybrid scoring model (duration tiers + quality metrics)
- Age-based expectations and interpretation rules
- Coaching cues organized by detected issue type
- Output format templates (coach feedback, parent reports)
- Score + quality combination interpretation matrix
- Trend analysis patterns for Progress Agent

> **Reference**: See `prompt_cache_static_context.md` for the complete cached system prompt.

### 4.5 Request Routing Logic

The Orchestrator (pure Python, no LLM) routes requests based on type:

| Request Type | Route To | Data Provided |
|--------------|----------|---------------|
| New assessment completed | Assessment Agent | Cached context + current metrics only |
| Generate parent report | Compression → Progress | Compressed history + team context + current |
| View progress trends | Compression → Progress | Compressed history + current |

---

## 5. Data Models & Database Schema

### 5.1 Firestore Collections

#### Collection: `users`

**Path**: `/users/{userId}`

| Field | Type | Description |
|-------|------|-------------|
| email | string | Coach email address |
| name | string | Coach full name |
| createdAt | timestamp | Account creation timestamp |
| athleteCount | number | Current number of athletes (soft limit: 25) |

#### Collection: `athletes`

**Path**: `/athletes/{athleteId}`

| Field | Type | Description |
|-------|------|-------------|
| coachId | string | Reference to `/users/{userId}` |
| name | string | Athlete full name |
| age | number | Athlete age (5-13) |
| gender | string | `'male'` \| `'female'` \| `'other'` |
| parentEmail | string | Parent/guardian email for consent and reports |
| consentStatus | string | `'pending'` \| `'active'` \| `'declined'` |
| consentToken | string | Unique token for consent form URL |
| consentTimestamp | timestamp | When consent was provided (null if pending) |
| createdAt | timestamp | When athlete was added |
| avatarUrl | string | Optional profile photo URL |

#### Collection: `assessments`

**Path**: `/assessments/{assessmentId}`

| Field | Type | Description |
|-------|------|-------------|
| athleteId | string | Reference to `/athletes/{athleteId}` |
| coachId | string | Reference to `/users/{userId}` |
| testType | string | `'one_leg_balance'` (extensible for future tests) |
| legTested | string | `'left'` \| `'right'` |
| createdAt | timestamp | Assessment timestamp |
| videoUrl | string | Firebase Storage path to video |
| rawKeypointsUrl | string | Firebase Storage path to raw keypoints JSON |
| metrics | object | Derived metrics object (see 5.2) |
| aiFeedback | string | Generated feedback from Assessment Agent |
| coachNotes | string | Optional coach annotations |

#### Collection: `parent_reports`

**Path**: `/parent_reports/{reportId}`

| Field | Type | Description |
|-------|------|-------------|
| athleteId | string | Reference to athlete |
| coachId | string | Reference to coach who generated |
| createdAt | timestamp | When report was generated |
| accessPin | string | 6-digit PIN for access |
| reportContent | string | Generated report text from Progress Agent |
| assessmentIds | array | List of assessment IDs included in report |
| sentAt | timestamp | When email was sent to parent |

#### Collection: `benchmarks` (NOT USED IN MVP)

> **Note**: For MVP, benchmark data (LTAD scoring tiers, age expectations) is stored in the **prompt cache** (see BE-009) rather than Firestore. This is because:
> - The data is static and rarely changes
> - It's needed for every AI call (prompt caching provides 90% cost savings)
> - Hardcoding in the frontend `ScoreBadge.tsx` (FE-011) is sufficient for display
>
> A Firestore `benchmarks` collection may be added post-MVP if coaches need custom benchmark overrides.

**Scoring Logic (Hardcoded)**:

| Score | Duration | Label | Expected For |
|-------|----------|-------|--------------|
| 1 | 1-9 sec | Beginning | Ages 5-6 |
| 2 | 10-14 sec | Developing | Age 7 |
| 3 | 15-19 sec | Competent | Ages 8-9 |
| 4 | 20-24 sec | Proficient | Ages 10-11 |
| 5 | 25+ sec | Advanced | Ages 12-13 |

> **Hybrid Scoring Model**: The system uses a two-tier scoring approach. Tier 1 (Duration Score) provides an LTAD-aligned 1-5 score based on how long the athlete maintained balance. Tier 2 (Quality Ranking) provides team-relative rankings based on CV-detected form factors (sway, arm excursion, corrections). See Section 11.4 for details.

### 5.2 Metrics Object Schema

The metrics object stored in each assessment contains all derived values from CV analysis:

| Field | Type | Description |
|-------|------|-------------|
| durationSeconds | number | Time athlete maintained balance (0-30) |
| stabilityScore | number | Composite score (0-100), higher = better |
| swayStdX | number | Standard deviation of lateral (side-to-side) hip movement |
| swayStdY | number | Standard deviation of anterior-posterior hip movement |
| swayPathLength | number | Total distance traveled by hip midpoint (cm) |
| swayVelocity | number | Path length / duration (cm/s) |
| armExcursionLeft | number | Total left arm movement (degrees or cm) |
| armExcursionRight | number | Total right arm movement (degrees or cm) |
| armAsymmetryRatio | number | Left/Right arm movement ratio |
| correctionsCount | number | Number of times sway exceeded threshold |
| failureReason | string | `'time_complete'` \| `'foot_touchdown'` \| `'support_foot_moved'` |
| progressComparison | object | Percent change from rolling 3-test average (null if first test) |
| legAsymmetry | object | Asymmetry ratios if both legs tested in session (null otherwise) |

> **Note**: All sway metrics are stored as raw values (no height normalization). Progress tracking uses intra-individual comparison rather than cross-athlete percentiles.

---

## 6. API Specification

### 6.1 Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/token` | Validate Firebase JWT and create session |
| POST | `/auth/logout` | Invalidate session |

### 6.2 Athlete Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/athletes` | Get all athletes for authenticated coach |
| POST | `/athletes` | Create new athlete (triggers consent email) |
| GET | `/athletes/{id}` | Get single athlete details |
| PUT | `/athletes/{id}` | Update athlete information |
| DELETE | `/athletes/{id}` | Remove athlete from roster |

### 6.3 Consent Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/consent/{token}` | Get consent form (public, token-protected) |
| POST | `/consent/{token}/sign` | Submit signed consent (public) |
| POST | `/consent/{token}/decline` | Decline consent (public) |
| POST | `/athletes/{id}/resend-consent` | Resend consent email |

### 6.4 Assessment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/assessments` | Get all assessments for coach (activity feed) |
| GET | `/assessments/athlete/{athleteId}` | Get assessments for specific athlete |
| POST | `/assessments/analyze` | Submit video for analysis (multipart) |
| GET | `/assessments/{id}` | Get single assessment details |
| PUT | `/assessments/{id}/notes` | Update coach notes |
| DELETE | `/assessments/{id}` | Delete assessment |

### 6.5 Report Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/reports/generate/{athleteId}` | Generate parent report preview |
| POST | `/reports/{athlete_id}/send` | Send report to parent (generates PIN, sends email) |
| GET | `/reports/view/{id}` | Get report content (public, requires PIN) |
| POST | `/reports/view/{id}/verify` | Verify PIN for report access |

### 6.6 Benchmark Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/benchmarks/{testType}/{age}/{gender}` | Get benchmarks |

### 6.7 Dashboard Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Get coach dashboard data (stats, recent activity, pending consent) |

---

## 7. User Flows & Screens

### 7.1 Screen Inventory

#### Public Screens (No Auth)

| Screen | Description |
|--------|-------------|
| Landing Page | Marketing page with product info, Login and Register CTAs |
| Login | Email/password fields, Google OAuth button, Register link |
| Register | Name, email, password fields, Google OAuth option |
| Consent Form | Token-protected parental consent form with legal language, signature checkbox |
| Parent Report View | PIN entry screen, then read-only report display |

#### Coach Core Navigation

| Screen | Description |
|--------|-------------|
| Dashboard | Overview with quick stats, recent assessments, pending consent alerts |
| All Assessments | Chronological feed of all assessments across all athletes |
| Athletes List | Roster with status badges (pending/active), search, add button |
| Settings | Account settings, preferences |

#### Athlete Management

| Screen | Description |
|--------|-------------|
| Add Athlete | Form: name, age, gender, parent email. Submit triggers consent email |
| Athlete Profile | Details, assessment history list, progress chart, New Assessment button |
| Edit Athlete | Update athlete information, resend consent option |

#### Assessment Flow

| Screen | Description |
|--------|-------------|
| Test Setup | Select test type (One-Leg Balance), select leg (left/right) |
| Camera Setup | Camera source selection, positioning guide, athlete framing preview |
| Live Preview | Live video with skeleton overlay, Start Recording button |
| Recording | 3-2-1 countdown, 30-second timer, skeleton overlay, Stop button |
| Recording Preview | Playback with skeleton, Analyze and Reshoot buttons |
| Processing | Upload progress, analysis status indicators |
| Results | Metrics, AI feedback, peer comparison, coach notes, Generate Report button |

#### Parent Report Flow

| Screen | Description |
|--------|-------------|
| Report Preview | Preview of parent-friendly report content before sending |
| Send Confirmation | Confirm parent email, send button |
| Send Success | Confirmation that email was sent, PIN displayed for reference |

#### Backup Upload Flow

| Screen | Description |
|--------|-------------|
| Upload Video | File picker, drag-and-drop area, supported formats listed |
| Upload Preview | Video preview, confirm athlete and test type selection |

### 7.2 Email Templates

| Email | Trigger | Contents |
|-------|---------|----------|
| Consent Request | Coach adds athlete | Explanation, link to consent form with unique token |
| Consent Confirmed | Parent signs | Confirmation to coach that athlete is now active |
| Parent Report | Coach sends report | Link to report page + 6-digit PIN code |

---

## 8. Functional Requirements

### 8.1 Authentication & User Management

| ID | Requirement |
|----|-------------|
| FR-1 | Coaches can register using email/password or Google OAuth |
| FR-2 | Coaches can log in using email/password or Google OAuth |
| FR-3 | Registration is open (no invite code or approval required) |
| FR-4 | Session persists across browser refreshes until explicit logout |

### 8.2 Athlete Management

| ID | Requirement |
|----|-------------|
| FR-5 | Coaches can add athletes with name, age, gender, and parent email |
| FR-6 | Adding an athlete automatically sends consent email to parent |
| FR-7 | Athletes have status: `pending`, `active`, or `declined` |
| FR-8 | Athletes with `pending` status cannot be assessed |
| FR-9 | Coaches can view and manage a roster of up to 25 athletes |
| FR-10 | Coaches can edit athlete information and resend consent emails |
| FR-11 | Coaches can delete athletes from their roster |

### 8.3 Parental Consent

| ID | Requirement |
|----|-------------|
| FR-12 | Consent form is accessible via unique token URL (no login required) |
| FR-13 | Consent form displays legal language about video recording and data storage |
| FR-14 | Parent submits consent via checkbox acknowledgment |
| FR-15 | Consent submission updates athlete status to `active` |
| FR-16 | Coach receives email notification when consent is provided |

### 8.4 Live Recording

| ID | Requirement |
|----|-------------|
| FR-17 | System accesses camera via browser `getUserMedia()` API |
| FR-18 | Camera source options include webcam and iPhone Continuity Camera |
| FR-19 | MediaPipe.js renders skeleton overlay on live video in real-time |
| FR-20 | Recording includes 3-second countdown before 30-second test |
| FR-21 | Countdown timer (3-2-1) displays before test begins |
| FR-22 | 30-second countdown timer displays during test |
| FR-23 | Coach can manually stop recording early |
| FR-24 | Recording auto-stops when timer reaches zero |
| FR-25 | Preview screen shows recorded video with skeleton overlay |
| FR-26 | Coach can choose to Analyze or Reshoot from preview |

### 8.5 Video Upload (Backup)

| ID | Requirement |
|----|-------------|
| FR-27 | Coaches can upload pre-recorded video files |
| FR-28 | Supported formats: `.mp4`, `.mov`, `.avi`, `.m4v`, `.webm`, HEVC |
| FR-29 | Upload preview shows video and confirms athlete/test selection |

### 8.6 Computer Vision Analysis

| ID | Requirement |
|----|-------------|
| FR-30 | Client-side MediaPipe.js (v0.10.9) extracts pose landmarks during recording (SOURCE OF TRUTH) |
| FR-31 | System auto-detects test failure: foot touchdown |
| FR-32 | System auto-detects test failure: hands leaving hips |
| FR-33 | System auto-detects test failure: support foot movement |
| FR-34 | Client calculates all 11 metrics defined in Section 11 before upload |
| FR-35 | Video is stored to Firebase Storage for reference; raw keypoints not persisted separately |

### 8.7 AI Feedback Generation

| ID | Requirement |
|----|-------------|
| FR-36 | Assessment Agent generates coach-friendly feedback from metrics |
| FR-37 | Feedback includes team ranking context (team comparison) |
| FR-38 | Feedback includes specific coaching cues for improvement |
| FR-39 | Progress Agent analyzes historical trends for parent reports |
| FR-40 | Compression Agent summarizes historical data to reduce costs |

### 8.8 Assessment & Reporting

| ID | Requirement |
|----|-------------|
| FR-41 | Results display duration score (1-5), quality metrics, AI feedback, and peer comparison |
| FR-42 | Peer comparison shows age-appropriate benchmark comparison (meets/above/below expected) |
| FR-43 | Peer comparison shows team quality ranking (e.g., 3rd most stable of 12) |
| FR-44 | Coaches can add notes to assessments |
| FR-45 | Coaches can delete assessments |
| FR-46 | Assessment history is unlimited per athlete |

### 8.9 Parent Reports

| ID | Requirement |
|----|-------------|
| FR-47 | Coaches can generate parent report from athlete profile |
| FR-48 | Report preview shows parent-friendly content before sending |
| FR-49 | Sending report generates unique 6-digit PIN |
| FR-50 | System emails report link + PIN to parent automatically |
| FR-51 | Parents access report via link + PIN (no account required) |
| FR-52 | Report includes progress trends and team ranking |

---

## 9. Non-Functional Requirements

### 9.1 Performance

| ID | Requirement |
|----|-------------|
| NFR-1 | Live skeleton overlay must render at minimum 15 FPS |
| NFR-2 | Server-side video analysis must complete in under 30 seconds |
| NFR-3 | AI feedback generation must complete in under 10 seconds |
| NFR-4 | Page load times must be under 3 seconds on broadband connection |

### 9.2 Reliability

| ID | Requirement |
|----|-------------|
| NFR-5 | System must gracefully handle camera permission denials |
| NFR-6 | System must handle video upload failures with retry capability |
| NFR-7 | AI API failures must fall back to cached/canned responses |

### 9.3 Security & Privacy

| ID | Requirement |
|----|-------------|
| NFR-8 | All data transmission must use HTTPS |
| NFR-9 | Firebase security rules must restrict data access by coach |
| NFR-10 | Parental consent must be obtained before any video recording |
| NFR-11 | Parent report access requires valid PIN |
| NFR-12 | Video storage must be indefinite (no auto-deletion) |

### 9.4 Usability

| ID | Requirement |
|----|-------------|
| NFR-13 | UI must follow Material-UI component patterns |
| NFR-14 | All forms must have validation with clear error messages |
| NFR-15 | Loading states must be indicated with spinners/progress bars |
| NFR-16 | Application must be responsive (desktop and tablet) |

### 9.5 Scalability

| ID | Requirement |
|----|-------------|
| NFR-17 | Database schema must support future test types |
| NFR-18 | Architecture must support future team entity addition |
| NFR-19 | Athlete limit (25) must be soft-configurable |

---

## 10. Test Protocol Specification

### 10.1 One-Leg Balance Test Protocol

#### Test Parameters

| Parameter | Value |
|-----------|-------|
| Target Population | Youth athletes ages 5-13 |
| Framework | LTAD (Jeremy Frisch athletic development benchmarks) |
| Test Duration | 30 seconds |
| Recording Duration | ~35-40 seconds (includes countdown) |
| Arm Position | Arms extended wide (T-pose) |
| Raised Knee | Lifted to ~90 degrees, thigh parallel to ground |
| Eye Condition | Eyes open, focused on fixed point ahead |
| Leg Selection | Coach selects left or right leg |
| Surface | Flat, stable surface; barefoot preferred |

#### Test Instructions (Shown to Coach)

1. Position athlete on flat surface, barefoot if possible
2. Athlete extends arms out wide (T-pose)
3. Athlete focuses on a fixed point ahead (eyes open)
4. Select which leg to test (left or right)
5. Click Start when athlete is ready
6. 3-2-1 countdown will appear
7. Athlete lifts non-standing leg to ~90° (thigh parallel to ground) when countdown ends
8. 30-second timer begins
9. Test ends when timer reaches 0 or failure is detected

#### Auto-Detected Failure Events

| Failure Type | Detection Method | Result |
|--------------|------------------|--------|
| Foot Touchdown | Raised foot Y-coordinate drops to standing foot level | Test ends, partial duration recorded |
| Support Foot Moves | Standing ankle X/Y displacement >5% of pose bounding box (frame-relative) | Test ends, partial duration recorded |
| Time Complete | 30-second timer reaches zero | Test ends, full duration (success) |

---

## 11. CV Metrics Specification

### 11.1 MediaPipe Configuration

| Setting | Value |
|---------|-------|
| Model | BlazePose (33 landmarks) |
| Target frame rate | 30 FPS minimum |
| Filtering | Low-pass Butterworth filter (2 Hz cutoff) on landmark trajectories |
| Normalization | None (raw values stored); progress calculated via intra-individual comparison |
| Camera angle | Frontal or 45-degree view preferred |

### 11.2 Key Landmarks Used

| Landmark | Index | Purpose |
|----------|-------|---------|
| Left Hip | 23 | Hip midpoint calculation for sway |
| Right Hip | 24 | Hip midpoint calculation for sway |
| Left Ankle | 27 | Standing foot position, foot touchdown detection |
| Right Ankle | 28 | Standing foot position, foot touchdown detection |
| Left Wrist | 15 | Arm excursion, arm stability monitoring |
| Right Wrist | 16 | Arm excursion, arm stability monitoring |
| Left Shoulder | 11 | Arm excursion reference point |
| Right Shoulder | 12 | Arm excursion reference point |

### 11.3 Metric Calculations

#### Duration (`durationSeconds`)

Time from test start until failure event or timer completion. Range: 0-30 seconds.

#### Sway Standard Deviation (`swayStdX`, `swayStdY`)

Standard deviation of hip midpoint position over time. Hip midpoint = average of left hip (23) and right hip (24) coordinates. Calculate separately for X (lateral) and Y (anterior-posterior) axes. Lower values = more stable.

#### Sway Path Length (`swayPathLength`)

Total distance traveled by hip midpoint throughout the test. Sum of Euclidean distances between consecutive frame positions. Measured in centimeters. Shorter path = better control.

#### Sway Velocity (`swayVelocity`)

Path length divided by duration. Measured in cm/s. Research indicates this is one of the most reliable balance metrics.

#### Arm Excursion (`armExcursionLeft`, `armExcursionRight`)

Total movement range of wrist landmarks relative to shoulder landmarks. High arm movement indicates compensation for instability.

#### Arm Asymmetry Ratio (`armAsymmetryRatio`)

Ratio of left arm excursion to right arm excursion. Values far from 1.0 indicate unilateral compensation patterns.

#### Corrections Count (`correctionsCount`)

Number of times sway exceeds a threshold and returns. Each time the hip midpoint moves beyond X cm from center and returns = 1 correction. More corrections = less stable.

#### Stability Score (`stabilityScore`)

Composite score (0-100) calculated from weighted combination of metrics.

**Formula**: `100 - (w1 × sway_std + w2 × arm_excursion + w3 × corrections + w4 × duration_penalty)`

Weights calibrated against LTAD benchmark data. All metrics use raw values (no height normalization); weights account for typical value ranges.

#### Progress Comparison

For athletes with prior assessments, the system calculates percent change from their rolling 3-test average:

- Compare current test metrics to average of last 3 completed tests
- Calculate `{metric}_change` as percentage (e.g., `sway_velocity_change: -12.5%`)
- Enables "You improved 18% since last month" style feedback
- First test for an athlete has no comparison (null values)

#### Leg Asymmetry Detection (Optional)

When both legs are tested in the same session, calculate asymmetry index:

- **Formula**: `abs(left - right) / avg(left, right)`
- Applied to: `stability_score`, `sway_velocity`, `duration_seconds`
- Values > 0.15 may indicate bilateral imbalance worth investigating
- Not required — system surfaces this insight only when both legs tested

### 11.4 Hybrid Scoring Model

The system uses a two-tier scoring approach that combines LTAD-aligned duration scoring with CV-detected quality metrics.

#### Tier 1: Duration Score (1-5) — Primary Metric

Based on LTAD benchmark data. Provides age-normed, coach-friendly scoring.

| Score | Duration | Label | Ages 5-6 | Age 7 | Ages 8-9 | Ages 10-11 | Ages 12-13 |
|-------|----------|-------|----------|-------|----------|------------|------------|
| 1 | 1-9 sec | Beginning | **Expected** | Below | Below | Below | Below |
| 2 | 10-14 sec | Developing | Above | **Expected** | Below | Below | Below |
| 3 | 15-19 sec | Competent | Above | Above | **Expected** | Below | Below |
| 4 | 20-24 sec | Proficient | Above | Above | Above | **Expected** | Below |
| 5 | 25+ sec | Advanced | Above | Above | Above | Above | **Expected** |

#### Tier 2: Quality Score — Secondary Metrics (Team-Relative)

CV-detected form factors that reveal *how well* the athlete balanced, not just *how long*. For MVP, these metrics are calculated as team-relative rankings using raw scores (not body-size-adjusted). National percentiles are post-MVP (requires torso-length normalization + sufficient anonymized data collection).

| Metric | What It Measures | Quality Indicator | Ranking Logic |
|--------|------------------|-------------------|---------------|
| Stability Score | Composite of all factors | Overall quality | Higher = better rank |
| Sway Velocity | Hip movement speed (cm/s) | Control | Lower = better rank |
| Arm Excursion | Total arm compensation | Form | Lower = better rank |
| Corrections Count | Recovery attempts | Consistency | Fewer = better rank |
| Arm Asymmetry | Left/right balance | Symmetry | Closer to 1.0 = better rank |

#### Hybrid Score Display

For each assessment, the UI displays:

1. **Duration Score**: Large 1-5 badge with label (e.g., "4 - Proficient")
2. **Age Comparison**: "Meets expected level for ages 10-11" or "Above/Below expected"
3. **Team Quality Rank**: "3rd most stable on your roster" (based on Stability Score)
4. **Quality Breakdown**: Individual metric rankings shown in expandable detail view

#### Rationale

Two athletes could both score a "4" (20-24 sec) but have vastly different form quality:

- **Athlete A**: Low sway, arms stayed on hips, zero corrections → Ranked 1st on team for quality
- **Athlete B**: High sway, arms flailing, 6 corrections → Ranked 8th on team for quality

This gives coaches actionable feedback: "Great duration! Now let's work on reducing that arm compensation."

#### Post-MVP Enhancement

National benchmarks for quality metrics may be added in the future once sufficient anonymized data is collected to establish normative baselines across age groups.

---

## 11.5 Accepted Security Risks (MVP)

The following security trade-offs are accepted for MVP:

| Risk | Mitigation | Rationale |
|------|------------|-----------|
| PIN brute force attacks | 5 attempts/min rate limit + 10 attempt lockout | 6-digit PIN provides 1,000,000 combinations; rate limiting makes brute force impractical |
| In-memory rate limiting | Single instance deployment | Multi-instance will require Redis (documented as post-MVP) |

---

## 12. Appendices

### 12.1 Glossary

| Term | Definition |
|------|------------|
| LTAD | Long Term Athlete Development - framework for youth athletic development stages |
| MediaPipe | Google's open-source ML framework for pose estimation |
| BlazePose | MediaPipe's pose estimation model with 33 body landmarks |
| Context Offloading | Deep agent pattern: store large data externally, send only summaries to LLM |
| Prompt Caching | Claude feature that caches static system prompts to reduce token costs |
| Postural Sway | Body movement while attempting to maintain balance, measured via hip position |
| Continuity Camera | macOS feature allowing iPhone camera as webcam |

### 12.2 Reference Documents

- AI Coach Software Engineering Specification v1.0
- TPM Deep Agent Architecture Document
- LTAD Benchmark Data (provided separately)
- MediaPipe Pose Documentation: https://google.github.io/mediapipe/solutions/pose
- OpenRouter API Documentation: https://openrouter.ai/docs

### 12.3 Environment Variables Required

| Variable | Description |
|----------|-------------|
| `FIREBASE_PROJECT_ID` | Firebase project identifier |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin SDK private key |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin SDK client email |
| `OPENROUTER_API_KEY` | OpenRouter API key for Claude model access |
| `RESEND_API_KEY` | Resend email service API key |
| `FRONTEND_URL` | Deployed frontend URL (for email links) |
| `BACKEND_URL` | Deployed backend URL (for API calls) |

### 12.4 Technical Debt (Post-MVP)

The following items are documented as technical debt to be addressed after MVP:

| Item | Current State | Post-MVP Solution | Affected PRDs |
|------|---------------|-------------------|---------------|
| Test Type Extensibility | Hardcoded for One-Leg Balance test | Refactor to use strategy pattern with test-type-specific analyzers, metric calculators, and AI prompts | BE-007, BE-008, BE-009, BE-010, BE-011 |
| Rate Limiting | In-memory storage (single instance only) | Migrate to Redis for multi-instance support | BE-005, BE-006, BE-013 |
| National Benchmarks | Team-relative only | Add anonymized aggregate benchmarks by age/gender | BE-008, FE-011 |

#### Test Type Extensibility Details

The MVP implements only the One-Leg Balance test. To add new test types (e.g., Y-Balance, Single Leg Hop), the following would need refactoring:

```python
# Current: Hardcoded in BE-007
def detect_failure(landmarks, test_type):
    if test_type == "one_leg_balance":
        return detect_one_leg_balance_failure(landmarks)
    # No other types supported

# Post-MVP: Strategy pattern
class TestAnalyzer(Protocol):
    def detect_failure(self, landmarks) -> tuple[bool, str]: ...
    def calculate_metrics(self, keypoints) -> dict: ...
    def get_benchmark(self, age, gender) -> dict: ...

ANALYZERS: dict[str, TestAnalyzer] = {
    "one_leg_balance": OneLegBalanceAnalyzer(),
    "y_balance": YBalanceAnalyzer(),  # Future
}
```

This is acceptable for MVP but should be prioritized if additional tests are planned within 6 months.

---

*End of Document*
