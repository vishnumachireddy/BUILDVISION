import * as THREE from 'three';

/**
 * Disposes of all geometries and materials in a THREE.js group/object
 */
export const disposeScene = (object) => {
    if (!object) return;
    object.traverse((node) => {
        if (node.isMesh || node.isLine) {
            if (node.geometry) node.geometry.dispose();
            if (node.material) {
                if (Array.isArray(node.material)) {
                    node.material.forEach(m => m.dispose());
                } else {
                    node.material.dispose();
                }
            }
        }
    });
};

/**
 * Calculates the bounding box for all layouts in a multi-floor stack
 */
export const calculateCombinedBoundingBox = (layouts, baseLayout, numFloors, floorHeight = 10) => {
    const box = new THREE.Box3();
    const allRelevantLayouts = (layouts && layouts.length > 0)
        ? layouts.slice(0, numFloors)
        : [baseLayout];

    allRelevantLayouts.forEach((layout, floorIdx) => {
        if (!layout || !layout.rooms) return;
        const yOffset = floorIdx * floorHeight;
        layout.rooms.forEach(room => {
            room.vertices?.forEach(v => {
                box.expandByPoint(new THREE.Vector3(v[0], yOffset, v[1]));
                box.expandByPoint(new THREE.Vector3(v[0], yOffset + floorHeight, v[1]));
            });
        });
    });

    if (box.isEmpty()) return { center: new THREE.Vector3(), size: new THREE.Vector3(), box };

    const center = new THREE.Vector3();
    box.getCenter(center);
    const size = new THREE.Vector3();
    box.getSize(size);

    return { center, size, box };
};

/**
 * Generates a proportional grid-based layout for a set of requirements.
 * Uses a recursive "guillotine" split algorithm.
 */
export const generateProportionalLayout = (boundary, manualInputs) => {
    const minX = Math.min(...boundary.map(v => v[0]));
    const maxX = Math.max(...boundary.map(v => v[0]));
    const minY = Math.min(...boundary.map(v => v[1]));
    const maxY = Math.max(...boundary.map(v => v[1]));

    const width = maxX - minX;
    const height = maxY - minY;

    const rooms = [];
    const inputs = manualInputs || { bedrooms: 2, bathrooms: 1, kitchen: true, living: true };

    const roomSpecs = [];
    if (inputs.living) roomSpecs.push({ name: 'Living Hall', weight: 4 });
    if (inputs.kitchen) roomSpecs.push({ name: 'Kitchen', weight: 2.5 });
    if (inputs.dining) roomSpecs.push({ name: 'Dining', weight: 2 });
    for (let i = 0; i < (inputs.bedrooms || 0); i++) roomSpecs.push({ name: `Bedroom ${i + 1}`, weight: 3.5 });
    for (let i = 0; i < (inputs.bathrooms || 0); i++) roomSpecs.push({ name: `Bath ${i + 1}`, weight: 1.5 });
    if (inputs.balcony) roomSpecs.push({ name: 'Balcony', weight: 1.2 });
    if (inputs.parking) roomSpecs.push({ name: 'Parking', weight: 3 });

    if (roomSpecs.length === 0) return { rooms: [] };

    const totalWeight = roomSpecs.reduce((sum, r) => sum + r.weight, 0);

    const subdivide = (rect, specs) => {
        if (specs.length === 0) return;
        if (specs.length === 1) {
            rooms.push({
                name: specs[0].name,
                x: rect.x + rect.w / 2,
                y: rect.y + rect.h / 2,
                width: rect.w,
                length: rect.h,
                vertices: [
                    [rect.x, rect.y],
                    [rect.x + rect.w, rect.y],
                    [rect.x + rect.w, rect.y + rect.h],
                    [rect.x, rect.y + rect.h]
                ],
                area_sqft: rect.w * rect.h
            });
            return;
        }

        // Split specs into two groups based on weight
        let mid = Math.ceil(specs.length / 2);
        let leftWeight = specs.slice(0, mid).reduce((s, r) => s + r.weight, 0);
        let ratio = leftWeight / specs.reduce((s, r) => s + r.weight, 0);

        if (rect.w > rect.h) {
            // Split vertically
            const splitW = rect.w * ratio;
            subdivide({ x: rect.x, y: rect.y, w: splitW, h: rect.h }, specs.slice(0, mid));
            subdivide({ x: rect.x + splitW, y: rect.y, w: rect.w - splitW, h: rect.h }, specs.slice(mid));
        } else {
            // Split horizontally
            const splitH = rect.h * ratio;
            subdivide({ x: rect.x, y: rect.y, w: rect.w, h: splitH }, specs.slice(0, mid));
            subdivide({ x: rect.x, y: rect.y + splitH, w: rect.w, h: rect.h - splitH }, specs.slice(mid));
        }
    };

    subdivide({ x: minX, y: minY, w: width, h: height }, roomSpecs);

    return { rooms, floor_count: 1 };
};

/**
 * Normalizes input layout props into a floor-indexed array
 */
export const normalizeFloorConfig = (layout, layouts, numFloors, configMode, roomModes, manualInputs) => {
    const floors = [];
    const baseLayout = layout || { rooms: [] };

    // Robust site boundary extraction
    let siteBoundary = baseLayout.site_boundary;
    if (!siteBoundary || siteBoundary.length < 3) {
        siteBoundary = baseLayout.rooms?.flatMap(r => r.vertices || []) || [[0, 0], [40, 0], [40, 30], [0, 30]];
    }

    for (let i = 0; i < numFloors; i++) {
        // Support both numeric and string keys for robustness
        const roomMode = roomModes ? (roomModes[i] || roomModes[String(i)]) : null;
        const mode = configMode === 'CUSTOM' ? (roomMode || 'BASE') : 'SAME';
        let floorLayout;

        if (mode === 'SAME' || i === 0) {
            floorLayout = JSON.parse(JSON.stringify(baseLayout));
        } else if (mode === 'BASE') {
            floorLayout = JSON.parse(JSON.stringify(baseLayout));
        } else {
            // MANUAL mode
            const customLayout = layouts ? (layouts[i] || layouts[String(i)]) : null;
            const customInputs = manualInputs ? (manualInputs[i] || manualInputs[String(i)]) : null;
            floorLayout = customLayout ? customLayout : generateProportionalLayout(siteBoundary, customInputs);
        }

        floors.push({
            floorNumber: i,
            layout: floorLayout,
            layoutType: mode === 'MANUAL' ? 'custom' : 'same'
        });
    }
    return floors;
};
