from fastapi import APIRouter, Depends
from app.core.auth import get_current_user
from app.db.database import get_database  # Update if necessary

router = APIRouter()

@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    # Logic to get user profile
    return {"user": current_user}