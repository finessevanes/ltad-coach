"""Chat API endpoint with SSE streaming.

This module provides a streaming chat endpoint that uses Server-Sent Events
to deliver AI Coach responses in real-time.
"""

import logging
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from app.middleware.auth import get_current_user
from app.models.user import User
from app.agents.chat import ChatAgent
from app.repositories.athlete import AthleteRepository

router = APIRouter(prefix="/chat", tags=["chat"])
logger = logging.getLogger(__name__)


class ChatMessage(BaseModel):
    """A single chat message."""

    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., min_length=1, max_length=10000)


class ChatRequest(BaseModel):
    """Chat request body."""

    messages: List[ChatMessage] = Field(..., min_length=1, max_length=50)
    athlete_id: Optional[str] = Field(
        None, description="Optional explicit athlete ID for context"
    )


async def generate_sse_stream(
    chat_agent: ChatAgent,
    messages: List[dict],
    athlete_context: Optional[str],
):
    """Generate SSE stream from chat agent.

    Args:
        chat_agent: Initialized chat agent
        messages: Chat history as list of dicts
        athlete_context: Optional athlete context string

    Yields:
        SSE formatted events
    """
    try:
        async for chunk in chat_agent.stream_response(
            messages=messages,
            athlete_context=athlete_context,
        ):
            # SSE format: data: <json>\n\n
            yield f"data: {json.dumps({'content': chunk})}\n\n"

        # Send done event
        yield f"data: {json.dumps({'done': True})}\n\n"

    except Exception as e:
        logger.error(f"Chat stream error: {e}")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"


@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
):
    """Stream chat response via Server-Sent Events.

    This endpoint:
    1. Validates the authenticated user
    2. Optionally fetches athlete context (if athlete_id provided or name mentioned)
    3. Streams OpenAI response chunks as SSE events

    SSE Event Format:
    - Content chunk: data: {"content": "text chunk"}\n\n
    - Done signal: data: {"done": true}\n\n
    - Error: data: {"error": "error message"}\n\n

    Args:
        request: Chat request with message history
        current_user: Authenticated coach

    Returns:
        StreamingResponse with SSE content type

    Raises:
        404: Athlete not found (if explicit athlete_id is specified)
    """
    chat_agent = ChatAgent(coach_id=current_user.id)
    athlete_context = None

    # Convert Pydantic models to dicts for the agent
    messages = [{"role": m.role, "content": m.content} for m in request.messages]

    # Get athlete context if explicitly specified
    if request.athlete_id:
        athlete_repo = AthleteRepository()
        athlete = await athlete_repo.get_if_owned(request.athlete_id, current_user.id)

        if not athlete:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Athlete not found",
            )

        athlete_context = await chat_agent.get_athlete_context(
            athlete_id=athlete.id,
            athlete_name=athlete.name,
            athlete_age=athlete.age,
        )
    else:
        # Try to detect athlete mention in the latest user message
        latest_message = ""
        for msg in reversed(messages):
            if msg["role"] == "user":
                latest_message = msg["content"]
                break

        if latest_message:
            # Get coach's athletes for name matching
            athlete_repo = AthleteRepository()
            athletes = await athlete_repo.get_by_coach(current_user.id)
            athlete_dicts = [
                {"id": a.id, "name": a.name, "age": a.age}
                for a in athletes
            ]

            mentioned_athlete = await chat_agent.find_mentioned_athlete(
                message=latest_message,
                coach_athletes=athlete_dicts,
            )

            if mentioned_athlete:
                athlete_context = await chat_agent.get_athlete_context(
                    athlete_id=mentioned_athlete["id"],
                    athlete_name=mentioned_athlete["name"],
                    athlete_age=mentioned_athlete["age"],
                )

    return StreamingResponse(
        generate_sse_stream(chat_agent, messages, athlete_context),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )
