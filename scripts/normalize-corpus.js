#!/usr/bin/env node
/* One-shot mechanical Hinglish normalization. Run from repo root:
 *   node scripts/mormalize-corpus.js
 * Idempotent.
 */
const fs = require('fs');
const path = require('path');

const TARGETS = [
  'src/data/conversationCorpus.ts',
  'src/services/chatEngine.ts',
  'src/services/personaEngine.ts',
];

const REPLACEMENTS = [
  // Clean up $1 replacement artifacts from previous run
  [/\bmain \$1\b/g, 'main bhi'],
  // Double-space comma separators
  [/ , /g, ', '],
  [/,[ ]{2,}/g, ', '],
  [/[ ]{2,}, /g, ', '],
];

let totalEdited = 0;
for (const f of TARGETS) {
  const p = path.resolve(f);
  if (!fs.existsSync(p)) continue;
  let s = fs.readFileSync(p, 'utf8');
  let count = 0;
  for (const [re, r] of REPLACEMENTS) {
    s = s.replace(re, (m) => { count++; return typeof r === 'function' ? r(m) : r; });
  }
  if (count > 0) {
    fs.writeFileSync(p, s, 'utf8');
    console.log(`${f}: ${count} replacements`);
    totalEdited += count;
  }
}
console.log(`done — ${totalEdited} total replacements`);
