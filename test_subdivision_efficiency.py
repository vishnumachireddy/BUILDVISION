import sys
import os
import math
from shapely.geometry import Polygon

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from services.layout import generate_layout

def test_efficiency():
    # Simulate a L-shape site in meters (mapped to feet)
    site_coords = [
        [17.3850, 78.4867], # Origin
        [17.3850, 78.4870], # North 33m
        [17.3852, 78.4870], # East 22m
        [17.3852, 78.4868], # South 22m
        [17.3851, 78.4868], # West 11m
        [17.3851, 78.4867]  # South 11m to close
    ]
    
    # 70% buildable area (approx)
    buildable_area = 2000.0 
    
    print(f"Generating layout for {buildable_area} sqft on L-shaped site...")
    layout = generate_layout(buildable_area, site_coords)
    
    total_room_area = sum(r.area_sqft for r in layout.rooms)
    print(f"BHK: {layout.bhk_type}")
    print(f"Planned Area: {layout.total_area_sqft} sqft")
    print(f"Actual Assigned Area: {total_room_area} sqft")
    print(f"Efficiency: {layout.efficiency_ratio}")
    print(f"Rooms: {len(layout.rooms)}")
    
    for r in layout.rooms:
        print(f" - {r.name}: {r.area_sqft} sqft, Vertices: {len(r.vertices)}")

if __name__ == "__main__":
    test_efficiency()
