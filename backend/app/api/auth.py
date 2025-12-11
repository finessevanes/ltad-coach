from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user
from app.services.database import db, Collections
from app.models.user import User, UserResponse
from pydantic import BaseModel

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class TokenRequest(BaseModel):
    token: str


@router.post("/token")
async def validate_token(request: TokenRequest):
    """
    Validate Firebase token and create/get user

    This endpoint is called after Firebase Client SDK authentication.
    It ensures a user document exists in Firestore.
    """
    from firebase_admin import auth
    from app.core.firebase import get_firebase_app

    try:
        get_firebase_app()
        decoded = auth.verify_id_token(request.token)

        uid = decoded["uid"]
        email = decoded.get("email", "")

        # Check if user exists
        user_data = db.get(Collections.USERS, uid)

        if not user_data:
            # Create new user document
            user_data = {
                "email": email,
                "name": decoded.get("name", email.split("@")[0]),
                "athleteCount": 0
            }
            db.create(Collections.USERS, user_data, doc_id=uid)
            user_data["id"] = uid

        return {
            "user": UserResponse(**user_data),
            "token": request.token
        }

    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    """Get current authenticated user info"""
    user_data = db.get(Collections.USERS, user["uid"])

    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")

    return UserResponse(**user_data)


@router.post("/logout")
async def logout():
    """Logout (stateless - no server action needed)"""
    return {"message": "Logged out successfully"}
