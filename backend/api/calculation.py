from typing import Dict, List
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from schemas.polygon import PolygonRequest, AreaResponse
from services.geometry import calculate_polygon_area, calculate_perimeter, validate_polygon
from services.rates import update_district_rate

router = APIRouter()

@router.post("/calculate-area", response_model=AreaResponse)
def get_area(request: PolygonRequest):
    coords = request.coordinates
    
    # Calculate raw metrics
    area_sqm = calculate_polygon_area(coords)
    perimeter_m = calculate_perimeter(coords)
    
    # Conversions
    area_sqft = area_sqm * 10.7639
    perimeter_ft = perimeter_m * 3.28084
    
    # Validation & Logic
    warnings = validate_polygon(area_sqft, perimeter_ft)
    
    # Buildable Area Logic (Simple Setback)
    # Small (<1000): 10%, Medium (1000-3000): 15%, Large (>3000): 20%
    setback_ratio = 0.10
    if area_sqft > 3000:
        setback_ratio = 0.20
    elif area_sqft > 1000:
        setback_ratio = 0.15
        
    buildable_area = area_sqft * (1 - setback_ratio)
    
    return AreaResponse(
        area_sqm=round(area_sqm, 2),
        area_sqft=round(area_sqft, 2),
        perimeter_m=round(perimeter_m, 2),
        perimeter_ft=round(perimeter_ft, 2),
        buildable_area_sqft=round(buildable_area, 2),
        warnings=warnings
    )

class RateUpdateRequest(BaseModel):
    state: str
    district: str
    rates: Dict[str, float]

@router.post("/update-material-rate")
def update_rate(request: RateUpdateRequest):
    try:
        success = update_district_rate(request.state, request.district, request.rates)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update rates")
        return {"message": f"Rates updated successfully for {request.district}, {request.state}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
