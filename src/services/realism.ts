/* ------------------------------------------------------------------ */
/* Time-of-day + persona-flavoured realism helpers (v3 phase 3).        */
/*                                                                     */
/* Day = 5-17, evening = 17-22, night = 22-5 (rough Hinglish bedtime   */
/* = 1am ish). Used to add sub-pool flavour and the imperfection      */
/* layer (drowsy night replies, busy-morning energy).                  */
/* ------------------------------------------------------------------ */

export type TodBucket = "morning" | "afternoon" | "evening" | "night";

export function getTodBucket(date: Date = new Date()): TodBucket {
  const h = date.getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 22) return "evening";
  return "night";
}

export function isNightNow(date: Date = new Date()): boolean {
  const h = date.getHours();
  return h >= 22 || h < 5;
}

/* ---------------- imperfection layer (Phase 3 §3.4) ---------------- */

const DROP_PUNCT_PROB = 0.08;
const LOWERCASE_PROB = 0.05;
const TYPING_RESTART_PROB = 0.12;

/** Optional pre-delivery: drop trailing punctuation, lowercase, "k" slang. */
export function applyImperfection(text: string): string {
  let out = text;
  if (Math.random() < LOWERCASE_PROB) {
    out = out.toLowerCase();
  } else if (Math.random() < DROP_PUNCT_PROB) {
    // Drop a trailing punctuation mark but keep the rest.
    out = out.replace(/([.!?])$/, "").replace(/,\s*$/, "");
  }
  // Occasional lazy "k" instead of "okay" — applied post-via the caller
  // if the original reply would have been "ok/okay/theek hai".
  return out;
}

/** Should the runner restart the typing dots after a brief pause? */
export function shouldTypingRestart(): boolean {
  return Math.random() < TYPING_RESTART_PROB;
}

/** A 0-1 → ms jittered typing-restart pause (1.2-3.5s). */
export function typingRestartDelayMs(): number {
  return 1200 + Math.floor(Math.random() * 2300);
}

/* ---------------- time-of-day flavour atoms (light, opt-in) -------- */

const TOD_OPENERS: Record<TodBucket, string[]> = {
  morning: [
    "good morning ji",
    "subah ho gayi",
    "chai piyoge",
    "uth gaye kya",
  ],
  afternoon: [
    "dopahar ho gayi",
    "lunch kiya kya",
    "aaj khaana kya khaya",
    "chai pi",
  ],
  evening: [
    "shaam ho gayi",
    "chai time",
    "aaj din kesa gaya",
    "evening vibes",
  ],
  night: [
    "raat ho gayi",
    "late night me",
    "soye nahi abhi",
    "raat ki baat",
  ],
};

const TOD_SUFFIXES: Record<TodBucket, string[]> = {
  morning: [
    " chai ke saath socho",
    " din shubh ho",
    " tabiyat achhi rahe",
    " jaldi uth jana",
  ],
  afternoon: [
    " kuch kha lo",
    " break le lo thoda",
    " garmi me paani piyo",
    " thoda rest karo",
  ],
  evening: [
    " aaj shaam sundar hai",
    " chai le aao",
    " plan hai kuch",
    " fresh ho jao",
  ],
  night: [
    " jaag rahe ho",
    " kal subah ka socho",
    " thak gaye hoge",
    " so jana phir",
    " neend aa rahi",
  ],
};

/**
 * Optionally prepend/append a tod flavour. Probabilistic (~35%) so the
 * corpus still dominates; only applies when the corpus pick doesn't
 * already reference tod (no "raat" word inside).
 */
export function maybeTimeFlavor(text: string, tod: TodBucket = getTodBucket()): string {
  if (Math.random() > 0.35) return text;
  const nightMarkers = ["raat", "neend", "soye", "late", "subah", "shaam", "morning", "evening", "dopahar"];
  const lc = text.toLowerCase();
  if (nightMarkers.some((m) => lc.includes(m))) return text;
  const kind = Math.random() < 0.5 ? "prepend" : "append";
  if (kind === "prepend") {
    return `${TOD_OPENERS[tod][Math.floor(Math.random() * TOD_OPENERS[tod].length)]} , ${text}`;
  }
  return `${text}${TOD_SUFFIXES[tod][Math.floor(Math.random() * TOD_SUFFIXES[tod].length)]}`;
}

/* ---------------- short human responses (lazy/k/ok class) ---------- */

const LAZY_RESPONSES = ["k", "ok", "hmm", "acha", "theek", "okk", "k done", "ok bye"];

/** For very low-effort user messages, occasionally reply with a lazy ack. */
export function maybeLazyAck(text: string): string | null {
  if (text.trim().length > 12) return null;
  const lc = text.trim().toLowerCase();
  if (/^(k+|ok+|hmm+|acha|achha|thik|theek|hi+|hii+|hey+|haan|ha|sahi)$/.test(lc)) {
    if (Math.random() < 0.5) {
      return LAZY_RESPONSES[Math.floor(Math.random() * LAZY_RESPONSES.length)];
    }
  }
  return null;
}
