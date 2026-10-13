// Equivalent of n8n node: "Format as HTML" (n8n-nodes-base.code)
// Near-verbatim port of the original Code node: renders the aggregated report into a styled
// HTML email body.
function formatAsHtml(items) {
  const styles = {
    body: "font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f0f2f5; color: #333; margin: 0; padding: 40px; line-height: 1.6;",
    container: 'max-width: 1000px; margin: 0 auto; background: #fff; padding: 50px; border-radius: 12px; box-shadow: 0 5px 20px rgba(0,0,0,0.08);',

    headerDiv: 'text-align: center; margin-bottom: 50px; border-bottom: 2px solid #f0f2f5; padding-bottom: 20px;',
    headerH1: 'color: #1a365d; margin: 0 0 10px 0; font-size: 2.5rem; letter-spacing: -0.5px;',
    headerP: 'color: #718096; font-size: 1.1rem; margin: 0;',

    card: 'border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 30px; overflow: hidden; background: #fff;',
    cardTop: 'background: linear-gradient(135deg, #2c5282 0%, #2b6cb0 100%); color: white; padding: 20px 25px; display: flex; justify-content: space-between; align-items: center;',
    birdName: 'font-size: 1.4rem; font-weight: 700; margin: 0; color: white;',
    dateBadge: 'background: rgba(255,255,255,0.2); padding: 5px 12px; border-radius: 20px; font-size: 0.9rem; font-weight: 500; color: white;',
    cardContent: 'padding: 25px;',

    locBanner: 'display: flex; align-items: center; color: #4a5568; font-weight: 600; margin-bottom: 20px; font-size: 1.05rem;',
    locIcon: 'margin-right: 8px; color: #e53e3e;',
    locCity: 'font-weight:400; color:#a0aec0; margin-left:8px;',

    metricsGrid: 'display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 25px;',
    metricBox: 'background: #f7fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #4299e1; flex: 1 1 150px; min-width: 150px; margin: 5px;',
    metricLabel: 'font-size: 0.75rem; text-transform: uppercase; color: #718096; letter-spacing: 0.5px; display: block; margin-bottom: 5px;',
    metricValue: 'font-size: 1.1rem; font-weight: 700; color: #2d3748;',

    sectionLabel: 'font-size: 0.85rem; font-weight: 700; color: #a0aec0; text-transform: uppercase; margin-bottom: 10px; display: block;',

    observerTag: 'display: inline-block; background: #ebf8ff; color: #2b6cb0; padding: 4px 12px; border-radius: 15px; font-size: 0.9rem; margin-right: 8px; margin-bottom: 8px; border: 1px solid #bee3f8; text-decoration: none;',

    weatherSection: 'background: #fffaf0; border: 1px solid #feebc8; border-radius: 8px; padding: 15px;',
    weatherGrid: 'display: flex; justify-content: space-between; gap: 10px; margin-top: 10px; text-align: center; overflow-x: auto;',
    weatherDay: 'background: white; padding: 10px 5px; border-radius: 6px; border: 1px solid #edf2f7; flex: 1; min-width: 60px;',
    wDate: 'font-size: 0.75rem; color: #718096; display: block; margin-bottom: 5px;',
    wDesc: 'font-size: 0.8rem; font-weight: 600; color: #2d3748; display: block; margin-bottom: 5px; height: 35px; line-height: 1.2; display: flex; align-items: center; justify-content: center;',
    wTemp: 'font-size: 0.95rem; font-weight: 800; color: #dd6b20;',
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  let htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bird Sighting Report</title>
</head>
<body style="${styles.body}">
  <div style="${styles.container}">
    <div style="${styles.headerDiv}">
      <h1 style="${styles.headerH1}">Bird Sighting Analysis Report</h1>
      <p style="${styles.headerP}">Generated on ${today}</p>
    </div>
`;

  for (const data of items) {
    let weatherHtml = `<div style="${styles.weatherGrid}">`;
    if (data.weatherNext5Days) {
      const weatherDays = Object.values(data.weatherNext5Days).slice(0, 5);
      weatherDays.forEach((day, index) => {
        let wDate = `Day ${index + 1}`;
        if (day.date) {
          const d = new Date(day.date);
          if (!isNaN(d)) {
            wDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }
        }
        weatherHtml += `
            <div style="${styles.weatherDay}">
                <span style="${styles.wDate}">${wDate}</span>
                <span style="${styles.wDesc}">${day.description || 'N/A'}</span>
                <span style="${styles.wTemp}">${Math.round(parseFloat(day.temperature) || 0)}°F</span>
            </div>`;
      });
    } else {
      weatherHtml += '<div style="width: 100%; text-align:center; color:#a0aec0;">No weather data available</div>';
    }
    weatherHtml += '</div>';

    let observersHtml = '';
    if (data.sightings && Array.isArray(data.sightings)) {
      observersHtml = data.sightings
        .map((s) => `<a href="${s.url}" target="_blank" style="${styles.observerTag}" title="View Checklist">${s.name}</a>`)
        .join('');
    } else if (data.observers && Array.isArray(data.observers)) {
      observersHtml = data.observers
        .map((name, index) => {
          const url = data.checklistUrls && data.checklistUrls[index] ? data.checklistUrls[index] : '#';
          return `<a href="${url}" target="_blank" style="${styles.observerTag}" title="View Checklist">${name}</a>`;
        })
        .join('');
    }

    htmlContent += `
    <div style="${styles.card}">
      <div style="${styles.cardTop}">
        <h2 style="${styles.birdName}">${data.birdName}</h2>
        <span style="${styles.dateBadge}">${data.date}</span>
      </div>

      <div style="${styles.cardContent}">
        <div style="${styles.locBanner}">
          <span style="${styles.locIcon}">📍</span>
          ${data.location} <span style="${styles.locCity}">(${data.cityName})</span>
        </div>

        <div style="${styles.metricsGrid}">
          <div style="${styles.metricBox}">
            <span style="${styles.metricLabel}">Max Count</span>
            <span style="${styles.metricValue}">${data.maxCount}</span>
          </div>
          <div style="${styles.metricBox}">
            <span style="${styles.metricLabel}">Observers</span>
            <span style="${styles.metricValue}">${data.observerCount}</span>
          </div>
          <div style="${styles.metricBox}">
            <span style="${styles.metricLabel}">Distance</span>
            <span style="${styles.metricValue}">${data.distanceMiles ? data.distanceMiles.toFixed(1) : '0'} mi</span>
          </div>
          <div style="${styles.metricBox}">
            <span style="${styles.metricLabel}">Drive Time</span>
            <span style="${styles.metricValue}">${data.drivingTimeMinutes ? Math.round(data.drivingTimeMinutes) : '0'} min</span>
          </div>
        </div>

        <div style="margin-bottom: 25px;">
          <span style="${styles.sectionLabel}">Observed By (Click name for checklist)</span>
          ${observersHtml}
        </div>

        <div style="${styles.weatherSection}">
          <span style="${styles.sectionLabel} color:#dd6b20;">5-Day Forecast</span>
          ${weatherHtml}
        </div>
      </div>
    </div>
    `;
  }

  htmlContent += `
  </div>
</body>
</html>
`;

  return { html: htmlContent };
}

module.exports = { formatAsHtml };
