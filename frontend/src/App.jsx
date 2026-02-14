import { useState, useMemo } from 'react'
import MapComponent from './components/MapComponent'
import axios from 'axios'
import {
    Ruler, Calculator, Home, Hammer, Banknote, Layers, Box, FileText,
    Menu, X, ChevronRight, TrendingUp, Package, Shield, Info, Download,
    User, LogOut, Settings as SettingsIcon, Globe
} from 'lucide-react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Grid, Html, SoftShadows } from '@react-three/drei'

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

// --- 3D Viewer Restoration & Logic ---

const RoomBlock = ({ room, position, scale, floorIndex }) => {
    const wallHeight = 3.2; // Slightly taller for premium feel
    const w = scale[0];
    const d = scale[1];
    const yOffset = floorIndex * wallHeight;

    return (
        <group position={[position[0], position[1] + yOffset, position[2]]}>
            <mesh position={[0, wallHeight / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[w, wallHeight, d]} />
                <meshStandardMaterial color={room.color} transparent opacity={0.65} roughness={0.2} metalness={0.1} />
            </mesh>
            <mesh position={[0, wallHeight / 2, 0]}>
                <boxGeometry args={[w, wallHeight, d]} />
                <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.1} />
            </mesh>
            {/* Slab */}
            <mesh position={[0, -0.05, 0]} receiveShadow>
                <boxGeometry args={[w + 0.15, 0.1, d + 0.15]} />
                <meshStandardMaterial color="#64748b" />
            </mesh>
            {floorIndex === 0 && (
                <Html position={[0, wallHeight + 1, 0]} center distanceFactor={25}>
                    <div style={{
                        background: 'rgba(15,23,42,0.85)', color: 'white', padding: '4px 12px',
                        borderRadius: '20px', fontSize: '11px', fontWeight: 600, backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap'
                    }}>
                        {room.name}
                    </div>
                </Html>
            )}
        </group>
    );
};

const Simple3DViewer = ({ layout, floors = 1 }) => {
    const floorArray = Array.from({ length: floors }, (_, i) => i);

    const { positions, centerX, centerZ } = useMemo(() => {
        if (!layout) return { positions: [], centerX: 0, centerZ: 0 };
        const maxDim = Math.max(...layout.rooms.map(r => Math.max(r.width_ft, r.length_ft)));
        const scaleFactor = 14 / maxDim;
        const cols = 2;
        const pos = [];
        let curX = 0, curZ = 0, rowMaxZ = 0;

        layout.rooms.forEach((room, idx) => {
            const w = room.width_ft * scaleFactor;
            const d = room.length_ft * scaleFactor;
            const col = idx % cols;
            if (col === 0 && idx > 0) {
                curZ += rowMaxZ + 1.2;
                rowMaxZ = 0;
                curX = 0;
            }
            pos.push({ x: curX + w / 2, z: curZ + d / 2, w, d });
            curX += w + 1.2;
            rowMaxZ = Math.max(rowMaxZ, d);
        });

        const allX = pos.map(p => p.x);
        const allZ = pos.map(p => p.z);
        return {
            positions: pos,
            centerX: (Math.min(...allX) + Math.max(...allX)) / 2,
            centerZ: (Math.min(...allZ) + Math.max(...allZ)) / 2
        };
    }, [layout]);

    if (!layout) return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Awaiting layout data...</div>;

    return (
        <div style={{ height: '100%', width: '100%', borderRadius: '24px', overflow: 'hidden', position: 'relative', background: '#0f172a' }}>
            <Canvas camera={{ position: [35, 25, 35], fov: 40 }} shadows>
                <SoftShadows size={20} samples={10} focus={0.5} />
                <ambientLight intensity={0.4} />
                <spotLight position={[30, 40, 30]} angle={0.25} penumbra={1} intensity={2} castShadow />
                <directionalLight position={[-10, 20, -10]} intensity={0.5} />
                <Environment preset="night" />
                <Grid args={[100, 100]} position={[0, -0.01, 0]} cellSize={1} sectionSize={5} sectionColor="#1e293b" cellColor="#020617" />
                <OrbitControls enableDamping autoRotate autoRotateSpeed={0.5} />

                {floorArray.map(floorIdx => (
                    <group key={floorIdx}>
                        {layout.rooms.map((room, idx) => (
                            <RoomBlock
                                key={`${floorIdx}-${idx}`}
                                room={room}
                                floorIndex={floorIdx}
                                position={[positions[idx].x - centerX, 0, positions[idx].z - centerZ]}
                                scale={[positions[idx].w, positions[idx].d]}
                            />
                        ))}
                    </group>
                ))}
            </Canvas>
            <div style={{ position: 'absolute', bottom: 24, left: 24, background: 'rgba(15,23,42,0.8)', padding: '16px', borderRadius: '16px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Blueprint Visualizer</div>
                <div style={{ fontSize: '16px', fontWeight: 700 }}>{layout.bhk_type} Stacked Model</div>
            </div>
        </div>
    );
};

// --- Main App Component ---

// --- Restored Component: Loading Overlay ---
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

// --- Restored Component: 3D Legend ---
const ThreeDLegend = ({ rooms }) => (
    <div style={{
        position: 'absolute', top: 24, right: 24, background: 'rgba(15,23,42,0.8)',
        padding: '20px', borderRadius: '20px', backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)', color: 'white', width: '200px'
    }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>Legend</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {rooms.map((room, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '4px', background: room.color }}></div>
                    <span style={{ fontWeight: 500 }}>{room.name}</span>
                </div>
            ))}
        </div>
    </div>
);

function App() {
    const [polygonCoords, setPolygonCoords] = useState([]);
    const [projectData, setProjectData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [numFloors, setNumFloors] = useState(1);
    const [user, setUser] = useState(null);
    const [showAuth, setShowAuth] = useState(false);

    const handlePolygonComplete = (coords) => setPolygonCoords(coords);

    const generatePlan = async () => {
        if (polygonCoords.length < 3) return alert("Select site boundary on the map first.");
        setLoading(true);
        try {
            await new Promise(r => setTimeout(r, 1500)); // Aesthetic delay for progress feel
            const response = await axios.post('http://localhost:8000/api/generate-plan', {
                coordinates: polygonCoords,
                floors: numFloors
            });
            setProjectData(response.data);
            setActiveTab('analysis');
        } catch (error) {
            alert("Connection error. Is backend server reachable?");
        } finally {
            setLoading(false);
        }
    };

    const exportPDF = () => alert("Preparing high-fidelity PDF report...");

    const resetProject = () => {
        setPolygonCoords([]);
        setProjectData(null);
        setActiveTab('dashboard');
        setNumFloors(1);
    };

    const navItems = [
        { id: 'dashboard', label: 'Overview', icon: Home },
        { id: 'map', label: 'Site Boundary', icon: Globe },
        { id: 'analysis', label: 'BOQ Analysis', icon: Calculator, disabled: !projectData },
        { id: '3d', label: '3D Schematic', icon: Box, disabled: !projectData },
        { id: 'reports', label: 'Exports', icon: FileText, disabled: !projectData },
    ];

    const styles = {
        app: { display: 'flex', height: '100vh', width: '100vw', background: '#f8fafc', overflow: 'hidden', fontFamily: "'Outfit', sans-serif" },
        sidebar: { width: 280, background: '#0f172a', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: '40px' },
        main: { flex: 1, padding: '40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '32px' },
        navLink: (active, disabled) => ({
            display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 20px', borderRadius: '14px',
            background: active ? '#3b82f6' : 'transparent', color: active ? 'white' : (disabled ? '#334155' : '#94a3b8'),
            cursor: disabled ? 'not-allowed' : 'pointer', border: 'none', transition: 'all 0.2s', fontWeight: 600, fontSize: '15px'
        }),
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        card: { background: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' },
        hero: {
            background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
            borderRadius: '24px', padding: '40px', color: 'white', position: 'relative', overflow: 'hidden'
        }
    };

    return (
        <div style={styles.app}>
            <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
            {loading && <LoadingOverlay />}

            <aside style={styles.sidebar}>
                <div style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: '#3b82f6', width: 40, height: 40, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Hammer size={24} />
                    </div>
                    <span style={{ fontSize: '22px', fontWeight: 800 }}>ConstructIQ</span>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {navItems.map(item => (
                        <button key={item.id} disabled={item.disabled} onClick={() => setActiveTab(item.id)} style={styles.navLink(activeTab === item.id, item.disabled)}>
                            <item.icon size={20} /> {item.label}
                        </button>
                    ))}
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
                        <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>Welcome back, Jane</div>
                        <h1 style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{navItems.find(n => n.id === activeTab)?.label}</h1>
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <button onClick={resetProject} style={{ padding: '12px 24px', borderRadius: '14px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 600, cursor: 'pointer' }}>New Project</button>
                        <button onClick={() => setShowAuth(true)} style={{ padding: '12px 24px', borderRadius: '14px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 20px rgba(59,130,246,0.3)' }}>Login Console</button>
                    </div>
                </header>

                <div style={{ flex: 1 }}>
                    {activeTab === 'dashboard' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            <div style={styles.hero}>
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <h2 style={{ fontSize: '32px', fontWeight: 800, margin: '0 0 12px' }}>Design the Future of Living</h2>
                                    <p style={{ opacity: 0.9, maxWidth: '480px', lineHeight: '1.6', marginBottom: '24px' }}>
                                        Start your next infrastructure project by identifying site boundaries on the map.
                                        Our AI engine will calculate multi-floor BOQ and materials in real-time.
                                    </p>
                                    <button onClick={() => setActiveTab('map')} style={{ padding: '12px 28px', borderRadius: '14px', background: 'white', color: '#3b82f6', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Start Mapping</button>
                                </div>
                                <div style={{ position: 'absolute', right: '-40px', bottom: '-40px', opacity: 0.2 }}>
                                    <div style={{ width: 300, height: 300, background: 'rgba(255,255,255,0.4)', borderRadius: '50%' }}></div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                                <StatCard title="Active Projects" value="12" icon={Layers} color="#3b82f6" trend="+2.4%" />
                                <StatCard title="Est. Savings" value="₹2.4M" icon={Banknote} color="#10b981" />
                                <StatCard title="Avg. Efficiency" value="84.2%" icon={TrendingUp} color="#f59e0b" />
                                <StatCard title="Safety Index" value="9.8/10" icon={Shield} color="#8b5cf6" />
                            </div>
                        </div>
                    )}

                    {activeTab === 'map' && (
                        <div style={{ height: 'calc(100vh - 250px)', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px' }}>
                            <div style={{ background: '#e2e8f0', borderRadius: '32px', overflow: 'hidden', border: '8px solid white', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', position: 'relative' }}>
                                <MapComponent onPolygonComplete={handlePolygonComplete} />
                                {polygonCoords.length > 0 && (
                                    <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '24px', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)', display: 'flex', gap: '24px', alignItems: 'center', zIndex: 1000, border: '1px solid #f1f5f9' }}>
                                        <div>
                                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, marginBottom: '8px' }}>Storey Count</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <button onClick={() => setNumFloors(Math.max(1, numFloors - 1))} style={{ width: 32, height: 32, borderRadius: '50%', background: '#f1f5f9', border: 'none', cursor: 'pointer' }}>-</button>
                                                <span style={{ fontSize: '18px', fontWeight: 800, width: '20px', textAlign: 'center' }}>{numFloors}</span>
                                                <button onClick={() => setNumFloors(Math.min(10, numFloors + 1))} style={{ width: 32, height: 32, borderRadius: '50%', background: '#f1f5f9', border: 'none', cursor: 'pointer' }}>+</button>
                                            </div>
                                        </div>
                                        <button onClick={generatePlan} style={{ padding: '14px 32px', borderRadius: '16px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            Build {numFloors}F Plan <ChevronRight size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div style={styles.card}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                    <Info size={20} color="#3b82f6" />
                                    <h3 style={{ margin: 0 }}>Site Settings</h3>
                                </div>
                                <p style={{ color: '#64748b', lineHeight: '1.6', fontSize: '14px' }}>Identification of land boundaries is required to calculate the buildable area according to local zoning norms.</p>
                                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', marginTop: '24px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px' }}>Selected Region</div>
                                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{polygonCoords.length || 0} vertices identified</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'analysis' && projectData && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                                <StatCard title="Estimated Cost" value={`₹${projectData.cost_estimate.total_estimated_cost.toLocaleString()}`} icon={Banknote} color="#3b82f6" />
                                <StatCard title="Buildable Area" value={`${(projectData.area_metrics.buildable_area_sqft * numFloors).toLocaleString()} sqft`} icon={Ruler} color="#10b981" />
                                <StatCard title="BHK Typology" value={projectData.layout_plan.bhk_type} icon={Home} color="#f59e0b" />
                                <StatCard title="Efficiency" value={`${(projectData.layout_plan.efficiency_ratio * 100).toFixed(1)}%`} icon={TrendingUp} color="#8b5cf6" />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                                <div style={styles.card}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                        <h3 style={{ margin: 0 }}>Materials Consumption</h3>
                                        <Package size={20} color="#94a3b8" />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <MaterialCard name="Cement Bags" amount={projectData.material_estimate.cement_bags.toLocaleString()} unit="bags" icon="🏗️" color="#cbd5e1" />
                                        <MaterialCard name="Reinforcement" amount={projectData.material_estimate.steel_kg.toLocaleString()} unit="kg" icon="⛓️" color="#94a3b8" />
                                        <MaterialCard name="Bricks / Blocks" amount={projectData.material_estimate.bricks_count.toLocaleString()} unit="qty" icon="🧱" color="#f87171" />
                                        <MaterialCard name="Coarse Sand" amount={projectData.material_estimate.sand_tons.toLocaleString()} unit="tons" icon="⌛" color="#fbbf24" />
                                        <MaterialCard name="Aggregates" amount={projectData.material_estimate.aggregate_tons.toLocaleString()} unit="tons" icon="🪨" color="#334155" />
                                        <MaterialCard name="Interior Paint" amount={projectData.material_estimate.paint_liters.toLocaleString()} unit="liters" icon="🎨" color="#3b82f6" />
                                    </div>
                                </div>

                                <div style={styles.card}>
                                    <h3 style={{ margin: '0 0 24px' }}>Cost Breakdown</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {[
                                            { label: 'Fundamental Works', value: projectData.cost_estimate.material_cost, color: '#3b82f6' },
                                            { label: 'Skilled Labor', value: projectData.cost_estimate.labor_cost, color: '#10b981' },
                                            { label: 'Finishing Works', value: projectData.cost_estimate.finishing_cost, color: '#f59e0b' }
                                        ].map((item, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#f8fafc', borderRadius: '16px' }}>
                                                <div style={{ width: 40, height: 40, borderRadius: '10px', background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>
                                                    <Banknote size={18} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '13px', fontWeight: 700 }}>{item.label}</div>
                                                    <div style={{ fontSize: '11px', color: '#64748b' }}>Project phase estimate</div>
                                                </div>
                                                <div style={{ fontWeight: 800, fontSize: '15px' }}>₹{item.value.toLocaleString()}</div>
                                            </div>
                                        ))}
                                        <div style={{ marginTop: '12px', padding: '20px', background: '#0f172a', borderRadius: '16px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ fontWeight: 700 }}>Total (GST Inc.)</div>
                                            <div style={{ fontSize: '20px', fontWeight: 800 }}>₹{projectData.cost_estimate.total_estimated_cost.toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === '3d' && projectData && (
                        <div style={{ height: 'calc(100vh - 200px)', position: 'relative' }}>
                            <Simple3DViewer layout={projectData.layout_plan} floors={numFloors} />
                            <ThreeDLegend rooms={projectData.layout_plan.rooms} />
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
                    <div>© 2026 ConstructIQ Engineering Systems. All rights reserved.</div>
                    <div style={{ maxWidth: '600px', textAlign: 'right' }}>
                        ⚠️ **Disclaimer:** AI-assisted estimation only. Final structural design must be verified by a licensed civil engineer.
                        Satellite measurements are approximate. Rates based on average Indian market values.
                    </div>
                </footer>
            </main>

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
            )}
        </div>
    );
}

export default App;
