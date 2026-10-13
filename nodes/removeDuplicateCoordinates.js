// Equivalent of n8n node: "Remove Duplicate Coordinates" (n8n-nodes-base.removeDuplicates, v2)
// parameters: { options: {} } — no "compare" field was set, so this uses the node's default
// "allFields" comparison: two items are duplicates only if every field matches exactly
// (here, both lat and lng).
function removeDuplicateCoordinates(items) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const key = JSON.stringify(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }

  return result;
}

module.exports = { removeDuplicateCoordinates };
