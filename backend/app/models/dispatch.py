from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.common import GeoJSONLineString

class AuditTrailSchema(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    action: str
    user: str

class DispatchCreate(BaseModel):
    incident_id: str
    resource_id: str
    resource_type: str
    quantity: int
    responder_name: str
    route: Optional[GeoJSONLineString] = None
    eta_minutes: float = 15.0

class DispatchResponse(BaseModel):
    id: str = Field(..., alias="_id")
    incident_id: str
    resource_id: str
    resource_type: str
    quantity: int
    responder_name: str
    route: Optional[GeoJSONLineString] = None
    eta_minutes: float
    dispatched_at: datetime
    arrived_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    status: str = "en_route"
    audit_trail: List[AuditTrailSchema] = []

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
class DispatchStatusUpdate(BaseModel):
    status: str
    user: str
