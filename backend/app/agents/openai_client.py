"""OpenAI API client for Chat Assistant.

This client handles streaming chat completions using OpenAI's API.
"""

import logging
from typing import List, Dict, Any, Optional, AsyncIterator
from openai import AsyncOpenAI
from openai import (
    APIError,
    APIConnectionError,
    APIStatusError,
    APITimeoutError,
    RateLimitError,
)
from app.config import get_settings

logger = logging.getLogger(__name__)


class OpenAIClient:
    """Client for OpenAI API with streaming support."""

    def __init__(self):
        """Initialize OpenAI client with API credentials."""
        settings = get_settings()
        self.client = AsyncOpenAI(
            api_key=settings.openai_api_key,
            timeout=60.0
        )
        self.model = settings.openai_model

    async def chat_stream(
        self,
        messages: List[Dict[str, Any]],
        system: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncIterator[str]:
        """Stream chat completion from OpenAI API.

        Args:
            messages: List of message dicts with "role" and "content"
            system: Optional system prompt
            temperature: Sampling temperature (0-1)
            max_tokens: Maximum tokens to generate

        Yields:
            Text chunks as they are generated

        Raises:
            Exception: If API call fails
        """
        # Build messages with system prompt at the start
        full_messages = []
        if system:
            full_messages.append({"role": "system", "content": system})
        full_messages.extend(messages)

        try:
            stream = await self.client.chat.completions.create(
                model=self.model,
                messages=full_messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
            )

            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

        except RateLimitError as e:
            logger.error(f"Rate limit exceeded: {e}")
            raise Exception(f"Rate limit exceeded: {e}")
        except APITimeoutError as e:
            logger.error(f"Request timeout: {e}")
            raise Exception(f"Request timeout: {e}")
        except APIConnectionError as e:
            logger.error(f"Connection error: {e}")
            raise Exception(f"Connection error: {e}")
        except APIStatusError as e:
            logger.error(f"API error {e.status_code}: {e.message}")
            raise Exception(f"API error: {e.message}")
        except APIError as e:
            logger.error(f"OpenAI API error: {e}")
            raise Exception(f"OpenAI API error: {e}")

    async def close(self):
        """Close the OpenAI client connection."""
        await self.client.close()


# Singleton instance
_openai_client: Optional[OpenAIClient] = None


def get_openai_client() -> OpenAIClient:
    """Get singleton OpenAI client instance.

    Returns:
        OpenAI client instance
    """
    global _openai_client
    if _openai_client is None:
        _openai_client = OpenAIClient()
    return _openai_client
