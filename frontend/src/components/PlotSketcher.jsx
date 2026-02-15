import React, { useState, useRef, useEffect } from 'react';
import { RotateCcw, PenTool, Check } from 'lucide-react';

const PlotSketcher = ({ onComplete, width = 300, height = 300 }) => {
    const [points, setPoints] = useState([]);
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const handleCanvasClick = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Add point
        setPoints(prev => [...prev, { x, y }]);
    };

    const handleReset = () => {
        setPoints([]);
        onComplete([]);
    };

    const handleFinish = () => {
        if (points.length < 3) return alert("Please draw at least 3 points to form a plot.");
        // Close the loop if not closed
        const finishedPoints = [...points, points[0]];
        onComplete(finishedPoints);
    };

    useEffect(() => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, width, height);

        // Draw grid
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= width; i += 20) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
        }

        if (points.length === 0) return;

        // Draw lines
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        points.forEach((p, i) => {
            if (i > 0) ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        // Draw points
        points.forEach((p, i) => {
            ctx.fillStyle = i === 0 ? '#10b981' : '#3b82f6';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

    }, [points, width, height]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative', background: '#f8fafc', borderRadius: '16px', border: '2px solid #e2e8f0', cursor: 'crosshair', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)' }}>
                <canvas
                    ref={canvasRef}
                    width={width}
                    height={height}
                    onClick={handleCanvasClick}
                />
                {points.length === 0 && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                        Click to start drawing your plot boundary...
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                <button onClick={handleReset} style={{ flex: 1, padding: '10px', borderRadius: '10px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
                    <RotateCcw size={16} /> Reset
                </button>
                <button onClick={handleFinish} style={{ flex: 1, padding: '10px', borderRadius: '10px', background: '#f0fdf4', color: '#10b981', border: '1px solid #dcfce7', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
                    <Check size={16} /> Done Drawing
                </button>
            </div>
        </div>
    );
};

export default PlotSketcher;
