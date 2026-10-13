// Equivalent of n8n node: "Keep Weather Data From 6 am to 12 pm" (n8n-nodes-base.code)
// Near-verbatim port of the original Code node's jsCode: for each forecast response,
// keeps only the 3-hour forecast entries that land at 06:00 or 09:00.
function keepWeatherData6to9(weatherResponses) {
  weatherResponses.forEach((weather) => {
    const filteredList = weather.list.filter((item) => {
      if (item && item.dt_txt) {
        return item.dt_txt.endsWith('06:00:00') || item.dt_txt.endsWith('09:00:00');
      }
      return false;
    });

    weather.list = filteredList;
  });

  return weatherResponses;
}

module.exports = { keepWeatherData6to9 };
