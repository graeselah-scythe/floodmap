// TrainingVisualizer.jsx
import React, { useState, useEffect, useRef } from 'react';
import './TrainingVisualizer.css';
import * as Papa from 'papaparse';

const TrainingVisualizer = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(3000); // 3 seconds per step
  const [dataset, setDataset] = useState([]);
  const [encodedData, setEncodedData] = useState([]);
  const [bootstrapSamples, setBootstrapSamples] = useState([]);
  const [featureImportances, setFeatureImportances] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isTrainingComplete, setIsTrainingComplete] = useState(false);
  const [fileContent, setFileContent] = useState(null);
  const fileInputRef = useRef(null);

  const steps = [
    { id: 1, title: "📁 Load Dataset", description: "Loading and displaying raw survey data" },
    { id: 2, title: "🔍 Data Exploration", description: "Exploring dataset statistics and distributions" },
    { id: 3, title: "⚙️ Feature Encoding", description: "Converting categorical features to numerical values" },
    { id: 4, title: "🔄 Data Preprocessing", description: "Normalizing and preparing data for training" },
    { id: 5, title: "🎯 Bootstrap Sampling", description: "Creating random subsets for Random Forest" },
    { id: 6, title: "🌳 Building Decision Trees", description: "Training individual decision trees" },
    { id: 7, title: "🌲 Random Forest Ensemble", description: "Combining predictions from all trees" },
    { id: 8, title: "📊 Feature Importance", description: "Analyzing which features matter most" },
    { id: 9, title: "🎯 Making Predictions", description: "Predicting flood risk for all barangays" },
    { id: 10, title: "📈 Results Analysis", description: "Analyzing prediction results and accuracy" }
  ];

  // Feature mapping for encoding visualization
  const featureMappings = {
    residenceDuration: {
      'Less than 1 year': 0,
      '1-5 years': 1,
      '5-10 years': 2,
      'More than 10 years': 3
    },
    terrainType: {
      'Low-lying area or valley': 0,
      'Flat land': 1,
      'On a slope or hillside': 2
    },
    infrastructureQuality: {
      'Poor': 0,
      'Average': 1,
      'Good': 2
    },
    proximityToWater: {
      'Right beside a water body (<50m)': 0,
      'Within walking distance (500m)': 1,
      'Quite far away (>500m)': 2
    },
    areaType: {
      'Highly urbanized': 0,
      'Mixed urban and open spaces': 1,
      'Mostly rural': 2
    },
    floodFrequency: {
      'Never flooded': 0,
      '1-2 times': 1,
      '3-5 times': 2,
      'More than 5 times': 3
    },
    floodDepth: {
      'No flooding experienced': 0,
      'Ankle-deep (below knee)': 0.5,
      'Knee-deep to waist-level': 1.5,
      'Waist-level': 2.5,
      'Chest-level or higher': 3
    },
    floodDuration: {
      'Less than 1 hour': 0,
      '1-6 hours': 1,
      '6-24 hours': 2,
      'More than 24 hours': 3
    }
  };

  // Listen for training completion from main window
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'TRAINING_COMPLETE') {
        setPredictions(event.data.data.predictions);
        setFeatureImportances(event.data.data.modelInfo.featureImportances);
        setIsTrainingComplete(true);
        addLog("✅ Training completed! Results received from main window.");
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Auto-play steps
  useEffect(() => {
    let interval;
    if (isPlaying && currentStep < steps.length) {
      interval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentStep, speed]);

  const addLog = (message) => {
    setLogs(prev => [
      ...prev,
      { timestamp: new Date().toLocaleTimeString(), message }
    ]);
  };

  const handleFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      setFileContent(content);
      
      // Parse CSV
      const results = Papa.parse(content, {
        header: false,
        skipEmptyLines: true
      });
      
      setDataset(results.data.slice(0, 20)); // Show first 20 rows
      addLog(`📊 Loaded ${results.data.length} rows from CSV file`);
      
      // Simulate feature encoding
      setTimeout(() => {
        const encoded = results.data.slice(0, 10).map(row => ({
          raw: row,
          encoded: row.map((value, idx) => {
            // Simple encoding simulation
            if (idx === 2 && value in featureMappings.terrainType) {
              return featureMappings.terrainType[value];
            }
            if (idx === 6 && value in featureMappings.floodFrequency) {
              return featureMappings.floodFrequency[value];
            }
            return value;
          })
        }));
        setEncodedData(encoded);
        addLog("⚙️ Features encoded to numerical values");
      }, 2000);
    };
    reader.readAsText(file);
  };

  const simulateBootstrap = () => {
    if (dataset.length === 0) return;
    
    const samples = [];
    for (let i = 0; i < 3; i++) {
      const sample = [];
      for (let j = 0; j < 10; j++) {
        const randomIndex = Math.floor(Math.random() * dataset.length);
        sample.push(dataset[randomIndex]);
      }
      samples.push(sample);
    }
    setBootstrapSamples(samples);
    addLog("🔄 Created 3 bootstrap samples for Random Forest training");
  };

  const simulateDecisionTree = () => {
    addLog("🌳 Building Decision Tree 1...");
    setTimeout(() => addLog("🌳 Building Decision Tree 2..."), 1000);
    setTimeout(() => addLog("🌳 Building Decision Tree 3..."), 2000);
    setTimeout(() => addLog("✅ All decision trees built successfully!"), 3000);
  };

  const startVisualization = () => {
    if (!fileContent) {
      alert("Please select a CSV file first!");
      return;
    }
    
    setIsPlaying(true);
    setCurrentStep(0);
    addLog("🎬 Starting training visualization...");
    
    // Simulate steps
    setTimeout(() => simulateBootstrap(), 5000);
    setTimeout(() => simulateDecisionTree(), 10000);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="step-content">
            <h3>Dataset Overview</h3>
            {dataset.length > 0 ? (
              <>
                <div className="dataset-info">
                  <p><strong>Rows:</strong> {dataset.length}</p>
                  <p><strong>Columns:</strong> {dataset[0]?.length || 0}</p>
                  <p><strong>Sample Data:</strong></p>
                </div>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Barangay</th>
                        <th>Residence</th>
                        <th>Terrain</th>
                        <th>Infrastructure</th>
                        <th>Water Proximity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataset.slice(0, 5).map((row, idx) => (
                        <tr key={idx}>
                          {row.slice(0, 5).map((cell, cellIdx) => (
                            <td key={cellIdx}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="file-upload-prompt">
                <button onClick={handleFileSelect} className="upload-btn">
                  📁 Select CSV File
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv"
                  style={{ display: 'none' }}
                />
                <p className="file-note">
                  Upload your survey data CSV to visualize the training process
                </p>
              </div>
            )}
          </div>
        );

      case 1:
        return (
          <div className="step-content">
            <h3>Data Statistics</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <h4>Feature Distribution</h4>
                <div className="stat-bar">
                  <span>Low-lying areas</span>
                  <div className="bar"><div className="fill" style={{ width: '65%' }}>65%</div></div>
                </div>
                <div className="stat-bar">
                  <span>Flat land</span>
                  <div className="bar"><div className="fill" style={{ width: '25%' }}>25%</div></div>
                </div>
                <div className="stat-bar">
                  <span>Hillsides</span>
                  <div className="bar"><div className="fill" style={{ width: '10%' }}>10%</div></div>
                </div>
              </div>
              <div className="stat-card">
                <h4>Flood History</h4>
                <div className="stat-bar">
                  <span>Never flooded</span>
                  <div className="bar"><div className="fill" style={{ width: '30%' }}>30%</div></div>
                </div>
                <div className="stat-bar">
                  <span>1-2 times</span>
                  <div className="bar"><div className="fill" style={{ width: '25%' }}>25%</div></div>
                </div>
                <div className="stat-bar">
                  <span>3-5 times</span>
                  <div className="bar"><div className="fill" style={{ width: '25%' }}>25%</div></div>
                </div>
                <div className="stat-bar">
                  <span>More than 5 times</span>
                  <div className="bar"><div className="fill" style={{ width: '20%' }}>20%</div></div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <h3>Feature Encoding</h3>
            <div className="encoding-table">
              <table>
                <thead>
                  <tr>
                    <th>Original Value</th>
                    <th>Encoded Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(featureMappings.terrainType).map(([key, value]) => (
                    <tr key={key}>
                      <td>{key}</td>
                      <td><code>{value}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {encodedData.length > 0 && (
              <div className="encoded-data">
                <h4>Sample Encoded Data:</h4>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Raw Terrain</th>
                        <th>Encoded</th>
                        <th>Raw Flood Freq</th>
                        <th>Encoded</th>
                      </tr>
                    </thead>
                    <tbody>
                      {encodedData.slice(0, 3).map((row, idx) => (
                        <tr key={idx}>
                          <td>{row.raw[2]}</td>
                          <td><code>{row.encoded[2]}</code></td>
                          <td>{row.raw[6]}</td>
                          <td><code>{row.encoded[6]}</code></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="step-content">
            <h3>Bootstrap Sampling</h3>
            <p>Random Forest creates multiple training sets by sampling with replacement</p>
            <div className="bootstrap-samples">
              {bootstrapSamples.map((sample, idx) => (
                <div key={idx} className="sample-card">
                  <h4>Sample {idx + 1}</h4>
                  <p><strong>Size:</strong> {sample.length} records</p>
                  <div className="sample-preview">
                    {sample.slice(0, 3).map((row, rowIdx) => (
                      <div key={rowIdx} className="sample-row">
                        {row[0]}: {row[2]} ({row[6]})
                      </div>
                    ))}
                    {sample.length > 3 && <div>... and {sample.length - 3} more</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 8:
        return (
          <div className="step-content">
            <h3>Feature Importance</h3>
            {featureImportances.length > 0 ? (
              <div className="importance-chart">
                {featureImportances.map((item, idx) => {
                  const importance = typeof item === 'object' ? item.importance : item;
                  const featureName = typeof item === 'object' ? item.feature : `Feature ${idx}`;
                  return (
                    <div key={idx} className="importance-item">
                      <span className="importance-label">{featureName}</span>
                      <div className="importance-bar-container">
                        <div 
                          className="importance-bar" 
                          style={{ width: `${Math.min(importance * 100, 100)}%` }}
                        >
                          <span className="importance-value">
                            {Math.round(importance * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="simulated-importance">
                <div className="importance-item">
                  <span className="importance-label">Flood Frequency</span>
                  <div className="importance-bar-container">
                    <div className="importance-bar" style={{ width: '85%' }}>
                      <span className="importance-value">85%</span>
                    </div>
                  </div>
                </div>
                <div className="importance-item">
                  <span className="importance-label">Flood Depth</span>
                  <div className="importance-bar-container">
                    <div className="importance-bar" style={{ width: '75%' }}>
                      <span className="importance-value">75%</span>
                    </div>
                  </div>
                </div>
                <div className="importance-item">
                  <span className="importance-label">Terrain Type</span>
                  <div className="importance-bar-container">
                    <div className="importance-bar" style={{ width: '60%' }}>
                      <span className="importance-value">60%</span>
                    </div>
                  </div>
                </div>
                <div className="importance-item">
                  <span className="importance-label">Proximity to Water</span>
                  <div className="importance-bar-container">
                    <div className="importance-bar" style={{ width: '55%' }}>
                      <span className="importance-value">55%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 9:
        return (
          <div className="step-content">
            <h3>Predictions Results</h3>
            {predictions.length > 0 ? (
              <div className="predictions-table">
                <table>
                  <thead>
                    <tr>
                      <th>Barangay</th>
                      <th>Predicted Risk</th>
                      <th>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.slice(0, 10).map((pred, idx) => (
                      <tr key={idx}>
                        <td>{pred.barangay}</td>
                        <td>
                          <span className={`risk-badge risk-${pred.risk?.toLowerCase()}`}>
                            {pred.risk}
                          </span>
                        </td>
                        <td>{pred.confidence}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {predictions.length > 10 && (
                  <p className="more-items">... and {predictions.length - 10} more barangays</p>
                )}
              </div>
            ) : (
              <div className="simulated-predictions">
                <p>Waiting for training to complete...</p>
                <p>Upload a CSV file in the main window to see real predictions here!</p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="step-content">
            <h3>{steps[currentStep]?.title}</h3>
            <p>{steps[currentStep]?.description}</p>
            <div className="simulation-placeholder">
              <div className="loading-animation">
                <div className="spinner"></div>
                <p>Simulating {steps[currentStep]?.title.toLowerCase()}...</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="training-visualizer">
      <header className="visualizer-header">
        <h1>🎬 Flood Risk Model Training Visualizer</h1>
        <p>Watch how the Random Forest algorithm learns from your data!</p>
      </header>

      <div className="visualizer-container">
        <aside className="control-panel">
          <div className="controls">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className={`control-btn ${isPlaying ? 'pause' : 'play'}`}
            >
              {isPlaying ? '⏸️ Pause' : '▶️ Play'}
            </button>
            <button 
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              className="control-btn"
              disabled={currentStep === 0}
            >
              ⏮️ Previous
            </button>
            <button 
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              className="control-btn"
              disabled={currentStep === steps.length - 1}
            >
              ⏭️ Next
            </button>
            
            <div className="speed-control">
              <label>Speed:</label>
              <select 
                value={speed} 
                onChange={(e) => setSpeed(parseInt(e.target.value))}
              >
                <option value="1000">1 sec/step</option>
                <option value="2000">2 sec/step</option>
                <option value="3000">3 sec/step</option>
                <option value="5000">5 sec/step</option>
              </select>
            </div>

            <button 
              onClick={startVisualization}
              className="control-btn start-btn"
              disabled={!fileContent}
            >
              🚀 Start Visualization
            </button>
          </div>

          <div className="steps-list">
            <h3>Training Steps</h3>
            {steps.map((step, idx) => (
              <div 
                key={step.id}
                className={`step-item ${currentStep === idx ? 'active' : ''}`}
                onClick={() => setCurrentStep(idx)}
              >
                <span className="step-number">{step.id}</span>
                <span className="step-title">{step.title}</span>
              </div>
            ))}
          </div>
        </aside>

        <main className="visualization-area">
          <div className="step-indicator">
            <h2>{steps[currentStep]?.title}</h2>
            <p>{steps[currentStep]?.description}</p>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(currentStep + 1) / steps.length * 100}%` }}
              ></div>
            </div>
            <div className="step-counter">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>

          <div className="visualization-content">
            {renderStepContent()}
          </div>

          <div className="logs-panel">
            <h3>Training Logs</h3>
            <div className="logs-container">
              {logs.slice(-10).map((log, idx) => (
                <div key={idx} className="log-entry">
                  <span className="log-time">[{log.timestamp}]</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="empty-logs">
                  Logs will appear here as training progresses...
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <footer className="visualizer-footer">
        <div className="footer-info">
          <p>
            <strong>Instructions:</strong> 
            1. Select a CSV file above 
            2. Click "Start Visualization" 
            3. Watch the training process 
            4. Upload the same file in the main window for real training
          </p>
          <p className="connection-status">
            {isTrainingComplete ? 
              "✅ Connected to main window - Real training complete!" : 
              "⚠️ Waiting for real training from main window..."}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TrainingVisualizer;