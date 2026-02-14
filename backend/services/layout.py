from pydantic import BaseModel
from typing import List, Dict

class Room(BaseModel):
    name: str
    width_ft: float
    length_ft: float
    area_sqft: float
    wall_height_ft: float = 10.0  # Default height
    perimeter_ft: float
    opening_deduction_sqft: float = 21.0  # Default 1 door (7x3)
    color: str

class LayoutPlan(BaseModel):
    bhk_type: str
    total_area_sqft: float
    rooms: List[Room]
    efficiency_ratio: float

def generate_layout(buildable_area: float) -> LayoutPlan:
    # 1. Determine BHK
    if buildable_area < 800:
        bhk = "1BHK"
    elif buildable_area < 1500:
        bhk = "2BHK"
    elif buildable_area < 2500:
        bhk = "3BHK"
    else:
        bhk = "4BHK"

    # 2. Allocation Ratios (Approximate for estimation)
    # Hall: 22%, Kitchen: 9%, Bed: 14%, Bath: 6%, Stair: 8%
    # We will adjust counts based on BHK
    
    rooms = []
    
    # Simple aspect ratio helper (attempt to make rooms roughly rectangular 3:4)
    def make_room(name, area, color):
        area = max(area, 1.0)  # Prevent zero/negative area
        width = (area / 1.5) ** 0.5  # assuming 1.5 ratio
        width = max(width, 0.1)  # Prevent division by zero
        length = area / width
        
        perimeter = 2 * (width + length)
        # Default opening deductions: 
        # Door: 7x3 = 21 sqft. Windows: ~15 sqft per room.
        opening_deduction = 21.0 + (15.0 if "Bedroom" in name or "Living" in name else 0.0)

        return Room(
            name=name,
            width_ft=round(width, 1),
            length_ft=round(length, 1),
            area_sqft=round(area, 1),
            perimeter_ft=round(perimeter, 1),
            opening_deduction_sqft=opening_deduction,
            color=color
        )

    # Hall (Living)
    hall_area = buildable_area * 0.22
    rooms.append(make_room("Living Hall", hall_area, "#FFD700"))

    # Kitchen
    kitchen_area = buildable_area * 0.12 # Boosted slightly 
    rooms.append(make_room("Kitchen & Dining", kitchen_area, "#FF6347"))

    # Bedrooms
    num_beds = int(bhk[0])
    bed_area = (buildable_area * 0.40) / num_beds # 40% for all bedrooms
    for i in range(num_beds):
        rooms.append(make_room(f"Bedroom {i+1}", bed_area, "#87CEEB"))

    # Bathrooms
    num_baths = max(1, num_beds - 1)
    bath_area = (buildable_area * 0.10) / num_baths
    for i in range(num_baths):
        rooms.append(make_room(f"Bathroom {i+1}", bath_area, "#E0FFFF"))

    return LayoutPlan(
        bhk_type=bhk,
        total_area_sqft=round(buildable_area, 1),
        rooms=rooms,
        efficiency_ratio=0.85 
    )
