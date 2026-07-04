from pydantic import BaseModel, Field
from typing import List, Literal

class GeoJSONPoint(BaseModel):
    type: Literal["Point"] = "Point"
    coordinates: List[float] = Field(
        ..., 
        description="Coordinates in longitude, latitude format: [longitude, latitude]",
        min_items=2,
        max_items=2
    )

class GeoJSONLineString(BaseModel):
    type: Literal["LineString"] = "LineString"
    coordinates: List[List[float]] = Field(..., description="Array of longitude, latitude coordinates")
