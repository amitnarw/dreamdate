import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_PROFILES, Profile } from '../data/mockProfiles';
import { saveCallLog } from './callHistoryService';

const INCOMING_FIRED_KEY = '@dreamdate_incoming_call_fired_v1';
const INCOMING_DELAY_MS = 4 * 60 * 1000 + Math.floor(Math.random() * 2 * 60 * 1000); // 4-6 min
const RETRY_DELAY_MS = 2 * 60 * 1000;
const MAX_RETRIES = 2;

/**
 * In-app incoming call orchestrator. Once per install, fires a full-screen
 * ringing overlay ~4-6 min into the user's first active session. If declined,
 * retries up to 2 more times (then converts to a missed-call log entry).
 */
class IncomingCallService {
  private timer: any = null;
  private retryTimer: any = null;
  private retryCount = 0;
  private profile: Profile | null = null;
  private listeners = new Set<(p: Profile) => void>();

  /** Call from a top-level screen mount (Discover). Schedules the first incoming call if eligible. */
  async scheduleFirstIfEligible(): Promise<void> {
    try {
      const fired = await AsyncStorage.getItem(INCOMING_FIRED_KEY);
      if (fired) return;
    } catch (e) {
      return;
    }

    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.fireIncoming();
    }, INCOMING_DELAY_MS);
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
    this.markFired();
    this.cancelScheduled();
  }

  /** Called by overlay when user declines. Retry up to MAX_RETRIES, else miss it. */
  declined(profileId: string): void {
    this.retryCount += 1;
    if (this.retryCount >= MAX_RETRIES) {
      // Convert to missed call
      if (this.profile) {
        saveCallLog({
          profileId: this.profile.id,
          name: this.profile.name,
          avatar: this.profile.avatar,
          city: this.profile.city,
          type: 'incoming',
          durationSeconds: 0,
          coinsSpent: 0,
        }).catch(() => {});
      }
      this.markFired();
      this.cancelScheduled();
      return;
    }
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => {
      this.fireIncoming();
    }, RETRY_DELAY_MS);
  }

  /** Called by overlay when user dismisses without explicit choice (timeout). */
  dismissed(): void {
    this.declined(this.profile?.id || '');
  }

  private fireIncoming(): void {
    const candidates = MOCK_PROFILES.filter((p) => p.isOnline);
    if (candidates.length === 0) return;
    this.profile = candidates[Math.floor(Math.random() * candidates.length)];
    this.listeners.forEach((cb) => {
      try {
        cb(this.profile!);
      } catch (e) {}
    });
  }

  private async markFired(): Promise<void> {
    try {
      await AsyncStorage.setItem(INCOMING_FIRED_KEY, '1');
    } catch (e) {}
  }
}

export const incomingCallService = new IncomingCallService();
