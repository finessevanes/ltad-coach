"""OpenRouter API client for Claude model access.

This client handles communication with Claude models via OpenRouter,
with support for prompt caching to reduce costs by ~90%.
"""

import logging
from typing import List, Dict, Optional, Any
import aiohttp
from app.config import get_settings

logger = logging.getLogger(__name__)


class OpenRouterClient:
    """Client for OpenRouter API with cache control support."""

    def __init__(self):
        """Initialize OpenRouter client with API credentials."""
        settings = get_settings()
        self.api_key = settings.openrouter_api_key
        self.base_url = settings.openrouter_base_url
        self.session: Optional[aiohttp.ClientSession] = None
        self.cache_hits = 0
        self.cache_misses = 0

    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create aiohttp session.

        Returns:
            Active aiohttp session
        """
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession()
        return self.session

    async def close(self):
        """Close the aiohttp session."""
        if self.session and not self.session.closed:
            await self.session.close()

    async def chat(
        self,
        model: str,
        messages: List[Dict[str, Any]],
        system: Optional[str] = None,
        cache_control: bool = False,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> str:
        """Send chat completion request to OpenRouter.

        Args:
            model: Model ID (e.g., "anthropic/claude-3-5-sonnet-20241022")
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
        session = await self._get_session()

        # Build request payload
        payload: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        # Add system message with optional cache control
        if system:
            if cache_control:
                # Use cache control for system prompt (Anthropic format)
                payload["messages"] = [
                    {
                        "role": "system",
                        "content": [
                            {
                                "type": "text",
                                "text": system,
                                "cache_control": {"type": "ephemeral"}
                            }
                        ]
                    },
                    *messages
                ]
            else:
                # Simple system message without caching
                payload["messages"] = [
                    {"role": "system", "content": system},
                    *messages
                ]

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        try:
            async with session.post(
                f"{self.base_url}/chat/completions",
                json=payload,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                response.raise_for_status()
                data = await response.json()

                # Track cache hits/misses if available
                usage = data.get("usage", {})
                if "cache_read_input_tokens" in usage and usage["cache_read_input_tokens"] > 0:
                    self.cache_hits += 1
                    logger.info(f"Cache hit! Read {usage['cache_read_input_tokens']} cached tokens")
                elif cache_control:
                    self.cache_misses += 1
                    logger.info("Cache miss - system prompt cached for future requests")

                # Extract response content
                content = data["choices"][0]["message"]["content"]

                # Log token usage
                if usage:
                    logger.debug(
                        f"Token usage - Input: {usage.get('prompt_tokens', 0)}, "
                        f"Output: {usage.get('completion_tokens', 0)}, "
                        f"Cached: {usage.get('cache_read_input_tokens', 0)}"
                    )

                return content

        except aiohttp.ClientError as e:
            logger.error(f"OpenRouter API error: {e}")
            raise Exception(f"Failed to communicate with OpenRouter: {e}")
        except KeyError as e:
            logger.error(f"Unexpected response format from OpenRouter: {e}")
            raise Exception(f"Invalid response from OpenRouter: {e}")

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
_openrouter_client: Optional[OpenRouterClient] = None


def get_openrouter_client() -> OpenRouterClient:
    """Get singleton OpenRouter client instance.

    Returns:
        OpenRouter client instance
    """
    global _openrouter_client
    if _openrouter_client is None:
        _openrouter_client = OpenRouterClient()
    return _openrouter_client
