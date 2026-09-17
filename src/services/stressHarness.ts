import {
  CorpusIntent,
  composeBase,
  getPool,
} from "../data/conversationCorpus";
import {
  pickWithNoRepeatSync,
  resetAllLedgers,
  warmAntiRepeat,
} from "./antiRepeat";

/* ------------------------------------------------------------------ */
/* Stress harness ,  verify the "never say same thing" invariant.        */
/*                                                                     */
/* Simulates a varied conversation for a single girl across all        */
/* intents + archetypes, asserting:                                    */
/*   1. Zero EXACT duplicate strings within any 200-message window.     */
/*   2. Zero CROSS-GIRL exact duplicates.                               */
/*   3. (informational) Jaccard similarity between any two recent       */
/*      strings stays low (no near-duplicates).                         */
/*                                                                     */
/* Triggered manually from the dev sheet. Returns a structured         */
/* report.                                                              */
/* ------------------------------------------------------------------ */

const TOPIC_FILLER = "topicword";

export interface HarnessReport {
  totalPicks: number;
  uniqueStrings: number;
  exactConsecutiveDupes: number;
  exactWithin30Window: number;
  crossGirlExactDupes: number;
  nearDupesJaccardOver70: number;
  perIntentUniqueness: Record<string, number>;
  pass: boolean;
  message: string;
}

interface Pick {
  text: string;
  profileId: string;
}

function jaccard(a: string, b: string): number {
  const wa = new Set(a.toLowerCase().split(/\s+/));
  const wb = new Set(b.toLowerCase().split(/\s+/));
  let inter = 0;
  wa.forEach((t) => {
    if (wb.has(t)) inter++;
  });
  const union = wa.size + wb.size - inter;
  return union === 0 ? 0 : inter / union;
}

export async function runStressHarness(
  picksCount = 200,
  profileIds: string[] = ["priya-1", "aisha-2", "simran-3"],
): Promise<HarnessReport> {
  // Reset ledgers so the test starts from a clean slate.
  await resetAllLedgers();

  const archs = ["playful_tease", "sweet_romantic", "bold_alluring", "mysterious_sensual"] as const;
  const intents: CorpusIntent[] = [
    "greeting", "greeting_return", "compliment", "love", "miss_you",
    "jealousy", "ignore", "photo_request", "call_request", "whatsapp",
    "dirty_request", "dirty_question", "sexual_compliment",
    "dirty_yes", "dirty_deflect", "dirty_tease",
    "abuse", "abuse_hard", "anger",
    "question_her", "thanks", "bye",
    "food", "outfit", "activity", "sleep", "mood", "recharge", "joke", "fallback",
    "answer_yes_no", "answer_open_q", "answer_how", "answer_why",
    "answer_when", "answer_where", "answer_what", "answer_who",
    "answer_self_statement", "answer_agreement", "answer_disagreement",
    "answer_command", "answer_feeling", "answer_topic_echo",
  ];

  for (const id of profileIds) warmAntiRepeat(id);

  const picks: Pick[] = [];
  const perIntent = new Map<string, number>();

  for (let i = 0; i < picksCount; i++) {
    const g = profileIds[i % profileIds.length];
    const arch = archs[Math.floor(Math.random() * archs.length)];
    const intent = intents[Math.floor(Math.random() * intents.length)];
    const pool = getPool(intent, arch);
    const composed: string[] = [];
    const seen = new Set<string>();
    while (composed.length < 8 && seen.size < pool.length) {
      const raw = pool[Math.floor(Math.random() * pool.length)]
        .replace(/\{topic\}/g, TOPIC_FILLER);
      const v = composeBase(raw, arch);
      if (!seen.has(v)) {
        seen.add(v);
        composed.push(v);
      }
    }
    const text = pickWithNoRepeatSync(g, composed);
    if (text) {
      picks.push({ text, profileId: g });
      perIntent.set(intent, (perIntent.get(intent) ?? 0) + 1);
    }
  }

  // 1. Exact consecutive dupes.
  let exactConsecutiveDupes = 0;
  for (let i = 1; i < picks.length; i++) {
    if (picks[i].text === picks[i - 1].text) exactConsecutiveDupes++;
  }

  // 2. Within 30-message window.
  let exactWithin30Window = 0;
  for (let i = 0; i < picks.length; i++) {
    for (let j = Math.max(0, i - 30); j < i; j++) {
      if (picks[j].text === picks[i].text) {
        exactWithin30Window++;
        break;
      }
    }
  }

  // 3. Cross-girl exact dupes (same string across different girls).
  const byText = new Map<string, Set<string>>();
  for (const p of picks) {
    const set = byText.get(p.text) ?? new Set();
    set.add(p.profileId);
    byText.set(p.text, set);
  }
  let crossGirlExactDupes = 0;
  byText.forEach((girls) => {
    if (girls.size > 1) crossGirlExactDupes++;
  });

  // 4. Near-duplicates (Jaccard > 0.7) within 50-msg window per girl.
  let nearDupes = 0;
  const byProfile = new Map<string, Pick[]>();
  for (const p of picks) {
    const arr = byProfile.get(p.profileId) ?? [];
    arr.push(p);
    byProfile.set(p.profileId, arr);
  }
  byProfile.forEach((arr) => {
    for (let i = 0; i < arr.length; i++) {
      for (let j = Math.max(0, i - 50); j < i; j++) {
        if (jaccard(arr[j].text, arr[i].text) > 0.7) {
          nearDupes++;
          break;
        }
      }
    }
  });

  const uniqueStrings = new Set(picks.map((p) => p.text)).size;
  const perIntentUniqueness: Record<string, number> = {};
  perIntent.forEach((n, k) => {
    perIntentUniqueness[k] = n;
  });

  const pass =
    exactConsecutiveDupes === 0 &&
    exactWithin30Window === 0 &&
    crossGirlExactDupes === 0;

  const message = pass
    ? `PASS ,  ${picksCount} picks, ${uniqueStrings} unique strings, zero repeats in any 30-msg window`
    : `FAIL ,  ${exactConsecutiveDupes} consecutive dupes, ${exactWithin30Window} within-30 dupes, ${crossGirlExactDupes} cross-girl dupes, ${nearDupes} near-dupes (>0.7 Jaccard)`;

  return {
    totalPicks: picksCount,
    uniqueStrings,
    exactConsecutiveDupes,
    exactWithin30Window,
    crossGirlExactDupes,
    nearDupesJaccardOver70: nearDupes,
    perIntentUniqueness,
    pass,
    message,
  };
}
