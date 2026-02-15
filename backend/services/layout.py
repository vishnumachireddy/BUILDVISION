from pydantic import BaseModel
from typing import List, Tuple, Dict, Any
from shapely.geometry import Polygon, box, LineString, Point
import math

class Room(BaseModel):
    name: str
    width_ft: float = 0.0
    length_ft: float = 0.0
    area_sqft: float
    wall_height_ft: float = 10.0
    perimeter_ft: float = 0.0
    opening_deduction_sqft: float = 21.0
    color: str
    x: float = 0.0 # Centroid X
    y: float = 0.0 # Centroid Y
    vertices: List[Tuple[float, float]] # Local feet coordinates

class Wall(BaseModel):
    start: Tuple[float, float]
    end: Tuple[float, float]
    type: str = "internal" # internal, external
    thickness: float = 0.5 

class LayoutPlan(BaseModel):
    bhk_type: str
    total_area_sqft: float
    rooms: List[Room]
    walls: List[Wall] = []
    efficiency_ratio: float
    site_boundary: List[Tuple[float, float]] = [] # Feet coordinates
    floor_count: int = 1

def snap_vertices(vertices: List[Tuple[float, float]], grid_size: float = 0.5) -> List[Tuple[float, float]]:
    """Snaps vertices to a clean architectural grid (default 0.5ft)."""
    return [(round(v[0] / grid_size) * grid_size, round(v[1] / grid_size) * grid_size) for v in vertices]

def extract_walls(rooms: List[Room], buildable_poly: Polygon) -> List[Wall]:
    """Extracts unique wall segments, classifying them as external vs internal."""
    segments = []
    seen_edges = set()
    
    # Boundary threshold for external wall detection
    tolerance = 0.1 
    
    for room in rooms:
        v = snap_vertices(room.vertices)
        if len(v) < 2: continue
        
        for i in range(len(v) - 1):
            p1 = v[i]
            p2 = v[i+1]
            
            edge = tuple(sorted([p1, p2]))
            if edge not in seen_edges:
                mid_x = (p1[0] + p2[0]) / 2
                mid_y = (p1[1] + p2[1]) / 2
                mid_pt = Point(mid_x, mid_y)
                
                # External if it touches the boundary of the original buildable envelope
                is_external = buildable_poly.boundary.distance(mid_pt) < tolerance
                
                segments.append(Wall(
                    start=p1,
                    end=p2,
                    type="external" if is_external else "internal",
                    thickness=0.95 if is_external else 0.45 
                ))
                seen_edges.add(edge)
                
    return segments

def split_poly_proportional(poly: Polygon, ratio: float, vertical: bool = True) -> Tuple[Polygon, Polygon]:
    if poly.is_empty: return Polygon(), Polygon()
    minx, miny, maxx, maxy = poly.bounds
    target_area = poly.area * ratio
    
    low = minx if vertical else miny
    high = maxx if vertical else maxy
    
    best_poly = poly
    best_rem = Polygon()
    
    for _ in range(15):
        mid = (low + high) / 2
        if vertical:
            split_box = box(minx, miny, mid, maxy)
        else:
            split_box = box(minx, miny, maxx, mid)
            
        part = poly.intersection(split_box)
        if part.area < target_area:
            low = mid
        else:
            high = mid
            best_poly = part
            best_rem = poly.difference(split_box)
            
    return best_poly, best_rem

def recursive_subdivide(poly: Polygon, targets: List[Tuple[str, float]], depth: int = 0, force_vertical: bool = None) -> List[Tuple[str, Polygon]]:
    if not targets or poly.is_empty: return []
    if len(targets) == 1: return [(targets[0][0], poly)]
    
    mid = len(targets) // 2
    left_targets = targets[:mid]
    right_targets = targets[mid:]
    
    left_ratio = sum(t[1] for t in left_targets) / sum(t[1] for t in targets)
    
    minx, miny, maxx, maxy = poly.bounds
    # Automatically decide split axis if not forced
    if force_vertical is not None:
        vertical = force_vertical
    else:
        vertical = (maxx - minx) > (maxy - miny)
    
    left_poly, right_poly = split_poly_proportional(poly, left_ratio, vertical)
    
    # If one side is empty or too small, this split failed
    if left_poly.is_empty or right_poly.is_empty:
        return []

    res_left = recursive_subdivide(left_poly, left_targets, depth + 1, force_vertical)
    res_right = recursive_subdivide(right_poly, right_targets, depth + 1, force_vertical)
    
    if not res_left or not res_right:
        return []
        
    return res_left + res_right

def generate_layout(buildable_area: float, site_coords: List[List[float]] = None, floors: int = 1) -> LayoutPlan:
    from services.geometry import project_coordinates
    
    # 0. Initialize BHK Logic
    if buildable_area < 800:
        bhk = "Studio/1BHK Compact"
        targets = [("Living/Hall", 0.45), ("Bedroom", 0.35), ("Kitchenette", 0.1), ("Bath", 0.1)]
    elif buildable_area < 1500:
        bhk = "Standard 2BHK"
        targets = [("Living Hall", 0.35), ("Master Bed", 0.25), ("Bed 2", 0.2), ("Kitchen", 0.1), ("Bath 1", 0.05), ("Bath 2", 0.05)]
    else:
        bhk = "Premium 3BHK"
        targets = [("Grand Hall", 0.3), ("Master Bed", 0.2), ("Bed 2", 0.15), ("Bed 3", 0.15), ("Kitchen", 0.1), ("Dining", 0.05), ("Bath 1", 0.025), ("Bath 2", 0.025)]

    # 1. Coordinate Mapping (Feet)
    if not site_coords or len(site_coords) < 3:
        size = math.sqrt(buildable_area)
        site_points = [(0, 0), (size, 0), (size, size), (0, size), (0, 0)]
    else:
        projections = project_coordinates(site_coords)
        site_points = [(p[0] * 3.28084, p[1] * 3.28084) for p in projections]
        if site_points[0] != site_points[-1]:
            site_points.append(site_points[0])

    site_poly = Polygon(site_points)
    site_area = site_poly.area
    print(f"[RECON PHASE 1] Site Poly Points: {list(site_poly.exterior.coords)}")
    print(f"[RECON PHASE 1] Site Area: {site_area:.2f} sqft")

    # 2. Multi-Level Adaptive Setback
    buildable_poly = Polygon()
    current_setback = 5.0
    
    for s_level in [5.0, 3.0, 2.0, 0.0]:
        test_poly = site_poly.buffer(-s_level)
        if not test_poly.is_empty and test_poly.area > (site_area * 0.5) and test_poly.area > 200:
            buildable_poly = test_poly
            current_setback = s_level
            print(f"[RECON PHASE 1] Selected Setback: {s_level}ft (Area: {buildable_poly.area:.1f})")
            break
    
    if buildable_poly.is_empty:
        print("[RECON PHASE 1] Fallback: Disabling setbacks entirely.")
        buildable_poly = site_poly
        current_setback = 0.0

    # 3. Subdivision with Multi-Pass Retry
    subdivided = []
    
    # Pass A: Default (Auto-axis)
    subdivided = recursive_subdivide(buildable_poly, targets)
    
    # Pass B: Force Vertical if A failed
    if not subdivided:
        print("[V2.1.3 DEBUG] Retry: Forcing Vertical split.")
        subdivided = recursive_subdivide(buildable_poly, targets, force_vertical=True)
        
    # Pass C: Force Horizontal
    if not subdivided:
        print("[V2.1.3 DEBUG] Retry: Forcing Horizontal split.")
        subdivided = recursive_subdivide(buildable_poly, targets, force_vertical=False)
        
    # Pass D: Simplified Layout
    if not subdivided:
        print("[V2.1.3 DEBUG] Retry: Simplified Room List.")
        simple_targets = [("Main Area", 0.6), ("Service Area", 0.4)]
        subdivided = recursive_subdivide(buildable_poly, simple_targets)

    # 4. Final Fallback (Bounding Box / Single Room)
    if not subdivided:
        print("[RECON PHASE 1] Final Fallback: Single-Room Bounding Box.")
        subdivided = [("Unit Space", buildable_poly)]

    # 5. Extraction
    rooms = []
    colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#6366f1", "#f43f5e"]
    
    for i, (name, geom) in enumerate(subdivided):
        if geom.is_empty or geom.area < 1.0: continue
        
        # Flatten MultiPolygon into Polygons
        parts = [geom] if geom.geom_type == 'Polygon' else [p for p in geom.geoms if p.geom_type == 'Polygon']
        
        for part_idx, part in enumerate(parts):
            suffix = f" {part_idx + 1}" if len(parts) > 1 else ""
            centroid = part.centroid
            snapped_v = snap_vertices(list(part.exterior.coords))
            
            rooms.append(Room(
                name=f"{name}{suffix}",
                area_sqft=round(part.area, 1),
                perimeter_ft=round(part.length, 1),
                color=colors[i % len(colors)],
                x=round(centroid.x, 2), y=round(centroid.y, 2),
                vertices=snapped_v
            ))

    walls = extract_walls(rooms, buildable_poly)
    print(f"[RECON PHASE 1] Layout Final: {len(rooms)} rooms, {len(walls)} walls")
    if len(rooms) == 0:
        print("[RECON PHASE 1] ERROR: ZERO ROOMS GENERATED")

    return LayoutPlan(
        bhk_type=bhk,
        total_area_sqft=round(buildable_poly.area, 1),
        rooms=rooms,
        walls=walls,
        efficiency_ratio=round(buildable_poly.area / (site_area or 1), 2),
        site_boundary=site_points,
        floor_count=floors
    )

def generate_parametric_layout(
    plot_type: str,
    dimensions: Dict[str, float],
    requirements: Dict[str, Any],
    floors: int = 1
) -> LayoutPlan:
    """Generates a layout based on manual parametric inputs."""
    
    # 1. Create Plot Polygon
    if plot_type == "Rectangle":
        length = dimensions.get("length", 40.0)
        width = dimensions.get("width", 30.0)
        site_points = [(0, 0), (width, 0), (width, length), (0, length), (0, 0)]
    elif plot_type == "L-Shape":
        main_l = dimensions.get("main_length", 40.0)
        main_w = dimensions.get("main_width", 30.0)
        cut_l = dimensions.get("cut_length", 15.0)
        cut_w = dimensions.get("cut_width", 15.0)
        # Assuming cut is at top-right
        site_points = [
            (0, 0), (main_w, 0), (main_w, main_l - cut_l), 
            (main_w - cut_w, main_l - cut_l), (main_w - cut_w, main_l), 
            (0, main_l), (0, 0)
        ]
    elif plot_type == "Sketch":
        points = dimensions.get("sketch_points", [])
        if len(points) >= 3:
            # Normalize points: subtract min_x and min_y to align with (0,0)
            # and scale if needed (assuming canvas pixels to feet mapping)
            min_x = min(p['x'] for p in points)
            min_y = min(p['y'] for p in points)
            # Scale factor: let's assume 300px = 60ft (5px = 1ft)
            scale = 0.2 
            site_points = [((p['x'] - min_x) * scale, (p['y'] - min_y) * scale) for p in points]
        else:
            site_points = [(0, 0), (40, 0), (40, 30), (0, 30), (0, 0)]
    else: # Custom or Default
        size = math.sqrt(dimensions.get("area", 1200))
        site_points = [(0, 0), (size, 0), (size, size), (0, size), (0, 0)]

    site_poly = Polygon(site_points)
    site_area = site_poly.area
    
    # 2. Apply Setback (Reuse existing logic or simplified for parametric)
    # Default 5ft setback for parametric unless very small
    setback = 5.0 if site_area > 1000 else 3.0
    buildable_poly = site_poly.buffer(-setback)
    if buildable_poly.is_empty:
        buildable_poly = site_poly
        setback = 0.0

    # 3. Define Targets based on Requirements
    hall_val = 0.3 # 30% for hall
    targets = [("Grand Hall", hall_val)]
    
    # Proportional Allocation
    num_beds = requirements.get("bedrooms", 1)
    num_baths = requirements.get("bathrooms", 1)
    kitchen_val = 0.15
    dining_val = 0.1
    bath_unit = 0.05
    bed_unit = 0.2 if num_beds == 1 else (0.3 / num_beds)
    balcony_val = 0.05

    for i in range(num_beds):
        targets.append((f"Master Bed" if i == 0 else f"Bedroom {i+1}", bed_unit))
    if kitchen_val: targets.append(("Kitchen", kitchen_val))
    if dining_val: targets.append(("Dining", dining_val))
    for i in range(num_baths):
        targets.append((f"Bath {i+1}", bath_unit))
    if balcony_val: targets.append(("Balcony", balcony_val))

    # Normalize targets to sum to 1.0 (or close)
    total_val = sum(t[1] for t in targets)
    if total_val > 0:
        targets = [(t[0], t[1] / total_val) for t in targets]

    # 4. Validate Area
    # Rough estimate: Each room needs ~100sqft min
    min_required_area = (num_beds + num_baths + 2) * 80 
    if buildable_poly.area < min_required_area:
        # We'll still try to generate but maybe it's tight
        pass

    # 5. Reuse Subdivision Logic
    subdivided = recursive_subdivide(buildable_poly, targets)
    
    # Fallback retry logic
    if not subdivided:
        subdivided = recursive_subdivide(buildable_poly, targets, force_vertical=True)
    if not subdivided:
        subdivided = recursive_subdivide(buildable_poly, targets, force_vertical=False)
    if not subdivided:
        subdivided = [("Unit Space", buildable_poly)]

    # 6. Extract Rooms
    rooms = []
    colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#6366f1", "#f43f5e"]
    
    for i, (name, geom) in enumerate(subdivided):
        if geom.is_empty or geom.area < 1.0: continue
        parts = [geom] if geom.geom_type == 'Polygon' else [p for p in geom.geoms if p.geom_type == 'Polygon']
        for part_idx, part in enumerate(parts):
            centroid = part.centroid
            rooms.append(Room(
                name=f"{name}",
                area_sqft=round(part.area, 1),
                perimeter_ft=round(part.length, 1),
                color=colors[i % len(colors)],
                x=round(centroid.x, 2), y=round(centroid.y, 2),
                vertices=snap_vertices(list(part.exterior.coords))
            ))

    walls = extract_walls(rooms, buildable_poly)

    bhk_label = f"{num_beds}BHK {plot_type} Plot"

    return LayoutPlan(
        bhk_type=bhk_label,
        total_area_sqft=round(buildable_poly.area, 1),
        rooms=rooms,
        walls=walls,
        efficiency_ratio=round(buildable_poly.area / (site_area or 1), 2),
        site_boundary=site_points,
        floor_count=floors
    )
