import math
from typing import List, Tuple

from shapely.geometry import Polygon

def haversine_distance(coord1: List[float], coord2: List[float]) -> float:
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    """
    lat1, lon1 = coord1
    lat2, lon2 = coord2

    R = 6371000  # Radius of Earth in meters

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0)**2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0)**2
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c

def validate_polygon_geometry(coords: List[List[float]]) -> List[str]:
    """
    Use shapely to check for self-intersections and other geometric errors.
    """
    errors = []
    try:
        if len(coords) < 3:
            return ["Polygon must have at least 3 points."]
        
        # Shapely expects (x, y) which is (lon, lat)
        points = [(c[1], c[0]) for c in coords]
        poly = Polygon(points)
        
        if not poly.is_valid:
            errors.append("Invalid geometry (self-intersecting or overlapping).")
    except Exception as e:
        errors.append(f"Geometry validation failed: {str(e)}")
    
    return errors

def calculate_polygon_area(coords: List[List[float]]) -> float:
    # ... (existing code, unchanged but for context)
    """
    Calculate area of polygon using Shoelace formula adjusted for spherical coordinates.
    For small areas (like plots), generic Shoelace on projected points is accurate enough,
    but we can use a spherical excess method or project to local plane for better accuracy.
    
    Simplified approach for small plots:
    Convert lat/lon to meters (approx) relative to the first point, 
    then use standard 2D Shoelace.
    """
    if len(coords) < 3:
        return 0.0

    # Project to local meters relative to first point
    origin = coords[0]
    points_m = []
    
    for coord in coords:
        # y = distance north (lat diff)
        # x = distance east (lon diff, adjusted for lat)
        dy = haversine_distance([origin[0], origin[1]], [coord[0], origin[1]])
        if coord[0] < origin[0]: dy = -dy
        
        dx = haversine_distance([origin[0], origin[1]], [origin[0], coord[1]])
        if coord[1] < origin[1]: dx = -dx
        
        points_m.append((dx, dy))

    # Shoelace formula
    n = len(points_m)
    area = 0.0
    for i in range(n):
        j = (i + 1) % n
        area += points_m[i][0] * points_m[j][1]
        area -= points_m[j][0] * points_m[i][1]
    
    return abs(area) / 2.0

def calculate_perimeter(coords: List[List[float]]) -> float:
    perimeter = 0.0
    for i in range(len(coords)):
        j = (i + 1) % len(coords)
        perimeter += haversine_distance(coords[i], coords[j])
    return perimeter

def validate_polygon(area_sqft: float, perimeter_ft: float) -> List[str]:
    warnings = []
    if area_sqft < 300:
        warnings.append("Area is too small (< 300 sq ft).")
    if area_sqft > 20000:
        warnings.append("Area is too large (> 20,000 sq ft).")
    return warnings
