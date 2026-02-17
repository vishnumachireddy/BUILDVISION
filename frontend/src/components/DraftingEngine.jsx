import React, { useMemo, useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, Edges } from '@react-three/drei';
import { disposeScene, calculateCombinedBoundingBox, normalizeFloorConfig } from '../utils/GeometryUtils';

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

const SceneContent = ({ floorConfig, floors, wallHeight }) => {
    // 1. Calculate combined bounding box for centering
    const { center, size } = useMemo(() =>
        calculateCombinedBoundingBox(floorConfig.map(f => f.layout), floorConfig[0]?.layout, floors, wallHeight),
        [floorConfig, floors]
    );

    const masterGroupRef = useRef();

    // 2. Strict disposal
    useEffect(() => {
        return () => {
            if (masterGroupRef.current) disposeScene(masterGroupRef.current);
        };
    }, [floorConfig]);

    return (
        <>
            <PerspectiveCamera makeDefault position={[100, 100, 100]} fov={40} />
            <ambientLight intensity={0.6} />
            <Grid
                args={[1000, 1000]}
                position={[0, -0.01, 0]}
                sectionColor="#1e293b"
                cellColor="#0f172a"
                infiniteGrid
                fadeDistance={500}
            />
            <OrbitControls
                makeDefault
                target={[0, (floors * wallHeight) / 2, 0]}
                enablePan={true}
                enableZoom={true}
            />

            <group ref={masterGroupRef} position={[-center.x, 0, -center.z]}>
                {floorConfig.map((floor, floorIdx) => (
                    <group key={`floor-${floorIdx}-${floor.layoutType}`} position={[0, floorIdx * wallHeight, 0]}>
                        {floor.layout?.rooms?.map((room, idx) => {
                            const typeKey = getColorKey(room.name);
                            const color = ROOM_COLORS[typeKey];

                            const shape = new THREE.Shape();
                            const vertices = room.vertices || [];
                            if (vertices.length < 3) return null;

                            shape.moveTo(vertices[0][0], vertices[0][1]);
                            for (let i = 1; i < vertices.length; i++) shape.lineTo(vertices[i][0], vertices[i][1]);
                            shape.closePath();

                            return (
                                <group key={idx} rotation={[-Math.PI / 2, 0, 0]}>
                                    <mesh frustumCulled={false}>
                                        <extrudeGeometry args={[shape, { depth: wallHeight, bevelEnabled: false }]} />
                                        <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.DoubleSide} />
                                        <Edges color={color} threshold={15} />
                                    </mesh>
                                </group>
                            );
                        })}
                    </group>
                ))}
            </group>
        </>
    );
};

const DraftingEngine = ({ layout, layouts, floors = 1, configMode, roomModes, manualInputs }) => {
    const floorConfig = useMemo(() =>
        normalizeFloorConfig(layout, layouts, floors, configMode, roomModes, manualInputs),
        [layout, layouts, floors, configMode, roomModes, manualInputs]
    );

    // 1. Generate unique room types for the legend
    const activeRoomTypes = useMemo(() => {
        const types = new Set();
        floorConfig.forEach(f => {
            f.layout?.rooms?.forEach(r => types.add(getColorKey(r.name)));
        });
        return Array.from(types).map(type => ({
            label: type.charAt(0).toUpperCase() + type.slice(1),
            color: ROOM_COLORS[type]
        }));
    }, [floorConfig]);

    // 2. Extract detailed measurements per floor
    const dimensionalData = useMemo(() => {
        return floorConfig.map((f, fIdx) => {
            const floorRooms = f.layout?.rooms?.map(room => {
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
            }) || [];
            return { index: fIdx, rooms: floorRooms };
        });
    }, [floorConfig]);

    if (!layout || !layout.rooms) return (
        <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b1221', color: '#00ffff' }}>
            AWATING PROJECT DATA...
        </div>
    );

    return (
        <div style={{ height: '100%', width: '100%', background: '#0b1221', position: 'relative' }}>
            <Canvas gl={{ antialias: true }}>
                <SceneContent floorConfig={floorConfig} floors={floors} wallHeight={10} />
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
