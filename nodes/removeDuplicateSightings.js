// Equivalent of n8n node: "Remove Duplicate Sightings" (n8n-nodes-base.removeDuplicates, v2)
// parameters: { compare: "selectedFields", fieldsToCompare: "speciesCode, userDisplayName, locId, obsDt, subId" }
// No "operation" was set, so this uses the node's default operation (dedupe within the
// current input list by the selected fields, keeping the first occurrence of each key) —
// not the cross-execution "seen in previous executions" mode, which requires extra config
// that isn't present in the source workflow.
const FIELDS_TO_COMPARE = ['speciesCode', 'userDisplayName', 'locId', 'obsDt', 'subId'];

function removeDuplicateSightings(sightings) {
  const seen = new Set();
  const result = [];

  for (const item of sightings) {
    const key = FIELDS_TO_COMPARE.map((field) => String(item[field])).join('|');
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }

  return result;
}

module.exports = { removeDuplicateSightings };
