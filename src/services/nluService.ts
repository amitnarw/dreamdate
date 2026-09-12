/* ------------------------------------------------------------------ */
/* NLU service — pre-trained intent brain.                            */
/*                                                                     */
/* The trained model JSON (`assets/nlu-model.json`) is bundled into   */
/* the app. We `manager.import()` it once at first use. ZERO training */
/* happens on device. The trainer (`scripts/train-nlu.js`) runs at   */
/* build-time on the developer's PC.                                 */
/*                                                                     */
/* Use:                                                                */
/*   const intent = await matchIntentNLU("ek sexy photo bhej");       */
/*   // -> "dirty_request" (or other trained intent)                    */
/*                                                                     */
/* Returns: { intent: string, score: number }                          */
/*                                                                     */
/* Fallback: if anything fails (Expo Go, asset missing, model bad),  */
/* returns { intent: "fallback", score: 0 } so callers can detect.   */
/* ------------------------------------------------------------------ */

import { NlpManager } from "node-nlp-rn";

type Classification = { intent: string; score: number };

// `require()` of a JSON file returns the parsed object directly — NOT an
// asset reference. Do NOT pass it to expo-asset's Asset.fromModule (that
// would throw CodedError in the native layer). Metro inlines the JSON
// into the bundle.
const MODEL_MODULE: any = require("../../assets/nlu-model.json");

let loaded = false;
let manager: NlpManager | null = null;
let loadingPromise: Promise<void> | null = null;

async function ensureLoaded(): Promise<void> {
  if (loaded) return;
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    try {
      manager = new NlpManager({
        languages: ["hi", "en"],
        forceNER: false,
      });
      manager.import(MODEL_MODULE);
      loaded = true;
      // Single diagnostic line, no dump — proves the model is in memory.
      console.log("[nluService] model imported, ready");
    } catch (e: any) {
      loaded = false;
      console.warn(
        "[nluService] load failed:",
        String(e?.message ?? e).slice(0, 200),
      );
    } finally {
      loadingPromise = null;
    }
  })();
  return loadingPromise;
}

/**
 * Eagerly kick off model loading. Call from app bootstrap so the first
 * user message doesn't pay the import latency.
 */
export function warmNLU(): void {
  ensureLoaded().catch(() => {});
}

/**
 * Classify a user message into a trained intent. Always resolves; on
 * failure returns a low-confidence fallback so callers can short-circuit.
 */
export async function matchIntentNLU(
  text: string,
): Promise<Classification> {
  const cleaned = (text || "").trim();
  if (!cleaned) return { intent: "fallback", score: 0 };
  await ensureLoaded();
  if (!loaded || !manager) return { intent: "fallback", score: 0 };
  try {
    // Try Hindi first (most common for our Hinglish users), then English
    // as a fallback for purely-English inputs.
    let r: any = await manager.process("hi", cleaned);
    if (!r || !r.intent || r.score < 0.5) {
      const en = await manager.process("en", cleaned);
      if (en && en.score > (r?.score ?? 0)) r = en;
    }
    if (!r || !r.intent) return { intent: "fallback", score: 0 };
    return { intent: r.intent, score: r.score };
  } catch (e) {
    return { intent: "fallback", score: 0 };
  }
}

/** True once the model is loaded and ready to classify. */
export function isNLUReady(): boolean {
  return loaded;
}
