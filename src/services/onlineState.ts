/**
 * Shared online/offline state. Driven by `OfflineNotice`, consumed by the
 * engagement funnel so we never fire "she texted you" notifications or run
 * in-app engagement timers while the user is denied app access due to no
 * network.
 *
 * Default is `true` (assume online until proven otherwise). `OfflineNotice`
 * flips it to `false` whenever its connectivity check fails and back to
 * `true` on recovery.
 */

let online = true;
const listeners = new Set<(value: boolean) => void>();

export function isOnline(): boolean {
  return online;
}

export function setOnline(next: boolean): void {
  if (next === online) return;
  online = next;
  listeners.forEach((l) => {
    try {
      l(online);
    } catch (e) {}
  });
}

export function subscribeOnline(listener: (value: boolean) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
