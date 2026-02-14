import { useState, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom Marker Icon for a cleaner look
const customIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const MapComponent = ({ onPolygonComplete }) => {
    const [points, setPoints] = useState([]);

    const MapEvents = () => {
        useMapEvents({
            click(e) {
                const { lat, lng } = e.latlng;
                const newPoints = [...points, [lat, lng]];
                setPoints(newPoints);
                if (newPoints.length >= 3) {
                    onPolygonComplete(newPoints);
                }
            },
        });
        return null;
    };

    const clearMap = (e) => {
        e.stopPropagation();
        setPoints([]);
        onPolygonComplete([]);
    };

    return (
        <div style={{ position: 'relative', height: '100%', width: '100%' }}>
            <MapContainer
                center={[17.3850, 78.4867]}
                zoom={18}
                style={{ height: "100%", width: "100%" }}
                zoomControl={false}
            >
                <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                />
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
                />
                <MapEvents />
                {points.length > 0 && (
                    <>
                        {points.map((pos, idx) => (
                            <Marker key={idx} position={pos} icon={customIcon} />
                        ))}
                        <Polygon
                            positions={points}
                            pathOptions={{
                                color: '#3b82f6',
                                fillColor: '#3b82f6',
                                fillOpacity: 0.2,
                                weight: 3,
                                dashArray: '5, 10'
                            }}
                        />
                    </>
                )}
            </MapContainer>

            <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                    onClick={clearMap}
                    style={{
                        padding: '10px 16px', background: 'white', border: 'none', borderRadius: '12px',
                        fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        color: '#ef4444'
                    }}>
                    Clear Boundary
                </button>
            </div>
            <div style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 1000, background: 'rgba(255,255,255,0.9)', padding: '8px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, color: '#64748b' }}>
                Satellite View (Esri)
            </div>
        </div>
    );
};

export default MapComponent;
