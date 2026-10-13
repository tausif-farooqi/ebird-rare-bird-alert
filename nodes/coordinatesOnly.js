// Equivalent of n8n node: "Coordinates Only" (n8n-nodes-base.set, v3.4)
// Projects each sighting down to just its raw {lat, lng}, which then gets deduplicated so
// weather/driving-distance lookups only happen once per unique location.
function coordinatesOnly(items) {
  return items.map((item) => ({ lat: item.lat, lng: item.lng }));
}

module.exports = { coordinatesOnly };
