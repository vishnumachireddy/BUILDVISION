from pydantic import BaseModel
from typing import Dict

from services.layout import LayoutPlan

class MaterialEstimate(BaseModel):
    cement_bags: float
    steel_kg: float
    bricks_count: int
    sand_tons: float
    aggregate_tons: float
    paint_liters: float
    flooring_sqft: float

def estimate_materials(buildable_area_sqft: float, floors: int = 1, layout: LayoutPlan = None) -> MaterialEstimate:
    # Convert to sqm for standard engineering formulas
    area_sqm = buildable_area_sqft * 0.092903
    total_built_up_area_sqft = buildable_area_sqft * floors
    total_built_up_area_sqm = area_sqm * floors

    # 1. Cement: ~0.45 bags per sqft of built-up area
    cement = total_built_up_area_sqft * 0.45 

    # 2. Steel: ~3.5 kg per sqft
    steel = total_built_up_area_sqft * 3.5

    # 3. Bricks: ~9 bricks per sqft 
    bricks = total_built_up_area_sqft * 9

    # 4. Sand: 1 ton per 250 sqft
    sand = total_built_up_area_sqft / 250 

    # 5. Aggregate: 1.4x sand
    aggregate = sand * 1.4

    # 6. Paint calculation (More Detailed)
    if layout:
        total_paint_area = 0
        for room in layout.rooms:
            # Interior walls: Perimeter * Height - Openings
            wall_area = (room.perimeter_ft * room.wall_height_ft) - room.opening_deduction_sqft
            # Ceiling: Same as floor area
            ceiling_area = room.area_sqft
            total_paint_area += (wall_area + ceiling_area)
        
        # Add exterior walls (approximate)
        exterior_perimeter = (buildable_area_sqft ** 0.5) * 4
        exterior_wall_area = (exterior_perimeter * 10 * floors) # 10ft per floor
        total_paint_area += exterior_wall_area
    else:
        # Fallback thumb rule: 4x floor area
        total_paint_area = total_built_up_area_sqft * 4
    
    # Coverage ~ 120 sq ft per liter (2 coats)
    paint = total_paint_area / 120

    # 7. Flooring: 90% of built-up area
    flooring = total_built_up_area_sqft * 0.9

    return MaterialEstimate(
        cement_bags=round(cement, 0),
        steel_kg=round(steel, 0),
        bricks_count=int(bricks),
        sand_tons=round(sand, 1),
        aggregate_tons=round(aggregate, 1),
        paint_liters=round(paint, 0),
        flooring_sqft=round(flooring, 0)
    )
