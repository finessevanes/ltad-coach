"""Chat Agent - Handles AI Coach chat interactions.

This agent provides streaming chat responses using OpenAI, with optional
athlete context fetched via the compression agent.
"""

import logging
from typing import List, Dict, Any, Optional, AsyncIterator
from app.agents.openai_client import get_openai_client
from app.agents.compression import compress_history
from app.repositories.athlete import AthleteRepository
from app.repositories.assessment import AssessmentRepository
from app.prompts.chat_context import CHAT_SYSTEM_PROMPT

logger = logging.getLogger(__name__)


class ChatAgent:
    """Handles chat interactions with athlete context awareness."""

    def __init__(self, coach_id: str):
        """Initialize chat agent for a specific coach.

        Args:
            coach_id: The authenticated coach's user ID
        """
        self.coach_id = coach_id
        self.athlete_repo = AthleteRepository()
        self.assessment_repo = AssessmentRepository()

    async def find_mentioned_athlete(
        self,
        message: str,
        coach_athletes: List[Dict[str, Any]],
    ) -> Optional[Dict[str, Any]]:
        """Find an athlete mentioned by name in the message.

        Performs case-insensitive matching of athlete names against the message.

        Args:
            message: User message to search
            coach_athletes: List of coach's athletes with id, name, age fields

        Returns:
            Athlete dict if found, None otherwise
        """
        message_lower = message.lower()

        for athlete in coach_athletes:
            # Check if athlete name appears in message (case-insensitive)
            athlete_name = athlete.get("name", "")
            if athlete_name and athlete_name.lower() in message_lower:
                return athlete

        return None

    async def get_athlete_context(
        self,
        athlete_id: str,
        athlete_name: str,
        athlete_age: int,
    ) -> str:
        """Get compressed athlete assessment history for context.

        Fetches the athlete's assessments and uses the compression agent
        to create a concise summary for inclusion in the chat context.

        Args:
            athlete_id: Athlete's ID
            athlete_name: Athlete's name
            athlete_age: Athlete's age

        Returns:
            Formatted context string with athlete summary
        """
        # Fetch last 12 assessments for this athlete
        assessments = await self.assessment_repo.get_by_athlete(
            athlete_id,
            limit=12
        )

        if not assessments:
            return (
                f"## Athlete Context: {athlete_name} (Age {athlete_age})\n\n"
                f"{athlete_name} has no prior assessments recorded yet. "
                "This is a new athlete in your roster."
            )

        # Convert assessment models to dicts for compression
        assessment_dicts = []
        for a in assessments:
            # Handle metrics - could be a Pydantic model or dict
            if hasattr(a.metrics, 'model_dump'):
                metrics = a.metrics.model_dump()
            elif hasattr(a.metrics, 'dict'):
                metrics = a.metrics.dict()
            elif isinstance(a.metrics, dict):
                metrics = a.metrics
            else:
                metrics = {}

            assessment_dicts.append({
                "id": a.id,
                "created_at": a.created_at,
                "metrics": metrics,
                "status": a.status.value if hasattr(a.status, 'value') else a.status,
            })

        # Use existing Claude compression agent to summarize history
        try:
            compressed = await compress_history(
                assessments=assessment_dicts,
                athlete_name=athlete_name,
                athlete_age=athlete_age,
            )
            return (
                f"## Athlete Context: {athlete_name} (Age {athlete_age})\n\n"
                f"Assessment Count: {len(assessments)}\n\n"
                f"{compressed}"
            )
        except Exception as e:
            logger.error(f"Failed to compress history for {athlete_name}: {e}")
            return (
                f"## Athlete Context: {athlete_name} (Age {athlete_age})\n\n"
                f"{athlete_name} has {len(assessments)} assessment(s) on record. "
                "Detailed history is currently unavailable."
            )

    async def stream_response(
        self,
        messages: List[Dict[str, str]],
        athlete_context: Optional[str] = None,
    ) -> AsyncIterator[str]:
        """Stream chat response from OpenAI.

        Args:
            messages: Chat history (list of role/content dicts)
            athlete_context: Optional athlete context to append to system prompt

        Yields:
            Text chunks as they are generated
        """
        client = get_openai_client()

        # Build system prompt with optional athlete context
        system_prompt = CHAT_SYSTEM_PROMPT
        if athlete_context:
            system_prompt = f"{system_prompt}\n\n{athlete_context}"

        async for chunk in client.chat_stream(
            messages=messages,
            system=system_prompt,
            temperature=0.7,
            max_tokens=2048,
        ):
            yield chunk
