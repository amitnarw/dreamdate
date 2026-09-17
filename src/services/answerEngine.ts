/* ------------------------------------------------------------------ */
/* Answer engine ,  phase 1 of "she actually answers you" fix.           */
/*                                                                     */
/* Detects the SHAPE of user text (not the topic) so we can build a    */
/* reply that visibly responds to what he said, instead of falling     */
/* into a topic-canned pool that has nothing to do with his words.     */
/*                                                                     */
/* Inputs: raw user text.                                              */
/* Outputs:                                                             */
/*   shape        : yes_no_q | open_q | how_q | why_q | self_statement */
/*                | greeting_only | agreement | disagreement | other  */
/*   topic        : first usable keyword (>=3 chars, stopword-filtered) */
/*   allKeywords  : all usable keywords in original order               */
/*   veryShort    : he said <4 words                                    */
/*   isQuestion   : he asked something                                 */
/*   isCommand    : imperative shape                                    */
/* ------------------------------------------------------------------ */

export type AnswerShape =
  | "yes_no_q"
  | "open_q"
  | "how_q"
  | "why_q"
  | "when_q"
  | "where_q"
  | "what_q"
  | "who_q"
  | "self_statement"
  | "agreement"
  | "disagreement"
  | "command"
  | "feeling_share"
  | "other";

const QUESTION_WORDS_OPEN = new Set([
  "kya", "ky", "kyaa",
  "kyaa", "kyaaa",
]);

const QUESTION_WORDS_HOW = new Set(["kaise", "kese", "kaisay", "kaisa", "kaisi", "how"]);
const QUESTION_WORDS_WHY = new Set(["kyu", "kyun", "kyon", "kyunki", "kyn", "why"]);
const QUESTION_WORDS_WHEN = new Set(["kab", "ka", "when"]);
const QUESTION_WORDS_WHERE = new Set(["kaha", "kahin", "kahan", "kidhar", "where"]);
const QUESTION_WORDS_WHO = new Set(["kaun", "kon", "who"]);
const QUESTION_WORDS_WHAT = new Set(["kya", "what"]);

const AGREEMENT = new Set([
  "haan", "han", "ha", "ji", "ok", "okay", "okk", "sure",
  "sahi", "thik", "theek", "thik", "done", "done",
  "bilkul", "definitely", "yep", "yup", "yeah", "yes",
]);
const DISAGREEMENT = new Set([
  "nahi", "na", "naa", "nhi", "no", "nope", "nah",
  "bilkul nahi", "not", "matlab nahi",
]);

const STOPWORDS = new Set([
  "aur", "ya", "bhi", "me", "mein", "se", "par", "pe", "to",
  "hai", "hain", "ho", "hoon", "hun", "tha", "thi", "the",
  "ka", "ki", "ke", "ko", "kuch", "kisi", "kis", "kisiki",
  "aap", "tum", "tu", "main", "mujhe", "mujh", "hum",
  "yahin", "wahin", "kahin", "yahan", "wahan", "ab", "abhi",
  "kal", "aaj", "phir", "fir", "ek", "do", "teen", "ekdam",
  "hi", "theek", "achha", "acha", "matlab", "like",
  "are", "arey", "abe", "yaar", "oye", "ok",
  "kar", "kya", "raha", "rahi", "rahe", "wala", "wali", "wale",
  "please", "pls", "suno", "sun", "sunna", "sunlo",
  "this", "that", "the", "is", "am", "are", "was", "were",
  "do", "does", "did", "have", "has", "had",
  "i", "you", "we", "they", "he", "she", "it",
]);

const COMMAND_MARKERS = [
  "bhejo", "bhej", "bhejiye", "bhejna",
  "karo", "kar", "kijiye", "karna",
  "aao", "aana", "aa",
  "bolo", "bol", "bolna",
  "de", "de do", "dijiye", "dena",
  "dikhao", "dikha", "dikhao",
  "sunao", "suna", "sunana",
  "dikha", "dikhao", "batao", "bata", "batana",
  "mil", "milke", "milte", "milna",
  "baitho", "soyo", "soja", "uth",
  "chalo", "chal", "chalein",
  "lo", "lelo", "lein",
];

function normalize(text: string): string {
  return (
    " " +
    text
      .toLowerCase()
      .replace(/[?!.,;:'"()\[\]{}<>*~_#@+=/\\|<>]+/g, " ")
      .replace(/[.]+/g, " ")
      .replace(/\s+/g, " ")
      .trim() +
    " "
  );
}

function tokenize(text: string): string[] {
  const norm = normalize(text);
  return norm.split(/\s+/).filter((w) => w.length > 0);
}

export interface AnswerAnalysis {
  shape: AnswerShape;
  topic: string | null;
  allKeywords: string[];
  raw: string;
  clean: string;
  wordCount: number;
  veryShort: boolean;
  isQuestion: boolean;
  isCommand: boolean;
  questionWord: string | null;
  matchName?: boolean;
  matchLocation?: boolean;
  matchJob?: boolean;
  matchSelfStatement?: boolean;
  matchFeeling?: boolean;
}

function stripQuestionWord(tokens: string[]): string[] {
  if (tokens.length === 0) return tokens;
  const first = tokens[0];
  if (
    QUESTION_WORDS_OPEN.has(first) ||
    QUESTION_WORDS_HOW.has(first) ||
    QUESTION_WORDS_WHY.has(first) ||
    QUESTION_WORDS_WHEN.has(first) ||
    QUESTION_WORDS_WHERE.has(first) ||
    QUESTION_WORDS_WHO.has(first) ||
    QUESTION_WORDS_WHAT.has(first)
  ) {
    return tokens.slice(1);
  }
  return tokens;
}

function isCommandShape(text: string, tokens: string[]): boolean {
  const lc = text.toLowerCase();
  if (/[.!?]$/.test(text.trim()) && tokens.length > 0) {
    const last = tokens[tokens.length - 1];
    if (COMMAND_MARKERS.some((m) => last === m || last.startsWith(m))) return true;
  }
  if (COMMAND_MARKERS.some((m) => lc.endsWith(" " + m))) return true;
  if (COMMAND_MARKERS.some((m) => tokens.includes(m))) {
    if (tokens.length <= 8) return true;
  }
  return false;
}

function isYesNoQuestion(text: string, tokens: string[]): boolean {
  const lc = text.toLowerCase();
  if (/^(kya|ky) / .test(lc)) {
    const tail = lc.replace(/^(kya|ky) /, "").trim();
    if (tail.length < 80 && !/kaisa|kaise|kese|kya|kab|kaha|kyu|kyun|kaise|kyunki/.test(tail)) {
      return true;
    }
  }
  return false;
}

function isAgree(text: string): boolean {
  const t = text.trim().toLowerCase();
  for (const w of AGREEMENT) {
    if (t === w) return true;
    if (t.startsWith(w + " ")) {
      const rest = t.slice(w.length + 1);
      if (rest.length < 20) return true;
    }
  }
  return false;
}

function isDisagree(text: string): boolean {
  const t = text.trim().toLowerCase();
  for (const w of DISAGREEMENT) {
    if (t === w) return true;
  }
  if (/\bnahi\b/.test(t) && t.length < 25) return true;
  return false;
}

const NAME_PREFIXES = [
  "mera naam", "mera name", "mera nam", "main ", "i am ", "i'm ", "myself ",
  "my name is", "call me", "naam hai", "naam ",
];
const LOCATION_PREFIXES = [
  "main ", "hum ", "rehta hu", "rehti hu", "rehte hain", "rahta hu",
  "me hu", "me rehta", "me rehti", "from ", "i live in", "i am from",
  "se hu", "se hoon", "se hun",
];
const JOB_PREFIXES = [
  "main ", "me ", "kaam karta", "kaam karti", "karta hu", "karti hu",
  "study karta", "study karti", "padhai karta", "padhai karti",
  "job karta", "job karti", "profession ", "i work as", "i am a",
  "mai hu", "main hu",
];
const FEELING_PREFIXES = [
  "main ", "mujhe ", "aaj ", "abhi ", "ab ", "kal ",
  "feel ", "feeling ", "i feel", "i'm ", "i am ",
];

function startsWithAny(text: string, prefixes: string[]): boolean {
  const lc = text.toLowerCase().trim();
  return prefixes.some((p) => lc.startsWith(p));
}

function extractKeywords(tokens: string[]): string[] {
  const result: string[] = [];
  for (const t of tokens) {
    if (t.length < 3) continue;
    if (/^[.,!?]+$/.test(t)) continue;
    if (STOPWORDS.has(t)) continue;
    result.push(t);
    if (result.length >= 6) break;
  }
  return result;
}

export function analyseAnswer(text: string): AnswerAnalysis {
  const raw = text;
  const clean = text.trim();
  const tokens = tokenize(clean);
  const lc = " " + clean.toLowerCase() + " ";

  const wordCount = tokens.length;
  const veryShort = wordCount <= 4;

  let shape: AnswerShape = "other";
  let questionWord: string | null = null;
  let isQuestion = false;
  let isCommand = false;

  const FIRST = tokens[0] ?? "";
  if (QUESTION_WORDS_HOW.has(FIRST)) { shape = "how_q"; questionWord = FIRST; }
  else if (QUESTION_WORDS_WHY.has(FIRST)) { shape = "why_q"; questionWord = FIRST; }
  else if (QUESTION_WORDS_WHEN.has(FIRST)) { shape = "when_q"; questionWord = FIRST; }
  else if (QUESTION_WORDS_WHERE.has(FIRST)) { shape = "where_q"; questionWord = FIRST; }
  else if (QUESTION_WORDS_WHO.has(FIRST)) { shape = "who_q"; questionWord = FIRST; }
  else if (QUESTION_WORDS_WHAT.has(FIRST)) { shape = "what_q"; questionWord = FIRST; }
  else if (QUESTION_WORDS_OPEN.has(FIRST) || /^(kya|ky)$/.test(FIRST)) {
    if (isYesNoQuestion(clean, tokens)) {
      shape = "yes_no_q";
    } else {
      shape = "open_q";
    }
    questionWord = FIRST;
  }

  if (shape === "other") {
    if (isCommandShape(clean, tokens)) {
      shape = "command";
    } else if (isAgree(clean)) {
      shape = "agreement";
    } else if (isDisagree(clean)) {
      shape = "disagreement";
    } else if (tokens.length > 3 && startsWithAny(clean, NAME_PREFIXES)) {
      shape = "self_statement";
    } else if (tokens.length > 3 && startsWithAny(clean, FEELING_PREFIXES) &&
               /feel|lag|kar|ho\s|hai\s|hu\s|thi\s|lagi|lage|hoti|kharab|achha|good|bad|tired|happy|sad|khush|udaas/.test(lc)) {
      shape = "feeling_share";
    } else if (tokens.length > 3 && (startsWithAny(clean, LOCATION_PREFIXES))) {
      shape = "self_statement";
    } else if (tokens.length > 3 && (startsWithAny(clean, JOB_PREFIXES))) {
      shape = "self_statement";
    }
  }

  if (
    shape === "yes_no_q" || shape === "open_q" || shape === "how_q" ||
    shape === "why_q" || shape === "when_q" || shape === "where_q" ||
    shape === "who_q" || shape === "what_q"
  ) {
    isQuestion = true;
  }
  if (shape === "command") {
    isCommand = true;
  }

  const strippedTokens = stripQuestionWord(tokens);
  const allKeywords = extractKeywords(strippedTokens.length > 0 ? strippedTokens : tokens);

  const topic = allKeywords[0] ?? null;

  const matchName = /\b(naam|name)\b/.test(lc) ||
    startsWithAny(clean, NAME_PREFIXES);
  const matchLocation = /\b(se\s|mein|me\s|me hu|rahta|rehta|rehti|from\s|live)\b/.test(lc) &&
    startsWithAny(clean, LOCATION_PREFIXES);
  const matchJob = /\b(job|kaam|study|padhai|karta|karti|profession|work|work as)\b/.test(lc) &&
    startsWithAny(clean, JOB_PREFIXES);
  const matchSelfStatement = matchName || matchLocation || matchJob;
  const matchFeeling = shape === "feeling_share";

  return {
    shape,
    topic,
    allKeywords,
    raw,
    clean,
    wordCount,
    veryShort,
    isQuestion,
    isCommand,
    questionWord,
    matchName,
    matchLocation,
    matchJob,
    matchSelfStatement,
    matchFeeling,
  };
}

/* ------------------------------------------------------------------ */
/* Fact extraction: pull name/city/job out of an utterance.            */
/* Returns 0..1 facts. Persisted in GirlMemory by the caller.          */
/* ------------------------------------------------------------------ */

export interface ExtractedFacts {
  name?: string;
  location?: string;
  job?: string;
  feeling?: string;
}

export function extractFacts(text: string): ExtractedFacts {
  const lc = text.toLowerCase().trim();
  const tokens = tokenize(text);
  const facts: ExtractedFacts = {};

  const namePatterns = [
    /mera naam\s+([a-zA-Z\u0900-\u097F]{3,20})/i,
    /my name is\s+([a-zA-Z]{3,20})/i,
    /naam hai\s+([a-zA-Z\u0900-\u097F]{3,20})/i,
    /i am\s+([a-zA-Z]{3,20})/i,
    /main\s+([a-zA-Z\u0900-\u097F]{3,20})\s+hu/i,
  ];
  for (const p of namePatterns) {
    const m = lc.match(p);
    if (m) {
      const name = m[1].trim();
      if (!STOPWORDS.has(name)) {
        facts.name = name.charAt(0).toUpperCase() + name.slice(1);
        break;
      }
    }
  }

  const locPatterns = [
    /main\s+([a-zA-Z\u0900-\u097F]+)\s+me(?:in)?\s+rehta\s+hu/i,
    /main\s+([a-zA-Z\u0900-\u097F]+)\s+se\s+hu/i,
    /main\s+([a-zA-Z\u0900-\u097F]+)\s+me(?:in)?\s+hu/i,
    /i live in\s+([a-zA-Z]{3,20})/i,
    /from\s+([a-zA-Z]{3,20})/i,
  ];
  for (const p of locPatterns) {
    const m = lc.match(p);
    if (m) {
      const loc = m[1].trim().toLowerCase();
      if (!STOPWORDS.has(loc) && loc.length >= 3) {
        facts.location = loc;
        break;
      }
    }
  }

  const jobPatterns = [
    /main\s+([a-zA-Z\u0900-\u097F]+)\s+ka\s+kaam\s+karta\s+hu/i,
    /main\s+([a-zA-Z\u0900-\u097F]+)\s+hun/i,
    /i work as\s+(?:a\s+)?([a-zA-Z]{3,20})/i,
    /i am a\s+([a-zA-Z]{3,20})/i,
    /mai\s+([a-zA-Z\u0900-\u097F]+)\s+hu/i,
  ];
  for (const p of jobPatterns) {
    const m = lc.match(p);
    if (m) {
      const job = m[1].trim().toLowerCase();
      if (!STOPWORDS.has(job) && job.length >= 3) {
        if (!["mera", "bahut", "thoda", "kaam", "office", "ghar", "yaha", "waha"].includes(job)) {
          facts.job = job;
          break;
        }
      }
    }
  }

  const feelingMap: Array<[RegExp, string]> = [
    [/main\s+khush\s+hu|khush\s+hu|khush/i, "khush"],
    [/main\s+udaas|udaas\s+hu|sad/i, "udaas"],
    [/main\s+tired|thak\s+gaya|thak\s+gayi|tired/i, "thaki"],
    [/bore\s+ho\s+raha|bore\s+ho\s+rahi|bored/i, "bored"],
    [/mood\s+achha\s+hai|mood\s+good/i, "happy"],
    [/mood\s+kharab|mood\s+nahi/i, "low"],
    [/feel\s+good|feeling\s+good/i, "happy"],
    [/feel\s+bad|feeling\s+low/i, "low"],
  ];
  for (const [re, tag] of feelingMap) {
    if (re.test(lc)) { facts.feeling = tag; break; }
  }

  return facts;
}
