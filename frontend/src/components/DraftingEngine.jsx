import React, { useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, OrthographicCamera } from '@react-three/drei';

/**
 * V6.3 Dimensional Analysis HUD
 * Features:
 * 1. Room-specific measurements in bottom-left corner
 * 2. Floor-grouped listing
 * 3. Professional desaturated vector colors
 * 4. Absolute world centering
 */

const ROOM_COLORS = {
    living: "#3b82f6", // Blue
    master: "#10b981", // Green
    bedroom: "#8b5cf6", // Purple
    kitchen: "#f59e0b", // Amber
    dining: "#ec4899", // Pink
    bath: "#06b6d4",   // Cyan
    balcony: "#64748b",// Slate
    other: "#94a3b8"   // Gray
};

const getColorKey = (type) => {
    if (!type) return 'other';
    const t = type.toLowerCase();
    if (t.includes('living') || t.includes('hall') || t.includes('grand')) return 'living';
    if (t.includes('master')) return 'master';
    if (t.includes('bedroom') || t.includes('bed')) return 'bedroom';
    if (t.includes('kitchen')) return 'kitchen';
    if (t.includes('dining')) return 'dining';
    if (t.includes('bath') || t.includes('toilet')) return 'bath';
    if (t.includes('balcony') || t.includes('deck')) return 'balcony';
    return 'other';
};

const SceneContent = ({ layout, floorCount = 1 }) => {
    const [drawIndex, setDrawIndex] = useState(0);

    const { edgeSegments, totalLines } = useMemo(() => {
        if (!layout || !layout.rooms) return { edgeSegments: [], totalLines: 0 };

        const rooms = layout.rooms;
        const floorHeight = 10;
        const wallHeight = 10;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        rooms.forEach(r => {
            r.vertices?.forEach(v => {
                minX = Math.min(minX, v[0]); minY = Math.min(minY, v[1]);
                maxX = Math.max(maxX, v[0]); maxY = Math.max(maxY, v[1]);
            });
        });
        const cX = (minX + maxX) / 2;
        const cZ = (minY + maxY) / 2;

        const allSegments = [];

        for (let f = 0; f < floorCount; f++) {
            const yOffset = f * floorHeight;

            rooms.forEach((room) => {
                const typeKey = getColorKey(room.name);
                const color = ROOM_COLORS[typeKey];

                const shape = new THREE.Shape();
                const vertices = room.vertices || [];
                if (vertices.length < 3) return;

                shape.moveTo(vertices[0][0], vertices[0][1]);
                for (let i = 1; i < vertices.length; i++) shape.lineTo(vertices[i][0], vertices[i][1]);
                shape.closePath();

                const geometry = new THREE.ExtrudeGeometry(shape, { depth: wallHeight, bevelEnabled: false });
                const edges = new THREE.EdgesGeometry(geometry);
                const posAttr = edges.attributes.position;

                for (let i = 0; i < posAttr.count; i += 2) {
                    const p1 = new THREE.Vector3().fromBufferAttribute(posAttr, i);
                    const p2 = new THREE.Vector3().fromBufferAttribute(posAttr, i + 1);

                    allSegments.push({
                        points: [
                            [p1.x - cX, p1.z + yOffset, p1.y - cZ],
                            [p2.x - cX, p2.z + yOffset, p2.y - cZ]
                        ],
                        color: color
                    });
                }
            });
        }

        return { edgeSegments: allSegments, totalLines: allSegments.length };
    }, [layout]);

    useEffect(() => { setDrawIndex(0); }, [layout]);

    useFrame(() => {
        if (drawIndex < totalLines) {
            const speed = Math.max(8, Math.floor(totalLines / 100));
            setDrawIndex(prev => Math.min(prev + speed, totalLines));
        }
    });

    return (
        <>
            <OrthographicCamera makeDefault position={[60, 60, 60]} zoom={22} />
            <ambientLight intensity={0.6} />
            <Grid
                args={[400, 400]}
                position={[0, -0.01, 0]}
                sectionColor="#1e293b"
                cellColor="#0f172a"
                infiniteGrid
                fadeDistance={250}
            />
            <OrbitControls
                makeDefault
                target={[0, 0, 0]}
                maxPolarAngle={Math.PI / 2.1}
            />

            <group>
                {edgeSegments.slice(0, drawIndex).map((seg, idx) => (
                    <line key={`line-${idx}`}>
                        <bufferGeometry
                            attach="geometry"
                            onUpdate={self => self.setFromPoints([new THREE.Vector3(...seg.points[0]), new THREE.Vector3(...seg.points[1])])}
                        />
                        <lineBasicMaterial
                            attach="material"
                            color={seg.color}
                            linewidth={1.5}
                            transparent
                            opacity={0.9}
                        />
                    </line>
                ))}
            </group>
        </>
    );
};

const DraftingEngine = ({ layout, floors = 1 }) => {
    const floorCount = (layout && layout.floor_count > 1) ? layout.floor_count : floors;

    // 1. Generate unique room types for the legend
    const activeRoomTypes = useMemo(() => {
        if (!layout || !layout.rooms) return [];
        const types = new Set();
        layout.rooms.forEach(r => types.add(getColorKey(r.name)));
        return Array.from(types).map(type => ({
            label: type.charAt(0).toUpperCase() + type.slice(1),
            color: ROOM_COLORS[type]
        }));
    }, [layout]);

    // 2. Extract detailed measurements per floor
    const dimensionalData = useMemo(() => {
        if (!layout || !layout.rooms) return [];
        const floorCount = layout.floor_count || 1;
        const floors = [];

        for (let f = 0; f < floorCount; f++) {
            const floorRooms = layout.rooms.map(room => {
                // Calculate approximate width/length from vertices if not provided
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                room.vertices?.forEach(v => {
                    minX = Math.min(minX, v[0]); minY = Math.min(minY, v[1]);
                    maxX = Math.max(maxX, v[0]); maxY = Math.max(maxY, v[1]);
                });
                const w = Math.abs(maxX - minX);
                const l = Math.abs(maxY - minY);

                return {
                    name: room.name,
                    width: w.toFixed(1),
                    length: l.toFixed(1),
                    area: room.area_sqft,
                    color: ROOM_COLORS[getColorKey(room.name)]
                };
            });
            floors.push({ index: f, rooms: floorRooms });
        }
        return floors;
    }, [layout]);

    if (!layout || !layout.rooms) return (
        <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1221', color: '#00ffff' }}>
            AWATING PROJECT DATA...
        </div>
    );

    return (
        <div style={{ height: '100%', width: '100%', background: '#0b1221', position: 'relative' }}>
            <Canvas gl={{ antialias: true }}>
                <SceneContent layout={layout} floorCount={floorCount} />
            </Canvas>

            {/* Architectural HUD (Top-Left) */}
            <div style={{ position: 'absolute', top: 32, left: 32, pointerEvents: 'none' }}>
                <div style={{ background: '#00ffff', color: '#000', padding: '6px 14px', borderRadius: '4px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Architectural Vector Engine V6.3
                </div>
                <div style={{ marginTop: '12px', color: '#00ffff', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>
                    MODE: FULL DIMENSIONAL REVEAL<br />
                    STOREYS: {layout.floor_count || 1}
                </div>
            </div>

            {/* Spatial Legend Overlay (Top-Right) */}
            <div style={{
                position: 'absolute',
                top: 32,
                right: 32,
                background: 'rgba(15,23,42,0.85)',
                backdropFilter: 'blur(12px)',
                padding: '24px',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                minWidth: '200px'
            }}>
                <div style={{ fontSize: '11px', color: '#00eaff', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px' }}>Spatial Legend</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {activeRoomTypes.map((type, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ width: 14, height: 14, borderRadius: '4px', background: type.color }}></div>
                            <span style={{ color: 'white', fontSize: '13px', fontWeight: 700 }}>{type.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Dimensional Analysis HUD (Bottom-Left) */}
            <div style={{
                position: 'absolute',
                bottom: 32,
                left: 32,
                background: 'rgba(15,23,42,0.9)',
                backdropFilter: 'blur(16px)',
                padding: '28px',
                borderRadius: '28px',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
                width: '360px',
                maxHeight: '400px',
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(0,234,255,0.3) transparent'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ fontSize: '12px', color: '#00eaff', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2.5px' }}>Dimensional Analysis</div>
                    <div style={{ fontSize: '10px', color: 'rgba(0,234,255,0.5)', fontWeight: 700 }}>FEET/SQFT</div>
                </div>

                {dimensionalData.map((floor, fIdx) => (
                    <div key={fIdx} style={{ marginBottom: fIdx === dimensionalData.length - 1 ? 0 : '32px' }}>
                        <div style={{ fontSize: '11px', color: 'white', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: 6, height: 6, background: '#00eaff', borderRadius: '50%' }}></div>
                            {fIdx === 0 ? 'Ground Floor' : `Storey ${fIdx}`}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {floor.rooms.map((room, rIdx) => (
                                <div key={rIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '2px', background: room.color }}></div>
                                        <div style={{ color: 'white', fontSize: '13px', fontWeight: 700 }}>{room.name}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ color: '#00eaff', fontSize: '12px', fontWeight: 800 }}>{room.width}' × {room.length}'</div>
                                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: 700 }}>{room.area} SQFT</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ position: 'absolute', bottom: 32, right: 32, color: 'rgba(255,255,255,0.4)', fontSize: '9px', fontWeight: 700, letterSpacing: '2px' }}>
                CENTER COORDINATE: 0, 0, 0
            </div>
        </div>
    );
};

export default DraftingEngine;
