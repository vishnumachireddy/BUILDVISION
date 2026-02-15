import { useState, useEffect, useRef, useCallback } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { MapContainer, TileLayer, Polygon, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { Search, Loader2, Map as MapIcon, Layers, Navigation } from 'lucide-react';

// Leaflet Click Handler
const LeafletClickHandler = ({ onMapClick }) => {
    useMapEvents({
        click: (e) => {
            onMapClick([e.latlng.lat, e.latlng.lng]);
        },
    });
    return null;
};

const MapComponent = ({ onPolygonComplete }) => {
    const mapRef = useRef(null);
    const googleMapRef = useRef(null);
    const polygonRef = useRef(null);

    const [points, setPoints] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [mapType, setMapType] = useState('hybrid');
    const [searching, setSearching] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [detecting, setDetecting] = useState(false);

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    const hasApiKey = apiKey && apiKey !== 'YOUR_GOOGLE_MAPS_API_KEY';

    // Initial Coordinates (Hyderabad)
    const initialCenter = { lat: 17.3850, lng: 78.4867 };

    // Initialize Google Maps
    useEffect(() => {
        if (!hasApiKey) {
            setMapLoaded(true);
            setTimeout(detectLocation, 1000); // Auto-detect on mount
            return;
        }

        setOptions({
            apiKey: apiKey,
            version: 'weekly'
        });

        Promise.all([
            importLibrary('maps'),
            importLibrary('places')
        ]).then(([maps, places]) => {
            if (!mapRef.current) return;
            const map = new maps.Map(mapRef.current, {
                center: initialCenter,
                zoom: 18,
                mapTypeId: mapType,
                disableDefaultUI: true,
                zoomControl: false,
                tilt: 0,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                backgroundColor: '#0f172a',
                gestureHandling: 'greedy'
            });

            googleMapRef.current = map;

            map.addListener('click', (e) => {
                setPoints((prev) => [...prev, [e.latLng.lat(), e.latLng.lng()]]);
            });

            setMapLoaded(true);
        }).catch(e => {
            console.error("Google Maps load error:", e);
            setMapLoaded(true);
        });
    }, [hasApiKey]);

    // Sync points with parent
    useEffect(() => {
        if (points.length >= 3) {
            onPolygonComplete(points);
        }
    }, [points, onPolygonComplete]);

    // Google Maps specific effects
    useEffect(() => {
        if (!googleMapRef.current) return;
        if (polygonRef.current) polygonRef.current.setMap(null);

        if (points.length >= 2) {
            const path = points.map(p => ({ lat: p[0], lng: p[1] }));
            polygonRef.current = new window.google.maps.Polygon({
                paths: path,
                strokeColor: '#3b82f6',
                strokeOpacity: 0.8,
                strokeWeight: 3,
                fillColor: '#3b82f6',
                fillOpacity: 0.2,
            });
            polygonRef.current.setMap(googleMapRef.current);
        }
    }, [points]);

    useEffect(() => {
        if (googleMapRef.current) googleMapRef.current.setMapTypeId(mapType);
    }, [mapType]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setSearching(true);
        try {
            const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
            if (response.data?.[0]) {
                const { lat, lon } = response.data[0];
                const newCenter = { lat: parseFloat(lat), lng: parseFloat(lon) };

                if (hasApiKey && googleMapRef.current) {
                    googleMapRef.current.panTo(newCenter);
                    googleMapRef.current.setZoom(18);
                } else {
                    // Leaflet handles search via state if we were controlled, 
                    // but here we just need to update the point of view.
                    // For simplicity in this hybrid, we'll let the user manually navigate Leaflet.
                }
            } else {
                alert("Location not found.");
            }
        } catch (error) {
            console.error("Geocoding error:", error);
        } finally {
            setSearching(false);
        }
    };

    const detectLocation = () => {
        if (!navigator.geolocation) return alert("Geolocation not supported.");
        setDetecting(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                if (hasApiKey && googleMapRef.current) {
                    googleMapRef.current.panTo({ lat: latitude, lng: longitude });
                    googleMapRef.current.setZoom(18);
                } else if (mapRef.current) {
                    // Leaflet fallback
                    const map = mapRef.current;
                    map.setView([latitude, longitude], 18);
                }
                setDetecting(false);
            },
            (error) => {
                console.error("Geolocation error:", error);
                setDetecting(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const zoomIn = () => {
        if (hasApiKey && googleMapRef.current) {
            googleMapRef.current.setZoom(googleMapRef.current.getZoom() + 1);
        } else if (mapRef.current) {
            mapRef.current.zoomIn();
        }
    };

    const zoomOut = () => {
        if (hasApiKey && googleMapRef.current) {
            googleMapRef.current.setZoom(googleMapRef.current.getZoom() - 1);
        } else if (mapRef.current) {
            mapRef.current.zoomOut();
        }
    };

    const clearMap = (e) => {
        e.stopPropagation();
        setPoints([]);
        onPolygonComplete([]);
    };

    return (
        <div style={{ position: 'relative', height: '100%', width: '100%', background: '#0f172a' }}>
            {/* CSS to hide Google Maps Watermarks */}
            <style>
                {`
                    .gm-style-cc, a[href^="https://maps.google.com/maps"], .gm-err-container, .gm-err-modal, .gm-style-pbc, .gm-ui-hover-effect { display: none !important; }
                    .leaflet-container { background: #0f172a !important; }
                `}
            </style>

            {/* UI Overlay */}
            <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 1000, display: 'flex', gap: '8px' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', width: '360px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <input
                            placeholder="Search location..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: '100%', padding: '12px 16px', paddingLeft: '44px', borderRadius: '16px', border: 'none', background: '#1e293b', color: 'white' }}
                        />
                        <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                            {searching ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                        </div>
                    </div>
                </form>
                <button onClick={detectLocation} style={{ width: '44px', height: '44px', background: '#1e293b', border: '1px solid #3b82f6', borderRadius: '12px', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="My Location">
                    <Navigation size={20} />
                </button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button onClick={zoomIn} style={{ width: '44px', height: '32px', background: '#1e293b', border: '1px solid #94a3b8', borderRadius: '8px', color: 'white', fontWeight: 800, cursor: 'pointer' }}>+</button>
                    <button onClick={zoomOut} style={{ width: '44px', height: '32px', background: '#1e293b', border: '1px solid #94a3b8', borderRadius: '8px', color: 'white', fontWeight: 800, cursor: 'pointer' }}>-</button>
                </div>
            </div>

            <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 1000, display: 'flex', gap: '8px' }}>
                <div style={{ background: '#1e293b', border: '1px solid #06b6d4', borderRadius: '14px', padding: '4px 8px', display: 'flex', alignItems: 'center', color: 'white' }}>
                    <Layers size={18} style={{ color: '#06b6d4', marginRight: '8px' }} />
                    <select value={mapType} onChange={(e) => setMapType(e.target.value)} style={{ background: 'transparent', color: 'white', border: 'none', outline: 'none', cursor: 'pointer', fontWeight: 600 }}>
                        <option value="hybrid" style={{ background: '#1e293b' }}>Hybrid</option>
                        <option value="roadmap" style={{ background: '#1e293b' }}>Roadmap</option>
                        <option value="satellite" style={{ background: '#1e293b' }}>Satellite</option>
                        <option value="terrain" style={{ background: '#1e293b' }}>Terrain</option>
                    </select>
                </div>
                <button onClick={clearMap} style={{ padding: '10px 16px', background: '#1e293b', border: '1px solid #ef4444', borderRadius: '14px', color: '#ef4444', fontWeight: 700, cursor: 'pointer' }}>Clear</button>
            </div>

            {hasApiKey ? (
                <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
            ) : (
                <MapContainer ref={mapRef} center={[initialCenter.lat, initialCenter.lng]} zoom={18} maxZoom={22} style={{ height: "100%", width: "100%" }} zoomControl={false}>
                    {mapType === 'satellite' ? (
                        <TileLayer
                            url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                            attribution="&copy; Google"
                            maxZoom={22}
                        />
                    ) : mapType === 'hybrid' ? (
                        <TileLayer
                            url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                            attribution="&copy; Google"
                            maxZoom={22}
                        />
                    ) : mapType === 'terrain' ? (
                        <TileLayer
                            url="https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}"
                            attribution="&copy; Google"
                            maxZoom={22}
                        />
                    ) : (
                        <TileLayer
                            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                            attribution="&copy; Google"
                            maxZoom={22}
                        />
                    )}
                    <LeafletClickHandler onMapClick={(pos) => setPoints(p => [...p, pos])} />
                    {points.length >= 2 && <Polygon positions={points} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2 }} />}
                </MapContainer>
            )}

            {!mapLoaded && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#0f172a', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 1001 }}>
                    <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
                    <p style={{ color: '#94a3b8', fontWeight: 600 }}>Switching to Fallback Map...</p>
                </div>
            )}

            {!hasApiKey && (
                <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'rgba(15, 23, 42, 0.8)', color: '#94a3b8', padding: '8px 16px', borderRadius: '20px', fontSize: '12px', zIndex: 1000 }}>
                    💡 Using Leaflet Fallback (No Google API Key detected)
                </div>
            )}
        </div>
    );
};

export default MapComponent;
