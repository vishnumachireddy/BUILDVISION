import React, { useMemo, useEffect, useState } from 'react';

const BlueprintEngine = ({ layout, metrics }) => {
    const { rooms, renderedBoundary, scale, offset } = useMemo(() => {
        if (!layout || !layout.rooms || layout.rooms.length === 0) {
            return { rooms: [], renderedBoundary: null, scale: 1, offset: { x: 0, y: 0 } };
        }

        const padding = 60;
        const width = 800;
        const height = 600;

        // Calc Bounding Box for SVG viewport ONLY, no geometry shift
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        const pointsToScale = layout.site_boundary && layout.site_boundary.length > 0
            ? layout.site_boundary
            : layout.rooms.flatMap(r => r.vertices || []);

        if (pointsToScale.length === 0)
            return { rooms: layout.rooms, renderedBoundary: null, scale: 1, offset: { x: 0, y: 0 } };

        pointsToScale.forEach(v => {
            minX = Math.min(minX, v[0]);
            minY = Math.min(minY, v[1]);
            maxX = Math.max(maxX, v[0]);
            maxY = Math.max(maxY, v[1]);
        });

        const plotW = maxX - minX;
        const plotH = maxY - minY;

        const scaleX = (width - padding * 2) / (plotW || 1);
        const scaleY = (height - padding * 2) / (plotH || 1);
        const finalScale = Math.min(scaleX, scaleY);

        // offset to center the geometry in the SVG view area, but geometry points stay absolute
        const centerOffsetX = (width - plotW * finalScale) / 2 - minX * finalScale;
        const centerOffsetY = (height - plotH * finalScale) / 2 - minY * finalScale;

        return {
            rooms: layout.rooms,
            renderedBoundary: layout.site_boundary || [],
            scale: finalScale,
            offset: { x: centerOffsetX, y: centerOffsetY }
        };
    }, [layout]);

    if (!layout) return null;

    return (
        <div style={{ width: '100%', height: '100%', background: '#0b1220', borderRadius: '32px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
            <svg viewBox="0 0 800 600" style={{ width: '100%', height: '100%' }}>
                <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    </pattern>
                </defs>

                <rect width="800" height="600" fill="url(#grid)" />

                <g transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`}>
                    {renderedBoundary && renderedBoundary.length > 0 && (
                        <polygon
                            points={renderedBoundary.map(v => `${v[0]},${v[1]}`).join(' ')}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth={1 / scale * 2}
                            strokeDasharray={`${4 / scale} ${2 / scale}`}
                        />
                    )}
                    {rooms.map((room, i) => {
                        const pointsStr = room.vertices ? room.vertices.map(v => `${v[0]},${v[1]}`).join(' ') : "";

                        return (
                            <g key={i}>
                                <polygon
                                    points={pointsStr}
                                    fill="rgba(0, 255, 255, 0.08)"
                                    stroke="#00ffff"
                                    strokeWidth={0.5 / scale}
                                />

                                <g transform={`translate(${room.x}, ${room.y})`}>
                                    <text
                                        y="-0.5"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        style={{ fontSize: `${1.2 / scale * 10}px`, fill: '#fff', fontWeight: 900, textTransform: 'uppercase' }}
                                    >
                                        {room.name}
                                    </text>
                                    <text
                                        y="0.8"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        style={{ fill: '#00ffff', fontSize: `${0.8 / scale * 10}px`, fontWeight: 700 }}
                                    >
                                        {room.area_sqft.toFixed(1)} SQ FT
                                    </text>
                                </g>
                            </g>
                        );
                    })}
                </g>

                <g transform="translate(740, 60)">
                    <circle r="20" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                    <text y="-25" textAnchor="middle" fill="white" style={{ fontSize: '10px', fontWeight: 800 }}>N</text>
                    <path d="M 0 -15 L 5 5 L 0 0 L -5 5 Z" fill="#00ffff" />
                </g>

                <text x="40" y="560" fill="rgba(255,255,255,0.5)" style={{ fontSize: '12px', fontWeight: 700 }}>
                    SCALE 1:100 | ABSOLUTE SYNC V2.3
                </text>
            </svg>

            <div style={{ position: 'absolute', top: 32, left: 32, display: 'flex', gap: '8px' }}>
                <div style={{ background: '#00ffff', color: '#000', padding: '6px 14px', borderRadius: '10px', fontSize: '11px', fontWeight: 900 }}>GEOMETRY SYNC ACTIVE</div>
                <div style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '6px 14px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, border: '1px solid rgba(255,255,255,0.2)' }}>BIM 1:1</div>
            </div>
        </div>
    );
};

export default BlueprintEngine;
