// Equivalent of n8n node: "Aggregate JSON Report" (n8n-nodes-base.code)
// Near-verbatim port of the original Code node: groups sightings by bird+date+location,
// tracks max count / unique observers / checklist URLs, then ranks by recency, observer
// count, and distance.
function aggregateJsonReport(items) {
  const groups = {};

  for (const obs of items) {
    const dateStr = obs.obsDt ? obs.obsDt.split(' ')[0] : 'Unknown Date';
    const key = `${obs.birdName}|${dateStr}|${obs.locId}`;

    if (!groups[key]) {
      groups[key] = {
        birdName: obs.birdName,
        date: dateStr,
        location: obs.locName,
        locId: obs.locId,
        maxCount: 0,
        observers: new Set(),
        distanceMiles: obs.distanceMiles,
        drivingTimeMinutes: obs.drivingTimeMinutes,
        cityName: obs.cityName,
        checklistUrls: [],
        weatherNext5Days: obs.weatherNext5Days,
      };
    }

    const entry = groups[key];

    const count = parseInt(obs.howMany, 10) || 0;
    if (count > entry.maxCount) {
      entry.maxCount = count;
    }

    if (obs.userDisplayName) {
      entry.observers.add(obs.userDisplayName);
    }

    if (obs.subId) {
      const url = `https://ebird.org/checklist/${obs.subId}`;
      if (!entry.checklistUrls.includes(url)) {
        entry.checklistUrls.push(url);
      }
    }
  }

  const report = Object.values(groups).map((item) => ({
    ...item,
    observerCount: item.observers.size,
    observers: Array.from(item.observers),
  }));

  report.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    if (dateA > dateB) return -1;
    if (dateA < dateB) return 1;

    if (b.observerCount !== a.observerCount) {
      return b.observerCount - a.observerCount;
    }

    return (a.distanceMiles || 0) - (b.distanceMiles || 0);
  });

  return report;
}

module.exports = { aggregateJsonReport };
