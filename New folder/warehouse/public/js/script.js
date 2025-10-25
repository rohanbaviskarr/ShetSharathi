// public/js/script.js
console.log('Script loaded');

// Ensure initMap is globally available
window.initMap = function () {
  console.log('Leaflet map loaded and initMap called');
  window.map = L.map('map').setView([19.0760, 73.8567], 10); // Default to Mumbai
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Leaflet | © OpenStreetMap',
    maxZoom: 18,
  }).addTo(map);
  window.marker = L.marker([19.0760, 73.8567], { draggable: false }).addTo(map);
};

let translations = {
  en: {
    headerTitle: 'Shetsarathi',
    appTitle: 'Farmer Route Optimizer',
    mapAttribution: 'Leaflet | © OpenStreetMap',
    perishableGoods: 'Transporting Perishable Goods',
    shelfLife: 'Shelf Life (hours):',
    transportType: 'Transport Type:',
    findRoutes: 'Find Routes & Warehouses',
    findWarehousesNearMe: 'Find Warehouses Near Me',
    cropType: 'Crop Type:',
    optimalRoute: 'Optimal Route:',
    distance: 'Distance: {:.2f} km',
    travelTimeNoTraffic: 'Estimated Travel Time (without traffic): {:.2f} mins',
    travelTimeTraffic: 'Estimated Travel Time (with traffic): {:.2f} mins',
    adjustedTravelTime: 'Adjusted Travel Time (with traffic and weather): {:.2f} mins',
    petrolCost: 'Estimated Petrol Cost: ₹{:.2f}',
    tollCost: 'Estimated Toll Cost: ₹{:.2f}',
    totalCost: 'Total Estimated Cost: ₹{:.2f}',
    remainingShelfLife: 'Remaining Shelf Life: {:.2f} hours',
    transportTypeResult: 'Transport Type: {}',
    weatherInfo: 'Weather Information:',
    startWeather: 'Start Location Weather: {} - {} - Wind: {} - Humidity: {}%',
    endWeather: 'End Location Weather: {} - {} - Wind: {} - Humidity: {}%',
    footerText: '© 2025 Shetsarathi. All rights reserved.',
    showMore: 'Show More',
    showLess: 'Show Less'
  },
  mr: {
    headerTitle: 'शेतसारथी',
    appTitle: 'शेतकरी मार्ग ऑप्टिमायझर',
    mapAttribution: 'लीफलेट | © ओपनस्ट्रीटमॅप',
    perishableGoods: 'नाशवंत माल वाहतूक',
    shelfLife: 'शेल्फ लाइफ (तास):',
    transportType: 'वाहतूक प्रकार:',
    findRoutes: 'मार्ग आणि गोदाम शोधा',
    findWarehousesNearMe: 'माझ्या जवळील गोदाम शोधा',
    cropType: 'पीक प्रकार:',
    optimalRoute: 'सर्वोत्तम मार्ग:',
    distance: 'अंतर: {:.2f} किमी',
    travelTimeNoTraffic: 'अंदाजे प्रवास वेळ (ट्रॅफिकशिवाय): {:.2f} मिनिटे',
    travelTimeTraffic: 'अंदाजे प्रवास वेळ (ट्रॅफिकसह): {:.2f} मिनिटे',
    adjustedTravelTime: 'समायोजित प्रवास वेळ (ट्रॅफिक आणि हवामानासह): {:.2f} मिनिटे',
    petrolCost: 'अंदाजे पेट्रोल खर्च: ₹{:.2f}',
    tollCost: 'अंदाजे टोल खर्च: ₹{:.2f}',
    totalCost: 'एकूण अंदाजे खर्च: ₹{:.2f}',
    remainingShelfLife: 'उर्वरित शेल्फ लाइफ: {:.2f} तास',
    transportTypeResult: 'वाहतूक प्रकार: {}',
    weatherInfo: 'हवामान माहिती:',
    startWeather: 'सुरुवातीचे स्थान हवामान: {} - {} - वारा: {} - आर्द्रता: {}%',
    endWeather: 'शेवटचे स्थान हवामान: {} - {} - वारा: {} - आर्द्रता: {}%',
    footerText: '© 2025 शेतसारथी. सर्व हक्क राखीव.',
    showMore: 'अधिक दाखवा',
    showLess: 'कमी दाखवा'
  },
  hi: {
    headerTitle: 'शेतसारथी',
    appTitle: 'किसान मार्ग ऑप्टिमाइज़र',
    mapAttribution: 'लीफलेट | © ओपनस्ट्रीटमैप',
    perishableGoods: 'नाशवान माल परिवहन',
    shelfLife: 'शेल्फ जीवन (घंटे):',
    transportType: 'परिवहन प्रकार:',
    findRoutes: 'मार्ग और गोदाम खोजें',
    findWarehousesNearMe: 'मेरे पास के गोदाम खोजें',
    cropType: 'फसल प्रकार:',
    optimalRoute: 'सर्वोत्तम मार्ग:',
    distance: 'दूरी: {:.2f} किमी',
    travelTimeNoTraffic: 'अनुमानित यात्रा समय (बिना ट्रैफिक के): {:.2f} मिनट',
    travelTimeTraffic: 'अनुमानित यात्रा समय (ट्रैफिक के साथ): {:.2f} मिनट',
    adjustedTravelTime: 'समायोजित यात्रा समय (ट्रैफिक और मौसम के साथ): {:.2f} मिनट',
    petrolCost: 'अनुमानित पेट्रोल लागत: ₹{:.2f}',
    tollCost: 'अनुमानित टोल लागत: ₹{:.2f}',
    totalCost: 'कुल अनुमानित लागत: ₹{:.2f}',
    remainingShelfLife: 'शेष शेल्फ जीवन: {:.2f} घंटे',
    transportTypeResult: 'परिवहन प्रकार: {}',
    weatherInfo: 'मौसम जानकारी:',
    startWeather: 'प्रारंभिक स्थान मौसम: {} - {} - हवा: {} - आर्द्रता: {}%',
    endWeather: 'अंतिम स्थान मौसम: {} - {} - हवा: {} - आर्द्रता: {}%',
    footerText: '© 2025 शेतसारथी. सर्व हक्क राखीव.',
    showMore: 'अधिक दिखाएं',
    showLess: 'कम दिखाएं'
  }
};

function convertToLanguageNumbers(text, lang) {
  if (lang === "mr" || lang === "hi") {
    const digits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
    return text.replace(/[0-9]/g, digit => digits[digit]);
  }
  return text; // English uses standard digits
}

function updateLanguage() {
  const lang = document.getElementById('languageSelect').value;
  const t = translations[lang];
  document.querySelector('label[for="perishable"]').textContent = t.perishableGoods;
  document.querySelector('label[for="shelfLife"]').textContent = t.shelfLife;
  document.querySelector('label[for="transportType"]').textContent = t.transportType;
  document.querySelector('label[for="crop"]').textContent = t.cropType;
  document.querySelector('button[onclick="findRoute()"]').textContent = t.findRoutes;
  document.querySelector('button[onclick="findWarehousesNearMe()"]').textContent = t.findWarehousesNearMe;
  document.getElementById('headerTitle').innerText = t.headerTitle;
  document.getElementById('appTitle').innerText = t.appTitle;
  document.getElementById('footerText').innerText = t.footerText.replace("2025", convertToLanguageNumbers("2025", lang));

  // Update map attribution
  map.eachLayer((layer) => {
    if (layer instanceof L.TileLayer) {
      layer.options.attribution = t.mapAttribution;
      map.removeLayer(layer);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: t.mapAttribution,
        maxZoom: 18,
      }).addTo(map);
    }
  });

  const resultDiv = document.getElementById('result');
  if (resultDiv.style.display === 'block' && resultDiv.dataset.routeData) {
    displayRoute(JSON.parse(resultDiv.dataset.routeData), lang);
  }
}

function toggleShelfLife() {
  const shelfLifeGroup = document.getElementById('shelfLifeGroup');
  shelfLifeGroup.style.display = document.getElementById('perishable').checked ? 'flex' : 'none';
}

async function findRoute() {
  const startLocation = document.getElementById('startLocation').value;
  const endLocation = document.getElementById('endLocation').value;
  const isPerishable = document.getElementById('perishable').checked;
  const shelfLife = document.getElementById('shelfLife').value;
  const transportType = document.getElementById('transportType').value;
  const crop = document.getElementById('crop').value;
  const lang = document.getElementById('languageSelect').value;
  const t = translations[lang];

  if (!startLocation || !endLocation || !crop) {
    alert('Please enter start location, end location, and crop type!');
    return;
  }

  document.getElementById('status').textContent = 'Calculating routes and warehouses...';

  try {
    const response = await fetch('/find-route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startLocation, endLocation, isPerishable, shelfLife, transportType, crop }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unknown error');

    data.optimalRouteStats.startLocation = startLocation;
    data.optimalRouteStats.endLocation = endLocation;
    data.optimalRouteStats.isPerishable = isPerishable;
    data.optimalRouteStats.transportType = transportType;

    displayRoute(data, lang);
    const optimalRoute = data.routes[0];
    const latlngs = optimalRoute.steps.map((step) => [step.end.lat, step.end.lng]);
    map.fitBounds(L.latLngBounds(latlngs));

    document.getElementById('status').textContent = 'Routes and warehouses found!';
  } catch (error) {
    document.getElementById('status').textContent = `Error: ${error.message}`;
    console.error('Find Route Error:', error);
  }
}

async function findWarehousesNearMe() {
  const crop = document.getElementById('crop').value;
  const lang = document.getElementById('languageSelect').value;
  const t = translations[lang];

  if (!crop) {
    alert('Please enter crop type!');
    return;
  }

  document.getElementById('status').textContent = 'Searching warehouses...';

  try {
    const response = await fetch('/find-warehouses-near-me', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ crop }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unknown error');

    displayWarehousesNearMe(data, lang);
    map.fitBounds(L.latLngBounds(data.warehouses.map((w) => [w.lat, w.lng])));

    document.getElementById('status').textContent = 'Warehouses found!';
  } catch (error) {
    document.getElementById('status').textContent = `Error: ${error.message}`;
    console.error('Find Warehouses Near Me Error:', error);
  }
}

// Display routes and warehouses
function displayRoute(data, lang) {
  const t = translations[lang];
  let resultHTML = `
    <h3>${t.optimalRoute}</h3>
    <div class="route-details">
      <p><strong>${t.distance.replace('{:.2f}', data.optimalRouteStats.distance.toFixed(2))}</strong></p>
      <p><strong>${t.travelTimeNoTraffic.replace('{:.2f}', data.optimalRouteStats.duration.toFixed(2))}</strong></p>
      <p><strong>${t.travelTimeTraffic.replace('{:.2f}', data.optimalRouteStats.durationInTraffic.toFixed(2))}</strong></p>
      <p><strong>${t.adjustedTravelTime.replace('{:.2f}', data.optimalRouteStats.adjustedDuration.toFixed(2))}</strong></p>
      <p><strong>${t.petrolCost.replace('{:.2f}', data.optimalRouteStats.petrolCost.toFixed(2))}</strong></p>
      <p><strong>${t.tollCost.replace('{:.2f}', data.optimalRouteStats.tollCost.toFixed(2))}</strong></p>
      <p><strong>${t.totalCost.replace('{:.2f}', data.optimalRouteStats.totalCost.toFixed(2))}</strong></p>
  `;
  if (data.optimalRouteStats.isPerishable) {
    resultHTML += `<p><strong>${t.remainingShelfLife.replace('{:.2f}', data.optimalRouteStats.remainingShelfLife.toFixed(2))}</strong></p>`;
  }
  resultHTML += `
      <p><strong>${t.transportTypeResult.replace('{}', data.optimalRouteStats.transportType)}</strong></p>
    </div>
    <h3>${t.weatherInfo}</h3>
    <div class="weather-details">
      <p><strong>${t.startWeather
        .replace('{}', data.optimalRouteWeatherInfo.start.weather)
        .replace('{}', data.optimalRouteWeatherInfo.start.temp)
        .replace('{}', data.optimalRouteWeatherInfo.start.windSpeed)
        .replace('{}', data.optimalRouteWeatherInfo.start.humidity)}</strong></p>
      <p><strong>${t.endWeather
        .replace('{}', data.optimalRouteWeatherInfo.end.weather)
        .replace('{}', data.optimalRouteWeatherInfo.end.temp)
        .replace('{}', data.optimalRouteWeatherInfo.end.windSpeed)
        .replace('{}', data.optimalRouteWeatherInfo.end.humidity)}</strong></p>
    </div>
    <h3>Optimal Warehouses:</h3>
    <div class="warehouse-list">
  `;
  const optimalWarehouses = data.warehouses.filter((w) => w.isOptimal);
  resultHTML += optimalWarehouses
    .map(
      (w) => `
      <div class="warehouse-item"><strong>${w.name}</strong> (Lat: ${convertToLanguageNumbers(w.lat.toFixed(4), lang)}, Lng: ${convertToLanguageNumbers(w.lng.toFixed(4), lang)}, Contact: ${w.contact})</div>
    `,
    )
    .join('');
  resultHTML += '</div>';

  const nonOptimalWarehouses = data.warehouses.filter((w) => !w.isOptimal);
  if (nonOptimalWarehouses.length > 0) {
    resultHTML += `
      <h3>Warehouses:</h3>
      <div class="warehouse-list">
    `;
    resultHTML += nonOptimalWarehouses
      .slice(0, 5)
      .map(
        (w) => `
        <div class="warehouse-item">${w.name} (Lat: ${convertToLanguageNumbers(w.lat.toFixed(4), lang)}, Lng: ${convertToLanguageNumbers(w.lng.toFixed(4), lang)}, Contact: ${w.contact})</div>
      `,
      )
      .join('');
    resultHTML += '</div>';

    if (nonOptimalWarehouses.length > 5) {
      resultHTML += `
        <button id="showMoreButton" class="btn-success" onclick="showMoreWarehouses()">${t.showMore}</button>
        <div id="hiddenWarehouses" style="display: none;">
          ${nonOptimalWarehouses
            .slice(5)
            .map(
              (w) => `
            <div class="warehouse-item">${w.name} (Lat: ${convertToLanguageNumbers(w.lat.toFixed(4), lang)}, Lng: ${convertToLanguageNumbers(w.lng.toFixed(4), lang)}, Contact: ${w.contact})</div>
          `,
            )
            .join('')}
        </div>
      `;
    }
  }

  document.getElementById('result').innerHTML = resultHTML;
  document.getElementById('result').style.display = 'block';
  document.getElementById('result').dataset.routeData = JSON.stringify(data);

  map.eachLayer((layer) => {
    if (layer instanceof L.Polyline || layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });

  data.routes.forEach((route, idx) => {
    const color = idx === 0 ? '#FF0000' : '#0000FF';
    const weight = idx === 0 ? 5 : 3;
    const latlngs = route.steps.map((step) => [step.end.lat, step.end.lng]);
    L.polyline(latlngs, { color: color, weight: weight, opacity: 0.7 }).addTo(map);
  });

  data.warehouses.forEach((warehouse) => {
    const icon = warehouse.isOptimal
      ? L.icon({
          iconUrl: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
        })
      : L.icon({
          iconUrl: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
        });
    const marker = L.marker([warehouse.lat, warehouse.lng], { icon: icon }).addTo(map);
    const popupContent = `Warehouse: ${warehouse.name}<br>Crop: ${data.optimalRouteStats.crop}<br>Contact: ${warehouse.contact}${
      warehouse.isOptimal ? '<br><b>Optimal Warehouse</b>' : ''
    }`;
    marker.bindPopup(popupContent);
  });
}

// Display warehouses near me
function displayWarehousesNearMe(data, lang) {
  const t = translations[lang];
  let resultHTML = `<h3>Optimal Warehouses:</h3><div class="warehouse-list">`;
  const optimalWarehouses = data.warehouses.filter((w) => w.isOptimal);
  resultHTML += optimalWarehouses
    .map(
      (w) => `
    <div class="warehouse-item"><strong>${w.name}</strong> (Lat: ${convertToLanguageNumbers(w.lat.toFixed(4), lang)}, Lng: ${convertToLanguageNumbers(w.lng.toFixed(4), lang)}, Contact: ${w.contact})</div>
  `,
    )
    .join('');
  resultHTML += '</div>';

  const nonOptimalWarehouses = data.warehouses.filter((w) => !w.isOptimal);
  if (nonOptimalWarehouses.length > 0) {
    resultHTML += `
      <h3>Warehouses:</h3>
      <div class="warehouse-list">
    `;
    resultHTML += nonOptimalWarehouses
      .slice(0, 5)
      .map(
        (w) => `
        <div class="warehouse-item">${w.name} (Lat: ${convertToLanguageNumbers(w.lat.toFixed(4), lang)}, Lng: ${convertToLanguageNumbers(w.lng.toFixed(4), lang)}, Contact: ${w.contact})</div>
      `,
      )
      .join('');
    resultHTML += '</div>';

    if (nonOptimalWarehouses.length > 5) {
      resultHTML += `
        <button id="showMoreButton" class="btn-success" onclick="showMoreWarehouses()">${t.showMore}</button>
        <div id="hiddenWarehouses" style="display: none;">
          ${nonOptimalWarehouses
            .slice(5)
            .map(
              (w) => `
            <div class="warehouse-item">${w.name} (Lat: ${convertToLanguageNumbers(w.lat.toFixed(4), lang)}, Lng: ${convertToLanguageNumbers(w.lng.toFixed(4), lang)}, Contact: ${w.contact})</div>
          `,
            )
            .join('')}
        </div>
      `;
    }
  }

  document.getElementById('result').innerHTML = resultHTML;
  document.getElementById('result').style.display = 'block';
  document.getElementById('result').dataset.routeData = JSON.stringify(data);

  map.eachLayer((layer) => {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });

  data.warehouses.forEach((warehouse) => {
    const icon = warehouse.isOptimal
      ? L.icon({
          iconUrl: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
        })
      : L.icon({
          iconUrl: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
        });
    const marker = L.marker([warehouse.lat, warehouse.lng], { icon: icon }).addTo(map);
    const popupContent = `Warehouse: ${warehouse.name}<br>Crop: ${data.crop}<br>Contact: ${warehouse.contact}${
      warehouse.isOptimal ? '<br><b>Optimal Warehouse</b>' : ''
    }`;
    marker.bindPopup(popupContent);
  });
}

// Show more warehouses
function showMoreWarehouses() {
  const hiddenWarehouses = document.getElementById('hiddenWarehouses');
  const showMoreButton = document.getElementById('showMoreButton');
  const lang = document.getElementById('languageSelect').value;
  const t = translations[lang];

  if (hiddenWarehouses.style.display === 'none') {
    hiddenWarehouses.style.display = 'block';
    showMoreButton.textContent = t.showLess;
  } else {
    hiddenWarehouses.style.display = 'none';
    showMoreButton.textContent = t.showMore;
  }
}

// Initialize on load
window.onload = () => {
  console.log('Page loaded, initializing...');
  initMap();
  document.getElementById('languageSelect').value = 'mr'; // Default to Marathi
  updateLanguage();
};