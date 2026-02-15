import React from 'react';
import { ShieldAlert, Info, AlertTriangle, Layers } from 'lucide-react';

const SoilAdvisoryPanel = ({ advisory, soilType }) => {
    if (!advisory) return null;

    const riskColors = {
        'Low': '#10b981',
        'Moderate': '#f59e0b',
        'High Groundwater Risk': '#ef4444',
        'High Salinity & Water Table': '#ef4444',
        'Swelling/Shrinkage': '#ef4444',
        'Unknown': '#64748b'
    };

    const riskColor = riskColors[advisory.risk] || '#64748b';

    return (
        <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '24px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '10px', borderRadius: '12px', background: '#3b82f615', color: '#3b82f6' }}>
                    <Layers size={22} />
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>🏗 Soil Advisory Report</h3>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Structural Insights for {soilType}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Max Floors</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                        {advisory.safe_floors === 'Unknown' ? 'Soil Test Required' : `G+${advisory.safe_floors}`}
                    </div>
                </div>
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Foundation</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{advisory.foundation}</div>
                </div>
            </div>

            <div style={{ padding: '16px', background: `${riskColor}10`, borderRadius: '16px', border: `1px solid ${riskColor}30` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <ShieldAlert size={14} color={riskColor} />
                    <div style={{ fontSize: '11px', fontWeight: 700, color: riskColor, textTransform: 'uppercase' }}>Risk Level</div>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: riskColor }}>{advisory.risk}</div>
                <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px', lineHeight: '1.4' }}>{advisory.note}</div>
            </div>

            <div style={{
                padding: '16px',
                background: '#fef2f2',
                borderRadius: '16px',
                border: '1px solid #fee2e2',
                display: 'flex',
                gap: '12px'
            }}>
                <AlertTriangle size={20} color="#b91c1c" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '12px', color: '#b91c1c', fontWeight: 500, lineHeight: '1.5' }}>
                    <strong>Mandatory Disclaimer:</strong> This is a preliminary advisory based on typical regional soil profiles.
                    Site-specific soil testing by a certified geotechnical engineer is required before any structural construction begins.
                </div>
            </div>
        </div>
    );
};

export default SoilAdvisoryPanel;
