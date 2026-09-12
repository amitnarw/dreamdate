import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
  Stack,
  useRouter,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppBackground from "../components/AppBackground";
import IncomingCallOverlay from "../components/IncomingCallOverlay";
import OfflineNotice from "../components/OfflineNotice";
import PermissionsPrimerModal from "../components/PermissionsPrimerModal";
import SplashScreenView from "../components/SplashScreenView";
import { AuthProvider, useAuth } from "../context/AuthContext";
import {
  ThemeProvider as AppThemeProvider,
  useTheme,
} from "../context/ThemeContext";
import { recoverUnfinishedPurchases } from "../services/billingService";
import { warmNLU } from "../services/nluService";
import { getActiveChatProfileId } from "../services/chatEngine";
import {
  NOTIFICATION_CHANNEL_ID,
  deliverSeededMessage,
  initFirstRunEngagement,
  markCallFunnelFired,
  markEngagementDone,
  markMessageFunnelFired,
} from "../services/engagementService";
import { isOnline, subscribeOnline } from "../services/onlineState";
import { startProactiveLoop } from "../services/proactiveService";
import {
  safeAddNotificationResponseReceivedListener,
  safeGetAndroidImportance,
  safeGetLastNotificationResponseAsync,
  safeGetPermissionsAsync,
  safeRequestPermissionsAsync,
  safeSetNotificationChannelAsync,
  safeSetNotificationHandler,
} from "../services/safeNotifications";

SplashScreen.preventAutoHideAsync().catch(() => {});

const PERM_PRIMER_KEY = "@dreamdate_permissions_primed_v1";
const NOTIF_REPROMPT_KEY = "@dreamdate_notif_reprompt_v1";

function usePermissionsPrimer(visible: boolean, onClose: () => void) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      try {
        const mod = await import("@react-native-async-storage/async-storage");
        const AsyncStorage = (mod as any).default ?? mod;
        const primed = await AsyncStorage.getItem(PERM_PRIMER_KEY);
        if (!cancelled && !primed) {
          // Slight delay so the home screen mounts first
          setTimeout(() => {
            if (!cancelled) setShow(true);
          }, 800);
        }
      } catch (e) {}
    })();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const close = async () => {
    try {
      const mod = await import("@react-native-async-storage/async-storage");
      const AsyncStorage = (mod as any).default ?? mod;
      await AsyncStorage.setItem(PERM_PRIMER_KEY, "1");
      // One-time re-check: Android 13+ silently drops EVERY notification
      // when POST_NOTIFICATIONS isn't granted (channel creation alone is
      // not enough). If the user skipped the primer ("Not now") or the OS
      // dialog was dismissed, ask once more ,  then never nag again.
      const reprompted = await AsyncStorage.getItem(NOTIF_REPROMPT_KEY);
      if (!reprompted) {
        await AsyncStorage.setItem(NOTIF_REPROMPT_KEY, "1");
        const perms = await safeGetPermissionsAsync();
        if (perms && perms.status !== "granted") {
          await safeRequestPermissionsAsync();
        }
      }
    } catch (e) {}
    setShow(false);
    onClose();
  };

  return { show, close };
}

async function requestAllPermissions(): Promise<void> {
  const Camera = await import("expo-camera").catch(() => null);
  if (Camera) {
    try {
      await Camera.Camera.requestCameraPermissionsAsync();
    } catch (e) {}
    try {
      await Camera.Camera.requestMicrophonePermissionsAsync();
    } catch (e) {}
  }
  // Channel must exist before prompt on Android 13+. Importance resolves
  // via the safe wrapper (never imports expo-notifications directly ,  that
  // would re-trigger the Expo Go warnOfExpoGoPushUsage throw).
  const Importance = await safeGetAndroidImportance();
  await safeSetNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
    name: "Private messages",
    importance: Importance?.HIGH ?? "high",
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#F65592",
  });
  await safeRequestPermissionsAsync();
}

function RootNavigator() {
  const { isDark } = useTheme();
  const { user, isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const router = useRouter();
  const { show: showPrimer, close: closePrimer } = usePermissionsPrimer(
    !!user,
    () => {},
  );
  const initialNotifHandled = useRef(false);
  const funnelRetried = useRef(false);

  // When the user transitions from offline → online (and they're signed in
  // but the funnel never started because they logged in while offline),
  // start the funnel then. The service's own isOnline() guard short-circuits
  // when still offline, so this is safe to leave subscribed.
  useEffect(() => {
    const unsub = subscribeOnline((online) => {
      if (!online) {
        funnelRetried.current = false;
        return;
      }
      if (user && !funnelRetried.current) {
        funnelRetried.current = true;
        initFirstRunEngagement().catch(() => {});
        startProactiveLoop().catch(() => {});
      }
    });
    // Also kick once on mount in case we're already online and funnel is pending
    if (user && isOnline()) {
      funnelRetried.current = true;
      initFirstRunEngagement().catch(() => {});
      startProactiveLoop().catch(() => {});
    }
    return unsub;
  }, [user]);

  // Set up foreground notification handler once
  useEffect(() => {
    safeSetNotificationHandler({
      handleNotification: async (notification: any) => {
        const notifProfileId = notification?.request?.content?.data?.profileId;
        const isCurrentActiveChat = !!(
          notifProfileId && getActiveChatProfileId() === notifProfileId
        );
        return {
          shouldShowBanner: !isCurrentActiveChat,
          shouldShowList: !isCurrentActiveChat,
          shouldPlaySound: !isCurrentActiveChat,
          shouldSetBadge: true,
        };
      },
    });

    // Bump launch counter for engagement gates (VIP teaser, etc.)
    (async () => {
      try {
        const mod = await import("@react-native-async-storage/async-storage");
        const AsyncStorage = (mod as any).default ?? mod;
        const raw = await AsyncStorage.getItem("@dreamdate_launch_count_v1");
        const n = raw ? parseInt(raw, 10) : 0;
        await AsyncStorage.setItem(
          "@dreamdate_launch_count_v1",
          (n + 1).toString(),
        );
      } catch (e) {}
    })();

    // Purchase recovery: credit any Play purchase that was paid but never
    // consumed (app killed mid-flow). Silent, idempotent, fire-and-forget.
    // No-op in Expo Go (native billing module absent).
    recoverUnfinishedPurchases().catch(() => {});

    // Pre-warm the NLU brain so the first user message doesn't pay the
    // model import latency (~50-150ms one-shot, then cached).
    warmNLU();
  }, []);

  // Handle initial notification (cold start from tap) + foreground listener
  useEffect(() => {
    if (initialNotifHandled.current) return;
    initialNotifHandled.current = true;

    (async () => {
      try {
        const last = await safeGetLastNotificationResponseAsync();
        if (last?.notification?.request?.content?.data?.url) {
          const url = last.notification.request.content.data.url as string;
          const type = last.notification.request.content.data?.type as string;
          const profileId = last.notification.request.content.data
            ?.profileId as string | undefined;
          const slotIndex = last.notification.request.content.data
            ?.slotIndex as number | undefined;
          setTimeout(() => {
            // Killed-app case: the funnel message was never written (the
            // in-app timer died with the app) ,  write it now so the chat
            // the notification points at isn't empty.
            if (type === "incoming_message") {
              (async () => {
                try {
                  if (profileId)
                    await deliverSeededMessage(profileId, slotIndex);
                  else await markMessageFunnelFired();
                } catch (e) {}
                router.push(url as any);
              })();
              return;
            }
            if (type === "missed_call") markCallFunnelFired();
            router.push(url as any);
          }, 800);
        }
      } catch (e) {}
    })();

    // Foreground: notification response received while app is open
    let sub: { remove: () => void } | null = null;
    safeAddNotificationResponseReceivedListener((response: any) => {
      const data: any = response?.notification?.request?.content?.data;
      if (data?.url) {
        if (data.type === "incoming_message") {
          (async () => {
            try {
              if (data.profileId)
                await deliverSeededMessage(data.profileId, data.slotIndex);
              else await markMessageFunnelFired();
            } catch (e) {}
            router.push(data.url as any);
          })();
          return;
        }
        if (data.type === "missed_call") markCallFunnelFired();
        router.push(data.url as any);
      }
    }).then((s) => {
      sub = s;
    });

    // If user already has organic threads, end the funnel
    (async () => {
      try {
        const mod = await import("@react-native-async-storage/async-storage");
        const AsyncStorage = (mod as any).default ?? mod;
        const raw = await AsyncStorage.getItem(
          "@dreamdate_active_chat_threads_v5",
        );
        const ids: string[] = raw ? JSON.parse(raw) : [];
        if (ids.length > 0) {
          await markEngagementDone();
        }
      } catch (e) {}
    })();

    return () => {
      try {
        sub?.remove();
      } catch (e) {}
    };
  }, []);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  // Navigate while the splash is still opaque; the 420ms fade then reveals
  // the already-rendered destination ,  no post-animation flicker.
  const handleSplashFadeStart = () => {
    if (!user) {
      router.replace("/login" as any);
    } else {
      router.replace("/(tabs)" as any);
    }
  };

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  return (
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <AppBackground>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="login"
            options={{
              headerShown: false,
              animation: "fade",
            }}
          />
          <Stack.Screen
            name="call/[id]"
            options={{
              headerShown: false,
              presentation: "fullScreenModal",
              animation: "fade",
            }}
          />
          <Stack.Screen
            name="chat/[id]"
            options={{
              headerShown: false,
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="profile/[id]"
            options={{
              headerShown: false,
              animation: "none",
              presentation: "transparentModal",
            }}
          />
        </Stack>

        {showSplash && (
          <SplashScreenView
            isLoading={isLoading}
            onFinish={handleSplashFinish}
            onFadeStart={handleSplashFadeStart}
          />
        )}

        <PermissionsPrimerModal
          visible={showPrimer}
          onClose={closePrimer}
          onEnable={requestAllPermissions}
        />

        {/* Mounted at root so the incoming-call request covers every
            screen (tabs, tab bar, modals) no matter where the user is */}
        <IncomingCallOverlay />
      </AppBackground>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <AuthProvider>
          <OfflineNotice>
            <RootNavigator />
          </OfflineNotice>
        </AuthProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}
