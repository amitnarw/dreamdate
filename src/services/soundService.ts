/**
 * Expo Go-safe audio wrapper for UI sounds (ringtone + message pop).
 *
 * Hardened for real Android release builds (researched: expo/expo#42814,
 * #34555, #46131):
 *
 * 1. Assets resolve via `expo-asset` (`Asset.fromModule(...).localUri`) on
 *    Android ,  `require()` ids alone can fail to resolve in production.
 * 2. NEVER `seekTo`/`play()` an unloaded player. `play()` on an unloaded
 *    player is silently dead on Android (first-play silence). We wait for
 *    `isLoaded` via the `playbackStatusUpdate` listener with a timeout
 *    fallback before every play.
 * 3. `message.wav` is padded to 1.0s because sub-1s sounds never play on
 *    first press on Android (#42814 workaround).
 *
 * Same lazy-import pattern as safeNotifications: expo-audio is only loaded
 * via dynamic `import()` on first use. Any failure silently no-ops.
 *
 * Assets are synthesized locally ,  see scripts/generate-sounds.js.
 */

import { Platform } from "react-native";

const RING_REQUIRE = require("../../assets/sounds/ring.wav");
const POP_REQUIRE = require("../../assets/sounds/message.wav");

let modPromise: Promise<any> | null = null;
let modeSet = false;

function loadAudio(): Promise<any | null> {
  if (!modPromise) {
    modPromise = import("expo-audio").then((m) => m ?? null).catch(() => null);
  }
  return modPromise;
}

async function ensureMode(Audio: any): Promise<void> {
  if (modeSet) return;
  modeSet = true;
  try {
    // playsInSilentMode so the ring/pop is always heard; mix so we never
    // kill the user's background music.
    await Audio.setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "mixWithOthers",
    });
  } catch (e) {}
}

/** Resolve a require()d asset to a release-safe playable source. */
async function resolveSource(mod: any, reqId: number): Promise<any> {
  try {
    const { Asset } = await import("expo-asset").catch(() => ({ Asset: null }));
    if (Asset?.fromModule) {
      const asset = Asset.fromModule(reqId);
      try {
        await asset.downloadAsync();
      } catch (e) {}
      const uri = asset.localUri || asset.uri;
      if (uri && Platform.OS === "android") return { uri };
    }
  } catch (e) {}
  return reqId;
}

/** Wait until the player reports isLoaded (with timeout fallback). */
function waitLoaded(player: any, timeoutMs = 2500): Promise<void> {
  return new Promise((resolve) => {
    try {
      if (player?.isLoaded) {
        resolve();
        return;
      }
    } catch (e) {}
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        try {
          sub?.remove?.();
        } catch (e) {}
        resolve();
      }
    };
    const timer = setTimeout(finish, timeoutMs);
    let sub: any = null;
    try {
      sub = player?.addListener?.("playbackStatusUpdate", (status: any) => {
        if (status?.isLoaded) {
          clearTimeout(timer);
          finish();
        }
      });
      // If listeners aren't supported, the timeout still resolves us.
      if (!sub) {
        // Poll as a last resort.
        const poll = setInterval(() => {
          try {
            if (player?.isLoaded) {
              clearInterval(poll);
              clearTimeout(timer);
              finish();
            }
          } catch (e) {}
        }, 50);
        setTimeout(() => clearInterval(poll), timeoutMs);
      }
    } catch (e) {
      clearTimeout(timer);
      finish();
    }
  });
}

let ringPlayer: any = null;
let ringSource: any = null;

/** Start the looping incoming-call ringtone. Safe to call repeatedly. */
export async function startRinging(): Promise<void> {
  try {
    const mod = await loadAudio();
    if (!mod?.createAudioPlayer) return;
    await ensureMode(mod.Audio);
    if (!ringPlayer) {
      ringSource = await resolveSource(mod, RING_REQUIRE);
      ringPlayer = mod.createAudioPlayer(ringSource);
      ringPlayer.loop = true;
      ringPlayer.volume = 1.0;
    }
    // Never play (or seek) before the asset is loaded ,  silent otherwise.
    await waitLoaded(ringPlayer);
    try {
      await ringPlayer.seekTo(0);
    } catch (e) {}
    ringPlayer.play();
  } catch (e) {}
}

/** Stop the ringtone and rewind it. */
export async function stopRinging(): Promise<void> {
  try {
    ringPlayer?.pause();
    try {
      if (ringPlayer?.isLoaded) await ringPlayer?.seekTo(0);
    } catch (e) {}
  } catch (e) {}
}

let popPlayer: any = null;

/** One-shot chat "pop" when her message lands. */
export async function playMessagePop(): Promise<void> {
  try {
    const mod = await loadAudio();
    if (!mod?.createAudioPlayer) return;
    await ensureMode(mod.Audio);
    if (!popPlayer) {
      const src = await resolveSource(mod, POP_REQUIRE);
      popPlayer = mod.createAudioPlayer(src);
      popPlayer.loop = false;
      popPlayer.volume = 0.9;
    }
    await waitLoaded(popPlayer);
    try {
      await popPlayer.seekTo(0);
    } catch (e) {}
    popPlayer.play();
  } catch (e) {}
}
