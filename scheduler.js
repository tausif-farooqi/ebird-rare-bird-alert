// In-process scheduler, run with `node scheduler.js`. Replicates the n8n "Schedule Trigger"
// node's weekly rule (Thursdays at 7:00 PM) using node-cron. Keep this process running for the
// schedule to fire; see README.md for OS-level alternatives (cron / Task Scheduler) that don't
// require a long-running Node process.
require('dotenv').config();

const cron = require('node-cron');
const { runWorkflow } = require('./main');
const { CRON_EXPRESSION } = require('./nodes/triggerSchedule');

const timezone = process.env.CRON_TIMEZONE || undefined;

console.log(
  `Scheduling eBird workflow with cron expression "${CRON_EXPRESSION}" (weekly, Thursday 7:00 PM${
    timezone ? `, ${timezone}` : ', system local time'
  })`
);

cron.schedule(
  CRON_EXPRESSION,
  () => {
    console.log(`[${new Date().toISOString()}] Running scheduled eBird workflow...`);
    runWorkflow().catch((err) => console.error('Scheduled run failed:', err));
  },
  timezone ? { timezone } : undefined
);

console.log('Scheduler started. Press Ctrl+C to stop.');
