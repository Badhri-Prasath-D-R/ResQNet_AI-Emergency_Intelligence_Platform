from datetime import datetime
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends
from app.core.database import get_database
from app.models.dispatch import DispatchCreate
from app.services.websocket_manager import manager
from app.core.security import get_current_user

router = APIRouter()

@router.post("/dispatch")
async def dispatch_resource(payload: DispatchCreate, current_user: dict = Depends(get_current_user)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    # Verify incident
    if not ObjectId.is_valid(payload.incident_id):
        raise HTTPException(status_code=400, detail="Invalid incident ID")
    incident = await db.incidents.find_one({"_id": ObjectId(payload.incident_id)})
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    # Verify resource availability
    if not ObjectId.is_valid(payload.resource_id):
        raise HTTPException(status_code=400, detail="Invalid resource ID")
    resource = await db.resources.find_one({"_id": ObjectId(payload.resource_id)})
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    if resource.get("availability", 0) < payload.quantity:
        raise HTTPException(
            status_code=400, 
            detail=f"Insufficient resource inventory. Requested: {payload.quantity}, Available: {resource.get('availability', 0)}"
        )

    now = datetime.utcnow()

    # Deduct resource inventory and update status
    await db.resources.update_one(
        {"_id": ObjectId(payload.resource_id)},
        {
            "$inc": {"availability": -payload.quantity},
            "$set": {
                "deployment_status": "deployed",
                "updated_at": now
            }
        }
    )

    # Determine simulated route (simple route from resource position to incident position)
    res_coords = resource["location"]["coordinates"]
    inc_coords = incident["location"]["coordinates"]
    route_geom = {
        "type": "LineString",
        "coordinates": [res_coords, inc_coords]
    }

    # Insert dispatch history record
    dispatch_doc = {
        "incident_id": payload.incident_id,
        "resource_id": payload.resource_id,
        "resource_type": payload.resource_type,
        "quantity": payload.quantity,
        "responder_name": payload.responder_name,
        "route": route_geom,
        "eta_minutes": payload.eta_minutes,
        "dispatched_at": now,
        "arrived_at": None,
        "completed_at": None,
        "status": "en_route",
        "audit_trail": [
            {
                "timestamp": now,
                "action": f"Dispatched {payload.quantity}x {payload.resource_type} to incident site.",
                "user": current_user.get("username", "Dispatcher")
            }
        ]
    }

    res_dispatch = await db.dispatch_history.insert_one(dispatch_doc)
    dispatch_doc["_id"] = str(res_dispatch.inserted_id)
    dispatch_doc["dispatched_at"] = dispatch_doc["dispatched_at"].isoformat()
    for trail in dispatch_doc["audit_trail"]:
        trail["timestamp"] = trail["timestamp"].isoformat()

    # Update incident with assigned resource details & mark status as active or dispatching
    assigned_item = {
        "resource_id": payload.resource_id,
        "resource_type": payload.resource_type,
        "quantity": payload.quantity
    }
    await db.incidents.update_one(
        {"_id": ObjectId(payload.incident_id)},
        {
            "$push": {"assigned_resources": assigned_item},
            "$set": {
                "status": "dispatching",
                "updated_at": now
            }
        }
    )

    # Log Immutable Legal Audit Log
    audit_doc = {
        "timestamp": now,
        "user_id": current_user.get("username"),
        "role": current_user.get("role"),
        "action": "DISPATCH_RESOURCE",
        "entity_id": dispatch_doc["_id"],
        "entity_type": "dispatch",
        "details": {
            "incident_id": payload.incident_id,
            "resource_id": payload.resource_id,
            "quantity": payload.quantity,
            "responder": payload.responder_name
        }
    }
    await db.audit_logs.insert_one(audit_doc)

    # Fetch updated incident for websocket broadcast
    updated_inc = await db.incidents.find_one({"_id": ObjectId(payload.incident_id)})
    updated_inc["_id"] = str(updated_inc["_id"])
    updated_inc["created_at"] = updated_inc["created_at"].isoformat()
    updated_inc["updated_at"] = updated_inc["updated_at"].isoformat()

    # Broadcast updates to WebSockets
    await manager.broadcast({
        "type": "INCIDENT_UPDATE",
        "action": "updated",
        "data": updated_inc
    })
    await manager.broadcast({
        "type": "RESOURCE_UPDATE",
        "action": "dispatched",
        "data": {
            "resource_id": payload.resource_id,
            "availability": resource.get("availability", 0) - payload.quantity
        }
    })

    return {
        "success": True,
        "message": "Resource dispatched successfully",
        "data": dispatch_doc,
        "errors": []
    }

@router.get("/dispatch/history")
async def get_dispatch_history():
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    cursor = db.dispatch_history.find({}).sort("dispatched_at", -1)
    history = await cursor.to_list(length=300)

    for item in history:
        item["_id"] = str(item["_id"])
        item["dispatched_at"] = item["dispatched_at"].isoformat()
        if item.get("arrived_at"):
            item["arrived_at"] = item["arrived_at"].isoformat()
        if item.get("completed_at"):
            item["completed_at"] = item["completed_at"].isoformat()
        for trail in item.get("audit_trail", []):
            if "timestamp" in trail:
                trail["timestamp"] = trail["timestamp"].isoformat()

    return {
        "success": True,
        "message": "Dispatch history fetched",
        "data": history,
        "errors": []
    }
