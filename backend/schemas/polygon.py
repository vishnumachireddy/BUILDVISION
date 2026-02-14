from pydantic import BaseModel, Field, field_validator
from typing import List, Tuple

class PolygonRequest(BaseModel):
    coordinates: List[List[float]] = Field(..., description="List of [lat, lng] pairs")
    floors: int = Field(1, ge=1, le=10, description="Number of floors (1-10)")

    @field_validator('coordinates')
    def check_min_points(cls, v):
        if len(v) < 3:
            raise ValueError('Polygon must have at least 3 points')
        return v

class AreaResponse(BaseModel):
    area_sqm: float
    area_sqft: float
    perimeter_m: float
    perimeter_ft: float
    buildable_area_sqft: float
    status: str = "success"
    warnings: List[str] = []
