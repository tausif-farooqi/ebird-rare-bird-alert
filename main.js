// Main entry point: wires every node module together in the same order and along the same
// connections as eBirdAgent.json. Run on demand with `node main.js`; `scheduler.js` calls
// runWorkflow() on the same cron schedule the n8n "Schedule Trigger" node used.
require('dotenv').config();

const { triggerManual } = require('./nodes/triggerManual');
const { fetchEbirdSightings } = require('./nodes/ebirdApi');
const { removeDuplicateSightings } = require('./nodes/removeDuplicateSightings');
const { addShortCoordinates } = require('./nodes/addShortCoordinates');
const { coordinatesOnly } = require('./nodes/coordinatesOnly');
const { removeDuplicateCoordinates } = require('./nodes/removeDuplicateCoordinates');
const { fetchWeatherForecast } = require('./nodes/openWeatherMap');
const { keepWeatherData6to9 } = require('./nodes/keepWeatherData6to9');
const { fetchDrivingDirections } = require('./nodes/mapBoxApi');
const { extractTimeAndDistance } = require('./nodes/extractTimeAndDistance');
const { combineSightingsAndWeather } = require('./nodes/combineSightingsAndWeather');
const { combineSightingsWeatherDistance } = require('./nodes/combineSightingsWeatherDistance');
const { filterOutUnneededData } = require('./nodes/filterOutUnneededData');
const { aggregateJsonReport } = require('./nodes/aggregateJsonReport');
const { saveJsonReport } = require('./nodes/saveJsonReport');
const { formatAsHtml } = require('./nodes/formatAsHtml');
const { sendGmail } = require('./nodes/sendGmail');

// Parses EBIRD_SEARCH_COORDS ("lat,lng;lat,lng;...") into [{ lat, lng }]. Falls back to the
// home coordinate when the variable is unset or empty.
function parseSearchCoords(value, fallback) {
  const entries = (value || '')
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (entries.length === 0) {
    return [fallback];
  }

  return entries.map((entry) => {
    const parts = entry.split(',').map((part) => part.trim());
    const [lat, lng] = parts.map(Number);
    if (parts.length !== 2 || parts.some((p) => p === '') || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new Error(`Invalid EBIRD_SEARCH_COORDS entry "${entry}" (expected "lat,lng")`);
    }
    return { lat, lng };
  });
}

async function runWorkflow() {
  // Trigger node — purely symbolic start signal, matching what the n8n trigger emits.
  triggerManual();

  const HOME_LAT = Number(process.env.HOME_LAT || 37.4894467);
  const HOME_LNG = Number(process.env.HOME_LNG || -121.9370132);
  const EBIRD_DIST_KM = Number(process.env.EBIRD_DIST_KM || 50);
  const EBIRD_BACK_DAYS = Number(process.env.EBIRD_BACK_DAYS || 7);
  const searchCoords = parseSearchCoords(process.env.EBIRD_SEARCH_COORDS, {
    lat: HOME_LAT,
    lng: HOME_LNG,
  });

  // One eBird call per search point; overlapping radii are deduped below.
  console.log(`Fetching notable eBird sightings around ${searchCoords.length} search point(s)...`);
  const responses = await Promise.all(
    searchCoords.map(({ lat, lng }) =>
      fetchEbirdSightings({ lat, lng, distKm: EBIRD_DIST_KM, backDays: EBIRD_BACK_DAYS })
    )
  );
  const rawSightings = responses.flat();
  console.log(`${rawSightings.length} raw sighting(s) across all searches.`);

  const uniqueSightings = removeDuplicateSightings(rawSightings);
  console.log(`${uniqueSightings.length} unique notable sighting(s) after dedup.`);

  if (uniqueSightings.length === 0) {
    console.log('No notable sightings found. Nothing to report.');
    return;
  }

  const shortCoordSightings = addShortCoordinates(uniqueSightings);

  // Branch: unique coordinates -> weather + driving distance, in parallel.
  const coords = coordinatesOnly(shortCoordSightings);
  const uniqueCoords = removeDuplicateCoordinates(coords);

  console.log(`Fetching weather + driving directions for ${uniqueCoords.length} unique location(s)...`);
  const [rawWeather, rawDirections] = await Promise.all([
    fetchWeatherForecast(uniqueCoords),
    fetchDrivingDirections(uniqueCoords, { lat: HOME_LAT, lng: HOME_LNG }),
  ]);

  const weatherFiltered = keepWeatherData6to9(rawWeather);
  const timeAndDistance = extractTimeAndDistance(rawDirections, uniqueCoords);

  // Merge the sighting branch back together with the weather and distance branches.
  const sightingsAndWeather = combineSightingsAndWeather(shortCoordSightings, weatherFiltered);
  const combinedAll = combineSightingsWeatherDistance(sightingsAndWeather, timeAndDistance);

  const filtered = filterOutUnneededData(combinedAll);
  const report = aggregateJsonReport(filtered);
  console.log(`Saved report JSON to ${saveJsonReport(report)}`);

  if (report.length === 0) {
    console.log('No sightings matched after enrichment. Skipping email.');
    return;
  }

  const { html } = formatAsHtml(report);

  console.log(`Sending report email with ${report.length} species...`);
  await sendGmail(html);
  console.log('Done.');
}

module.exports = { runWorkflow };

if (require.main === module) {
  runWorkflow().catch((err) => {
    console.error('Workflow failed:', err);
    process.exitCode = 1;
  });
}
