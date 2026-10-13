// Equivalent of n8n node: "Schedule Trigger" (n8n-nodes-base.scheduleTrigger)
// Original rule: { interval: [{ field: 'weeks', triggerAtDay: [4], triggerAtHour: 19 }] }
// n8n day numbering is 0=Sunday..6=Saturday, matching cron's day-of-week field, so
// triggerAtDay: [4] (Thursday) at hour 19 (7:00 PM) becomes the cron expression below.
const CRON_EXPRESSION = '0 19 * * 4';

function triggerSchedule() {
  return [{}];
}

module.exports = { CRON_EXPRESSION, triggerSchedule };
