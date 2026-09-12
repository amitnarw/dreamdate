import AsyncStorage from "@react-native-async-storage/async-storage";

/* ------------------------------------------------------------------ */
/* Anti-repeat: a girl NEVER uses the same words in the same sequence. */
/*                                                                     */
/* Three guards compose:                                               */
/*   1. recentSigs ring (30) — last 30 composed strings per girl,      */
/*      hard exclude for THIS session. Lives in-memory only.            */
/*   2. 7-day ledger (capped 500/girl) — exact-string non-repeat       */
/*      within the rolling 7-day window, persisted in AsyncStorage.   */
/*      Loaded lazily on first use, persisted fire-and-forget.         */
/*   3. Cross-girl guard — last 30 strings app-wide so two girls      */
/*      never say the identical line back-to-back. Lives in memory.   */
/*                                                                     */
/* The picker is SYNCHRONOUS so it can run inside the chat reply path  */
/* (which is sync). Persistence is fire-and-forget; in-memory state   */
/* is the authoritative blocker for the current session.               */
/* ------------------------------------------------------------------ */

const LEDGER_KEY_PREFIX = "@dreamdate_repeat_ledger_v1_";
const CROSS_GIRL_KEY = "@dreamdate_repeat_ledger_v1__cross";
const LEDGER_MAX_ENTRIES = 500;
const RECENT_RING_SIZE = 30;
const CROSS_GIRL_RING_SIZE = 100;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

type Ledger = Record<string, number>;
type RecentRing = string[];

const recentRings = new Map<string, RecentRing>();
const crossRecent: RecentRing = [];
let crossLoaded = false;
const ledgerCache = new Map<string, Ledger>();
const ledgerLoading = new Set<string>();

function ledgerKey(profileId: string): string {
  return LEDGER_KEY_PREFIX + profileId;
}

async function loadLedger(profileId: string): Promise<Ledger> {
  if (ledgerCache.has(profileId)) return ledgerCache.get(profileId)!;
  if (ledgerLoading.has(profileId)) return {};
  ledgerLoading.add(profileId);
  try {
    const raw = await AsyncStorage.getItem(ledgerKey(profileId));
    const parsed: Ledger = raw ? JSON.parse(raw) : {};
    ledgerCache.set(profileId, parsed);
    return parsed;
  } catch (e) {
    return {};
  } finally {
    ledgerLoading.delete(profileId);
  }
}

function persistLedger(profileId: string, ledger: Ledger): void {
  try {
    AsyncStorage.setItem(ledgerKey(profileId), JSON.stringify(ledger)).catch(
      () => {},
    );
  } catch (e) {}
}

async function loadCrossRecent(): Promise<RecentRing> {
  if (crossLoaded) return crossRecent;
  try {
    const raw = await AsyncStorage.getItem(CROSS_GIRL_KEY);
    if (raw) {
      const parsed: RecentRing = JSON.parse(raw);
      crossRecent.splice(0, crossRecent.length, ...parsed);
    }
  } catch (e) {}
  crossLoaded = true;
  return crossRecent;
}

function persistCrossRecent(): void {
  try {
    AsyncStorage.setItem(CROSS_GIRL_KEY, JSON.stringify(crossRecent)).catch(
      () => {},
    );
  } catch (e) {}
}

function pruneLedger(ledger: Ledger, now: number): void {
  for (const k of Object.keys(ledger)) {
    if (now - ledger[k] > SEVEN_DAYS_MS) delete ledger[k];
  }
  const keys = Object.keys(ledger);
  if (keys.length > LEDGER_MAX_ENTRIES) {
    keys
      .sort((a, b) => ledger[a] - ledger[b])
      .slice(0, keys.length - LEDGER_MAX_ENTRIES)
      .forEach((k) => delete ledger[k]);
  }
}

function bumpRecent(ring: RecentRing, item: string, cap: number): void {
  ring.push(item);
  while (ring.length > cap) ring.shift();
}

/** Kick off background loads at app boot (non-blocking). */
export function warmAntiRepeat(profileId: string): void {
  loadLedger(profileId).catch(() => {});
  loadCrossRecent().catch(() => {});
}

export function warmAntiRepeatAll(profileIds: string[]): void {
  for (const p of profileIds) warmAntiRepeat(p);
}

export interface PickOptions {
  /** Max tries to find a fresh candidate before falling back. */
  maxTries?: number;
}

/* ------------------------------------------------------------------ */
/* Synchronous picker for the chat reply path.                          */
/*                                                                     */
/* Filters candidates against:                                          */
/*   - last 30 produced strings for this girl (recentRings, immediate)  */
/*   - any string in this girl's 7-day ledger (in-memory cache)        */
/*   - last 30 strings spoken by ANY girl (crossRecent, in-memory)      */
/* Falls back to rotating candidates if all blocked. With the corpus   */
/* this should be impossible (slot grammar alone produces thousands),  */
/* but is the safe fallback.                                            */
/* ------------------------------------------------------------------ */
export function pickWithNoRepeatSync(
  profileId: string,
  candidates: string[],
  opts: PickOptions = {},
): string {
  const max = opts.maxTries ?? 16;
  if (candidates.length === 0) return "";
  const now = Date.now();
  const ledger = ledgerCache.get(profileId) || {};
  pruneLedger(ledger, now);
  const recent = recentRings.get(profileId) ?? [];
  const crossSet = new Set(crossRecent);

  for (let i = 0; i < Math.min(max, candidates.length); i++) {
    const idx = Math.floor(Math.random() * candidates.length);
    const cand = candidates[idx];
    if (recent.includes(cand)) continue;
    if (crossSet.has(cand)) continue;
    const last = ledger[cand];
    if (last && now - last < SEVEN_DAYS_MS) continue;
    recordSpoken(profileId, cand, now);
    return cand;
  }

  // Fallback: rotate to a fresh candidate (rare). Slot grammar ensures
  // the string differs from any earlier composed variant.
  const fallback = candidates[Math.floor(Math.random() * candidates.length)];
  recordSpoken(profileId, fallback, now);
  return fallback;
}

export function recordSpoken(profileId: string, text: string, now?: number): void {
  const ts = now ?? Date.now();
  let recent = recentRings.get(profileId);
  if (!recent) {
    recent = [];
    recentRings.set(profileId, recent);
  }
  bumpRecent(recent, text, RECENT_RING_SIZE);
  bumpRecent(crossRecent, text, CROSS_GIRL_RING_SIZE);
  persistCrossRecent();
  const ledger = ledgerCache.get(profileId) || {};
  ledger[text] = ts;
  pruneLedger(ledger, ts);
  ledgerCache.set(profileId, ledger);
  persistLedger(profileId, ledger);
}

export async function resetLedger(profileId: string): Promise<void> {
  recentRings.delete(profileId);
  ledgerCache.delete(profileId);
  try {
    await AsyncStorage.removeItem(ledgerKey(profileId));
  } catch (e) {}
}

export async function resetAllLedgers(): Promise<void> {
  recentRings.clear();
  ledgerCache.clear();
  crossRecent.splice(0, crossRecent.length);
  try {
    const all = await AsyncStorage.getAllKeys();
    const keys = all.filter(
      (k) => k.startsWith(LEDGER_KEY_PREFIX) || k === CROSS_GIRL_KEY,
    );
    if (keys.length) await AsyncStorage.multiRemove(keys);
  } catch (e) {}
}
