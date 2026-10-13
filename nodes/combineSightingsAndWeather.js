// Equivalent of n8n node: "Combine Sightings and Weather" (n8n-nodes-base.merge, v3.2)
// parameters: { mode: "combine", advanced: true,
//   mergeByFields: [{ field1: "latFixed4", field2: "city.coord.lat" },
//                    { field1: "lngFixed4", field2: "city.coord.lon" }] }
// No "joinMode" was set, so this uses the node's default inner join ("keep matches"): every
// sighting (input 0, many rows) is paired with the single weather response (input 1, one row
// per unique coordinate) whose rounded city coordinate matches, broadcasting that weather data
// onto every sighting at that location. Both sides are rounded to 4 decimals for the key, since
// OpenWeatherMap's `city.coord` precision isn't guaranteed to exactly match `toFixed(4)`.
function makeKey(lat, lng) {
  return `${Number(lat).toFixed(4)}|${Number(lng).toFixed(4)}`;
}

function combineSightingsAndWeather(sightingItems, weatherItems) {
  const weatherByKey = new Map();
  for (const weather of weatherItems) {
    weatherByKey.set(makeKey(weather.city.coord.lat, weather.city.coord.lon), weather);
  }

  const combined = [];
  for (const sighting of sightingItems) {
    const weather = weatherByKey.get(makeKey(sighting.latFixed4, sighting.lngFixed4));
    if (weather) {
      combined.push({ ...sighting, ...weather });
    }
  }

  return combined;
}

module.exports = { combineSightingsAndWeather };
