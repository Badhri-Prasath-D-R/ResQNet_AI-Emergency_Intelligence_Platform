from datetime import datetime
from typing import Optional
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends
from app.core.database import get_database
from app.models.resource import ResourceUpdate
from app.core.security import get_current_user

router = APIRouter()

@router.get("/resources")
async def get_resources(resource_type: Optional[str] = None):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    query = {}
    if resource_type:
        query["resource_type"] = resource_type

    cursor = db.resources.find(query)
    resources = await cursor.to_list(length=300)

    for res in resources:
        res["_id"] = str(res["_id"])
        if "created_at" in res and isinstance(res["created_at"], datetime):
            res["created_at"] = res["created_at"].isoformat()
        if "updated_at" in res and isinstance(res["updated_at"], datetime):
            res["updated_at"] = res["updated_at"].isoformat()

    return {
        "success": True,
        "message": "Resources fetched successfully",
        "data": resources,
        "errors": []
    }

@router.patch("/resource/{resource_id}")
async def update_resource(resource_id: str, payload: ResourceUpdate, current_user: dict = Depends(get_current_user)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    if not ObjectId.is_valid(resource_id):
        raise HTTPException(status_code=400, detail="Invalid resource ID")

    update_dict = {k: v for k, v in payload.dict(exclude_unset=True).items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No updates provided")

    update_dict["updated_at"] = datetime.utcnow()

    # Log Immutable Audit Log
    audit_doc = {
        "timestamp": datetime.utcnow(),
        "user_id": current_user.get("username"),
        "role": current_user.get("role"),
        "action": "UPDATE_RESOURCE",
        "entity_id": resource_id,
        "entity_type": "resource",
        "details": update_dict
    }
    await db.audit_logs.insert_one(audit_doc)

    result = await db.resources.update_one(
        {"_id": ObjectId(resource_id)},
        {"$set": update_dict}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Resource not found")

    updated_res = await db.resources.find_one({"_id": ObjectId(resource_id)})
    updated_res["_id"] = str(updated_res["_id"])
    updated_res["created_at"] = updated_res["created_at"].isoformat()
    updated_res["updated_at"] = updated_res["updated_at"].isoformat()

    return {
        "success": True,
        "message": "Resource updated successfully",
        "data": updated_res,
        "errors": []
    }
