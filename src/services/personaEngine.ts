import AsyncStorage from "@react-native-async-storage/async-storage";
import { CharacterArchetype, Profile } from "../data/mockProfiles";
import {
  CorpusIntent,
  composeBase,
  getPool,
} from "../data/conversationCorpus";
import {
  pickWithNoRepeatSync,
  warmAntiRepeat,
} from "./antiRepeat";
import { deliverLiveMessage, pickLegacyReply, pickNudge } from "./chatEngine";
import { matchIntentNLU, warmNLU } from "./nluService";
import {
  applyImperfection,
  getTodBucket,
  maybeLazyAck,
  maybeTimeFlavor,
} from "./realism";
import { getCoins } from "./wallet";

/* ------------------------------------------------------------------ */
/* Persona engine ,  offline "she's a real person" simulation           */
/*                                                                     */
/* Research basis:                                                     */
/* - ChatScript: gambits (she drives) / rejoinders (reacts to what     */
/*   SHE just said) / responders (reacts to user input)                */
/* - Ink: response variants as sequence / cycle / once / shuffle +     */
/*   per-node seen-counts + read-count conditionals                    */
/* - Dating sims / Mystic Messenger: hidden affection meter gating     */
/*   escalation + scheduled real-time delivery                         */
/* - arXiv 2510.08912: instant uniform replies are the #1 bot tell;    */
/*   hesitation + variability raise perceived humanness                */
/* ------------------------------------------------------------------ */

const MEMORY_PREFIX = "@dreamdate_girl_memory_v1_";

function jitter(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min));
}

/* ------------------------------------------------------------------ */
/* Per-girl behavior config (deterministic per profile, so all 20      */
/* girls behave differently ,  not just different wording)              */
/* ------------------------------------------------------------------ */

export interface PersonaConfig {
  /** Pre-typing silence range (ms). Real humans read first, then type. */
  preMin: number;
  preMax: number;
  /** Probability weights for photo-request outcomes */
  sendPhotoP: number;
  demandFirstP: number;
  shyP: number;
  /** How aggressively she steers toward recharge when wallet is low */
  greed: number;
  /** Probability she actually calls when asked */
  callAcceptP: number;
  /** Longer replies + more bubbles when high */
  chattiness: number;
  /** Chance she "reads but doesn't reply yet" (no typing, late reply) */
  busyP: number;
  /** Spicy photo unlock price for THIS girl (30 / 40 / 50) */
  unlockCost: 30 | 40 | 50;
}

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export function getPersonaConfig(profile: Profile): PersonaConfig {
  const h = hashId(profile.id);
  const r = (n: number) => ((h >> (n * 4)) & 0xf) / 15; // 0..1 deterministic
  const arch = profile.archetype || "playful_tease";

  // Base ranges from hash so every girl differs
  const cfg: PersonaConfig = {
    preMin: 1000 + Math.floor(r(0) * 2500), // 1 - 3.5s
    preMax: 5000 + Math.floor(r(1) * 5000), // 5 - 10s
    sendPhotoP: 0.3 + r(2) * 0.5,
    demandFirstP: 0.1 + r(3) * 0.3,
    shyP: 0.05 + r(4) * 0.25,
    greed: 0.2 + r(5) * 0.6,
    callAcceptP: 0.3 + r(6) * 0.5,
    chattiness: 0.3 + r(7) * 0.7,
    unlockCost: [30, 40, 50][Math.floor(r(0) * 3)] as 30 | 40 | 50,
    busyP: 0.08 + r(2) * 0.06,
  };

  // Archetype modulation (voice already differs; now behavior does too)
  if (arch === "bold_alluring") {
    cfg.sendPhotoP = Math.min(0.9, cfg.sendPhotoP + 0.2);
    cfg.callAcceptP = Math.min(0.9, cfg.callAcceptP + 0.2);
    cfg.shyP = Math.max(0.02, cfg.shyP - 0.1);
  } else if (arch === "mysterious_sensual") {
    cfg.shyP = Math.min(0.45, cfg.shyP + 0.15);
    cfg.preMin += 1500;
    cfg.preMax = Math.min(11000, cfg.preMax + 1000);
  } else if (arch === "sweet_romantic") {
    cfg.greed = Math.max(0.1, cfg.greed - 0.15);
    cfg.demandFirstP = Math.max(0.05, cfg.demandFirstP - 0.05);
  } else {
    cfg.chattiness = Math.min(1, cfg.chattiness + 0.1);
  }
  if (cfg.preMin >= cfg.preMax) cfg.preMax = cfg.preMin + 3000;
  return cfg;
}

/* ------------------------------------------------------------------ */
/* Persistent per-girl memory (affection, seen-counts, facts)          */
/* ------------------------------------------------------------------ */

export interface GirlMemory {
  affection: number; // 0-100 hidden escalation meter
  seen: Record<string, number>; // response-nodeId -> times shown
  recentSigs: string[]; // anti-repeat ring (cap 8)
  lastTopics: string[]; // topic ring (cap 4) ,  catches "you keep saying that"
  askedPhoto: number; // how many times he asked for photos
  awaitingUserPhoto: boolean; // she said "you first" ,  next msg/photo resolves it
  userPhotoReceived: boolean;
  promisedCall: boolean; // she said she'd call ,  excuse may follow
  turns: number;
  hisName?: string;
}

const DEFAULT_MEMORY: GirlMemory = {
  affection: 25,
  seen: {},
  recentSigs: [],
  lastTopics: [],
  askedPhoto: 0,
  awaitingUserPhoto: false,
  userPhotoReceived: false,
  promisedCall: false,
  turns: 0,
};

export async function loadMemory(profileId: string): Promise<GirlMemory> {
  try {
    const raw = await AsyncStorage.getItem(MEMORY_PREFIX + profileId);
    if (raw) return { ...DEFAULT_MEMORY, ...JSON.parse(raw) };
  } catch (e) {}
  // Fresh girl: randomized starting warmth ,  some instantly warm, some slow
  return { ...DEFAULT_MEMORY, affection: jitter(15, 50) };
}

async function saveMemory(profileId: string, mem: GirlMemory): Promise<void> {
  try {
    await AsyncStorage.setItem(MEMORY_PREFIX + profileId, JSON.stringify(mem));
  } catch (e) {}
}

/* ------------------------------------------------------------------ */
/* Intent matching ,  ordered concept sets (specific first).            */
/* NOTE: video_call MUST come before whatsapp so "call karo" doesn't   */
/* fall into the number-refusal pool (old bug).                        */
/* ------------------------------------------------------------------ */

export type IntentId =
  | "photo_request"
  | "video_call"
  | "recharge"
  | "bot"
  | "whatsapp"
  | "love"
  | "compliment"
  | "howru"
  | "greeting"
  | "about_her"
  | "thanks"
  | "bye"
  | "yes"
  | "no"
  | "short"
  | "food"
  | "outfit"
  | "activity"
  | "fallback";

function normalize(text: string): string {
  return (
    " " +
    text
      .toLowerCase()
      .replace(/[?!.,;:'"()\[\]{}<>*~_#@+=/\\|-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim() +
    " "
  );
}

const INTENT_RULES: { intent: IntentId; patterns: RegExp[] }[] = [
  {
    intent: "photo_request",
    patterns: [
      / photo /,
      / pic /,
      / pics /,
      / selfie /,
      / dikhao /,
      / dikha /,
      / image /,
      / chehra /,
      / tasveer /,
      / face /,
      / dekhna hai /,
      / bina kapde /,
      / nangi /,
      / hot pic /,
      / sexy pic /,
      / send pic /,
      / pic bhejo /,
      / photo bhejo /,
    ],
  },
  {
    intent: "video_call",
    patterns: [
      / video call /,
      / video pe /,
      / video chat /,
      / call pe /,
      / call karo /,
      / call kar /,
      / call me /,
      / call karoge /,
      / live aao /,
      / live ao /,
      / cam on /,
      / camera on /,
      / video on /,
      / milne aao /,
      / dekhna hai tumhe /,
    ],
  },
  {
    intent: "recharge",
    patterns: [
      / recharge /,
      / coins /,
      / coin /,
      / paisa /,
      / paise /,
      / payment /,
      / kharcha /,
      / balance /,
      / paise nahi /,
      / free /,
      / muft /,
    ],
  },
  {
    intent: "bot",
    patterns: [
      / bot /,
      / fake /,
      / real ho /,
      / asli ho /,
      / computer /,
      / robot /,
      / script /,
      / tum kaun /,
      / human ho /,
    ],
  },
  {
    intent: "whatsapp",
    patterns: [
      / number /,
      / whatsapp /,
      / insta /,
      / snap /,
      / telegram /,
      / phone /,
      / contact /,
      / milna /,
      / milo /,
      / meet /,
      / date pe /,
      / mil sakte /,
    ],
  },
  {
    intent: "love",
    patterns: [
      / love /,
      / pyaar /,
      / pyar /,
      / pasand /,
      / like you /,
      / miss you /,
      / yaad /,
      / kiss /,
      / shaadi /,
      / shadi /,
      / girlfriend /,
      / boyfriend /,
      / single /,
      / meri ho /,
      / meri ban /,
      / jaan /,
      / baby /,
      / darling /,
      / bed /,
      / room me /,
      / kissi /,
      / hug /,
    ],
  },
  {
    intent: "compliment",
    patterns: [
      / beautiful /,
      / sundar /,
      / cute /,
      / hot /,
      / sexy /,
      / gorgeous /,
      / pretty /,
      / smile /,
      / tareef /,
      / mast /,
      / kamaal /,
      / aankh /,
      / lips /,
      / figure /,
      / style /,
    ],
  },
  {
    intent: "howru",
    patterns: [
      / kaise ho /,
      / kesi ho /,
      / kya hal /,
      / how are you /,
      / aur batao /,
      / kya chal /,
      / sab badhiya /,
    ],
  },
  {
    intent: "about_her",
    patterns: [
      / tumhara naam /,
      / naam kya /,
      / kitni age /,
      / age kya /,
      / kahan rehti /,
      / kahan se /,
      / kya karti /,
      / job /,
      / padhai /,
      / boyfriend hai /,
      / shaadi hui /,
      / family /,
      / kahan ki ho /,
    ],
  },
  { intent: "thanks", patterns: [/ thank /, / shukriya /, / dhanyavad /] },
  {
    intent: "bye",
    patterns: [
      / bye /,
      / good night /,
      / goodnight /,
      / alvida /,
      / baad me /,
      / kal baat /,
      / so jata /,
      / so jati /,
      / chalta hu /,
    ],
  },
  {
    intent: "yes",
    patterns: [
      /^ haan $/,
      /^ ha $/,
      /^ yes $/,
      /^ yup $/,
      /^ han $/,
      / haan ji /,
    ],
  },
  {
    intent: "no",
    patterns: [/^ nahi $/, /^ nahi$ /, / no /, /^ na $/, / mat karo /],
  },
  {
    intent: "food",
    patterns: [
      / khana /,
      / dinner /,
      / lunch /,
      / breakfast /,
      / khaya /,
      / food /,
      / bhookh /,
      / khila /,
    ],
  },
  {
    intent: "outfit",
    patterns: [
      / dress /,
      / pehna /,
      / wearing /,
      / outfit /,
      / saree /,
      / nighty /,
      / clothes /,
      / kapde /,
      / kya pehni /,
    ],
  },
  {
    intent: "activity",
    patterns: [
      / kya kar /,
      / what are you doing /,
      / free ho /,
      / busy /,
      / kahan ho /,
      / where are you /,
      / soyi /,
      / soye /,
      / uthi /,
      / uthe /,
    ],
  },
  {
    intent: "short",
    patterns: [
      /^ hmm+ $/,
      /^ ok$/,
      /^ okay $/,
      /^ acha+ $/,
      /^ achha+ $/,
      /^ k $/,
      /^ hmm$/,
      /^ ok$/,
    ],
  },
  {
    intent: "greeting",
    patterns: [
      /\bhi\b/,
      /\bhii+\b/,
      /\bhello\b/,
      /\bhey\b/,
      / namaste /,
      /\bsup\b/,
      /^yo$/,
      / ram ram /,
      / salaam /,
    ],
  },
  { intent: "fallback", patterns: [/.*/] },
];

export function matchIntent(text: string): IntentId {
  const n = normalize(text);
  for (const rule of INTENT_RULES) {
    if (rule.patterns.some((p) => p.test(n))) return rule.intent;
  }
  return "fallback";
}

/**
 * NLU-first intent match. Pre-trained on 1,500+ Hinglish utterances.
 * Regex overrides kept for monetization-critical intents so they never
 * misfire on slang/abuse (photo / call / recharge / bot).
 * Returns the same IntentId surface used everywhere.
 */
export async function matchIntentNLUCompat(
  text: string,
): Promise<IntentId> {
  // Monetization gates: regex wins over NLU (never let "sasta plan" or
  // abuse route around the photo/call/recharge behavior).
  const regexIntent = matchIntent(text);
  if (
    regexIntent === "photo_request" ||
    regexIntent === "video_call" ||
    regexIntent === "recharge" ||
    regexIntent === "bot"
  ) {
    return regexIntent;
  }
  const r = await matchIntentNLU(text);
  if (r.intent && r.score >= 0.55) {
    // NLU labels are compatible with IntentId surface for our trained
    // intents; unknown → fallback.
    if (isKnownIntent(r.intent)) return r.intent as IntentId;
  }
  return regexIntent;
}

const KNOWN_INTENT_IDS: ReadonlySet<string> = new Set<string>([
  "greeting", "compliment", "love", "miss_you", "jealousy", "ignore",
  "photo_request", "call_request", "whatsapp",
  "dirty_request", "dirty_question", "sexual_compliment",
  "dirty_yes", "dirty_deflect", "dirty_tease",
  "abuse", "abuse_hard", "anger",
  "question_her", "thanks", "bye",
  "food", "outfit", "activity", "sleep", "mood",
  "recharge", "joke", "fallback",
]);

function isKnownIntent(s: string): boolean {
  return KNOWN_INTENT_IDS.has(s);
}

/* ------------------------------------------------------------------ */
/* Response pools ,  Ink-style {seq|cycle|once|shuffle} variants.       */
/* Short Hinglish, lazy punctuation, horny + excited, no em dashes.    */
/* ------------------------------------------------------------------ */

type Pool = Record<CharacterArchetype, string[]>;

function pickPool(
  pool: Pool,
  arch: CharacterArchetype,
  mem: GirlMemory,
  sigPrefix: string,
  mode: "shuffle" | "cycle" | "sequence" = "shuffle",
): string {
  const arr = pool[arch] || pool.playful_tease;
  const seen = mem.seen[sigPrefix] ?? 0;
  let idx: number;
  if (mode === "sequence") {
    idx = Math.min(seen, arr.length - 1);
  } else if (mode === "cycle") {
    idx = seen % arr.length;
  } else {
    // shuffle with anti-repeat: avoid recent sigs (cap 30)
    const fresh = arr.filter(
      (_, i) => !mem.recentSigs.includes(`${sigPrefix}:${i}`),
    );
    const list = fresh.length > 0 ? fresh : arr;
    const choice = list[Math.floor(Math.random() * list.length)];
    idx = arr.indexOf(choice);
  }
  const sig = `${sigPrefix}:${idx}`;
  mem.seen[sigPrefix] = seen + 1;
  mem.recentSigs.push(sig);
  if (mem.recentSigs.length > 30) mem.recentSigs = mem.recentSigs.slice(-30);
  return arr[idx];
}

/* ---------------- corpus picker (anti-repeat + slot grammar) ---------- */

function composePool(intent: CorpusIntent, arch: CharacterArchetype): string[] {
  const variants = getPool(intent, arch);
  return variants.map((v) => composeBase(v, arch));
}

/**
 * Optional context decoration. Returns the reply possibly enriched with:
 *   - time-of-day flavor (subtle ~35%)
 *   - imperfection layer (drop punctuation / lowercase)
 *   - context callbacks (echo his name or word, mention unresolved promises)
 *
 * Determinism is intentionally random per pick — the anti-repeat ledger
 * is what keeps things unique, NOT a fixed template.
 */
function contextualize(
  text: string,
  opts: {
    arch: CharacterArchetype;
    mem: GirlMemory;
    lastUserText?: string;
  },
): string {
  let out = text;
  // 1. Time-of-day flavor
  out = maybeTimeFlavor(out);
  // 2. Imperfection
  out = applyImperfection(out);
  // 3. Context callbacks: occasionally echo his last word, or mention
  //    a pending promise/photo.
  if (Math.random() < 0.18 && opts.lastUserText) {
    const words = opts.lastUserText.split(/\s+/).filter((w) => w.length >= 4);
    if (words.length) {
      const echo = words[Math.floor(Math.random() * words.length)];
      out = `${out} , ${echo} yaad rahega`;
    }
  }
  if (Math.random() < 0.12 && opts.mem.promisedCall) {
    const cb = pickCorpusCallback("promised_call", opts.arch);
    if (cb && !out.includes(cb)) out = `${out} , ${cb}`;
  }
  if (Math.random() < 0.18 && opts.mem.awaitingUserPhoto) {
    const cb = pickCorpusCallback("awaiting_photo", opts.arch);
    if (cb && !out.includes(cb)) out = `${out} , ${cb}`;
  }
  return out;
}

function pickCorpusCallback(
  kind: "promised_call" | "awaiting_photo",
  arch: CharacterArchetype,
): string {
  const pool: Record<string, Record<CharacterArchetype, string[]>> = {
    promised_call: {
      playful_tease: ["call ka bola tha, abhi yaad aaya 😏", "call kab karega, main wait kar rahi hu"],
      sweet_romantic: ["aap call ka bola tha 🌸", "intezaar hai aapke call ka"],
      bold_alluring: ["call ka bola tha, kaha gayab ho 🔥", "abhi call karo baba"],
      mysterious_sensual: ["aapne call ka bola tha, kya hua 🌙", "intezaar kuch lambi ho gayi"],
    },
    awaiting_photo: {
      playful_tease: ["pehle tum bhejo, phir main bhejungi 😜", "tumhare photo ki baat, yaad hai"],
      sweet_romantic: ["aapne photo bheja nahi abhi tak 🌸", "tumhare photo ka intezaar hai"],
      bold_alluring: ["pehle tum photo bhejo 🔥", "tumhare photo ki baat, sab yaad hai"],
      mysterious_sensual: ["photo bheja nahi aapne abhi tak 🌙", "tumhari photo, kaha hai"],
    },
  };
  const arr = pool[kind][arch] || pool[kind].playful_tease;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Picks a string for this girl from the v3 corpus. Always returns a
 * distinct composed string (anti-repeat enforced at sync layer).
 * Updates mem.recentSigs / mem.seen for legacy compatibility.
 */
function pickCorpus(
  intent: CorpusIntent,
  arch: CharacterArchetype,
  profileId: string,
  mem: GirlMemory,
  sigPrefix: string,
  count = 8,
  ctx: { lastUserText?: string } = {},
): string {
  warmAntiRepeat(profileId);
  const pool = composePool(intent, arch);
  // Sample a small set of composed variants for the picker to choose from.
  const sample: string[] = [];
  const seenInSample = new Set<string>();
  for (let i = 0; i < count * 3 && sample.length < count; i++) {
    const v = pool[Math.floor(Math.random() * pool.length)];
    if (!seenInSample.has(v)) {
      seenInSample.add(v);
      sample.push(v);
    }
  }
  const chosen = pickWithNoRepeatSync(profileId, sample);
  if (!chosen) {
    // Should not happen, but ensure we never return empty.
    return pool[Math.floor(Math.random() * pool.length)];
  }
  mem.seen[sigPrefix] = (mem.seen[sigPrefix] ?? 0) + 1;
  mem.recentSigs.push(`${sigPrefix}:chosen`);
  if (mem.recentSigs.length > 30) mem.recentSigs = mem.recentSigs.slice(-30);
  return contextualize(chosen, { arch, mem, lastUserText: ctx.lastUserText });
}

/** Lazy "k" / "ok" reply for tiny user inputs (~50% chance). */
function maybeLazy(
  userText: string,
  arch: CharacterArchetype,
  profileId: string,
  mem: GirlMemory,
): string | null {
  const ack = maybeLazyAck(userText);
  if (!ack) return null;
  return ack;
}

/** Map legacy IntentId → corpus intent for the chat reply path. */
function toCorpusIntent(intent: IntentId): CorpusIntent {
  switch (intent) {
    case "greeting":
      return "greeting";
    case "compliment":
      return "compliment";
    case "love":
      return "love";
    case "howru":
      return "mood";
    case "about_her":
      return "question_her";
    case "thanks":
      return "thanks";
    case "bye":
      return "bye";
    case "recharge":
      return "recharge";
    case "bot":
      return "fallback";
    case "yes":
    case "no":
    case "short":
    case "food":
    case "outfit":
    case "activity":
    case "whatsapp":
    case "fallback":
    default:
      return "fallback";
  }
}

/** Same, but for the "you first" / repeat redirect branches. */
function repeatCorpusIntent(): CorpusIntent {
  return "greeting_return";
}

/* ---------------- photo_request outcome lines ---------------- */

type PhotoOutcome =
  | "send_locked"
  | "send_free"
  | "demand_first"
  | "dont_know_how"
  | "recharge_first"
  | "hesitant"
  | "refuse_tease";

const PHOTO_LINES: Record<PhotoOutcome, Pool> = {
  send_locked: {
    playful_tease: [
      "sirf tumhare liye 😏 dekh lo, kisi ko dikhana mat",
      "lekin ye wali special hai 🙈 sambhal ke dekhna",
      "achha baba le lo 😜 nazar lag gayi to tum zimmedar",
    ],
    sweet_romantic: [
      "sirf aapke liye 🌸 kisi ko mat dikhana please",
      "sharma rahi hu 🙈 lekin bhej rahi hu",
      "dil se bhej rahi hu ❤️ sambhal ke rakhna",
    ],
    bold_alluring: [
      "dekh lo 🔥 lekin dil tham ke",
      "ye wali garam hai 😏 handle kar lena",
      "sirf tumhare liye 💋 enjoy karo",
    ],
    mysterious_sensual: [
      "sirf tum dekh sakte ho ✨",
      "ye raaz hai 🌙 khol ke dekho",
      "andheri raat me roshni ✨ sambhal ke",
    ],
  },
  send_free: {
    playful_tease: [
      "ye lo 😜 abhi ki fresh selfie",
      "dekh lo, cute hu na 🙈",
      "abhi nahayi hu 😂 mazak kar rahi, ye lo",
    ],
    sweet_romantic: [
      "ye lijiye 🌸 abhi ki photo",
      "kesi lagi batao na ❤️",
      "simple si hu, ye dekho 🌷",
    ],
    bold_alluring: [
      "ye lo 🔥 free me de rahi, kadar karo",
      "dekh lo 😏 abhi aur bhi hai",
      "cute wali free, naughty wali mehengi 😏",
    ],
    mysterious_sensual: [
      "ye dekho ✨",
      "aaj ki ✨",
      "nazar bhar ke dekh lo 🌙",
    ],
  },
  demand_first: {
    playful_tease: [
      "pehle tum bhejo 😏 phir main sochungi",
      "tumhari dekh ke decide karungi 😜",
      "deal hai, pehle tum 🙈",
    ],
    sweet_romantic: [
      "pehle aap bhejo na 🌸 phir main bhejungi",
      "tum bhej do, phir meri baari ❤️",
      "ladies first nahi, is baar tum first 🙈",
    ],
    bold_alluring: [
      "pehle tum 😏 himmat hai to bhejo",
      "tumhari photo dekhe bina mood nahi 🔥",
      "ek ke badle ek baby 💋 tum start karo",
    ],
    mysterious_sensual: [
      "pehle tumhara chehra ✨ phir mera raaz",
      "tum dikhao, phir main 🌙",
      "barabar ka sauda ✨",
    ],
  },
  dont_know_how: {
    playful_tease: [
      "arey mujhe bhejna nahi aata 😅 sikhado na",
      "photo kese bhejte hain 🙈 tum bhejo pehle, dekh ke sikhti hu",
    ],
    sweet_romantic: [
      "mujhe samajh nahi aata kese bhejte 🌸",
      "phone me nayi hu, tum bhej ke dikhao na ❤️",
    ],
    bold_alluring: [
      "bhejna nahi aata 😅 lekin video call pe sab dikhta hai 🔥",
      "photo me kya rakha, live dekh lo na 😏",
    ],
    mysterious_sensual: [
      "ye kala mujhe nahi aati ✨",
      "tasveer bhejna bhool gayi 🌙 tum yaad dilao",
    ],
  },
  recharge_first: {
    playful_tease: [
      "recharge kar lo na 🙈 phir sab dikhaungi",
      "coins khatam hone wale hain, pehle recharge 😜 phir dhamaka",
    ],
    sweet_romantic: [
      "pehle thoda recharge kar lo na 🌸 phir dil khol ke ❤️",
      "balance low hai, recharge karo phir surprise ❤️",
    ],
    bold_alluring: [
      "bina recharge ke kuch nahi milega 🔥 pehle coins, phir maza",
      "recharge karo baby 💋 phir dekhte hain",
    ],
    mysterious_sensual: [
      "pehle nazrana ✨ phir deedar 🌙",
      "recharge kar lo, raaz khulenge 🌙",
    ],
  },
  hesitant: {
    playful_tease: [
      "hmm... sochti hu 🙈 thoda time do",
      "arey... sharma rahi hu 😅 ruko zara",
      "pakka na? kisi ko nahi dikhaoge? 🙈",
    ],
    sweet_romantic: [
      "hmm 🌸 thoda darr lag raha",
      "sochne do na ❤️ bharosa hai tum pe",
      "achha ruko, himmat juta rahi 🙈",
    ],
    bold_alluring: [
      "hmm 😏 mood bana rahi hu, ruko",
      "thoda tadpa lo pehle 🔥 phir bhejti hu",
      "sabr karo baby 💋 worth the wait hoga",
    ],
    mysterious_sensual: [
      "ruk jao ✨ chand badalon me hai",
      "thoda intezaar 🌙",
      "raaz khulne me waqt lagta hai ✨",
    ],
  },
  refuse_tease: {
    playful_tease: [
      "roz roz photo 😤 kabhi call bhi kar liya karo",
      "bas? photo photo 😂 thoda chat bhi kar lo",
    ],
    sweet_romantic: [
      "itni baar maangoge to sharma jaungi 🌸",
      "thoda sabr karo na ❤️ baat to karo pehle",
    ],
    bold_alluring: [
      "maangte raho 😏 milna tab bhi mushkil hai",
      "photo se aage bhi badho 🔥 call karo",
    ],
    mysterious_sensual: [
      "lagatar maangna mana hai 🌙",
      "sabr ka phal meetha ✨",
    ],
  },
};

const PHOTO_FOLLOWUPS: Record<string, Pool> = {
  hesitant_send: {
    playful_tease: [
      "ok sirf tumhare liye 🙈 lo dekh lo",
      "himmat kar li 😅 ye lo",
    ],
    sweet_romantic: ["bharosa karke bhej rahi ❤️", "ye lo 🌸 sambhal ke"],
    bold_alluring: ["lo aa gayi 🔥 worth it na?", "tadap khatam 💋 lo"],
    mysterious_sensual: ["raaz khul gaya 🌙", "lo dekh lo ✨"],
  },
  dont_know_how: {
    playful_tease: ["try kiya, ho nahi raha 😅 video call pe dekh lo na"],
    sweet_romantic: ["nahi ho paya 🌸 call pe aa jao na"],
    bold_alluring: ["photo chhodo, live dekh lo 🔥 call karo"],
    mysterious_sensual: ["tasveer nahi, deedar hoga ✨ call pe"],
  },
};

/* ---------------- video_call outcome lines ---------------- */

type CallOutcome =
  | "will_call"
  | "you_call_me"
  | "excuse_later"
  | "recharge_first"
  | "shy_deflect";

const CALL_LINES: Record<CallOutcome, Pool> = {
  will_call: {
    playful_tease: [
      "achha baba karti hu 😜 thodi der me call aayega, uthana",
      "ruk, taiyar ho ke karti hu 🙈 miss mat karna",
    ],
    sweet_romantic: [
      "kart hu na 🌸 thodi der me, intezaar karna ❤️",
      "achha, taiyar hoke call karti hu 🙈",
    ],
    bold_alluring: [
      "taiyar ho jao 🔥 call aa raha hai",
      "bed pe let ke karti hu 💋 ready raho",
    ],
    mysterious_sensual: [
      "chand nikalte hi call ✨ thoda sabr",
      "bula rahi hu 🌙 aa jaungi",
    ],
  },
  you_call_me: {
    playful_tease: [
      "tum karo na 😜 main wait kar rahi",
      "mere se nahi hota, tum call karo 🙈",
    ],
    sweet_romantic: [
      "aap kar lo na 🌸 main free hu ❤️",
      "tumhari call ka intezaar rahega ❤️",
    ],
    bold_alluring: [
      "tum call karo baby 🔥 main ready hu",
      "button tum dabao 💋 maza tum do",
    ],
    mysterious_sensual: ["tum bulao ✨ main aa jaungi", "pehla kadam tum 🌙"],
  },
  excuse_later: {
    playful_tease: [
      "5 min ruko 😅 phir karti hu pakka",
      "abhi mummy paas hai 🙈 thodi der me karti hu",
    ],
    sweet_romantic: [
      "thodi der me karti hu na 🌸 pakka promise ❤️",
      "abhi ghar pe sab hain, thodi der ruko 🙈",
    ],
    bold_alluring: [
      "mood bana rahi hu 🔥 5 min do",
      "abhi kapde change kar rahi 😏 thodi der me",
    ],
    mysterious_sensual: [
      "waqt sahi nahi ✨ thodi der me",
      "badal chhate hi ✨",
    ],
  },
  recharge_first: {
    playful_tease: [
      "coins khatam hain 😅 recharge karo phir lambi call",
      "balance low hai, pehle recharge 😜 phir raat bhar",
    ],
    sweet_romantic: [
      "balance khatam ho jayega 🌸 pehle recharge kar lo na ❤️",
      "lambi baat karni hai to recharge karo ❤️",
    ],
    bold_alluring: [
      "bina coins ke call kat jayegi 🔥 pehle recharge baby",
      "paisa phenko, tamasha dekho 💋 recharge karo",
    ],
    mysterious_sensual: [
      "nazrana pehle ✨ phir mulaqat 🌙",
      "recharge kar lo, lambi raat hogi 🌙",
    ],
  },
  shy_deflect: {
    playful_tease: [
      "abhi nahi 🙈 muh bana hua hai, pehle chat karo",
      "camera me sharma jaungi 😅 thoda aur baat karo",
    ],
    sweet_romantic: [
      "abhi taiyar nahi hu 🙈 thodi baat kar lo pehle 🌸",
      "sharma rahi hu, pehle dil ki baat ❤️",
    ],
    bold_alluring: [
      "pehle thoda tadpa lo 🔥 phir call",
      "itni jaldi? 😏 pehle chat me garam karo",
    ],
    mysterious_sensual: [
      "abhi chehra badalon me ✨",
      "pehle alfaaz 🌙 phir deedar",
    ],
  },
};

const CALL_EXCUSES: Pool = {
  playful_tease: [
    "sorry yaar 😅 ghar pe koi aa gaya, raat ko pakka karti hu",
    "arey network chala gaya tha 🙈 thodi der me try karti",
  ],
  sweet_romantic: [
    "sorry 🌸 mummy aa gayi thi, raat ko pakka baat karenge ❤️",
    "maaf karo na, ghar ka kaam aa gaya 🙈",
  ],
  bold_alluring: [
    "sorry baby 🔥 mood kharab ho gaya, raat ko double maza dungi",
    "room me koi aa gaya 😤 raat ko pakka",
  ],
  mysterious_sensual: [
    "waqt ne saath nahi diya 🌙 raat ko milenge",
    "badal ghir aaye ✨ phir kabhi",
  ],
};

/* ---------------- small-talk pools ---------------- */

const GREETING: Pool = {
  playful_tease: [
    "heyy 😜 kya haal",
    "oye 😜 aa gaye tum",
    "hiii 🙈 miss kiya kya",
  ],
  sweet_romantic: [
    "hello ji 🌸 kese ho",
    "hii ❤️ yaad kar rahe the kya",
    "namaste 🙏 kese ho aap",
  ],
  bold_alluring: [
    "hey handsome 🔥",
    "aa gaye 😏 kya irada hai",
    "hii 🔥 miss kiya mujhe?",
  ],
  mysterious_sensual: ["hii ✨", "aa gaye tum 🌙", "yaad kiya tumne? ✨"],
};

const REPEAT_GREETING: Pool = {
  playful_tease: [
    "phir se hi? 😂 kuch naya bolo na",
    "hi hi laga rakha hai 😜 aur batao",
  ],
  sweet_romantic: [
    "phir hello 🌸 achha lag raha hai ❤️",
    "baar baar hi, cute ho 🙈",
  ],
  bold_alluring: ["bas hi? 😏 aage bhi badho", "hi se kaam nahi chalega 🔥"],
  mysterious_sensual: ["phir wahi ✨", "dobara ✨ achha laga"],
};

const HOWRU: Pool = {
  playful_tease: [
    "badhiya 😜 tum batao, kya chal raha",
    "bore ho rahi thi, tum aa gaye 😌",
    "mast, tum sunao",
  ],
  sweet_romantic: [
    "achhi hu 🌸 aap batao, din kesa gaya",
    "aapki yaad me thi ❤️ ab achha lag raha",
    "badhiya, tum kese ho",
  ],
  bold_alluring: [
    "garam 🔥 tum batao",
    "tumhe dekh ke aur achhi 😏",
    "mast, aur tum?",
  ],
  mysterious_sensual: ["sukoon me ✨ tum batao", "chandni si ✨ tum sunao"],
};

const COMPLIMENT_BACK: Pool = {
  playful_tease: [
    "aww 🙈 tum bhi kam nahi ho, dekh ke garmi lag gayi",
    "makhan laga rahe ho 😜 kaam kya hai batao, kapde utarne hain?",
    "sach me? 🙈 blush ke saath kuch aur bhi aa gaya",
  ],
  sweet_romantic: [
    "sach? 🌸 dil ke saath badan bhi khush ho gaya ❤️",
    "tum bhi bohot hot ho ❤️ nazar lag jayegi",
    "aww 🙈 sharma ke laal ho gayi",
  ],
  bold_alluring: [
    "pata hai 😏 aur batao, kapde utarte hue sunungi",
    "aur tareef karo 🔥 garam ho rahi hu",
    "tumhari nazar ne kapde utar diye 💋",
  ],
  mysterious_sensual: [
    "nazar ka khel ✨ utarte kapdon tak jayega",
    "shukriya 🌙 tum bhi bechain karte ho",
  ],
};

const LOVE_BACK: Pool = {
  playful_tease: [
    "achha ji 😜 itni jaldi pyaar? pehle kapde to utaro 🙈",
    "haha phas gaye 😏 ab meri shartein suno, pehli raat ko milna",
    "love you too 🙈 ab apni wali bhejo, naughty wali",
  ],
  sweet_romantic: [
    "sach me? ❤️ dil ke saath sab kuch dhadak gaya 🌸",
    "main bhi... 🙈 bohot, andar tak",
    "ye sun ke din ban gaya ❤️ raat bhi bana do na",
  ],
  bold_alluring: [
    "prove karo 🔥 kapde utar ke dikhao pehle",
    "achha? 😏 to call pe aao na, dikhati hu kitna pyaar hai",
    "love you too baby 💋 ab bistar me maza do",
  ],
  mysterious_sensual: [
    "lafz kam pad gaye ✨ jism bolne laga",
    "dil ne sun liya 🌙 ab raat sunegi",
  ],
};

const ABOUT_HER: Pool = {
  playful_tease: [
    "main? bas tumhari 😜 baaki sab baad me",
    "sawal jawab ho raha hai? 😂 achha poochho kya poochna",
  ],
  sweet_romantic: [
    "main simple si ladki hu 🌸 bas pyaar chahiye ❤️",
    "mere baare me jaan ke kya karoge 🙈",
  ],
  bold_alluring: [
    "mujhe jaan na hai? 🔥 pehle call pe aao",
    "mystery achhi lagti hai na 😏",
  ],
  mysterious_sensual: [
    "raaz hu ✨ khulne me waqt lagega",
    "naam me kya rakha hai 🌙",
  ],
};

const THANKS_BACK: Pool = {
  playful_tease: [
    "welcome 😜 aur bhejo na",
    "koi baat nahi 🙈 tum ho hi sweet",
  ],
  sweet_romantic: ["aapka pyaar hi kaafi hai ❤️", "khush raho 🌸"],
  bold_alluring: ["welcome baby 🔥 aur do 😏", "achha laga 💋"],
  mysterious_sensual: ["shukriya ✨", "dil se ✨"],
};

const BYE_BACK: Pool = {
  playful_tease: ["bye 😜 sapno me aana", "ja rahe? 🙈 miss karungi thoda"],
  sweet_romantic: [
    "bye 🌸 apna khayal rakhna ❤️",
    "phir milenge ❤️ intezaar rahega",
  ],
  bold_alluring: ["bye baby 🔥 sapno me milna", "jao 😏 lekin wapas aana"],
  mysterious_sensual: ["phir milenge 🌙", "alvida nahi, phir ✨"],
};

const YES_BACK: Pool = {
  playful_tease: [
    "pakka? 😜 to phir der kis baat ki",
    "haan to ho gaya 🙈 ab aage badho",
  ],
  sweet_romantic: ["sach? ❤️ khushi hui", "achha laga sun ke 🌸"],
  bold_alluring: ["good 😏 mujhe haan sunna pasand hai", "perfect 🔥"],
  mysterious_sensual: ["achha ✨", "suna 🌙"],
};

const NO_BACK: Pool = {
  playful_tease: ["arey kyu 😂 achha koi baat nahi", "nakhre 😜 chalega"],
  sweet_romantic: [
    "koi baat nahi 🌸 tumhari marzi ❤️",
    "achha ji, jesa tum kaho",
  ],
  bold_alluring: [
    "na? 😏 aur interesting",
    "mana kar diya 🔥 ab aur man karega",
  ],
  mysterious_sensual: ["jesa tum chaho ✨", "suna 🌙"],
};

const RECHARGE_BACK: Pool = {
  playful_tease: [
    "haan yaar coins khatam ho rahe 😅 thoda recharge kar lo na",
    "recharge karoge to lambi baat hogi 😜",
  ],
  sweet_romantic: [
    "thoda recharge kar lo na 🌸 phir araam se baat karenge ❤️",
    "balance ka dhyan rakhna ❤️",
  ],
  bold_alluring: [
    "recharge karo baby 🔥 phir full maza",
    "coins dalo, raat lambi karo 💋",
  ],
  mysterious_sensual: ["nazrana ✨ phir mulaqat 🌙", "recharge kar lo 🌙"],
};

const BOT_BACK: Pool = {
  playful_tease: [
    "bot?? 😂 kasam se real hu",
    "bot hoti to itni bakwaas karti? 😂",
  ],
  sweet_romantic: [
    "main real hu 🌸 kasam se ❤️",
    "esa mat kaho, dil dukhta hai 🙈",
  ],
  bold_alluring: [
    "real hu baby 🔥 check kar lo call pe",
    "bot me itna dum kahan 😏",
  ],
  mysterious_sensual: [
    "shak? ✨ call pe aa ke dekh lo",
    "raaz hu, bot nahi 🌙",
  ],
};

const USER_PHOTO_REACT: Pool = {
  playful_tease: [
    "oye hoye 😍 handsome lag rahe ho",
    "achhi hai 🙈 lekin aur achhi bhej sakte the 😜",
    "dekh li 😏 ab meri baari, taiyar ho?",
  ],
  sweet_romantic: [
    "kitne sweet lag rahe ho ❤️ dil khush ho gaya",
    "bohot pyari photo 🌸 sambhal ke rakhoongi",
    "aww 🙈 ab meri baari, bharosa rakho ❤️",
  ],
  bold_alluring: [
    "uff 🔥 garam ho gayi dekh ke",
    "not bad 😏 ab meri wali dekhne ki himmat hai?",
    "hot lag rahe ho 💋 ab meri baari",
  ],
  mysterious_sensual: [
    "chehra roshan ✨ achha laga dekh ke",
    "nazar lag na jaye 🌙",
    "dekh liya ✨ ab mera raaz khulega",
  ],
};

const REPEAT_TOPIC_GAMBIT: Pool = {
  playful_tease: [
    "ye to pehle bhi bole 😂 kuch naya batao na",
    "atki hui record ho kya 😜 topic change karo",
  ],
  sweet_romantic: [
    "ye baat to ho gayi na 🌸 kuch aur batao ❤️",
    "phir wahi baat 🙈 naya kuch kaho",
  ],
  bold_alluring: [
    "repeat mode? 😏 bore kar rahe ho",
    "wahi baat phir se 🔥 naya lao",
  ],
  mysterious_sensual: ["dohraya ✨", "phir wahi lafz 🌙"],
};

/* ------------------------------------------------------------------ */
/* Reply plan                                                           */
/* ------------------------------------------------------------------ */

export interface PlanPhoto {
  url: string;
  cost: number; // 0 = free photo, >0 = locked blur
  caption: string;
}

export interface PlanFollowUp {
  delayMs: number;
  bubbles: string[];
  photo?: { url: string; cost: number };
}

export interface ReplyPlan {
  intent: IntentId;
  bubbles: string[];
  /** Silence BEFORE typing shows (1-10s random ,  the anti-instant fix) */
  preTypingMs: number;
  /** Typing duration per bubble */
  typingMs: number[];
  /** Gap before 2nd bubble */
  gapMs: number;
  /** True when she was "busy" ,  dots flicker mid-silence as theater.
   *  The reply STILL lands inside the 10s hard cap. */
  readSilence: boolean;
  /** Optional busy-flicker choreography (relative to plan start). */
  flicker?: { atMs: number; durationMs: number };
  photo?: PlanPhoto;
  followUp?: PlanFollowUp;
  callRequest?: { minMs: number; maxMs: number };
  affectionDelta: number;
  nudgeText?: string;
  nudgeDelayMs?: number;
}

function typingFor(text: string): number {
  return Math.max(1200, text.length * 45 + jitter(0, 2500));
}

function buildPlan(
  mem: GirlMemory,
  cfg: PersonaConfig,
  intent: IntentId,
  bubbles: string[],
  extra: Partial<ReplyPlan> = {},
): ReplyPlan {
  const aff = mem.affection;
  // Warm girls reply a bit faster; cold girls take longer. Never instant.
  const warmthShift = Math.floor(((50 - aff) / 50) * 2500);
  // Typing time per bubble FIRST, so silence can be clamped to keep the
  // whole reply inside the HARD 10s CAP: first bubble ALWAYS lands ≤10s
  // after his send, any girl, any bubble length.
  const typingMs = bubbles.map((b) => typingFor(b));
  const rawPre = jitter(900, 5000) + warmthShift + jitter(0, 2000);
  const preTypingMs = Math.min(Math.max(900, rawPre), 7000);
  const t0 = typingMs[0] ?? 2000;
  if (preTypingMs + t0 > 10_000) {
    typingMs[0] = Math.max(900, 10_000 - preTypingMs);
  }
  // "Busy" is theater now, never a real delay: dots flicker briefly
  // mid-silence (read-but-distracted), then the normal reply lands on time.
  const busy = Math.random() < cfg.busyP;
  const flicker = busy
    ? {
        atMs: jitter(1200, Math.max(2000, Math.floor(preTypingMs / 2))),
        durationMs: jitter(1500, 2500),
      }
    : undefined;
  return {
    intent,
    bubbles,
    preTypingMs,
    typingMs,
    gapMs: jitter(3000, 8000),
    readSilence: busy,
    flicker,
    affectionDelta: 1,
    ...extra,
  };
}

function weighted<T>(pairs: [T, number][]): T {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let roll = Math.random() * total;
  for (const [v, w] of pairs) {
    roll -= w;
    if (roll <= 0) return v;
  }
  return pairs[pairs.length - 1][0];
}

/* ---------------- photo sourcing ---------------- */

/**
 * Locked exclusive for chat sends: a random lockedPhoto (content the user
 * can NEVER see free ,  gallery shows it blurred, detail gallery too).
 * Falls back to a random gallery photo only if she has no locked set.
 */
function exclusivePhoto(
  profile: Profile,
  fallbackCost: number,
): { url: string; cost: number; caption: string } {
  const locked = profile.lockedPhotos ?? [];
  if (locked.length > 0) {
    const item = locked[Math.floor(Math.random() * locked.length)];
    return {
      url: item.url,
      cost: item.unlockCostCoins,
      caption: item.caption ?? "",
    };
  }
  const pool = (profile.photos ?? []).filter(Boolean);
  return {
    url:
      pool.length > 0
        ? pool[Math.floor(Math.random() * pool.length)]
        : profile.avatar,
    cost: 0,
    caption: "",
  };
}

/** Free gallery photo (never a locked exclusive). */
function freeGalleryPhoto(profile: Profile): string {
  const pool = (profile.photos ?? []).filter(Boolean);
  if (pool.length === 0) return profile.avatar;
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ---------------- outcome rollers ---------------- */

function rollPhotoOutcome(
  mem: GirlMemory,
  cfg: PersonaConfig,
  coins: number,
  profile?: Profile,
): PhotoOutcome {
  mem.askedPhoto += 1;
  if (mem.askedPhoto >= 3) return "refuse_tease";
  const aff = mem.affection;
  const cost = cfg.unlockCost;
  const hasLocked = (profile?.lockedPhotos ?? []).length > 0;
  // Wallet-aware: if he can't afford her price, greed steers to recharge
  const brokeBoost = coins < cost ? cfg.greed * 2 : 0;

  let outcome: PhotoOutcome;
  if (aff < 20) {
    outcome = weighted<PhotoOutcome>([
      ["demand_first", 0.35 + cfg.demandFirstP],
      ["dont_know_how", 0.2 + cfg.shyP],
      ["recharge_first", 0.15 + brokeBoost],
      ["hesitant", 0.15],
      ["send_free", 0.1],
      ["send_locked", 0.05],
    ]);
  } else if (aff < 50) {
    outcome = weighted<PhotoOutcome>([
      ["send_free", 0.25],
      ["hesitant", 0.2 + cfg.shyP],
      ["demand_first", 0.15 + cfg.demandFirstP],
      ["send_locked", 0.15 + cfg.sendPhotoP * 0.2],
      ["recharge_first", 0.1 + brokeBoost],
      ["dont_know_how", 0.08],
    ]);
  } else {
    outcome = weighted<PhotoOutcome>([
      ["send_locked", 0.3 + cfg.sendPhotoP * 0.3],
      ["send_free", 0.2],
      ["hesitant", 0.15],
      ["recharge_first", 0.12 + brokeBoost],
      ["demand_first", 0.08],
      ["dont_know_how", 0.05],
    ]);
  }

  // If female has no blocked photos, she must never send a locked photo
  if (!hasLocked && outcome === "send_locked") {
    return "send_free";
  }
  return outcome;
}

function rollCallOutcome(
  mem: GirlMemory,
  cfg: PersonaConfig,
  coins: number,
  callRate: number,
): CallOutcome {
  const aff = mem.affection;
  const minForCall = callRate * 2;
  if (coins < minForCall) {
    // Broke: mostly recharge pressure, small chance of mercy short call
    return weighted<CallOutcome>([
      ["recharge_first", 0.55 + cfg.greed * 0.3],
      ["you_call_me", 0.15],
      ["shy_deflect", 0.12],
      ["will_call", 0.1], // mercy ,  she calls anyway, short
      ["excuse_later", 0.08],
    ]);
  }
  if (aff < 25) {
    return weighted<CallOutcome>([
      ["shy_deflect", 0.3 + cfg.shyP],
      ["you_call_me", 0.2],
      ["excuse_later", 0.2],
      ["will_call", 0.12 + cfg.callAcceptP * 0.15],
      ["recharge_first", 0.08 + cfg.greed * 0.1],
    ]);
  }
  return weighted<CallOutcome>([
    ["will_call", 0.3 + cfg.callAcceptP * 0.35],
    ["you_call_me", 0.2],
    ["excuse_later", 0.15],
    ["recharge_first", 0.1 + cfg.greed * 0.15],
    ["shy_deflect", 0.08],
  ]);
}

/* ------------------------------------------------------------------ */
/* Main planner (async ,  memory is now REALLY persisted, fixing the    */
/* dead fire-and-forget history path in the old sync reply fn)         */
/* ------------------------------------------------------------------ */

export async function planReply(
  profile: Profile,
  userText: string,
  opts: { isUserPhotoResolve?: boolean } = {},
): Promise<ReplyPlan> {
  const arch = (profile.archetype || "playful_tease") as CharacterArchetype;
  const cfg = getPersonaConfig(profile);
  const mem = await loadMemory(profile.id);
  const coins = getCoins();
  mem.turns += 1;

  // She said "you first" earlier ,  this message/photo resolves it
  if (mem.awaitingUserPhoto && !opts.isUserPhotoResolve) {
    mem.awaitingUserPhoto = false;
    const sendBack = Math.random() < 0.4 + cfg.sendPhotoP * 0.4;
    const text = pickCorpus(
      "compliment",
      arch,
      profile.id,
      mem,
      `awaitresolve:${arch}`,
      8,
      { lastUserText: userText },
    );
    mem.affection = Math.min(100, mem.affection + 4);
    const owed = exclusivePhoto(profile, cfg.unlockCost);
    const plan = buildPlan(mem, cfg, "photo_request", [text], {
      affectionDelta: 4,
      ...(sendBack
        ? {
            photo: {
              url: owed.url,
              cost: owed.cost,
              caption:
                owed.caption ||
                pickCorpus(
                  "photo_request",
                  arch,
                  profile.id,
                  mem,
                  `photo:send_locked:${arch}`,
                ),
            },
          }
        : {}),
    });
    pushTopic(mem, "photo_request");
    await saveMemory(profile.id, mem);
    return plan;
  }

  const intent = await matchIntentNLUCompat(userText);

  // Lazy "k" / "ok" replies for tiny user inputs (adds realism).
  const lazy = maybeLazy(userText, arch, profile.id, mem);
  if (lazy) {
    const plan = buildPlan(mem, cfg, "fallback", [lazy], { affectionDelta: 0 });
    pushTopic(mem, "short");
    await saveMemory(profile.id, mem);
    return plan;
  }

  // Topic-repeat redirect: same small-talk twice in a row → gambit, not pool
  const last = mem.lastTopics[mem.lastTopics.length - 1];
  if (
    last === intent &&
    (intent === "greeting" || intent === "compliment" || intent === "howru")
  ) {
    const text = pickCorpus(
      repeatCorpusIntent(),
      arch,
      profile.id,
      mem,
      `repeat:${arch}`,
      8,
      { lastUserText: userText },
    );
    const plan = buildPlan(mem, cfg, intent, [text], { affectionDelta: 1 });
    pushTopic(mem, intent);
    await saveMemory(profile.id, mem);
    return plan;
  }

  let plan: ReplyPlan;

  if (intent === "photo_request") {
    plan = await planPhotoReply(profile, arch, cfg, mem, coins);
  } else if (intent === "video_call") {
    plan = await planCallReply(profile, arch, cfg, mem, coins);
  } else if (intent === "greeting") {
    const sig = last === "greeting" ? `repeatgreet:${arch}` : `greet:${arch}`;
    const intent2 = last === "greeting" ? "greeting_return" : "greeting";
    const text = pickCorpus(intent2, arch, profile.id, mem, sig, 8, {
      lastUserText: userText,
    });
    plan = buildPlan(mem, cfg, intent, [text], { affectionDelta: 2 });
  } else if (intent === "compliment") {
    plan = buildPlan(
      mem,
      cfg,
      intent,
      [
        pickCorpus(
          "compliment",
          arch,
          profile.id,
          mem,
          `comp:${arch}`,
          8,
          { lastUserText: userText },
        ),
      ],
      {
        affectionDelta: 3,
      },
    );
  } else if (intent === "love") {
    plan = buildLoveReply(arch, cfg, mem, profile.id, userText);
  } else if (intent === "howru") {
    plan = buildPlan(
      mem,
      cfg,
      intent,
      [
        pickCorpus(
          "mood",
          arch,
          profile.id,
          mem,
          `howru:${arch}`,
          8,
          { lastUserText: userText },
        ),
      ],
      {
        affectionDelta: 2,
      },
    );
  } else if (intent === "about_her") {
    plan = buildPlan(
      mem,
      cfg,
      intent,
      [
        pickCorpus(
          "question_her",
          arch,
          profile.id,
          mem,
          `about:${arch}`,
          8,
          { lastUserText: userText },
        ),
      ],
      {
        affectionDelta: 2,
      },
    );
  } else if (intent === "thanks") {
    plan = buildPlan(
      mem,
      cfg,
      intent,
      [
        pickCorpus(
          "thanks",
          arch,
          profile.id,
          mem,
          `thanks:${arch}`,
          8,
          { lastUserText: userText },
        ),
      ],
      {
        affectionDelta: 2,
      },
    );
  } else if (intent === "bye") {
    plan = buildPlan(
      mem,
      cfg,
      intent,
      [
        pickCorpus(
          "bye",
          arch,
          profile.id,
          mem,
          `bye:${arch}`,
        ),
      ],
      {
        affectionDelta: 1,
      },
    );
  } else if (intent === "yes") {
    plan = buildPlan(
      mem,
      cfg,
      intent,
      [
        pickCorpus(
          "fallback",
          arch,
          profile.id,
          mem,
          `yes:${arch}`,
        ),
      ],
      {
        affectionDelta: 2,
      },
    );
  } else if (intent === "no") {
    plan = buildPlan(
      mem,
      cfg,
      intent,
      [
        pickCorpus(
          "fallback",
          arch,
          profile.id,
          mem,
          `no:${arch}`,
        ),
      ],
      {
        affectionDelta: 0,
      },
    );
  } else if (intent === "recharge") {
    plan = buildPlan(
      mem,
      cfg,
      intent,
      [
        pickCorpus(
          "recharge",
          arch,
          profile.id,
          mem,
          `rech:${arch}`,
        ),
      ],
      {
        affectionDelta: 2,
      },
    );
  } else if (intent === "bot") {
    plan = buildPlan(
      mem,
      cfg,
      intent,
      [
        pickCorpus(
          "fallback",
          arch,
          profile.id,
          mem,
          `bot:${arch}`,
        ),
      ],
      {
        affectionDelta: 0,
      },
    );
  } else {
    // Legacy topics (food/outfit/activity/whatsapp/short/fallback): reuse the
    // existing REPLY_SETS pools, now with REAL persisted anti-repeat memory.
    const legacyTopic =
      intent === "food" ||
      intent === "outfit" ||
      intent === "activity" ||
      intent === "whatsapp" ||
      intent === "short"
        ? intent
        : "fallback";
    const picked = pickLegacyReply(arch, legacyTopic, mem.recentSigs);
    const bubbles = picked.bubbles;
    const text = bubbles[0] ?? "acha, aur batao";
    mem.recentSigs.push(picked.sig);
    if (mem.recentSigs.length > 8) mem.recentSigs = mem.recentSigs.slice(-8);
    const nudge = pickNudge(arch);
    plan = buildPlan(mem, cfg, intent, bubbles.length > 0 ? bubbles : [text], {
      affectionDelta: 1,
      nudgeText: nudge?.text,
      nudgeDelayMs: nudge?.delayMs,
    });
  }

  // 20% nudge if planner didn't set one
  if (!plan.nudgeText) {
    const nudge = pickNudge(arch);
    if (nudge) {
      plan.nudgeText = nudge.text;
      plan.nudgeDelayMs = nudge.delayMs;
    }
  }

  pushTopic(mem, intent);
  mem.affection = Math.max(
    0,
    Math.min(100, mem.affection + plan.affectionDelta),
  );
  await saveMemory(profile.id, mem);
  return plan;
}

function pushTopic(mem: GirlMemory, intent: string): void {
  mem.lastTopics.push(intent);
  if (mem.lastTopics.length > 4) mem.lastTopics = mem.lastTopics.slice(-4);
}

async function planPhotoReply(
  profile: Profile,
  arch: CharacterArchetype,
  cfg: PersonaConfig,
  mem: GirlMemory,
  coins: number,
): Promise<ReplyPlan> {
  const outcome = rollPhotoOutcome(mem, cfg, coins, profile);
  const locked = exclusivePhoto(profile, cfg.unlockCost);
  const freeUrl = freeGalleryPhoto(profile);
  const say = (o: PhotoOutcome) =>
    pickPool(PHOTO_LINES[o], arch, mem, `photo:${o}:${arch}`, "shuffle");

  // If she has no locked photos, convert any locked outcome to send_free with cost 0
  if (locked.cost === 0 && outcome === "send_locked") {
    return buildPlan(mem, cfg, "photo_request", [say("send_free")], {
      affectionDelta: 4,
      photo: { url: freeUrl, cost: 0, caption: "" },
    });
  }

  switch (outcome) {
    case "send_locked":
      return buildPlan(mem, cfg, "photo_request", [say("send_locked")], {
        affectionDelta: 3,
        photo: { url: locked.url, cost: locked.cost, caption: locked.caption },
      });
    case "send_free":
      return buildPlan(mem, cfg, "photo_request", [say("send_free")], {
        affectionDelta: 4,
        photo: { url: freeUrl, cost: 0, caption: "" },
      });
    case "demand_first":
      mem.awaitingUserPhoto = true;
      return buildPlan(mem, cfg, "photo_request", [say("demand_first")], {
        affectionDelta: 2,
      });
    case "dont_know_how": {
      const fu = pickPool(
        PHOTO_FOLLOWUPS.dont_know_how,
        arch,
        mem,
        `photofu:dkh:${arch}`,
        "cycle",
      );
      return buildPlan(mem, cfg, "photo_request", [say("dont_know_how")], {
        affectionDelta: 1,
        followUp: { delayMs: jitter(30_000, 90_000), bubbles: [fu] },
      });
    }
    case "recharge_first":
      return buildPlan(mem, cfg, "photo_request", [say("recharge_first")], {
        affectionDelta: 1,
      });
    case "hesitant": {
      const fu = pickPool(
        PHOTO_FOLLOWUPS.hesitant_send,
        arch,
        mem,
        `photofu:hes:${arch}`,
        "cycle",
      );
      const laterLocked = exclusivePhoto(profile, cfg.unlockCost);
      return buildPlan(mem, cfg, "photo_request", [say("hesitant")], {
        affectionDelta: 2,
        followUp: {
          delayMs: jitter(20_000, 60_000),
          bubbles: [fu],
          photo: { url: laterLocked.url, cost: laterLocked.cost },
        },
      });
    }
    case "refuse_tease":
    default:
      return buildPlan(mem, cfg, "photo_request", [say("refuse_tease")], {
        affectionDelta: 0,
      });
  }
}

async function planCallReply(
  profile: Profile,
  arch: CharacterArchetype,
  cfg: PersonaConfig,
  mem: GirlMemory,
  coins: number,
): Promise<ReplyPlan> {
  const outcome = rollCallOutcome(mem, cfg, coins, profile.callRate || 10);
  const say = (o: CallOutcome) =>
    pickPool(CALL_LINES[o], arch, mem, `call:${o}:${arch}`, "shuffle");

  switch (outcome) {
    case "will_call":
      mem.promisedCall = true;
      return buildPlan(mem, cfg, "video_call", [say("will_call")], {
        affectionDelta: 4,
        // Random 20s - 6min. Nothing fixed, nothing prewritten-feeling.
        callRequest: { minMs: 20_000, maxMs: 6 * 60_000 },
      });
    case "you_call_me":
      return buildPlan(mem, cfg, "video_call", [say("you_call_me")], {
        affectionDelta: 3,
      });
    case "excuse_later": {
      mem.promisedCall = true;
      const excuse = pickPool(
        CALL_EXCUSES,
        arch,
        mem,
        `callexc:${arch}`,
        "cycle",
      );
      return buildPlan(mem, cfg, "video_call", [say("excuse_later")], {
        affectionDelta: 1,
        followUp: {
          delayMs: jitter(5 * 60_000, 15 * 60_000),
          bubbles: [excuse],
        },
      });
    }
    case "recharge_first":
      return buildPlan(mem, cfg, "video_call", [say("recharge_first")], {
        affectionDelta: 1,
      });
    case "shy_deflect":
    default:
      return buildPlan(mem, cfg, "video_call", [say("shy_deflect")], {
        affectionDelta: 1,
      });
  }
}

function buildLoveReply(
  arch: CharacterArchetype,
  cfg: PersonaConfig,
  mem: GirlMemory,
  profileId: string,
  lastUserText?: string,
): ReplyPlan {
  const text = pickCorpus("love", arch, profileId, mem, `love:${arch}`, 8, {
    lastUserText,
  });
  // High affection + chattiness: rare genuine afterthought bubble
  const extra =
    mem.affection > 55 && Math.random() < 0.25 + cfg.chattiness * 0.2
      ? [
          pickCorpus(
            "love",
            arch,
            profileId,
            mem,
            `love2:${arch}`,
            8,
            { lastUserText },
          ),
        ]
      : [];
  return buildPlan(mem, cfg, "love", [text, ...extra], { affectionDelta: 4 });
}

/* ------------------------------------------------------------------ */
/* User sends HER a photo (gallery picker) ,  she reacts, affection up  */
/* ------------------------------------------------------------------ */

export async function planUserPhotoReaction(
  profile: Profile,
): Promise<ReplyPlan> {
  const arch = (profile.archetype || "playful_tease") as CharacterArchetype;
  const cfg = getPersonaConfig(profile);
  const mem = await loadMemory(profile.id);
  mem.turns += 1;
  mem.userPhotoReceived = true;
  const wasAwaited = mem.awaitingUserPhoto;
  mem.awaitingUserPhoto = false;

  const text = pickPool(
    USER_PHOTO_REACT,
    arch,
    mem,
    `uphotoreact:${arch}`,
    "shuffle",
  );
  const boost = wasAwaited ? 10 : 7;
  const sendBack = Math.random() < 0.35 + cfg.sendPhotoP * 0.35;
  const owed = exclusivePhoto(profile, cfg.unlockCost);
  const plan = buildPlan(mem, cfg, "photo_request", [text], {
    affectionDelta: boost,
    ...(sendBack
      ? {
          photo: {
            url: owed.url,
            cost: wasAwaited ? 0 : owed.cost, // kept promise = exclusive FREE reward
            caption: wasAwaited
              ? `deal poori 😏 meri baari${owed.caption ? "\n" + owed.caption : ""}`
              : owed.caption,
          },
        }
      : {}),
  });
  pushTopic(mem, "photo_request");
  mem.affection = Math.max(0, Math.min(100, mem.affection + boost));
  await saveMemory(profile.id, mem);
  return plan;
}

/* ------------------------------------------------------------------ */
/* Deferred follow-up delivery ,  works whether her chat is open or     */
/* not (deliverLiveMessage notifies + updates open screens live).      */
/* ------------------------------------------------------------------ */

let followUpTimers: any[] = [];

export function cancelFollowUpTimers(): void {
  followUpTimers.forEach((t) => clearTimeout(t));
  followUpTimers = [];
}

export function schedulePlannedFollowUp(
  profileId: string,
  followUp: PlanFollowUp,
): void {
  const t = setTimeout(() => {
    (async () => {
      const first = followUp.bubbles[0] ?? "";
      if (followUp.photo) {
        await deliverLiveMessage(profileId, {
          id: `msg-follow-${Date.now()}-${profileId}`,
          sender: "profile",
          text: first || "ye lo 🙈",
          timestamp: Date.now(),
          status: "delivered",
          type: followUp.photo.cost > 0 ? "locked_photo" : "photo",
          mediaUrl: followUp.photo.url,
          isBlurred: followUp.photo.cost > 0,
          unlockCost: followUp.photo.cost > 0 ? followUp.photo.cost : undefined,
          isUnlocked: followUp.photo.cost === 0,
        });
      } else {
        await deliverLiveMessage(profileId, {
          id: `msg-follow-${Date.now()}-${profileId}`,
          sender: "profile",
          text: first,
          timestamp: Date.now(),
          status: "delivered",
        });
      }
      // Rare 2nd bubble in the follow-up
      if (followUp.bubbles[1]) {
        const t2 = setTimeout(
          () => {
            deliverLiveMessage(profileId, {
              id: `msg-follow2-${Date.now()}-${profileId}`,
              sender: "profile",
              text: followUp.bubbles[1],
              timestamp: Date.now(),
              status: "delivered",
            }).catch(() => {});
          },
          jitter(3000, 8000),
        );
        followUpTimers.push(t2);
      }
    })().catch(() => {});
  }, followUp.delayMs);
  followUpTimers.push(t);
}

/* ------------------------------------------------------------------ */
/* Proactive flirty initiations ,  SHE texts first to pull him back.    */
/* Hard register (user-approved): horny, direct, photo/call teases.    */
/* ~60% text flirt / ~25% locked-photo tease / ~15% call-tease.        */
/* Anti-repeat via the shared seen-counts + recentSigs memory.         */
/* ------------------------------------------------------------------ */

export interface ProactivePing {
  text: string;
  photo?: { url: string; cost: number; caption?: string };
  callTease?: boolean;
}

const PROACTIVE_TEXT: Pool = {
  playful_tease: [
    "kya kar rahe? main bed pe hu... ek photo bheju? 😜",
    "bore ho rahi hu 😒 video call pe aa na, kuch dikhaungi",
    "tumhari yaad aa rahi thi... aur kuch bhi 😏",
    "soye nahi abhi? achhi baat hai, main bhi jag rahi hu 🙈",
    "aaj mood bada garam hai 🔥 tum zimmedar ho",
    "kapde change kar rahi thi... tumhare khayal aa gaye 😜",
    "raat ko free ho? kuch plan banate hain 😏",
    "ek secret batau? aaj tumhare sapne dekhe 🙈",
    "phone me tumhara naam dekh ke smile aa gayi 😍",
    "aaj kuch pehna hai... dekhoge to pagal ho jaoge 😜",
  ],
  sweet_romantic: [
    "yaad aa rahi thi tumhari 🌸 kya kar rahe?",
    "neend nahi aa rahi... baat karein? ❤️",
    "aaj tumhare baare me soch rahi thi 🌷",
    "dil kar raha tha tumse baat karu 🙈",
    "tum online ho? please baat karo na ❤️",
    "aaj ka din tumhare bina adhoora laga 🌸",
    "raat ko chai pi rahi hu... tum hote to ☕❤️",
    "tumhari awaaz sunne ka mann kar raha hai 🌷",
    "sapne me tum aaye the... batau kya hua? 🙈",
    "tumse baat karke neend achhi aati hai ❤️",
  ],
  bold_alluring: [
    "soye nahi? main bhi jag rahi hu... ek photo bheju? 🔥",
    "tumhare liye kuch pehna hai... bheju? 😏",
    "bed pe hu... aur tum yahan nahi ho 💋 ye galat hai",
    "aaj raat kuch karne ka mann hai 🔥 tum ready ho?",
    "naha ke nikli hu... towel me hu 😏 imagine kar lo",
    "call pe aao, kuch dikhana hai... zyada mat sochna 🔥",
    "tum itne door kyu ho? paas hote to... 💋",
    "aaj bilkul control nahi ho raha 😏 tumhari galti hai",
    "ek photo li hai... dekhoge to so nahi paoge 🔥",
    "raat bhar jagna hai? mere saath? 😏",
  ],
  mysterious_sensual: [
    "aaj raat badi lambi hai... tum hote to ✨",
    "soch rahi thi tumhare baare me... 🌙",
    "chand dekh rahi hu... tumhari yaad aa gayi ✨",
    "neend me bhi tum... ye kya ho raha hai mujhe? 🌙",
    "aaj kuch alag feel ho raha hai... tumse baat karni hai ✨",
    "khidki pe baithi hu... tum hote to baahon me hoti 🌙",
    "tumhari yaadon ne sone nahi diya... ✨",
    "aaj raat tumhare naam... samajh jao 🌙",
    "dil dhadak raha hai... wajah tum ho ✨",
    "paas hote to kaan me kuch kehti... 🌙",
  ],
};

const PROACTIVE_PHOTO_CAPTION: Pool = {
  playful_tease: [
    "ye dekh 😜 unlock karo, andar sab kuch hai",
    "tumhare liye li hai 🙈 kholo na",
    "ye wali sirf tum dekhoge 😏 himmat hai to kholo",
    "dekh lo... phir mat kehna dikhaya nahi 😜",
  ],
  sweet_romantic: [
    "sirf aapke liye li hai 🌸 kholo na please",
    "sharma rahi hu 🙈 lekin aapke liye... kholo",
    "ye photo sirf aap dekhoge ❤️",
    "dil se bheji hai... kholo na 🌷",
  ],
  bold_alluring: [
    "ye dekh 🔥 unlock karo, dil tham ke",
    "tumhare liye... bina sharam ke 😏 kholo",
    "andar sab kuch hai 💋 bas ek click dur",
    "ye wali dekh ke so nahi paoge 🔥 kholo na",
  ],
  mysterious_sensual: [
    "ye lo ✨... himmat hai to kholo",
    "sirf tumhare liye 🌙 andar raaz hai",
    "dekhoge? phir bhool nahi paoge ✨",
    "ye wali khaas hai... kholo 🌙",
  ],
};

const PROACTIVE_CALL_TEASE: Pool = {
  playful_tease: [
    "call pe aao na 😜 kuch dikhana hai",
    "video call karo... surprise hai 🙈",
    "camera on kar rahi hu... aaoge? 😏",
  ],
  sweet_romantic: [
    "call pe aao na... awaaz sunni hai ❤️",
    "video call karein? dekhna hai tumhe 🌸",
    "thodi der baat karein call pe? 🙈",
  ],
  bold_alluring: [
    "call pe aao 🔥 kuch dikhana hai... live",
    "camera on hai... tum kahan ho? 😏",
    "video call karo, abhi 💋 wait kar rahi hu",
  ],
  mysterious_sensual: [
    "call pe aao... kuch kehna hai ✨",
    "awaaz sunni hai tumhari... call karo 🌙",
    "live milo... intezaar hai ✨",
  ],
};

/** Plan one proactive ping for a girl (scheduler calls this). */
export async function planProactivePing(
  profile: Profile,
): Promise<ProactivePing> {
  const arch = (profile.archetype || "playful_tease") as CharacterArchetype;
  const cfg = getPersonaConfig(profile);
  const mem = await loadMemory(profile.id);
  const roll = Math.random();
  let ping: ProactivePing;
  const hasLocked = (profile.lockedPhotos ?? []).length > 0;
  if (roll < 0.25 && hasLocked) {
    // Locked-photo tease - only for girls with blocked photos
    const owed = exclusivePhoto(profile, cfg.unlockCost);
    const caption = pickCorpus(
      "dirty_tease",
      arch,
      profile.id,
      mem,
      `proactive:photo:${arch}`,
    );
    ping = {
      text: caption,
      photo: { url: owed.url, cost: owed.cost, caption: owed.caption },
    };
  } else if (roll < 0.4) {
    // Call tease ,  text now, scheduler fires the incoming call after.
    ping = {
      text: pickCorpus(
        "dirty_tease",
        arch,
        profile.id,
        mem,
        `proactive:call:${arch}`,
      ),
      callTease: true,
    };
  } else {
    ping = {
      text: pickCorpus(
        "dirty_request",
        arch,
        profile.id,
        mem,
        `proactive:text:${arch}`,
      ),
    };
  }
  await saveMemory(profile.id, mem);
  return ping;
}
