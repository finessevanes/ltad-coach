from app.services.database import db, Collections
from typing import Dict, Any


class ScoringService:
    def calculate_duration_score(self, duration: float, age: int) -> Dict[str, Any]:
        """
        Calculate LTAD score (1-5) from duration

        Args:
            duration: Balance duration in seconds
            age: Athlete age

        Returns:
            {
                "score": int (1-5),
                "label": str,
                "expectationStatus": "meets" | "above" | "below",
                "expectedScore": int
            }
        """
        # Get benchmark
        if age <= 11:
            age_group = "10-11"
        elif age <= 13:
            age_group = "12-13"
        else:
            age_group = "14"

        doc_id = f"one_leg_balance_{age_group}"
        benchmark = db.get(Collections.BENCHMARKS, doc_id)

        if not benchmark:
            raise ValueError("Benchmark not found")

        tiers = benchmark["scoringTiers"]
        expected_score = benchmark["expectedScore"]

        # Determine score based on duration
        score = 1
        label = "Beginning"

        for tier_key in ["score5", "score4", "score3", "score2", "score1"]:
            tier = tiers[tier_key]
            if tier["max"] is None:  # Score 5 has no max
                if duration >= tier["min"]:
                    score = int(tier_key[-1])
                    label = tier["label"]
                    break
            elif tier["min"] <= duration <= tier["max"]:
                score = int(tier_key[-1])
                label = tier["label"]
                break

        # Determine expectation status
        if score == expected_score:
            expectation_status = "meets"
        elif score > expected_score:
            expectation_status = "above"
        else:
            expectation_status = "below"

        return {
            "score": score,
            "label": label,
            "expectationStatus": expectation_status,
            "expectedScore": expected_score
        }

    def calculate_percentile(self, score: int, duration: float) -> int:
        """
        Calculate national percentile (MOCK for MVP)

        In production, this would query aggregated data.
        For MVP, use score-based approximation.

        Args:
            score: LTAD score (1-5)
            duration: Balance duration

        Returns:
            Percentile (0-100)
        """
        # Mock percentile mapping
        base_percentiles = {
            1: 15,   # Beginning
            2: 35,   # Developing
            3: 55,   # Competent
            4: 75,   # Proficient
            5: 90    # Advanced
        }

        percentile = base_percentiles.get(score, 50)

        # Fine-tune based on duration within tier
        # Add up to ±10 percentile points
        if score == 5 and duration > 30:
            percentile = min(98, percentile + 5)
        elif score == 1 and duration < 5:
            percentile = max(5, percentile - 5)

        return percentile

    def calculate_team_rank(
        self,
        stability_score: float,
        coach_id: str
    ) -> Dict[str, Any]:
        """
        Calculate athlete's rank within coach's roster

        Args:
            stability_score: Current assessment stability score
            coach_id: Coach ID to query their athletes

        Returns:
            {
                "rank": int,
                "totalAthletes": int,
                "percentile": int (team-relative)
            }
        """
        # Get all athletes for this coach
        athletes = db.query(
            Collections.ATHLETES,
            filters=[("coachId", "==", coach_id)]
        )

        if not athletes:
            return {"rank": 1, "totalAthletes": 1, "percentile": 100}

        # Get most recent assessment for each athlete
        athlete_scores = []

        for athlete in athletes:
            assessments = db.query(
                Collections.ASSESSMENTS,
                filters=[("athleteId", "==", athlete["id"])],
                order_by="createdAt",
                limit=1
            )

            if assessments and "metrics" in assessments[0]:
                metrics = assessments[0]["metrics"]
                if "stabilityScore" in metrics:
                    athlete_scores.append(metrics["stabilityScore"])

        # Add current score
        athlete_scores.append(stability_score)

        # Sort descending (higher is better)
        athlete_scores.sort(reverse=True)

        # Find rank
        rank = athlete_scores.index(stability_score) + 1
        total = len(athlete_scores)

        # Calculate team percentile
        team_percentile = int(((total - rank) / total) * 100) if total > 1 else 100

        return {
            "rank": rank,
            "totalAthletes": total,
            "percentile": team_percentile
        }


# Global instance
scoring_service = ScoringService()
