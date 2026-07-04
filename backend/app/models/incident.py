from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.common import GeoJSONPoint

class AssignedResourceSchema(BaseModel):
    resource_id: str
    resource_type: str
    quantity: int

class IncidentBase(BaseModel):
    title: str
    description: str
    incident_type: str = Field(..., description="Type of disaster")
    location: GeoJSONPoint

class IncidentCreate(IncidentBase):
    pass

class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    urgency: Optional[str] = None
    people_affected: Optional[int] = None
    medical_severity: Optional[int] = None
    vulnerability_score: Optional[int] = None
    assigned_resources: Optional[List[AssignedResourceSchema]] = None

class IncidentResponse(IncidentBase):
    id: str = Field(..., alias="_id")
    ai_summary: Optional[str] = None
    urgency: str = "medium"
    people_affected: int = 0
    medical_severity: int = 0
    vulnerability_score: int = 0
    ai_confidence: float = 0.0
    status: str = "reported"
    assigned_resources: List[AssignedResourceSchema] = []
    explanation: Optional[str] = None
    recommended_resources: Optional[List[Dict[str, Any]]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
