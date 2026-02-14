from pydantic import BaseModel
from typing import Dict
from services.materials import MaterialEstimate

class CostBreakdown(BaseModel):
    material_cost: float
    labor_cost: float
    finishing_cost: float
    total_estimated_cost: float
    currency: str = "INR"

def calculate_cost(materials: MaterialEstimate, location_factor: float = 1.0) -> CostBreakdown:
    # Base Rates (Average INR rates)
    RATES = {
        "cement_bag": 400,
        "steel_kg": 75,
        "brick_unit": 12,
        "sand_ton": 1500,
        "aggregate_ton": 1200,
        "paint_liter": 350,
        "flooring_sqft": 120 # Tiles + laying
    }

    m_cost = 0
    m_cost += materials.cement_bags * RATES["cement_bag"]
    m_cost += materials.steel_kg * RATES["steel_kg"]
    m_cost += materials.bricks_count * RATES["brick_unit"]
    m_cost += materials.sand_tons * RATES["sand_ton"]
    m_cost += materials.aggregate_tons * RATES["aggregate_ton"]
    m_cost += materials.paint_liters * RATES["paint_liter"]
    m_cost += materials.flooring_sqft * RATES["flooring_sqft"]

    # Labor Cost (Usually 25-30% of total project or ~300-400 per sq ft structure)
    # Let's say Material is 60%, Labor is 40% of Structure.
    labor_cost = m_cost * 0.65 

    # Finishing (Electrical, Plumbing, Woodwork, etc.)
    # Approx 20% of construction cost
    finishing_cost = (m_cost + labor_cost) * 0.20

    total = m_cost + labor_cost + finishing_cost

    return CostBreakdown(
        material_cost=round(m_cost, 2),
        labor_cost=round(labor_cost, 2),
        finishing_cost=round(finishing_cost, 2),
        total_estimated_cost=round(total, 2)
    )
