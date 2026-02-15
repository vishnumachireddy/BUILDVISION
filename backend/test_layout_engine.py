from services.layout import generate_layout
from shapely.geometry import Polygon

def test_irregular_polygon():
    # L-shaped plot in Lat/Lng (mocked)
    site_coords = [
        [12.9716, 77.5946], # Origin
        [12.9716, 77.5950], # East
        [12.9712, 77.5950], # South-East
        [12.9712, 77.5948], # Corner
        [12.9710, 77.5948], # South-Mid
        [12.9710, 77.5946], # West
        [12.9716, 77.5946]  # Close
    ]
    
    buildable_area = 2000.0 # sq ft
    layout = generate_layout(buildable_area, site_coords)
    
    print(f"BHK Type: {layout.bhk_type}")
    print(f"Number of Rooms: {len(layout.rooms)}")
    
    for room in layout.rooms:
        print(f"Room: {room.name}, Area: {room.area_sqft} sqft, Vertices: {len(room.vertices)}")
        assert len(room.vertices) >= 3
        poly = Polygon(room.vertices)
        assert poly.is_valid

if __name__ == "__main__":
    try:
        test_irregular_polygon()
        print("\nSUCCESS: Layout engine handled L-shaped polygon correctly.")
    except Exception as e:
        print(f"\nFAILURE: {str(e)}")
