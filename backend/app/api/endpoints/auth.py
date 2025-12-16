from fastapi import APIRouter, Depends
from app.core.auth import get_current_user
from app.db.database import get_database

router = APIRouter()

@router.get("/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user

@router.post("/verify-token")
async def verify_token(current_user: dict = Depends(get_current_user)):
    return {"message": "Token is valid", "user": current_user}

@router.get("/user-info")
async def get_user_info(current_user: dict = Depends(get_current_user)):
    return {
        "user_id": current_user.get("sub"),
        "email": current_user.get("email"),
        "name": current_user.get("name"),
        "image": current_user.get("image")
    }