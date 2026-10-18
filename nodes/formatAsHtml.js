// Originally a near-verbatim port of the n8n "Format as HTML" Code node. Now renders the nested
// report from aggregateJsonReport as a compact, modern email: an "at a glance" index, then one
// section per species with a card per location (distance, dates/observers, one-line forecast).
//
// All styles are inline (from the S map below) because Gmail ignores <body> styles and drops
// <style> blocks in several situations (Gmail app with non-Gmail accounts, forwards, any CSS it
// can't parse). The page background lives on a full-width wrapper table for the same reason.
const NEW_WITHIN_DAYS = 1; // seen today or yesterday counts as "new"

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";
const C = {
  page: '#f3f4f6', card: '#ffffff', ink: '#1f2937', muted: '#6b7280', faint: '#9ca3af',
  line: '#e5e7eb', accent: '#0f766e', accentSoft: '#e6f4f1', newBg: '#fef3c7', newInk: '#92400e',
};

const S = {
  outer: `background:${C.page};`,
  outerCell: `padding:32px 14px;font-family:${FONT};color:${C.ink};font-size:16px;line-height:1.5;`,
  wrap: 'max-width:820px;margin:0 auto;',
  eyebrow: `font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:${C.accent};`,
  h1: `margin:6px 0 14px;font-size:30px;line-height:1.2;font-weight:800;color:${C.ink};`,
  stat: `display:inline-block;margin:0 18px 6px 0;color:${C.muted};`,
  statNum: `font-size:22px;font-weight:700;color:${C.ink};`,
  panel: `background:${C.card};border-radius:14px;padding:20px 22px 10px;margin:28px 0 36px;`,
  label: `font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:${C.faint};padding-bottom:10px;`,
  th: `padding:0 0 8px 12px;font-size:12px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;color:${C.faint};`,
  td: `padding:9px 0 9px 12px;border-top:1px solid ${C.line};color:${C.muted};white-space:nowrap;`,
  tdName: `padding:9px 0;border-top:1px solid ${C.line};`,
  idxLink: `color:${C.ink};font-weight:500;text-decoration:none;`,
  pill: `display:inline-block;background:${C.accentSoft};color:${C.accent};font-size:12px;font-weight:600;line-height:1;padding:5px 9px;border-radius:999px;white-space:nowrap;`,
  newTag: `display:inline-block;background:${C.newBg};color:${C.newInk};font-size:11px;font-weight:600;line-height:1;padding:4px 8px;border-radius:999px;margin-left:8px;vertical-align:middle;`,
  species: 'margin-bottom:36px;',
  spName: `font-size:21px;font-weight:700;color:${C.ink};`,
  sub: `font-size:14px;color:${C.muted};margin-top:2px;`,
  card: `background:${C.card};border:1px solid ${C.line};border-radius:14px;padding:16px 18px;margin:0 0 12px;`,
  loc: `color:${C.ink};font-weight:600;font-size:16px;text-decoration:none;`,
  dateCell: 'padding:8px 0;vertical-align:top;white-space:nowrap;width:110px;',
  countCell: `padding:8px 10px;vertical-align:top;white-space:nowrap;width:44px;color:${C.muted};`,
  obsCell: 'padding:8px 0;vertical-align:top;',
  obsLink: `color:${C.accent};text-decoration:none;`,
  wx: `font-size:14px;margin-top:8px;padding-top:10px;border-top:1px dashed ${C.line};`,
  wxDay: 'display:inline-block;margin-right:14px;white-space:nowrap;',
  wxName: `color:${C.faint};`,
};

const esc = (s) =>
  String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const hasNumber = (v) => typeof v === 'number' && Number.isFinite(v);
const miles = (v) => (hasNumber(v) ? `${v.toFixed(1)} mi` : '—');
const minutes = (v) => (hasNumber(v) ? `${Math.round(v)} min` : '—');
const TABLE = 'role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"';

// "2026-10-15" or "2026-10-15 06:00:00" -> local Date, so the day doesn't shift with UTC offset.
function parseDay(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || '');
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}
const fmt = (d, opts) => (d ? d.toLocaleDateString('en-US', opts) : '?');
const shortDate = (s) => fmt(parseDay(s), { month: 'short', day: 'numeric' });

function isNew(dateStr) {
  const d = parseDay(dateStr);
  if (!d) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((today - d) / 86400000) <= NEW_WITHIN_DAYS;
}
const NEW_TAG = `<span style="${S.newTag}">New</span>`;

function weatherIcon(desc = '') {
  const d = desc.toLowerCase();
  if (d.includes('thunder')) return '⛈️';
  if (d.includes('snow')) return '❄️';
  if (d.includes('drizzle')) return '🌦️';
  if (d.includes('rain')) return '🌧️';
  if (/mist|fog|haze|smoke/.test(d)) return '🌫️';
  if (d.includes('clear')) return '☀️';
  if (d.includes('few clouds')) return '🌤️';
  if (d.includes('scattered')) return '⛅';
  if (d.includes('cloud')) return '☁️';
  return '';
}

// Gmail doesn't support in-email (#anchor) links, so index names open the eBird species page.
const speciesLink = (s) =>
  s.speciesCode
    ? `<a href="https://ebird.org/species/${esc(s.speciesCode)}" target="_blank" style="${S.idxLink}">${esc(s.birdName)}</a>`
    : `<span style="${S.idxLink}">${esc(s.birdName)}</span>`;

function renderIndex(items) {
  const rows = items
    .map(
      (s) =>
        `<tr><td style="${S.tdName}">${speciesLink(s)}${isNew(s.lastSeenDate) ? NEW_TAG : ''}</td>` +
        `<td align="right" style="${S.td}">${miles(s.nearestDistanceMiles)}</td>` +
        `<td align="right" style="${S.td}">${shortDate(s.lastSeenDate)}</td>` +
        `<td align="right" style="${S.td}">${s.locationCount}</td></tr>`
    )
    .join('\n');

  return `<div style="${S.panel}"><div style="${S.label}">At a glance</div>
<table ${TABLE}>
<tr><th align="left" style="${S.th}padding-left:0;">Species</th><th align="right" style="${S.th}">Nearest</th><th align="right" style="${S.th}">Last seen</th><th align="right" style="${S.th}">Locs</th></tr>
${rows}
</table></div>`;
}

function renderForecast(weather) {
  if (!weather) return `<span style="color:${C.faint};">No forecast available</span>`;
  return Object.values(weather)
    .slice(0, 5)
    .map((day) => {
      const t = parseFloat(day.temperature);
      return `<span style="${S.wxDay}"><span style="${S.wxName}">${fmt(parseDay(day.date), { weekday: 'short' })}</span> ${weatherIcon(day.description)} ${Number.isFinite(t) ? `${Math.round(t)}°` : '—'}</span>`;
    })
    .join('');
}

function renderDateRow(d, i) {
  const fresh = isNew(d.date);
  const border = i === 0 ? '' : `border-top:1px solid ${C.line};`;
  const observers = d.sightings.map((s) => `<a href="${esc(s.url)}" style="${S.obsLink}">${esc(s.name)}</a>`).join(', ');
  return (
    `<tr><td style="${S.dateCell}${border}font-weight:${fresh ? 700 : 500};">${fmt(parseDay(d.date), { weekday: 'short', month: 'short', day: 'numeric' })}</td>` +
    `<td style="${S.countCell}${border}">×${d.maxCount}</td>` +
    `<td style="${S.obsCell}${border}">${observers}${fresh ? NEW_TAG : ''}</td></tr>`
  );
}

function renderLocation(loc) {
  return `<div style="${S.card}">
<table ${TABLE}><tr>
<td valign="top"><a href="https://ebird.org/hotspot/${esc(loc.locId)}" style="${S.loc}">${esc(loc.location)}</a><div style="${S.sub}">${esc(loc.cityName || '')}</div></td>
<td valign="top" align="right" style="padding-left:12px;"><span style="${S.pill}">${miles(loc.distanceMiles)} · ${minutes(loc.drivingTimeMinutes)}</span></td>
</tr></table>
<table ${TABLE.replace('style="', 'style="margin-top:10px;font-size:15px;')}>
${loc.dates.map(renderDateRow).join('\n')}
</table>
<div style="${S.wx}">${renderForecast(loc.weatherNext5Days)}</div>
</div>`;
}

function renderSpecies(s) {
  const summary = `${s.locationCount} location${s.locationCount === 1 ? '' : 's'} · nearest ${miles(s.nearestDistanceMiles)} · last seen ${shortDate(s.lastSeenDate)}`;
  return `<div style="${S.species}">
<table ${TABLE.replace('style="', 'style="margin-bottom:12px;')}><tr>
<td><div style="${S.spName}">${esc(s.birdName)}${isNew(s.lastSeenDate) ? NEW_TAG : ''}</div><div style="${S.sub}">${summary}</div></td>
</tr></table>
${s.locations.map(renderLocation).join('\n')}
</div>`;
}

function formatAsHtml(items) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const locCount = new Set(items.flatMap((s) => s.locations.map((l) => l.locId))).size;
  const newCount = items.filter((s) => isNew(s.lastSeenDate)).length;
  const stat = (n, text) => `<span style="${S.stat}"><span style="${S.statNum}">${n}</span> ${text}</span>`;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rare Bird Report</title>
</head>
<body style="margin:0;padding:0;background:${C.page};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.page}" style="${S.outer}"><tr><td style="${S.outerCell}">
<div style="${S.wrap}">
<div style="${S.eyebrow}">Notable sightings · ${today}</div>
<h1 style="${S.h1}">Rare Bird Report</h1>
${stat(items.length, 'species')}${stat(locCount, 'locations')}${stat(newCount, 'seen today or yesterday')}
${renderIndex(items)}
${items.map(renderSpecies).join('\n')}
</div>
</td></tr></table>
</body>
</html>`;

  return { html };
}

module.exports = { formatAsHtml };
