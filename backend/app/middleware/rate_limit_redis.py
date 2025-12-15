"""Redis-based rate limiting middleware for multi-instance deployments.

This module provides a Redis-backed rate limiter suitable for production
deployments with multiple backend instances.

Usage:
    import os
    from app.middleware.rate_limit_redis import RedisRateLimiter

    redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    rate_limiter = RedisRateLimiter(redis_url, max_requests=50, window_hours=1)

    # In your route:
    @app.post('/assessments/analyze')
    async def analyze_video(data, current_user):
        await rate_limiter.check_or_raise_async(current_user.id)
        # ... handle request
"""

import logging
from typing import Optional

from fastapi import HTTPException, status
import redis.asyncio as redis

logger = logging.getLogger(__name__)


class RedisRateLimiter:
    """Redis-based rate limiter for distributed systems.

    Stores rate limit counters in Redis with automatic expiration (TTL).
    Suitable for multi-instance deployments.

    Args:
        redis_url: Redis connection URL (e.g., 'redis://localhost:6379/0')
        max_requests: Maximum requests allowed in time window
        window_hours: Time window in hours
    """

    def __init__(
        self,
        redis_url: str = 'redis://localhost:6379/0',
        max_requests: int = 50,
        window_hours: int = 1,
    ):
        self.redis_url = redis_url
        self.max_requests = max_requests
        self.window_seconds = window_hours * 3600
        self.redis_client: Optional[redis.Redis] = None

    async def _get_client(self) -> redis.Redis:
        """Get or create Redis client."""
        if self.redis_client is None:
            self.redis_client = await redis.from_url(
                self.redis_url,
                encoding='utf8',
                decode_responses=True,
            )
        return self.redis_client

    async def close(self) -> None:
        """Close Redis connection."""
        if self.redis_client:
            await self.redis_client.close()

    async def check_and_record_async(self, user_id: str) -> bool:
        """Check if request is allowed and record attempt (async).

        Args:
            user_id: User ID to check

        Returns:
            True if allowed (and recorded), False if rate limited
        """
        client = await self._get_client()
        key = f'rate_limit:{user_id}'

        try:
            # Increment counter
            current = await client.incr(key)

            # Set expiry on first request
            if current == 1:
                await client.expire(key, self.window_seconds)

            # Check if over limit
            if current > self.max_requests:
                return False

            return True

        except redis.RedisError as err:
            logger.error('Redis rate limit check failed: %s', err)
            # Fail open: allow request if Redis is down
            # In production, you might want to fail closed instead
            return True

    async def check_or_raise_async(self, user_id: str) -> None:
        """Check rate limit and raise HTTPException if exceeded (async).

        Args:
            user_id: User ID to check

        Raises:
            HTTPException: 429 if rate limit exceeded
        """
        if not await self.check_and_record_async(user_id):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    f'Rate limit exceeded. Maximum {self.max_requests} requests '
                    f'per {self.window_seconds // 3600} hour(s).'
                ),
            )

    def check_and_record_sync(self, user_id: str) -> bool:
        """Synchronous version of check_and_record_async.

        Note: This method will block the event loop. Use the async version
        in FastAPI route handlers.

        Args:
            user_id: User ID to check

        Returns:
            True if allowed (and recorded), False if rate limited
        """
        if self.redis_client is None:
            raise RuntimeError(
                'Async initialization required. Use check_and_record_async() instead.'
            )

        key = f'rate_limit:{user_id}'

        try:
            current = self.redis_client.incr(key)

            if current == 1:
                self.redis_client.expire(key, self.window_seconds)

            if current > self.max_requests:
                return False

            return True

        except redis.RedisError as err:
            logger.error('Redis rate limit check failed: %s', err)
            # Fail open
            return True

    def check_or_raise_sync(self, user_id: str) -> None:
        """Synchronous version of check_or_raise_async.

        Note: This method will block the event loop. Use the async version
        in FastAPI route handlers.

        Args:
            user_id: User ID to check

        Raises:
            HTTPException: 429 if rate limit exceeded
        """
        if not self.check_and_record_sync(user_id):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    f'Rate limit exceeded. Maximum {self.max_requests} requests '
                    f'per {self.window_seconds // 3600} hour(s).'
                ),
            )


# Production configuration
# Usage:
#   import os
#   redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
#   redis_rate_limiter = RedisRateLimiter(redis_url, max_requests=50, window_hours=1)
#
# In your route:
#   @app.post('/assessments/analyze')
#   async def analyze_video(data, current_user):
#       await redis_rate_limiter.check_or_raise_async(current_user.id)
#       # ... handle request
