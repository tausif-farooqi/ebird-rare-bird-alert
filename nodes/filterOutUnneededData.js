// Equivalent of n8n node: "Filter Out Unneeded Data" (n8n-nodes-base.set, v3.4)
// Flattens each combined sighting+weather+distance record down to the fields the report needs,
// pulling day1..day5 out of the (6am/9am-filtered) OpenWeatherMap `list` array at indices
// 0, 2, 4, 6, 8 (the 06:00 entry of each of the next 5 days).
//
// TODO: the original Set node never assigns a `windSpeed` for day1. It has an assignment named
// "weatherNext5Days.day2.windSpeed" using `list[0].wind.speed` (which should have been day1's
// field), immediately followed by a second assignment also named "weatherNext5Days.day2.windSpeed"
// using `list[2].wind.speed` (the real day2 value) — the second overwrites the first, so day1.windSpeed
// is simply never set. That's reproduced faithfully below; uncomment the marked line to fix it.
function filterOutUnneededData(items) {
  return items.map((item) => {
    const list = item.list || [];
    const weatherAt = (idx) => (list[idx] && list[idx].weather && list[idx].weather[0]) || {};
    const mainAt = (idx) => (list[idx] && list[idx].main) || {};
    const windAt = (idx) => (list[idx] && list[idx].wind) || {};
    const dateAt = (idx) => (list[idx] ? list[idx].dt_txt : undefined);
    const tempAt = (idx) => (mainAt(idx).temp !== undefined ? String(mainAt(idx).temp) : undefined);
    const windSpeedAt = (idx) => (windAt(idx).speed !== undefined ? String(windAt(idx).speed) : undefined);

    return {
      birdName: item.comName,
      speciesCode: item.speciesCode,
      obsDt: item.obsDt,
      howMany: Number(item.howMany),
      locName: item.locName,
      locId: item.locId,
      subId: item.subId,
      userDisplayName: item.userDisplayName,
      cityName: item.city ? item.city.name : undefined,
      drivingTimeMinutes: item.duration,
      distanceMiles: item.distance,
      weatherNext5Days: {
        day1: {
          date: dateAt(0),
          description: weatherAt(0).description,
          temperature: tempAt(0),
          // windSpeed: windSpeedAt(0), // uncomment to fix the original workflow's missing day1 windSpeed
        },
        day2: {
          date: dateAt(2),
          description: weatherAt(2).description,
          temperature: tempAt(2),
          windSpeed: windSpeedAt(2),
        },
        day3: {
          date: dateAt(4),
          description: weatherAt(4).description,
          temperature: tempAt(4),
          windSpeed: windSpeedAt(4),
        },
        day4: {
          date: dateAt(6),
          description: weatherAt(6).description,
          temperature: tempAt(6),
          windSpeed: windSpeedAt(6),
        },
        day5: {
          date: dateAt(8),
          description: weatherAt(8).description,
          temperature: tempAt(8),
          windSpeed: windSpeedAt(8),
        },
      },
    };
  });
}

module.exports = { filterOutUnneededData };
