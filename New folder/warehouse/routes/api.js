const express = require('express');
const axios = require('axios');
const router = express.Router();

const GOOGLE_MAPS_API_KEY = 'AIzaSyAm94Qgvqz5fETSQyFRXUFKkHUFrMT1tPU';
const WEATHER_API_KEY = '345135c152914c17c53ce6f5d3b82a21';

// Define petrol and toll rates
const PETROL_RATE_PER_LITER = 100; // Example rate in INR
const AVERAGE_TOLL_RATE_PER_KM = 1.5; // Average toll rate in INR per km

// Function to get weather data
const getWeatherData = async (lat, lng) => {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${WEATHER_API_KEY}&units=metric`;
    const response = await axios.get(url);
    return response.data;
};

// Function to calculate weather delay
const calculateWeatherDelay = (startWeather, endWeather) => {
    const weatherDelayFactors = {
        "clear sky": 0,
        "few clouds": 0,
        "scattered clouds": 0,
        "broken clouds": 5,
        "shower rain": 10,
        "rain": 15,
        "thunderstorm": 20,
        "snow": 25,
        "mist": 5
    };

    const startDelay = weatherDelayFactors[startWeather.weather[0].description.toLowerCase()] || 0;
    const endDelay = weatherDelayFactors[endWeather.weather[0].description.toLowerCase()] || 0;
    return (startDelay + endDelay) / 2;
};

// Function to get directions from Google Maps API
const getDirections = async (startLocation, endLocation) => {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${startLocation}&destination=${endLocation}&key=${GOOGLE_MAPS_API_KEY}&departure_time=now&traffic_model=best_guess`;
    const response = await axios.get(url);
    return response.data;
};

// Function to get warehouses along the route
const getWarehousesAlongRoute = async (origin, destination, crop) => {
    const directions = await getDirections(origin, destination);
    const steps = directions.routes[0].legs[0].steps;
    const waypoints = steps.map(step => step.end_location);

    const warehouses = [];
    for (const waypoint of waypoints) {
        const response = await axios.get(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${waypoint.lat},${waypoint.lng}&radius=50000&keyword=${crop} warehouse&key=${GOOGLE_MAPS_API_KEY}`);
        warehouses.push(...response.data.results);
    }

    return warehouses;
};

// API endpoint to find warehouses along the route
router.post('/find-warehouses', async (req, res) => {
    const { startLocation, endLocation, crop } = req.body;

    try {
        const warehouses = await getWarehousesAlongRoute(startLocation, endLocation, crop);
        res.json({ warehouses });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;