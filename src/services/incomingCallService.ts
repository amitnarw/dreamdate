import AsyncStorage from "@react-native-async-storage/async-storage";
import { MOCK_PROFILES, Profile } from "../data/mockProfiles";
import { saveCallLog } from "./callHistoryService";

const AUTH_STORAGE_KEY = "@dreamdate_auth_user_v1";
const INCOMING_INITIAL_DELAY_MS = 5 * 1000; // 5 seconds after landing on home screen after login
const INCOMING_SECOND_DELAY_MS = 10 * 1000; // 10 seconds after 1st call disconnects
const INCOMING_RECURRING_DELAY_MS = 60 * 1000; // 1 minute between subsequent calls

/**
 * In-app incoming call orchestrator.
 * Flow:
 * 1. 5 seconds after user clicks "Fast Login" and is on home screen -> 1st female (with blocked image) calls.
 * 2. If call disconnects (declined / unanswered) -> after 10 seconds, 2nd female (with blocked image) calls.
 * 3. Once 2nd call disconnects -> every 1 minute, a new female (with blocked image) calls.
 *
 * GUARANTEE: NEVER calls if user is not logged in!
 */
class IncomingCallService {
  private timer: any = null;
  private callCount = 0;
  private ringing = false;
  private profile: Profile | null = null;
  private calledProfileIds = new Set<string>();
  private listeners = new Set<(p: Profile) => void>();
  private firstCallListeners = new Set<() => void>();
  private inCall = false;

  private async isUserLoggedIn(): Promise<boolean> {
    try {
      const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      return !!raw;
    } catch {
      return false;
    }
  }

  getCallCount(): number {
    return this.callCount;
  }

  isInCall(): boolean {
    return this.inCall;
  }

  setInCall(active: boolean): void {
    this.inCall = active;
    if (active) {
      this.cancelScheduled();
    }
  }

  subscribeFirstCallConcluded(cb: () => void): () => void {
    this.firstCallListeners.add(cb);
    return () => this.firstCallListeners.delete(cb);
  }

  private notifyFirstCallConcluded(): void {
    AsyncStorage.setItem("@dreamdate_first_call_concluded_v1", "1").catch(() => {});
    this.firstCallListeners.forEach((cb) => {
      try {
        cb();
      } catch (e) {}
    });
  }

  /**
   * Reset call sequence (called on Fast Login or logout).
   */
  resetSequence(): void {
    this.cancelScheduled();
    this.callCount = 0;
    this.calledProfileIds.clear();
    this.profile = null;
    this.ringing = false;
  }

  /**
   * Called on home screen focus / login.
   * Only runs if user is authenticated.
   * If a call or countdown is already in progress, keeps it.
   */
  async scheduleFirstIfEligible(): Promise<void> {
    const loggedIn = await this.isUserLoggedIn();
    if (!loggedIn) return;

    if (this.timer || this.ringing || this.inCall) return;

    let delay = INCOMING_INITIAL_DELAY_MS;
    if (this.callCount === 1) {
      delay = INCOMING_SECOND_DELAY_MS;
    } else if (this.callCount >= 2) {
      delay = INCOMING_RECURRING_DELAY_MS;
    }

    this.timer = setTimeout(async () => {
      this.timer = null;
      if (this.inCall) return;
      await this.fireIncoming();
    }, delay);
  }

  /**
   * A girl promised to call in chat ("will_call" outcome).
   * She calls after [minMs, maxMs].
   */
  async requestCallFrom(
    profileId: string,
    minMs: number,
    maxMs: number,
  ): Promise<void> {
    const loggedIn = await this.isUserLoggedIn();
    if (!loggedIn || this.ringing) return;

    const profile = MOCK_PROFILES.find((p) => p.id === profileId);
    if (!profile) return;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const delay = Math.floor(minMs + Math.random() * (maxMs - minMs));
    this.timer = setTimeout(async () => {
      this.timer = null;
      const stillLoggedIn = await this.isUserLoggedIn();
      if (!stillLoggedIn) return;
      if (this.inCall) return;

      this.profile = profile;
      this.calledProfileIds.add(profile.id);
      this.ringing = true;
      this.listeners.forEach((cb) => {
        try {
          cb(profile);
        } catch (e) {}
      });
    }, delay);
  }

  /** Cancel any scheduled incoming call (e.g. user is mid-call or logging out). */
  cancelScheduled(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /** Listeners (the overlay component) subscribe to be notified when an incoming call arrives. */
  subscribe(cb: (p: Profile) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  /** Called by overlay when user accepts. */
  accepted(profileId: string): void {
    this.ringing = false;
    this.cancelScheduled();
    const wasFirstCall = this.callCount === 0;
    // After accepting and finishing the call, next call will be in recurring 1-min phase
    this.callCount = Math.max(this.callCount + 1, 2);
    if (wasFirstCall) {
      this.notifyFirstCallConcluded();
    }
  }

  /** Called when video call finishes, arms the 1-minute recurring call. */
  async onCallEnded(): Promise<void> {
    this.cancelScheduled();
    this.notifyFirstCallConcluded();
    const loggedIn = await this.isUserLoggedIn();
    if (!loggedIn) return;

    this.timer = setTimeout(async () => {
      this.timer = null;
      await this.fireIncoming();
    }, INCOMING_RECURRING_DELAY_MS);
  }

  /** Called by overlay when user declines. */
  declined(profileId: string): void {
    this.ringing = false;
    this.cancelScheduled();

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

    const wasFirstCall = this.callCount === 0;
    this.callCount += 1;
    if (wasFirstCall) {
      this.notifyFirstCallConcluded();
    }

    // After 1st call disconnects -> 10 seconds.
    // After 2nd call and onwards -> 1 minute.
    const nextDelay =
      this.callCount === 1
        ? INCOMING_SECOND_DELAY_MS
        : INCOMING_RECURRING_DELAY_MS;

    this.timer = setTimeout(async () => {
      this.timer = null;
      await this.fireIncoming();
    }, nextDelay);
  }

  /** Called by overlay when user dismisses without explicit choice (timeout). */
  dismissed(): void {
    this.declined(this.profile?.id || "");
  }

  /** Get only females who have blocked (locked) images */
  private getEligibleCandidates(): Profile[] {
    return MOCK_PROFILES.filter(
      (p) => p.isOnline && p.lockedPhotos && p.lockedPhotos.length > 0,
    );
  }

  private async fireIncoming(): Promise<void> {
    const loggedIn = await this.isUserLoggedIn();
    if (!loggedIn) {
      this.cancelScheduled();
      return;
    }
    if (this.inCall) return;

    const candidates = this.getEligibleCandidates();
    if (candidates.length === 0) return;

    // Pick a candidate who hasn't been called recently
    let available = candidates.filter((p) => !this.calledProfileIds.has(p.id));
    if (available.length === 0) {
      // All have been called, reset except the current one to avoid immediate repeat
      const lastId = this.profile?.id;
      this.calledProfileIds.clear();
      if (lastId) this.calledProfileIds.add(lastId);
      available = candidates.filter((p) => !this.calledProfileIds.has(p.id));
      if (available.length === 0) available = candidates;
    }

    const picked = available[Math.floor(Math.random() * available.length)];
    this.profile = picked;
    this.calledProfileIds.add(picked.id);
    this.ringing = true;

    this.listeners.forEach((cb) => {
      try {
        cb(this.profile!);
      } catch (e) {}
    });
  }
}

export const incomingCallService = new IncomingCallService();
