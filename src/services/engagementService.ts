import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { saveCallLog } from './callHistoryService';
import { saveChatHistory, ChatMessage } from './chatEngine';
import { MOCK_PROFILES, Profile } from '../data/mockProfiles';

const STATE_KEY = '@dreamdate_engagement_state_v1';
const LAST_NOTIF_TS_KEY = '@dreamdate_last_engagement_notif_v1';
const POST_DEPLETION_KEY = '@dreamdate_post_depletion_notif_v1';

const CHANNEL_ID = 'private-messages';

interface EngagementState {
  msgNotifId?: string;
  missedCallNotifId?: string;
  touch3NotifId?: string;
  msgProfileId?: string;
  missedCallProfileId?: string;
  touch3ProfileId?: string;
  completed?: boolean;
  startedAt?: number;
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
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Private messages',
      description: 'New chat messages, missed calls & gifts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F65592',
      sound: 'default',
    });
  } catch (e) {}
}

function pickProfileForMessage(profiles: Profile[]): Profile {
  const playful = profiles.find((p) => p.archetype === 'playful_tease' && p.isOnline);
  if (playful) return playful;
  const online = profiles.find((p) => p.isOnline);
  return online || profiles[0];
}

function pickProfileForMissedCall(profiles: Profile[], excludeId?: string): Profile {
  const candidates = profiles.filter((p) => p.isOnline && p.id !== excludeId);
  return candidates[Math.floor(Math.random() * candidates.length)] || profiles[0];
}

/* ------------------------------------------------------------------ */
/* First-run setup: pre-seed thread + schedule notification funnel    */
/* ------------------------------------------------------------------ */

export async function initFirstRunEngagement(): Promise<void> {
  const state = await readState();
  if (state.completed) return;

  await ensureChannel();
  const now = Date.now();
  const profileForMsg = pickProfileForMessage(MOCK_PROFILES);
  const profileForMissedCall = pickProfileForMissedCall(MOCK_PROFILES, profileForMsg.id);

  // Pre-seed the chat thread with two opener messages + unread
  const openerText1 = `Heyyy handsome 😜 ab tak mere liye wait nahi kiya?`;
  const openerText2 = `Mujhe laga tha kal raat mil jayenge, but okay — ab toh mil hi gaye 😉`;
  const messages: ChatMessage[] = [
    {
      id: `msg-engage-1-${profileForMsg.id}`,
      sender: 'profile',
      text: openerText1,
      timestamp: now - 1000 * 60 * (3 + Math.random() * 4), // 3-7 min ago
      status: 'read',
    },
    {
      id: `msg-engage-2-${profileForMsg.id}`,
      sender: 'profile',
      text: openerText2,
      timestamp: now - 1000 * 30 * (1 + Math.random() * 2), // 30-90s ago
      status: 'delivered',
    },
  ];
  await saveChatHistory(profileForMsg.id, messages);

  // Schedule first message notification: 3-5 min from now
  const msgDelaySec = (3 + Math.floor(Math.random() * 3)) * 60; // 3-5 min
  const msgNotifId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `${profileForMsg.name.split(' ')[0]} sent you a message 💬`,
      body: openerText2,
      data: { url: `/chat/${profileForMsg.id}`, type: 'incoming_message' },
      ...(Platform.OS === 'android' && { channelId: CHANNEL_ID }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: msgDelaySec,
    },
  });

  // Schedule missed call: 20-35 min from now
  const missedDelaySec = (20 + Math.floor(Math.random() * 16)) * 60;
  const missedCallNotifId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `Missed video call from ${profileForMissedCall.name.split(' ')[0]} 💋`,
      body: 'Tap to call back — she might still pick up',
      data: { url: `/call/${profileForMissedCall.id}`, type: 'missed_call' },
      ...(Platform.OS === 'android' && { channelId: CHANNEL_ID }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: missedDelaySec,
    },
  });

  // Pre-write a missed call log entry so it appears in history
  await saveCallLog({
    profileId: profileForMissedCall.id,
    name: profileForMissedCall.name,
    avatar: profileForMissedCall.avatar,
    city: profileForMissedCall.city,
    type: 'incoming',
    durationSeconds: 0,
    coinsSpent: 0,
  }).catch(() => {});

  await writeState({
    msgNotifId,
    missedCallNotifId,
    msgProfileId: profileForMsg.id,
    missedCallProfileId: profileForMissedCall.id,
    startedAt: now,
  });
}

/** Called when user actually opens the seeded chat (or any chat), to cancel the msg nudge. */
export async function markMessageFunnelFired(): Promise<void> {
  const state = await readState();
  if (state.msgNotifId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(state.msgNotifId);
    } catch (e) {}
  }
}

/** Called when user opens the call screen from the missed-call notification (or any call), to cancel missed-call nudge. */
export async function markCallFunnelFired(): Promise<void> {
  const state = await readState();
  if (state.missedCallNotifId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(state.missedCallNotifId);
    } catch (e) {}
  }
  if (!state.completed) {
    await writeState({ ...state, completed: true, touch3NotifId: state.touch3NotifId });
  }
}

/** Mark full funnel done (e.g. after user has organic engagement). */
export async function markEngagementDone(): Promise<void> {
  const state = await readState();
  if (state.msgNotifId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(state.msgNotifId);
    } catch (e) {}
  }
  if (state.missedCallNotifId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(state.missedCallNotifId);
    } catch (e) {}
  }
  if (state.touch3NotifId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(state.touch3NotifId);
    } catch (e) {}
  }
  await writeState({ ...state, completed: true });
}

/* ------------------------------------------------------------------ */
/* Post-depletion reminder                                                */
/* ------------------------------------------------------------------ */

export async function schedulePostDepletionReminder(profileName: string): Promise<void> {
  await ensureChannel();
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `${profileName.split(' ')[0]} is waiting 💋`,
      body: 'Recharge coins & finish your private call — she\'s still online',
      data: { url: '/(tabs)', type: 'recharge_reminder' },
      ...(Platform.OS === 'android' && { channelId: CHANNEL_ID }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 30 * 60, // 30 min
    },
  });
  await AsyncStorage.setItem(POST_DEPLETION_KEY, id);
}

/* ------------------------------------------------------------------ */
/* Re-engagement notification on app open (after some idle time)        */
/* ------------------------------------------------------------------ */

export async function maybeScheduleReengagement(profileName: string): Promise<void> {
  try {
    const last = await AsyncStorage.getItem(LAST_NOTIF_TS_KEY);
    const lastTs = last ? parseInt(last, 10) : 0;
    const now = Date.now();
    // Max 1 re-engagement notification per 24h
    if (now - lastTs < 24 * 60 * 60 * 1000) return;

    await ensureChannel();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${profileName.split(' ')[0]} sent you a new message 💬`,
        body: 'Open DreamDate to read it',
        data: { url: '/(tabs)', type: 're_engagement' },
        ...(Platform.OS === 'android' && { channelId: CHANNEL_ID }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 45 * 60,
      },
    });
    await AsyncStorage.setItem(LAST_NOTIF_TS_KEY, now.toString());
  } catch (e) {}
}

/* ------------------------------------------------------------------ */
/* Setup notification handler (must be called once at app start)       */
/* ------------------------------------------------------------------ */

export function setupNotificationHandler(): void {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (e) {}
}
