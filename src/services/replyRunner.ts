import type { Profile } from "../data/mockProfiles";
import {
  ChatMessage,
  deliverLiveMessage,
  generateGiftThanks,
} from "./chatEngine";
import { incomingCallService } from "./incomingCallService";
import { ReplyPlan, schedulePlannedFollowUp } from "./personaEngine";
import { shouldTypingRestart, typingRestartDelayMs } from "./realism";

function jitter(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min));
}

/* ------------------------------------------------------------------ */
/* Screen-independent reply choreography.                              */
/*                                                                     */
/* Her replies used to live inside the chat screen (timers gated on    */
/* the screen's mounted flag). Leaving her chat killed her in-flight   */
/* reply silently. Now every plan runs here, keyed by profileId:       */
/* navigation between chats (or away from chat entirely) never drops   */
/* a message. Deliveries go through deliverLiveMessage (persist +      */
/* notify open screens + pop/vibration when he's elsewhere).           */
/* ------------------------------------------------------------------ */

/* ---------------- typing event bus (per-profile dots) ---------------- */

type TypingListener = (profileId: string, typing: boolean) => void;
const typingListeners = new Set<TypingListener>();
const typingState = new Map<string, boolean>();

/** Subscribe to her typing dots for ALL profiles. Returns unsub. */
export function subscribeTyping(cb: TypingListener): () => void {
  typingListeners.add(cb);
  return () => {
    typingListeners.delete(cb);
  };
}

/** Is she mid-typing for this profile right now? (re-enter safety) */
export function isTypingFor(profileId: string): boolean {
  return typingState.get(profileId) ?? false;
}

function setTyping(profileId: string, typing: boolean): void {
  typingState.set(profileId, typing);
  typingListeners.forEach((cb) => {
    try {
      cb(profileId, typing);
    } catch (e) {}
  });
}

/* ---------------- nudge guard (service-level user-send clock) ---------------- */

const lastUserMsgAt = new Map<string, number>();

/** Chat screen calls this on every user send (any profile). */
export function notifyUserSent(profileId: string): void {
  lastUserMsgAt.set(profileId, Date.now());
}

/* ---------------- timer registry (module lifetime, never screen-tied) ------- */

const runnerTimers = new Map<string, any[]>();

function track(profileId: string, t: any): any {
  const list = runnerTimers.get(profileId) ?? [];
  list.push(t);
  runnerTimers.set(profileId, list);
  return t;
}

function after(profileId: string, ms: number, fn: () => void): void {
  track(profileId, setTimeout(fn, Math.max(0, ms)));
}

/* ---------------- delivery --------------------------------------------------- */

function deliverBubble(
  profileId: string,
  suffix: string,
  text: string,
  photo?: { url: string; cost: number },
): Promise<void> {
  const locked = !!photo && photo.cost > 0;
  const msg: ChatMessage = {
    id: `msg-run-${suffix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    sender: "profile",
    text,
    timestamp: Date.now(),
    status: "delivered",
    type: photo ? (locked ? "locked_photo" : "photo") : "text",
    mediaUrl: photo?.url,
    isBlurred: photo ? locked : false,
    isUnlocked: photo ? !locked : undefined,
    unlockCost: photo && locked ? photo.cost : undefined,
  };
  return deliverLiveMessage(profileId, msg);
}

function fireSideEffects(profileId: string, plan: ReplyPlan): void {
  if (plan.followUp) schedulePlannedFollowUp(profileId, plan.followUp);
  if (plan.callRequest) {
    incomingCallService
      .requestCallFrom(
        profileId,
        plan.callRequest.minMs,
        plan.callRequest.maxMs,
      )
      .catch(() => {});
  }
}

/* ---------------- nudge (only if he stayed silent since her reply) ---------- */

function scheduleNudge(
  profileId: string,
  plan: ReplyPlan,
  sentAt: number,
): void {
  if (!plan.nudgeText || !plan.nudgeDelayMs) return;
  after(profileId, plan.nudgeDelayMs, () => {
    // He replied meanwhile (anywhere) → nudge cancelled. She never nags
    // after he already answered.
    if ((lastUserMsgAt.get(profileId) ?? 0) > sentAt) return;
    setTyping(profileId, true);
    after(profileId, 1500 + Math.floor(Math.random() * 2000), () => {
      if ((lastUserMsgAt.get(profileId) ?? 0) > sentAt) {
        setTyping(profileId, false);
        return;
      }
      setTyping(profileId, false);
      deliverBubble(
        profileId,
        "nudge",
        plan.nudgeText as string,
        undefined,
      ).catch(() => {});
    });
  });
}

/* ---------------- main entry: run her full reply plan ----------------------- */

export function runPlan(
  profile: Pick<Profile, "id">,
  plan: ReplyPlan,
): void {
  const profileId = profile.id;

  // "She's busy" flicker: dots appear briefly mid-silence, then vanish.
  // Pure realism theater, the reply still lands inside the 10s cap.
  if (plan.flicker) {
    const f = plan.flicker;
    after(profileId, f.atMs, () => {
      setTyping(profileId, true);
      after(profileId, f.durationMs, () => setTyping(profileId, false));
    });
  }

  after(profileId, plan.preTypingMs, () => {
    // Phase 3 §3.4 imperfection layer: ~12% chance she restarts typing
    // mid-stream. The dots show → vanish → show again → deliver. Adds
    // real humanness without affecting the 10s cap.
    if (shouldTypingRestart()) {
      setTyping(profileId, true);
      after(profileId, typingRestartDelayMs(), () => {
        setTyping(profileId, false);
        after(profileId, jitter(400, 1200), () => {
          setTyping(profileId, true);
          after(profileId, plan.typingMs[0] ?? 2000, () => {
            setTyping(profileId, false);
            deliverFirstBubble();
          });
        });
      });
      return;
    }
    setTyping(profileId, true);
    after(profileId, plan.typingMs[0] ?? 2000, () => {
      setTyping(profileId, false);
      deliverFirstBubble();
    });

    function deliverFirstBubble() {
      const firstText = plan.photo?.caption
        ? `${plan.bubbles[0]}\n${plan.photo.caption}`
        : plan.bubbles[0];
      deliverBubble(profileId, "1", firstText, plan.photo)
        .catch(() => {})
        .finally(() => {
          fireSideEffects(profileId, plan);
        });
      const sentAt = Date.now();
      if (plan.bubbles.length > 1) {
        // Genuine afterthought 2nd bubble: human gap, then typing again.
        after(profileId, plan.gapMs, () => {
          setTyping(profileId, true);
          after(profileId, plan.typingMs[1] ?? 2500, () => {
            setTyping(profileId, false);
            deliverBubble(profileId, "2", plan.bubbles[1], undefined).catch(
              () => {},
            );
            scheduleNudge(profileId, plan, sentAt);
          });
        });
      } else {
        scheduleNudge(profileId, plan, sentAt);
      }
    }
  });
}

/* ---------------- gift thanks (also screen-independent now) ------------------ */

export function runGiftThanks(
  profileId: string,
  giftName: string,
  archetype: Parameters<typeof generateGiftThanks>[1],
): void {
  const thanksText = generateGiftThanks(giftName, archetype);
  const thanksDelay =
    1200 + thanksText.length * 36 + Math.floor(Math.random() * 1500);
  // She notices the gift (0.8-3.3s silence), then types a length-scaled thanks.
  after(profileId, 800 + Math.floor(Math.random() * 2500), () => {
    setTyping(profileId, true);
    after(profileId, thanksDelay, () => {
      setTyping(profileId, false);
      deliverBubble(profileId, "thanks", thanksText, undefined).catch(
        () => {},
      );
    });
  });
}
