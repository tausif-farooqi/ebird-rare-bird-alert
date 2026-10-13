// Equivalent of n8n node: "Extract Time and Distance" (n8n-nodes-base.set, v3.4)
// Original expressions read `$('Map Box API').item` and `$('Remove Duplicate Coordinates').item`,
// i.e. the Mapbox response and the coordinate that produced it, paired positionally (same item
// index) since both nodes process the same deduplicated coordinate list in the same order.
function extractTimeAndDistance(mapboxResponses, coordItems) {
  return mapboxResponses.map((resp, idx) => {
    const coord = coordItems[idx];
    const route = resp.routes[0];

    return {
      duration: Number((route.duration / 60).toFixed(2)),
      distance: Number((route.distance * 0.00062137).toFixed(2)),
      latitude: Number(coord.lat.toFixed(4)),
      longitude: Number(coord.lng.toFixed(4)),
    };
  });
}

module.exports = { extractTimeAndDistance };
