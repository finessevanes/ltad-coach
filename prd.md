# AI Coach MVP - Product Requirements Document

**Computer Vision Athletic Assessment Platform for Youth Sports**

| Field | Value |
|-------|-------|
| Document Version | 1.0 |
| Last Updated | December 10, 2025 |

---

## 1. Executive Summary

### 1.1 Purpose

This document serves as the single source of truth for the AI Coach MVP engineering team. It consolidates all technical requirements, architectural decisions, and implementation details for delivering a functional demo featuring live athletic assessment analysis.

### 1.2 Product Vision

AI Coach is a computer vision-powered athletic assessment platform designed for youth sports coaches. The platform enables coaches to conduct standardized athletic tests (starting with the One-Leg Balance Test), automatically analyze performance using MediaPipe pose estimation, and generate AI-powered feedback using a multi-agent system built on Claude. The platform follows the Long Term Athlete Development (LTAD) framework, targeting middle school athletes (ages 10-14).

### 1.3 Key Decisions Summary

| Decision Area | Decision |
|---------------|----------|
| Video Capture | Local browser camera (webcam or iPhone Continuity) + upload. No WebRTC peer-to-peer streaming. |
| AI Architecture | Custom orchestration with Claude API (Haiku for compression, Sonnet for assessment/progress agents) |
| Target Population | Middle school athletes (ages 10-14), LTAD framework |
| MVP Test | One-Leg Balance Test only, architecture designed for extensibility |
| Parental Consent | Required workflow with automated email, token-protected consent form |
| Parent Reports | Shareable link with PIN protection, auto-emailed via Resend |
| Deployment | Vercel (Frontend), Heroku (Backend), Firebase (Database/Storage/Auth) |

---

## 2. Product Overview

### 2.1 Target Users

**Primary: Youth Sports Coaches**

- Middle school athletic coaches (PE teachers, club coaches, rec league coaches)
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
3. **Progress Tracking**: Historical trend analysis with national percentile and team ranking comparisons
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
- National percentile and team ranking comparisons
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
| CV Processing | MediaPipe | Client-side (JS) for preview, Server-side (Python) for analysis |
| AI/LLM | Claude API (Anthropic) | Haiku for compression, Sonnet for assessment/progress |
| Email | Resend | Transactional emails (consent, reports) |
| Frontend Hosting | Vercel | Static site hosting with edge functions |
| Backend Hosting | Heroku | Python application hosting |

### 3.2 Architecture Overview

The system follows a client-server architecture with clear separation between real-time preview (client-side) and official analysis (server-side).

#### Client Layer (Browser)

- Camera access via `getUserMedia()` API (webcam or iPhone Continuity Camera)
- MediaPipe.js for real-time skeleton overlay (visual feedback only, not source of truth)
- MediaRecorder for capturing raw video (no skeleton baked in)
- Canvas overlay for skeleton visualization during preview

#### Server Layer (Cloud)

- FastAPI receives uploaded video blobs
- MediaPipe (Python) performs official metric extraction
- Raw keypoints offloaded to storage (context offloading pattern)
- Derived metrics passed to Deep Agent System
- Results persisted to Firestore

> **Key Architectural Decision**: Client-side MediaPipe.js handles live preview for visual feedback only. After upload, server-side MediaPipe (Python) re-processes the video for official metric extraction. The client-side skeleton is for framing confirmation and user experience, not the source of truth for metrics.

### 3.3 Data Flow

#### Primary Flow: Live Recording

1. **Authentication**: Coach logs in via Firebase Auth
2. **Athlete Selection**: Coach selects athlete from roster (must have active consent)
3. **Test Setup**: Coach selects test type and which leg to test
4. **Camera Setup**: Coach selects camera source, positions athlete in frame
5. **Live Preview**: Real-time skeleton overlay via MediaPipe.js
6. **Recording**: 3-2-1 countdown, then 20-second test with visible timer
7. **Preview**: Playback of recorded video, coach chooses Analyze or Reshoot
8. **Upload**: Raw video blob uploaded to Firebase Storage
9. **Server Analysis**: MediaPipe (Python) extracts keypoints, calculates metrics
10. **AI Processing**: Deep Agent System generates feedback
11. **Storage**: Results saved to Firestore, video URL stored
12. **Display**: Results shown with metrics, AI feedback, peer comparison

#### Backup Flow: Video Upload

For pre-recorded videos or when live recording is impractical, coaches can upload video files directly. The flow starts at step 8 (Upload) and proceeds identically from there.

**Supported formats**: `.mp4`, `.mov`, `.avi`, `.m4v`, HEVC

---

## 4. Deep Agent Architecture

### 4.1 Architecture Overview

The AI system uses a custom orchestration pattern with Claude API, implementing four key deep agent patterns: context offloading, context compression, context isolation, and prompt caching. This architecture minimizes token costs while maximizing output quality.

### 4.2 Agent System Components

| Agent | Model | Responsibility |
|-------|-------|----------------|
| Orchestrator | Python Logic (no LLM) | Routes requests to appropriate agents based on request type. No LLM needed - pure conditional logic. |
| Compression Agent | Claude Haiku | Summarizes historical assessment data to reduce token costs. Converts 12 assessments (~6000 tokens) into ~150 token summary. |
| Assessment Agent | Claude Sonnet | Interprets single test results. Generates coach-friendly feedback with coaching cues, percentile context, and improvement suggestions. |
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
| age | number | Athlete age (10-14 for MVP target) |
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
| percentile | number | National percentile (calculated) |

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

#### Collection: `benchmarks`

**Path**: `/benchmarks/{testType}_{ageGroup}`

| Field | Type | Description |
|-------|------|-------------|
| testType | string | `'one_leg_balance'` |
| ageGroup | string | `'10-11'` \| `'12-13'` \| `'14'` |
| expectedScore | number | Expected LTAD score (1-5) for age group |
| scoringTiers | object | Duration thresholds for each score level |

**Scoring Tiers Object**:

| Field | Type | Description |
|-------|------|-------------|
| score1 | object | `{ min: 1, max: 9, label: "Beginning" }` |
| score2 | object | `{ min: 10, max: 14, label: "Developing" }` |
| score3 | object | `{ min: 15, max: 19, label: "Competent" }` |
| score4 | object | `{ min: 20, max: 24, label: "Proficient" }` |
| score5 | object | `{ min: 25, max: null, label: "Advanced" }` |

> **Hybrid Scoring Model**: The system uses a two-tier scoring approach. Tier 1 (Duration Score) provides an LTAD-aligned 1-5 score based on how long the athlete maintained balance. Tier 2 (Quality Percentile) provides team-relative rankings based on CV-detected form factors (sway, arm excursion, corrections). See Section 11.4 for details.

### 5.2 Metrics Object Schema

The metrics object stored in each assessment contains all derived values from CV analysis:

| Field | Type | Description |
|-------|------|-------------|
| durationSeconds | number | Time athlete maintained balance (0-20) |
| stabilityScore | number | Composite score (0-100), higher = better |
| swayStdX | number | Standard deviation of lateral (side-to-side) hip movement |
| swayStdY | number | Standard deviation of anterior-posterior hip movement |
| swayPathLength | number | Total distance traveled by hip midpoint (cm) |
| swayVelocity | number | Path length / duration (cm/s) |
| armExcursionLeft | number | Total left arm movement (degrees or cm) |
| armExcursionRight | number | Total right arm movement (degrees or cm) |
| armAsymmetryRatio | number | Left/Right arm movement ratio |
| correctionsCount | number | Number of times sway exceeded threshold |
| failureReason | string | `'time_complete'` \| `'foot_touchdown'` \| `'hands_left_hips'` \| `'support_foot_moved'` |

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
| POST | `/reports/{id}/send` | Send report to parent (generates PIN, sends email) |
| GET | `/reports/view/{id}` | Get report content (public, requires PIN) |
| POST | `/reports/view/{id}/verify` | Verify PIN for report access |

### 6.6 Benchmark Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/benchmarks/{testType}/{age}/{gender}` | Get percentile benchmarks |

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
| Recording | 3-2-1 countdown, 20-second timer, skeleton overlay, Stop button |
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
| FR-7 | Athletes have status: `pending_consent`, `active`, or `declined` |
| FR-8 | Athletes with `pending_consent` cannot be assessed |
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
| FR-20 | Recording includes 3-5 second buffer before 20-second test |
| FR-21 | Countdown timer (3-2-1) displays before test begins |
| FR-22 | 20-second countdown timer displays during test |
| FR-23 | Coach can manually stop recording early |
| FR-24 | Recording auto-stops when timer reaches zero |
| FR-25 | Preview screen shows recorded video with skeleton overlay |
| FR-26 | Coach can choose to Analyze or Reshoot from preview |

### 8.5 Video Upload (Backup)

| ID | Requirement |
|----|-------------|
| FR-27 | Coaches can upload pre-recorded video files |
| FR-28 | Supported formats: `.mp4`, `.mov`, `.avi`, `.m4v`, HEVC |
| FR-29 | Upload preview shows video and confirms athlete/test selection |

### 8.6 Computer Vision Analysis

| ID | Requirement |
|----|-------------|
| FR-30 | Server-side MediaPipe extracts pose landmarks from uploaded video |
| FR-31 | System auto-detects test failure: foot touchdown |
| FR-32 | System auto-detects test failure: hands leaving hips |
| FR-33 | System auto-detects test failure: support foot movement |
| FR-34 | System calculates all metrics defined in Section 11 |
| FR-35 | Raw keypoints are stored for potential future re-analysis |

### 8.7 AI Feedback Generation

| ID | Requirement |
|----|-------------|
| FR-36 | Assessment Agent generates coach-friendly feedback from metrics |
| FR-37 | Feedback includes percentile context (national comparison) |
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
| FR-52 | Report includes progress trends, percentile, team ranking |

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
| Target Population | Middle school athletes (ages 10-14) |
| Framework | LTAD (FUNdamentals and Learn to Train stages) |
| Test Duration | 20 seconds |
| Recording Duration | ~25-30 seconds (includes buffer before/after) |
| Hand Position | Hands on hips (iliac crest) |
| Eye Condition | Eyes open, focused on fixed point ahead |
| Leg Selection | Coach selects left or right leg |
| Surface | Flat, stable surface; barefoot preferred |

#### Test Instructions (Shown to Coach)

1. Position athlete on flat surface, barefoot if possible
2. Athlete places hands on hips
3. Athlete focuses on a fixed point ahead (eyes open)
4. Select which leg to test (left or right)
5. Click Start when athlete is ready
6. 3-2-1 countdown will appear
7. Athlete lifts non-standing leg when countdown ends
8. 20-second timer begins
9. Test ends when timer reaches 0 or failure is detected

#### Auto-Detected Failure Events

| Failure Type | Detection Method | Result |
|--------------|------------------|--------|
| Foot Touchdown | Raised foot Y-coordinate drops to standing foot level | Test ends, partial duration recorded |
| Hands Leave Hips | Wrist landmarks move >threshold from hip landmarks | Test ends, partial duration recorded |
| Support Foot Moves | Standing ankle X/Y displacement >15cm from start | Test ends, partial duration recorded |
| Time Complete | 20-second timer reaches zero | Test ends, full duration (success) |

---

## 11. CV Metrics Specification

### 11.1 MediaPipe Configuration

| Setting | Value |
|---------|-------|
| Model | BlazePose (33 landmarks) |
| Target frame rate | 30 FPS minimum |
| Filtering | Low-pass Butterworth filter (2-6 Hz cutoff) on landmark trajectories |
| Normalization | Sway values normalized by athlete height |
| Camera angle | Frontal or 45-degree view preferred |

### 11.2 Key Landmarks Used

| Landmark | Index | Purpose |
|----------|-------|---------|
| Left Hip | 23 | Hip midpoint calculation for sway |
| Right Hip | 24 | Hip midpoint calculation for sway |
| Left Ankle | 27 | Standing foot position, foot touchdown detection |
| Right Ankle | 28 | Standing foot position, foot touchdown detection |
| Left Wrist | 15 | Arm excursion, hands-on-hips detection |
| Right Wrist | 16 | Arm excursion, hands-on-hips detection |
| Left Shoulder | 11 | Arm excursion reference point |
| Right Shoulder | 12 | Arm excursion reference point |

### 11.3 Metric Calculations

#### Duration (`durationSeconds`)

Time from test start until failure event or timer completion. Range: 0-20 seconds.

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

**Formula**: `100 - (w1 × normalized_sway_std + w2 × normalized_arm_excursion + w3 × normalized_corrections + w4 × duration_penalty)`

Weights calibrated against LTAD benchmark data.

### 11.4 Hybrid Scoring Model

The system uses a two-tier scoring approach that combines LTAD-aligned duration scoring with CV-detected quality metrics.

#### Tier 1: Duration Score (1-5) — Primary Metric

Based on LTAD benchmark data. Provides age-normed, coach-friendly scoring.

| Score | Duration | Label | Ages 10-11 | Ages 12-13 | Age 14 |
|-------|----------|-------|------------|------------|--------|
| 1 | 1-9 sec | Beginning | Below | Below | Below |
| 2 | 10-14 sec | Developing | Below | Below | Below |
| 3 | 15-19 sec | Competent | Below | Below | Below |
| 4 | 20-24 sec | Proficient | **Expected** | Below | Below |
| 5 | 25+ sec | Advanced | Above | **Expected** | **Expected** |

#### Tier 2: Quality Score — Secondary Metrics (Team-Relative)

CV-detected form factors that reveal *how well* the athlete balanced, not just *how long*. For MVP, these metrics are calculated as team-relative rankings rather than national percentiles.

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

National percentiles for quality metrics will be added once sufficient anonymized data is collected to establish normative baselines across age groups.

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
- Claude API Documentation: https://docs.anthropic.com

### 12.3 Environment Variables Required

| Variable | Description |
|----------|-------------|
| `FIREBASE_PROJECT_ID` | Firebase project identifier |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin SDK private key |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin SDK client email |
| `ANTHROPIC_API_KEY` | Claude API key |
| `RESEND_API_KEY` | Resend email service API key |
| `FRONTEND_URL` | Deployed frontend URL (for email links) |
| `BACKEND_URL` | Deployed backend URL (for API calls) |

---

*End of Document*
