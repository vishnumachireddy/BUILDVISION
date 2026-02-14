from fastapi import APIRouter
from schemas.polygon import PolygonRequest, AreaResponse
from services.geometry import calculate_polygon_area, calculate_perimeter, validate_polygon, validate_polygon_geometry
from services.layout import generate_layout, LayoutPlan
from services.materials import estimate_materials, MaterialEstimate
from services.cost import calculate_cost, CostBreakdown
from pydantic import BaseModel

router = APIRouter()

class ConstructionPlan(BaseModel):
    area_metrics: AreaResponse
    layout_plan: LayoutPlan
    material_estimate: MaterialEstimate
    cost_estimate: CostBreakdown

@router.post("/generate-plan", response_model=ConstructionPlan)
def generate_full_plan(request: PolygonRequest):
    coords = request.coordinates
    floors = request.floors
    
    # 1. Geometry
    # Advanced Validation
    geo_errors = validate_polygon_geometry(coords)
    
    area_sqm = calculate_polygon_area(coords)
    perimeter_m = calculate_perimeter(coords)
    area_sqft = area_sqm * 10.7639
    perimeter_ft = perimeter_m * 3.28084
    warnings = validate_polygon(area_sqft, perimeter_ft) + geo_errors
    
    # Buildable Area
    setback_ratio = 0.10
    if area_sqft > 3000:
        setback_ratio = 0.20
    elif area_sqft > 1000:
        setback_ratio = 0.15
        
    buildable_area = area_sqft * (1 - setback_ratio)
    
    area_resp = AreaResponse(
        area_sqm=round(area_sqm, 2),
        area_sqft=round(area_sqft, 2),
        perimeter_m=round(perimeter_m, 2),
        perimeter_ft=round(perimeter_ft, 2),
        buildable_area_sqft=round(buildable_area, 2),
        warnings=warnings
    )

    # 2. Layout
    layout = generate_layout(buildable_area)

    # 3. Materials
    # Now passing floors and layout for better accuracy
    materials = estimate_materials(buildable_area, floors=floors, layout=layout)

    # 4. Cost
    costs = calculate_cost(materials)

    return ConstructionPlan(
        area_metrics=area_resp,
        layout_plan=layout,
        material_estimate=materials,
        cost_estimate=costs
    )
