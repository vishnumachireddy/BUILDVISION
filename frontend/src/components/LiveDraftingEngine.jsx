import React, { useRef, useEffect, useState, useMemo } from 'react';

const LiveDraftingEngine = ({ layout }) => {
    const canvasRef = useRef(null);
    const [progress, setProgress] = useState(0);
    const [stage, setStage] = useState(0); // 0: Boundary, 1: Partitions, 2: Rooms, 3: Details, 4: Dimensions/Labels

    const ROOMS = useMemo(() => {
        if (!layout || !layout.rooms) return [];

        // Normalize coordinates for the 800x600 canvas
        const padding = 100;
        const width = 800;
        const height = 600;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        // Simple grid layout to match the logic of previous components
        const cols = 2;
        const processed = [];
        let curX = 0, curY = 0, rowMaxY = 0;

        layout.rooms.forEach((room, idx) => {
            const w = room.width_ft * 10; // Scale 1ft = 10px approx
            const h = room.length_ft * 10;
            const col = idx % cols;
            if (col === 0 && idx > 0) {
                curY += rowMaxY + 20;
                rowMaxY = 0;
                curX = 0;
            }
            const x = curX;
            const y = curY;
            processed.push({ ...room, x, y, w, h });

            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + w);
            maxY = Math.max(maxY, y + h);

            curX += w + 20;
            rowMaxY = Math.max(rowMaxY, h);
        });

        const plotW = maxX - minX;
        const plotH = maxY - minY;
        const scale = Math.min((width - padding * 2) / plotW, (height - padding * 2) / plotH);

        const offsetX = (width - plotW * scale) / 2;
        const offsetY = (height - plotH * scale) / 2;

        return processed.map(r => ({
            ...r,
            cx: offsetX + (r.x - minX) * scale,
            cy: offsetY + (r.y - minY) * scale,
            cw: r.w * scale,
            ch: r.h * scale
        }));
    }, [layout]);

    const BOUNDARY = useMemo(() => {
        if (ROOMS.length === 0) return null;
        const minX = Math.min(...ROOMS.map(r => r.cx));
        const minY = Math.min(...ROOMS.map(r => r.cy));
        const maxX = Math.max(...ROOMS.map(r => r.cx + r.cw));
        const maxY = Math.max(...ROOMS.map(r => r.cy + r.ch));
        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }, [ROOMS]);

    useEffect(() => {
        let startTime;
        const duration = 4000; // 4 seconds total animation

        const animate = (time) => {
            if (!startTime) startTime = time;
            const elapsed = time - startTime;
            const p = Math.min(elapsed / duration, 1);

            setProgress(p);

            if (p < 0.2) setStage(0); // Boundary
            else if (p < 0.5) setStage(1); // Partitions
            else if (p < 0.7) setStage(2); // Room Rects
            else if (p < 0.9) setStage(3); // Details (Doors/Windows)
            else setStage(4); // Labels/Dimensions

            if (p < 1) {
                requestAnimationFrame(animate);
            }
        };

        const req = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(req);
    }, [layout]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        canvas.width = 800 * dpr;
        canvas.height = 600 * dpr;
        ctx.scale(dpr, dpr);

        const drawDraft = () => {
            ctx.clearRect(0, 0, 800, 600);

            // 0. Grid
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 0.5;
            for (let i = 0; i <= 800; i += 20) {
                ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 600); ctx.stroke();
            }
            for (let j = 0; j <= 600; j += 20) {
                ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(800, j); ctx.stroke();
            }

            if (!BOUNDARY) return;

            // 1. Outer Boundary (Stage 0)
            if (stage >= 0) {
                const p = Math.min(progress / 0.2, 1);
                ctx.strokeStyle = '#E6F0FF';
                ctx.lineWidth = 8;
                ctx.lineCap = 'square';

                const totalLen = (BOUNDARY.w * 2 + BOUNDARY.h * 2);
                const drawLen = totalLen * p;

                ctx.setLineDash([drawLen, totalLen]);
                ctx.strokeRect(BOUNDARY.x, BOUNDARY.y, BOUNDARY.w, BOUNDARY.h);
                ctx.setLineDash([]);
            }

            // 2. Partitions & Rooms (Stage 1 & 2)
            if (stage >= 1) {
                const p = Math.min((progress - 0.2) / 0.3, 1);
                ctx.strokeStyle = '#E6F0FF';
                ctx.lineWidth = 4;

                ROOMS.forEach(room => {
                    ctx.beginPath();
                    // Just draw internal lines that aren't the boundary
                    ctx.strokeRect(room.cx, room.cy, room.cw, room.ch);
                });
            }

            // 3. Details (Doors/Windows) (Stage 3)
            if (stage >= 3) {
                const p = Math.min((progress - 0.7) / 0.2, 1);
                ctx.globalAlpha = p;

                ROOMS.forEach(room => {
                    // Door Arc (simplified logic)
                    ctx.strokeStyle = '#00ffff';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(room.cx, room.cy, 20, 0, Math.PI / 2);
                    ctx.stroke();

                    // Window (blue double line)
                    ctx.strokeStyle = '#3b82f6';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.moveTo(room.cx + room.cw / 2 - 15, room.cy);
                    ctx.lineTo(room.cx + room.cw / 2 + 15, room.cy);
                    ctx.stroke();
                });
                ctx.globalAlpha = 1;
            }

            // 4. Dimensions & Labels (Stage 4)
            if (stage >= 4) {
                const p = Math.min((progress - 0.9) / 0.1, 1);
                ctx.globalAlpha = p;

                ctx.fillStyle = '#E6F0FF';
                ctx.font = 'bold 12px Outfit';
                ctx.textAlign = 'center';

                ROOMS.forEach(room => {
                    ctx.fillText(room.name, room.cx + room.cw / 2, room.cy + room.ch / 2);

                    // Dimensions
                    ctx.fillStyle = '#94a3b8';
                    ctx.font = '10px Outfit';
                    ctx.fillText(`${room.width_ft}' x ${room.length_ft}'`, room.cx + room.cw / 2, room.cy + room.ch / 2 + 15);
                });

                // Scale text
                ctx.fillStyle = '#94a3b8';
                ctx.font = 'bold 14px Outfit';
                ctx.textAlign = 'left';
                ctx.fillText('SCALE 1:100', 40, 560);

                ctx.globalAlpha = 1;
            }
        };

        drawDraft();
    }, [progress, stage, ROOMS, BOUNDARY]);

    return (
        <div style={{ width: '100%', height: '100%', background: '#0B1C2D', borderRadius: '32px', overflow: 'hidden', position: 'relative' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

            <div style={{ position: 'absolute', top: 32, left: 32, display: 'flex', gap: '8px' }}>
                <div style={{ background: '#3b82f6', color: 'white', padding: '6px 14px', borderRadius: '10px', fontSize: '11px', fontWeight: 900 }}>LIVE DRAFTING ACTIVE</div>
                <div style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '6px 14px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, border: '1px solid rgba(255,255,255,0.2)' }}>2D TECHNICAL</div>
            </div>
        </div>
    );
};

export default LiveDraftingEngine;
