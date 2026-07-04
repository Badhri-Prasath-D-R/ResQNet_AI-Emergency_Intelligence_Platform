from datetime import timedelta
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from app.core.database import get_database
from app.core.security import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter()

FALLBACK_USERS = {
    "admin": {"password": "admin123", "role": "Administrator"},
    "dispatcher": {"password": "dispatcher123", "role": "Emergency Dispatcher"},
}

class UserRegister(BaseModel):
    username: str
    password: str
    role: str = Field(default="Viewer", description="Administrator, Emergency Dispatcher, Field Responder, Viewer")

class UserLogin(BaseModel):
    username: str
    password: str

@router.post("/register")
async def register(user_data: UserRegister):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not available")

    # Validate roles
    allowed_roles = ["Administrator", "Emergency Dispatcher", "Field Responder", "Viewer"]
    if user_data.role not in allowed_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Allowed: {allowed_roles}")

    # Check if user exists
    existing_user = await db.users.find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed_pw = get_password_hash(user_data.password)
    user_doc = {
        "username": user_data.username,
        "hashed_password": hashed_pw,
        "role": user_data.role
    }
    
    await db.users.insert_one(user_doc)
    return {
        "success": True,
        "message": "User registered successfully",
        "data": {"username": user_data.username, "role": user_data.role},
        "errors": []
    }

@router.post("/login")
async def login(user_data: UserLogin):
    db = get_database()
    if db is None:
        fallback_user = FALLBACK_USERS.get(user_data.username)
        if not fallback_user or fallback_user["password"] != user_data.password:
            raise HTTPException(status_code=401, detail="Invalid username or password")

        access_token = create_access_token(
            data={"username": user_data.username, "role": fallback_user["role"]}
        )
        return {
            "success": True,
            "message": "Login successful",
            "data": {
                "token": access_token,
                "username": user_data.username,
                "role": fallback_user["role"]
            },
            "errors": []
        }

    user = await db.users.find_one({"username": user_data.username})
    if not user or not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    access_token = create_access_token(
        data={"username": user["username"], "role": user["role"]}
    )

    return {
        "success": True,
        "message": "Login successful",
        "data": {
            "token": access_token,
            "username": user["username"],
            "role": user["role"]
        },
        "errors": []
    }

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "success": True,
        "message": "User profile fetched",
        "data": {
            "username": current_user.get("username"),
            "role": current_user.get("role")
        },
        "errors": []
    }
