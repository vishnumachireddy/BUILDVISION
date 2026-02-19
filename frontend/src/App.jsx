import { useState, useMemo, useEffect, useCallback } from 'react'
import MapComponent from './components/MapComponent'
import DraftingEngine from './components/DraftingEngine'
import Blueprint3DWrapper from './components/Blueprint3DWrapper'
import AIBlueprint from './components/AIBlueprint'
import LiveDraftingEngine from './components/LiveDraftingEngine'
import HolographicViewer from './components/HolographicViewer'
import BlueprintEngine from './components/BlueprintEngine'
import ParametricPanel from './components/ParametricPanel'
import SoilAdvisoryPanel from './components/SoilAdvisoryPanel'
import LandingPage from './landing/pages/Index'
import axios from 'axios'
import { API_BASE_URL } from './config'
import {
    Ruler, Calculator, Home, Hammer, Banknote, Layers, Box, FileText,
    Menu, X, ChevronRight, TrendingUp, Package, Shield, Info, Download,
    User, LogOut, Settings as SettingsIcon, Globe, Sparkles, Lock, MapPin, Cpu
} from 'lucide-react'

// --- Restoration: Shared Components ---

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div style={{
        background: 'white', padding: '24px', borderRadius: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9',
        display: 'flex', flexDirection: 'column', gap: '12px', transition: 'transform 0.2s',
        cursor: 'default'
    }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ padding: '10px', borderRadius: '12px', background: `${color}15`, color: color }}>
                <Icon size={24} />
            </div>
            {trend && <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600, background: '#f0fdf4', padding: '4px 8px', borderRadius: '20px' }}>{trend}</span>}
        </div>
        <div>
            <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>{title}</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{value}</div>
        </div>
    </div>
);

const MaterialCard = ({ name, amount, unit, icon, color }) => (
    <div style={{
        background: 'white', padding: '20px', borderRadius: '16px',
        border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '16px'
    }}>
        <div style={{ fontSize: '24px' }}>{icon}</div>
        <div style={{ flex: 1 }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{name}</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{amount} <span style={{ fontSize: '12px', color: '#94a3b8' }}>{unit}</span></div>
        </div>
        <div style={{ width: '4px', height: '32px', borderRadius: '2px', background: color }}></div>
    </div>
);

// --- Shared Components ---

const ROOM_COLORS = {
    living: "#A8D8F0",
    master: "#BEE5C8",
    bedroom: "#D6F5E3",
    kitchen: "#FFE2B8",
    dining: "#FFF1C1",
    bath: "#E3D7FF",
    balcony: "#E6E6E6",
    other: "#F0F0F0"
};

const ThreeDLegend = ({ rooms }) => {
    const uniqueRoomTypes = useMemo(() => {
        const types = new Set();
        rooms.forEach(r => {
            const t = r.name.toLowerCase();
            let key = 'other';
            if (t.includes('living') || t.includes('hall') || t.includes('grand')) key = 'living';
            else if (t.includes('master')) key = 'master';
            else if (t.includes('bedroom') || t.includes('bed')) key = 'bedroom';
            else if (t.includes('kitchen')) key = 'kitchen';
            else if (t.includes('dining')) key = 'dining';
            else if (t.includes('bath') || t.includes('toilet')) key = 'bath';
            else if (t.includes('balcony') || t.includes('deck')) key = 'balcony';
            types.add(key);
        });
        return Array.from(types);
    }, [rooms]);

    return (
        <div style={{
            position: 'absolute', top: 24, right: 24, background: 'rgba(15,23,42,0.85)',
            padding: '24px', borderRadius: '24px', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)', color: 'white', width: '220px',
            zIndex: 100, boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
        }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#00eaff', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '1.5px' }}>Spatial Legend</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {uniqueRoomTypes.map((type, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                        <div style={{
                            width: 14, height: 14, borderRadius: '4px',
                            background: ROOM_COLORS[type],
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}></div>
                        <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{type === 'living' ? 'Grand Hall' : type}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const LoadingOverlay = () => (
    <div style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)',
        backdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px'
    }}>
        <div style={{
            width: '60px', height: '60px', border: '4px solid #3b82f6',
            borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'
        }}></div>
        <div style={{ color: 'white', fontWeight: 700, fontSize: '18px', letterSpacing: '1px' }}>PROCESSING SITE DATA...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
);
function App() {
    const [polygonCoords, setPolygonCoords] = useState([]);
    const [projectData, setProjectData] = useState(null);
    const [sketchData, setSketchData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [numFloors, setNumFloors] = useState(1);
    const [activeFloorIndex, setActiveFloorIndex] = useState(0);
    const [floorConfigMode, setFloorConfigMode] = useState('SAME'); // 'SAME' or 'CUSTOM'
    const [floorLayouts, setFloorLayouts] = useState({});
    const [editingFloorIndex, setEditingFloorIndex] = useState(0);
    const [floorRoomModes, setFloorRoomModes] = useState({ 0: 'BASE' }); // { floorIdx: 'BASE' | 'MANUAL' }
    const [floorManualInputs, setFloorManualInputs] = useState({}); // { floorIdx: { bedrooms, bathrooms, ... } }

    const renderFloorOptions = () => {
        if (numFloors <= 1) return null;
        return (
            <div style={{
                margin: '0 0 24px',
                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                padding: '24px',
                borderRadius: '24px',
                color: 'white',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderRight: '1px solid rgba(255,255,255,0.2)', paddingRight: '20px' }}>
                            <span style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '1px', opacity: 0.8 }}>FLOOR CONFIGURATION MODE:</span>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>
                                    <input type="radio" checked={floorConfigMode === 'SAME'} onChange={() => setFloorConfigMode('SAME')} /> Same
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}>
                                    <input type="radio" checked={floorConfigMode === 'CUSTOM'} onChange={() => {
                                        setFloorConfigMode('CUSTOM');
                                        if (!floorLayouts[0]) setFloorLayouts({ 0: JSON.parse(JSON.stringify(projectData.layout_plan)) });
                                    }} /> Customize
                                </label>
                            </div>
                        </div>

                        {floorConfigMode === 'CUSTOM' && (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderRight: '1px solid rgba(255,255,255,0.2)', paddingRight: '20px' }}>
                                    <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '1px', opacity: 0.8 }}>EDITING:</span>
                                    <select
                                        value={editingFloorIndex}
                                        onChange={(e) => {
                                            const idx = parseInt(e.target.value);
                                            setEditingFloorIndex(idx);
                                            if (!floorRoomModes[idx]) setFloorRoomModes(prev => ({ ...prev, [idx]: 'BASE' }));
                                        }}
                                        style={{ padding: '4px 12px', borderRadius: '10px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 700, fontSize: '12px' }}
                                    >
                                        {Array.from({ length: numFloors }, (_, i) => <option key={i} value={i} style={{ color: 'black' }}>Floor {i}</option>)}
                                    </select>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '1px', opacity: 0.8 }}>ROOM CONFIG FOR FLOOR {editingFloorIndex}:</span>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 700, cursor: editingFloorIndex === 0 ? 'not-allowed' : 'pointer', opacity: editingFloorIndex === 0 ? 0.5 : 1 }}>
                                            <input type="radio" disabled={editingFloorIndex === 0} checked={(floorRoomModes[editingFloorIndex] || 'BASE') === 'BASE'} onChange={() => setFloorRoomModes(prev => ({ ...prev, [editingFloorIndex]: 'BASE' }))} /> Base Plan
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 700, cursor: editingFloorIndex === 0 ? 'not-allowed' : 'pointer', opacity: editingFloorIndex === 0 ? 0.5 : 1 }}>
                                            <input type="radio" disabled={editingFloorIndex === 0} checked={floorRoomModes[editingFloorIndex] === 'MANUAL'} onChange={() => setFloorRoomModes(prev => ({ ...prev, [editingFloorIndex]: 'MANUAL' }))} /> Manual Select
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', opacity: 0.8 }}>ACTIVE VIEW:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '12px' }}>
                            <button onClick={() => setActiveFloorIndex(Math.max(0, activeFloorIndex - 1))} style={{ width: 24, height: 24, borderRadius: '6px', background: 'white', border: 'none', cursor: 'pointer', color: '#1e293b', fontWeight: 900 }}>-</button>
                            <span style={{ fontSize: '14px', fontWeight: 800, minWidth: '20px', textAlign: 'center' }}>{activeFloorIndex + 1}</span>
                            <button onClick={() => setActiveFloorIndex(Math.min(numFloors - 1, activeFloorIndex + 1))} style={{ width: 24, height: 24, borderRadius: '6px', background: 'white', border: 'none', cursor: 'pointer', color: '#1e293b', fontWeight: 900 }}>+</button>
                        </div>
                    </div>
                </div>

                {floorConfigMode === 'CUSTOM' && floorRoomModes[editingFloorIndex] === 'MANUAL' && (
                    <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '9px', fontWeight: 900, opacity: 0.7 }}>BEDROOMS</label>
                            <select
                                value={floorManualInputs[editingFloorIndex]?.bedrooms || 2}
                                onChange={(e) => setFloorManualInputs(prev => ({ ...prev, [editingFloorIndex]: { ...(prev[editingFloorIndex] || {}), bedrooms: parseInt(e.target.value) } }))}
                                style={{ padding: '8px 12px', borderRadius: '12px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 700, fontSize: '13px' }}
                            >
                                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n} style={{ color: 'black' }}>{n} BHK</option>)}
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '9px', fontWeight: 900, opacity: 0.7 }}>BATHROOMS</label>
                            <select
                                value={floorManualInputs[editingFloorIndex]?.bathrooms || 1}
                                onChange={(e) => setFloorManualInputs(prev => ({ ...prev, [editingFloorIndex]: { ...(prev[editingFloorIndex] || {}), bathrooms: parseInt(e.target.value) } }))}
                                style={{ padding: '8px 12px', borderRadius: '12px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 700, fontSize: '13px' }}
                            >
                                {[1, 2, 3, 4].map(n => <option key={n} value={n} style={{ color: 'black' }}>{n} Bath</option>)}
                            </select>
                        </div>
                        {['kitchen', 'living', 'dining', 'balcony', 'parking'].map(feature => (
                            <label key={feature} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: 700, background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <input
                                    type="checkbox"
                                    checked={floorManualInputs[editingFloorIndex]?.[feature] ?? (feature === 'kitchen' || feature === 'living')}
                                    onChange={(e) => setFloorManualInputs(prev => ({ ...prev, [editingFloorIndex]: { ...(prev[editingFloorIndex] || {}), [feature]: e.target.checked } }))}
                                /> {feature.toUpperCase()}
                            </label>
                        ))}
                        <button
                            onClick={() => handleFloorLayoutGenerate(editingFloorIndex)}
                            style={{ marginLeft: 'auto', padding: '12px 28px', borderRadius: '14px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 15px rgba(59,130,246,0.4)' }}
                        >
                            UPDATE FLOOR {editingFloorIndex}
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const recalculateAggregatedBOQ = (allFloorLayouts, baseProjectData, floors) => {
        if (!baseProjectData) return null;
        const aggregatedData = JSON.parse(JSON.stringify(baseProjectData));

        // Reset metrics to 0 for summing
        Object.keys(aggregatedData.material_estimate).forEach(k => aggregatedData.material_estimate[k] = 0);
        Object.keys(aggregatedData.cost_estimate).forEach(k => {
            if (typeof aggregatedData.cost_estimate[k] === 'number') aggregatedData.cost_estimate[k] = 0;
        });
        aggregatedData.area_metrics.total_area = 0;

        for (let i = 0; i < floors; i++) {
            const currentRoomMode = floorRoomModes[i] || 'BASE';
            const floorData = (floorConfigMode === 'CUSTOM' && currentRoomMode === 'MANUAL')
                ? (allFloorLayouts[i] || baseProjectData)
                : baseProjectData;

            if (floorData) {
                Object.keys(aggregatedData.material_estimate).forEach(k => {
                    aggregatedData.material_estimate[k] += floorData.material_estimate?.[k] || 0;
                });
                Object.keys(aggregatedData.cost_estimate).forEach(k => {
                    if (typeof aggregatedData.cost_estimate[k] === 'number') {
                        aggregatedData.cost_estimate[k] += floorData.cost_estimate?.[k] || 0;
                    }
                });
                aggregatedData.area_metrics.total_area += floorData.area_metrics?.total_area || 0;
                aggregatedData.area_metrics.buildable_area_sqft += floorData.area_metrics?.buildable_area_sqft || 0;
            }
        }
        return aggregatedData;
    };

    const handleFloorLayoutGenerate = async (floorIdx) => {
        if (!projectData || floorIdx === 0) return;
        setLoading(true);
        try {
            const inputs = floorManualInputs[floorIdx] || {
                bedrooms: 2,
                bathrooms: 1,
                kitchen: true,
                living: true,
                dining: false,
                balcony: false,
                parking: false
            };

            const response = await axios.post(`${API_BASE_URL}/api/generate-parametric-plan`, {
                ...inputs,
                floors: 1, // Generating single floor layout
                coordinates: projectData.area_metrics.vertices // Reuse base coordinates
            });

            const newFloorLayouts = { ...floorLayouts, [floorIdx]: response.data };
            setFloorLayouts(newFloorLayouts);

            const aggregatedData = recalculateAggregatedBOQ(newFloorLayouts, projectData, numFloors);
            setProjectData(aggregatedData);
        } catch (error) {
            setErrorMessage(`Floor Generation Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Ensure active floor index stays within bounds when floor count changes
    useEffect(() => {
        if (activeFloorIndex >= numFloors) {
            setActiveFloorIndex(Math.max(0, numFloors - 1));
        }
    }, [numFloors]);
    const [user, setUser] = useState(null);
    const [showAuth, setShowAuth] = useState(false);
    const [projectStage, setProjectStage] = useState(0);
    const [errorMessage, setErrorMessage] = useState(null);
    const [layoutMode, setLayoutMode] = useState('AI'); // 'AI' or 'Manual'
    const [showSplash, setShowSplash] = useState(true);

    const handleSketchAnalysis = (data) => {
        const normalizedRooms = data.rooms.map(room => {
            const w = room.width_ft || 10;
            const l = room.length_ft || 10;
            const x = room.position?.x || 0;
            const y = room.position?.y || 0;
            return {
                ...room,
                x: x + w / 2,
                y: y + l / 2,
                vertices: [[x, y], [x + w, y], [x + w, y + l], [x, y + l], [x, y]],
                area_sqft: w * l,
                wall_height_ft: 10
            };
        });
        setSketchData({ ...data, rooms: normalizedRooms });
        setProjectData({
            layout_plan: {
                rooms: normalizedRooms,
                walls: [],
                bhk_type: data.metrics.detected_rooms > 3 ? "Luxury 4BHK" : "Premium 3BHK",
                efficiency_ratio: 0.82,
                floor_count: numFloors
            },
            cost_estimate: {
                total_estimated_cost: data.metrics.total_area_sqft * 2200,
                material_cost: data.metrics.total_area_sqft * 1400,
                labor_cost: data.metrics.total_area_sqft * 500,
                finishing_cost: data.metrics.total_area_sqft * 300,
                location_detected: "Auto-Detected (Sketch)",
                quality_mode: "Standard"
            },
            material_estimate: {
                cement_bags: Math.round(data.metrics.total_area_sqft * 0.4),
                steel_kg: Math.round(data.metrics.total_area_sqft * 4),
                bricks_count: Math.round(data.metrics.total_area_sqft * 20),
                sand_tons: Math.round(data.metrics.total_area_sqft * 0.05),
                aggregate_tons: Math.round(data.metrics.total_area_sqft * 0.03),
                paint_liters: Math.round(data.metrics.total_area_sqft * 0.15),
                flooring_sqft: Math.round(data.metrics.total_area_sqft * 0.9)
            },
            area_metrics: {
                buildable_area_sqft: data.metrics.total_area_sqft
            }
        });
        setProjectStage(2);
        setActiveTab('analysis');
    };

    const handlePolygonComplete = useCallback((coords) => {
        if (JSON.stringify(coords) !== JSON.stringify(polygonCoords)) {
            setPolygonCoords(coords);
            if (coords.length >= 3 && projectStage < 1) setProjectStage(1);
        }
    }, [polygonCoords, projectStage]);

    const generatePlan = async () => {
        if (polygonCoords.length < 3) return alert("Select site boundary on the map first.");
        setLoading(true);
        setErrorMessage(null);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/generate-plan`, {
                coordinates: polygonCoords,
                floors: numFloors
            });

            const layout = response.data.layout_plan;
            if (!layout) {
                setErrorMessage("Backend did not return a layout plan.");
                return;
            }

            if (floorConfigMode === 'CUSTOM') {
                const newFloorLayouts = { ...floorLayouts, [editingFloorIndex]: response.data };
                setFloorLayouts(newFloorLayouts);
                const aggregatedData = recalculateAggregatedBOQ(newFloorLayouts, response.data, numFloors);
                setProjectData(aggregatedData);
            } else {
                setProjectData(response.data);
            }

            setProjectStage(2);
            setActiveTab('analysis');
        } catch (error) {
            const msg = error.response?.data?.detail || error.message || "Unknown Connection Error";
            setErrorMessage(`Backend Error: ${msg}`);
            alert(`Connection error: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const applySoilMultipliers = (data, soilType) => {
        if (!data || !data.cost_estimate) return data;

        const newData = JSON.parse(JSON.stringify(data));
        let multiplier = 1.0;

        // As per Section 8 of objective:
        // Hard Rock: Foundation cost -5%
        // Sandy: Foundation cost +10%
        // Normal: Standard

        // We assume foundation is roughly 15% of total cost for this adjustment
        const foundationWeight = 0.15;

        if (soilType === "Rocky / Hard Soil") multiplier = 0.95;
        else if (soilType === "Sandy Soil" || soilType === "Coastal / Marine Soil") multiplier = 1.10;

        if (multiplier !== 1.0) {
            const originalTotal = newData.cost_estimate.total_estimated_cost;
            const originalMaterial = newData.cost_estimate.material_cost;

            const foundationCostBase = originalTotal * foundationWeight;
            const adjustedFoundationCost = foundationCostBase * multiplier;
            const diff = adjustedFoundationCost - foundationCostBase;

            newData.cost_estimate.total_estimated_cost += diff;
            newData.cost_estimate.material_cost += diff;
            newData.cost_estimate.soil_adjustment = diff;
            newData.cost_estimate.soil_type = soilType;
        }

        return newData;
    };

    const handleParametricGenerate = async (inputs) => {
        setLoading(true);
        setErrorMessage(null);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/generate-parametric-plan`, inputs);
            if (inputs.floors) setNumFloors(inputs.floors);

            // Apply soil multipliers based on selected soilType
            const adjustedData = applySoilMultipliers(response.data, inputs.soil_type);

            if (floorConfigMode === 'CUSTOM') {
                const newFloorLayouts = { ...floorLayouts, [editingFloorIndex]: adjustedData };
                setFloorLayouts(newFloorLayouts);
                const aggregatedData = recalculateAggregatedBOQ(newFloorLayouts, adjustedData, inputs.floors || numFloors);
                setProjectData(aggregatedData);
            } else {
                setProjectData(adjustedData);
            }

            setProjectStage(2);
            setActiveTab('analysis');
        } catch (error) {
            setErrorMessage(`Parametric Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const exportPDF = async () => {
        if (!projectData) return;
        setLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/report`, {
                project_data: projectData,
                floors: numFloors
            }, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'BuildVision_Project_Report.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("PDF Export failed:", error);
            alert("Failed to generate PDF report.");
        } finally {
            setLoading(false);
        }
    };

    const resetProject = () => {
        setPolygonCoords([]);
        setProjectData(null);
        setProjectStage(0);
        setActiveTab('dashboard');
        setNumFloors(1);
    };

    const navItems = [
        { id: 'dashboard', label: 'Overview', icon: Home, stage: 0 },
        { id: 'map', label: 'Layout Input', icon: Globe, stage: 0 },
        { id: 'sketch', label: 'AI Sketch', icon: Sparkles, stage: 0 },
        { id: 'analysis', label: 'BOQ Analysis', icon: Calculator, stage: 2 },
        { id: '3d', label: '3D Drafting', icon: Box, stage: 2 },
        { id: 'hologram', label: '3D Hologram', icon: Sparkles, stage: 2 },
        { id: '2d_blueprint', label: '2D Drafting', icon: Ruler, stage: 2 },
        { id: 'blueprint3d', label: 'Blueprint 3D', icon: Layers, stage: 2 },
        { id: 'reports', label: 'Exports', icon: FileText, stage: 2 },
    ];

    const styles = {
        app: { display: 'flex', height: '100vh', width: '100vw', background: '#f8fafc', overflow: 'hidden', fontFamily: "'Outfit', sans-serif" },
        sidebar: { width: 280, background: '#0f172a', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: '40px', zIndex: 50 },
        main: { flex: 1, padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' },
        navLink: (active, disabled) => ({
            display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 20px', borderRadius: '14px',
            background: active ? '#3b82f6' : 'transparent', color: active ? 'white' : (disabled ? '#334155' : '#94a3b8'),
            cursor: disabled ? 'not-allowed' : 'pointer', border: 'none', transition: 'all 0.2s', fontWeight: 600, fontSize: '15px',
            position: 'relative', overflow: 'hidden'
        }),
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        card: { background: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' },
        hero: {
            background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
            borderRadius: '24px', padding: '40px', color: 'white', position: 'relative', overflow: 'hidden'
        },
        toggleBtn: (active) => ({
            padding: '10px 20px', borderRadius: '12px', border: 'none',
            background: active ? '#3b82f6' : '#f1f5f9',
            color: active ? 'white' : '#64748b',
            fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: '8px', flex: 1
        })
    };

    console.log("BuildVision App Rendering, activeTab:", activeTab);

    return (
        <div id="landing-scroll-container" style={showSplash ? { width: '100vw', height: '100vh', overflowY: 'auto', overflowX: 'hidden' } : styles.app}>
            {showSplash && <LandingPage onLaunch={() => setShowSplash(false)} />}

            {!showSplash && (
                <>
                    {/* Phase 1: Hard Debug Overlay */}
                    <div style={{ position: 'fixed', bottom: 20, right: 20, background: 'rgba(0,0,0,0.8)', color: '#00ff00', padding: '15px', borderRadius: '12px', zIndex: 10000, fontSize: '12px', fontFamily: 'monospace', pointerEvents: 'none', border: '1px solid #00ff00' }}>
                        <div>STAGE: {projectStage}</div>
                        <div>MODE: {layoutMode}</div>
                        <div>DATA: {projectData ? "LOADED" : "NULL"}</div>
                        {projectData && (
                            <>
                                <div>ROOMS: {projectData.layout_plan?.rooms?.length || 0}</div>
                                <div>WALLS: {projectData.layout_plan?.walls?.length || 0}</div>
                            </>
                        )}
                    </div>

                    {loading && <LoadingOverlay />}

                    <aside style={styles.sidebar}>
                        <div style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: '#3b82f6', width: 40, height: 40, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Hammer size={24} />
                            </div>
                            <div>
                                <span style={{ fontSize: '20px', fontWeight: 800, display: 'block' }}>BuildVision</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '2px 8px', borderRadius: '20px' }}>V3.5</span>
                                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '20px' }}>PARAMETRIC & BOQ</span>
                                </div>
                            </div>
                        </div>

                        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {navItems.map(item => {
                                const disabled = projectStage < item.stage;
                                return (
                                    <button
                                        key={item.id}
                                        disabled={disabled}
                                        onClick={() => setActiveTab(item.id)}
                                        style={styles.navLink(activeTab === item.id, disabled)}
                                    >
                                        <item.icon size={20} />
                                        {item.label}
                                        {disabled && <Lock size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
                                    </button>
                                );
                            })}
                        </nav>

                        <div style={{ marginTop: 'auto', padding: '20px', background: '#1e293b', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>JD</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>Jane Doe</div>
                                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Pro Architect</div>
                            </div>
                            <SettingsIcon size={18} color="#94a3b8" />
                        </div>
                    </aside>

                    <main style={styles.main}>
                        <header style={styles.header}>
                            <div>
                                <h1 style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{navItems.find(n => n.id === activeTab)?.label}</h1>
                            </div>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                {errorMessage && (
                                    <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', padding: '10px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Info size={14} /> {errorMessage}
                                    </div>
                                )}
                                <button onClick={resetProject} style={{ padding: '12px 24px', borderRadius: '14px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 600, cursor: 'pointer' }}>Reset</button>
                                <button style={{ padding: '12px 24px', borderRadius: '14px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 20px rgba(59,130,246,0.3)' }}>Admin Rate Console</button>
                            </div>
                        </header>

                        <div style={{ flex: 1 }}>
                            {activeTab === 'dashboard' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                    <div style={styles.hero}>
                                        <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '16px' }}>The Future of Architectural CAD</h1>
                                        <p style={{ maxWidth: '600px', lineHeight: '1.6', opacity: 0.9 }}>
                                            Switch between AI-driven satellite mapping or precision manual parametric inputs.
                                            Calculate real-time BOQ based on regional material rates.
                                        </p>
                                        <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                                            <button onClick={() => { setLayoutMode('AI'); setActiveTab('map'); }} style={{ padding: '14px 28px', borderRadius: '16px', background: 'white', color: '#3b82f6', border: 'none', fontWeight: 800, cursor: 'pointer' }}>AI SMART MODE</button>
                                            <button onClick={() => { setLayoutMode('Manual'); setActiveTab('map'); }} style={{ padding: '14px 28px', borderRadius: '16px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid white', fontWeight: 800, cursor: 'pointer' }}>MANUAL PARAMETRIC</button>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                                        <StatCard title="Regional DB" value="142 Cities" icon={Globe} color="#3b82f6" />
                                        <StatCard title="Live Rates" value="Updated Today" icon={TrendingUp} color="#10b981" />
                                        <StatCard title="Efficiency" value="88.4%" icon={Cpu} color="#f59e0b" />
                                        <StatCard title="Uptime" value="99.9%" icon={Shield} color="#8b5cf6" />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'map' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px', height: 'calc(100vh - 250px)' }}>
                                    <div style={{ background: '#f1f5f9', borderRadius: '32px', overflow: 'hidden', position: 'relative', border: '8px solid white', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
                                        {layoutMode === 'AI' ? (
                                            <MapComponent onPolygonComplete={handlePolygonComplete} />
                                        ) : (
                                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'rgba(255,255,255,0.2)', flexDirection: 'column', gap: '20px' }}>
                                                <Layers size={80} />
                                                <div style={{ fontSize: '20px', fontWeight: 800 }}>PARAMETRIC DRAFTING CANVAS</div>
                                                <div style={{ fontSize: '14px' }}>Complete dimensions in the side panel to generate geometry.</div>
                                            </div>
                                        )}
                                        {layoutMode === 'AI' && polygonCoords.length > 0 && (
                                            <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '24px', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)', display: 'flex', gap: '24px', alignItems: 'center', zIndex: 1000 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <button onClick={() => setNumFloors(Math.max(1, numFloors - 1))} style={{ width: 32, height: 32, borderRadius: '50%', background: '#f1f5f9', border: 'none', cursor: 'pointer' }}>-</button>
                                                    <span style={{ fontSize: '18px', fontWeight: 800 }}>{numFloors}F</span>
                                                    <button onClick={() => setNumFloors(Math.min(10, numFloors + 1))} style={{ width: 32, height: 32, borderRadius: '50%', background: '#f1f5f9', border: 'none', cursor: 'pointer' }}>+</button>
                                                </div>
                                                <button onClick={generatePlan} style={{ padding: '14px 32px', borderRadius: '16px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Generate AI Plan</button>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div style={{ background: 'white', padding: '6px', borderRadius: '16px', border: '1px solid #f1f5f9', display: 'flex', gap: '6px' }}>
                                            <button onClick={() => setLayoutMode('AI')} style={styles.toggleBtn(layoutMode === 'AI')}><Sparkles size={16} /> AI Smart</button>
                                            <button onClick={() => setLayoutMode('Manual')} style={styles.toggleBtn(layoutMode === 'Manual')}><Ruler size={16} /> Manual</button>
                                        </div>

                                        <div style={{ flex: 1, overflowY: 'auto', background: '#f8fafc', paddingBottom: '20px' }}>
                                            {layoutMode === 'AI' ? (
                                                <div style={styles.card}>
                                                    <h3 style={{ margin: '0 0 12px' }}>AI Site Boundary</h3>
                                                    <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6' }}>Use the polygon tool to mark the land area. AI will detect setbacks and optimize internal space.</p>
                                                    <div style={{ marginTop: '24px', padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                                                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>VERTICES</div>
                                                        <div style={{ fontSize: '18px', fontWeight: 800 }}>{polygonCoords.length}</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <ParametricPanel onGenerate={handleParametricGenerate} loading={loading} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'sketch' && (
                                <iframe
                                    src="https://buildvision.lovable.app"
                                    style={{ width: '100%', height: 'calc(100vh - 120px)', border: 'none', borderRadius: '24px' }}
                                    title="AI Sketch"
                                />
                            )}


                            {activeTab === 'analysis' && projectData && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                    <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: '40px' }}>
                                            <div>
                                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>📍 Location Detected</div>
                                                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{projectData.cost_estimate.location_detected}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>📅 Rate Last Updated</div>
                                                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{projectData.cost_estimate.rate_updated}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>🏗️ Quality Tier</div>
                                                <div style={{ fontSize: '18px', fontWeight: 800, color: '#8b5cf6', background: '#8b5cf615', padding: '2px 12px', borderRadius: '20px' }}>{projectData.cost_estimate.quality_mode}</div>
                                            </div>
                                        </div>
                                        <button style={{ padding: '10px 20px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>Compare Standard Rates</button>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                                        <StatCard title="Total Cost" value={`₹${projectData.cost_estimate.total_estimated_cost.toLocaleString()}`} icon={Banknote} color="#3b82f6" />
                                        <StatCard title="Total Area" value={`${(projectData.area_metrics.buildable_area_sqft).toLocaleString()} sqft`} icon={Ruler} color="#10b981" />
                                        <StatCard title="BHK Type" value={projectData.layout_plan.bhk_type} icon={Home} color="#f59e0b" />
                                        <StatCard title="Efficiency" value={`${(projectData.layout_plan.efficiency_ratio * 100).toFixed(1)}%`} icon={TrendingUp} color="#8b5cf6" />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                                        <div style={styles.card}>
                                            <h3 style={{ margin: '0 0 24px' }}>Regional Material BOQ</h3>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                                <MaterialCard name="Cement (Grade A)" amount={projectData.material_estimate.cement_bags.toLocaleString()} unit="bags" icon="🏗️" color="#cbd5e1" />
                                                <MaterialCard name="Steel (TMT)" amount={projectData.material_estimate.steel_kg.toLocaleString()} unit="kg" icon="⛓️" color="#94a3b8" />
                                                <MaterialCard name="Bricks (Red)" amount={projectData.material_estimate.bricks_count.toLocaleString()} unit="qty" icon="🧱" color="#f87171" />
                                                <MaterialCard name="River Sand" amount={projectData.material_estimate.sand_tons.toLocaleString()} unit="tons" icon="⌛" color="#fbbf24" />
                                                <MaterialCard name="Crushed Stones" amount={projectData.material_estimate.aggregate_tons.toLocaleString()} unit="tons" icon="🪨" color="#334155" />
                                                <MaterialCard name="Premium Paint" amount={projectData.material_estimate.paint_liters.toLocaleString()} unit="liters" icon="🎨" color="#3b82f6" />
                                            </div>
                                        </div>

                                        <div style={styles.card}>
                                            <h3 style={{ margin: '0 0 24px' }}>Regional Cost Analysis</h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {[
                                                    { label: 'Regional Material Sourcing', value: projectData.cost_estimate.material_cost, color: '#3b82f6' },
                                                    { label: 'Local Skilled Labor Index', value: projectData.cost_estimate.labor_cost, color: '#10b981' },
                                                    { label: 'Specialized Finishing', value: projectData.cost_estimate.finishing_cost, color: '#f59e0b' }
                                                ].map((item, i) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#f8fafc', borderRadius: '16px' }}>
                                                        <div style={{ width: 40, height: 40, borderRadius: '10px', background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}><Banknote size={18} /></div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: '13px', fontWeight: 700 }}>{item.label}</div>
                                                            <div style={{ fontSize: '11px', color: '#64748b' }}>Includes regional GST & transit</div>
                                                        </div>
                                                        <div style={{ fontWeight: 800, fontSize: '15px' }}>₹{item.value.toLocaleString()}</div>
                                                    </div>
                                                ))}
                                                <div style={{ marginTop: '12px', padding: '20px', background: '#0f172a', borderRadius: '16px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ fontWeight: 700 }}>Grand Total Estimate</div>
                                                    <div style={{ fontSize: '20px', fontWeight: 800 }}>₹{projectData.cost_estimate.total_estimated_cost.toLocaleString()}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ maxWidth: '800px' }}>
                                        <SoilAdvisoryPanel
                                            advisory={projectData.soil_advisory}
                                            soilType={projectData.cost_estimate.soil_type || "Selected Soil"}
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === '3d' && projectData && (
                                <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)' }}>
                                    {renderFloorOptions()}
                                    <div style={{ flex: 1, position: 'relative', background: '#0b1221', borderRadius: '24px', overflow: 'hidden' }}>
                                        <DraftingEngine
                                            layout={projectData.layout_plan}
                                            layouts={floorLayouts}
                                            floors={numFloors}
                                            configMode={floorConfigMode}
                                            roomModes={floorRoomModes}
                                            manualInputs={floorManualInputs}
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'hologram' && projectData && (
                                <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)' }}>
                                    {renderFloorOptions()}
                                    <div style={{ flex: 1, position: 'relative' }}>
                                        <HolographicViewer
                                            layout={projectData.layout_plan}
                                            layouts={floorLayouts}
                                            floors={numFloors}
                                            configMode={floorConfigMode}
                                            roomModes={floorRoomModes}
                                            manualInputs={floorManualInputs}
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === '2d_blueprint' && projectData && (
                                <div style={{ height: 'calc(100vh - 200px)', position: 'relative' }}>
                                    <BlueprintEngine
                                        layout={(floorConfigMode === 'CUSTOM' && floorRoomModes[editingFloorIndex] === 'MANUAL') ? (floorLayouts[editingFloorIndex] || projectData.layout_plan) : projectData.layout_plan}
                                        metrics={projectData.area_metrics}
                                    />
                                </div>
                            )}



                            {activeTab === 'blueprint3d' && projectData && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    {renderFloorOptions()}
                                    <Blueprint3DWrapper
                                        numFloors={numFloors}
                                        activeFloorIndex={activeFloorIndex}
                                        layout={(floorConfigMode === 'CUSTOM' && floorRoomModes[activeFloorIndex] === 'MANUAL') ? (floorLayouts[activeFloorIndex] || projectData.layout_plan) : projectData.layout_plan}
                                    />
                                </div>
                            )}

                            {activeTab === 'reports' && projectData && (
                                <div style={{ height: 'calc(100vh - 250px)', background: '#fff', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                                    <div style={{ maxWidth: 460, padding: 40 }}>
                                        <div style={{ width: 80, height: 80, background: '#f0f9ff', color: '#0ea5e9', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                            <FileText size={40} />
                                        </div>
                                        <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>Project BOQ Ready</h1>
                                        <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '32px' }}>
                                            Your comprehensive engineering report with material scaling for {numFloors} floors,
                                            satellite site positioning, and cost indexing is generated.
                                        </p>
                                        <button onClick={exportPDF} style={{ padding: '16px 40px', borderRadius: '18px', border: 'none', background: '#0f172a', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', margin: '0 auto' }}>
                                            <Download size={20} /> Download PDF Analysis
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <footer style={{ marginTop: '40px', padding: '24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8', fontSize: '11px' }}>
                            <div>© 2026 BuildVision Engineering Systems. All rights reserved.</div>
                            <div style={{ maxWidth: '600px', textAlign: 'right' }}>
                                Satellite measurements are approximate. Rates based on average Indian market values.
                            </div>
                        </footer>
                    </main >

                    {showAuth && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                            <div style={{ background: 'white', padding: '48px', borderRadius: '32px', width: 440, boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
                                <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px' }}>Login to Pro Console</h2>
                                <p style={{ color: '#64748b', marginBottom: '32px' }}>Access your saved sites and collaboration tools.</p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div>
                                        <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '8px' }}>Work Email</label>
                                        <input placeholder="name@company.com" style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '8px' }}>Security Token</label>
                                        <input type="password" placeholder="••••••••" style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc' }} />
                                    </div>
                                </div>

                                <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <button onClick={() => setShowAuth(false)} style={{ padding: '16px', borderRadius: '16px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Sign In to Workspace</button>
                                    <button onClick={() => setShowAuth(false)} style={{ padding: '16px', borderRadius: '16px', border: 'none', background: 'transparent', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                                </div>
                            </div>
                        </div>
                    )
                    }
                </>
            )}
        </div >
    );
}

export default App;
