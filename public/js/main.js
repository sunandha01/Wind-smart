// Global variables
let map;
let markers = [];
let sites = [];
let filteredSites = [];
let chart = null;
let heatmap = null;

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadData();
    setupEventListeners();
});

// Initialize Leaflet map
function initMap() {
    // Center map on US by default
    map = L.map('map').setView([39.8283, -98.5795], 4);
    
    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Add map controls
    L.control.scale().addTo(map);
    
    // Add layer control for toggling between marker view and heatmap
    const baseMaps = {};
    const overlayMaps = {
        "Markers": L.layerGroup(),
        "Heat Map": L.layerGroup()
    };
    
    L.control.layers(baseMaps, overlayMaps).addTo(map);
}

// Load site data from API
async function loadData() {
    showLoading(true);
    
    try {
        // Fetch data from our API
        const response = await axios.get('/api/sites');
        sites = response.data || [];
        filteredSites = [...sites];
        
        // Populate filter dropdowns
        populateFilterOptions();
        
        // Display sites on map and in list
        renderSites();
        updateAnalysisSummary();
        
        showLoading(false);
    } catch (error) {
        console.error('Error loading data:', error);
        showLoading(false);
        alert('Failed to load site data. Please try again later.');
    }
}

// Populate filter dropdowns with options from data
function populateFilterOptions() {
    // Get unique values for each filter
    const regions = [...new Set(sites.map(site => site.region))];
    const windZones = [...new Set(sites.map(site => site.windZone))];
    const costFactors = [...new Set(sites.map(site => site.costFactor))];
    
    // Populate region filter
    const regionFilter = document.getElementById('region-filter');
    regions.forEach(region => {
        const option = document.createElement('option');
        option.value = region;
        option.textContent = region;
        regionFilter.appendChild(option);
    });
    
    // Populate wind zone filter
    const windZoneFilter = document.getElementById('wind-zone-filter');
    windZones.forEach(zone => {
        const option = document.createElement('option');
        option.value = zone;
        option.textContent = zone;
        windZoneFilter.appendChild(option);
    });
    
    // Populate cost factor filter
    const costFactorFilter = document.getElementById('cost-factor-filter');
    costFactors.forEach(factor => {
        const option = document.createElement('option');
        option.value = factor;
        option.textContent = factor;
        costFactorFilter.appendChild(option);
    });
}

// Set up event listeners for UI interactions
function setupEventListeners() {
    // Apply filters button
    const applyFiltersBtn = document.getElementById('apply-filters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
    
    // Reset filters button
    const resetFiltersBtn = document.getElementById('reset-filters');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }
    
    // Sort dropdown
    const sortBySelect = document.getElementById('sort-by');
    if (sortBySelect) {
        sortBySelect.addEventListener('change', sortSites);
    }
    
    // Visualization type dropdown
    const visualizationTypeSelect = document.getElementById('visualization-type');
    if (visualizationTypeSelect) {
        visualizationTypeSelect.addEventListener('change', renderSites);
    }
    
    // Close modal button
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            document.getElementById('site-modal').style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('site-modal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Apply selected filters to the site data
function applyFilters() {
    const regionValue = document.getElementById('region-filter').value;
    const windZoneValue = document.getElementById('wind-zone-filter').value;
    const costFactorValue = document.getElementById('cost-factor-filter').value;
    
    filteredSites = sites.filter(site => {
        // Apply region filter if selected
        if (regionValue && site.region !== regionValue) {
            return false;
        }
        
        // Apply wind zone filter if selected
        if (windZoneValue && site.windZone !== windZoneValue) {
            return false;
        }
        
        // Apply cost factor filter if selected
        if (costFactorValue && site.costFactor !== costFactorValue) {
            return false;
        }
        
        return true;
    });
    
    // Re-render with filtered data
    renderSites();
    updateAnalysisSummary();
}

// Reset all filters to default
function resetFilters() {
    document.getElementById('region-filter').value = '';
    document.getElementById('wind-zone-filter').value = '';
    document.getElementById('cost-factor-filter').value = '';
    document.getElementById('sort-by').value = 'score';
    
    filteredSites = [...sites];
    renderSites();
    updateAnalysisSummary();
}

// Sort sites based on selected criteria
function sortSites() {
    const sortBy = document.getElementById('sort-by').value;
    
    filteredSites.sort((a, b) => {
        return b[sortBy] - a[sortBy]; // Descending order
    });
    
    renderSites();
}

// Render sites on map and in list
function renderSites() {
    // Clear existing markers
    clearMarkers();
    
    // Get visualization type
    const visualizationTypeSelect = document.getElementById('visualization-type');
    const visualizationType = visualizationTypeSelect ? visualizationTypeSelect.value : 'markers';
    
    if (visualizationType === 'markers') {
        // Add new markers
        filteredSites.forEach(site => {
            addMarker(site);
        });
    } else if (visualizationType === 'heatmap') {
        // Create heatmap
        createHeatmap();
    }
    
    // Render site cards
    renderSiteCards();
    
    // Adjust map view to fit all markers if there are any
    if (markers.length > 0) {
        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds(), { padding: [50, 50] });
    }
}

// Create heatmap visualization
function createHeatmap() {
    // Remove existing heatmap if it exists
    if (heatmap) {
        map.removeLayer(heatmap);
    }
    
    // Create heatmap data points
    const heatData = filteredSites.map(site => {
        // Use windSpeed to determine intensity (normalized to 0-1)
        const intensity = site.windSpeed / 15; // Assuming max wind speed is around 15 m/s
        return [site.latitude, site.longitude, intensity];
    });
    
    // Create and add heatmap layer
    heatmap = L.heatLayer(heatData, {
        radius: 25,
        blur: 15,
        maxZoom: 10,
        max: 1.0,
        gradient: {
            0.0: 'blue',
            0.5: 'lime',
            0.8: 'yellow',
            1.0: 'red'
        }
    }).addTo(map);
}

// Add a marker to the map for a site
function addMarker(site) {
    // Check if site has valid coordinates
    if (!site || !site.latitude || !site.longitude) {
        console.error('Invalid site data for marker:', site);
        return;
    }
    
    const marker = L.marker([site.latitude, site.longitude])
        .addTo(map)
        .bindPopup(`
            <strong>${site.name}</strong><br>
            Wind Speed: ${site.windSpeed} m/s<br>
            <a href="#" onclick="window.showSiteDetails(${site.id}); return false;">View Details</a>
        `);
    
    // Store marker reference
    markers.push(marker);
    
    // Add click event to marker
    marker.on('click', () => {
        showSiteDetails(site.id);
    });
}

// Clear all markers from the map
function clearMarkers() {
    markers.forEach(marker => {
        map.removeLayer(marker);
    });
    markers = [];
}

// Render site cards in the list
function renderSiteCards() {
    const siteCardsContainer = document.getElementById('site-cards');
    siteCardsContainer.innerHTML = '';
    
    if (filteredSites.length === 0) {
        siteCardsContainer.innerHTML = '<p>No sites match your filter criteria.</p>';
        return;
    }
    
    filteredSites.forEach(site => {
        const card = document.createElement('div');
        card.className = 'site-card';
        card.innerHTML = `
            <h3>${site.name}</h3>
            <div class="site-details">
                <p><span class="label">Region:</span> ${site.region}</p>
                <p><span class="label">Wind Zone:</span> ${site.windZone}</p>
                <p><span class="label">Wind Speed:</span> ${site.windSpeed} m/s</p>
                <p><span class="label">Energy Yield:</span> ${site.energyYield} MWh/year</p>
                <p><span class="label">Cost Factor:</span> ${site.costFactor}</p>
                <p><span class="label">Grid Connectivity:</span> ${site.gridConnectivity}</p>
            </div>
            <a href="#" class="view-details" data-id="${site.id}">View Details</a>
        `;
        
        // Add click event to view details link
        card.querySelector('.view-details').addEventListener('click', (e) => {
            e.preventDefault();
            showSiteDetails(site.id);
        });
        
        siteCardsContainer.appendChild(card);
    });
}

// Update analysis summary with current data
function updateAnalysisSummary() {
    document.getElementById('total-sites').textContent = filteredSites.length;
    
    // Calculate average score
    const avgScore = filteredSites.length > 0 
        ? filteredSites.reduce((sum, site) => sum + site.score, 0) / filteredSites.length 
        : 0;
    document.getElementById('avg-score').textContent = avgScore.toFixed(1);
    
    // Find top region
    if (filteredSites.length > 0) {
        const regionCounts = {};
        filteredSites.forEach(site => {
            regionCounts[site.region] = (regionCounts[site.region] || 0) + 1;
        });
        
        let topRegion = '';
        let maxCount = 0;
        
        for (const region in regionCounts) {
            if (regionCounts[region] > maxCount) {
                maxCount = regionCounts[region];
                topRegion = region;
            }
        }
        
        document.getElementById('top-region').textContent = topRegion;
    } else {
        document.getElementById('top-region').textContent = '-';
    }
}

// Show detailed information for a specific site
function showSiteDetails(siteId) {
    const site = sites.find(s => s.id === siteId);
    if (!site) return;
    
    // Populate modal with site details
    document.getElementById('modal-site-name').textContent = site.name;
    document.getElementById('modal-site-score').textContent = `${site.score.toFixed(1)}/10`;
    document.getElementById('modal-coordinates').textContent = `${site.coordinates.lat}, ${site.coordinates.lng}`;
    document.getElementById('modal-region').textContent = site.region;
    document.getElementById('modal-wind-zone').textContent = site.wind_zone;
    document.getElementById('modal-terrain').textContent = site.terrain;
    document.getElementById('modal-wind-speed').textContent = `${site.wind_speed} m/s`;
    document.getElementById('modal-wind-consistency').textContent = `${site.wind_consistency}/10`;
    document.getElementById('modal-energy-yield').textContent = `${site.energy_yield} MWh/year`;
    document.getElementById('modal-grid-connectivity').textContent = `${site.grid_connectivity}/10`;
    document.getElementById('modal-land-use').textContent = site.land_use;
    document.getElementById('modal-cost-efficiency').textContent = `${site.cost_efficiency}/10`;
    document.getElementById('modal-environmental-score').textContent = `${site.environmental_impact.score}/10`;
    document.getElementById('modal-wildlife-impact').textContent = site.environmental_impact.wildlife;
    document.getElementById('modal-noise-impact').textContent = site.environmental_impact.noise;
    
    // Generate AI recommendations
    generateRecommendations(site);
    
    // Create comparison chart
    createComparisonChart(site);
    
    // Create energy projection chart
    createEnergyProjectionChart(site);
    
    // Show the modal
    document.getElementById('site-modal').style.display = 'block';
}

// Create energy projection chart for the site
function createEnergyProjectionChart(site) {
    const ctx = document.getElementById('energy-projection-chart').getContext('2d');
    
    // Generate monthly energy projection data based on site data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Calculate monthly energy production based on site data and seasonal variations
    const monthlyData = months.map((month, index) => {
        // Create seasonal variation pattern (higher in winter/spring for most regions)
        let seasonalFactor;
        
        // Different seasonal patterns based on region
        if (site.region === 'Northeast' || site.region === 'Midwest') {
            // Higher winds in winter/spring
            seasonalFactor = [1.2, 1.3, 1.2, 1.1, 0.9, 0.7, 0.6, 0.7, 0.8, 1.0, 1.2, 1.3][index];
        } else if (site.region === 'Southwest' || site.region === 'West') {
            // More consistent year-round with slight summer increase
            seasonalFactor = [0.9, 0.9, 1.0, 1.0, 1.1, 1.2, 1.2, 1.1, 1.0, 0.9, 0.9, 0.8][index];
        } else {
            // Default pattern
            seasonalFactor = [1.1, 1.0, 1.0, 0.9, 0.8, 0.8, 0.9, 0.9, 1.0, 1.1, 1.2, 1.1][index];
        }
        
        // Calculate monthly energy based on annual yield and seasonal factor
        return Math.round(site.energy_yield / 12 * seasonalFactor);
    });
    
    // Create new chart
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'Projected Monthly Energy Production (MWh)',
                data: monthlyData,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Energy (MWh)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Month'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Projected Monthly Energy Production'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y} MWh`;
                        }
                    }
                }
            }
        }
    });
}

// Generate AI recommendations for a site
function generateRecommendations(site) {
    const recommendationsContainer = document.getElementById('modal-recommendations');
    recommendationsContainer.innerHTML = '';
    
    // Generate recommendations based on site data
    const recommendations = [];
    
    // Wind speed recommendation
    if (site.wind_speed < 6) {
        recommendations.push('Consider alternative turbine models designed for low wind speeds.');
    } else if (site.wind_speed > 10) {
        recommendations.push('High wind speeds detected. Ensure turbines with appropriate cut-out speeds are selected.');
    }
    
    // Grid connectivity recommendation
    if (site.grid_connectivity < 5) {
        recommendations.push('Grid connectivity is poor. Budget for additional infrastructure costs or consider alternative connection methods.');
    }
    
    // Environmental impact recommendations
    if (site.environmental_impact.score < 6) {
        recommendations.push('Environmental impact concerns detected. Consider conducting additional wildlife studies and implementing mitigation measures.');
    }
    
    // Cost efficiency recommendation
    if (site.cost_efficiency < 5) {
        recommendations.push('Low cost efficiency. Consider negotiating land lease terms or exploring government incentives to improve ROI.');
    }
    
    // Add general recommendation
    recommendations.push(`Based on overall analysis, this site is ${site.score >= 7 ? 'highly recommended' : site.score >= 5 ? 'recommended with considerations' : 'not recommended'} for wind turbine installation.`);
    
    // Add recommendations to the list
    recommendations.forEach(rec => {
        const li = document.createElement('li');
        li.textContent = rec;
        recommendationsContainer.appendChild(li);
    });
}

// Create a comparison chart for the site
function createComparisonChart(site) {
    const ctx = document.getElementById('site-comparison-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (chart) {
        chart.destroy();
    }
    
    // Calculate average values from all sites
    const avgWindSpeed = sites.reduce((sum, s) => sum + s.wind_speed, 0) / sites.length;
    const avgEnergyYield = sites.reduce((sum, s) => sum + s.energy_yield, 0) / sites.length;
    const avgGridConn = sites.reduce((sum, s) => sum + s.grid_connectivity, 0) / sites.length;
    const avgCostEff = sites.reduce((sum, s) => sum + s.cost_efficiency, 0) / sites.length;
    const avgEnvScore = sites.reduce((sum, s) => sum + s.environmental_impact.score, 0) / sites.length;
    
    // Create chart
    chart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Wind Speed', 'Energy Yield', 'Grid Connectivity', 'Cost Efficiency', 'Environmental Score'],
            datasets: [
                {
                    label: site.name,
                    data: [
                        site.wind_speed,
                        site.energy_yield / 100, // Scale down for better visualization
                        site.grid_connectivity,
                        site.cost_efficiency,
                        site.environmental_impact.score
                    ],
                    backgroundColor: 'rgba(26, 115, 232, 0.2)',
                    borderColor: 'rgba(26, 115, 232, 1)',
                    pointBackgroundColor: 'rgba(26, 115, 232, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(26, 115, 232, 1)'
                },
                {
                    label: 'Average',
                    data: [
                        avgWindSpeed,
                        avgEnergyYield / 100, // Scale down for better visualization
                        avgGridConn,
                        avgCostEff,
                        avgEnvScore
                    ],
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(255, 99, 132, 1)'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: {
                        display: true
                    },
                    suggestedMin: 0,
                    suggestedMax: 10,
                    ticks: {
                        stepSize: 2
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                // Adjust Energy Yield value back for display
                                if (context.label === 'Energy Yield') {
                                    label += Math.round(context.parsed * 100) + ' MWh/year';
                                } else if (context.label === 'Wind Speed') {
                                    label += context.parsed + ' m/s';
                                } else {
                                    label += context.parsed + '/10';
                                }
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Show or hide loading indicator
function showLoading(show) {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (show) {
        loadingIndicator.style.display = 'flex';
    } else {
        loadingIndicator.style.display = 'none';
    }
}

// Make showSiteDetails available globally for marker popups
window.showSiteDetails = showSiteDetails;