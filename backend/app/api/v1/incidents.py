import logging
from datetime import datetime, timedelta
from typing import Optional, List
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, Query
from app.core.database import get_database
from app.models.incident import IncidentCreate, IncidentUpdate
from app.services.ai_service import ai_service
from app.services.websocket_manager import manager
from app.core.security import get_current_user

router = APIRouter()
logger = logging.getLogger("resqnet")

@router.post("/report")
async def report_incident(payload: IncidentCreate, current_user: dict = Depends(get_current_user)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not available")

    # Run AI orchestrator
    ai_result = await ai_service.analyze_incident(payload.title, payload.description)

    incident_doc = {
        "title": payload.title,
        "description": payload.description,
        "incident_type": ai_result["incident_type"],
        "location": payload.location.dict(),
        "ai_summary": ai_result["summary"],
        "urgency": ai_result["urgency"],
        "people_affected": ai_result["people_affected"],
        "medical_severity": ai_result["medical_severity"],
        "vulnerability_score": ai_result["vulnerability_score"],
        "ai_confidence": ai_result["confidence"],
        "status": "reported",
        "assigned_resources": [],
        "explanation": ai_result["explanation"],
        "recommended_resources": ai_result["recommended_resources"],
        "broadcast_message": ai_result.get("broadcast_message"),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    result = await db.incidents.insert_one(incident_doc)
    incident_doc["_id"] = str(result.inserted_id)
    incident_doc["created_at"] = incident_doc["created_at"].isoformat()
    incident_doc["updated_at"] = incident_doc["updated_at"].isoformat()

    # Log Immutable Audit Log
    audit_doc = {
        "timestamp": datetime.utcnow(),
        "user_id": current_user.get("username"),
        "role": current_user.get("role"),
        "action": "REPORT_INCIDENT",
        "entity_id": incident_doc["_id"],
        "entity_type": "incident",
        "details": {"title": payload.title, "urgency": ai_result["urgency"]}
    }
    await db.audit_logs.insert_one(audit_doc)

    # Broadcast WebSocket update
    await manager.broadcast({
        "type": "INCIDENT_UPDATE",
        "action": "created",
        "data": incident_doc
    })

    return {
        "success": True,
        "message": "Incident reported and analyzed successfully",
        "data": incident_doc,
        "errors": []
    }

@router.get("/incidents")
async def get_incidents(
    status: Optional[str] = Query(None),
    urgency: Optional[str] = Query(None),
    incident_type: Optional[str] = Query(None)
):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database connection not available")

    query = {}
    if status:
        query["status"] = status
    if urgency:
        query["urgency"] = urgency
    if incident_type:
        query["incident_type"] = incident_type

    cursor = db.incidents.find(query).sort("created_at", -1)
    incidents = await cursor.to_list(length=400)
    
    # Format IDs
    for inc in incidents:
        inc["_id"] = str(inc["_id"])
        if "created_at" in inc and isinstance(inc["created_at"], datetime):
            inc["created_at"] = inc["created_at"].isoformat()
        if "updated_at" in inc and isinstance(inc["updated_at"], datetime):
            inc["updated_at"] = inc["updated_at"].isoformat()

    return {
        "success": True,
        "message": "Incidents fetched successfully",
        "data": incidents,
        "errors": []
    }

@router.get("/incidents/{incident_id}")
async def get_incident(incident_id: str):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    if not ObjectId.is_valid(incident_id):
        raise HTTPException(status_code=400, detail="Invalid incident ID")

    incident = await db.incidents.find_one({"_id": ObjectId(incident_id)})
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident["_id"] = str(incident["_id"])
    incident["created_at"] = incident["created_at"].isoformat()
    incident["updated_at"] = incident["updated_at"].isoformat()

    return {
        "success": True,
        "message": "Incident details fetched",
        "data": incident,
        "errors": []
    }

@router.patch("/incident/{incident_id}")
async def update_incident(incident_id: str, payload: IncidentUpdate, current_user: dict = Depends(get_current_user)):
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    if not ObjectId.is_valid(incident_id):
        raise HTTPException(status_code=400, detail="Invalid incident ID")

    update_dict = {k: v for k, v in payload.dict(exclude_unset=True).items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No update payload supplied")

    update_dict["updated_at"] = datetime.utcnow()

    # Log Immutable Audit Log
    audit_doc = {
        "timestamp": datetime.utcnow(),
        "user_id": current_user.get("username"),
        "role": current_user.get("role"),
        "action": "UPDATE_INCIDENT",
        "entity_id": incident_id,
        "entity_type": "incident",
        "details": update_dict
    }
    await db.audit_logs.insert_one(audit_doc)

    result = await db.incidents.update_one(
        {"_id": ObjectId(incident_id)},
        {"$set": update_dict}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Incident not found")

    updated_inc = await db.incidents.find_one({"_id": ObjectId(incident_id)})
    updated_inc["_id"] = str(updated_inc["_id"])
    updated_inc["created_at"] = updated_inc["created_at"].isoformat()
    updated_inc["updated_at"] = updated_inc["updated_at"].isoformat()

    # Broadcast websocket update
    await manager.broadcast({
        "type": "INCIDENT_UPDATE",
        "action": "updated",
        "data": updated_inc
    })

    return {
        "success": True,
        "message": "Incident updated successfully",
        "data": updated_inc,
        "errors": []
    }

@router.get("/dashboard")
async def get_dashboard_kpis():
    db = get_database()
    if db is None:
        return {"success": False, "message": "DB Unavailable", "data": {}, "errors": ["DB Connection offline"]}

    # Compute KPIs
    total_incidents = await db.incidents.count_documents({})
    critical_incidents = await db.incidents.count_documents({"urgency": "critical"})
    
    # Active responders = active/en_route/arrived dispatch history items
    active_responders = await db.dispatch_history.count_documents({"status": {"$in": ["en_route", "arrived"]}})
    
    # Available resources sum availability
    cursor = db.resources.find({})
    resources = await cursor.to_list(length=200)
    avail_count = sum(r.get("availability", 0) for r in resources)

    # Average response time (mocked based on actual coordinates/speeds or default 12.5 mins if dispatch history empty)
    completed_dispatches = await db.dispatch_history.find({"status": "completed"}).to_list(length=100)
    avg_response_time = 12.5
    if completed_dispatches:
        total_time = sum(d.get("eta_minutes", 12.5) for d in completed_dispatches)
        avg_response_time = round(total_time / len(completed_dispatches), 1)

    # Dispatch success rate: successfully completed dispatches vs total dispatches
    total_dispatches = await db.dispatch_history.count_documents({})
    success_rate = 100.0
    if total_dispatches > 0:
        successes = await db.dispatch_history.count_documents({"status": "completed"})
        success_rate = round((successes / total_dispatches) * 100.0, 1)

    return {
        "success": True,
        "message": "Dashboard KPIs calculated",
        "data": {
            "total_incidents": total_incidents,
            "critical_incidents": critical_incidents,
            "active_responders": active_responders,
            "resources_available": avail_count,
            "avg_response_time_min": avg_response_time,
            "dispatch_success_rate": success_rate
        },
        "errors": []
    }

@router.get("/analytics")
async def get_analytics_data():
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not available")

    # Incident trends (types distribution)
    pipeline_types = [
        {"$group": {"_id": "$incident_type", "count": {"$sum": 1}}}
    ]
    cursor_types = db.incidents.aggregate(pipeline_types)
    type_counts = await cursor_types.to_list(length=100)
    incident_trends = {item["_id"]: item["count"] for item in type_counts}

    # Resource Utilization / Burn Rate
    cursor_res = db.resources.find({})
    resources = await cursor_res.to_list(length=200)
    resource_burn = []
    for r in resources:
        total = r.get("quantity", 1)
        avail = r.get("availability", 1)
        used = total - avail
        resource_burn.append({
            "name": r.get("name"),
            "type": r.get("resource_type"),
            "used": used,
            "available": avail,
            "total": total,
            "burn_rate": round((used / total * 100.0) if total > 0 else 0, 1)
        })

    # Priority distribution
    urgency_levels = ["low", "medium", "high", "critical"]
    priority_dist = {}
    for level in urgency_levels:
        priority_dist[level] = await db.incidents.count_documents({"urgency": level})

    # Shelter utilization
    cursor_shelters = db.shelters.find({})
    shelters = await cursor_shelters.to_list(length=100)
    shelter_util = []
    for s in shelters:
        cap = s.get("capacity", 1) or 1
        occ = s.get("occupancy", 0)
        shelter_util.append({
            "name": s.get("name"),
            "occupancy": occ,
            "capacity": cap,
            "occupancy_rate": round((occ / cap) * 100.0, 1)
        })

    # Predict Next Hour Incidents (AI Predictive Forecast mock logic based on active counts)
    power_outages = await db.incidents.count_documents({"incident_type": "power_outage", "status": "active"})
    floods = await db.incidents.count_documents({"incident_type": "flood", "status": "active"})
    predicted_count = 1.0 + (0.5 * floods) + (0.3 * power_outages)

    return {
        "success": True,
        "message": "Analytics details compiled",
        "data": {
            "incident_trends": incident_trends,
            "resource_burn_rate": resource_burn,
            "priority_distribution": priority_dist,
            "shelter_utilization": shelter_util,
            "predictive_forecast_next_hour": round(predicted_count, 1)
        },
        "errors": []
    }
