#!/usr/bin/env node
/* Dedupe obviously duplicate strings inside each pool.
 * Skips slots that are unique by design.
 */
const fs = require('fs');
const path = require('path');
const f = 'src/data/conversationCorpus.ts';
const s = fs.readFileSync(f, 'utf8');

// Strip TS-typing structure to get just the POOLS object literal content
// Use a simple line-by-line approach: scan inside any `[` ... `],` block
// tracking pool-arch entries, dedupe identical-looking strings.
// Conservative: only deletes the SECOND occurrence of any duplicate at the
// SAME indentation depth, leaving the first intact.

const lines = s.split('\n');
const seenByIndent = new Map();
const deletions = new Set();
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const m = line.match(/^(\s*)"(.+)"\s*,?\s*$/);
  if (!m) continue;
  const indent = m[1].length;
  if (indent < 6) continue; // skip header lines
  const content = m[2];
  const key = indent + '|' + content;
  if (seenByIndent.has(key)) {
    deletions.add(i);
  } else {
    seenByIndent.set(key, i);
  }
}
if (deletions.size > 0) {
  const filtered = lines.filter((_, i) => !deletions.has(i));
  fs.writeFileSync(f, filtered.join('\n'), 'utf8');
  console.log(`${f}: removed ${deletions.size} duplicate strings`);
} else {
  console.log(`${f}: no exact duplicates found`);
}
