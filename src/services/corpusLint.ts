/* Lightweight in-RN corpus lint. Scans every string pulled from
 * `getPool(intent, arch)` for banned phrases / patterns that have caused
 * "barely makes sense" regressions. Runs from the dev sheet (passcode 2760).
 * The fully comprehensive lint (with line numbers + full file scan) lives at
 * `scripts/check-corpus.js` and runs as `node scripts/check-corpus.js` on
 * the dev machine.
 */
import { getPool, CorpusIntent } from "../data/conversationCorpus";
import type { CharacterArchetype } from "../data/mockProfiles";

export interface LintViolation {
  rule: string;
  note: string;
  intent: CorpusIntent | "atom";
  arch: CharacterArchetype;
  preview: string;
}

const RULES: { name: string; pattern: RegExp; note: string }[] = [
  { name: "mza_lazy_textese", pattern: /\bmzaa?\b/, note: "use 'maza' (mza looks like a typo)" },
  { name: "invented_handi", pattern: /\bhandi karungi\b/, note: "invented phrase — not real Hindi" },
  { name: "ram_ram_flirt", pattern: /\bram ram\b/i, note: "ram ram reads awkward as flirty interjection" },
  { name: "entry_mar_gone", pattern: /entry maar|entry ke phekad|dumdaar entry|tumhari entry|har baar entry/, note: "made-up 'entry' phrases" },
  { name: "nonsense_so_cho", pattern: /so cho|mano sawaal|mano choice|mano jawab/, note: "nonsense phrase" },
  { name: "opposite_meaning_line", pattern: /mood (achha|kharab) hi ho jata hai/, note: "double-negative / opposite-meaning phrasing" },
  { name: "suarwy_typo", pattern: /suarwy|suarvy|suarv/, note: "garbled word" },
  { name: "tayyaar_taiyaar", pattern: /\b(tayyaar|taiyaar)\b/, note: "girls type 'ready', not 'tayyaar'" },
];

const ALL_INTENTS: CorpusIntent[] = [
  "greeting","greeting_return","compliment","love","miss_you","jealousy","ignore",
  "photo_request","call_request","whatsapp",
  "dirty_request","dirty_question","sexual_compliment","dirty_yes","dirty_deflect","dirty_tease",
  "abuse","abuse_hard","anger","question_her","thanks","bye",
  "food","outfit","activity","sleep","mood","recharge","joke","fallback",
  "answer_yes_no","answer_open_q","answer_how","answer_why","answer_when","answer_where",
  "answer_what","answer_who","answer_self_statement","answer_agreement","answer_disagreement",
  "answer_command","answer_feeling","answer_topic_echo","repeat_notice",
];

const ARCHS: CharacterArchetype[] = ["playful_tease","sweet_romantic","bold_alluring","mysterious_sensual"];

export function runCorpusLint(): LintViolation[] {
  const out: LintViolation[] = [];

  function scanOne(label: CorpusIntent | "atom", arch: CharacterArchetype, pool: string[]) {
    for (const v of pool) {
      for (const r of RULES) {
        if (r.pattern.test(v)) {
          out.push({
            rule: r.name,
            note: r.note,
            intent: label,
            arch,
            preview: v.slice(0, 60) + (v.length > 60 ? "…" : ""),
          });
        }
      }
    }
  }

  for (const intent of ALL_INTENTS) {
    for (const arch of ARCHS) {
      scanOne(intent, arch, getPool(intent, arch));
    }
  }
  return out;
}
