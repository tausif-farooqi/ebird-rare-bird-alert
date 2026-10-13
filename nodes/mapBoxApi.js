// Equivalent of n8n node: "Map Box API" (n8n-nodes-base.httpRequest)
// GET https://api.mapbox.com/directions/v5/mapbox/driving/{originLng},{originLat};{lng},{lat}
//   ?alternatives=false&geometries=geojson&overview=simplified&steps=false&notifications=none
// Auth: n8n "genericCredentialType" / "httpCustomAuth" credential named "Map Box API Key".
// TODO: Mapbox's public API authenticates via an `access_token` query parameter, which is what
// this file sends. The original n8n "httpCustomAuth" credential's exact shape (header vs query
// param, param name) isn't visible in the exported workflow JSON — if your credential used a
// header instead, move MAPBOX_API_KEY into a header here.
//
// TODO: the original node hardcoded `depart_at=2025-10-26T06:30`, a fixed test timestamp that
// predates this script and isn't tied to the actual weekly schedule. It has been dropped here
// so Mapbox falls back to live/typical traffic conditions. Add a computed `depart_at` back in
// (e.g. "next Saturday 6:30 AM") if you want traffic-aware timing for a specific departure.
const axios = require('axios');

async function fetchDrivingDirections(coordItems, origin) {
  const accessToken = process.env.MAPBOX_API_KEY;
  if (!accessToken) {
    throw new Error('Missing MAPBOX_API_KEY in environment');
  }

  const results = [];
  for (const { lat, lng } of coordItems) {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${lng},${lat}`;
    const response = await axios.get(url, {
      params: {
        alternatives: false,
        geometries: 'geojson',
        overview: 'simplified',
        steps: false,
        notifications: 'none',
        access_token: accessToken,
      },
    });
    results.push(response.data);
  }

  return results;
}

module.exports = { fetchDrivingDirections };
