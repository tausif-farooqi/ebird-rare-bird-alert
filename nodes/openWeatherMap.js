// Equivalent of n8n node: "OpenWeatherMap" (n8n-nodes-base.openWeatherMap)
// parameters: { operation: "5DayForecast", format: "imperial", locationSelection: "coordinates",
//               latitude: "={{ $json.lat }}", longitude: "={{ $json.lng }}" }
// n8n runs this node once per input item; this does the same by looping over the unique
// coordinates and calling the 5-day/3-hour forecast endpoint for each one.
const axios = require('axios');

async function fetchWeatherForecast(coordItems) {
  const apiKey = process.env.OWM_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OWM_API_KEY in environment');
  }

  const results = [];
  for (const { lat, lng } of coordItems) {
    const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: {
        lat,
        lon: lng,
        units: 'imperial',
        appid: apiKey,
      },
    });
    results.push(response.data);
  }

  return results;
}

module.exports = { fetchWeatherForecast };
