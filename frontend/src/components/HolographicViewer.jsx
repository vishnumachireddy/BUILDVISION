import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Html, PerspectiveCamera, Edges } from '@react-three/drei';
import * as THREE from 'three';

const HolographicViewer = ({ layout, floors = 1 }) => {
    const floorCount = (layout && layout.floor_count > 1) ? layout.floor_count : floors;
    const floorArray = Array.from({ length: floorCount }, (_, i) => i);

    const { rooms, siteBoundary, centerX, centerZ } = useMemo(() => {
        if (!layout || !layout.rooms || layout.rooms.length === 0)
            return { rooms: [], siteBoundary: [], centerX: 0, centerZ: 0 };

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        let pointsToCenter = layout.site_boundary && layout.site_boundary.length > 0
            ? layout.site_boundary
            : layout.rooms.flatMap(r => r.vertices || []);

        if (pointsToCenter.length === 0)
            return { rooms: layout.rooms, siteBoundary: [], centerX: 0, centerZ: 0 };

        pointsToCenter.forEach(v => {
            minX = Math.min(minX, v[0]);
            minY = Math.min(minY, v[1]);
            maxX = Math.max(maxX, v[0]);
            maxY = Math.max(maxY, v[1]);
        });

        return {
            rooms: layout.rooms,
            siteBoundary: layout.site_boundary || [],
            centerX: (minX + maxX) / 2,
            centerZ: (minY + maxY) / 2
        };
    }, [layout]);

    const wallHeight = 10;
    const hasRooms = layout && layout.rooms && layout.rooms.length > 0;
    const hasWalls = layout && layout.walls && layout.walls.length > 0;
    const isEmpty = !hasRooms && !hasWalls;

    return (
        <div style={{ height: '100%', width: '100%', borderRadius: '32px', overflow: 'hidden', position: 'relative', background: '#070d1f' }}>
            {isEmpty ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff4444', fontWeight: 900, textAlign: 'center', padding: '40px' }}>
                    <div>
                        <div style={{ fontSize: '32px', marginBottom: '16px' }}>⚠️ GEOMETRY ERROR</div>
                        <div style={{ fontSize: '14px', opacity: 0.8 }}>The engine could not generate a valid structure for this site boundary.<br />Try drawing a larger or simpler shape.</div>
                    </div>
                </div>
            ) : (
                <Canvas camera={{ position: [100, 100, 100], fov: 35 }}>
                    <ambientLight intensity={1.5} />
                    <Grid args={[500, 500]} position={[0, -0.01, 0]} cellSize={10} sectionSize={50} sectionColor="#00eaff" cellColor="#004488" infiniteGrid />
                    <OrbitControls makeDefault target={[0, (floorCount * wallHeight) / 2, 0]} />

                    <group position={[-centerX, 0, centerZ]}>
                        {siteBoundary && siteBoundary.length > 0 && (
                            <SiteBoundaryLine vertices={siteBoundary} />
                        )}
                        {floorArray.map(floorIdx => (
                            <group key={floorIdx} position={[0, floorIdx * wallHeight, 0]}>
                                {rooms.map((room, idx) => (
                                    <ExtrudedRoom key={`${floorIdx}-${idx}`} room={room} height={wallHeight} />
                                ))}
                            </group>
                        ))}
                        <ScanEffect totalHeight={wallHeight * floorCount} />
                    </group>
                </Canvas>
            )}

            <div style={{ position: 'absolute', top: 32, left: 32, display: 'flex', gap: '12px' }}>
                <div style={{ background: '#00eaff', color: '#000', padding: '6px 14px', borderRadius: '12px', fontSize: '11px', fontWeight: 900 }}>HOLOGRAPHIC GEOMETRY STREAM V2.1.3</div>
            </div>
        </div>
    );
};

// Helper: Enforce Clockwise Sorting for Room Vertices
const ensureClockwise = (v) => {
    if (v.length < 3) return v;
    let sum = 0;
    for (let i = 0; i < v.length; i++) {
        const p1 = v[i];
        const p2 = v[(i + 1) % v.length];
        const x1 = Array.isArray(p1) ? p1[0] : (p1.x || 0);
        const y1 = Array.isArray(p1) ? p1[1] : (p1.y || 0);
        const x2 = Array.isArray(p2) ? p2[0] : (p2.x || 0);
        const y2 = Array.isArray(p2) ? p2[1] : (p2.y || 0);
        sum += (x2 - x1) * (y2 + y1);
    }
    return sum > 0 ? [...v].reverse() : v;
};

const ExtrudedRoom = ({ room, height }) => {
    const shape = useMemo(() => {
        const s = new THREE.Shape();
        const raw_v = room.vertices || [];
        if (raw_v.length < 3) return null;

        const v = ensureClockwise(raw_v);

        v.forEach((pt, i) => {
            const x = Array.isArray(pt) ? pt[0] : (pt.x || 0);
            const y = Array.isArray(pt) ? pt[1] : (pt.y || 0);
            if (i === 0) s.moveTo(x, y);
            else s.lineTo(x, y);
        });
        s.closePath();
        return s;
    }, [room.vertices]);

    if (!shape) return null;

    return (
        <group rotation={[-Math.PI / 2, 0, 0]}>
            <mesh position={[0, 0, 0]} frustumCulled={false}>
                <extrudeGeometry args={[shape, { depth: height, bevelEnabled: false }]} />
                <meshBasicMaterial color="#00eaff" transparent opacity={0.25} side={THREE.DoubleSide} />
                <Edges color="#00eaff" />
            </mesh>
            <Html position={[room.x, room.y, height + 1]} center>
                <div style={{
                    color: '#00eaff', fontSize: '9px', fontWeight: 900, whiteSpace: 'nowrap',
                    background: 'rgba(7,13,31,0.9)', padding: '2px 8px', borderRadius: '4px',
                    border: '1px solid #00eaff', pointerEvents: 'none', boxShadow: '0 0 10px rgba(0,234,255,0.4)'
                }}>
                    {room.name}
                </div>
            </Html>
        </group>
    );
};

const ScanEffect = ({ totalHeight }) => {
    const meshRef = useRef();
    useFrame((state) => {
        if (meshRef.current) {
            const time = state.clock.getElapsedTime();
            const progress = (time % 4) / 4;
            meshRef.current.position.y = progress * totalHeight;
            meshRef.current.material.opacity = (1 - progress) * 0.4;
        }
    });

    return (
        <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[200, 200]} />
            <meshBasicMaterial color="#00eaff" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
        </mesh>
    );
};

const SiteBoundaryLine = ({ vertices }) => {
    const points = useMemo(() => {
        return vertices.map(v => new THREE.Vector3(v[0], 0, v[1]));
    }, [vertices]);

    return (
        <line>
            <bufferGeometry attach="geometry" setFromPoints={points} />
            <lineDashedMaterial
                color="#00eaff"
                dashSize={1}
                gapSize={0.5}
                opacity={0.4}
                transparent
            />
        </line>
    );
};

export default HolographicViewer;
