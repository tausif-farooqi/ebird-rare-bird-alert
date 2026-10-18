// Not part of the original n8n workflow: saves the aggregated report (the JSON the HTML email is
// built from) to json_output/ebird-report-<timestamp>.json for later reference.
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'json_output');

// Local time as YYYY-MM-DD_HH-mm-ss (no colons, so it's a valid Windows filename).
function timestamp(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}_` +
    `${p(date.getHours())}-${p(date.getMinutes())}-${p(date.getSeconds())}`
  );
}

function saveJsonReport(report) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const filePath = path.join(OUTPUT_DIR, `ebird-report-${timestamp()}.json`);
  fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
  return filePath;
}

module.exports = { saveJsonReport };
