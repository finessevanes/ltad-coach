"""Anthropic API client for Claude model access.

This client handles communication with Claude models via the Anthropic API,
with support for prompt caching to reduce costs by ~90%.
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
    """Client for Anthropic API with native prompt caching support."""

    def __init__(self):
        """Initialize Anthropic client with API credentials."""
        settings = get_settings()
        self.client = AsyncAnthropic(
            api_key=settings.anthropic_api_key,
            timeout=30.0
        )
        self.cache_hits = 0
        self.cache_misses = 0

    async def chat(
        self,
        model: str,
        messages: List[Dict[str, Any]],
        system: Optional[str] = None,
        cache_control: bool = False,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> str:
        """Send chat completion request to Anthropic API.

        Args:
            model: Model ID (e.g., "claude-3-5-sonnet-20241022")
            messages: List of message dicts with "role" and "content"
            system: Optional system prompt (will be cached if cache_control=True)
            cache_control: Whether to enable prompt caching for system message
            temperature: Sampling temperature (0-1)
            max_tokens: Maximum tokens to generate

        Returns:
            Generated text response

        Raises:
            Exception: If API call fails
        """
        # Build system parameter with cache control
        # CRITICAL: system is a separate parameter, NOT in messages array
        system_param = None
        if system:
            if cache_control:
                # Cache control requires array of content blocks
                system_param = [
                    {
                        "type": "text",
                        "text": system,
                        "cache_control": {"type": "ephemeral"}
                    }
                ]
            else:
                # Without caching, can use string or array
                system_param = system

        try:
            # Call Anthropic API
            response = await self.client.messages.create(
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_param,
                messages=messages,
            )

            # Track cache statistics
            usage = response.usage
            if usage.cache_read_input_tokens > 0:
                self.cache_hits += 1
                logger.info(f"Cache hit! Read {usage.cache_read_input_tokens} cached tokens")
            elif cache_control:
                self.cache_misses += 1
                logger.info(f"Cache miss - created {usage.cache_creation_input_tokens} cached tokens")

            # Log token usage
            logger.debug(
                f"Token usage - Input: {usage.input_tokens}, "
                f"Output: {usage.output_tokens}, "
                f"Cache Read: {usage.cache_read_input_tokens}, "
                f"Cache Created: {usage.cache_creation_input_tokens}"
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

    def get_cache_stats(self) -> Dict[str, int]:
        """Get cache hit/miss statistics.

        Returns:
            Dict with cache_hits and cache_misses counts
        """
        return {
            "cache_hits": self.cache_hits,
            "cache_misses": self.cache_misses,
        }


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
