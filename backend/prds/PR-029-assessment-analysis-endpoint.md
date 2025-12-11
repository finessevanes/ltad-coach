---
id: BE-029
depends_on: [BE-012, BE-018, BE-021, BE-027]
blocks: [BE-030]
---

# BE-029: Assessment Analysis Endpoint (Main Pipeline)

## Scope

**In Scope:**
- POST `/api/assessments/analyze` - Full analysis pipeline
- Orchestrate: video → CV → metrics → AI → storage
- Return complete assessment with feedback
- Create assessment document in Firestore

**Out of Scope:**
- Video upload (BE-012 - already done)
- Individual metric calculations (BE-014-018)

## Technical Decisions

- **Flow**:
  1. Receive video storage path + metadata
  2. Extract landmarks (MediaPipe)
  3. Detect failure
  4. Calculate all metrics
  5. Calculate scores
  6. Generate AI feedback
  7. Store everything
  8. Return results
- **Endpoint**: POST `/api/assessments/analyze`
- **Response**: Complete assessment object

## Acceptance Criteria

- [ ] Accepts video path, athlete ID, leg selection
- [ ] Runs full CV analysis pipeline
- [ ] Generates AI feedback
- [ ] Creates assessment document
- [ ] Returns complete results
- [ ] Handles errors gracefully

## Files to Create/Modify

- `app/api/assessments.py` (modify - add analyze endpoint)
- `app/models/assessment.py` (modify - full assessment model)

## Implementation Notes

**app/api/assessments.py** (add endpoint):
```python
from app.services.mediapipe_service import mediapipe_service
from app.services.scoring import scoring_service
from app.services.agents.assessment_agent import assessment_agent
from pydantic import BaseModel

class AnalyzeRequest(BaseModel):
    athleteId: str
    videoPath: str  # Storage path from upload
    legTested: str  # "left" or "right"

@router.post("/analyze")
async def analyze_assessment(
    request: AnalyzeRequest,
    user: dict = Depends(get_current_user)
):
    """
    Analyze video and generate complete assessment

    Full pipeline: Video → CV → Metrics → AI → Storage
    """
    try:
        # 1. Verify athlete belongs to coach
        athlete = db.get(Collections.ATHLETES, request.athleteId)
        if not athlete or athlete["coachId"] != user["uid"]:
            raise HTTPException(status_code=403, detail="Not authorized")

        if athlete["consentStatus"] != "active":
            raise HTTPException(status_code=400, detail="Parental consent required")

        # 2. Download video from storage (get signed URL)
        video_url = storage_service.get_signed_url(request.videoPath)

        # TODO: Download video file locally for processing
        # For now, assume video is accessible at local path

        # 3. Extract landmarks
        landmarks_data = mediapipe_service.extract_landmarks_from_video(request.videoPath)

        # 4. Detect failure
        failure_data = mediapipe_service.detect_failure(
            landmarks_data["frames"],
            request.legTested,
            test_duration=20.0
        )

        # 5. Calculate metrics
        sway_metrics = mediapipe_service.calculate_sway_metrics(
            landmarks_data["frames"],
            failure_data["duration"]
        )

        arm_metrics = mediapipe_service.calculate_arm_metrics(
            landmarks_data["frames"]
        )

        stability_score = mediapipe_service.calculate_stability_score(
            sway_metrics,
            arm_metrics,
            failure_data["duration"]
        )

        # 6. Calculate scores
        duration_score = scoring_service.calculate_duration_score(
            failure_data["duration"],
            athlete["age"]
        )

        percentile = scoring_service.calculate_percentile(
            duration_score["score"],
            failure_data["duration"]
        )

        team_rank = scoring_service.calculate_team_rank(
            stability_score,
            user["uid"]
        )

        # 7. Save raw keypoints
        keypoints_path = mediapipe_service.save_raw_keypoints(
            landmarks_data["frames"],
            str(uuid.uuid4())  # Temp ID, will use real assessment ID
        )

        # 8. Combine all metrics
        all_metrics = {
            **sway_metrics,
            **arm_metrics,
            "durationSeconds": failure_data["duration"],
            "stabilityScore": stability_score,
            "durationScore": duration_score,
            "failureReason": failure_data["failureReason"],
            "percentile": percentile
        }

        # 9. Generate AI feedback
        ai_feedback = assessment_agent.generate_feedback(
            metrics=all_metrics,
            athlete_age=athlete["age"],
            team_rank=team_rank
        )

        # 10. Create assessment document
        assessment_data = {
            "athleteId": request.athleteId,
            "coachId": user["uid"],
            "testType": "one_leg_balance",
            "legTested": request.legTested,
            "videoUrl": request.videoPath,
            "rawKeypointsUrl": keypoints_path,
            "metrics": all_metrics,
            "aiFeedback": ai_feedback,
            "percentile": percentile,
            "coachNotes": ""
        }

        assessment_id = db.create(Collections.ASSESSMENTS, assessment_data)
        assessment_data["id"] = assessment_id

        return {
            "assessment": assessment_data,
            "teamRank": team_rank
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
```

## Testing

End-to-end test:
1. Upload video
2. Call analyze endpoint
3. Verify assessment created in Firestore
4. Verify AI feedback generated

## Estimated Complexity

**Size**: L (Large - ~4 hours)

## Notes

- This is the critical path endpoint
- Proper error handling essential
- Video download from Storage URL needs implementation
- Consider adding progress updates for long videos
