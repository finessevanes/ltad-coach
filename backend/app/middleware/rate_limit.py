"""Rate limiting middleware for API endpoints."""

from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict, List
from fastapi import HTTPException, status


class RateLimiter:
    """In-memory rate limiter (MVP only - migrate to Redis for production).

    NOTE: This implementation is NOT suitable for multi-instance deployments.
    For production with multiple backend instances, migrate to Redis-based
    rate limiting using redis.incr() with TTL.
    """

    def __init__(self, max_requests: int = 50, window_hours: int = 1):
        """Initialize rate limiter.

        Args:
            max_requests: Maximum requests allowed in time window
            window_hours: Time window in hours
        """
        self.max_requests = max_requests
        self.window = timedelta(hours=window_hours)
        self.requests: Dict[str, List[datetime]] = defaultdict(list)

    def check_and_record(self, user_id: str) -> bool:
        """Check if request is allowed and record attempt.

        Args:
            user_id: User ID to check

        Returns:
            True if allowed (and recorded), False if rate limited
        """
        now = datetime.utcnow()
        cutoff = now - self.window

        # Remove entries older than time window
        self.requests[user_id] = [
            ts for ts in self.requests[user_id] if ts > cutoff
        ]

        # Check if limit reached
        if len(self.requests[user_id]) >= self.max_requests:
            return False

        # Record new attempt
        self.requests[user_id].append(now)
        return True

    def check_or_raise(self, user_id: str) -> None:
        """Check rate limit and raise HTTPException if exceeded.

        Args:
            user_id: User ID to check

        Raises:
            HTTPException: 429 if rate limit exceeded
        """
        if not self.check_and_record(user_id):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Maximum {self.max_requests} requests per {self.window.total_seconds() / 3600} hours.",
            )


# Global rate limiter instance for video analysis
# 50 uploads per hour per coach
analysis_rate_limiter = RateLimiter(max_requests=50, window_hours=1)
