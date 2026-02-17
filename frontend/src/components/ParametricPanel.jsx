import React, { useState } from 'react';
import { Ruler, Home, Box, ChevronRight, MapPin, Layers, PenTool } from 'lucide-react';
import PlotSketcher from './PlotSketcher';

const ParametricPanel = ({ onGenerate, loading }) => {
    const [plotType, setPlotType] = useState('Rectangle');
    const [dimensions, setDimensions] = useState({
        length: 40,
        width: 30,
        main_length: 50,
        main_width: 40,
        cut_length: 15,
        cut_width: 15,
        sketch_points: []
    });

    const [requirements, setRequirements] = useState({
        bedrooms: 2,
        bathrooms: 1,
        floors: 1,
        kitchen: true,
        living: true,
        dining: true,
        balcony: false,
        parking: 1,
        staircase: 'internal'
    });

    const [location, setLocation] = useState({
        state: 'Andhra Pradesh',
        district: 'Visakhapatnam',
        pinCode: '',
        pinLoading: false,
        pinError: null,
        manualOverride: false
    });

    const [soilType, setSoilType] = useState('Normal Red Soil');
    const [qualityMode, setQualityMode] = useState('Standard');

    const handlePinDetection = async (pin) => {
        if (pin.length !== 6 || location.manualOverride) return;

        setLocation(prev => ({ ...prev, pinLoading: true, pinError: null }));

        try {
            const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
            const data = await response.json();

            if (data[0].Status === "Success") {
                const info = data[0].PostOffice[0];
                const newState = info.State;
                const newDistrict = info.District;

                setLocation(prev => ({
                    ...prev,
                    state: newState,
                    district: newDistrict,
                    pinLoading: false,
                    lastDetectedPin: pin
                }));
            } else {
                setLocation(prev => ({ ...prev, pinError: "Invalid PIN Code", pinLoading: false }));
            }
        } catch (error) {
            setLocation(prev => ({ ...prev, pinError: "Network Error", pinLoading: false }));
        }
    };

    const handleGenerate = () => {
        onGenerate({
            plot_type: plotType,
            dimensions,
            requirements,
            floors: requirements.floors,
            state: location.state,
            district: location.district,
            pin_code: location.pinCode,
            quality_mode: qualityMode,
            soil_type: soilType
        });
    };

    const updateDim = (key, val) => setDimensions(prev => ({ ...prev, [key]: val }));
    const updateReq = (key, val) => setRequirements(prev => ({ ...prev, [key]: val }));

    const states = ["Andhra Pradesh", "Telangana", "Maharashtra", "Karnataka"];
    const districts = {
        "Andhra Pradesh": [
            "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Tirupati", "Anantapur", "Kadapa", "Kakinada", "Eluru", "Vizianagaram", "Chittoor", "West Godavari", "East Godavari", "Srikakulam", "Prakasam", "YSR Kadapa", "Parvathipuram Manyam", "Alluri Sitharama Raju", "Anakapalli", "Konaseema", "NTR", "Bapatla", "Palnadu", "Nandyal", "Sri Sathya Sai", "Annamayya"
        ],
        "Telangana": [
            "Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ramagundam", "Mahabubnagar", "Nalgonda", "Adilabad", "Siddipet", "Jagtial", "Mancherial", "Suryapet", "Kamareddy", "Kothagudem", "Vikarabad", "Medak", "Sircilla", "Gadwal", "Jangaon", "Bhupalpally", "Wanaparthy", "Nagarkurnool", "Narayanpet", "Nirmal", "Peddapalli", "Asifabad", "Mahabubabad", "Mulugu", "Medchal–Malkajgiri", "Rangareddy", "Yadadri Bhuvanagiri", "Hanamkonda"
        ],
        "Maharashtra": ["Mumbai", "Pune"],
        "Karnataka": ["Bangalore"]
    };

    const inputStyle = {
        width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0',
        background: '#f8fafc', fontSize: '14px', marginTop: '6px'
    };

    const labelStyle = {
        fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase'
    };

    const sectionStyle = {
        backgroundColor: '#ffffff',
        padding: '24px',
        borderRadius: '20px',
        border: '1px solid #f1f5f9',
        marginBottom: '20px',
        position: 'relative',
        zIndex: 10,
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Plot Type & Dimensions */}
            <div style={sectionStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <Ruler size={20} color="#3b82f6" />
                    <h3 style={{ margin: 0 }}>Plot Dimensions</h3>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <div style={labelStyle}>Plot Type</div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        {['Rectangle', 'L-Shape', 'Sketch'].map(t => (
                            <button
                                key={t}
                                onClick={() => setPlotType(t)}
                                style={{
                                    flex: 1, padding: '10px', borderRadius: '10px',
                                    border: `2px solid ${plotType === t ? '#3b82f6' : '#f1f5f9'}`,
                                    background: plotType === t ? '#3b82f610' : 'white',
                                    color: plotType === t ? '#3b82f6' : '#64748b',
                                    fontWeight: 700, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                                }}
                            >
                                {t === 'Sketch' && <PenTool size={14} />} {t}
                            </button>
                        ))}
                    </div>
                </div>

                {plotType === 'Rectangle' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <div style={labelStyle}>Length (ft)</div>
                            <input type="number" value={dimensions.length} onChange={e => updateDim('length', parseFloat(e.target.value))} style={inputStyle} />
                        </div>
                        <div>
                            <div style={labelStyle}>Width (ft)</div>
                            <input type="number" value={dimensions.width} onChange={e => updateDim('width', parseFloat(e.target.value))} style={inputStyle} />
                        </div>
                    </div>
                )}

                {plotType === 'L-Shape' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <div style={labelStyle}>Main Length (ft)</div>
                            <input type="number" value={dimensions.main_length} onChange={e => updateDim('main_length', parseFloat(e.target.value))} style={inputStyle} />
                        </div>
                        <div>
                            <div style={labelStyle}>Main Width (ft)</div>
                            <input type="number" value={dimensions.main_width} onChange={e => updateDim('main_width', parseFloat(e.target.value))} style={inputStyle} />
                        </div>
                        <div>
                            <div style={labelStyle}>Cut Length (ft)</div>
                            <input type="number" value={dimensions.cut_length} onChange={e => updateDim('cut_length', parseFloat(e.target.value))} style={inputStyle} />
                        </div>
                        <div>
                            <div style={labelStyle}>Cut Width (ft)</div>
                            <input type="number" value={dimensions.cut_width} onChange={e => updateDim('cut_width', parseFloat(e.target.value))} style={inputStyle} />
                        </div>
                    </div>
                )}

                {plotType === 'Sketch' && (
                    <PlotSketcher
                        onComplete={(pts) => updateDim('sketch_points', pts)}
                        width={280}
                        height={240}
                    />
                )}
            </div>

            {/* House Requirements */}
            <div style={sectionStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <Home size={20} color="#10b981" />
                    <h3 style={{ margin: 0 }}>House Requirements</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div>
                        <div style={labelStyle}>Number of Floors</div>
                        <select value={requirements.floors} onChange={e => updateReq('floors', parseInt(e.target.value))} style={inputStyle}>
                            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Floor(s)</option>)}
                        </select>
                    </div>
                    <div>
                        <div style={labelStyle}>Bedrooms</div>
                        <select value={requirements.bedrooms} onChange={e => updateReq('bedrooms', parseInt(e.target.value))} style={inputStyle}>
                            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Bedroom(s)</option>)}
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div>
                        <div style={labelStyle}>Bathrooms</div>
                        <select value={requirements.bathrooms} onChange={e => updateReq('bathrooms', parseInt(e.target.value))} style={inputStyle}>
                            {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} Bathroom(s)</option>)}
                        </select>
                    </div>
                    <div>
                        <div style={labelStyle}>Car Parking</div>
                        <select value={requirements.parking} onChange={e => updateReq('parking', parseInt(e.target.value))} style={inputStyle}>
                            {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n} Car(s)</option>)}
                        </select>
                    </div>
                </div>

                <div style={labelStyle}>Additional Rooms</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '12px' }}>
                    {[
                        { id: 'kitchen', label: 'Kitchen' },
                        { id: 'living', label: 'Living Room' },
                        { id: 'dining', label: 'Dining' },
                        { id: 'balcony', label: 'Balcony' }
                    ].map(room => (
                        <label key={room.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
                            <input
                                type="checkbox"
                                checked={requirements[room.id]}
                                onChange={e => updateReq(room.id, e.target.checked)}
                                style={{ width: 18, height: 18 }}
                            />
                            {room.label}
                        </label>
                    ))}
                </div>
            </div>

            {/* Region & Soil Intelligence */}
            <div style={sectionStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <MapPin size={20} color="#f59e0b" />
                    <h3 style={{ margin: 0 }}>Region & Soil Intelligence</h3>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <div style={labelStyle}>Enter PIN Code</div>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="e.g. 516360"
                            maxLength={6}
                            value={location.pinCode}
                            onChange={e => {
                                const val = e.target.value.replace(/\D/g, '');
                                setLocation(prev => ({ ...prev, pinCode: val, manualOverride: false })); // Reset override on PIN change
                                if (val.length === 6) handlePinDetection(val);
                            }}
                            style={{ ...inputStyle, paddingRight: '40px' }}
                        />
                        {location.pinLoading && (
                            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-2px)' }}>
                                <div style={{ width: '16px', height: '16px', border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                            </div>
                        )}
                    </div>
                    {location.pinError && <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', fontWeight: 600 }}>{location.pinError}</div>}
                    {location.pinCode.length === 6 && !location.pinLoading && !location.pinError && (
                        <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px', fontWeight: 600 }}>📍 Location Detected: {location.district}, {location.state}</div>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div>
                        <div style={labelStyle}>State</div>
                        <select value={location.state} onChange={e => setLocation(prev => ({ ...prev, state: e.target.value, district: districts[e.target.value] ? districts[e.target.value][0] : '', manualOverride: true }))} style={inputStyle}>
                            {states.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <div style={labelStyle}>District</div>
                        <select value={location.district} onChange={e => setLocation(prev => ({ ...prev, district: e.target.value, manualOverride: true }))} style={inputStyle}>
                            {districts[location.state]?.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <div style={labelStyle}>Soil Type</div>
                    <select value={soilType} onChange={e => { setSoilType(e.target.value); setLocation(prev => ({ ...prev, manualOverride: true })); }} style={inputStyle}>
                        <option value="Rocky / Hard Soil">Rocky / Hard Soil</option>
                        <option value="Normal Red Soil">Normal Red Soil</option>
                        <option value="Sandy Soil">Sandy Soil</option>
                        <option value="Coastal / Marine Soil">Coastal / Marine Soil</option>
                        <option value="Black Cotton Soil">Black Cotton Soil</option>
                        <option value="Not Sure">Not Sure</option>
                    </select>
                </div>

                <div>
                    <div style={labelStyle}>Build Quality Mode</div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        {['Economy', 'Standard', 'Premium'].map(m => (
                            <button
                                key={m}
                                onClick={() => setQualityMode(m)}
                                style={{
                                    flex: 1, padding: '10px', borderRadius: '10px',
                                    border: `2px solid ${qualityMode === m ? '#8b5cf6' : '#f1f5f9'}`,
                                    background: qualityMode === m ? '#8b5cf610' : 'white',
                                    color: qualityMode === m ? '#8b5cf6' : '#64748b',
                                    fontWeight: 700, cursor: 'pointer'
                                }}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <button
                onClick={handleGenerate}
                disabled={loading || (plotType === 'Sketch' && dimensions.sketch_points.length < 3)}
                style={{
                    padding: '18px', borderRadius: '20px', border: 'none',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                    color: 'white', fontWeight: 800, fontSize: '16px',
                    cursor: (loading || (plotType === 'Sketch' && dimensions.sketch_points.length < 3)) ? 'not-allowed' : 'pointer',
                    boxShadow: '0 10px 30px rgba(59,130,246,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'
                }}
            >
                {loading ? 'GENERATING...' : (
                    <>
                        GENERATE PARAMETRIC PLAN <ChevronRight size={20} />
                    </>
                )}
            </button>
        </div>
    );
};

export default ParametricPanel;
