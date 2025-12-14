# Two-Leg Sequential Balance Test - Implementation Plan

## Overview

Transform the single-leg balance test into a sequential two-leg flow that tests both legs in one session, compares performance for bilateral symmetry analysis, and provides AI-powered insights on imbalances.

## User Decisions

Based on clarifying questions:
- ✅ **Direct to camera**: Eliminate stepper, go straight to camera preview
- ✅ **Modal transition**: Show modal between legs ("Left complete! Ready for right? OK")
- ✅ **Skip review**: No video review step, auto-proceed after each leg
- ✅ **Single assessment with dual metrics**: One assessment document with leftLegMetrics + rightLegMetrics
- ✅ **Naming convention**: Use consistent `left*` / `right*` prefixes (no backwards compatibility needed)
- ✅ **Temporal data**: Continue sending 5-second segments and events for AI analysis

## Current Architecture

**Frontend Flow (Current)**:
```
AthleteProfile → /assess/:athleteId → AssessmentFlow (4-step stepper)
  Step 0: TestSetup (manual leg selection)
  Step 1: RecordingStep (camera + test)
  Step 2: ReviewStep (video playback)
  Step 3: UploadStep (Firebase upload + API submit)
→ /assessments/:id → AssessmentResults
```

**Backend Flow (Current)**:
```
POST /assessments/analyze
  - Receives: athleteId, legTested ('left' | 'right'), videoUrl, clientMetrics
  - Validates: ownership, consent
  - Calculates: LTAD duration_score (1-5)
  - Stores: Single assessment with metrics for ONE leg
  - Generates: AI feedback for single leg
```

## New Architecture

**Frontend Flow (New)**:
```
AthleteProfile → /assess/:athleteId → AssessmentFlow (NO stepper)
  Phase: left-leg-testing (RecordingStep autoStart=true)
    → TransitionModal ("Left complete!")
  Phase: right-leg-testing (RecordingStep autoStart=true)
    → TwoLegUploadStep (upload both videos + calculate symmetry)
    → POST /assessments/analyze with assessmentMode='dual_leg'
→ /assessments/:id → AssessmentResults (bilateral comparison view)
```

**Backend Flow (New)**:
```
POST /assessments/analyze (mode: 'dual_leg')
  - Receives: athleteId, leftLegVideoUrl, rightLegVideoUrl, dualLegMetrics
  - Validates: ownership, consent
  - Calculates: LTAD scores for BOTH legs + bilateral comparison (symmetry)
  - Stores: Single assessment with leftLegMetrics + rightLegMetrics + bilateralComparison
  - Generates: AI bilateral feedback comparing left vs right
```

---

## Temporal Data & 5-Second Segments

**Important**: The current implementation already captures rich temporal data for each test. This will be preserved and enhanced in dual-leg mode.

### Current Single-Leg Temporal Data

Each `ClientMetrics` object includes:

1. **Temporal Analysis** (3 segments):
   ```typescript
   temporal: {
     firstThird: { avgVelocity, corrections, armAngleLeft, armAngleRight },
     middleThird: { avgVelocity, corrections, armAngleLeft, armAngleRight },
     lastThird: { avgVelocity, corrections, armAngleLeft, armAngleRight }
   }
   ```

2. **5-Second Segments** (optional, for detailed LLM analysis):
   ```typescript
   fiveSecondSegments: [
     { startTime: 0, endTime: 5, avgVelocity, corrections, armAngleLeft, armAngleRight, swayStdX, swayStdY },
     { startTime: 5, endTime: 10, ... },
     // ... continues for duration of test
   ]
   ```

3. **Balance Events** (optional, for moment-in-time coaching):
   ```typescript
   events: [
     { time: 3.2, type: 'flapping', severity: 'medium', detail: 'Rapid arm movements detected' },
     { time: 12.5, type: 'correction_burst', severity: 'high', detail: '3 corrections in 2 seconds' },
     { time: 18.0, type: 'stabilized', severity: 'low', detail: 'Smooth control achieved' }
   ]
   ```

### Dual-Leg Temporal Data

For bilateral assessments, both `leftLeg` and `rightLeg` will include **all** temporal data:

```typescript
dualLegMetrics: {
  leftLeg: {
    // Basic metrics
    holdTime: 25.3,
    swayVelocity: 2.1,
    correctionsCount: 8,
    // ... other metrics ...

    // Temporal breakdown
    temporal: { firstThird, middleThird, lastThird },
    fiveSecondSegments: [...],  // Optional
    events: [...]               // Optional
  },
  rightLeg: {
    // Same structure
    holdTime: 23.8,
    swayVelocity: 2.3,
    // ... includes temporal, fiveSecondSegments, events
  },
  symmetryAnalysis: { ... }
}
```

### AI Agent Capabilities

With this temporal data, the bilateral AI agent can provide insights like:

- **Fatigue patterns**: "Both legs showed increased sway after 15 seconds, but left leg fatigued 20% faster"
- **Event comparison**: "Left leg had 3 correction bursts in first 10s, right leg remained stable until 12s"
- **Temporal asymmetry**: "Right leg's arm angles degraded steadily, left leg maintained consistency"
- **Segment-level coaching**: "Focus on 10-15 second mark - both legs struggle here, indicating core fatigue"

### Backend Processing

The backend will:
1. **Receive** both legs' complete temporal data
2. **Calculate** LTAD scores for both legs based on `holdTime`
3. **Compute** bilateral comparison (symmetry scores, dominant leg)
4. **Pass to AI agent** with full temporal context for rich bilateral feedback
5. **Store** all temporal data in Firestore for historical analysis

---

# Implementation Plan

## Part 1: Frontend (React/TypeScript)

### 1.1 Update Type Definitions

**File**: `client/src/types/assessment.ts`

Add new types:
```typescript
export type LegTested = 'left' | 'right' | 'both';  // Add 'both'

export interface SymmetryAnalysis {
  holdTimeDifference: number;        // seconds
  swayVelocityDifference: number;    // cm/s
  armAngleDifference: number;        // degrees
  correctionsCountDifference: number;
  dominantLeg: 'left' | 'right' | 'balanced';
  asymmetryScore: number;            // 0-100
}

export interface DualLegMetrics {
  leftLeg: ClientMetrics;
  rightLeg: ClientMetrics;
  symmetryAnalysis: SymmetryAnalysis;
}

// Update AssessmentCreate to support dual-leg
// NAMING: Use consistent left/right prefixes for clarity (no backwards compatibility needed)
export interface AssessmentCreate {
  athleteId: string;
  testType: TestType;
  legTested: LegTested;

  // Single-leg fields (when legTested = 'left' | 'right')
  leftVideoUrl?: string;        // RENAMED from videoUrl for consistency
  leftVideoPath?: string;       // RENAMED from videoPath for consistency
  leftDuration?: number;        // RENAMED from duration for consistency
  clientMetrics?: ClientMetrics;      // Single leg (optional)

  // Dual-leg fields (when legTested = 'both')
  rightVideoUrl?: string;
  rightVideoPath?: string;
  rightDuration?: number;
  dualLegMetrics?: DualLegMetrics;
}

// Update Assessment to include dual-leg data
export interface Assessment {
  // ... existing fields ...
  leftVideoUrl?: string;        // RENAMED from videoUrl
  leftVideoPath?: string;       // RENAMED from videoPath
  rightVideoUrl?: string;
  rightVideoPath?: string;
  dualLegMetrics?: DualLegMetrics;
}
```

### 1.2 Refactor AssessmentFlow Component

**File**: `client/src/pages/Assessment/AssessmentFlow.tsx`

**Changes**:
- Remove Stepper UI (lines 3, 11, 113-121)
- Add phase state machine: `'left-leg-testing' | 'transition-modal' | 'right-leg-testing' | 'uploading'`
- Store separate state for left and right leg data
- Wire up sequential flow with handlers

**New State**:
```typescript
type TwoLegPhase = 'left-leg-testing' | 'transition-modal' | 'right-leg-testing' | 'uploading';

const [phase, setPhase] = useState<TwoLegPhase>('left-leg-testing');
const [leftLegData, setLeftLegData] = useState<{
  blob: Blob;
  duration: number;
  result: TestResult;
} | null>(null);
const [rightLegData, setRightLegData] = useState<...>(null);
const [showTransitionModal, setShowTransitionModal] = useState(false);
```

**Flow Logic**:
```typescript
// Left leg complete → show modal
const handleLeftLegComplete = (blob, duration, result) => {
  setLeftLegData({ blob, duration, result });
  setShowTransitionModal(true);
  setPhase('transition-modal');
};

// Modal "Continue" → start right leg
const handleContinueToRightLeg = () => {
  setShowTransitionModal(false);
  setPhase('right-leg-testing');
};

// Right leg complete → upload both
const handleRightLegComplete = (blob, duration, result) => {
  setRightLegData({ blob, duration, result });
  setPhase('uploading');
};
```

**Render Logic**:
```typescript
switch (phase) {
  case 'left-leg-testing':
    return <RecordingStep
      legTested="left"
      autoStart={true}
      instructionText="Testing LEFT leg"
      onRecordingComplete={handleLeftLegComplete}
    />;
  case 'right-leg-testing':
    return <RecordingStep
      legTested="right"
      autoStart={true}
      instructionText="Testing RIGHT leg"
      onRecordingComplete={handleRightLegComplete}
    />;
  case 'uploading':
    return <TwoLegUploadStep
      leftLegData={leftLegData}
      rightLegData={rightLegData}
      onComplete={(id) => navigate(`/assessments/${id}`)}
    />;
}
```

### 1.3 Create TransitionModal Component

**File**: `client/src/pages/Assessment/components/TransitionModal.tsx` (NEW)

**Purpose**: Show left leg summary and prompt for right leg

**Props**:
```typescript
interface TransitionModalProps {
  open: boolean;
  leftLegResult: TestResult | null;
  onContinue: () => void;
  onReshootLeft: () => void;
}
```

**UI**:
```
┌─────────────────────────────────────┐
│  Left Leg Test Complete! ✓          │
│                                     │
│  Hold Time: 15.3 seconds            │
│  Status: Foot touched down          │
│                                     │
│  Ready for right leg?               │
│                                     │
│  [Reshoot Left]  [Continue]         │
└─────────────────────────────────────┘
```

Use MUI Dialog with:
- `disableEscapeKeyDown` (force explicit choice)
- Success/failure chip
- Hold time display
- Two buttons: "Reshoot Left Leg" (outlined) and "Continue to Right Leg" (contained primary)

### 1.4 Modify RecordingStep Component

**File**: `client/src/pages/Assessment/steps/RecordingStep.tsx`

**Add Props**:
```typescript
interface RecordingStepProps {
  // ... existing props ...
  autoStart?: boolean;         // NEW: skip setup, go straight to testing
  instructionText?: string;    // NEW: custom instruction banner
}
```

**Changes**:
- If `autoStart={true}`: skip camera selector, start in 'testing' phase immediately
- Show instruction banner at top: `<Alert severity="info">{instructionText}</Alert>`
- Auto-start test when person detected (only in autoStart mode)

**Logic**:
```typescript
const [phase, setPhase] = useState<RecordingPhase>(
  autoStart ? 'testing' : 'setup'
);

useEffect(() => {
  if (autoStart && phase === 'testing' && isPersonDetected && testState === 'idle') {
    // Start test automatically when positioned
    startTest();
  }
}, [autoStart, phase, isPersonDetected, testState]);
```

### 1.5 Create TwoLegUploadStep Component

**File**: `client/src/pages/Assessment/components/TwoLegUploadStep.tsx` (NEW)

**Purpose**: Upload both videos sequentially, calculate symmetry, submit to backend

**Flow**:
1. Upload left video to Firebase Storage (show progress)
2. Upload right video to Firebase Storage (show progress)
3. Calculate symmetry analysis from both test results
4. Submit to `POST /assessments/analyze` with `assessmentMode='dual_leg'`
5. Navigate to results page

**Symmetry Calculation** (client-side):
```typescript
function calculateSymmetry(leftResult: TestResult, rightResult: TestResult): SymmetryAnalysis {
  const holdTimeDiff = Math.abs(leftResult.holdTime - rightResult.holdTime);
  const swayDiff = Math.abs(leftResult.swayVelocity - rightResult.swayVelocity);
  // ... calculate all differences ...

  // Determine dominant leg
  const dominantLeg =
    Math.abs(holdTimeDiff) < 2 ? 'balanced' :
    leftResult.holdTime > rightResult.holdTime ? 'left' : 'right';

  // Calculate asymmetry score (0-100)
  const asymmetryScore = Math.min(100,
    holdTimeDiff * 2 +
    swayDiff * 10 +
    // ... weighted sum ...
  );

  return { holdTimeDifference: holdTimeDiff, ... };
}
```

**API Call**:
```typescript
const payload = {
  athleteId,
  testType: 'one_leg_balance',
  legTested: 'both',

  // Consistent left/right naming
  leftVideoUrl: leftUploadResult.url,
  leftVideoPath: leftUploadResult.path,
  leftDuration: leftLegData.duration,
  rightVideoUrl: rightUploadResult.url,
  rightVideoPath: rightUploadResult.path,
  rightDuration: rightLegData.duration,

  dualLegMetrics: {
    // ClientMetrics includes:
    // - Basic metrics (holdTime, swayVelocity, corrections, arm angles)
    // - Temporal analysis (firstThird, middleThird, lastThird)
    // - 5-second segments (fiveSecondSegments[] - optional)
    // - Balance events (events[] - optional)
    leftLeg: convertToClientMetrics(leftLegData.result),
    rightLeg: convertToClientMetrics(rightLegData.result),
    symmetryAnalysis: calculateSymmetry(leftLegData.result, rightLegData.result),
  },
};

await assessmentsService.analyzeVideo(payload);
```

### 1.6 Update AssessmentResults Component

**File**: `client/src/pages/Assessment/AssessmentResults.tsx`

**Add Detection Logic**:
```typescript
const isTwoLegTest = assessment.legTested === 'both';
const hasDualMetrics = assessment.dualLegMetrics !== undefined;

if (isTwoLegTest && hasDualMetrics) {
  return <TwoLegResultsView assessment={assessment} athlete={athlete} />;
} else {
  return <SingleLegResultsView assessment={assessment} athlete={athlete} />;
}
```

### 1.7 Create TwoLegResultsView Component

**File**: `client/src/pages/Assessment/components/TwoLegResultsView.tsx` (NEW)

**UI Structure**:
```
┌─────────────────────────────────────────────┐
│  Bilateral Balance Assessment               │
│  Athlete: John | Date: Dec 14, 2025         │
└─────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┐
│  Left Leg    │   Symmetry   │  Right Leg   │
│  25.3s ✓     │   Balanced   │  23.8s ✓     │
│  LTAD 4/5    │   Score: 12  │  LTAD 4/5    │
└──────────────┴──────────────┴──────────────┘

┌─────────────────────────────────────────────┐
│  Video Comparison                           │
│  [Left Video]       [Right Video]           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Metrics Comparison Table                   │
│  Metric       | Left  | Right | Difference  │
│  Hold Time    | 25.3s | 23.8s | +1.5s       │
│  Sway Vel     | 2.1   | 2.3   | -0.2        │
│  Corrections  | 8     | 10    | -2          │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  AI Coach Assessment (Bilateral Analysis)   │
│  [Markdown feedback from backend]           │
└─────────────────────────────────────────────┘
```

**Components**:
- Summary cards (3 columns: Left, Symmetry, Right)
- Side-by-side video players
- Comparison table with difference highlighting (green if <20% diff, yellow if >20%)
- Symmetry analysis alert with interpretation
- AI feedback display

---

## Part 2: Backend (Python/FastAPI)

### 2.1 Update Data Models

**File**: `backend/app/models/assessment.py`

**Add Enums**:
```python
class AssessmentMode(str, Enum):
    """Assessment mode."""
    SINGLE_LEG = "single_leg"
    DUAL_LEG = "dual_leg"

class LegTested(str, Enum):
    """Which leg was tested."""
    LEFT = "left"
    RIGHT = "right"
    BOTH = "both"  # NEW
```

**Add Bilateral Comparison Model**:
```python
class BilateralComparison(BaseModel):
    """Bilateral comparison metrics."""
    duration_difference: float = Field(..., description="Hold time difference (seconds)")
    duration_difference_pct: float = Field(..., description="Percentage difference")
    dominant_leg: LegTested = Field(..., description="Leg with better performance")
    sway_difference: float = Field(..., description="Sway velocity difference (cm/s)")
    sway_symmetry_score: float = Field(..., ge=0, le=1, description="0=asymmetric, 1=perfect")
    arm_angle_difference: float = Field(..., description="Average arm angle difference (degrees)")
    corrections_difference: int = Field(..., description="Corrections count difference")
    overall_symmetry_score: float = Field(..., ge=0, le=100, description="Overall symmetry (0-100)")
    symmetry_assessment: str = Field(..., description="'excellent' | 'good' | 'fair' | 'poor'")
```

**Update Assessment Model**:
```python
class Assessment(BaseModel):
    # ... existing fields ...
    assessment_mode: AssessmentMode = Field(default=AssessmentMode.SINGLE_LEG)

    # Single-leg fields (now optional for dual_leg mode)
    leg_tested: Optional[LegTested] = None
    video_url: Optional[str] = None
    video_path: Optional[str] = None
    metrics: Optional[MetricsData] = None

    # Dual-leg fields (NEW)
    left_leg_video_url: Optional[str] = None
    left_leg_video_path: Optional[str] = None
    left_leg_metrics: Optional[MetricsData] = None
    right_leg_video_url: Optional[str] = None
    right_leg_video_path: Optional[str] = None
    right_leg_metrics: Optional[MetricsData] = None
    bilateral_comparison: Optional[BilateralComparison] = None
```

**Update Request Models**:
```python
class DualLegMetrics(BaseModel):
    """Container for both legs' metrics."""
    left_leg: ClientMetricsData
    right_leg: ClientMetricsData

class AssessmentCreate(BaseModel):
    athlete_id: str
    test_type: TestType
    leg_tested: LegTested

    # Single-leg fields (when leg_tested = 'left' | 'right')
    left_video_url: Optional[str] = None    # RENAMED from video_url for consistency
    left_video_path: Optional[str] = None   # RENAMED from video_path for consistency
    left_duration: Optional[float] = None   # RENAMED from duration for consistency
    client_metrics: Optional[ClientMetricsData] = None

    # Dual-leg fields (when leg_tested = 'both')
    right_video_url: Optional[str] = None
    right_video_path: Optional[str] = None
    right_duration: Optional[float] = None
    dual_leg_metrics: Optional[DualLegMetrics] = None
```

### 2.2 Create Bilateral Comparison Service

**File**: `backend/app/services/bilateral_comparison.py` (NEW)

**Function**:
```python
def calculate_bilateral_comparison(
    left_metrics: Dict[str, Any],
    right_metrics: Dict[str, Any],
) -> Dict[str, Any]:
    """Calculate bilateral comparison metrics."""

    # Duration comparison
    left_hold = left_metrics.get("hold_time", 0)
    right_hold = right_metrics.get("hold_time", 0)
    duration_diff = abs(left_hold - right_hold)
    duration_diff_pct = (duration_diff / max(left_hold, right_hold) * 100) if max(left_hold, right_hold) > 0 else 0
    dominant_leg = "left" if left_hold > right_hold else "right"

    # Sway comparison
    left_sway = left_metrics.get("sway_velocity", 0)
    right_sway = right_metrics.get("sway_velocity", 0)
    sway_diff = abs(left_sway - right_sway)
    avg_sway = (left_sway + right_sway) / 2
    sway_symmetry = 1 - min(sway_diff / avg_sway, 1.0) if avg_sway > 0 else 1.0

    # Overall symmetry score (0-100)
    duration_symmetry = 1 - min(duration_diff_pct / 100, 1.0)
    overall_symmetry = (duration_symmetry * 0.5 + sway_symmetry * 0.3 + ...) * 100

    # Classification
    if overall_symmetry >= 85:
        symmetry_assessment = "excellent"
    elif overall_symmetry >= 70:
        symmetry_assessment = "good"
    elif overall_symmetry >= 50:
        symmetry_assessment = "fair"
    else:
        symmetry_assessment = "poor"

    return {
        "duration_difference": duration_diff,
        "duration_difference_pct": duration_diff_pct,
        "dominant_leg": dominant_leg,
        "sway_difference": sway_diff,
        "sway_symmetry_score": sway_symmetry,
        "overall_symmetry_score": overall_symmetry,
        "symmetry_assessment": symmetry_assessment,
        # ... other fields ...
    }
```

### 2.3 Update Assessment Endpoint

**File**: `backend/app/routers/assessments.py`

**Refactor Endpoint**:
```python
@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_video_endpoint(data: AssessmentCreate, current_user: User = Depends(get_current_user)):
    """Store assessment (single or dual leg)."""

    # Validate athlete ownership and consent (existing logic)
    # ...

    # Route based on legTested
    if data.leg_tested in ["left", "right"]:
        # Single-leg mode (existing logic)
        assessment = await _process_single_leg_assessment(data, current_user.id, athlete)
    elif data.leg_tested == "both":
        # Dual-leg mode (NEW)
        assessment = await _process_dual_leg_assessment(data, current_user.id, athlete)
    else:
        raise HTTPException(400, "Invalid leg_tested value")

    return AnalyzeResponse(id=assessment.id, status=assessment.status)
```

**New Handler**:
```python
async def _process_dual_leg_assessment(
    data: AssessmentCreate,
    coach_id: str,
    athlete: Athlete,
) -> Assessment:
    """Process dual-leg assessment."""

    if not data.dual_leg_metrics:
        raise HTTPException(400, "dual_leg_metrics required for dual-leg mode")

    # Calculate LTAD scores for both legs
    left_duration_score = get_duration_score(data.dual_leg_metrics.left_leg.hold_time)
    right_duration_score = get_duration_score(data.dual_leg_metrics.right_leg.hold_time)

    # Build metrics dicts
    left_metrics = _build_metrics_dict(data.dual_leg_metrics.left_leg, left_duration_score)
    right_metrics = _build_metrics_dict(data.dual_leg_metrics.right_leg, right_duration_score)

    # Calculate bilateral comparison
    from app.services.bilateral_comparison import calculate_bilateral_comparison
    bilateral_comparison = calculate_bilateral_comparison(left_metrics, right_metrics)

    # Create assessment
    assessment_repo = AssessmentRepository()
    assessment = await assessment_repo.create_completed_dual_leg(
        coach_id=coach_id,
        athlete_id=athlete.id,
        test_type=data.test_type.value,
        left_leg_video_url=data.left_video_url,    # Updated field name
        left_leg_video_path=data.left_video_path,  # Updated field name
        left_leg_metrics=left_metrics,
        right_leg_video_url=data.right_video_url,
        right_leg_video_path=data.right_video_path,
        right_leg_metrics=right_metrics,
        bilateral_comparison=bilateral_comparison,
    )

    # Generate bilateral AI feedback
    try:
        orchestrator = get_orchestrator()
        ai_assessment = await orchestrator.generate_feedback(
            request_type="bilateral_assessment",
            athlete_id=athlete.id,
            athlete_name=athlete.name,
            athlete_age=athlete.age,
            left_leg_metrics=left_metrics,
            right_leg_metrics=right_metrics,
            bilateral_comparison=bilateral_comparison,
        )
        await assessment_repo.update(assessment.id, {"ai_coach_assessment": ai_assessment})
    except Exception as e:
        logger.error(f"Failed to generate bilateral AI feedback: {e}")

    return assessment
```

### 2.4 Update Repository

**File**: `backend/app/repositories/assessment.py`

**Add Method**:
```python
async def create_completed_dual_leg(
    self,
    coach_id: str,
    athlete_id: str,
    test_type: str,
    left_leg_video_url: str,
    left_leg_video_path: str,
    left_leg_metrics: Dict,
    right_leg_video_url: str,
    right_leg_video_path: str,
    right_leg_metrics: Dict,
    bilateral_comparison: Dict,
) -> Assessment:
    """Create dual-leg assessment."""
    data = {
        "coach_id": coach_id,
        "athlete_id": athlete_id,
        "test_type": test_type,
        "assessment_mode": "dual_leg",
        "leg_tested": "both",
        "left_leg_video_url": left_leg_video_url,
        "left_leg_video_path": left_leg_video_path,
        "left_leg_metrics": left_leg_metrics,
        "right_leg_video_url": right_leg_video_url,
        "right_leg_video_path": right_leg_video_path,
        "right_leg_metrics": right_leg_metrics,
        "bilateral_comparison": bilateral_comparison,
        "status": "completed",
        "created_at": datetime.utcnow(),
    }

    assessment_id = await self.create(data)
    return await self.get(assessment_id)
```

---

## Part 3: AI Agent (Bilateral Feedback)

### 3.1 Create Bilateral Assessment Agent

**File**: `backend/app/agents/bilateral_assessment.py` (NEW)

**Function**:
```python
async def generate_bilateral_assessment_feedback(
    athlete_name: str,
    athlete_age: int,
    left_leg_metrics: Dict[str, Any],
    right_leg_metrics: Dict[str, Any],
    bilateral_comparison: Dict[str, Any],
) -> str:
    """Generate bilateral coaching feedback."""

    # Format bilateral summary for prompt (includes temporal data)
    bilateral_summary = f"""
=== LEFT LEG ===
Hold Time: {left_leg_metrics['hold_time']:.1f}s (Score: {left_leg_metrics['duration_score']}/5)
Sway Velocity: {left_leg_metrics['sway_velocity']:.2f} cm/s
Corrections: {left_leg_metrics['corrections_count']}
Temporal: First third avg velocity: {left_leg_metrics.get('temporal', {}).get('first_third', {}).get('avg_velocity', 'N/A')} cm/s

=== RIGHT LEG ===
Hold Time: {right_leg_metrics['hold_time']:.1f}s (Score: {right_leg_metrics['duration_score']}/5)
Sway Velocity: {right_leg_metrics['sway_velocity']:.2f} cm/s
Corrections: {right_leg_metrics['corrections_count']}
Temporal: First third avg velocity: {right_leg_metrics.get('temporal', {}).get('first_third', {}).get('avg_velocity', 'N/A')} cm/s

=== BILATERAL COMPARISON ===
Dominant Leg: {bilateral_comparison['dominant_leg'].upper()}
Duration Difference: {bilateral_comparison['duration_difference']:.1f}s ({bilateral_comparison['duration_difference_pct']:.1f}%)
Symmetry Score: {bilateral_comparison['overall_symmetry_score']:.1f}/100 ({bilateral_comparison['symmetry_assessment']})

=== TEMPORAL DATA ===
5-Second Segments: {len(left_leg_metrics.get('five_second_segments', []))} for left, {len(right_leg_metrics.get('five_second_segments', []))} for right
Events: {len(left_leg_metrics.get('events', []))} for left, {len(right_leg_metrics.get('events', []))} for right
"""

    user_prompt = f"""Generate bilateral coaching feedback for {athlete_name} (age {athlete_age}).

{bilateral_summary}

Provide feedback in this structure:
- 250-300 words total
- Compare left vs right performance
- Identify dominant leg and discuss symmetry
- Flag significant imbalances (>20% difference)
- Recommend exercises to address asymmetry
- Reference LTAD expectations for age {athlete_age}
"""

    # Call Claude Sonnet
    client = get_anthropic_client()
    response = await client.chat(
        model=settings.sonnet_model,
        messages=[{"role": "user", "content": user_prompt}],
        system=FULL_STATIC_CONTEXT + BILATERAL_BALANCE_CONTEXT,
        temperature=0.7,
        max_tokens=600,
    )

    return response.strip()
```

### 3.2 Update Static Context

**File**: `backend/app/prompts/static_context.py`

**Add Section**:
```python
BILATERAL_BALANCE_CONTEXT = """
# Bilateral Balance and Symmetry

## Normal Asymmetry by Age

Ages 5-7: HIGH variability normal (up to 50% difference)
Ages 8-9: MODERATE variability normal (20-40% difference)
Ages 10-11: LOW-MODERATE variability (10-30% difference)
Ages 12-13: MINIMAL variability goal (<20% difference)

## Asymmetry Thresholds

Minimal (<20%): Normal variation, no concern
Moderate (20-40%): Noticeable imbalance, add weaker leg focus
Significant (>40%): Warrants investigation, physiotherapy referral

## Bilateral Training

For Minimal: 50/50 balanced training
For Moderate: 60/40 split favoring weaker leg
For Significant: 70/30 split, professional assessment
"""

FULL_STATIC_CONTEXT = f"{LTAD_CONTEXT}\n\n{BILATERAL_BALANCE_CONTEXT}\n\n..."
```

### 3.3 Update Orchestrator

**File**: `backend/app/agents/orchestrator.py`

**Add Request Type**:
```python
RequestType = Literal[
    "assessment_feedback",
    "bilateral_assessment",  # NEW
    "parent_report",
    "progress_trends"
]
```

**Add Routing**:
```python
async def generate_feedback(self, request_type: RequestType, ...,
                           left_leg_metrics=None, right_leg_metrics=None,
                           bilateral_comparison=None):
    if request_type == "bilateral_assessment":
        from app.agents.bilateral_assessment import generate_bilateral_assessment_feedback
        return await generate_bilateral_assessment_feedback(
            athlete_name, athlete_age,
            left_leg_metrics, right_leg_metrics, bilateral_comparison
        )
    # ... existing routing ...
```

---

## Implementation Sequence

### Phase 1: Backend Foundation (4-6 hours)
1. Update `backend/app/models/assessment.py`: Add enums, BilateralComparison, update Assessment model
2. Create `backend/app/services/bilateral_comparison.py`: Implement symmetry calculations
3. Update `backend/app/repositories/assessment.py`: Add `create_completed_dual_leg()` method
4. Update `backend/app/routers/assessments.py`: Add `_process_dual_leg_assessment()` handler
5. Test backend with Postman/HTTPie

### Phase 2: AI Agent (3-4 hours)
6. Update `backend/app/prompts/static_context.py`: Add bilateral context
7. Create `backend/app/agents/bilateral_assessment.py`: Implement bilateral feedback
8. Update `backend/app/agents/orchestrator.py`: Add bilateral routing
9. Test AI feedback generation

### Phase 3: Frontend Types & Utils (2-3 hours)
10. Update `client/src/types/assessment.ts`: Add DualLegMetrics, SymmetryAnalysis
11. Create symmetry calculation utility function
12. Update API service to handle dual-leg payload

### Phase 4: Frontend Components (8-10 hours)
13. Create `TransitionModal.tsx`: Left-to-right transition UI
14. Update `RecordingStep.tsx`: Add autoStart prop
15. Create `TwoLegUploadStep.tsx`: Sequential upload + symmetry calc
16. Refactor `AssessmentFlow.tsx`: Remove stepper, add phase state machine
17. Create `TwoLegResultsView.tsx`: Bilateral comparison display
18. Update `AssessmentResults.tsx`: Route to appropriate view

### Phase 5: Integration Testing (3-4 hours)
19. End-to-end test: Complete two-leg flow
20. Test edge cases: reshoot, camera errors, upload failures
21. Verify bilateral AI feedback quality
22. Mobile responsive testing

### Phase 6: Polish (2 hours)
23. Error handling and loading states
24. Accessibility (ARIA labels, keyboard nav)
25. Documentation updates

**Total Estimated Time: 22-29 hours**

---

## Critical Files

### Must Create (New Files)
- `client/src/pages/Assessment/components/TransitionModal.tsx`
- `client/src/pages/Assessment/components/TwoLegUploadStep.tsx`
- `client/src/pages/Assessment/components/TwoLegResultsView.tsx`
- `backend/app/services/bilateral_comparison.py`
- `backend/app/agents/bilateral_assessment.py`

### Must Modify (Existing Files)
- `client/src/types/assessment.ts` - Add DualLegMetrics, SymmetryAnalysis, update interfaces
- `client/src/pages/Assessment/AssessmentFlow.tsx` - Remove stepper, add phase state machine
- `client/src/pages/Assessment/steps/RecordingStep.tsx` - Add autoStart prop
- `client/src/pages/Assessment/AssessmentResults.tsx` - Detect and route dual-leg assessments
- `backend/app/models/assessment.py` - Add AssessmentMode, BilateralComparison, update Assessment
- `backend/app/routers/assessments.py` - Add dual-leg handler
- `backend/app/repositories/assessment.py` - Add create_completed_dual_leg()
- `backend/app/agents/orchestrator.py` - Add bilateral_assessment routing
- `backend/app/prompts/static_context.py` - Add bilateral balance context

---

## Key Changes from Original Single-Leg Implementation

### Naming Convention Updates (Breaking Changes - OK for Development)

**OLD (inconsistent)**:
```typescript
// Single-leg
videoUrl, videoPath, duration
// Dual-leg
videoUrl, duration, rightVideoUrl, rightDuration  // ❌ Confusing!
```

**NEW (consistent)**:
```typescript
// Single-leg
leftVideoUrl, leftVideoPath, leftDuration
// Dual-leg
leftVideoUrl, leftVideoPath, leftDuration, rightVideoUrl, rightVideoPath, rightDuration  // ✅ Clear!
```

**Impact**: All single-leg assessments will need to use the new naming convention (`leftVideoUrl` instead of `videoUrl`). Since we're in development, this is acceptable.

### Temporal Data Preservation

**✅ ALL temporal data is preserved**:
- 5-second segments (`fiveSecondSegments[]`)
- Balance events (`events[]`)
- Temporal thirds (`temporal.firstThird`, etc.)

Both `leftLeg` and `rightLeg` metrics include full temporal granularity for AI analysis.

### Backend Routing Logic

The backend uses `leg_tested` to route:
- `leg_tested = 'left'` or `'right'` → `_process_single_leg_assessment()` (existing)
- `leg_tested = 'both'` → `_process_dual_leg_assessment()` (NEW)

## Backward Compatibility

**Important**: Since we're updating naming conventions, existing single-leg code will need updates:

**What needs updating**:
- All references to `videoUrl` → `leftVideoUrl`
- All references to `videoPath` → `leftVideoPath`
- All references to `duration` → `leftDuration`

**What stays the same**:
- MediaPipe.js client-side processing (source of truth)
- LTAD scoring logic
- AI feedback generation for single-leg assessments
- Database schema (Firestore is flexible)

---

## Edge Cases

1. **Reshoot left leg**: Clear left data, return to left-leg-testing phase
2. **Camera permission denied**: Show error, provide exit button
3. **Upload failure**: Retry button, videos stored in memory (not localStorage due to size)
4. **Backend error after left leg uploaded**: Videos remain in Firebase Storage (orphaned)
5. **Browser refresh mid-flow**: Progress lost (future: localStorage for recovery)
6. **One leg passes, other fails**: Both stored, bilateral feedback acknowledges difference

---

## Success Criteria

- ✅ User can complete two-leg test in <2 minutes
- ✅ Modal transition feels smooth and clear
- ✅ Bilateral comparison displays within 3 seconds of upload
- ✅ AI feedback identifies asymmetries >20% difference
- ✅ Symmetry score calculation accurate to ±5 points
- ✅ No breaking changes to existing single-leg flow
- ✅ Mobile responsive on iPhone/Android
