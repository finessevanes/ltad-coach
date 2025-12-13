"""Anthropic API client for Claude model access.

This client handles communication with Claude models via the Anthropic API.
"""

import logging
from typing import List, Dict, Optional, Any
from anthropic import AsyncAnthropic
from anthropic import (
    APIError,
    APIConnectionError,
    APIStatusError,
    APITimeoutError,
    RateLimitError,
)
from app.config import get_settings

logger = logging.getLogger(__name__)


class AnthropicClient:
    """Client for Anthropic API."""

    def __init__(self):
        """Initialize Anthropic client with API credentials."""
        settings = get_settings()
        self.client = AsyncAnthropic(
            api_key=settings.anthropic_api_key,
            timeout=30.0
        )

    async def chat(
        self,
        model: str,
        messages: List[Dict[str, Any]],
        system: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> str:
        """Send chat completion request to Anthropic API.

        Args:
            model: Model ID (e.g., "claude-3-5-sonnet-20241022")
            messages: List of message dicts with "role" and "content"
            system: Optional system prompt
            temperature: Sampling temperature (0-1)
            max_tokens: Maximum tokens to generate

        Returns:
            Generated text response

        Raises:
            Exception: If API call fails
        """
        # Build system parameter
        # CRITICAL: system is a separate parameter, NOT in messages array
        # As of SDK 0.75.0, system must be a list of text blocks
        if system:
            system_param = [{"type": "text", "text": system}]
        else:
            system_param = None

        try:
            # Call Anthropic API
            # Only include system parameter if provided
            kwargs = {
                "model": model,
                "max_tokens": max_tokens,
                "temperature": temperature,
                "messages": messages,
            }
            if system_param is not None:
                kwargs["system"] = system_param

            response = await self.client.messages.create(**kwargs)

            # Log token usage
            usage = response.usage
            logger.debug(
                f"Token usage - Input: {usage.input_tokens}, "
                f"Output: {usage.output_tokens}"
            )

            # Extract text content from response
            return response.content[0].text

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
            logger.error(f"Anthropic API error: {e}")
            raise Exception(f"Anthropic API error: {e}")

    async def close(self):
        """Close the Anthropic client connection."""
        await self.client.close()


# Singleton instance
_anthropic_client: Optional[AnthropicClient] = None


def get_anthropic_client() -> AnthropicClient:
    """Get singleton Anthropic client instance.

    Returns:
        Anthropic client instance
    """
    global _anthropic_client
    if _anthropic_client is None:
        _anthropic_client = AnthropicClient()
    return _anthropic_client
