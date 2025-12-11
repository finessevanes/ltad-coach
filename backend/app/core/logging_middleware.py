from fastapi import Request
import time
import logging

logger = logging.getLogger(__name__)


async def log_requests(request: Request, call_next):
    """Log all API requests"""
    start_time = time.time()

    response = await call_next(request)

    duration = time.time() - start_time

    logger.info(
        f"{request.method} {request.url.path} "
        f"- {response.status_code} - {duration:.3f}s"
    )

    return response
