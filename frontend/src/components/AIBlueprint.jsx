import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, FileImage, Cpu, CheckCircle, AlertCircle, Loader2, Sparkles, Box } from 'lucide-react';
import { API_BASE_URL } from '../config';

const AIBlueprint = ({ onAnalysisComplete }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setResult(null);
        }
    };

    const analyzeSketch = async () => {
        if (!file) return;
        setAnalyzing(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(`${API_BASE_URL}/api/sketch/analyze`, formData);
            setResult(response.data);
            if (onAnalysisComplete) onAnalysisComplete(response.data);
        } catch (error) {
            console.error("Sketch analysis failed:", error);
            alert("Analysis failed. Please check backend connection and image quality.");
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                padding: '40px', borderRadius: '32px', border: '1px solid #334155',
                display: 'flex', flexDirection: 'column', gap: '32px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ color: 'white', fontSize: '28px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Sparkles className="text-blue-400" /> Sketch-to-Blueprint AI
                        </h2>
                        <p style={{ color: '#94a3b8', marginTop: '8px' }}>Upload your hand-drawn pencil floor plan and let AI convert it to a digital blueprint.</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                    {/* Upload Zone */}
                    <div
                        onClick={() => fileInputRef.current.click()}
                        style={{
                            border: '2px dashed #334155', borderRadius: '24px', padding: '48px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            gap: '16px', cursor: 'pointer', transition: 'all 0.2s',
                            background: preview ? 'transparent' : 'rgba(30, 41, 59, 0.4)'
                        }}
                        onMouseOver={e => e.currentTarget.style.borderColor = '#3b82f6'}
                        onMouseOut={e => e.currentTarget.style.borderColor = '#334155'}
                    >
                        {preview ? (
                            <img src={preview} alt="Sketch Preview" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
                        ) : (
                            <>
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                                    <Upload size={32} />
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ color: 'white', fontWeight: 700 }}>Choose Sketch Image</div>
                                    <div style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>PNG, JPG supported (Max 10MB)</div>
                                </div>
                            </>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} hidden accept="image/*" />
                    </div>

                    {/* Controls & Results */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '24px', padding: '32px', border: '1px solid #1e293b', flex: 1 }}>
                            <h3 style={{ color: 'white', margin: '0 0 20px', fontSize: '18px' }}>Analysis Engine</h3>

                            {!result && (
                                <button
                                    onClick={analyzeSketch}
                                    disabled={!file || analyzing}
                                    style={{
                                        width: '100%', padding: '16px', borderRadius: '16px', border: 'none',
                                        background: analyzing ? '#1e293b' : '#3b82f6', color: 'white', fontWeight: 800,
                                        cursor: file && !analyzing ? 'pointer' : 'not-allowed', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: '0 10px 20px rgba(59,130,246,0.3)'
                                    }}
                                >
                                    {analyzing ? <Loader2 className="animate-spin" /> : <Cpu />}
                                    {analyzing ? 'PROCESSING CV FILTERS...' : 'ANALYZE SKETCH'}
                                </button>
                            )}

                            {result && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981', fontWeight: 700 }}>
                                        <CheckCircle size={20} /> Analysis Successful
                                    </div>
                                    {result.raw_text.includes("OCR unavailable") && (
                                        <div style={{ background: '#f59e0b15', border: '1px solid #f59e0b30', padding: '12px', borderRadius: '12px', fontSize: '12px', color: '#f59e0b' }}>
                                            <span style={{ fontWeight: 700 }}>Note:</span> OCR engine bypassed. Using structural geometry for room identification.
                                        </div>
                                    )}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div style={{ background: '#1e293b', padding: '16px', borderRadius: '16px' }}>
                                            <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Detected Rooms</div>
                                            <div style={{ color: 'white', fontSize: '24px', fontWeight: 800 }}>{result.metrics.detected_rooms}</div>
                                        </div>
                                        <div style={{ background: '#1e293b', padding: '16px', borderRadius: '16px' }}>
                                            <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Est. Area</div>
                                            <div style={{ color: 'white', fontSize: '24px', fontWeight: 800 }}>{Math.round(result.metrics.total_area_sqft)} <span style={{ fontSize: '14px', color: '#94a3b8' }}>sqft</span></div>
                                        </div>
                                    </div>
                                    <div style={{ background: '#1e293b', padding: '16px', borderRadius: '16px' }}>
                                        <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px' }}>Log Output</div>
                                        <div style={{ color: '#94a3b8', fontSize: '12px', fontFamily: 'monospace', maxHeight: '60px', overflowY: 'auto' }}>
                                            {result.raw_text}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => window.location.hash = '#3d'}
                                        style={{
                                            width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid #3b82f6',
                                            background: 'transparent', color: '#3b82f6', fontWeight: 700, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                                        }}
                                    >
                                        <Box size={18} /> VIEW 3D SEMANTIC MESH
                                    </button>
                                </div>
                            )}


                            {!file && !analyzing && (
                                <div style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
                                    <AlertCircle size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                                    <p style={{ fontSize: '14px' }}>Please upload a clear sketch to begin analysis.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {result && (
                <div style={{ background: 'white', borderRadius: '32px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '24px' }}>Detected Structural Components</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #f1f5f9', textAlign: 'left' }}>
                                    <th style={{ padding: '16px', color: '#64748b', fontSize: '13px' }}>ROOM NAME</th>
                                    <th style={{ padding: '16px', color: '#64748b', fontSize: '13px' }}>DIMENSIONS</th>
                                    <th style={{ padding: '16px', color: '#64748b', fontSize: '13px' }}>AREA</th>
                                    <th style={{ padding: '16px', color: '#64748b', fontSize: '13px' }}>CONFIDENCE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {result.rooms.map((room, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                                        <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: 12, height: 12, borderRadius: '4px', background: room.color }}></div>
                                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{room.name}</span>
                                        </td>
                                        <td style={{ padding: '16px', color: '#64748b', fontSize: '14px' }}>{room.width_ft}' × {room.length_ft}'</td>
                                        <td style={{ padding: '16px', fontWeight: 700, color: '#0f172a' }}>{Math.round(room.width_ft * room.length_ft)} <span style={{ fontSize: '11px', color: '#94a3b8' }}>sqft</span></td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ width: '60px', height: '6px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                                                <div style={{ width: '85%', height: '100%', background: '#10b981' }}></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIBlueprint;
