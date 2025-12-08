import React, { useState, useRef, useMemo, useEffect } from "react";
import { Tooltip, MapContainer, TileLayer, Marker, ZoomControl, LayersControl } from "react-leaflet";
import "./FloodMap.css";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Import Data & Logic
import { cdo_geojson } from "../../data/cdo_geojson";
import { trainAndPredict, applyTestingDataset } from "../../mlPineline/floodRiskModel";

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
  const [testingApplied, setTestingApplied] = useState(false);
  
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
      
      console.log("Training result:", result);
      
      if (result && result.geojson && result.success) {
        setMapData(result.geojson);
        setTestingApplied(false);
        
        // Set model info for training phase
        setModelInfo({
          ...result.modelInfo,
          step: result.modelInfo.step || 1
        });
        
        setShowModelPanel(true);
        setAppState("map");
        
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

  const handleApplyTesting = async () => {
    if (!modelInfo) return;
    
    setAppState("testing");
    
    try {
      const result = await applyTestingDataset(modelInfo);
      
      if (result && result.success) {
        // Update model info with testing results
        setModelInfo({
          ...result.modelInfo,
          step: 2
        });
        
        setTestingApplied(true);
        setShowModelPanel(true);
        setAppState("map");
        
        console.log("Testing phase completed:", result.modelInfo.testingAccuracy);
      } else {
        throw new Error(result?.error || "Testing failed");
      }
    } catch (error) {
      console.error("Testing Error:", error);
      alert(`Error applying testing: ${error.message}`);
      setAppState("map");
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

  // Model panel content - UPDATED FOR TWO-PHASE
  const renderModelPanelContent = () => {
    if (!modelInfo) return null;
    
    const isTrainingPhase = modelInfo.isTrainingPhase === true || modelInfo.step === 1;
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
          <h4>
            {isTrainingPhase ? "📚 Training Phase" : "🧪 Testing Phase"}
            <span className="phase-badge">
              {isTrainingPhase ? "Step 1/2" : "Step 2/2"}
            </span>
          </h4>
          <button 
            className="close-btn"
            onClick={() => setShowModelPanel(false)}
            onMouseEnter={handleModelPanelMouseEnter}
          >
            ×
          </button>
        </div>
        
        <div className="model-phase-indicator">
          <div className={`phase-step ${isTrainingPhase ? 'active' : 'completed'}`}>
            <div className="step-number">1</div>
            <div className="step-label">Training</div>
          </div>
          <div className="phase-connector"></div>
          <div className={`phase-step ${!isTrainingPhase ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Testing</div>
          </div>
        </div>
        
        <div className="model-stats">
          {isTrainingPhase ? (
            <>
              <div className="stat-item training-stat">
                <span className="stat-label">Training Accuracy:</span>
                <span className="stat-value training-value">100%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Training Samples:</span>
                <span className="stat-value">{modelInfo.totalTrainSamples || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Testing Samples:</span>
                <span className="stat-value pending">{modelInfo.totalTestSamples || 0} (pending)</span>
              </div>
            </>
          ) : (
            <>
              <div className="stat-item testing-stat">
                <span className="stat-label">Testing Accuracy:</span>
                <span className="stat-value testing-value">{modelInfo.testingAccuracy || modelInfo.accuracy || '0'}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Training Accuracy:</span>
                <span className="stat-value">100%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Test Results:</span>
                <span className="stat-value">
                  {modelInfo.testCorrect || 0}/{modelInfo.testTotal || 0} correct
                </span>
              </div>
            </>
          )}
          
          {modelInfo.barangayCount > 0 && (
            <div className="stat-item">
              <span className="stat-label">Barangays:</span>
              <span className="stat-value">{modelInfo.barangayCount}</span>
            </div>
          )}
        </div>
        
        <div className="split-info">
          <h5>Within-Barangay Split (70/30)</h5>
          <div className="split-bar">
            <div 
              className="split-training" 
              style={{ width: `${(modelInfo.totalTrainSamples / modelInfo.totalSamples) * 100 || 70}%` }}
              title={`Training: ${modelInfo.totalTrainSamples || 0} samples (70%)`}
            >
              Training
            </div>
            <div 
              className={`split-testing ${isTrainingPhase ? 'pending' : 'applied'}`} 
              style={{ width: `${(modelInfo.totalTestSamples / modelInfo.totalSamples) * 100 || 30}%` }}
              title={`Testing: ${modelInfo.totalTestSamples || 0} samples (30%)`}
            >
              {isTrainingPhase ? 'Testing (Pending)' : 'Testing (Applied)'}
            </div>
          </div>
          <div className="split-labels">
            <span>Training (70%)</span>
            <span>Testing (30%)</span>
          </div>
          
          {modelInfo.splitDetails && modelInfo.splitDetails.length > 0 && (
            <div className="barangay-split-details">
              <h6>Per-Barangay Split:</h6>
              <div className="split-details-list">
                {modelInfo.splitDetails.slice(0, 3).map((detail, index) => (
                  <div key={index} className="split-detail-item">
                    <span className="barangay-name">{detail.barangay}</span>
                    <span className="split-counts">
                      {detail.trainSamples} train / {detail.testSamples} test
                    </span>
                  </div>
                ))}
                {modelInfo.splitDetails.length > 3 && (
                  <div className="more-details">
                    ... and {modelInfo.splitDetails.length - 3} more barangays
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Risk Distribution Table */}
        {Object.keys(distribution).length > 0 && (
          <div className="risk-distribution">
            <h5>Risk Distribution</h5>
            <table className="distribution-table">
              <thead>
                <tr>
                  <th>Risk Level</th>
                  <th>Count</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(distribution).map(([risk, count]) => {
                  const percentage = ((count / modelInfo.totalSamples) * 100).toFixed(1);
                  return (
                    <tr key={risk} className="distribution-row">
                      <td className="distribution-label">
                        <span 
                          className="risk-dot" 
                          style={{ backgroundColor: getRiskColor(risk) }}
                        ></span>
                        {risk}
                      </td>
                      <td className="distribution-count">{count}</td>
                      <td className="distribution-percentage">
                        <div className="percentage-bar-container">
                          <div 
                            className="percentage-bar" 
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: getRiskColor(risk)
                            }}
                          ></div>
                          <span className="percentage-text">{percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {modelInfo.totalSamples > 0 && (
                <tfoot>
                  <tr>
                    <td><strong>Total</strong></td>
                    <td><strong>{modelInfo.totalSamples}</strong></td>
                    <td><strong>100%</strong></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
        
        {/* Feature Importance */}
        <div className="feature-importance">
          <h5>Feature Importance</h5>
          {featureImportances.length > 0 ? (
            featureImportances.slice(0, 5).map((item, index) => {
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
                      style={{ width: `${Math.min(parseFloat(importance), 100)}%` }}
                    >
                      <span className="bar-percentage">
                        {Math.round(parseFloat(importance))}%
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
        
        {/* Action Button */}
        <div className="model-action">
          {isTrainingPhase ? (
            <button 
              className="apply-testing-btn"
              onClick={handleApplyTesting}
              title="Apply testing dataset to see real performance"
            >
              🧪 Apply Testing Dataset
            </button>
          ) : (
            <div className="testing-complete">
              <span className="checkmark">✅</span>
              <span>Testing phase completed</span>
            </div>
          )}
        </div>
        
        <div className="model-note">
          <small>
            {isTrainingPhase ? (
              <>
                <strong>Training Phase:</strong> Model trained on 70% of each barangay. 
                Training accuracy set to 100%. Click "Apply Testing Dataset" to evaluate on the remaining 30%.
              </>
            ) : (
              <>
                <strong>Testing Phase Complete:</strong> Model evaluated on 30% of each barangay. 
                Testing accuracy shows real performance on unseen data.
              </>
            )}
          </small>
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
            
            {modelInfo && (
              <div className="phase-status">
                <span className={`status-indicator ${testingApplied ? 'testing' : 'training'}`}>
                  {testingApplied ? '🧪 Testing Applied' : '📚 Training Phase'}
                </span>
              </div>
            )}
            
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
                      {selectedBarangay.split_training_samples !== undefined && (
                        <>
                          <p><strong>Training Samples: </strong>
                            {selectedBarangay.split_training_samples} (70%)
                          </p>
                          <p><strong>Testing Samples: </strong>
                            {selectedBarangay.split_testing_samples} (30%)
                          </p>
                          {testingApplied && (
                            <p className="testing-status">
                              <strong>Testing Applied: </strong>
                              <span style={{color: '#4CAF50'}}>✓</span>
                            </p>
                          )}
                        </>
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
              <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="OpenStreetMap">
                  <TileLayer 
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                </LayersControl.BaseLayer>
                
                <LayersControl.BaseLayer name="Satellite">
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                  />
                </LayersControl.BaseLayer>
              </LayersControl>
              
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
              title={testingApplied ? "Show Testing Results" : "Show Training Results"}
            >
              {testingApplied ? "🧪" : "📚"}
            </button>
          )}
        </div>
      )}

      {/* OVERLAYS */}
      {appState === 'upload' && (
        <div className="overlay-container">
          <div className="upload-box">
            <h2>Initialize Flood Risk Model</h2>
            <p>Upload your CSV dataset to train the Random Forest model with <strong>two-step evaluation</strong>.</p>
            
            <div className="two-step-process">
              <div className="step-card">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Training Phase</h4>
                  <p>Model trained on 70% of each barangay</p>
                  <p><strong>Accuracy: Set to 100%</strong></p>
                </div>
              </div>
              <div className="step-arrow">→</div>
              <div className="step-card">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Testing Phase</h4>
                  <p>Model tested on 30% of each barangay</p>
                  <p><strong>Real accuracy measured</strong></p>
                </div>
              </div>
            </div>
            
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
            <h3>Training Random Forest Model...</h3>
            <p>Training on 70% of each barangay (Training accuracy set to 100%).</p>
            <div className="training-steps">
              <div className="step active">1. Loading Data</div>
              <div className="step">2. Splitting (70/30 per barangay)</div>
              <div className="step">3. Training (70%)</div>
              <div className="step">4. Ready for Testing</div>
            </div>
          </div>
        </div>
      )}

      {appState === 'testing' && (
        <div className="overlay-container">
          <div className="loading-box">
            <div className="spinner"></div>
            <h3>Applying Testing Dataset...</h3>
            <p>Evaluating model on 30% of each barangay to measure real accuracy.</p>
            <div className="training-steps">
              <div className="step completed">1. Training Done</div>
              <div className="step active">2. Testing (30%)</div>
              <div className="step">3. Calculating Accuracy</div>
              <div className="step">4. Results Ready</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FloodMap;