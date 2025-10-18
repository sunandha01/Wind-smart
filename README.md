# WindSmart: Wind Farm Site Analysis Tool

A modern web application built with Express.js and vanilla JavaScript that helps analyze potential wind farm sites based on various environmental and economic factors.

## Features

- Interactive map visualization with markers and heatmap views
- Filtering sites by region, wind zone, and cost factor
- Detailed site analysis including wind speed, energy yield, and environmental impact
- Responsive design that works on all devices
- RESTful API for site data

## Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```

## Running the Application

### Development Mode

```
npm run dev
```

This will start the server with nodemon, which automatically restarts when you make changes.

### Production Mode

```
npm start
```

## Project Structure

```
/
├── index.js                # Main server file
├── models/                 # Data models
│   └── siteAnalysis.js     # Site analysis logic
├── package.json            # Project dependencies and scripts
├── public/                 # Static files
│   ├── css/                # CSS styles
│   │   └── style.css       # Main stylesheet
│   ├── data/               # Sample data
│   │   └── sample_data.json # Wind farm site data
│   ├── images/             # Image assets
│   │   └── wind-turbine-icon.svg # Application icon
│   ├── index.html          # Main HTML file
│   └── js/                 # JavaScript files
│       └── main.js         # Main client-side script
```

## API Endpoints

- `GET /api/sites` - Returns all wind farm sites
- `GET /api/sites/:id` - Returns details for a specific site
- `GET /api/sites-analyzed` - Returns sites with analysis data and filtering options

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript, Leaflet.js (mapping), Chart.js (data visualization)
- **Backend**: Node.js, Express.js
- **Data**: JSON

## License

ISC