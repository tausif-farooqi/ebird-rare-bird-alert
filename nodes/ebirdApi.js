// Equivalent of n8n node: "eBirdAPI" (n8n-nodes-base.httpRequest)
// GET https://api.ebird.org/v2/data/obs/geo/recent/notable?lat=..&lng=..&dist=..&hotspot=true&detail=full&back=..
// Auth: n8n "genericCredentialType" / "httpCustomAuth" credential named "eBird API Key".
// eBird's own docs specify the API key as an "X-eBirdApiToken" request header, so that is
// reproduced here directly rather than guessing at the n8n credential's internal field layout.
const axios = require('axios');

async function fetchEbirdSightings({ lat, lng, distKm, backDays }) {
  const token = process.env.EBIRD_API_TOKEN;
  if (!token) {
    throw new Error('Missing EBIRD_API_TOKEN in environment');
  }

  const response = await axios.get('https://api.ebird.org/v2/data/obs/geo/recent/notable', {
    params: {
      lat,
      lng,
      dist: distKm,
      hotspot: true,
      detail: 'full',
      back: backDays,
    },
    headers: {
      'X-eBirdApiToken': token,
    },
  });

  // eBird returns a plain JSON array of sighting objects (one per observation).
  return response.data;
}

module.exports = { fetchEbirdSightings };
