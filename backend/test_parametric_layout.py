import sys
import os

# Add backend to path for imports
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from services.layout import generate_parametric_layout
from shapely.geometry import Polygon

def test_parametric_rectangle():
    print("\n--- Testing Parametric Rectangle Plot ---")
    dimensions = {
        "length_ft": 40,
        "width_ft": 30
    }
    requirements = {
        "bedrooms": 2,
        "bathrooms": 2
    }
    
    layout = generate_parametric_layout("Rectangle", dimensions, requirements)
    
    print(f"BHK Type: {layout.bhk_type}")
    print(f"Number of Rooms: {len(layout.rooms)}")
    for r in layout.rooms:
        print(f" - {r.name}: {r.area_sqft} sqft")
    
    room_names = [r.name for r in layout.rooms]
    assert "Grand Hall" in room_names
    assert len(layout.rooms) >= 5 # Hall, 2 Bed, 2 Bath, Kitchen
    
    for room in layout.rooms:
        print(f"Room: {room.name}, Area: {room.area_sqft:.1f} sqft")
        assert len(room.vertices) >= 4
        poly = Polygon(room.vertices)
        assert poly.is_valid

def test_parametric_lshape():
    print("\n--- Testing Parametric L-Shape Plot ---")
    dimensions = {
        "length_a": 50,
        "width_a": 30,
        "length_b": 30,
        "width_b": 20
    }
    requirements = {
        "bedrooms": 3,
        "bathrooms": 2
    }
    
    layout = generate_parametric_layout("L-Shape", dimensions, requirements)
    
    print(f"BHK Type: {layout.bhk_type}")
    print(f"Number of Rooms: {len(layout.rooms)}")
    
    assert len(layout.rooms) >= 7 # Hall, 3 Bed, 2 Bath, Kitchen, Dining
    
    for room in layout.rooms:
        print(f"Room: {room.name}, Area: {room.area_sqft:.1f} sqft")
        assert len(room.vertices) >= 4
        poly = Polygon(room.vertices)
        assert poly.is_valid

if __name__ == "__main__":
    try:
        test_parametric_rectangle()
        test_parametric_lshape()
        print("\n\nSUCCESS: Parametric layout engine validated for Rectangle and L-Shape plots.")
    except Exception as e:
        print(f"\n\nFAILURE: {str(e)}")
        import traceback
        traceback.print_exc()
