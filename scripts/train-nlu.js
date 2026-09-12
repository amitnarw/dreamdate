#!/usr/bin/env node
/**
 * train-nlu.js ,  build-time NLU trainer.
 *
 * Runs at dev-time on a PC (not on device). Trains a node-nlp-rn model on
 * the v3 NLU corpus (scripts/nluCorpus.ts), exports the trained model JSON,
 * and writes it to assets/nlu-model.json (bundled into the app).
 *
 * Runtime path: src/services/nluService.ts loads the bundled JSON via
 * `manager.import()` on first use. Zero training happens on device.
 *
 * Re-run after editing nluCorpus.ts:
 *   node scripts/train-nlu.js
 */
const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");

async function main() {
  const repoRoot = path.resolve(__dirname, "..");
  const corpusPath = path.join(repoRoot, "scripts", "nluCorpus.ts");
  const outPath = path.join(repoRoot, "assets", "nlu-model.json");

  // Transpile corpus TS -> JS using esbuild (no type-only issues, pure data).
  const corpusSrc = fs.readFileSync(corpusPath, "utf8");
  const corpusJs = esbuild.transformSync(corpusSrc, {
    loader: "ts",
    format: "cjs",
  }).code;
  const fakeModule = { exports: {} };
  // eslint-disable-next-line no-new-func
  const wrapper = new Function(
    "module",
    "exports",
    "require",
    corpusJs
  );
  wrapper(fakeModule, fakeModule.exports, require);
  const { NLU_TRAINING_CORPUS } = fakeModule.exports;

  console.log(
    "[train-nlu] intents:",
    NLU_TRAINING_CORPUS.length,
    "; total utterances:",
    NLU_TRAINING_CORPUS.reduce((s, r) => s + r.utterances.length, 0)
  );

  const { NlpManager } = require("node-nlp-rn");
  const manager = new NlpManager({
    languages: ["hi", "en"],
    forceNER: false,
    nlu: { log: false },
  });

  for (const row of NLU_TRAINING_CORPUS) {
    for (const utt of row.utterances) {
      // Train both languages so Hinglish utterances + English coverage work.
      manager.addDocument("hi", utt, row.intent);
      manager.addDocument("en", utt, row.intent);
    }
    manager.addAnswer("hi", row.intent, "ok");
    manager.addAnswer("en", row.intent, "ok");
  }

  const t0 = Date.now();
  await manager.train();
  console.log("[train-nlu] train: " + (Date.now() - t0) + "ms");

  const exported = manager.export();
  // Ensure assets dir exists.
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(exported), "utf8");
  const sizeKB = Math.round(JSON.stringify(exported).length / 1024);
  console.log("[train-nlu] wrote", outPath, "(" + sizeKB + "KB)");

  // Sanity-check a few unseen variants (proves fuzzy matching works).
  const tests = [
    ["bhai kya haal", "greeting"],
    ["thoda sexy photo bhej do na", "dirty_request"],
    ["ek dam gussa aa gaya yaar", "anger"],
    ["kapde nahi pehni aaj", "outfit"],
    ["bore ho rahi thi", "mood"],
    ["kuch sunao mazaak", "joke"],
    ["thoda time laga", "fallback"],
  ];
  let correct = 0;
  for (const [t, expected] of tests) {
    const r = await manager.process("hi", t);
    const ok = r.intent === expected;
    if (ok) correct++;
    console.log(
      "[train-nlu] " + (ok ? "PASS" : "FAIL") + "  '" + t + "' -> " + r.intent + " (" + r.score.toFixed(2) + ")" + (ok ? "" : " expected " + expected)
    );
  }
  console.log("[train-nlu] smoke: " + correct + "/" + tests.length);
}

main().catch((e) => {
  console.error("[train-nlu] FAILED:", e);
  process.exit(1);
});
