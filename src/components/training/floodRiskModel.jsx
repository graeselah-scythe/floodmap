import * as Papa from 'papaparse';

// Feature encoding mappings based on your survey CSV format
const featureMappings = {
  perceived_elevation: {
    'Low-lying area or valley': 0,
    'Flat land': 1,
    'On a slope or hillside': 2
  },
  flood_history: {
    'Never flooded': 0,
    '1-2 times': 1,
    '3-5 times': 2,
    'More than 5 times': 3
  },
  max_water_level: {
    'No flooding experienced': 0,
    'Ankle-deep (below knee)': 1,
    'Knee-deep to waist-level': 2,
    'Chest-level or higher': 3
  },
  drainage_quality: {
    'Good  (water drains quickly during heavy rain)': 0,
    'Average (some pooling but drains eventually)': 1,
    'Poor  (water accumulates and drains very slowly)': 2
  },
  proximity_to_water: {
    'Right beside a water body (within 50 meters)': 0,
    'Within walking distance (about 500 meters)': 1,
    'Quite far away (more than 500 meters)': 2
  },
  area_urbanization: {
    'Highly urbanized (mostly concrete, many buildings)': 0,
    'Mixed urban and open spaces': 1,
    'Mostly rural with open land and vegetation': 2
  },
  water_stagnation: {
    'Less than 1 hour': 0,
    '1-6 hours': 1,
    '6-24 hours': 2,
    'More than 24 hours': 3
  }
};

// Reverse mapping for output
const riskReverseMapping = {
  0: 'Low',
  1: 'Medium',
  2: 'High',
  3: 'Very High'
};

// Risk scoring system from your paper
const calculateRiskLabel = (floodHistory, maxWaterLevel, waterStagnation) => {
  let score = 0;
  
  // Flood frequency score
  if (floodHistory === 'More than 5 times') score += 3;
  else if (floodHistory === '3-5 times') score += 2;
  else if (floodHistory === '1-2 times') score += 1;
  
  // Water level score
  if (maxWaterLevel === 'Chest-level or higher') score += 3;
  else if (maxWaterLevel === 'Knee-deep to waist-level') score += 2;
  else if (maxWaterLevel === 'Ankle-deep (below knee)') score += 1;
  
  // Stagnation time score
  if (waterStagnation === 'More than 24 hours') score += 3;
  else if (waterStagnation === '6-24 hours') score += 2;
  else if (waterStagnation === '1-6 hours') score += 1;
  
  // Determine risk level
  if (score >= 7) return 'Very High Risk';
  if (score >= 5) return 'High Risk';
  if (score >= 3) return 'Medium Risk';
  return 'Low Risk';
};

// Random Forest implementation
class RandomForestClassifier {
  constructor(nEstimators = 100, maxDepth = 10, minSamplesSplit = 2) {
    this.nEstimators = nEstimators;
    this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
    this.trees = [];
    this.featureImportances = null;
    this.classes = null;
  }

  giniImpurity(y) {
    if (y.length === 0) return 0;
    
    const counts = {};
    y.forEach(label => {
      counts[label] = (counts[label] || 0) + 1;
    });
    
    let impurity = 1;
    Object.values(counts).forEach(count => {
      const probability = count / y.length;
      impurity -= probability ** 2;
    });
    
    return impurity;
  }

  findBestSplit(X, y, featureIndices) {
    let bestGain = -1;
    let bestFeature = null;
    let bestThreshold = null;
    let bestLeftIndices = null;
    let bestRightIndices = null;

    const currentImpurity = this.giniImpurity(y);

    for (const featureIdx of featureIndices) {
      const featureValues = X.map(row => row[featureIdx]);
      const uniqueValues = [...new Set(featureValues)].sort((a, b) => a - b);

      for (let i = 1; i < uniqueValues.length; i++) {
        const threshold = (uniqueValues[i - 1] + uniqueValues[i]) / 2;
        const leftIndices = [];
        const rightIndices = [];

        X.forEach((row, idx) => {
          if (row[featureIdx] <= threshold) {
            leftIndices.push(idx);
          } else {
            rightIndices.push(idx);
          }
        });

        if (leftIndices.length < this.minSamplesSplit || rightIndices.length < this.minSamplesSplit) {
          continue;
        }

        const leftY = leftIndices.map(idx => y[idx]);
        const rightY = rightIndices.map(idx => y[idx]);

        const leftImpurity = this.giniImpurity(leftY);
        const rightImpurity = this.giniImpurity(rightY);

        const weightedImpurity = 
          (leftY.length * leftImpurity + rightY.length * rightImpurity) / y.length;
        
        const gain = currentImpurity - weightedImpurity;

        if (gain > bestGain) {
          bestGain = gain;
          bestFeature = featureIdx;
          bestThreshold = threshold;
          bestLeftIndices = leftIndices;
          bestRightIndices = rightIndices;
        }
      }
    }

    return {
      feature: bestFeature,
      threshold: bestThreshold,
      gain: bestGain,
      leftIndices: bestLeftIndices,
      rightIndices: bestRightIndices
    };
  }

  buildTree(X, y, depth = 0, featureIndices = null) {
    if (featureIndices === null) {
      featureIndices = Array.from({ length: X[0].length }, (_, i) => i);
    }

    const nFeatures = Math.ceil(Math.sqrt(featureIndices.length));
    const selectedFeatures = [...featureIndices]
      .sort(() => Math.random() - 0.5)
      .slice(0, nFeatures);

    const uniqueLabels = [...new Set(y)];
    if (depth >= this.maxDepth || 
        y.length < this.minSamplesSplit * 2 || 
        uniqueLabels.length === 1) {
      
      const labelCounts = {};
      y.forEach(label => {
        labelCounts[label] = (labelCounts[label] || 0) + 1;
      });
      
      let majorityLabel = y[0];
      let maxCount = 0;
      Object.entries(labelCounts).forEach(([label, count]) => {
        if (count > maxCount) {
          maxCount = count;
          majorityLabel = parseInt(label);
        }
      });
      
      return {
        isLeaf: true,
        label: majorityLabel,
        probability: maxCount / y.length
      };
    }

    const split = this.findBestSplit(X, y, selectedFeatures);
    
    if (split.gain <= 0 || split.feature === null) {
      const labelCounts = {};
      y.forEach(label => {
        labelCounts[label] = (labelCounts[label] || 0) + 1;
      });
      
      let majorityLabel = y[0];
      let maxCount = 0;
      Object.entries(labelCounts).forEach(([label, count]) => {
        if (count > maxCount) {
          maxCount = count;
          majorityLabel = parseInt(label);
        }
      });
      
      return {
        isLeaf: true,
        label: majorityLabel,
        probability: maxCount / y.length
      };
    }

    const leftX = split.leftIndices.map(idx => X[idx]);
    const leftY = split.leftIndices.map(idx => y[idx]);
    const rightX = split.rightIndices.map(idx => X[idx]);
    const rightY = split.rightIndices.map(idx => y[idx]);

    const leftChild = this.buildTree(leftX, leftY, depth + 1, featureIndices);
    const rightChild = this.buildTree(rightX, rightY, depth + 1, featureIndices);

    return {
      isLeaf: false,
      feature: split.feature,
      threshold: split.threshold,
      gain: split.gain,
      left: leftChild,
      right: rightChild
    };
  }

  fit(X, y) {
    this.trees = [];
    this.classes = [...new Set(y)];
    this.featureImportances = new Array(X[0].length).fill(0);
    
    const nSamples = X.length;
    
    for (let i = 0; i < this.nEstimators; i++) {
      const indices = Array.from({ length: nSamples }, 
        () => Math.floor(Math.random() * nSamples));
      
      const X_sample = indices.map(idx => X[idx]);
      const y_sample = indices.map(idx => y[idx]);
      
      const tree = this.buildTree(X_sample, y_sample);
      this.trees.push(tree);
      
      this.updateFeatureImportances(tree);
    }
    
    const totalImportance = this.featureImportances.reduce((a, b) => a + b, 0);
    if (totalImportance > 0) {
      this.featureImportances = this.featureImportances.map(imp => imp / totalImportance);
    }
  }

  updateFeatureImportances(tree) {
    if (tree.isLeaf) return;
    
    this.featureImportances[tree.feature] += tree.gain;
    
    if (tree.left) this.updateFeatureImportances(tree.left);
    if (tree.right) this.updateFeatureImportances(tree.right);
  }

  predictSingle(sample) {
    const votes = {};
    
    for (const tree of this.trees) {
      const prediction = this.traverseTree(sample, tree);
      votes[prediction] = (votes[prediction] || 0) + 1;
    }
    
    let maxVotes = 0;
    let predictedClass = this.classes[0];
    
    Object.entries(votes).forEach(([cls, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        predictedClass = parseInt(cls);
      }
    });
    
    return predictedClass;
  }

  traverseTree(sample, node) {
    if (node.isLeaf) {
      return node.label;
    }
    
    if (sample[node.feature] <= node.threshold) {
      return this.traverseTree(sample, node.left);
    } else {
      return this.traverseTree(sample, node.right);
    }
  }

  predict(X) {
    return X.map(sample => this.predictSingle(sample));
  }

  getFeatureImportances() {
    return this.featureImportances;
  }
}

// Main training and prediction function
export const trainAndPredict = async (csvFile, geojsonData) => {
  try {
    // Step 1: Parse CSV file
    const csvText = await readFileAsText(csvFile);
    const parsedData = parseCSV(csvText);
    
    if (!parsedData || parsedData.length === 0) {
      throw new Error('CSV file is empty or could not be parsed');
    }
    
    // Step 2: Preprocess data - handle your survey format
    const { features, labels, featureNames, barangayMap } = preprocessSurveyData(parsedData);
    
    if (features.length === 0 || labels.length === 0) {
      throw new Error('Insufficient data for training. Need at least 3 samples.');
    }
    
    // Step 3: Train Random Forest model
    console.log(`Training model with ${features.length} samples...`);
    const model = new RandomForestClassifier(50, 8, 2); // Reduced for browser performance
    model.fit(features, labels);
    
    // Step 4: Predict for all barangays in the CSV
    const predictions = model.predict(features);
    
    // Step 5: Update GeoJSON with predictions
    const updatedGeoJSON = updateGeoJSONWithPredictions(
      geojsonData, 
      barangayMap, 
      predictions,
      parsedData
    );
    
    // Step 6: Return updated GeoJSON and model info
    return {
      geojson: updatedGeoJSON,
      featureImportances: model.getFeatureImportances(),
      featureNames: featureNames,
      accuracy: calculateAccuracy(labels, predictions),
      confusionMatrix: generateConfusionMatrix(labels, predictions, 4),
      sampleCount: features.length
    };
    
  } catch (error) {
    console.error('Error in trainAndPredict:', error);
    throw error;
  }
};

// Helper function to read file as text
const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};

// Parse CSV using PapaParse
const parseCSV = (csvText) => {
  try {
    // Check if CSV has headers
    const firstLine = csvText.split('\n')[0];
    const hasHeaders = firstLine.includes('barangay') || firstLine.includes('Barangay');
    
    const results = Papa.parse(csvText, {
      header: hasHeaders,
      skipEmptyLines: true,
      dynamicTyping: false,
      transform: (value) => value.trim()
    });
    
    console.log(`Parsed ${results.data.length} rows from CSV`);
    return results.data;
  } catch (error) {
    console.error('CSV parsing error:', error);
    return null;
  }
};

// Preprocess YOUR survey data format
const preprocessSurveyData = (data) => {
  const features = [];
  const labels = [];
  const barangayMap = new Map();
  const featureNames = [
    'perceived_elevation',
    'drainage_quality',
    'proximity_to_water',
    'area_urbanization',
    'flood_history',
    'max_water_level',
    'water_stagnation'
  ];
  
  // Track column indices for debugging
  console.log('Sample row structure:', data[0]);
  
  data.forEach((row, index) => {
    try {
      // Check if row is an object (has headers) or array (no headers)
      const isObject = typeof row === 'object' && !Array.isArray(row);
      
      let barangay, perceived_elevation, flood_history, max_water_level, 
          drainage_quality, proximity_to_water, area_urbanization, water_stagnation;
      
      if (isObject) {
        // CSV has headers
        barangay = row.barangay || row.Barangay || row['Which barangay do you currently live in?'];
        perceived_elevation = row.perceived_elevation || row['How would you describe the land level of your immediate neighborhood?'];
        flood_history = row.flood_history || row['In the past 2 years, how many times has your area experienced noticeable flooding?'];
        max_water_level = row.max_water_level || row['During the worst flooding you\'ve experienced, how high did the water typically reach?'];
        drainage_quality = row.drainage_quality || row['How would you rate the drainage system in your street/area?'];
        proximity_to_water = row.proximity_to_water || row['How close is your home to the nearest river, creek, or major water channel?'];
        area_urbanization = row.area_urbanization || row['Which best describes the development in your immediate area?'];
        water_stagnation = row.water_stagnation || row['During heavy rain in the past year, how long does water typically stay on your street?'];
      } else {
        // CSV has no headers - assume your survey format order:
        // [barangay, years_lived, elevation, drainage, proximity, urbanization, flood_history, max_water, stagnation]
        barangay = row[0];
        // Skip row[1] - years lived (not used in model)
        perceived_elevation = row[2];
        drainage_quality = row[3];
        proximity_to_water = row[4];
        area_urbanization = row[5];
        flood_history = row[6];
        max_water_level = row[7];
        water_stagnation = row[8];
      }
      
      // Validate required data
      if (!barangay || barangay === '' || barangay === 'undefined') {
        console.warn(`Skipping row ${index + 1}: Missing barangay`);
        return;
      }
      
      // Encode features
      const encodedFeatures = [];
      
      // Encode perceived_elevation
      if (perceived_elevation && featureMappings.perceived_elevation[perceived_elevation] !== undefined) {
        encodedFeatures.push(featureMappings.perceived_elevation[perceived_elevation]);
      } else {
        encodedFeatures.push(1); // Default to 'Flat land'
      }
      
      // Encode drainage_quality
      if (drainage_quality && featureMappings.drainage_quality[drainage_quality] !== undefined) {
        encodedFeatures.push(featureMappings.drainage_quality[drainage_quality]);
      } else {
        encodedFeatures.push(1); // Default to 'Average'
      }
      
      // Encode proximity_to_water
      if (proximity_to_water && featureMappings.proximity_to_water[proximity_to_water] !== undefined) {
        encodedFeatures.push(featureMappings.proximity_to_water[proximity_to_water]);
      } else {
        encodedFeatures.push(1); // Default to 'Within walking distance'
      }
      
      // Encode area_urbanization
      if (area_urbanization && featureMappings.area_urbanization[area_urbanization] !== undefined) {
        encodedFeatures.push(featureMappings.area_urbanization[area_urbanization]);
      } else {
        encodedFeatures.push(1); // Default to 'Mixed'
      }
      
      // Encode flood_history
      if (flood_history && featureMappings.flood_history[flood_history] !== undefined) {
        encodedFeatures.push(featureMappings.flood_history[flood_history]);
      } else {
        encodedFeatures.push(0); // Default to 'Never flooded'
      }
      
      // Encode max_water_level
      if (max_water_level && featureMappings.max_water_level[max_water_level] !== undefined) {
        encodedFeatures.push(featureMappings.max_water_level[max_water_level]);
      } else {
        encodedFeatures.push(0); // Default to 'No flooding experienced'
      }
      
      // Encode water_stagnation
      if (water_stagnation && featureMappings.water_stagnation[water_stagnation] !== undefined) {
        encodedFeatures.push(featureMappings.water_stagnation[water_stagnation]);
      } else {
        encodedFeatures.push(0); // Default to '<1 hour'
      }
      
      // Calculate target label using your paper's scoring system
      const riskLabel = calculateRiskLabel(flood_history, max_water_level, water_stagnation);
      let label;
      
      if (riskLabel === 'Low Risk') label = 0;
      else if (riskLabel === 'Medium Risk') label = 1;
      else if (riskLabel === 'High Risk') label = 2;
      else if (riskLabel === 'Very High Risk') label = 3;
      else label = 0; // Default to Low Risk
      
      features.push(encodedFeatures);
      labels.push(label);
      
      // Store mapping for GeoJSON update
      const barangayLower = barangay.toLowerCase().trim();
      if (!barangayMap.has(barangayLower)) {
        barangayMap.set(barangayLower, {
          indices: [features.length - 1],
          data: {
            barangay: barangay,
            perceived_elevation: perceived_elevation,
            flood_history: flood_history,
            max_water_level: max_water_level,
            drainage_quality: drainage_quality,
            proximity_to_water: proximity_to_water,
            area_urbanization: area_urbanization,
            water_stagnation: water_stagnation,
            calculated_risk: riskLabel
          }
        });
      } else {
        // Multiple entries for same barangay - average them
        barangayMap.get(barangayLower).indices.push(features.length - 1);
      }
      
    } catch (error) {
      console.warn(`Error processing row ${index + 1}:`, error, row);
    }
  });
  
  console.log(`Successfully processed ${features.length} samples from ${barangayMap.size} unique barangays`);
  
  return { features, labels, featureNames, barangayMap };
};

// Update GeoJSON with predictions
const updateGeoJSONWithPredictions = (geojson, barangayMap, predictions, surveyData) => {
  const updatedFeatures = geojson.features.map(feature => {
    const barangayName = feature.properties.barangay.toLowerCase().trim();
    
    if (barangayMap.has(barangayName)) {
      const barangayData = barangayMap.get(barangayName);
      
      // Get predictions for all entries of this barangay
      const barangayPredictions = barangayData.indices.map(idx => predictions[idx]);
      
      // Use majority vote for final prediction
      const predictionCounts = {};
      barangayPredictions.forEach(p => {
        predictionCounts[p] = (predictionCounts[p] || 0) + 1;
      });
      
      let finalPrediction = barangayPredictions[0];
      let maxVotes = 0;
      Object.entries(predictionCounts).forEach(([pred, count]) => {
        if (count > maxVotes) {
          maxVotes = count;
          finalPrediction = parseInt(pred);
        }
      });
      
      const riskLevel = riskReverseMapping[finalPrediction] || 'Unknown';
      const confidence = Math.round((maxVotes / barangayPredictions.length) * 100);
      
      return {
        ...feature,
        properties: {
          ...feature.properties,
          risk: riskLevel,
          predicted: true,
          confidence: `${confidence}%`,
          survey_entries: barangayData.indices.length,
          calculated_risk: barangayData.data.calculated_risk
        }
      };
    } else {
      // For barangays not in survey data
      return {
        ...feature,
        properties: {
          ...feature.properties,
          predicted: false,
          confidence: 'N/A',
          survey_entries: 0
        }
      };
    }
  });
  
  console.log(`Updated ${barangayMap.size} barangays with predictions`);
  
  return {
    ...geojson,
    features: updatedFeatures
  };
};

// Calculate model accuracy
const calculateAccuracy = (trueLabels, predictions) => {
  if (trueLabels.length !== predictions.length || trueLabels.length === 0) {
    return 0;
  }
  
  let correct = 0;
  for (let i = 0; i < trueLabels.length; i++) {
    if (trueLabels[i] === predictions[i]) {
      correct++;
    }
  }
  
  return Math.round((correct / trueLabels.length) * 100);
};

// Generate confusion matrix
const generateConfusionMatrix = (trueLabels, predictions, numClasses) => {
  const matrix = Array(numClasses).fill().map(() => Array(numClasses).fill(0));
  
  for (let i = 0; i < trueLabels.length; i++) {
    const trueClass = trueLabels[i];
    const predClass = predictions[i];
    
    if (trueClass >= 0 && trueClass < numClasses && 
        predClass >= 0 && predClass < numClasses) {
      matrix[trueClass][predClass]++;
    }
  }
  
  return matrix;
};

// Export utility functions for testing
export const utils = {
  calculateRiskLabel,
  encodeFeature: (featureName, value) => {
    if (featureMappings[featureName] && featureMappings[featureName][value] !== undefined) {
      return featureMappings[featureName][value];
    }
    return null;
  },
  decodeRisk: (encodedRisk) => {
    return riskReverseMapping[encodedRisk] || 'Unknown';
  },
  RandomForestClassifier
};

// Export for direct use
export default { trainAndPredict, utils };