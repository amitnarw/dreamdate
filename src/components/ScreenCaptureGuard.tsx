import {
  allowScreenCaptureAsync,
  preventScreenCaptureAsync,
} from "expo-screen-capture";
import { useEffect } from "react";

const APP_ROOT_KEY = "app-root";

/**
 * Root-level screen capture protection.
 *
 * Mounted once at the app root (`src/app/_layout.tsx`). While mounted,
 * the underlying window has FLAG_SECURE set on Android, so screenshots,
 * screen recordings, and the recents-apps preview all come out fully
 * black.
 *
 * Uses safe async callers with .catch() so activity teardown / reload
 * never produces an unhandled promise rejection.
 */
export default function ScreenCaptureGuard() {
  useEffect(() => {
    preventScreenCaptureAsync(APP_ROOT_KEY).catch(() => {});
    return () => {
      allowScreenCaptureAsync(APP_ROOT_KEY).catch(() => {});
    };
  }, []);
  return null;
}
