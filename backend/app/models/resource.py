from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.common import GeoJSONPoint

class ResourceBase(BaseModel):
    resource_type: str = Field(..., description="ambulance, fire_truck, rescue_boat, helicopter, generator, food, water, volunteer")
    name: str
    quantity: int
    availability: int
    location: GeoJSONPoint
    deployment_status: str = "idle"
    cost_per_unit: float = 100.0

class ResourceCreate(ResourceBase):
    pass

class ResourceUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[int] = None
    availability: Optional[int] = None
    location: Optional[GeoJSONPoint] = None
    deployment_status: Optional[str] = None
    cost_per_unit: Optional[float] = None

class ResourceResponse(ResourceBase):
    id: str = Field(..., alias="_id")
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
