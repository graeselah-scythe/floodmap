import React, { useState, useRef, useMemo, useEffect } from "react";
import { Tooltip, MapContainer, TileLayer, Marker, ZoomControl } from "react-leaflet";
import "./FloodMap.css";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Import Data & Logic
import { cdo_geojson } from "../../data/cdo_geojson";
import { trainAndPredict, visualizeTraining } from "../training/floodRiskModel"; // Add visualizeTraining

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

  // State for visualization
  const [showVisualizeButton, setShowVisualizeButton] = useState(true);
  const [visualizationWindow, setVisualizationWindow] = useState(null);

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

  // Clean up visualization window on unmount
  useEffect(() => {
    return () => {
      if (visualizationWindow && !visualizationWindow.closed) {
        visualizationWindow.close();
      }
    };
  }, []);

  // --- HANDLERS ---
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setAppState("training");

    try {
      const result = await trainAndPredict(file, cdo_geojson);
      
      console.log("Training result:", result);
      
      if (result && result.geojson && result.success) {
        setMapData(result.geojson);
        
        setModelInfo({
          accuracy: result.modelInfo?.accuracy || "0",
          featureImportances: result.modelInfo?.featureImportances || [],
          featureNames: result.modelInfo?.featureNames || [
            'Residence Duration', 'Terrain Type', 'Infrastructure Quality', 
            'Proximity to Water', 'Area Type', 'Flood Frequency', 
            'Flood Depth', 'Flood Duration'
          ],
          sampleCount: result.modelInfo?.sampleCount || 0,
          barangayCount: result.modelInfo?.barangayCount || 0,
          distribution: result.modelInfo?.distribution || {},
          oobScore: result.modelInfo?.oobScore || "N/A"
        });
        
        setShowModelPanel(true);
        setAppState("map");
        
        // If visualization window is open, send the training results
        if (visualizationWindow && !visualizationWindow.closed) {
          visualizationWindow.postMessage({
            type: 'TRAINING_COMPLETE',
            data: {
              modelInfo: result.modelInfo,
              predictions: result.geojson.features.map(f => ({
                barangay: f.properties.barangay,
                risk: f.properties.risk_level,
                confidence: f.properties.confidence
              }))
            }
          }, '*');
        }
      } else {
        throw new Error(result?.error || "Invalid training result");
      }
    } catch (error) {
      console.error("Training Error:", error);
      alert(`Error: ${error.message}`);
      setAppState("upload");
      setMapData(cdo_geojson);
      setModelInfo(null);
    }
  };

  const handleVisualizeTraining = () => {
    // Open a new window/tab for visualization
    const width = 1200;
    const height = 800;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    const win = window.open(
      '/visualize-training',
      'TrainingVisualizer',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
    
    if (win) {
      setVisualizationWindow(win);
      setShowVisualizeButton(false);
      
      // Listen for window close
      const checkClose = setInterval(() => {
        if (win.closed) {
          clearInterval(checkClose);
          setVisualizationWindow(null);
          setShowVisualizeButton(true);
        }
      }, 500);
    }
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
      case "Critical": return "#E53935";
      case "High": return "#FB8C00";
      case "Moderate": return "#FDD835";
      case "Low": return "#43A047";
      case "Unknown": return "#757575";
      default: return "#757575";
    }
  };

  const getRiskColorName = (risk) => {
    switch (risk) {
      case "Critical": return "red";
      case "High": return "orange";
      case "Moderate": return "yellow";
      case "Low": return "green";
      case "Unknown": return "grey";
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
        return !f.properties.risk_level || f.properties.risk_level === "Unknown";
      }
      return f.properties.risk_level === riskFilter;
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

  // Model panel content - FIXED VERSION
  const renderModelPanelContent = () => {
    if (!modelInfo) return null;
    
    const featureImportances = modelInfo.featureImportances || [];
    const featureNames = modelInfo.featureNames || [
      'Residence Duration', 'Terrain Type', 'Infrastructure Quality', 
      'Proximity to Water', 'Area Type', 'Flood Frequency', 
      'Flood Depth', 'Flood Duration'
    ];
    
    const distribution = modelInfo.distribution || {};
    
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
            <span className="stat-value">{modelInfo.accuracy || '0'}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Samples:</span>
            <span className="stat-value">{modelInfo.sampleCount || 0}</span>
          </div>
          {modelInfo.barangayCount > 0 && (
            <div className="stat-item">
              <span className="stat-label">Barangays:</span>
              <span className="stat-value">{modelInfo.barangayCount}</span>
            </div>
          )}
        </div>
        
        {Object.keys(distribution).length > 0 && (
          <div className="risk-distribution">
            <h5>Risk Distribution</h5>
            <div className="distribution-bars">
              {Object.entries(distribution).map(([risk, count]) => (
                <div key={risk} className="distribution-item">
                  <span className="distribution-label" style={{ color: getRiskColor(risk) }}>
                    {risk}
                  </span>
                  <span className="distribution-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="feature-importance">
          <h5>Feature Importance</h5>
          {featureImportances.length > 0 ? (
            featureImportances.map((item, index) => {
              const importance = typeof item === 'object' ? (item.importance || 0) : (item || 0);
              const featureName = typeof item === 'object' 
                ? (item.feature || featureNames[index] || `Feature ${index}`)
                : (featureNames[index] || `Feature ${index}`);
              
              return (
                <div key={index} className="feature-bar">
                  <span className="feature-name">{featureName}</span>
                  <div className="bar-container">
                    <div 
                      className="bar" 
                      style={{ width: `${Math.min(importance * 100, 100)}%` }}
                    >
                      <span className="bar-percentage">
                        {Math.round(importance * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="no-features">No feature importance data available</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="floodmap-grid-container">
      
      <aside className="floodmap-sidebar">
        <div className="sidebar-content">
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
              {["All", "No Data", "Low", "Moderate", "High", "Critical"].map((risk) => (
                <button
                  key={risk}
                  onClick={() => setRiskFilter(risk)}
                  className={`risk-btn ${riskFilter === risk ? "active" : ""}`}
                  style={{ 
                    backgroundColor: risk === "No Data" ? "#757575" : 
                      risk === "Low" ? "#43A047" :
                      risk === "Moderate" ? "#FDD835" :
                      risk === "High" ? "#FB8C00" :
                      risk === "Critical" ? "#E53935" : "#f0f0f0",
                    color: risk === "Moderate" ? "#333" : "white"
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
                filteredBarangays.map((f, index) => {
                  const risk = f.properties.risk_level || "Unknown";
                  return (
                    <div
                      key={index}
                      className={`barangay-card ${hovered === f.properties.barangay ? "hovered" : ""}`}
                      onMouseEnter={() => setHovered(f.properties.barangay)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => flyToBarangay(f)}
                    >
                      <strong>{f.properties.barangay}</strong>
                      <span style={{ color: getRiskColor(risk) }}>
                        {risk}
                        {f.properties.predicted && " ✓"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="lower-section">
            <div className="info-panel">
              {selectedBarangay ? (
                <>
                  <h3>{selectedBarangay.barangay}</h3>
                  <p><strong>Flood Risk: </strong>
                    <span style={{ color: getRiskColor(selectedBarangay.risk_level) }}>
                      {selectedBarangay.risk_level || "No Data"}
                    </span>
                  </p>
                  {selectedBarangay.predicted !== undefined && (
                    <>
                      <p><strong>Model Prediction: </strong>
                        {selectedBarangay.predicted ? "Yes" : "No"}
                      </p>
                      <p><strong>Confidence: </strong>
                        {selectedBarangay.confidence || "N/A"}
                      </p>
                      {selectedBarangay.survey_samples > 0 && (
                        <p><strong>Survey Samples: </strong>
                          {selectedBarangay.survey_samples}
                        </p>
                      )}
                      {selectedBarangay.calculated_risks && (
                        <p><strong>Survey Results: </strong>
                          {Object.entries(selectedBarangay.calculated_risks || {}).map(([risk, count]) => (
                            <span key={risk} style={{ marginRight: '10px' }}>
                              {risk}: {count}
                            </span>
                          ))}
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
                const risk = f.properties.risk_level || "Unknown";
                
                return (
                  <Marker
                    key={index}
                    position={[f.geometry.coordinates[1], f.geometry.coordinates[0]]}
                    icon={getDynamicIcon(risk, isSelected)}
                    zIndexOffset={isSelected ? 1000 : 0} 
                    eventHandlers={{ click: () => flyToBarangay(f) }}
                  >
                    <Tooltip 
                      direction="top" 
                      offset={[0, -28]} 
                      opacity={0.9}
                      className="hover-tooltip"
                    >
                      {f.properties.barangay}: {risk}
                    </Tooltip>
                    
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
              <strong>CSV Format (9 columns):</strong><br />
              Barangay, Residence Duration, Terrain Type, Infrastructure Quality,<br />
              Proximity to Water, Area Type, Flood Frequency, Flood Depth, Flood Duration
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
            <p className="loading-detail">
              Watch the visualization window for real-time training progress!
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

export default FloodMap;