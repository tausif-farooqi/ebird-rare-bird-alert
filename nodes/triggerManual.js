// Equivalent of n8n node: "When clicking 'Execute workflow'" (n8n-nodes-base.manualTrigger)
// A manual trigger does no work itself — it just emits a single empty item that starts
// the workflow. Kept as its own module so the on-demand entry point mirrors the original graph.
function triggerManual() {
  return [{}];
}

module.exports = { triggerManual };
