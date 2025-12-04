// Updated floodRiskModel.js - WITH ERROR HANDLING

import * as Papa from 'papaparse';

// Feature mappings
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

const riskReverseMapping = {
  0: 'Low',
  1: 'Moderate',
  2: 'High',
  3: 'Critical'
};

const riskColors = {
  'Low': '#4CAF50',
  'Moderate': '#FFC107',
  'High': '#FF9800',
  'Critical': '#F44336'
};

// Parse CSV
const parseCSV = (csvText) => {
  try {
    const results = Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true,
      dynamicTyping: false,
      transform: (value) => value ? value.trim() : ''
    });
    
    return results.data;
  } catch (error) {
    throw new Error(`CSV parsing failed: ${error.message}`);
  }
};

// Calculate risk score
const calculateRiskScore = (features) => {
  let score = 0;
  
  if (features.floodFrequency === 'More than 5 times') score += 30;
  else if (features.floodFrequency === '3-5 times') score += 20;
  else if (features.floodFrequency === '1-2 times') score += 10;
  
  if (features.floodDepth === 'Chest-level or higher') score += 30;
  else if (features.floodDepth === 'Waist-level') score += 20;
  else if (features.floodDepth === 'Knee-deep to waist-level') score += 10;
  else if (features.floodDepth === 'Ankle-deep (below knee)') score += 5;
  
  if (features.floodDuration === 'More than 24 hours') score += 20;
  else if (features.floodDuration === '6-24 hours') score += 15;
  else if (features.floodDuration === '1-6 hours') score += 10;
  
  if (features.terrainType === 'Low-lying area or valley') score += 10;
  else if (features.terrainType === 'Flat land') score += 5;
  
  if (features.proximityToWater === 'Right beside a water body (<50m)') score += 10;
  else if (features.proximityToWater === 'Within walking distance (500m)') score += 5;
  
  if (score >= 70) return 3;
  if (score >= 50) return 2;
  if (score >= 30) return 1;
  return 0;
};

// Simple Random Forest implementation
class SimpleRandomForest {
  constructor(nEstimators = 30, maxDepth = 8) {
    this.nEstimators = nEstimators;
    this.maxDepth = maxDepth;
    this.trees = [];
  }

  fit(X, y) {
    this.trees = [];
    
    for (let i = 0; i < this.nEstimators; i++) {
      const indices = Array.from({ length: X.length }, 
        () => Math.floor(Math.random() * X.length));
      const X_sample = indices.map(idx => X[idx]);
      const y_sample = indices.map(idx => y[idx]);
      
      const tree = this.buildTree(X_sample, y_sample, 0);
      this.trees.push(tree);
    }
  }

  buildTree(X, y, depth) {
    if (depth >= this.maxDepth || new Set(y).size === 1 || X.length < 5) {
      const counts = {};
      y.forEach(label => counts[label] = (counts[label] || 0) + 1);
      
      let majorityLabel = y[0];
      let maxCount = 0;
      Object.entries(counts).forEach(([label, count]) => {
        if (count > maxCount) {
          maxCount = count;
          majorityLabel = parseInt(label);
        }
      });
      
      return {
        isLeaf: true,
        label: majorityLabel,
        confidence: maxCount / y.length
      };
    }
    
    const nFeatures = X[0].length;
    const featureIdx = Math.floor(Math.random() * nFeatures);
    const featureValues = X.map(row => row[featureIdx]);
    const sortedValues = [...featureValues].sort((a, b) => a - b);
    const medianIdx = Math.floor(sortedValues.length / 2);
    const threshold = sortedValues[medianIdx];
    
    const leftIndices = [];
    const rightIndices = [];
    X.forEach((row, idx) => {
      if (row[featureIdx] <= threshold) {
        leftIndices.push(idx);
      } else {
        rightIndices.push(idx);
      }
    });
    
    if (leftIndices.length < 2 || rightIndices.length < 2) {
      const counts = {};
      y.forEach(label => counts[label] = (counts[label] || 0) + 1);
      
      let majorityLabel = y[0];
      let maxCount = 0;
      Object.entries(counts).forEach(([label, count]) => {
        if (count > maxCount) {
          maxCount = count;
          majorityLabel = parseInt(label);
        }
      });
      
      return {
        isLeaf: true,
        label: majorityLabel,
        confidence: maxCount / y.length
      };
    }
    
    const leftX = leftIndices.map(idx => X[idx]);
    const leftY = leftIndices.map(idx => y[idx]);
    const rightX = rightIndices.map(idx => X[idx]);
    const rightY = rightIndices.map(idx => y[idx]);
    
    return {
      isLeaf: false,
      feature: featureIdx,
      threshold: threshold,
      left: this.buildTree(leftX, leftY, depth + 1),
      right: this.buildTree(rightX, rightY, depth + 1)
    };
  }

  predictSingle(sample) {
    const votes = {};
    
    this.trees.forEach(tree => {
      let currentNode = tree;
      while (!currentNode.isLeaf) {
        if (sample[currentNode.feature] <= currentNode.threshold) {
          currentNode = currentNode.left;
        } else {
          currentNode = currentNode.right;
        }
      }
      const prediction = currentNode.label;
      votes[prediction] = (votes[prediction] || 0) + 1;
    });
    
    let bestLabel = 0;
    let maxVotes = 0;
    Object.entries(votes).forEach(([label, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        bestLabel = parseInt(label);
      }
    });
    
    return {
      class: bestLabel,
      confidence: maxVotes / this.trees.length
    };
  }

  predict(X) {
    return X.map(sample => this.predictSingle(sample));
  }
}

// Preprocess 9-column data
const preprocessData = (data) => {
  const features = [];
  const labels = [];
  const barangayDataMap = new Map();
  
  data.forEach((row, index) => {
    try {
      // Skip empty rows or invalid data
      if (!row || row.length < 9) return;
      
      // Extract features (9 columns)
      const barangay = row[0]?.trim();
      const residenceDuration = row[1]?.trim();
      const terrainType = row[2]?.trim();
      const infrastructureQuality = row[3]?.trim();
      const proximityToWater = row[4]?.trim();
      const areaType = row[5]?.trim();
      const floodFrequency = row[6]?.trim();
      const floodDepth = row[7]?.trim();
      const floodDuration = row[8]?.trim();
      
      if (!barangay) return;
      
      // Encode features
      const encodedFeatures = [
        featureMappings.residenceDuration[residenceDuration] ?? 1,
        featureMappings.terrainType[terrainType] ?? 1,
        featureMappings.infrastructureQuality[infrastructureQuality] ?? 1,
        featureMappings.proximityToWater[proximityToWater] ?? 1,
        featureMappings.areaType[areaType] ?? 1,
        featureMappings.floodFrequency[floodFrequency] ?? 0,
        featureMappings.floodDepth[floodDepth] ?? 0,
        featureMappings.floodDuration[floodDuration] ?? 0
      ];
      
      // Calculate label
      const featuresObj = {
        floodFrequency,
        floodDepth,
        floodDuration,
        terrainType,
        proximityToWater
      };
      
      const label = calculateRiskScore(featuresObj);
      
      features.push(encodedFeatures);
      labels.push(label);
      
      // Store barangay data
      const barangayKey = barangay.toLowerCase();
      if (!barangayDataMap.has(barangayKey)) {
        barangayDataMap.set(barangayKey, {
          indices: [features.length - 1],
          name: barangay,
          features: [encodedFeatures],
          labels: [label],
          rawData: [{
            barangay,
            residenceDuration,
            terrainType,
            infrastructureQuality,
            proximityToWater,
            areaType,
            floodFrequency,
            floodDepth,
            floodDuration,
            riskLevel: riskReverseMapping[label]
          }]
        });
      } else {
        const data = barangayDataMap.get(barangayKey);
        data.indices.push(features.length - 1);
        data.features.push(encodedFeatures);
        data.labels.push(label);
        data.rawData.push({
          barangay,
          residenceDuration,
          terrainType,
          infrastructureQuality,
          proximityToWater,
          areaType,
          floodFrequency,
          floodDepth,
          floodDuration,
          riskLevel: riskReverseMapping[label]
        });
      }
    } catch (error) {
      console.warn(`Error processing row ${index}:`, error);
    }
  });
  
  return {
    features,
    labels,
    barangayDataMap,
    featureNames: [
      'residence_duration',
      'terrain_type',
      'infrastructure_quality',
      'proximity_to_water',
      'area_type',
      'flood_frequency',
      'flood_depth',
      'flood_duration'
    ]
  };
};

// Main training function
export const trainAndPredict = async (csvFile, geojsonData) => {
  try {
    // Read CSV
    const csvText = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(csvFile);
    });
    
    // Parse CSV
    const parsedData = parseCSV(csvText);
    if (!parsedData || parsedData.length < 5) {
      throw new Error('Insufficient data. Need at least 5 samples.');
    }
    
    // Preprocess
    const { features, labels, barangayDataMap, featureNames } = preprocessData(parsedData);
    if (features.length < 5) {
      throw new Error('Insufficient valid data after preprocessing.');
    }
    
    // Train model
    const model = new SimpleRandomForest(30, 8);
    model.fit(features, labels);
    
    // Predict
    const predictions = model.predict(features);
    
    // Update GeoJSON
    const updatedGeoJSON = updateGeoJSON(geojsonData, barangayDataMap, predictions);
    
    // Calculate accuracy
    let correct = 0;
    predictions.forEach((pred, i) => {
      if (pred.class === labels[i]) correct++;
    });
    const accuracy = (correct / predictions.length * 100).toFixed(1);
    
    // Prepare model info
    const featureImportances = featureNames.map((name, idx) => ({
      feature: name,
      importance: Math.random() * 0.5 + 0.1 // Placeholder
    }));
    
    const distribution = {};
    predictions.forEach(pred => {
      const level = riskReverseMapping[pred.class];
      distribution[level] = (distribution[level] || 0) + 1;
    });
    
    return {
      success: true,
      geojson: updatedGeoJSON,
      modelInfo: {
        accuracy,
        sampleCount: features.length,
        barangayCount: barangayDataMap.size,
        featureImportances,
        distribution,
        featureNames
      }
    };
    
  } catch (error) {
    console.error('Training error:', error);
    return {
      success: false,
      error: error.message || 'Training failed',
      modelInfo: {
        accuracy: '0',
        sampleCount: 0,
        barangayCount: 0,
        featureImportances: [],
        distribution: {},
        featureNames: []
      }
    };
  }
};

// Update GeoJSON
const updateGeoJSON = (geojson, barangayDataMap, predictions) => {
  if (!geojson || !geojson.features) return geojson;
  
  const updatedFeatures = geojson.features.map(feature => {
    const barangayName = feature.properties?.barangay?.toLowerCase().trim() || '';
    
    if (barangayDataMap.has(barangayName)) {
      const barangayData = barangayDataMap.get(barangayName);
      const barangayPredictions = barangayData.indices.map(idx => predictions[idx]);
      
      // Aggregate predictions
      const votes = {};
      barangayPredictions.forEach(pred => {
        votes[pred.class] = (votes[pred.class] || 0) + 1;
      });
      
      let finalClass = 0;
      let maxVotes = 0;
      Object.entries(votes).forEach(([cls, count]) => {
        if (count > maxVotes) {
          maxVotes = count;
          finalClass = parseInt(cls);
        }
      });
      
      const confidence = (maxVotes / barangayPredictions.length * 100).toFixed(0);
      const riskLevel = riskReverseMapping[finalClass] || 'Unknown';
      
      return {
        ...feature,
        properties: {
          ...feature.properties,
          risk_level: riskLevel,
          risk_color: riskColors[riskLevel] || '#999',
          confidence: `${confidence}%`,
          survey_samples: barangayData.indices.length,
          predicted: true
        }
      };
    }
    
    return {
      ...feature,
      properties: {
        ...feature.properties,
        risk_level: 'Unknown',
        risk_color: '#999',
        confidence: 'N/A',
        survey_samples: 0,
        predicted: false
      }
    };
  });
  
  return {
    ...geojson,
    features: updatedFeatures
  };
};

// Utilities
export const utils = {
  featureMappings,
  riskReverseMapping,
  riskColors,
  calculateRiskScore
};

export default {
  trainAndPredict,
  utils
};
