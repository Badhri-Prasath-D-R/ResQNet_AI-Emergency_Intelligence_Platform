from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class AuditLogCreate(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None
    action: str
    entity_id: Optional[str] = None
    entity_type: Optional[str] = None
    details: Dict[str, Any] = {}

class AuditLogResponse(AuditLogCreate):
    id: str = Field(..., alias="_id")
    timestamp: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
