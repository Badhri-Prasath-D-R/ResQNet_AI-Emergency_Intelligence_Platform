from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from app.core.database import get_database
from app.core.security import get_current_user

router = APIRouter()

class AIConfigSchema(BaseModel):
    use_cloud_ai: bool = Field(default=False)
    cloud_ai_base_url: str = Field(default="https://openrouter.ai/api/v1")
    cloud_ai_api_key: Optional[str] = Field(default="")
    cloud_ai_model_name: str = Field(default="google/gemini-2.5-flash")

@router.get("/settings/ai")
async def get_ai_settings(current_user: dict = Depends(get_current_user)):
    db = get_database()
    config = await db.settings.find_one({"_id": "ai_config"})
    if not config:
        return {
            "success": True,
            "data": {
                "use_cloud_ai": False,
                "cloud_ai_base_url": "https://openrouter.ai/api/v1",
                "cloud_ai_api_key": "",
                "cloud_ai_model_name": "google/gemini-2.5-flash"
            }
        }
    
    # Mask api key for safety
    key = config.get("cloud_ai_api_key", "")
    masked_key = ""
    if key:
        masked_key = key[:4] + "*" * (len(key) - 8) + key[-4:] if len(key) > 8 else "****"

    return {
        "success": True,
        "data": {
            "use_cloud_ai": config.get("use_cloud_ai", False),
            "cloud_ai_base_url": config.get("cloud_ai_base_url", "https://openrouter.ai/api/v1"),
            "cloud_ai_api_key": masked_key,
            "cloud_ai_model_name": config.get("cloud_ai_model_name", "google/gemini-2.5-flash")
        }
    }

@router.post("/settings/ai")
async def update_ai_settings(payload: AIConfigSchema, current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    update_data = {
        "use_cloud_ai": payload.use_cloud_ai,
        "cloud_ai_base_url": payload.cloud_ai_base_url,
        "cloud_ai_model_name": payload.cloud_ai_model_name
    }
    
    # Only update the api key if it is not empty/masked
    if payload.cloud_ai_api_key and not payload.cloud_ai_api_key.startswith("****") and "*" not in payload.cloud_ai_api_key:
        update_data["cloud_ai_api_key"] = payload.cloud_ai_api_key

    await db.settings.update_one(
        {"_id": "ai_config"},
        {"$set": update_data},
        upsert=True
    )
    
    return {
        "success": True,
        "message": "AI settings successfully updated"
    }
