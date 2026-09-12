import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Expo Go on Android SDK 53+ hard-throws the moment `expo-notifications` is
 * evaluated at all ,  its `DevicePushTokenAutoRegistration.fx.js` side effect
 * calls `addPushTokenListener` -> `warnOfExpoGoPushUsage()`, which
 * `throw new Error(...)` when it detects Expo Go. This happens even for a
 * lazy dynamic `import('expo-notifications')`: the throw fires during module
 * evaluation, not when calling an API.
 *
 * So this wrapper NEVER loads the module inside Expo Go. Detection is via
 * expo-constants (itself side-effect free): Expo Go reports
 * appOwnership === 'expo' and executionEnvironment === 'storeClient'.
 * Dev builds and release APKs report neither, so they load normally.
 *
 * Every safe* function therefore silently no-ops in Expo Go, and the module
 * is only ever evaluated in environments where it works.
 *
 * On a real Android APK the FCM-backed module loads cleanly and all
 * functions work ,  we never touch Firebase/FCM from our code paths, so
 * no google-services.json is required.
 */

/** True only when running inside the Expo Go client app. */
export const IS_EXPO_GO =
  Constants.appOwnership === "expo" ||
  (Constants as any).executionEnvironment === "storeClient";

type NotificationsModule = typeof import("expo-notifications");

let cached: NotificationsModule | null = null;
let loadFailed = false;
let loadAttempted = false;

async function load(): Promise<NotificationsModule | null> {
  // Never even evaluate the module in Expo Go (see header comment).
  if (IS_EXPO_GO) return null;
  if (cached) return cached;
  if (loadFailed) return null;
  if (loadAttempted) return null;
  loadAttempted = true;
  try {
    cached = await import("expo-notifications");
    return cached;
  } catch (e) {
    loadFailed = true;
    if (__DEV__) {
      console.warn(
        "[safeNotifications] expo-notifications unavailable in this environment; funnel features disabled:",
        (e as Error)?.message,
      );
    }
    return null;
  }
}

/** True if expo-notifications was successfully loaded (release build path). */
export function isNotificationsAvailable(): boolean {
  return cached != null;
}

/** Schedule a local notification. Returns the notification id or null if unavailable. */
export async function safeScheduleNotificationAsync(
  opts: any,
): Promise<string | null> {
  const n = await load();
  if (!n) return null;
  try {
    return await n.scheduleNotificationAsync(opts);
  } catch (e) {
    return null;
  }
}

export async function safeCancelScheduledNotificationAsync(
  id: string,
): Promise<void> {
  const n = await load();
  if (!n) return;
  try {
    await n.cancelScheduledNotificationAsync(id);
  } catch (e) {}
}

export async function safeSetNotificationChannelAsync(
  channelId: string,
  channel: any,
): Promise<void> {
  if (Platform.OS !== "android") return;
  const n = await load();
  if (!n) return;
  try {
    await n.setNotificationChannelAsync(channelId, channel);
  } catch (e) {}
}

/** Idempotent ,  no-op when the channel doesn't exist (incl. Expo Go). */
export async function safeDeleteNotificationChannelAsync(
  channelId: string,
): Promise<void> {
  if (Platform.OS !== "android") return;
  const n = await load();
  if (!n) return;
  try {
    await n.deleteNotificationChannelAsync(channelId);
  } catch (e) {}
}

/** Current notification permission status, or null when unavailable. */
export async function safeGetPermissionsAsync(): Promise<any | null> {
  const n = await load();
  if (!n) return null;
  try {
    return await n.getPermissionsAsync();
  } catch (e) {
    return null;
  }
}

export async function safeRequestPermissionsAsync(opts?: any): Promise<any> {
  const n = await load();
  if (!n) return null;
  try {
    return await n.requestPermissionsAsync(opts);
  } catch (e) {
    return null;
  }
}

export async function safeGetLastNotificationResponseAsync(): Promise<any> {
  const n = await load();
  if (!n) return null;
  try {
    return await n.getLastNotificationResponseAsync();
  } catch (e) {
    return null;
  }
}

export interface SafeSubscription {
  remove: () => void;
}

/** Returns null when the lib isn't loaded (Expo Go). */
export async function safeAddNotificationResponseReceivedListener(
  cb: (response: any) => void,
): Promise<SafeSubscription | null> {
  const n = await load();
  if (!n) return null;
  try {
    const sub = n.addNotificationResponseReceivedListener(cb);
    return { remove: () => sub.remove() };
  } catch (e) {
    return null;
  }
}

export function safeSetNotificationHandler(handler: any): void {
  // Fire-and-forget; fire-and-handle any error.
  load().then((n) => {
    if (!n) return;
    try {
      n.setNotificationHandler(handler);
    } catch (e) {}
  });
}

/** TIME_INTERVAL / DATE enum constants from the lib, or null if not loaded. */
export async function safeGetSchedulableTriggerInputTypes(): Promise<
  any | null
> {
  const n = await load();
  return n?.SchedulableTriggerInputTypes ?? null;
}

export async function safeGetAndroidImportance(): Promise<any | null> {
  const n = await load();
  return n?.AndroidImportance ?? null;
}
