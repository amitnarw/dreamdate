#!/usr/bin/env node
/* Permanent corpus-quality guard. Catches banned phrases / patterns that
 * have slipped in before (mojibake-ish emoji, gibberish, double-comma) so
 * the same kind of "barely makes sense" regressions can't happen again.
 *
 * Run from repo root:
 *   node scripts/check-corpus.js
 * Exits 0 on clean, 1 on violations (with line numbers).
 */
const fs = require('fs');
const path = require('path');

const TARGETS = [
  'src/data/conversationCorpus.ts',
  'src/data/mockProfiles.ts',
  'src/services/chatEngine.ts',
  'src/services/personaEngine.ts',
];

// Banned patterns paired with a brief rationale. Each rule is a RegExp
// matching IN-STRING content (between quotes), not the surrounding code.
const RULES = [
  { name: 'mojibake_emoji_artifact',
    pattern: /\bdY~?[\\^<]?\b|\bdYT\b/,
    note: 'mojibake emoji tokens (dY~o / dYT^ / ) — use real Unicode emoji' },
  { name: 'double_space_separator',
    pattern: / ,  +/,
    note: 'double-space comma separator (use ", ")' },
  { name: 'trailing_double_space',
    pattern: /  +(?:[,!.?])/,
    note: 'trailing double-space before punctuation (use single space)' },
  { name: 'mza_lazy_textese',
    pattern: /\bmzaa?\b/,
    note: 'truncated "maza" (looks like a typo; use "maza")' },
  { name: 'invented_handi',
    pattern: /\bhandi karungi\b/,
    note: '"handi karungi" is not real Hindi — pick a believable phrase' },
  { name: 'overused_ram_ram_flirt',
    // Allow "ram ram" only as a standalone greeting line (e.g. openers
    // / casual salutation) — not in flirty / spicy response pools.
    pattern: /ram ram/i,
    note: '"ram ram" as a flirty interjection reads awkward — replace naturally',
    allowContexts: [
      /openers?\b|funny\s*\+|mysterious_sensual|bold_alluring|playful_tease|sweet_romantic/,
    ] },
  { name: 'entry_mar_gone',
    pattern: /entry maar|entry ke phekad|dumdaar entry|tumhari entry|har baar entry|mama entry/,
    note: 'invented "entry" phrases — sound like made-up slang' },
  { name: 'nonsense_so_cho',
    pattern: /so cho|nonsense seedha|mano sawaal|mano choice|mano jawab/,
    note: 'nonsense phrase — pick natural Hinglish' },
  { name: 'opposite_meaning_line',
    pattern: /mood (achha|kharab) hi ho jata hai|samajh gaya samajh nahi/,
    note: 'double-negative / opposite-meaning phrasing' },
  { name: 'suarwy_typo',
    pattern: /suarwy|suarvy|suarv/,
    note: 'garbled profile word — fix the spelling' },
  { name: 'tayyaar_taiyaar',
    pattern: /\b(tayyaar|taiyaar)\b/,
    note: 'over-transliterated "ready" — girls type "ready", not "tayyaar"' },
  { name: 'formal_puni_English',
    // "is channel" in profile / bio is fine; in chat replies it reads robotic
    // but we apply only to small fragments. Conservative — emit a warning, not error.
    pattern: /\bpuni\s+english\b|\baapki ceepty\b/i,
    note: 'unnatural English-Hindi mix' },
];

function scanStringLiterals(content, filename) {
  // Match string literals that may contain apostrophes/double quotes. Mostly
  // we look at double-quoted strings and single-quoted strings on profile lines.
  const violations = [];
  const stringRegex = /"([^"]*)"|'([^']*)'/g;
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let lm;
    while ((lm = stringRegex.exec(lines[i])) !== null) {
      const s = lm[1] !== undefined ? lm[1] : lm[2];
      if (!s || s.length === 0) continue;
      for (const r of RULES) {
        if (r.pattern.test(s)) {
          // Check context allows
          if (r.allowContexts) {
            const ctx = lines.slice(Math.max(0, i - 6), i + 1).join('\n');
            if (r.allowContexts.some((re) => re.test(ctx))) continue;
          }
          violations.push({
            file: filename,
            line: i + 1,
            col: lm.index + 1,
            rule: r.name,
            preview: s.slice(0, 60) + (s.length > 60 ? '…' : ''),
            note: r.note,
          });
        }
      }
    }
  }
  return violations;
}

function main() {
  const allViolations = [];
  for (const t of TARGETS) {
    const p = path.resolve(t);
    if (!fs.existsSync(p)) continue;
    const content = fs.readFileSync(p, 'utf8');
    const v = scanStringLiterals(content, t);
    if (v.length) allViolations.push(...v);
  }
  if (!allViolations.length) {
    console.log('[check-corpus] OK — all targets clean');
    process.exit(0);
  }
  console.error(`[check-corpus] ${allViolations.length} violations:`);
  for (const v of allViolations) {
    console.error(
      `  ${v.file}:${v.line}  [${v.rule}]\n    ${v.preview}\n    → ${v.note}`,
    );
  }
  process.exit(1);
}

if (require.main === module) main();
