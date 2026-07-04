from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.common import GeoJSONPoint

class ShelterBase(BaseModel):
    name: str
    location: GeoJSONPoint
    capacity: int
    occupancy: int
    available_beds: int

class ShelterCreate(ShelterBase):
    pass

class ShelterUpdate(BaseModel):
    name: Optional[str] = None
    capacity: Optional[int] = None
    occupancy: Optional[int] = None
    available_beds: Optional[int] = None
    location: Optional[GeoJSONPoint] = None

class ShelterResponse(ShelterBase):
    id: str = Field(..., alias="_id")
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
