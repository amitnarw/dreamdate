import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { activateWeeklyVip, addCoins } from "./wallet";

/* ------------------------------------------------------------------ */
/* Dev sheet — passcode-gated testing tools.                            */
/*                                                                     */
/* Lives in EVERY build (dev, release, published Play APK). The        */
/* only lock is the 4-digit numeric passcode (default 2760,            */
/* user-changeable in-sheet). 3 wrong attempts = 60s lockout.         */
/*                                                                     */
/* Money grants are logged with source: "dev" so the txn log          */
/* remains a single source of truth.                                  */
/* ------------------------------------------------------------------ */

const PASSCODE_KEY = "@dreamdate_dev_passcode_v1";
const DEFAULT_PASSCODE = "2760";
const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 60 * 1000;
const PASSCODE_LEN = 4;

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => {
    try {
      l();
    } catch (e) {}
  });
}

export function subscribeDevTools(cb: Listener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

let cachedPasscode: string | null = null;

async function loadPasscode(): Promise<string> {
  if (cachedPasscode) return cachedPasscode;
  try {
    const v = await AsyncStorage.getItem(PASSCODE_KEY);
    cachedPasscode = v || DEFAULT_PASSCODE;
  } catch (e) {
    cachedPasscode = DEFAULT_PASSCODE;
  }
  return cachedPasscode;
}

let attempts = 0;
let lockoutUntil = 0;

export interface PasscodeCheckResult {
  ok: boolean;
  locked: boolean;
  remainingMs: number;
  remainingAttempts: number;
}

export function getLockoutRemainingMs(): number {
  return Math.max(0, lockoutUntil - Date.now());
}

export async function checkPasscode(input: string): Promise<PasscodeCheckResult> {
  const now = Date.now();
  if (now < lockoutUntil) {
    return {
      ok: false,
      locked: true,
      remainingMs: lockoutUntil - now,
      remainingAttempts: 0,
    };
  }
  const expected = await loadPasscode();
  const ok = input === expected;
  if (ok) {
    attempts = 0;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
    return {
      ok: true,
      locked: false,
      remainingMs: 0,
      remainingAttempts: MAX_ATTEMPTS,
    };
  }
  attempts += 1;
  if (attempts >= MAX_ATTEMPTS) {
    lockoutUntil = now + LOCKOUT_MS;
    attempts = 0;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (e) {}
    return {
      ok: false,
      locked: true,
      remainingMs: LOCKOUT_MS,
      remainingAttempts: 0,
    };
  }
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (e) {}
  return {
    ok: false,
    locked: false,
    remainingMs: 0,
    remainingAttempts: MAX_ATTEMPTS - attempts,
  };
}

export async function setPasscode(newCode: string): Promise<boolean> {
  if (!/^\d{4}$/.test(newCode)) return false;
  cachedPasscode = newCode;
  try {
    await AsyncStorage.setItem(PASSCODE_KEY, newCode);
  } catch (e) {}
  notify();
  return true;
}

async function logDevGrant(label: string, amount: number): Promise<void> {
  try {
    const mod = await import("@react-native-async-storage/async-storage");
    const AS = (mod as any).default ?? mod;
    const raw = await AS.getItem("@dreamdate_upi_txn_log_v1");
    const log: any[] = raw ? JSON.parse(raw) : [];
    log.push({
      ts: Date.now(),
      kind: "dev_grant",
      label,
      amount,
      source: "dev",
    });
    while (log.length > 50) log.shift();
    await AS.setItem("@dreamdate_upi_txn_log_v1", JSON.stringify(log));
  } catch (e) {}
}

export const devActions = {
  addCoins: async (amount: number): Promise<number> => {
    const next = await addCoins(amount);
    await logDevGrant(`+${amount} coins`, amount);
    notify();
    return next;
  },
  activateVip: async (): Promise<void> => {
    await activateWeeklyVip(1500);
    await logDevGrant("+VIP 7d", 0);
    notify();
  },
  resetWallet: async (): Promise<void> => {
    const mod = await import("@react-native-async-storage/async-storage");
    const AS = (mod as any).default ?? mod;
    await AS.setItem("@dreamdate_user_coins_v2", "50");
    notify();
  },
  resetRepeatLedger: async (): Promise<void> => {
    const mod = await import("@react-native-async-storage/async-storage");
    const AS = (mod as any).default ?? mod;
    const all: string[] = await AS.getAllKeys();
    const keys = all.filter((k: string) =>
      k.startsWith("@dreamdate_repeat_ledger_v1_"),
    );
    if (keys.length) await AS.multiRemove(keys);
    notify();
  },
  bumpAffection: async (profileId: string, delta = 5): Promise<void> => {
    const mod = await import("@react-native-async-storage/async-storage");
    const AS = (mod as any).default ?? mod;
    const k = `@dreamdate_girl_memory_v1_${profileId}`;
    const raw = await AS.getItem(k);
    const mem = raw ? JSON.parse(raw) : {};
    mem.affection = Math.max(0, Math.min(100, (mem.affection ?? 25) + delta));
    await AS.setItem(k, JSON.stringify(mem));
    notify();
  },
};

export const DEV_PASSCODE_LEN = PASSCODE_LEN;
export const DEV_DEFAULT_PASSCODE = DEFAULT_PASSCODE;
