import sys
import os
from shapely.geometry import Polygon

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from services.layout import generate_parametric_layout

def test_sketch_boundary():
    print("\n--- Testing Plot Sketch Mode ---")
    # Simulate a hexagon-like plot from frontend
    sketch_points = [
        {'x': 100, 'y': 100},
        {'x': 200, 'y': 100},
        {'x': 250, 'y': 150},
        {'x': 200, 'y': 200},
        {'x': 100, 'y': 200},
        {'x': 50, 'y': 150}
    ]
    
    dimensions = {"sketch_points": sketch_points}
    requirements = {"bedrooms": 2, "bathrooms": 1}
    
    layout = generate_parametric_layout(
        plot_type="Sketch",
        dimensions=dimensions,
        requirements=requirements,
        floors=2
    )

    print(f"BHK Type: {layout.bhk_type}")
    print(f"Total Area: {layout.total_area_sqft} sqft")
    print(f"Number of Rooms: {len(layout.rooms)}")
    print(f"Floors: {layout.floor_count}")

    assert len(layout.rooms) > 0
    assert layout.total_area_sqft > 0
    assert layout.floor_count == 2
    
    print("SUCCESS: Sketch mode generated valid layout geometry.")

def test_regional_rates():
    print("\n--- Testing Regional Rates (AP/Telangana) ---")
    from services.rates import get_material_rates
    
    # Test a metro district in Telangana
    hyd_rates = get_material_rates("Telangana", "Hyderabad")
    print(f"Hyderabad Cement Rate: {hyd_rates['cement']}")
    assert hyd_rates['cement'] == 460
    
    # Test a non-metro district in AP
    guntur_rates = get_material_rates("Andhra Pradesh", "Guntur")
    print(f"Guntur Cement Rate: {guntur_rates['cement']}")
    assert guntur_rates['cement'] == 420

    print("SUCCESS: Regional rates for AP and Telangana are correctly loaded.")

if __name__ == "__main__":
    try:
        test_sketch_boundary()
        test_regional_rates()
    except Exception as e:
        print(f"FAILURE: {e}")
        sys.exit(1)
