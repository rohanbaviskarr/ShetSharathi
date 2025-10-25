const express = require('express');
const axios = require('axios');

const app = express();
const port = 4000;

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.set('view engine', 'ejs');

// API Keys (hardcoded)
const GOOGLE_MAPS_API_KEY = 'AIzaSyAm94Qgvqz5fETSQyFRXUFKkHUFrMT1tPU'; // Replace if needed
const WEATHER_API_KEY = '345135c152914c17c53ce6f5d3b82a21';

// Constants
const PETROL_RATE_PER_LITER = 100; // INR per liter
const AVERAGE_TOLL_RATE_PER_KM = 1.5; // INR per km
const AVERAGE_MILEAGE = 15; // km per liter

// Hardcoded coordinates for your location
const MY_LATITUDE = 21.0305024; // Your latitude
const MY_LONGITUDE = 75.841536; // Your longitude

// Render the main page
app.get('/', (req, res) => {
  res.render('index', { language: 'English' });
});

// Route to calculate optimal route and warehouses
app.post('/find-route', async (req, res) => {
  const { startLocation, endLocation, isPerishable, shelfLife, transportType, crop } = req.body;
  console.log('Received /find-route request:', req.body);

  if (!startLocation || !endLocation || !crop) {
    return res.status(400).json({ error: 'Missing required fields: startLocation, endLocation, and crop are required' });
  }

  try {
    const directionsResponse = await axios.get(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(startLocation)}&destination=${encodeURIComponent(endLocation)}&key=${GOOGLE_MAPS_API_KEY}&mode=driving&departure_time=now&traffic_model=best_guess&alternatives=true`
    );

    console.log('Directions API Response Status:', directionsResponse.data.status);

    if (directionsResponse.data.status !== 'OK') {
      console.error('Directions API Error Details:', directionsResponse.data);
      throw new Error(`Directions API error: ${directionsResponse.data.status}`);
    }

    const routes = directionsResponse.data.routes;
    let optimalRouteStats = null;
    let optimalRouteWeatherInfo = null;
    const routeData = [];

    for (let idx = 0; idx < routes.length; idx++) {
      const route = routes[idx].legs[0];
      const distance = route.distance.value / 1000; // km
      const duration = route.duration.value / 60; // mins
      const durationInTraffic = route.duration_in_traffic ? route.duration_in_traffic.value / 60 : duration; // mins

      // Log time estimates for debugging
      console.log(`Route ${idx + 1}: Duration=${duration} mins, DurationInTraffic=${durationInTraffic} mins`);

      // Calculate costs
      const petrolCost = (distance / AVERAGE_MILEAGE) * PETROL_RATE_PER_LITER; // Fuel cost in INR
      const tollCost = distance * AVERAGE_TOLL_RATE_PER_KM; // Toll cost in INR
      const totalCost = petrolCost + tollCost;

      // Weather data
      const startWeather = await getWeatherData(route.start_location.lat, route.start_location.lng);
      const endWeather = await getWeatherData(route.end_location.lat, route.end_location.lng);
      const weatherDelay = calculateWeatherDelay(startWeather, endWeather);
      const adjustedDuration = durationInTraffic + weatherDelay;

      console.log(`Route ${idx + 1}: WeatherDelay=${weatherDelay} mins, AdjustedDuration=${adjustedDuration} mins`);

      // Shelf life calculation (in hours)
      const remainingShelfLife = isPerishable && shelfLife ? parseFloat(shelfLife) - (adjustedDuration / 60) : null;

      // Store route data
      const routeInfo = {
        distance,
        duration,
        durationInTraffic,
        adjustedDuration,
        petrolCost,
        tollCost,
        totalCost,
        remainingShelfLife,
        transportType,
        startWeather,
        endWeather,
        polyline: routes[idx].overview_polyline.points,
        steps: route.steps.map(step => ({
          start: { lat: step.start_location.lat, lng: step.start_location.lng },
          end: { lat: step.end_location.lat, lng: step.end_location.lng },
        })),
      };

      if (idx === 0) {
        optimalRouteStats = {
          distance,
          duration,
          durationInTraffic,
          adjustedDuration,
          petrolCost,
          tollCost,
          totalCost,
          remainingShelfLife,
          startLocation,
          endLocation,
          isPerishable,
          transportType,
        };
        optimalRouteWeatherInfo = {
          start: startWeather,
          end: endWeather,
        };
      }

      routeData.push(routeInfo);
    }

    // Fetch all warehouses along the route
    const warehouses = await getWarehousesAlongRoute(startLocation, endLocation, crop);

    if (!warehouses.length) {
      return res.status(404).json({ error: `No ${crop} warehouses found along the route!` });
    }

    // Find the optimal warehouse
    const optimalRoute = routes[0];
    const waypoints = optimalRoute.legs[0].steps.map(step => ({
      lat: step.end_location.lat,
      lng: step.end_location.lng,
    }));
    const midpointIndex = Math.floor(waypoints.length / 2);
    const midpoint = waypoints[midpointIndex] || waypoints[0];

    let optimalWarehouse;
    if (isPerishable && shelfLife) {
      optimalWarehouse = warehouses.reduce((best, current) => {
        const distanceToWarehouse = calculateDistance(current.lat, current.lng, midpoint.lat, midpoint.lng);
        const travelTimeToWarehouse = (distanceToWarehouse / 60) * 60; // Assuming 60 km/h speed
        const travelTimeFromWarehouseToDest = optimalRouteStats.adjustedDuration * 60;
        const totalTravelTime = (travelTimeToWarehouse + travelTimeFromWarehouseToDest) / 60;
        const shelfLifeRemaining = parseFloat(shelfLife) - (totalTravelTime / 60);

        if (shelfLifeRemaining > 0) {
          if (!best || shelfLifeRemaining > (parseFloat(best.shelfLifeRemaining) || 0)) {
            return { ...current, shelfLifeRemaining };
          }
        }
        return best || current;
      }, null);
    } else {
      optimalWarehouse = warehouses.reduce((closest, current) => {
        const distClosest = calculateDistance(closest.lat, closest.lng, midpoint.lat, midpoint.lng);
        const distCurrent = calculateDistance(current.lat, current.lng, midpoint.lat, midpoint.lng);
        return distCurrent < distClosest ? current : closest;
      }, warehouses[0]);
    }

    warehouses.forEach(warehouse => {
      warehouse.isOptimal = warehouse === optimalWarehouse;
    });

    res.json({
      optimalRouteStats,
      optimalRouteWeatherInfo,
      routes: routeData,
      warehouses,
    });
  } catch (error) {
    console.error('Error in /find-route:', error.message);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
});

// Route to find warehouses near me
app.post('/find-warehouses-near-me', async (req, res) => {
  const { lat = MY_LATITUDE, lng = MY_LONGITUDE, crop } = req.body; // Default to hardcoded coordinates
  console.log('Received /find-warehouses-near-me request:', req.body);

  if (!crop) {
    return res.status(400).json({ error: 'Crop type is required' });
  }

  try {
    const warehouses = await getWarehousesNearLocation(lat, lng, crop);

    if (!warehouses.length) {
      return res.status(404).json({ error: `No ${crop} warehouses found near your location!` });
    }

    // Find the optimal warehouse (closest)
    const optimalWarehouse = warehouses.reduce((closest, current) => {
      const distClosest = calculateDistance(closest.lat, closest.lng, lat, lng);
      const distCurrent = calculateDistance(current.lat, current.lng, lat, lng);
      return distCurrent < distClosest ? current : closest;
    }, warehouses[0]);

    warehouses.forEach(warehouse => {
      warehouse.isOptimal = warehouse === optimalWarehouse;
    });

    res.json({ warehouses });
  } catch (error) {
    console.error('Error in /find-warehouses-near-me:', error.message);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
});

// Helper Functions
async function getWeatherData(lat, lng) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${WEATHER_API_KEY}&units=metric`;
  try {
    const response = await axios.get(url);
    const data = response.data;
    return {
      weather: data.weather[0].description,
      temp: `${data.main.temp}°C`,
      windSpeed: `${data.wind.speed} m/s`,
      humidity: `${data.main.humidity}%`,
    };
  } catch (error) {
    console.error('Weather API Error:', error.message);
    return { weather: 'unknown', temp: 'N/A', windSpeed: 'N/A', humidity: 'N/A' };
  }
}

function calculateWeatherDelay(startWeather, endWeather) {
  const weatherDelayFactors = {
    'clear sky': 0,
    'few clouds': 0,
    'scattered clouds': 0,
    'broken clouds': 5,
    'shower rain': 10,
    'rain': 15,
    'thunderstorm': 20,
    'snow': 25,
    'mist': 5,
  };
  const startDelay = weatherDelayFactors[startWeather.weather.toLowerCase()] || 0;
  const endDelay = weatherDelayFactors[endWeather.weather.toLowerCase()] || 0;
  return (startDelay + endDelay) / 2; // Average delay in minutes
}

async function getWarehousesAlongRoute(origin, destination, crop) {
  const directionsResponse = await axios.get(
    `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${GOOGLE_MAPS_API_KEY}&mode=driving`
  );
  if (directionsResponse.data.status !== 'OK') return [];

  const route = directionsResponse.data.routes[0].legs[0];
  const steps = route.steps;
  const waypoints = [];

  for (let i = 0; i < steps.length; i += 5) {
    const step = steps[i];
    waypoints.push({
      lat: step.end_location.lat,
      lng: step.end_location.lng,
    });
  }

  waypoints.push({
    lat: route.end_location.lat,
    lng: route.end_location.lng,
  });

  const warehouses = [];
  for (const waypoint of waypoints) {
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${waypoint.lat},${waypoint.lng}&radius=50000&keyword=${encodeURIComponent(crop + ' warehouse')}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await axios.get(placesUrl);
    if (response.data.status === 'OK') {
      for (const place of response.data.results) {
        const placeId = place.place_id;
        const placeDetails = await getPlaceDetails(placeId);
        const existingWarehouse = warehouses.find(w => w.placeId === placeId);
        if (!existingWarehouse) {
          warehouses.push({
            name: place.name,
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
            placeId: placeId,
            contact: placeDetails.contact || 'N/A',
          });
        }
      }
    }
  }

  return warehouses;
}

async function getWarehousesNearLocation(lat, lng, crop) {
  const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=50000&keyword=${encodeURIComponent(crop + ' warehouse')}&key=${GOOGLE_MAPS_API_KEY}`;
  const response = await axios.get(placesUrl);
  if (response.data.status !== 'OK') return [];

  const warehouses = [];
  for (const place of response.data.results) {
    const placeId = place.place_id;
    const placeDetails = await getPlaceDetails(placeId);
    const existingWarehouse = warehouses.find(w => w.placeId === placeId);
    if (!existingWarehouse) {
      warehouses.push({
        name: place.name,
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        placeId: placeId,
        contact: placeDetails.contact || 'N/A',
      });
    }
  }
  return warehouses;
}

async function getPlaceDetails(placeId) {
  try {
    const detailsResponse = await axios.get(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_phone_number&key=${GOOGLE_MAPS_API_KEY}`
    );
    if (detailsResponse.data.status === 'OK') {
      return {
        contact: detailsResponse.data.result.formatted_phone_number || 'N/A',
      };
    }
    return { contact: 'N/A' };
  } catch (error) {
    console.error('Error fetching place details:', error.message);
    return { contact: 'N/A' };
  }
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});