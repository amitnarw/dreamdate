import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { MOCK_PROFILES, Profile } from "../data/mockProfiles";
import { deliverLiveMessage } from "./chatEngine";
import { isOnline } from "./onlineState";
import { getPersonaConfig } from "./personaEngine";
import {
  safeCancelScheduledNotificationAsync,
  safeDeleteNotificationChannelAsync,
  safeGetAndroidImportance,
  safeGetSchedulableTriggerInputTypes,
  safeScheduleNotificationAsync,
  safeSetNotificationChannelAsync,
} from "./safeNotifications";

const STATE_KEY = "@dreamdate_engagement_state_v2";
const LAST_NOTIF_TS_KEY = "@dreamdate_last_engagement_notif_v1";
const POST_DEPLETION_KEY = "@dreamdate_post_depletion_notif_v1";

// Chat storage keys (mirror chatEngine's v5 keys ,  stable, do not change here)
const CHAT_HISTORY_PREFIX = "@dreamdate_chat_history_v5_";
const ACTIVE_THREADS_KEY = "@dreamdate_active_chat_threads_v5";

// v2: the original 'private-messages' channel was created with
// `sound: 'default'`, which the native module rejects in builds
// ("Custom sound 'default' not found"). Android locks channel audio
// settings after creation, so the buggy channel is deleted and replaced.
export const NOTIFICATION_CHANNEL_ID = "private-messages-v2";
const LEGACY_CHANNEL_ID = "private-messages";
const CHANNEL_ID = NOTIFICATION_CHANNEL_ID;

/** Cost fallback for locked funnel photos (per-girl price lives on the slot). */
export const PHOTO_UNLOCK_COST = 30;

/** In-chat "unlock me" nudges for still-locked funnel photos. */
const WAITING_PINGS = [
  "photo abhi tak nahi kholi 🙈 andar bahut kuch hai, wait kar rahi hu",
  "kholo na 😏 dekhna nahi hai main kesi lag rahi?",
  "itna intezaar? 🙈 unlock karo na, paseena aa raha hai",
  "sab dikh raha hai, bas ek click dur 🔥 himmat karo",
  "soch lo, ye wali sabse garam hai 💋 phir mat kehna bataya nahi",
];

export interface FunnelSlot {
  profileId: string;
  /** Seconds after funnel start when this message is due. */
  delaySec: number;
  kind: "text" | "photo";
  text: string;
  photoUrl?: string;
  unlockCost?: number;
  notifId?: string;
  delivered?: boolean;
}

interface EngagementState {
  slots?: FunnelSlot[];
  completed?: boolean;
  cleaned?: boolean;
  startedAt?: number;
  // Legacy fields (only read to cancel leftovers, never written)
  msgNotifId?: string;
  msgProfileId?: string;
  msgDelivered?: boolean;
  missedCallNotifId?: string;
  touch3NotifId?: string;
}

async function readState(): Promise<EngagementState> {
  try {
    const raw = await AsyncStorage.getItem(STATE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

async function writeState(state: EngagementState): Promise<void> {
  try {
    await AsyncStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch (e) {}
}

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  // Remove the legacy channel created with the invalid `sound: 'default'`
  // (idempotent no-op once gone).
  await safeDeleteNotificationChannelAsync(LEGACY_CHANNEL_ID);
  const importance = (await safeGetAndroidImportance()) ?? "high";
  // NOTE: no `sound` key ,  omitting it is the documented way to get the
  // system default notification sound. Passing 'default' throws in builds
  // because the native module treats it as a custom bundled filename.
  await safeSetNotificationChannelAsync(CHANNEL_ID, {
    name: "Private messages",
    description: "New chat messages, missed calls & gifts",
    importance,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#F65592",
  });
}

/* ------------------------------------------------------------------ */
/* First-install staggered funnel ,  up to 10 girls                     */
/*                                                                     */
/* T+1min  girl 1: text message                                        */
/* T+2min  girl 2: text + BLURRED photo (tap → confirm → deduct →       */
/*         unblur, HER price 30/40/50)                                 */
/* T+3min  girl 3: text message                                        */
/* T+10-20min apart  girls 4-10: alternating text / blurred photo,     */
/*         each a DIFFERENT girl, each arrival announced by            */
/*         notification + in-app message. Hard cap: 10 threads.        */
/*                                                                     */
/* NOTHING is written up front. Each slot is delivered by an in-app    */
/* timer while the app is alive; a same-delay local notification is    */
/* scheduled as backup for the killed-app case (release builds only ,   */
/* Expo Go cannot notify). If the app was closed when a slot came due, */
/* the next launch catch-up delivers it immediately with its correct   */
/* (backdated) timestamp, so history always looks natural.             */
/*                                                                     */
/* Race guard: concurrent callers (login + layout mount + online       */
/* re-trigger) collapse into a single run.                             */
/* ------------------------------------------------------------------ */

let initInFlight: Promise<void> | null = null;
let slotTimers: any[] = [];

export function cancelEngagementTimers(): void {
  slotTimers.forEach((t) => clearTimeout(t));
  slotTimers = [];
}

export function initFirstRunEngagement(): Promise<void> {
  if (initInFlight) return initInFlight;
  initInFlight = runInit().finally(() => {
    initInFlight = null;
  });
  return initInFlight;
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pick up to 10 distinct online profiles. Photo slots prefer photo-having girls. */
function pickFunnelProfiles(): Profile[] {
  const online = MOCK_PROFILES.filter((p) => p.isOnline);
  const pool = shuffled(online.length >= 10 ? online : MOCK_PROFILES);
  const picked = pool.slice(0, 10);
  // Ensure every photo slot has a real photo to send
  for (const idx of PHOTO_SLOT_INDEXES) {
    if (idx < picked.length && !picked[idx].photos?.length) {
      const withPhoto = pool.find(
        (p) => p.photos?.length && !picked.includes(p),
      );
      if (withPhoto) picked[idx] = withPhoto;
    }
  }
  return picked;
}

/** Indexes (0-based) of slots that carry a blurred photo. */
const PHOTO_SLOT_INDEXES = [1, 4, 7];

function jitterSec(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min));
}

const LATE_SLOT_TEXTS = [
  "oye tum online ho? 😜",
  "sun na, bore ho raha",
  "tum kya kar rahe ho abhi",
  "call pe aao na kabhi 🔥",
  "achha lag raha tumse baat karke 🌸",
  "arey kahan gayab ho 😏",
  "ek baat batau? 🙈",
];
const LATE_PHOTO_TEXTS = [
  "ek aur surprise 👀",
  "ye wali dekho 🙈",
  "sirf tumhare liye 😏",
];

function buildSlots(
  profiles: Profile[],
): Omit<FunnelSlot, "notifId" | "delivered">[] {
  const [p1, p2, p3] = profiles;
  const slots: Omit<FunnelSlot, "notifId" | "delivered">[] = [
    {
      profileId: p1.id,
      delaySec: 60,
      kind: "text",
      text: "heyy, kya kar rahe ho 😜",
    },
    {
      profileId: p2.id,
      delaySec: 120,
      kind: "photo",
      text: "tumhare liye ek surprise hai 👀",
      ...funnelExclusive(p2),
    },
    {
      profileId: p3.id,
      delaySec: 180,
      kind: "text",
      text: "oye suno na, bore ho rahi hu",
    },
  ];
  // Girls 4-10: each 10-20 min after the previous slot (randomized).
  let cursor = 180;
  let textIdx = Math.floor(Math.random() * LATE_SLOT_TEXTS.length);
  let photoIdx = Math.floor(Math.random() * LATE_PHOTO_TEXTS.length);
  for (let i = 3; i < profiles.length && i < 10; i++) {
    cursor += jitterSec(600, 1200);
    const p = profiles[i];
    if (PHOTO_SLOT_INDEXES.includes(i)) {
      slots.push({
        profileId: p.id,
        delaySec: cursor,
        kind: "photo",
        text: LATE_PHOTO_TEXTS[photoIdx % LATE_PHOTO_TEXTS.length],
        ...funnelExclusive(p),
      });
      photoIdx += 1;
    } else {
      slots.push({
        profileId: p.id,
        delaySec: cursor,
        kind: "text",
        text: LATE_SLOT_TEXTS[textIdx % LATE_SLOT_TEXTS.length],
      });
      textIdx += 1;
    }
  }
  return slots;
}

/**
 * Funnel photo source: a random lockedPhoto (true exclusive ,  never
 * gallery-visible) with ITS price. Falls back to gallery only if empty.
 */
function funnelExclusive(p: Profile): { photoUrl: string; unlockCost: number } {
  const locked = p.lockedPhotos ?? [];
  if (locked.length > 0) {
    const item = locked[Math.floor(Math.random() * locked.length)];
    return { photoUrl: item.url, unlockCost: item.unlockCostCoins };
  }
  return {
    photoUrl: p.photos?.[0] ?? p.avatar,
    unlockCost: getPersonaConfig(p).unlockCost,
  };
}

async function runInit(): Promise<void> {
  if (!isOnline()) return; // Offline gate ,  don't run funnel while user is blocked

  let state = await readState();
  if (state.completed) return;

  // One-time cleanup of v1 pollution (pre-seeded threads, leftover schedules)
  if (!state.cleaned) {
    await cleanupLegacySeededData(state);
    state = await readState();
  }

  await ensureChannel();

  // Cancel any legacy single-message schedule from the old funnel shape
  if (state.msgNotifId) {
    await safeCancelScheduledNotificationAsync(state.msgNotifId);
  }

  // First run ever: create the 3 slots and anchor the start time
  if (!state.slots || state.slots.length === 0) {
    const profiles = pickFunnelProfiles();
    state = {
      ...state,
      slots: buildSlots(profiles).map((s) => ({ ...s })),
      startedAt: Date.now(),
      msgNotifId: undefined,
      msgProfileId: undefined,
    };
    await writeState(state);
  }

  const startedAt = state.startedAt ?? Date.now();
  const now = Date.now();

  // Cancel in-app timers; they will be re-armed below for future slots only
  cancelEngagementTimers();

  const Triggers = await safeGetSchedulableTriggerInputTypes();
  const TIME_INTERVAL = Triggers?.TIME_INTERVAL ?? "timeInterval";

  // Catch-up: deliver every overdue slot immediately, in order…
  const overdue = (state.slots ?? [])
    .map((s, i) => ({ ...s, index: i }))
    .filter((s) => !s.delivered && startedAt + s.delaySec * 1000 <= now)
    .sort((a, b) => a.delaySec - b.delaySec);
  for (const s of overdue) {
    await deliverSlot(s.index, startedAt + s.delaySec * 1000);
  }

  // …then arm timers + backup notifications for future slots
  state = await readState();
  for (let i = 0; i < (state.slots ?? []).length; i++) {
    const slot = state.slots![i];
    if (slot.delivered) continue;
    const dueAt = startedAt + slot.delaySec * 1000;
    const waitMs = dueAt - Date.now();

    // Backup notification for the killed-app case (no-op in Expo Go).
    // Re-schedule only if none is pending for this slot.
    if (!slot.notifId) {
      const profile = MOCK_PROFILES.find((p) => p.id === slot.profileId);
      const first = profile?.name.split(" ")[0] ?? "Someone";
      const notifId = await safeScheduleNotificationAsync({
        content: {
          title:
            slot.kind === "photo"
              ? `${first} sent you a photo 📸`
              : `${first} sent you a message 💬`,
          body: slot.text,
          data: {
            url: `/chat/${slot.profileId}`,
            type: "incoming_message",
            profileId: slot.profileId,
            slotIndex: i,
          },
          ...(Platform.OS === "android" && { channelId: CHANNEL_ID }),
        },
        trigger: {
          type: TIME_INTERVAL,
          seconds: Math.max(5, Math.round(waitMs / 1000)),
        },
      });
      if (notifId) {
        const cur = await readState();
        if (cur.slots?.[i] && !cur.slots[i].delivered) {
          cur.slots[i].notifId = notifId;
          await writeState(cur);
        }
      }
    }

    if (waitMs <= 0) continue; // already handled by catch-up above
    slotTimers.push(
      setTimeout(() => {
        deliverSlot(i).catch(() => {});
      }, waitMs),
    );
  }
}

/** Write one slot into its thread (unless she already has organic messages)
 *  and mark it delivered. `timestamp` lets catch-up backdate correctly. */
async function deliverSlot(index: number, timestamp?: number): Promise<void> {
  const state = await readState();
  const slot = state.slots?.[index];
  if (!slot || slot.delivered) return;
  const ts = timestamp ?? Date.now();

  // If the user already has a real conversation with her, this slot is
  // pointless ,  close it out silently instead of dropping a stray greeting.
  try {
    const raw = await AsyncStorage.getItem(
      CHAT_HISTORY_PREFIX + slot.profileId,
    );
    const history: any[] = raw ? JSON.parse(raw) : [];
    const organic = history.filter(
      (m) =>
        m?.sender === "user" ||
        (m?.sender === "profile" &&
          !String(m?.id || "").startsWith("msg-engage-")),
    );
    if (organic.length > 0) {
      if (slot.notifId) {
        await safeCancelScheduledNotificationAsync(slot.notifId);
      }
      const cur = await readState();
      if (cur.slots?.[index]) {
        cur.slots[index].delivered = true;
        cur.slots[index].notifId = undefined;
        if (cur.slots.every((s) => s.delivered)) cur.completed = true;
        await writeState(cur);
      }
      return;
    }
  } catch (e) {}

  if (slot.kind === "photo" && slot.photoUrl) {
    const msgId = `msg-engage-s${index}-${slot.profileId}-${ts}`;
    await deliverLiveMessage(slot.profileId, {
      id: msgId,
      sender: "profile",
      text: slot.text,
      timestamp: ts,
      status: "delivered",
      type: "locked_photo",
      mediaUrl: slot.photoUrl,
      isBlurred: true,
      unlockCost: slot.unlockCost ?? PHOTO_UNLOCK_COST,
      isUnlocked: false,
    });
    // "She's waiting" ping: 20-40 min later, if he STILL hasn't unlocked
    // her photo, she nudges him in-chat (drives the recharge decision).
    slotTimers.push(
      setTimeout(
        () => {
          (async () => {
            try {
              const hRaw = await AsyncStorage.getItem(
                CHAT_HISTORY_PREFIX + slot.profileId,
              );
              const history: any[] = hRaw ? JSON.parse(hRaw) : [];
              const stillLocked = history.some(
                (m) => m?.id === msgId && !m?.isUnlocked,
              );
              if (!stillLocked) return;
              await deliverLiveMessage(slot.profileId, {
                id: `msg-waiting-${index}-${slot.profileId}-${Date.now()}`,
                sender: "profile",
                text: WAITING_PINGS[
                  Math.floor(Math.random() * WAITING_PINGS.length)
                ],
                timestamp: Date.now(),
                status: "delivered",
              });
            } catch (e) {}
          })();
        },
        (20 + Math.floor(Math.random() * 20)) * 60 * 1000,
      ),
    );
  } else {
    await deliverLiveMessage(slot.profileId, {
      id: `msg-engage-s${index}-${slot.profileId}-${ts}`,
      sender: "profile",
      text: slot.text,
      timestamp: ts,
      status: "delivered",
    });
  }

  if (slot.notifId) {
    await safeCancelScheduledNotificationAsync(slot.notifId);
  }
  const cur = await readState();
  if (cur.slots?.[index]) {
    cur.slots[index].delivered = true;
    cur.slots[index].notifId = undefined;
    if (cur.slots.every((s) => s.delivered)) cur.completed = true;
    await writeState(cur);
  }
}

/** In-app timer path (thin wrapper; timers call deliverSlot directly). */
export async function deliverFunnelMessage(): Promise<void> {
  const state = await readState();
  const i = (state.slots ?? []).findIndex((s) => !s.delivered);
  if (i >= 0) await deliverSlot(i);
}

/** Killed-app notification-tap path: the message was never written (the
 *  in-app timer died with the app) ,  write it now, then open chat. */
export async function deliverSeededMessage(
  profileId: string,
  slotIndex?: number,
): Promise<void> {
  cancelEngagementTimers();
  const state = await readState();
  let i = typeof slotIndex === "number" ? slotIndex : -1;
  if (
    i < 0 ||
    !state.slots?.[i] ||
    (state.slots[i].profileId !== profileId && state.slots[i].delivered)
  ) {
    i = (state.slots ?? []).findIndex(
      (s) => s.profileId === profileId && !s.delivered,
    );
  }
  if (i >= 0) {
    await deliverSlot(i);
  } else {
    // Fallback: unknown slot (legacy notification) ,  just clear the backup
    await markMessageFunnelFired(profileId);
  }
  // Re-arm remaining future slots (timers died with the app, if it died)
  await initFirstRunEngagement().catch(() => {});
}

/** Called when the user opens a funnel chat organically ,  the backup
 *  notification for that thread is now redundant. */
export async function markMessageFunnelFired(
  profileId?: string,
): Promise<void> {
  const state = await readState();
  if (!state.slots) return;
  let changed = false;
  for (const s of state.slots) {
    if (s.delivered || !s.notifId) continue;
    if (profileId && s.profileId !== profileId) continue;
    await safeCancelScheduledNotificationAsync(s.notifId);
    s.notifId = undefined;
    changed = true;
  }
  if (state.msgNotifId) {
    await safeCancelScheduledNotificationAsync(state.msgNotifId);
    state.msgNotifId = undefined;
    changed = true;
  }
  if (changed) await writeState(state);
}

/** Legacy no-op kept for existing callers (call screen entry). The v1
 *  missed-call notification no longer exists; real missed calls are logged
 *  by incomingCallService when its overlay is declined past max retries. */
export async function markCallFunnelFired(): Promise<void> {
  const state = await readState();
  if (state.missedCallNotifId) {
    await safeCancelScheduledNotificationAsync(state.missedCallNotifId);
  }
  if (state.touch3NotifId) {
    await safeCancelScheduledNotificationAsync(state.touch3NotifId);
  }
}

/** Mark full funnel done (e.g. after user has organic engagement). */
export async function markEngagementDone(): Promise<void> {
  cancelEngagementTimers();
  const state = await readState();
  for (const s of state.slots ?? []) {
    if (s.notifId && !s.delivered) {
      await safeCancelScheduledNotificationAsync(s.notifId);
      s.notifId = undefined;
    }
  }
  if (state.msgNotifId) {
    await safeCancelScheduledNotificationAsync(state.msgNotifId);
  }
  if (state.missedCallNotifId) {
    await safeCancelScheduledNotificationAsync(state.missedCallNotifId);
  }
  if (state.touch3NotifId) {
    await safeCancelScheduledNotificationAsync(state.touch3NotifId);
  }
  await writeState({ ...state, completed: true });
}

/**
 * One-time cleanup of v1 funnel pollution: pre-seeded `msg-engage-*`
 * messages injected at login, empty threads left behind, and any leftover
 * v1 scheduled notifications.
 */
async function cleanupLegacySeededData(state: EngagementState): Promise<void> {
  try {
    if (state.msgNotifId) {
      await safeCancelScheduledNotificationAsync(state.msgNotifId);
    }
    if (state.missedCallNotifId) {
      await safeCancelScheduledNotificationAsync(state.missedCallNotifId);
    }
    if (state.touch3NotifId) {
      await safeCancelScheduledNotificationAsync(state.touch3NotifId);
    }

    const raw = await AsyncStorage.getItem(ACTIVE_THREADS_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    const kept: string[] = [];
    for (const pid of ids) {
      try {
        const hRaw = await AsyncStorage.getItem(CHAT_HISTORY_PREFIX + pid);
        if (!hRaw) continue;
        const history: any[] = JSON.parse(hRaw);
        const filtered = history.filter(
          (m) => !String(m?.id || "").startsWith("msg-engage-"),
        );
        if (filtered.length === 0) {
          await AsyncStorage.removeItem(CHAT_HISTORY_PREFIX + pid);
          continue; // drop the empty thread entirely
        }
        if (filtered.length !== history.length) {
          await AsyncStorage.setItem(
            CHAT_HISTORY_PREFIX + pid,
            JSON.stringify(filtered),
          );
        }
        kept.push(pid);
      } catch (e) {
        kept.push(pid);
      }
    }
    await AsyncStorage.setItem(ACTIVE_THREADS_KEY, JSON.stringify(kept));
  } catch (e) {}
  await writeState({ ...state, cleaned: true });
}

/* ------------------------------------------------------------------ */
/* Post-depletion reminder                                                */
/* ------------------------------------------------------------------ */

export async function schedulePostDepletionReminder(
  profileName: string,
): Promise<void> {
  if (!isOnline()) return;

  await ensureChannel();
  const Triggers = await safeGetSchedulableTriggerInputTypes();
  const TIME_INTERVAL = Triggers?.TIME_INTERVAL ?? "timeInterval";

  const id = await safeScheduleNotificationAsync({
    content: {
      title: `${profileName.split(" ")[0]} is waiting 💋`,
      body: "coins recharge kar lo, woh abhi online hai",
      data: { url: "/(tabs)", type: "recharge_reminder" },
      ...(Platform.OS === "android" && { channelId: CHANNEL_ID }),
    },
    trigger: { type: TIME_INTERVAL, seconds: 30 * 60 },
  });
  if (id) {
    try {
      await AsyncStorage.setItem(POST_DEPLETION_KEY, id);
    } catch (e) {}
  }
}

/* ------------------------------------------------------------------ */
/* Re-engagement notification on app open (after some idle time)        */
/* ------------------------------------------------------------------ */

export async function maybeScheduleReengagement(
  profileName: string,
): Promise<void> {
  if (!isOnline()) return;
  try {
    const last = await AsyncStorage.getItem(LAST_NOTIF_TS_KEY);
    const lastTs = last ? parseInt(last, 10) : 0;
    const now = Date.now();
    // Max 1 re-engagement notification per 24h
    if (now - lastTs < 24 * 60 * 60 * 1000) return;

    await ensureChannel();
    const Triggers = await safeGetSchedulableTriggerInputTypes();
    const TIME_INTERVAL = Triggers?.TIME_INTERVAL ?? "timeInterval";

    await safeScheduleNotificationAsync({
      content: {
        title: `${profileName.split(" ")[0]} sent you a new message 💬`,
        body: "Open BoloNa to read it",
        data: { url: "/(tabs)", type: "re_engagement" },
        ...(Platform.OS === "android" && { channelId: CHANNEL_ID }),
      },
      trigger: { type: TIME_INTERVAL, seconds: 45 * 60 },
    });
    await AsyncStorage.setItem(LAST_NOTIF_TS_KEY, now.toString());
  } catch (e) {}
}

/* ------------------------------------------------------------------ */
/* Setup notification handler (must be called once at app start)       */
/* ------------------------------------------------------------------ */

export function setupNotificationHandler(): void {
  // Backward-compat no-op; _layout.tsx now uses safeSetNotificationHandler
  // directly. Kept exported for callers that may import it.
}
