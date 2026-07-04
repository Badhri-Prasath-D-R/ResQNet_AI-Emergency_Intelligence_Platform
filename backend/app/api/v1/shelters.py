from datetime import datetime
from fastapi import APIRouter, HTTPException
from app.core.database import get_database

router = APIRouter()

@router.get("/shelters")
async def get_shelters():
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    cursor = db.shelters.find({})
    shelters = await cursor.to_list(length=100)

    for s in shelters:
        s["_id"] = str(s["_id"])
        if "created_at" in s and isinstance(s["created_at"], datetime):
            s["created_at"] = s["created_at"].isoformat()
        if "updated_at" in s and isinstance(s["updated_at"], datetime):
            s["updated_at"] = s["updated_at"].isoformat()

    return {
        "success": True,
        "message": "Shelters fetched successfully",
        "data": shelters,
        "errors": []
    }

@router.get("/stations")
async def get_stations():
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    cursor = db.stations.find({})
    stations = await cursor.to_list(length=100)

    for st in stations:
        st["_id"] = str(st["_id"])
        if "created_at" in st and isinstance(st["created_at"], datetime):
            st["created_at"] = st["created_at"].isoformat()
        if "updated_at" in st and isinstance(st["updated_at"], datetime):
            st["updated_at"] = st["updated_at"].isoformat()

    return {
        "success": True,
        "message": "Stations fetched successfully",
        "data": stations,
        "errors": []
    }
