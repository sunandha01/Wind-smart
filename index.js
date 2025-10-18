const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Load site data
const loadSiteData = () => {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'public', 'data', 'sample_data.json'), 'utf8');
        return JSON.parse(data).sites || [];
    } catch (error) {
        console.error('Error loading site data:', error);
        return [];
    }
};

// API Routes
app.get('/api/sites', (req, res) => {
    const sites = loadSiteData();
    res.json(sites);
});

app.get('/api/sites/:id', (req, res) => {
    const sites = loadSiteData();
    const site = sites.find(s => s.id === parseInt(req.params.id));
    
    if (site) {
        res.json(site);
    } else {
        res.status(404).json({ error: 'Site not found' });
    }
});

app.get('/api/sites-analyzed', (req, res) => {
    const sites = loadSiteData();
    const { region, windZone, costFactor, minScore } = req.query;
    
    let filteredSites = [...sites];
    
    // Apply filters if provided
    if (region) {
        filteredSites = filteredSites.filter(site => site.region === region);
    }
    
    if (windZone) {
        filteredSites = filteredSites.filter(site => site.wind_zone === windZone);
    }
    
    if (costFactor) {
        filteredSites = filteredSites.filter(site => site.cost_factor === costFactor);
    }
    
    if (minScore) {
        filteredSites = filteredSites.filter(site => site.score >= parseFloat(minScore));
    }
    
    // Add AI analysis summary
    const analysis = {
        total_sites: filteredSites.length,
        average_score: filteredSites.length > 0 
            ? filteredSites.reduce((sum, site) => sum + site.score, 0) / filteredSites.length 
            : 0,
        top_region: getTopRegion(filteredSites),
        sites: filteredSites
    };
    
    res.json(analysis);
});

app.get('/api/filter-options', (req, res) => {
    const sites = loadSiteData();
    
    // Extract unique values for filter options
    const regions = [...new Set(sites.map(site => site.region))];
    const windZones = [...new Set(sites.map(site => site.wind_zone))];
    const costFactors = [...new Set(sites.map(site => site.cost_factor))];
    
    res.json({
        regions,
        windZones,
        costFactors
    });
});

// Helper function to get top region
function getTopRegion(sites) {
    if (sites.length === 0) return null;
    
    const regionCounts = {};
    sites.forEach(site => {
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
    
    return topRegion;
}

// Catch-all route to serve the main HTML file
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`WindSmart server running on http://localhost:${PORT}`);
});