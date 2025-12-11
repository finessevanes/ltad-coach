# Video Processing & MediaPipe Implementation

## Overview

This document describes the complete implementation of all video processing and MediaPipe PRDs (PR-012 through PR-023). All functionality has been implemented according to the specifications in the PRD files.

## Completed PRDs

### Core Infrastructure
- **PR-012**: Video Upload Endpoint
- **PR-013**: Video Metadata Storage
- **PR-014**: MediaPipe Setup & Landmark Extraction

### Analysis & Metrics
- **PR-015**: Failure Detection Logic
- **PR-016**: Sway Metrics Calculation
- **PR-017**: Arm Excursion Metrics
- **PR-018**: Stability Score Calculation
- **PR-019**: Raw Keypoints Storage

### Scoring & Ranking
- **PR-020**: Benchmark Data Seeding
- **PR-021**: Duration Score Calculation
- **PR-022**: Percentile Calculation Logic
- **PR-023**: Team Ranking Logic

## Implementation Details

### 1. Services Created

#### `/app/services/database.py`
- Firestore database service with CRUD operations
- Collections management (VIDEO_UPLOADS, BENCHMARKS, etc.)
- Query functionality with filters and ordering

#### `/app/services/storage.py`
- Firebase Storage service for video and JSON uploads
- Signed URL generation
- File validation and management

#### `/app/services/video_metadata.py`
- Video upload metadata tracking
- Status management (uploaded → processing → completed/failed)
- Query videos by athlete or coach

#### `/app/services/mediapipe_service.py`
Complete MediaPipe integration with:
- Pose landmark extraction from video
- Failure detection (foot touchdown, hands off hips, support foot movement)
- Sway metrics (standard deviation, path length, velocity)
- Arm excursion metrics and asymmetry calculation
- Stability score (composite 0-100 score)
- Raw keypoints storage

#### `/app/services/scoring.py`
- LTAD duration score calculation (1-5 tiers)
- National percentile calculation (mock for MVP)
- Team ranking logic

### 2. Models Created

#### `/app/models/video.py`
- `VideoStatus` enum (UPLOADED, PROCESSING, COMPLETED, FAILED)
- `VideoMetadata` model with timestamps and processing status

#### `/app/models/assessment.py`
- `FailureReason` enum (TIME_COMPLETE, FOOT_TOUCHDOWN, HANDS_LEFT_HIPS, SUPPORT_FOOT_MOVED)
- `AssessmentMetrics` model with all calculated metrics
- `AssessmentScoring` model with LTAD scores and rankings
- `Assessment` model for complete assessment records

### 3. API Endpoints

#### `/app/api/assessments.py`
- `POST /api/assessments/upload-video` - Upload video with validation
- `GET /api/assessments/videos/{upload_id}` - Get video metadata
- `GET /api/assessments/videos/athlete/{athlete_id}` - Get athlete's videos

#### `/app/api/benchmarks.py`
- `GET /api/benchmarks/{test_type}/{age}` - Get benchmark data for age group

### 4. Scripts Created

#### `/scripts/seed_benchmarks.py`
Benchmark seeding script with:
- LTAD scoring tiers (1-5)
- Age group expectations (10-11, 12-13, 14)
- Idempotent operation (can run multiple times)

## Installation & Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

Ensure `.env` file has:
```
GOOGLE_APPLICATION_CREDENTIALS=./ltad-coach-firebase-adminsdk-fbsvc-fc7b6b2a69.json
FIREBASE_STORAGE_BUCKET=ltad-coach.firebasestorage.app
```

### 3. Seed Benchmarks

```bash
python scripts/seed_benchmarks.py
```

### 4. Run Server

```bash
uvicorn app.main:app --reload --port 8000
```

## Usage Examples

### Upload a Video

```bash
curl -X POST http://localhost:8000/api/assessments/upload-video \
  -H "Authorization: Bearer <firebase-token>" \
  -F "file=@balance-test.mp4" \
  -F "athlete_id=athlete-123"
```

Response:
```json
{
  "uploadId": "uuid-here",
  "storagePath": "videos/athlete-123/uuid/video.mp4",
  "size": 15728640,
  "format": "mp4",
  "status": "uploaded"
}
```

### Process Video with MediaPipe

```python
from app.services.mediapipe_service import mediapipe_service
from app.services.storage import storage_service
import tempfile

# Download video from storage
video_bytes = storage_service.download_file("videos/athlete-123/uuid/video.mp4")

# Save to temp file
with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
    tmp.write(video_bytes)
    video_path = tmp.name

# Extract landmarks
result = mediapipe_service.extract_landmarks_from_video(video_path)

# Detect failure
failure = mediapipe_service.detect_failure(
    frames_data=result["frames"],
    standing_leg="right",
    test_duration=20.0
)

# Calculate metrics
sway_metrics = mediapipe_service.calculate_sway_metrics(
    frames_data=result["frames"],
    duration=failure["duration"]
)

arm_metrics = mediapipe_service.calculate_arm_metrics(
    frames_data=result["frames"]
)

# Calculate stability score
stability_score = mediapipe_service.calculate_stability_score(
    sway_metrics=sway_metrics,
    arm_metrics=arm_metrics,
    duration=failure["duration"]
)

# Save raw keypoints
keypoints_path = mediapipe_service.save_raw_keypoints(
    frames_data=result["frames"],
    assessment_id="assessment-id"
)
```

### Calculate Scores and Rankings

```python
from app.services.scoring import scoring_service

# Duration score (1-5 LTAD tiers)
duration_score = scoring_service.calculate_duration_score(
    duration=18.5,
    age=12
)
# Returns: {"score": 3, "label": "Competent", "expectationStatus": "below", "expectedScore": 5}

# National percentile (mock)
percentile = scoring_service.calculate_percentile(
    score=duration_score["score"],
    duration=18.5
)
# Returns: 55

# Team rank
team_rank = scoring_service.calculate_team_rank(
    stability_score=75.5,
    coach_id="coach-123"
)
# Returns: {"rank": 3, "totalAthletes": 12, "percentile": 75}
```

## MediaPipe Metrics Reference

### Failure Detection
- **Foot Touchdown**: Raised ankle Y-coordinate drops to ground level (±5% tolerance)
- **Hands Left Hips**: Wrist-to-hip vertical distance > 10% of frame height
- **Support Foot Movement**: Standing ankle displacement > 15% of frame width
- **Time Complete**: Successfully maintained balance for 20 seconds

### Sway Metrics
- **swayStdX**: Standard deviation of lateral (X-axis) movement
- **swayStdY**: Standard deviation of anterior-posterior (Y-axis) movement
- **swayPathLength**: Total distance traveled by hip midpoint (cm)
- **swayVelocity**: Path length divided by duration (cm/s)

### Arm Metrics
- **armExcursionLeft**: Range of left wrist movement relative to shoulder
- **armExcursionRight**: Range of right wrist movement relative to shoulder
- **armAsymmetryRatio**: Left excursion / Right excursion
- **correctionsCount**: Number of threshold crossings (>2 SD from mean)

### Stability Score
Composite score (0-100) calculated as:
```
score = 100 * (
  0.20 * duration_ratio +
  0.35 * (1 - normalized_sway) +
  0.25 * (1 - normalized_arm) +
  0.20 * (1 - normalized_corrections)
)
```

## LTAD Scoring Tiers

| Score | Duration | Label | Typical Age Expectation |
|-------|----------|-------|------------------------|
| 1 | 1-9s | Beginning | Below 10 years |
| 2 | 10-14s | Developing | 10 years |
| 3 | 15-19s | Competent | 11 years |
| 4 | 20-24s | Proficient | 12-13 years |
| 5 | 25s+ | Advanced | 14+ years |

## Storage Structure

### Firebase Storage Paths
```
videos/{athleteId}/{assessmentId}/video.{ext}
keypoints/{assessmentId}/raw_keypoints.json
```

### Firestore Collections
```
video_uploads/
  {uploadId}/
    - uploadId
    - athleteId
    - coachId
    - storagePath
    - size
    - format
    - status
    - uploadedAt
    - processingStartedAt
    - processingCompletedAt

benchmarks/
  one_leg_balance_{ageGroup}/
    - testType
    - ageGroup
    - expectedScore
    - scoringTiers

assessments/
  {assessmentId}/
    - athleteId
    - coachId
    - uploadId
    - videoPath
    - keypointsPath
    - standingLeg
    - athleteAge
    - metrics (all calculated metrics)
    - scoring (LTAD scores and rankings)
```

## Integration with Existing Code

All services integrate seamlessly with existing:
- Firebase initialization (`app/core/firebase.py`)
- Configuration management (`app/core/config.py`)
- Authentication middleware (`app/core/auth.py`)

The video upload endpoint requires Firebase authentication. All other services can be used programmatically within the application.

## Next Steps

To complete the full assessment workflow:

1. **Create Assessment Record** (PR-029): Combine video upload with MediaPipe processing
2. **Add Processing Queue**: Background job processing for video analysis
3. **Error Handling**: Robust error handling for MediaPipe failures
4. **Testing**: Unit tests for all services and metrics calculations
5. **Calibration**: Fine-tune metric thresholds based on real test data

## Testing

To test the implementation:

```bash
# 1. Seed benchmarks
python scripts/seed_benchmarks.py

# 2. Start the server
uvicorn app.main:app --reload

# 3. Upload a test video
curl -X POST http://localhost:8000/api/assessments/upload-video \
  -H "Authorization: Bearer <token>" \
  -F "file=@test-video.mp4" \
  -F "athlete_id=test-athlete-123"

# 4. Check API docs
open http://localhost:8000/docs
```

## Notes

- All PRD files have been marked with `status: COMPLETED`
- MediaPipe dependencies are included in `requirements.txt`
- Environment variables are used from `.env` file (never hardcoded)
- All services follow the singleton pattern for global instances
- Error handling follows FastAPI best practices with HTTPException
