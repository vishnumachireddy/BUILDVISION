import React, { useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Html, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { disposeScene, calculateCombinedBoundingBox, normalizeFloorConfig } from '../utils/GeometryUtils';

const HolographicViewerData = ({ layout, layouts, floors, configMode, roomModes, manualInputs }) => {
    const wallHeight = 10;

    // 1. Normalize floor configuration
    const floorConfig = useMemo(() =>
        normalizeFloorConfig(layout, layouts, floors, configMode, roomModes, manualInputs),
        [layout, layouts, floors, configMode, roomModes, manualInputs]
    );

    // 2. Calculate combined bounding box for centering
    const { center, size } = useMemo(() =>
        calculateCombinedBoundingBox(floorConfig.map(f => f.layout), layout, floors, wallHeight),
        [floorConfig, layout, floors]
    );

    const masterGroupRef = useRef();

    // 3. Strict disposal on every layout change
    useEffect(() => {
        return () => {
            if (masterGroupRef.current) {
                disposeScene(masterGroupRef.current);
            }
        };
    }, [floorConfig]);

    const hasGeometry = floorConfig.some(f => f.layout?.rooms?.length > 0);

    if (!hasGeometry) {
        return (
            <Html center>
                <div style={{ color: '#ff4444', fontWeight: 900, textAlign: 'center', background: 'rgba(0,0,0,0.8)', padding: '20px', borderRadius: '12px', border: '1px solid #ff4444' }}>
                    ⚠️ GEOMETRY ERROR
                </div>
            </Html>
        );
    }

    return (
        <>
            <ambientLight intensity={1.5} />
            <Grid args={[500, 500]} position={[0, -0.01, 0]} cellSize={10} sectionSize={50} sectionColor="#00eaff" cellColor="#004488" infiniteGrid />
            <OrbitControls makeDefault target={[0, (floors * wallHeight) / 2, 0]} enablePan={true} enableZoom={true} />

            <group ref={masterGroupRef} position={[-center.x, 0, -center.z]}>
                {floorConfig.map((floor, floorIdx) => (
                    <group key={`floor-${floorIdx}-${floor.layoutType}`} position={[0, floorIdx * wallHeight, 0]}>
                        {floor.layout?.rooms?.map((room, idx) => (
                            <ExtrudedRoom key={`${floorIdx}-${idx}-${room.name}`} room={room} height={wallHeight} />
                        ))}
                    </group>
                ))}
                <ScanEffect totalHeight={wallHeight * floors} />
            </group>
        </>
    );
};

const HolographicViewer = ({ layout, layouts, floors = 1, configMode, roomModes, manualInputs }) => {

    return (
        <div style={{ height: '100%', width: '100%', borderRadius: '32px', overflow: 'hidden', position: 'relative', background: '#070d1f' }}>
            <Canvas camera={{ position: [1.5 * floors * 10, floors * 10 + 50, 1.5 * floors * 10], fov: 35 }}>
                <HolographicViewerData
                    layout={layout}
                    layouts={layouts}
                    floors={floors}
                    configMode={configMode}
                    roomModes={roomModes}
                    manualInputs={manualInputs}
                />
            </Canvas>

            <div style={{ position: 'absolute', top: 32, left: 32, display: 'flex', gap: '12px' }}>
                <div style={{ background: '#00eaff', color: '#000', padding: '6px 14px', borderRadius: '12px', fontSize: '11px', fontWeight: 900 }}>HOLOGRAPHIC GEOMETRY STREAM V2.2.0</div>
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
