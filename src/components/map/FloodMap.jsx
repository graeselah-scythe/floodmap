import React, { useState, useRef, useMemo, useEffect } from "react";
import { Tooltip, MapContainer, TileLayer, Marker, ZoomControl } from "react-leaflet";
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
const INITIAL_CENTER = [8.400, 124.645];
const INITIAL_ZOOM = 11.7;

const FloodMap = () => {
  const mapRef = useRef(null);
  const barangayListRef = useRef(null);

  // --- STATES ---
  const [appState, setAppState] = useState("upload"); 
  const [mapData, setMapData] = useState(cdo_geojson); 
  const [modelInfo, setModelInfo] = useState(null);
  
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [hovered, setHovered] = useState(null);
  const [selectedBarangay, setSelectedBarangay] = useState(null);
  
  // New state for model panel visibility
  const [showModelPanel, setShowModelPanel] = useState(false);
  const [modelPanelTimeout, setModelPanelTimeout] = useState(null);

  // --- EFFECTS ---
  // Auto-hide model panel after 10 seconds
  useEffect(() => {
    if (modelInfo && showModelPanel) {
      if (modelPanelTimeout) {
        clearTimeout(modelPanelTimeout);
      }
      
      const timeout = setTimeout(() => {
        setShowModelPanel(false);
      }, 10000);
      
      setModelPanelTimeout(timeout);
      
      return () => clearTimeout(timeout);
    }
  }, [modelInfo, showModelPanel]);

  // --- HANDLERS ---
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setAppState("training");

    try {
      const result = await trainAndPredict(file, cdo_geojson);
      
      if (result && result.geojson) {
        setMapData(result.geojson);
        setModelInfo({
          accuracy: result.accuracy,
          featureImportances: result.featureImportances,
          featureNames: result.featureNames,
          sampleCount: result.sampleCount,
          confusionMatrix: result.confusionMatrix
        });
        setShowModelPanel(true);
        setAppState("map");
      } else {
        throw new Error("Invalid training result");
      }
    } catch (error) {
      console.error("Training Error:", error);
      alert("Error processing CSV. Please check the format and try again.");
      setAppState("upload");
      setMapData(cdo_geojson);
    }
  };

  const handleBypass = () => {
    setMapData(cdo_geojson);
    setModelInfo(null);
    setAppState("map");
  };

  // Model panel handlers
  const handleModelPanelToggle = () => {
    if (modelPanelTimeout) {
      clearTimeout(modelPanelTimeout);
      setModelPanelTimeout(null);
    }
    setShowModelPanel(!showModelPanel);
  };

  const handleModelPanelMouseEnter = () => {
    if (modelPanelTimeout) {
      clearTimeout(modelPanelTimeout);
    }
  };

  const handleModelPanelMouseLeave = () => {
    if (showModelPanel) {
      const timeout = setTimeout(() => {
        setShowModelPanel(false);
      }, 5000);
      setModelPanelTimeout(timeout);
    }
  };

  // --- HELPERS ---
  const getRiskColor = (risk) => {
    switch (risk) {
      case "Very High": return "#E53935";
      case "High": return "#FB8C00";
      case "Medium": return "#FDD835";
      case "Low": return "#43A047";
      case "No Data": return "#757575";
      default: return "#757575";
    }
  };

  const getRiskColorName = (risk) => {
    switch (risk) {
      case "Very High": return "red";
      case "High": return "orange";
      case "Medium": return "yellow";
      case "Low": return "green";
      case "No Data": return "grey";
      default: return "grey";
    }
  };

  const getDynamicIcon = (risk, isSelected) => {
    const color = getRiskColorName(risk);
    const size = isSelected ? LARGE_SIZE : NORMAL_SIZE;
    return createIcon(color, size);
  };

  const filteredBarangays = useMemo(() => {
    if (!mapData || !mapData.features) return [];
    
    return mapData.features.filter((f) => {
      if (!f.properties) return false;
      
      if (riskFilter === "All") return true;
      if (riskFilter === "No Data") {
        return f.properties.risk === "No Data" || 
               (f.properties.predicted === false && !f.properties.risk);
      }
      return f.properties.risk === riskFilter;
    }).filter(f => {
      if (!search.trim()) return true;
      return f.properties.barangay && 
             f.properties.barangay.toLowerCase().includes(search.toLowerCase());
    });
  }, [mapData, search, riskFilter]);

  // --- MAP FUNCTIONS ---
  const setMapInstance = (map) => {
    mapRef.current = map;
    if (map) {
      setTimeout(() => {
        try {
          map.invalidateSize();
        } catch (error) {
          console.warn("Map size invalidation error:", error);
        }
      }, 300);
    }
  };

  const flyToBarangay = (barangay) => {
    const map = mapRef.current;
    if (!map || !barangay.geometry || !barangay.geometry.coordinates) return;
    
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

  // Model panel content
  const renderModelPanelContent = () => {
    if (!modelInfo) return null;
    
    const featureNames = modelInfo.featureNames || [
      'Elevation', 'Drainage', 'Proximity', 'Urbanization', 
      'Flood History', 'Water Level', 'Stagnation'
    ];
    
    return (
      <div className="model-panel-content">
        <div className="model-panel-header">
          <h4>Model Performance</h4>
          <button 
            className="close-btn"
            onClick={() => setShowModelPanel(false)}
            onMouseEnter={handleModelPanelMouseEnter}
          >
            ×
          </button>
        </div>
        
        <div className="model-stats">
          <div className="stat-item">
            <span className="stat-label">Accuracy:</span>
            <span className="stat-value">{modelInfo.accuracy}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Samples:</span>
            <span className="stat-value">{modelInfo.sampleCount}</span>
          </div>
        </div>
        
        <div className="feature-importance">
          <h5>Feature Importance</h5>
          {modelInfo.featureImportances.map((importance, index) => (
            <div key={index} className="feature-bar">
              <span className="feature-name">{featureNames[index] || `Feature ${index}`}</span>
              <div className="bar-container">
                <div 
                  className="bar" 
                  style={{ width: `${importance * 100}%` }}
                >
                  <span className="bar-percentage">{Math.round(importance * 100)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="floodmap-grid-container">
      
      <aside className="floodmap-sidebar">
        <div className="sidebar-content">
          {/* Upper Section: Barangay List */}
          <div className="upper-section">
            <h2>Barangay List</h2>
            <input
              type="text"
              placeholder="Search barangay..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />

            <div className="risk-filter-buttons">
              {["All", "No Data", "Low", "Medium", "High", "Very High"].map((risk) => (
                <button
                  key={risk}
                  onClick={() => setRiskFilter(risk)}
                  className={`risk-btn ${riskFilter === risk ? "active" : ""}`}
                  style={{ 
                    backgroundColor: risk === "No Data" ? "#757575" : 
                      risk === "Low" ? "#43A047" :
                      risk === "Medium" ? "#FDD835" :
                      risk === "High" ? "#FB8C00" :
                      risk === "Very High" ? "#E53935" : "#f0f0f0",
                    color: risk === "Medium" ? "#333" : "white"
                  }}
                >
                  {risk}
                </button>
              ))}
            </div>

            <div className="barangay-list" ref={barangayListRef}>
              {filteredBarangays.length === 0 ? (
                <p className="no-results">No barangays found</p>
              ) : (
                filteredBarangays.map((f, index) => (
                  <div
                    key={index}
                    className={`barangay-card ${hovered === f.properties.barangay ? "hovered" : ""}`}
                    onMouseEnter={() => setHovered(f.properties.barangay)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => flyToBarangay(f)}
                  >
                    <strong>{f.properties.barangay}</strong>
                    <span style={{ color: getRiskColor(f.properties.risk) }}>
                      {f.properties.risk || "No Data"}
                      {f.properties.predicted && " ✓"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Lower Section: Selected Barangay Details */}
          <div className="lower-section">
            <div className="info-panel">
              {selectedBarangay ? (
                <>
                  <h3>{selectedBarangay.barangay}</h3>
                  <p><strong>Flood Risk: </strong>
                    <span style={{ color: getRiskColor(selectedBarangay.risk) }}>
                      {selectedBarangay.risk || "No Data"}
                    </span>
                  </p>
                  {selectedBarangay.predicted !== undefined && (
                    <>
                      <p><strong>Predicted: </strong>
                        {selectedBarangay.predicted ? "Yes" : "No"}
                      </p>
                      <p><strong>Confidence: </strong>
                        {selectedBarangay.confidence || "N/A"}
                      </p>
                      {selectedBarangay.calculated_risk && (
                        <p><strong>Survey Risk: </strong>
                          {selectedBarangay.calculated_risk}
                        </p>
                      )}
                      {selectedBarangay.survey_entries > 0 && (
                        <p><strong>Survey Entries: </strong>
                          {selectedBarangay.survey_entries}
                        </p>
                      )}
                    </>
                  )}
                </>
              ) : (
                <p className="placeholder-text">Click a barangay to view details</p>
              )}
            </div>
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

          {appState === 'map' && (
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
              zoomControl={false} 
            >
              <TileLayer 
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              
              <ZoomControl position="topleft" />

              {filteredBarangays.map((f, index) => {
                const isSelected = selectedBarangay && selectedBarangay.barangay === f.properties.barangay;
                const risk = f.properties.risk || "No Data";
                
                return (
                  <Marker
                    key={index}
                    position={[f.geometry.coordinates[1], f.geometry.coordinates[0]]}
                    icon={getDynamicIcon(risk, isSelected)}
                    zIndexOffset={isSelected ? 1000 : 0} 
                    eventHandlers={{ click: () => flyToBarangay(f) }}
                  >
                    {/* Hover Tooltip */}
                    <Tooltip 
                      direction="top" 
                      offset={[0, -28]} 
                      opacity={0.9}
                      className="hover-tooltip"
                    >
                      {f.properties.barangay}: {risk}
                    </Tooltip>
                    
                    {/* Selected Tooltip (permanent) */}
                    {isSelected && (
                      <Tooltip 
                        direction="bottom" 
                        offset={[0, 10]} 
                        opacity={1}
                        permanent={true}
                        className="selected-tooltip"
                      >
                        {f.properties.barangay}: {risk}
                      </Tooltip>
                    )}
                  </Marker>
                );
              })}
            </MapContainer>
          )}
        </div>
      </main>

      {/* Model Performance Panel */}
      {modelInfo && (
        <div 
          className={`model-panel ${showModelPanel ? 'expanded' : 'collapsed'}`}
          onMouseEnter={handleModelPanelMouseEnter}
          onMouseLeave={handleModelPanelMouseLeave}
        >
          {showModelPanel ? (
            renderModelPanelContent()
          ) : (
            <button 
              className="model-panel-toggle"
              onClick={handleModelPanelToggle}
              title="Show Model Performance"
            >
              ?
            </button>
          )}
        </div>
      )}

      {/* OVERLAYS */}
      {appState === 'upload' && (
        <div className="overlay-container">
          <div className="upload-box">
            <h2>Initialize Flood Model</h2>
            <p>Upload your CSV dataset to train the Random Forest model.</p>
            <p className="format-note">
              <strong>CSV Format:</strong> Barangay, Years Lived, Elevation, Drainage, 
              Proximity to Water, Area Type, Flood History, Max Water Level, Stagnation Time
            </p>
            
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
            <p>Analyzing survey data and predicting flood risks.</p>
            <p className="loading-detail">This may take a few moments...</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default FloodMap;