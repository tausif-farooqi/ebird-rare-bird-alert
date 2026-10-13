// Equivalent of n8n node: "Add Short Coordinates" (n8n-nodes-base.set, v3.4)
// Builds a flat record per sighting with the fields the rest of the workflow needs, plus
// latFixed4/lngFixed4 — coordinates rounded to 4 decimal places, used later as the join key
// against weather and driving-distance data.
function addShortCoordinates(sightings) {
  return sightings.map((s) => ({
    speciesCode: s.speciesCode,
    comName: s.comName,
    locId: s.locId,
    locName: s.locName,
    howMany: Number(s.howMany),
    obsDt: s.obsDt,
    lat: Number(s.lat),
    lng: Number(s.lng),
    subId: s.subId,
    userDisplayName: s.userDisplayName,
    obsId: s.obsId,
    latFixed4: Number(Number(s.lat).toFixed(4)),
    lngFixed4: Number(Number(s.lng).toFixed(4)),
  }));
}

module.exports = { addShortCoordinates };
