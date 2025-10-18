/**
 * WindSmart Site Analysis Model
 * 
 * This module provides a simplified AI model for wind turbine site selection.
 * In a production environment, this would be replaced with a more sophisticated
 * machine learning model using TensorFlow.js or a Python backend with scikit-learn.
 */

// Weights for different factors in site evaluation
const FACTOR_WEIGHTS = {
  windSpeed: 0.35,
  windClass: 0.15,
  terrain: 0.10,
  gridConnectivity: 0.15,
  landUse: 0.10,
  environmentalFactors: 0.15
};

// Terrain type scores (normalized)
const TERRAIN_SCORES = {
  'Flat': 0.9,
  'Hilly': 0.7,
  'Mountainous': 0.5,
  'Coastal': 0.8,
  'Mixed': 0.6
};

// Grid connectivity scores
const GRID_SCORES = {
  'High': 1.0,
  'Medium': 0.7,
  'Low': 0.4
};

// Land use scores
const LAND_USE_SCORES = {
  'Unused': 1.0,
  'Agricultural': 0.8,
  'Mixed': 0.6,
  'Forest': 0.3
};

// Environmental impact scores (inverse - lower impact is better)
const ENVIRONMENTAL_SCORES = {
  'Low impact': 0.9,
  'Medium impact': 0.6,
  'High impact': 0.3
};

/**
 * Analyzes a site and calculates its suitability score
 * @param {Object} site - Site data object
 * @returns {Object} Analysis results with scores and recommendations
 */
function analyzeSite(site) {
  // Normalize wind speed (assuming range of 5-15 m/s)
  const normalizedWindSpeed = Math.min(Math.max((site.windSpeed - 5) / 10, 0), 1);
  
  // Normalize wind class (assuming range of 1-7)
  const normalizedWindClass = (site.windClass - 1) / 6;
  
  // Get scores for categorical variables
  const terrainScore = TERRAIN_SCORES[site.terrain] || 0.5;
  const gridScore = GRID_SCORES[site.gridConnectivity] || 0.5;
  const landUseScore = LAND_USE_SCORES[site.landUse] || 0.5;
  const environmentalScore = ENVIRONMENTAL_SCORES[site.environmentalFactors] || 0.5;
  
  // Calculate weighted score
  const suitabilityScore = 
    (normalizedWindSpeed * FACTOR_WEIGHTS.windSpeed) +
    (normalizedWindClass * FACTOR_WEIGHTS.windClass) +
    (terrainScore * FACTOR_WEIGHTS.terrain) +
    (gridScore * FACTOR_WEIGHTS.gridConnectivity) +
    (landUseScore * FACTOR_WEIGHTS.landUse) +
    (environmentalScore * FACTOR_WEIGHTS.environmentalFactors);
  
  // Scale to 0-100
  const scaledScore = Math.round(suitabilityScore * 100);
  
  // Calculate estimated annual energy production (MWh)
  // Simplified formula based on wind speed
  const estimatedEnergyProduction = Math.round(site.windSpeed * site.windSpeed * 150);
  
  // Calculate ROI estimate (years)
  const roiEstimate = Math.round(10 / (suitabilityScore * 2)) / 2;
  
  // Generate recommendations
  let recommendations = [];
  
  if (normalizedWindSpeed < 0.5) {
    recommendations.push("Wind speed is below optimal levels. Consider sites with higher average wind speeds.");
  }
  
  if (gridScore < 0.7) {
    recommendations.push("Grid connectivity is limited. Additional infrastructure investment may be required.");
  }
  
  if (environmentalScore < 0.6) {
    recommendations.push("Environmental impact concerns detected. Additional environmental studies recommended.");
  }
  
  return {
    siteId: site.id,
    siteName: site.name,
    suitabilityScore: scaledScore,
    estimatedEnergyProduction,
    roiEstimate,
    recommendations,
    factors: {
      windSpeedScore: Math.round(normalizedWindSpeed * 100),
      windClassScore: Math.round(normalizedWindClass * 100),
      terrainScore: Math.round(terrainScore * 100),
      gridConnectivityScore: Math.round(gridScore * 100),
      landUseScore: Math.round(landUseScore * 100),
      environmentalScore: Math.round(environmentalScore * 100)
    }
  };
}

/**
 * Ranks multiple sites based on their suitability
 * @param {Array} sites - Array of site data objects
 * @returns {Array} Ranked sites with analysis results
 */
function rankSites(sites) {
  // Analyze each site
  const analyzedSites = sites.map(site => ({
    ...site,
    analysis: analyzeSite(site)
  }));
  
  // Sort by suitability score (descending)
  return analyzedSites.sort((a, b) => b.analysis.suitabilityScore - a.analysis.suitabilityScore);
}

/**
 * Filters sites based on criteria
 * @param {Array} sites - Array of site data objects
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered sites
 */
function filterSites(sites, filters) {
  return sites.filter(site => {
    // Apply region filter
    if (filters.region && filters.region !== 'All' && site.region !== filters.region) {
      return false;
    }
    
    // Apply wind zone filter
    if (filters.windZone && filters.windZone !== 'All' && site.windZone !== filters.windZone) {
      return false;
    }
    
    // Apply cost factor filter
    if (filters.costFactor && filters.costFactor !== 'All' && site.costFactor !== filters.costFactor) {
      return false;
    }
    
    return true;
  });
}

module.exports = {
  analyzeSite,
  rankSites,
  filterSites
};