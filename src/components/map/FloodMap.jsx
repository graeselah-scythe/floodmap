import React, { useState, useRef, useMemo } from "react";
import { Tooltip, MapContainer, TileLayer, Marker } from "react-leaflet";
import "./FloodMap.css";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Import Data & Logic
import { cdo_geojson } from "../../data/cdo_geojson";
import { trainAndPredict } from "../training/floodRiskModel"; 

// --- ICON GENERATOR ---
const createIcon = (color, size) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: size,       
    iconAnchor: [size[0] / 2, size[1]], 
    popupAnchor: [1, -34],
  });
};

// Icon Sizes
const NORMAL_SIZE = [27, 41];
const LARGE_SIZE = [45, 68]; 

// --- MAP CONSTANTS ---
const CDO_BOUNDS = [
  [8.18, 124.35], 
  [8.65, 124.95]  
];
const INITIAL_CENTER = [8.495, 124.645];
const INITIAL_ZOOM = 11;

const FloodMap = () => {
  const mapRef = useRef(null);

  // --- STATES ---
  const [appState, setAppState] = useState("upload"); 
  const [mapData, setMapData] = useState(cdo_geojson); 
  
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [hovered, setHovered] = useState(null);
  const [selectedBarangay, setSelectedBarangay] = useState(null);

  // --- HANDLERS ---
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setAppState("training");

    try {
      const processedGeoJson = await trainAndPredict(file, cdo_geojson);
      setMapData(processedGeoJson);
      setAppState("map");
    } catch (error) {
      console.error("Training Error:", error);
      alert("Error processing CSV. Check format.");
      setAppState("upload");
    }
  };

  const handleBypass = () => {
    setMapData(cdo_geojson);
    setAppState("map");
  };

  // --- HELPERS ---
  const getRiskColor = (risk) => {
    switch (risk) {
      case "Very High": return "#E53935";
      case "High": return "#FB8C00";
      case "Medium": return "#FDD835";
      case "Low": return "#43A047";
      default: return "#757575";
    }
  };

  const getRiskColorName = (risk) => {
    switch (risk) {
      case "Very High": return "red";
      case "High": return "orange";
      case "Medium": return "yellow";
      case "Low": return "green";
      default: return "grey";
    }
  };

  const getDynamicIcon = (risk, isSelected) => {
    const color = getRiskColorName(risk);
    const size = isSelected ? LARGE_SIZE : NORMAL_SIZE;
    return createIcon(color, size);
  };

  const filteredBarangays = useMemo(() => {
    if (!mapData) return [];
    return mapData.features.filter((f) => {
      const matchRisk = riskFilter === "All" || f.properties.risk === riskFilter;
      const matchSearch = f.properties.barangay.toLowerCase().includes(search.toLowerCase());
      return matchRisk && matchSearch;
    });
  }, [mapData, search, riskFilter]);

  // --- MAP FUNCTIONS ---
  const setMapInstance = (map) => {
    mapRef.current = map;
    if (map) {
      setTimeout(() => map.invalidateSize(), 100);
    }
  };

  const flyToBarangay = (barangay) => {
    const map = mapRef.current;
    if (!map) return;
    
    const coords = barangay.geometry.coordinates;
    map.flyTo([coords[1], coords[0]], 16, { animate: true, duration: 1.5 });
    
    setSelectedBarangay(barangay.properties);
  };

  const resetMapView = () => {
    const map = mapRef.current;
    if (!map) return;

    map.flyTo(INITIAL_CENTER, INITIAL_ZOOM, {
      animate: true,
      duration: 1.5
    });
    
    setSelectedBarangay(null);
  };

  return (
    <div className="floodmap-grid-container">

      <aside className="floodmap-sidebar">
        <div className="sidebar-content">
          <h2>Barangay List</h2>
          <input
            type="text"
            placeholder="Search barangay..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />

          <div className="risk-filter-buttons">
            {["All", "Low", "Medium", "High", "Very High"].map((risk) => (
              <button
                key={risk}
                onClick={() => setRiskFilter(risk)}
                className={`risk-btn ${riskFilter === risk ? "active" : ""}`}
              >
                {risk}
              </button>
            ))}
          </div>

          <div className="info-panel">
            {selectedBarangay ? (
              <>
                <h3>{selectedBarangay.barangay}</h3>
                <p><strong>Flood Risk: </strong>
                  <span style={{ color: getRiskColor(selectedBarangay.risk) }}>
                    {selectedBarangay.risk}
                  </span>
                </p>
              </>
            ) : (
              <p className="placeholder-text">Click a barangay to view details</p>
            )}
          </div>

          <div className="barangay-list">
            {filteredBarangays.map((f, index) => (
              <div
                key={index}
                className={`barangay-card ${hovered === f.properties.barangay ? "hovered" : ""}`}
                onMouseEnter={() => setHovered(f.properties.barangay)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => flyToBarangay(f)}
              >
                <strong>{f.properties.barangay}</strong>
                <span style={{ color: getRiskColor(f.properties.risk) }}>{f.properties.risk}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="floodmap-main">
        <div className="map-container">
          
          {selectedBarangay && (
            <button className="reset-map-btn" onClick={resetMapView}>
              Back to Overview
            </button>
          )}

          <MapContainer
            center={INITIAL_CENTER}
            zoom={INITIAL_ZOOM}
            minZoom={10} 
            maxZoom={18}
            maxBounds={CDO_BOUNDS}          
            maxBoundsViscosity={1.0}        
            scrollWheelZoom={true}
            className="leaflet-map"
            ref={setMapInstance} 
          >
            <TileLayer 
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {filteredBarangays.map((f, index) => {
              const isSelected = selectedBarangay && selectedBarangay.barangay === f.properties.barangay;
              
              return (
                <Marker
                  key={index}
                  position={[f.geometry.coordinates[1], f.geometry.coordinates[0]]}
                  icon={getDynamicIcon(f.properties.risk, isSelected)}
                  zIndexOffset={isSelected ? 1000 : 0} 
                  eventHandlers={{ click: () => flyToBarangay(f) }}
                >
                  <Tooltip 
                    // === CRITICAL FIX: KEY FORCES RE-RENDER ===
                    key={isSelected ? "selected" : "hover"} 
                    
                    direction={isSelected ? "bottom" : "top"} 
                    offset={isSelected ? [0, 5] : [0, -28]} 
                    opacity={1} 
                    permanent={isSelected} 
                    className={isSelected ? "barangay-tooltip-selected" : ""}
                  >
                    {f.properties.barangay}
                  </Tooltip>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </main>

      {/* OVERLAYS */}
      {appState === 'upload' && (
        <div className="overlay-container">
          <div className="upload-box">
            <h2>Initialize Flood Model</h2>
            <p>Upload your CSV dataset to train the Random Forest model.</p>
            
            <div className="upload-input-wrapper">
              <input 
                type="file" 
                accept=".csv"
                id="csvInput"
                onChange={handleFileUpload} 
                className="hidden-input"
              />
              <label htmlFor="csvInput" className="upload-btn">
                Select CSV File
              </label>

              <div className="divider-text">or</div>

              <button onClick={handleBypass} className="bypass-btn">
                Skip Training & View Map
              </button>
            </div>
          </div>
        </div>
      )}

      {appState === 'training' && (
        <div className="overlay-container">
          <div className="loading-box">
            <div className="spinner"></div>
            <h3>Training AI Model...</h3>
            <p>Analyzing parameters and predicting risks.</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default FloodMap;