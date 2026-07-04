from pydantic import BaseModel, Field
from datetime import datetime
from app.models.common import GeoJSONPoint

class StationBase(BaseModel):
    name: str
    station_type: str = Field(..., description="fire_station, hospital, police_station, volunteer_center")
    location: GeoJSONPoint

class StationCreate(StationBase):
    pass

class StationResponse(StationBase):
    id: str = Field(..., alias="_id")
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
