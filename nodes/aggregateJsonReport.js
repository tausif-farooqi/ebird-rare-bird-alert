// Originally a port of the n8n "Aggregate JSON Report" Code node (flat bird+date+location groups
// ranked by recency, observer count, and distance). Now builds a nested report instead:
//
//   species (alphabetical by common name)
//     -> location (nearest driving distance first; locations with no distance go last)
//       -> observation date (most recent first)
//
// Each species also gets summary fields (location count, nearest distance, last seen date) for
// the header line in the email.
const UNKNOWN_DATE = 'Unknown Date';

function hasDistance(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

// Most recent first; unknown dates last. Dates are "YYYY-MM-DD", so string compare is enough.
function compareDatesDesc(a, b) {
  if (a === b) return 0;
  if (a === UNKNOWN_DATE) return 1;
  if (b === UNKNOWN_DATE) return -1;
  return a < b ? 1 : -1;
}

// Nearest first; missing distances last, tie-broken by most recent sighting.
function compareLocations(a, b) {
  const aHas = hasDistance(a.distanceMiles);
  const bHas = hasDistance(b.distanceMiles);
  if (aHas !== bHas) return aHas ? -1 : 1;
  if (aHas && a.distanceMiles !== b.distanceMiles) return a.distanceMiles - b.distanceMiles;
  return compareDatesDesc(a.lastSeenDate, b.lastSeenDate);
}

function aggregateJsonReport(items) {
  const speciesMap = new Map();

  for (const obs of items) {
    const dateStr = obs.obsDt ? obs.obsDt.split(' ')[0] : UNKNOWN_DATE;
    const speciesKey = obs.speciesCode || obs.birdName;

    if (!speciesMap.has(speciesKey)) {
      speciesMap.set(speciesKey, {
        birdName: obs.birdName,
        speciesCode: obs.speciesCode,
        locations: new Map(),
      });
    }
    const species = speciesMap.get(speciesKey);

    if (!species.locations.has(obs.locId)) {
      species.locations.set(obs.locId, {
        locId: obs.locId,
        location: obs.locName,
        cityName: obs.cityName,
        distanceMiles: obs.distanceMiles,
        drivingTimeMinutes: obs.drivingTimeMinutes,
        weatherNext5Days: obs.weatherNext5Days,
        dates: new Map(),
      });
    }
    const location = species.locations.get(obs.locId);

    if (!location.dates.has(dateStr)) {
      location.dates.set(dateStr, {
        date: dateStr,
        maxCount: 0,
        observers: new Set(),
        sightings: [],
      });
    }
    const dateEntry = location.dates.get(dateStr);

    const count = parseInt(obs.howMany, 10) || 0;
    if (count > dateEntry.maxCount) {
      dateEntry.maxCount = count;
    }

    if (obs.userDisplayName) {
      dateEntry.observers.add(obs.userDisplayName);
    }

    // One tag per checklist, each linking to its own checklist.
    if (obs.subId && !dateEntry.sightings.some((s) => s.subId === obs.subId)) {
      dateEntry.sightings.push({
        subId: obs.subId,
        name: obs.userDisplayName || 'Unknown observer',
        url: `https://ebird.org/checklist/${obs.subId}`,
      });
    }
  }

  const report = Array.from(speciesMap.values()).map((species) => {
    const locations = Array.from(species.locations.values()).map((loc) => {
      const dates = Array.from(loc.dates.values())
        .map((d) => ({
          date: d.date,
          maxCount: d.maxCount,
          observerCount: d.observers.size,
          sightings: d.sightings,
        }))
        .sort((a, b) => compareDatesDesc(a.date, b.date));

      return { ...loc, lastSeenDate: dates[0].date, dates };
    });

    locations.sort(compareLocations);

    const distances = locations.map((l) => l.distanceMiles).filter(hasDistance);
    const lastSeenDate = locations.map((l) => l.lastSeenDate).sort(compareDatesDesc)[0];

    return {
      birdName: species.birdName,
      speciesCode: species.speciesCode,
      locationCount: locations.length,
      nearestDistanceMiles: distances.length > 0 ? Math.min(...distances) : null,
      lastSeenDate,
      locations,
    };
  });

  report.sort(
    (a, b) =>
      String(a.birdName).localeCompare(String(b.birdName), 'en', { sensitivity: 'base' }) ||
      String(a.speciesCode).localeCompare(String(b.speciesCode))
  );

  return report;
}

module.exports = { aggregateJsonReport };
