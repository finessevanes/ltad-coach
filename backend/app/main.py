from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.firebase import initialize_firebase
from app.core.errors import global_exception_handler
from app.core.logging_middleware import log_requests
from app.api import auth, athletes, consent, assessments, benchmarks
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Coach API",
    description="Computer Vision Athletic Assessment Platform",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Logging Middleware
app.middleware("http")(log_requests)

# Global Exception Handler
app.add_exception_handler(Exception, global_exception_handler)

# Include API routers
app.include_router(auth.router)
app.include_router(athletes.router)
app.include_router(consent.router)
app.include_router(assessments.router)
app.include_router(benchmarks.router)


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    try:
        initialize_firebase()
        logger.info("✓ Firebase Admin SDK initialized")
        logger.info(f"✓ Environment: {settings.environment}")
        logger.info(f"✓ CORS Origins: {settings.cors_origins_list}")
    except Exception as e:
        logger.error(f"✗ Firebase initialization failed: {e}")
        raise


@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring and deployment verification
    """
    from datetime import datetime
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": settings.environment,
        "version": "1.0.0"
    }


@app.get("/")
async def root():
    """
    Root endpoint - API information
    """
    return {
        "message": "LTAD Coach API",
        "docs": "/docs",
        "health": "/health"
    }
