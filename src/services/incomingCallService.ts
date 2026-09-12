import AsyncStorage from "@react-native-async-storage/async-storage";
import { MOCK_PROFILES, Profile } from "../data/mockProfiles";
import { saveCallLog } from "./callHistoryService";

const INCOMING_FIRED_KEY = "@dreamdate_incoming_call_fired_v1";
// First-install video call: RANDOM 90s-5min after install. Nothing fixed ,
// fixed waits feel prewritten. Pending timers are never reset by tab hops.
const INCOMING_MIN_MS = 90 * 1000;
const INCOMING_MAX_MS = 5 * 60 * 1000;
// Decline retries also random: 2-6 min apart.
const RETRY_MIN_MS = 2 * 60 * 1000;
const RETRY_MAX_MS = 6 * 60 * 1000;
const MAX_RETRIES = 2;

function randomBetween(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min));
}

/**
 * In-app incoming call orchestrator. Once per install, fires a full-screen
 * ringing overlay 2 min after first install (scheduled at login; Discover
 * focus re-arms it as a fallback if the app was killed before it fired).
 * If declined, retries up to 2 more times (then converts to a missed-call
 * log entry).
 */
class IncomingCallService {
  private timer: any = null;
  private retryTimer: any = null;
  private retryCount = 0;
  private ringing = false;
  private profile: Profile | null = null;
  private listeners = new Set<(p: Profile) => void>();

  /** Schedules the first incoming call if eligible. Safe to call from login
   *  AND from Discover focus ,  a pending timer is never reset, so tab
   *  hopping can't push the call back indefinitely. */
  async scheduleFirstIfEligible(): Promise<void> {
    if (this.timer) return; // already armed ,  don't restart the countdown
    try {
      const fired = await AsyncStorage.getItem(INCOMING_FIRED_KEY);
      if (fired) return;
    } catch (e) {
      return;
    }

    this.timer = setTimeout(
      () => {
        this.timer = null;
        this.fireIncoming();
      },
      randomBetween(INCOMING_MIN_MS, INCOMING_MAX_MS),
    );
  }

  /**
   * A girl PROMISED to call (chat "will_call" outcome). She actually calls
   * after a random delay in [minMs, maxMs] (typically 20s-6min). Fires even
   * if the first-install call already happened ,  promises are kept.
   * No-op if a call is already ringing/scheduled for anyone.
   */
  async requestCallFrom(
    profileId: string,
    minMs: number,
    maxMs: number,
  ): Promise<void> {
    if (this.timer || this.retryTimer || this.ringing) return;
    const profile = MOCK_PROFILES.find((p) => p.id === profileId);
    if (!profile) return;
    this.timer = setTimeout(
      () => {
        this.timer = null;
        this.profile = profile;
        this.ringing = true;
        this.listeners.forEach((cb) => {
          try {
            cb(profile);
          } catch (e) {}
        });
      },
      randomBetween(minMs, maxMs),
    );
  }

  /** Cancel any scheduled incoming (e.g. user is mid-call or on a sensitive screen). */
  cancelScheduled(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  /** Listeners (the overlay component) subscribe to be notified when an incoming call is ready. */
  subscribe(cb: (p: Profile) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  /** Called by overlay when user accepts. */
  accepted(profileId: string): void {
    this.ringing = false;
    this.markFired();
    this.cancelScheduled();
  }

  /** Called by overlay when user declines. Retry up to MAX_RETRIES, else miss it. */
  declined(profileId: string): void {
    this.ringing = false;
    this.retryCount += 1;
    if (this.retryCount >= MAX_RETRIES) {
      // Convert to missed call
      if (this.profile) {
        saveCallLog({
          profileId: this.profile.id,
          name: this.profile.name,
          avatar: this.profile.avatar,
          city: this.profile.city,
          type: "incoming",
          durationSeconds: 0,
          coinsSpent: 0,
        }).catch(() => {});
      }
      this.markFired();
      this.cancelScheduled();
      return;
    }
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(
      () => {
        this.fireIncoming();
      },
      randomBetween(RETRY_MIN_MS, RETRY_MAX_MS),
    );
  }

  /** Called by overlay when user dismisses without explicit choice (timeout). */
  dismissed(): void {
    this.declined(this.profile?.id || "");
  }

  private fireIncoming(): void {
    const candidates = MOCK_PROFILES.filter((p) => p.isOnline);
    if (candidates.length === 0) return;
    this.profile = candidates[Math.floor(Math.random() * candidates.length)];
    this.ringing = true;
    this.listeners.forEach((cb) => {
      try {
        cb(this.profile!);
      } catch (e) {}
    });
  }

  private async markFired(): Promise<void> {
    try {
      await AsyncStorage.setItem(INCOMING_FIRED_KEY, "1");
    } catch (e) {}
  }
}

export const incomingCallService = new IncomingCallService();
