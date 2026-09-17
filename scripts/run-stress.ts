import { runStressHarness } from '../src/services/stressHarness';

async function main() {
  const r = await runStressHarness(200);
  console.log(r.message);
  if (!r.pass) {
    console.error(JSON.stringify(r, null, 2));
    process.exit(1);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
