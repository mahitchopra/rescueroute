import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, CircleMarker } from 'react-leaflet';
import { divIcon } from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

const API_BASE_URL = "http://127.0.0.1:8000"; 

const NODE_COORDS = {
  'FireStation': [30.9740, 76.5270],
  'A': [30.9760, 76.5280],
  'B': [30.9730, 76.5290],
  'C': [30.9765, 76.5305],
  'D': [30.9745, 76.5315],
  'E': [30.9770, 76.5330],
  'Hospital': [30.9750, 76.5340]
};

const getCustomIcon = (emoji, bgColor, size = 32) => divIcon({
  className: '',
  html: `<div style="background-color: ${bgColor}; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; border-radius: 50%; box-shadow: 0 0 15px ${bgColor}; font-size: ${size * 0.55}px; color: white; border: 2px solid #ffffff;">${emoji}</div>`,
  iconSize: [size, size], iconAnchor: [size / 2, size / 2],
});

const getNodeIcon = (nodeName, isFlooded, predictiveWarning) => {
  if (nodeName === 'FireStation') return getCustomIcon('🚒', '#ef4444', 38);
  if (nodeName === 'Hospital') return getCustomIcon('🏥', '#10b981', 38);
  if (isFlooded && (nodeName === 'C' || nodeName === 'D')) return getCustomIcon('🌊', '#06b6d4', 32);
  if (predictiveWarning && (nodeName === 'C' || nodeName === 'D')) return getCustomIcon('⚠️', '#f59e0b', 28); 
  return divIcon({
    className: '',
    html: `<div style="background-color: #3b82f6; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #0f172a; box-shadow: 0 0 8px #3b82f6;"></div>`,
    iconSize: [14, 14], iconAnchor: [7, 7]
  });
};

export default function App() {
  const [activePathNodes, setActivePathNodes] = useState([]); 
  const [eta, setEta] = useState(null);
  const [incidentActive, setIncidentActive] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('FireStation');
  const [traversedHistory, setTraversedHistory] = useState(['FireStation']);

  // REAL WORLD MATRIX CONTROLS
  const [trafficMode, setTrafficMode] = useState('clear');
  const [weatherAiActive, setWeatherAiActive] = useState(false);

  const fetchRoute = async (startNode = currentLocation, history = traversedHistory) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/route`, { 
        start: startNode, 
        end: "Hospital",
        traffic_mode: trafficMode,
        weather_warning: weatherAiActive,
        traversed_path: history
      });
      setActivePathNodes(res.data.path);
      setEta(res.data.eta_minutes);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRoute();
  }, [trafficMode, weatherAiActive]);

  const simulateTransit = () => {
    const currentIndex = activePathNodes.indexOf(currentLocation);
    if (currentIndex !== -1 && currentIndex < activePathNodes.length - 1) {
      const nextNode = activePathNodes[currentIndex + 1];
      setCurrentLocation(nextNode);
      setTraversedHistory(prev => [...prev, nextNode]);
    }
  };

  const triggerMidTransitFlood = async () => {
    await axios.post(`${API_BASE_URL}/update_incident`, { node_u: "C", node_v: "D", new_weight: 9999 });
    setIncidentActive(true);
    await fetchRoute(currentLocation, traversedHistory);
  };

  const resetMatrix = async () => {
    await axios.post(`${API_BASE_URL}/update_incident`, { node_u: "C", node_v: "D", new_weight: 1 });
    setIncidentActive(false); setTrafficMode('clear'); setWeatherAiActive(false);
    setCurrentLocation('FireStation'); setTraversedHistory(['FireStation']);
    const res = await axios.post(`${API_BASE_URL}/route`, { start: 'FireStation', end: 'Hospital' });
    setActivePathNodes(res.data.path); setEta(res.data.eta_minutes);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#090d16', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* CYBERPUNK WAR-ROOM HEADER */}
      <div style={{ padding: '16px 24px', backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#10b981', letterSpacing: '1px' }}>● A* SPATIAL ENGINE LIVE</div>
          <h1 style={{ margin: '2px 0 0 0', fontSize: '22px', color: '#f8fafc' }}>RescueRoute <span style={{ color: '#3b82f6' }}>// AI Predictor</span></h1>
        </div>

        {/* ENVIRONMENTAL CONTROLS */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: '#1e293b', padding: '6px 12px', borderRadius: '8px', border: '1px solid #334155' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>MATRIX:</span>
          <select 
            value={trafficMode} 
            onChange={(e) => setTrafficMode(e.target.value)}
            style={{ backgroundColor: '#0f172a', color: '#38bdf8', border: '1px solid #0284c7', padding: '6px 10px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
            <option value="clear">🟢 Midnight (Clear)</option>
            <option value="rush_hour">🟠 Peak Rush Hour</option>
          </select>

          <button 
            onClick={() => setWeatherAiActive(!weatherAiActive)}
            style={{ padding: '6px 12px', cursor: 'pointer', backgroundColor: weatherAiActive ? '#f59e0b' : '#0f172a', color: weatherAiActive ? '#0f172a' : '#f59e0b', border: '1px solid #f59e0b', borderRadius: '4px', fontWeight: 'bold', transition: 'all 0.2s' }}>
            {weatherAiActive ? "⚠️ Monsoon Guard: ON" : "🌧️ Enable Monsoon AI"}
          </button>
        </div>

        {/* DISASTER CONTROLS */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={simulateTransit} style={{ padding: '8px 14px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            🚗 Drive Next
          </button>
          <button onClick={triggerMidTransitFlood} style={{ padding: '8px 14px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            🌊 Sensor Trip (Flood)
          </button>
          <button onClick={resetMatrix} style={{ padding: '8px 14px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Reset
          </button>
        </div>

        {/* RESTORED TELEMETRY PANEL */}
        <div style={{ display: 'flex', gap: '20px', borderLeft: '1px solid #1e293b', paddingLeft: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>ENGINE</div>
            <div style={{ fontSize: '15px', color: '#a3e635', fontWeight: 'bold' }}>A* Search</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>VEHICLE POS</div>
            <div style={{ fontSize: '15px', color: '#38bdf8', fontWeight: 'bold' }}>Node {currentLocation}</div>
          </div>
          <div style={{ textAlign: 'right', minWidth: '70px' }}>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>TOTAL ETA</div>
            <div style={{ fontSize: '15px', color: incidentActive ? '#f87171' : '#4ade80', fontWeight: 'bold' }}>{eta || '--'} min</div>
          </div>
        </div>
      </div>

      {/* MAP */}
      <div style={{ flexGrow: 1 }}>
        <MapContainer center={[30.9752, 76.5305]} zoom={16} style={{ height: '100%', width: '100%', backgroundColor: '#090d16' }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png" />
          
          {Object.entries(NODE_COORDS).map(([name, coords]) => (
            <Marker key={name + incidentActive + weatherAiActive} position={coords} icon={getNodeIcon(name, incidentActive, weatherAiActive)}>
              <Popup><div style={{ fontWeight: 'bold' }}>Sector: {name}</div></Popup>
            </Marker>
          ))}

          {activePathNodes.length > 0 && (
            <Polyline key={activePathNodes.join(',')} positions={activePathNodes.map(n => NODE_COORDS[n])} color={incidentActive ? "#ec4899" : "#3b82f6"} weight={7} opacity={0.85} />
          )}

          {NODE_COORDS[currentLocation] && (
            <CircleMarker center={NODE_COORDS[currentLocation]} radius={10} pathOptions={{ fillColor: "#38bdf8", fillOpacity: 1, color: 'white', weight: 3 }} />
          )}
        </MapContainer>
      </div>
    </div>
  );
}