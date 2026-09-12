import AsyncStorage from "@react-native-async-storage/async-storage";
import { MOCK_PROFILES, Profile } from "../data/mockProfiles";
import {
  deliverLiveMessage,
  getActiveChatProfileId,
} from "./chatEngine";
import { incomingCallService } from "./incomingCallService";
import { planProactivePing } from "./personaEngine";

/* ------------------------------------------------------------------ */
/* Proactive flirty initiations ,  SHE texts first to pull him back.    */
/*                                                                     */
/* - Per girl every 10-15 min (jittered phase, staggered, never two    */
/*   at once).                                                         */
/* - Only girls with an existing thread (funnel opener or organic ,     */
/*   nothing fabricated before first contact).                         */
/* - Skips her if the thread had ANY message in the last 30 min (no    */
/*   spam mid-conversation).                                           */
/* - Global caps: max 3 pings per rolling hour, min 4 min between any  */
/*   two pings.                                                        */
/* - Delivered via deliverLiveMessage → notification + sound + unread  */
/*   when he's elsewhere; silent in-thread arrival when he's inside    */
/*   her open chat (marked read, no sound, same as her normal reply).  */
/* - Call-tease pings are followed by a real incoming call 1-3 min     */
/*   later.                                                            */
/* - Timers die with the app; next-ping timestamps persist, so boot    */
/*   re-arms everything (overdue pings fire staggered 30-120s after    */
/*   launch, never a burst).                                           */
/* ------------------------------------------------------------------ */

const STATE_KEY = "@dreamdate_proactive_state_v1";
const CHAT_HISTORY_PREFIX = "@dreamdate_chat_history_v5_";
const ACTIVE_THREADS_KEY = "@dreamdate_active_chat_threads_v5";

const PING_MIN_MS = 10 * 60 * 1000;
const PING_MAX_MS = 15 * 60 * 1000;
const STALE_THREAD_MS = 30 * 60 * 1000;
const GLOBAL_HOUR_CAP = 3;
const MIN_GAP_MS = 4 * 60 * 1000;

interface ProactiveState {
  nextPingAt: Record<string, number>;
  pingLog: number[];
}

function jitter(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min));
}

async function readState(): Promise<ProactiveState> {
  try {
    const raw = await AsyncStorage.getItem(STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        nextPingAt: parsed.nextPingAt ?? {},
        pingLog: Array.isArray(parsed.pingLog) ? parsed.pingLog : [],
      };
    }
  } catch (e) {}
  return { nextPingAt: {}, pingLog: [] };
}

async function writeState(state: ProactiveState): Promise<void> {
  try {
    await AsyncStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch (e) {}
}

let timers: any[] = [];
let loopStarted = false;

export function stopProactiveTimers(): void {
  timers.forEach((t) => clearTimeout(t));
  timers = [];
  loopStarted = false;
}

function track(t: any): void {
  timers.push(t);
}

function pruneLog(state: ProactiveState, now: number): void {
  state.pingLog = state.pingLog.filter((ts) => now - ts < 60 * 60 * 1000);
}

async function getThreadedProfileIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_THREADS_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    return ids.filter((id) => MOCK_PROFILES.some((p) => p.id === id));
  } catch (e) {
    return [];
  }
}

async function threadLastMessageAt(profileId: string): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(CHAT_HISTORY_PREFIX + profileId);
    const history: any[] = raw ? JSON.parse(raw) : [];
    if (history.length === 0) return 0;
    return history[history.length - 1]?.timestamp ?? 0;
  } catch (e) {
    return 0;
  }
}

async function firePing(profile: Profile): Promise<void> {
  const now = Date.now();
  const state = await readState();
  pruneLog(state, now);

  // Global caps (re-checked at fire time, not just schedule time).
  if (state.pingLog.length >= GLOBAL_HOUR_CAP) {
    await reschedule(profile.id, now + jitter(15 * 60 * 1000, 25 * 60 * 1000));
    return;
  }
  const lastPing = state.pingLog[state.pingLog.length - 1] ?? 0;
  if (now - lastPing < MIN_GAP_MS) {
    await reschedule(profile.id, lastPing + MIN_GAP_MS + jitter(0, 60 * 1000));
    return;
  }

  // Skip mid-conversation threads (any message in the last 30 min).
  const lastMsg = await threadLastMessageAt(profile.id);
  if (lastMsg > 0 && now - lastMsg < STALE_THREAD_MS) {
    await reschedule(profile.id, now + jitter(5 * 60 * 1000, 10 * 60 * 1000));
    return;
  }

  const ping = await planProactivePing(profile).catch(() => null);
  if (!ping) {
    await reschedule(profile.id, now + jitter(PING_MIN_MS, PING_MAX_MS));
    return;
  }

  const ts = Date.now();
  if (ping.photo) {
    await deliverLiveMessage(profile.id, {
      id: `msg-proactive-${profile.id}-${ts}`,
      sender: "profile",
      text: ping.text,
      timestamp: ts,
      status: "delivered",
      type: "locked_photo",
      mediaUrl: ping.photo.url,
      isBlurred: ping.photo.cost > 0,
      unlockCost: ping.photo.cost,
      isUnlocked: ping.photo.cost === 0,
    }).catch(() => {});
  } else {
    await deliverLiveMessage(profile.id, {
      id: `msg-proactive-${profile.id}-${ts}`,
      sender: "profile",
      text: ping.text,
      timestamp: ts,
      status: "delivered",
    }).catch(() => {});
  }

  // Call tease: she says "call pe aao", then she actually calls 1-3 min later.
  if (ping.callTease && getActiveChatProfileId() !== profile.id) {
    incomingCallService
      .requestCallFrom(profile.id, 60_000, 180_000)
      .catch(() => {});
  }

  const cur = await readState();
  pruneLog(cur, Date.now());
  cur.pingLog.push(Date.now());
  await writeState(cur);
  await reschedule(profile.id, Date.now() + jitter(PING_MIN_MS, PING_MAX_MS));
}

async function reschedule(profileId: string, atMs: number): Promise<void> {
  const state = await readState();
  state.nextPingAt[profileId] = atMs;
  await writeState(state);
  arm(profileId, Math.max(0, atMs - Date.now()));
}

function arm(profileId: string, delayMs: number): void {
  const profile = MOCK_PROFILES.find((p) => p.id === profileId);
  if (!profile) return;
  track(
    setTimeout(() => {
      firePing(profile).catch(() => {});
    }, delayMs),
  );
}

/**
 * Idempotent boot entry. Re-arms per-girl timers from persisted
 * next-ping timestamps; overdue pings fire staggered (never a burst).
 */
export async function startProactiveLoop(): Promise<void> {
  if (loopStarted) return;
  loopStarted = true;
  try {
    const state = await readState();
    const now = Date.now();
    pruneLog(state, now);
    await writeState(state);

    const threaded = await getThreadedProfileIds();
    let stagger = 0;
    for (const pid of threaded) {
      const due = state.nextPingAt[pid];
      if (typeof due === "number" && due > now) {
        arm(pid, due - now);
      } else if (typeof due === "number") {
        // Overdue (app was dead) ,  stagger to avoid a message burst.
        stagger += jitter(30 * 1000, 120 * 1000);
        const at = now + stagger;
        state.nextPingAt[pid] = at;
        arm(pid, stagger);
      } else {
        // New thread since last run ,  first ping in a full cadence window.
        const at = now + jitter(PING_MIN_MS, PING_MAX_MS);
        state.nextPingAt[pid] = at;
        arm(pid, at - now);
      }
    }
    await writeState(state);
  } catch (e) {}
}

/** A new thread appeared (first chat / funnel opener) ,  enroll her. */
export async function enrollProactiveGirl(profileId: string): Promise<void> {
  try {
    const state = await readState();
    if (state.nextPingAt[profileId]) return; // already enrolled
    const at = Date.now() + jitter(PING_MIN_MS, PING_MAX_MS);
    state.nextPingAt[profileId] = at;
    await writeState(state);
    arm(profileId, at - Date.now());
  } catch (e) {}
}
