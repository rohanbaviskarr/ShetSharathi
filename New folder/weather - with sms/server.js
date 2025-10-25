const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const twilio = require("twilio");

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname)));
app.use(express.json()); // To parse JSON request bodies

const API_KEY = "623db3d3a6dc4af6b7b103053251802"; // WeatherAPI key

// Twilio credentials
const accountSid = 'ACd4e66ee3426473a7aa81fdddd4c24452';
const authToken = '718ebeef08192661b105511a4143fbd8';
const twilioPhoneNumber = '+14178042346';
const client = twilio(accountSid, authToken);

function getFarmingInsights(weather, cropType) {
    const { temp_c, humidity, precip_mm, wind_kph, condition } = weather;

    let rainForecast = precip_mm > 5 ? "Rain expected – Delay irrigation" : "No rain – Irrigation may be needed";
    let soilMoisture = humidity > 70 ? "Soil moisture is high – Reduce watering" : "Soil is dry – Consider watering";
    let pestRisk = "Low";
    if (temp_c > 25 && humidity > 60) {
        pestRisk = "High – Risk of fungal diseases and pests";
    } else if (humidity > 50) {
        pestRisk = "Moderate – Monitor for diseases";
    }

    let farmingAdvice = "Good weather for farming activities.";
    if (precip_mm > 10 || wind_kph > 25) {
        farmingAdvice = "Not ideal for farming – Heavy rain/wind expected";
    } else if (temp_c > 35) {
        farmingAdvice = "Too hot for farming – Avoid working in direct sun";
    }

    let wateringAdvice = precip_mm < 5 ? "Low rainfall – Irrigation recommended" : "Sufficient rainfall – No need to irrigate";
    let harvestingAlert = precip_mm > 15 ? "Heavy rain expected – Harvest early if possible" : "No immediate rain threat – Harvest as planned";
    let pesticideAdvice = temp_c > 30 ? "Avoid pesticide spraying – Too hot" : "Safe to apply pesticide"; 
    let extremeWeather = "";
    if (temp_c > 40) {
        extremeWeather = "Heatwave warning! Avoid working outdoors.";
    } else if (temp_c < 5) {
        extremeWeather = "Cold snap expected. Protect sensitive crops.";
    }

    let irrigationTiming = "Check soil before irrigating.";
    if (precip_mm < 2 && humidity < 50) {
        irrigationTiming = "Irrigate today or tomorrow.";
    } else if (precip_mm > 10) {
        irrigationTiming = "No irrigation needed for 2-3 days.";
    }

    let cropAdvice = "No specific crop advice.";
    if (cropType === "wheat") {
        cropAdvice = temp_c > 35 ? "High temperature stress for wheat. Monitor crop health." : "Ideal conditions for wheat growth.";
    } else if (cropType === "rice") {
        cropAdvice = humidity < 60 ? "Low humidity – Monitor rice for dryness." : "Good conditions for rice farming.";
    } else if (cropType === "vegetables") {
        cropAdvice = humidity > 80 ? "High humidity – Increased risk of fungal diseases in vegetables." : "Good conditions for vegetable farming.";
    } else if (cropType === "sugarcane") {
        cropAdvice = temp_c > 35 ? "High heat – Ensure irrigation for sugarcane." : "Good conditions for sugarcane.";
    } else if (cropType === "cotton") {
        cropAdvice = humidity > 70 ? "High humidity – Watch for boll rot in cotton." : "Suitable weather for cotton.";
    } else if (cropType === "pulses") {
        cropAdvice = precip_mm > 10 ? "Excess rain – Risk of waterlogging for pulses." : "Good growing conditions.";
    }

    return {
        rainForecast,
        soilMoisture,
        pestRisk,
        farmingAdvice,
        wateringAdvice,
        harvestingAlert,
        pesticideAdvice,
        extremeWeather,
        irrigationTiming,
        cropAdvice
    };
}

app.get("/weather", async (req, res) => {
    const location = req.query.location;
    const cropType = req.query.cropType || "general";

    if (!location) {
        return res.status(400).json({ error: "Location is required" });
    }

    try {
        const response = await axios.get(
            `http://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${location}&days=3`
        );

        const weather = response.data.current;
        const forecast = response.data.forecast.forecastday;
        const locationData = response.data.location;
        const farmingInsights = getFarmingInsights(weather, cropType);

        const alerts = [];
        forecast.forEach(day => {
            if (day.day.maxtemp_c > 40) alerts.push("Heatwave expected!");
            if (day.day.totalprecip_mm > 50) alerts.push("Heavy rain warning!");
        });

        res.json({
            location: locationData.name,
            country: locationData.country,
            temperature: `${weather.temp_c}°C`,
            condition: weather.condition.text,
            humidity: `${weather.humidity}%`,
            wind_speed: `${weather.wind_kph} km/h`,
            precipitation: `${weather.precip_mm} mm`,
            alerts: alerts.length ? alerts : ["No alerts"],
            ...farmingInsights
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch weather data" });
    }
});

app.post("/send-sms", async (req, res) => {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
        return res.status(400).json({ error: "Phone number and message are required" });
    }

    try {
        const sms = await client.messages.create({
            body: message,
            from: twilioPhoneNumber,
            to: phoneNumber // Should be in E.164 format, e.g., +919876543210
        });
        res.json({ success: true, sid: sms.sid });
    } catch (error) {
        console.error("Twilio Error:", error);
        res.status(500).json({ error: "Failed to send SMS" });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));