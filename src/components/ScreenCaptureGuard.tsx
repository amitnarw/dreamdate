import { usePreventScreenCapture } from "expo-screen-capture";
import * as React from "react";

const APP_ROOT_KEY = "app-root";

/**
 * Root-level screen capture protection.
 *
 * Mounted once at the app root (`src/app/_layout.tsx`). While mounted,
 * the underlying window has FLAG_SECURE set on Android, so screenshots,
 * screen recordings, and the recents-apps preview all come out fully
 * black. On iOS 11+ screen recording and iOS 13+ screenshots are also
 * blocked via the platform's secure-screen API.
 *
 * Uses a unique `key` so it does not collide with any other instance of
 * the hook (e.g. the one inside the incoming-call overlay, which lives in
 * a separate native Modal window on Android and needs its own FLAG_SECURE).
 */
export default function ScreenCaptureGuard() {
  usePreventScreenCapture(APP_ROOT_KEY);
  return null;
}
