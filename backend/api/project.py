from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from schemas.polygon import PolygonRequest, AreaResponse
from api.calculation import get_area
from services.layout import generate_layout, generate_parametric_layout, LayoutPlan
from services.materials import estimate_materials, MaterialEstimate
from services.cost import calculate_cost, CostBreakdown

router = APIRouter()

class ConstructionPlan(BaseModel):
    area_metrics: AreaResponse
    layout_plan: LayoutPlan
    material_estimate: MaterialEstimate
    cost_estimate: CostBreakdown
    soil_advisory: Optional[Dict[str, Any]] = None

class ParametricRequest(BaseModel):
    plot_type: str
    dimensions: Dict[str, Any]
    requirements: Dict[str, Any]
    floors: int = 1
    state: Optional[str] = None
    district: Optional[str] = None
    quality_mode: str = "Standard"
    soil_type: str = "Normal Red Soil"

@router.post("/generate-plan", response_model=ConstructionPlan)
def generate_full_plan(request: PolygonRequest):
    coords = request.coordinates
    floors = request.floors
    state = request.state
    district = request.district
    quality_mode = request.quality_mode
    
    # 1. Geometry
    area_resp = get_area(request)
    buildable_area = area_resp.buildable_area_sqft

    # 2. Layout
    layout = generate_layout(buildable_area, coords, floors=floors)

    # 3. Materials
    materials = estimate_materials(buildable_area, floors=floors, layout=layout)

    # 4. Cost
    costs = calculate_cost(
        materials, 
        state=state, 
        district=district, 
        quality_mode=quality_mode,
        soil_type=request.soil_type
    )

    from services.cost import soil_profiles
    advisory = soil_profiles.get(request.soil_type, soil_profiles["Not Sure"])

    return ConstructionPlan(
        area_metrics=area_resp,
        layout_plan=layout,
        material_estimate=materials,
        cost_estimate=costs,
        soil_advisory=advisory
    )

@router.post("/generate-parametric-plan", response_model=ConstructionPlan)
def generate_manual_plan(request: ParametricRequest):
    # 1. Layout
    layout = generate_parametric_layout(
        plot_type=request.plot_type,
        dimensions=request.dimensions,
        requirements=request.requirements,
        floors=request.floors
    )

    # 2. Metrics (Synthetic based on layout)
    buildable_area = layout.total_area_sqft
    area_resp = AreaResponse(
        area_sqm=round(buildable_area * 0.0929, 2),
        area_sqft=round(buildable_area, 2),
        perimeter_m=0, 
        perimeter_ft=0,
        buildable_area_sqft=round(buildable_area, 2),
        warnings=[]
    )

    # 3. Materials
    materials = estimate_materials(buildable_area, floors=request.floors, layout=layout)

    # 4. Cost 
    costs = calculate_cost(
        materials, 
        state=request.state, 
        district=request.district, 
        quality_mode=request.quality_mode,
        soil_type=request.soil_type
    )

    from services.cost import soil_profiles
    advisory = soil_profiles.get(request.soil_type, soil_profiles["Not Sure"])

    return ConstructionPlan(
        area_metrics=area_resp,
        layout_plan=layout,
        material_estimate=materials,
        cost_estimate=costs,
        soil_advisory=advisory
    )
@router.post("/report")
async def generate_report(request: Dict[str, Any]):
    from services.report import generate_pdf_report
    import tempfile
    from fastapi.responses import FileResponse

    # Prepare data for report generator
    project_data = {
        "name": "Untitled Project",
        "lat": 17.3850,
        "lon": 78.4867,
        "area_sqft": request.get("project_data", {}).get("area_metrics", {}).get("buildable_area_sqft", 0),
        "floors": request.get("floors", 1),
        "bhk_type": request.get("project_data", {}).get("layout_plan", {}).get("bhk_type", "Standard Plan"),
        "materials": request.get("project_data", {}).get("material_estimate", {}),
        "costs": request.get("project_data", {}).get("cost_estimate", {}),
        "soil_advisory": request.get("project_data", {}).get("soil_advisory", {}),
        "total_cost": request.get("project_data", {}).get("cost_estimate", {}).get("total_estimated_cost", 0)
    }

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    generate_pdf_report(project_data, tmp.name)
    
    return FileResponse(tmp.name, filename="ConstructIQ_Report.pdf", media_type="application/pdf")
