from pydantic import BaseModel
from typing import Dict, Optional
from services.materials import MaterialEstimate
from services.rates import get_material_rates

class CostBreakdown(BaseModel):
    material_cost: float
    labor_cost: float
    finishing_cost: float
    total_estimated_cost: float
    currency: str = "INR"
    location_detected: Optional[str] = None
    rate_updated: Optional[str] = None
    quality_mode: str = "Standard"
    soil_type: Optional[str] = None

soil_profiles = {
    "Rocky / Hard Soil": {
        "safe_floors": 4,
        "foundation": "Isolated Footing",
        "risk": "Low",
        "note": "Generally strong bearing capacity.",
        "multiplier": 1.0
    },
    "Normal Red Soil": {
        "safe_floors": 3,
        "foundation": "Reinforced Footing",
        "risk": "Moderate",
        "note": "Standard residential construction suitable.",
        "multiplier": 1.05
    },
    "Sandy Soil": {
        "safe_floors": 2,
        "foundation": "Pile Foundation Recommended",
        "risk": "High Groundwater Risk",
        "note": "Requires proper compaction and drainage.",
        "multiplier": 1.2
    },
    "Coastal / Marine Soil": {
        "safe_floors": 2,
        "foundation": "Pile or Raft Foundation",
        "risk": "High Salinity & Water Table",
        "note": "Corrosion protection required.",
        "multiplier": 1.2
    },
    "Black Cotton Soil": {
        "safe_floors": 2,
        "foundation": "Under-Reamed Pile Recommended",
        "risk": "Swelling/Shrinkage",
        "note": "Expansive soil behavior.",
        "multiplier": 1.25
    },
    "Not Sure": {
        "safe_floors": "Unknown",
        "foundation": "Soil Test Required",
        "risk": "Unknown",
        "note": "Professional soil testing mandatory.",
        "multiplier": 1.0
    }
}

def calculate_cost(
    materials: MaterialEstimate, 
    state: str = None, 
    district: str = None,
    quality_mode: str = "Standard",
    soil_type: str = "Normal Red Soil"
) -> CostBreakdown:
    # 1. Fetch Dynamic Rates
    rates = get_material_rates(state, district)
    
    # 2. Quality Multiplier
    # Economy (x 0.9), Standard (x 1.0), Premium (x 1.2)
    quality_multipliers = {
        "Economy": 0.9,
        "Standard": 1.0,
        "Premium": 1.2
    }
    multiplier = quality_multipliers.get(quality_mode, 1.0)
    
    # 3. Inflation Factor (Simulated)
    inflation_factor = 1.05 # 5% annual buffer
    
    effective_multiplier = multiplier * inflation_factor

    # 4. Calculate Material Cost
    m_cost = 0
    m_cost += materials.cement_bags * rates["cement"] * effective_multiplier
    m_cost += materials.steel_kg * rates["steel"] * effective_multiplier
    m_cost += materials.bricks_count * rates["bricks"] * effective_multiplier
    m_cost += materials.sand_tons * rates["sand"] * effective_multiplier
    m_cost += materials.aggregate_tons * rates["aggregate"] * effective_multiplier
    
    # Finishing rates (fallback if not in dynamic rates)
    m_cost += materials.paint_liters * 350 * effective_multiplier
    m_cost += materials.flooring_sqft * 120 * effective_multiplier

    # 5. Labor Cost
    labor_index = rates.get("labor_index", 1.0)
    labor_cost = m_cost * 0.65 * labor_index

    # 6. Finishing
    finishing_cost = (m_cost + labor_cost) * 0.20

    # 7. Apply Soil Multiplier (Foundation sensitivity)
    # Rule: Apply only to foundation portion. We assume foundation is ~15% of material cost.
    soil_data = soil_profiles.get(soil_type, soil_profiles["Not Sure"])
    soil_multiplier = soil_data["multiplier"]
    
    foundation_portion = m_cost * 0.15
    foundation_increase = foundation_portion * (soil_multiplier - 1.0)
    
    m_cost += foundation_increase
    total = m_cost + labor_cost + finishing_cost

    location_str = f"{district}, {state}" if district and state else "National Average"

    return CostBreakdown(
        material_cost=round(m_cost, 2),
        labor_cost=round(labor_cost, 2),
        finishing_cost=round(finishing_cost, 2),
        total_estimated_cost=round(total, 2),
        location_detected=location_str,
        rate_updated=rates.get("last_updated", "N/A"),
        quality_mode=quality_mode,
        soil_type=soil_type
    )
