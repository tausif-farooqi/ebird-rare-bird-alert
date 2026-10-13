// Equivalent of n8n node: "Combine Sightings, Weather, and Distance" (n8n-nodes-base.merge, v3.2)
// parameters: { mode: "combine", advanced: true,
//   mergeByFields: [{ field1: "latFixed4", field2: "latitude" },
//                    { field1: "lngFixed4", field2: "longitude" }] }
// Same default inner-join/broadcast semantics as combineSightingsAndWeather.js: input 0 is the
// sighting+weather records (still carrying latFixed4/lngFixed4 from "Add Short Coordinates"),
// input 1 is the one-row-per-location driving time/distance from "Extract Time and Distance".
function makeKey(lat, lng) {
  return `${Number(lat).toFixed(4)}|${Number(lng).toFixed(4)}`;
}

function combineSightingsWeatherDistance(sightingsWeatherItems, distanceItems) {
  const distanceByKey = new Map();
  for (const distance of distanceItems) {
    distanceByKey.set(makeKey(distance.latitude, distance.longitude), distance);
  }

  const combined = [];
  for (const item of sightingsWeatherItems) {
    const distance = distanceByKey.get(makeKey(item.latFixed4, item.lngFixed4));
    if (distance) {
      combined.push({ ...item, ...distance });
    }
  }

  return combined;
}

module.exports = { combineSightingsWeatherDistance };
