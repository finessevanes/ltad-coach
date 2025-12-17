"""Feature flags router."""

from fastapi import APIRouter, Depends
from app.config import Settings, get_settings

router = APIRouter(prefix="/feature-flags", tags=["feature-flags"])


@router.get("")
async def get_feature_flags(
    settings: Settings = Depends(get_settings)
) -> dict[str, bool]:
    """
    Get all feature flags.

    Returns:
        Dictionary of feature flag names and their enabled status
    """
    return settings.feature_flags
