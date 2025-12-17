"""Seed mock athletes with realistic progression data for investor demo.

This script creates 3 mock athletes with 6 dual-leg assessments each:
- Max: Progressive improvement → plateau at 4-5 scores
- Sophia: Slow growth, consistently below age expectations
- Dan: Regression from score 3 → down to 1-2
"""

import os
import sys
import random
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Tuple

# Add backend to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# App imports
from app.models.athlete import AthleteCreate, Gender, ConsentStatus
from app.repositories.athlete import AthleteRepository
from app.repositories.assessment import AssessmentRepository
from app.services.bilateral_comparison import calculate_bilateral_comparison
from app.agents.orchestrator import get_orchestrator
from app.constants.scoring import DURATION_SCORE_THRESHOLDS
from app.firebase import init_firebase, get_db

# Initialize Firebase
init_firebase()
db = get_db()


# ============================================================================
# ATHLETE PROFILES
# ============================================================================

ATHLETE_PROFILES = {
    "Max": {
        "age": 10,
        "gender": "male",
        "parent_email": "max.parent@example.com",
        "progression": [
            (0, 2, 2, "symmetrical"),      # July: Starting average
            (1, 3, 3, "symmetrical"),      # Aug: Improving
            (2, 4, 3, "left_dominant"),    # Sep: Left leg ahead
            (3, 4, 4, "symmetrical"),      # Oct: Both catching up
            (4, 5, 4, "left_dominant"),    # Nov: Left peaks first
            (5, 5, 5, "symmetrical"),      # Dec: Both at peak
        ]
    },
    "Sophia": {
        "age": 6,
        "gender": "female",
        "parent_email": "sophia.parent@example.com",
        "progression": [
            (0, 1, 1, "symmetrical"),      # July: Below expectations
            (1, 1, 2, "right_dominant"),   # Aug: Right slightly better
            (2, 2, 1, "left_dominant"),    # Sep: Left improves, right regresses
            (3, 2, 2, "symmetrical"),      # Oct: Both at 2
            (4, 1, 2, "compensatory"),     # Nov: Struggling differently
            (5, 2, 2, "symmetrical"),      # Dec: Plateau at 2
        ]
    },
    "Dan": {
        "age": 11,
        "gender": "male",
        "parent_email": "dan.parent@example.com",
        "progression": [
            (0, 3, 3, "symmetrical"),      # July: Average
            (1, 3, 2, "left_dominant"),    # Aug: Right starts declining
            (2, 2, 2, "symmetrical"),      # Sep: Both declining
            (3, 2, 1, "compensatory"),     # Oct: Different failure modes
            (4, 1, 2, "right_dominant"),   # Nov: Left worse
            (5, 1, 1, "symmetrical"),      # Dec: Both below average
        ]
    }
}


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_coach_by_email(email: str) -> str:
    """Query Firestore for coach ID by email.

    Args:
        email: Coach email address

    Returns:
        Coach user ID

    Raises:
        ValueError: If coach not found
    """
    users_ref = db.collection("users")
    query = users_ref.where("email", "==", email).limit(1).get()

    if not query:
        raise ValueError(f"Coach with email {email} not found in Firestore")

    return query[0].id


def generate_assessment_date(month_index: int) -> datetime:
    """Create realistic monthly assessment date.

    Args:
        month_index: 0-5 for July-December 2025

    Returns:
        datetime for the assessment
    """
    month = 7 + month_index  # July = 7
    year = 2025

    # Random day between 4th and 27th (avoid month edges)
    day = random.randint(4, 27)

    # Random business hours (9 AM - 4 PM)
    hour = random.randint(9, 16)
    minute = random.choice([0, 15, 30, 45])

    return datetime(year, month, day, hour, minute, 0)


def calculate_duration_score(hold_time: float) -> int:
    """Map hold_time to LTAD score (1-5).

    Args:
        hold_time: Duration in seconds

    Returns:
        LTAD score (1-5)
    """
    for score, (min_time, max_time) in DURATION_SCORE_THRESHOLDS.items():
        if min_time <= hold_time <= max_time:
            return score
    return 1  # Fallback for values outside range


def generate_metrics_for_score(target_score: int, add_noise: bool = True) -> Dict[str, Any]:
    """Generate realistic metrics for a target LTAD score.

    Args:
        target_score: Target LTAD score (1-5)
        add_noise: Whether to add random variation

    Returns:
        Dictionary of metrics
    """
    # Map score to hold_time range
    min_time, max_time = DURATION_SCORE_THRESHOLDS[target_score]

    # Pick random hold_time in range (leave headroom at top)
    hold_time = random.uniform(min_time, max_time - 0.5)

    # Correlate other metrics (worse balance = higher sway)
    # These formulas create inverse correlation with hold_time
    base_sway_velocity = 15.0 - (hold_time * 0.3)  # Range: ~15cm/s (poor) to 6cm/s (excellent)
    base_sway_std = 3.0 - (hold_time * 0.08)       # Range: ~3cm to 0.6cm
    base_corrections = int(20 - (hold_time * 0.5)) # Range: 20 corrections to 5

    if add_noise:
        # Add ±15% random variation
        noise = random.uniform(0.85, 1.15)
        base_sway_velocity *= noise
        base_sway_std *= noise

    return {
        "success": True,
        "hold_time": round(hold_time, 1),
        "failure_reason": None,
        "sway_velocity": round(max(0.5, base_sway_velocity), 1),
        "sway_std_x": round(max(0.2, base_sway_std * random.uniform(0.9, 1.1)), 1),
        "sway_std_y": round(max(0.2, base_sway_std * random.uniform(0.9, 1.1)), 1),
        "sway_path_length": round(base_sway_velocity * hold_time, 1),
        "corrections_count": max(0, base_corrections),
        "arm_angle_left": round(random.uniform(85, 95), 1),
        "arm_angle_right": round(random.uniform(85, 95), 1),
        "arm_asymmetry_ratio": round(random.uniform(0.98, 1.05), 2),
        "duration_score": target_score,
    }


def apply_bilateral_asymmetry(
    base_metrics: Dict[str, Any],
    asymmetry_type: str,
    is_left_leg: bool
) -> Dict[str, Any]:
    """Modify metrics based on bilateral asymmetry pattern.

    Args:
        base_metrics: Base metrics to modify
        asymmetry_type: "symmetrical", "left_dominant", "right_dominant", "compensatory"
        is_left_leg: True if modifying left leg metrics

    Returns:
        Modified metrics dictionary
    """
    metrics = base_metrics.copy()

    if asymmetry_type == "symmetrical":
        # Minimal variation (±5%)
        variation = random.uniform(0.95, 1.05)
        metrics["sway_velocity"] *= variation
        metrics["sway_std_x"] *= variation
        metrics["sway_std_y"] *= variation

    elif asymmetry_type == "left_dominant":
        if is_left_leg:
            # Left performs better (lower sway, higher hold)
            metrics["sway_velocity"] *= random.uniform(0.85, 0.95)
            metrics["sway_std_x"] *= 0.9
            metrics["sway_std_y"] *= 0.9
        else:
            # Right performs worse
            metrics["sway_velocity"] *= random.uniform(1.05, 1.20)
            metrics["sway_std_x"] *= 1.15
            metrics["sway_std_y"] *= 1.15

    elif asymmetry_type == "right_dominant":
        if is_left_leg:
            # Left worse
            metrics["sway_velocity"] *= random.uniform(1.05, 1.20)
            metrics["sway_std_x"] *= 1.15
            metrics["sway_std_y"] *= 1.15
        else:
            # Right better
            metrics["sway_velocity"] *= random.uniform(0.85, 0.95)
            metrics["sway_std_x"] *= 0.9
            metrics["sway_std_y"] *= 0.9

    elif asymmetry_type == "compensatory":
        # Different failure modes
        if is_left_leg:
            metrics["sway_std_x"] *= 1.3
            metrics["sway_std_y"] *= 0.8
        else:
            metrics["sway_std_x"] *= 0.8
            metrics["sway_std_y"] *= 1.3

    # Recalculate derived metrics with updated values
    metrics["sway_path_length"] = round(
        metrics["sway_velocity"] * metrics["hold_time"], 1
    )
    metrics["sway_velocity"] = round(metrics["sway_velocity"], 1)
    metrics["sway_std_x"] = round(metrics["sway_std_x"], 1)
    metrics["sway_std_y"] = round(metrics["sway_std_y"], 1)

    return metrics


async def create_dual_leg_assessment(
    coach_id: str,
    athlete_id: str,
    athlete_name: str,
    athlete_age: int,
    athlete_gender: str,
    assessment_date: datetime,
    left_score: int,
    right_score: int,
    asymmetry_type: str,
    month_name: str,
) -> str:
    """Create a dual-leg assessment with AI feedback.

    Args:
        coach_id: Coach user ID
        athlete_id: Athlete ID
        athlete_name: Athlete name (for AI context)
        athlete_age: Athlete age (for AI context)
        assessment_date: When assessment occurred
        left_score: Target LTAD score for left leg
        right_score: Target LTAD score for right leg
        asymmetry_type: Bilateral asymmetry pattern
        month_name: Month name for logging

    Returns:
        Assessment ID
    """
    # 1. Generate base metrics for each leg
    left_base = generate_metrics_for_score(left_score)
    right_base = generate_metrics_for_score(right_score)

    # 2. Apply bilateral asymmetry
    left_metrics = apply_bilateral_asymmetry(left_base, asymmetry_type, is_left_leg=True)
    right_metrics = apply_bilateral_asymmetry(right_base, asymmetry_type, is_left_leg=False)

    # 3. Calculate bilateral comparison
    bilateral_comparison = calculate_bilateral_comparison(left_metrics, right_metrics)

    # 4. Create assessment in Firestore
    assessment_repo = AssessmentRepository()
    assessment = await assessment_repo.create_completed_dual_leg(
        coach_id=coach_id,
        athlete_id=athlete_id,
        test_type="one_leg_balance",
        left_leg_video_url=None,  # Will trigger 📷 on frontend
        left_leg_video_path=None,
        left_leg_metrics=left_metrics,
        right_leg_video_url=None,
        right_leg_video_path=None,
        right_leg_metrics=right_metrics,
        bilateral_comparison=bilateral_comparison,
    )

    # 5. Override created_at to match progression timeline
    db.collection("assessments").document(assessment.id).update({
        "created_at": assessment_date
    })

    # 6. Generate AI feedback
    orchestrator = get_orchestrator()
    try:
        feedback = await orchestrator.generate_feedback(
            request_type="bilateral_assessment",
            athlete_id=athlete_id,
            athlete_name=athlete_name,
            athlete_age=athlete_age,
            athlete_gender=athlete_gender,
            metrics={
                "left_leg_metrics": left_metrics,
                "right_leg_metrics": right_metrics,
                "bilateral_comparison": bilateral_comparison,
            },
            current_assessment_id=assessment.id,
        )

        # Update with AI feedback
        db.collection("assessments").document(assessment.id).update({
            "ai_coach_assessment": feedback
        })

        print(f"    ✓ {month_name} - Scores L{left_score}/R{right_score} - AI feedback generated")

    except Exception as e:
        print(f"    ⚠️  {month_name} - Scores L{left_score}/R{right_score} - AI feedback failed: {e}")

    return assessment.id


# ============================================================================
# MAIN EXECUTION
# ============================================================================

async def main():
    """Main seeding function."""
    print("🌱 Starting mock athlete seeding...\n")

    # Get coach
    try:
        coach_id = get_coach_by_email("vanessa.mercado24@gmail.com")
        print(f"✓ Found coach: vanessa.mercado24@gmail.com (ID: {coach_id})\n")
    except ValueError as e:
        print(f"❌ Error: {e}")
        print("Please ensure the coach account exists in Firestore before running this script.")
        return

    athlete_repo = AthleteRepository()
    month_names = ["July", "Aug", "Sep", "Oct", "Nov", "Dec"]

    # Create each athlete
    for name, profile in ATHLETE_PROFILES.items():
        print(f"📊 Creating athlete: {name}")

        # Create athlete
        athlete_data = AthleteCreate(
            name=name,
            age=profile["age"],
            gender=Gender(profile["gender"]),
            parent_email=profile["parent_email"],
        )

        athlete = await athlete_repo.create_for_coach(coach_id, athlete_data)

        # Update consent status to "active"
        db.collection("athletes").document(athlete.id).update({
            "consent_status": ConsentStatus.ACTIVE.value,
            "consent_timestamp": datetime.utcnow(),
        })

        print(f"  ✓ Athlete created (ID: {athlete.id}, Age: {profile['age']})")

        # Create 6 assessments
        for month_idx, left_score, right_score, asymmetry in profile["progression"]:
            date = generate_assessment_date(month_idx)

            await create_dual_leg_assessment(
                coach_id=coach_id,
                athlete_id=athlete.id,
                athlete_name=name,
                athlete_age=profile["age"],
                athlete_gender=profile["gender"],
                assessment_date=date,
                left_score=left_score,
                right_score=right_score,
                asymmetry_type=asymmetry,
                month_name=month_names[month_idx],
            )

        print()

    print("✅ Seeding complete!")
    print("   Athletes created: 3")
    print("   Assessments created: 18")
    print("\nNext steps:")
    print("1. Verify data in Firebase Console")
    print("2. Login as vanessa.mercado24@gmail.com on frontend")
    print("3. Check athlete dashboards show progression patterns")


if __name__ == "__main__":
    asyncio.run(main())
