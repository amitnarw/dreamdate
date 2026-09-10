import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppBackground from '../components/AppBackground';
import OfflineNotice from '../components/OfflineNotice';
import PermissionsPrimerModal from '../components/PermissionsPrimerModal';
import SplashScreenView from '../components/SplashScreenView';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider as AppThemeProvider, useTheme } from '../context/ThemeContext';
import {
  setupNotificationHandler,
  markMessageFunnelFired,
  markCallFunnelFired,
  markEngagementDone,
} from '../services/engagementService';
import { MOCK_PROFILES } from '../data/mockProfiles';

SplashScreen.preventAutoHideAsync().catch(() => {});

const PERM_PRIMER_KEY = '@dreamdate_permissions_primed_v1';

function usePermissionsPrimer(visible: boolean, onClose: () => void) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
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
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem(PERM_PRIMER_KEY, '1');
    } catch (e) {}
    setShow(false);
    onClose();
  };

  return { show, close };
}

async function requestAllPermissions(): Promise<void> {
  const Camera = await import('expo-camera').catch(() => null);
  const Notifications = await import('expo-notifications').catch(() => null);
  if (Camera) {
    try {
      await Camera.Camera.requestCameraPermissionsAsync();
    } catch (e) {}
    try {
      await Camera.Camera.requestMicrophonePermissionsAsync();
    } catch (e) {}
  }
  if (Notifications) {
    try {
      // Channel must exist before prompt on Android 13+
      await Notifications.setNotificationChannelAsync('private-messages', {
        name: 'Private messages',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F65592',
      });
      await Notifications.requestPermissionsAsync();
    } catch (e) {}
  }
}

function RootNavigator() {
  const { isDark } = useTheme();
  const { user, isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const router = useRouter();
  const { show: showPrimer, close: closePrimer } = usePermissionsPrimer(!!user, () => {});
  const initialNotifHandled = useRef(false);

  // Set up foreground notification handler once
  useEffect(() => {
    setupNotificationHandler();

    // Bump launch counter for engagement gates (VIP teaser, etc.)
    (async () => {
      try {
        const mod = await import('@react-native-async-storage/async-storage');
        const AsyncStorage = (mod as any).default ?? mod;
        const raw = await AsyncStorage.getItem('@dreamdate_launch_count_v1');
        const n = raw ? parseInt(raw, 10) : 0;
        await AsyncStorage.setItem('@dreamdate_launch_count_v1', (n + 1).toString());
      } catch (e) {}
    })();
  }, []);

  // Handle initial notification (cold start from tap)
  useEffect(() => {
    if (initialNotifHandled.current) return;
    initialNotifHandled.current = true;
    (async () => {
      try {
        const last = await Notifications.getLastNotificationResponseAsync();
        if (last?.notification.request.content.data?.url) {
          const url = last.notification.request.content.data.url as string;
          const type = last.notification.request.content.data?.type as string;
          setTimeout(() => {
            if (type === 'incoming_message') markMessageFunnelFired();
            if (type === 'missed_call') markCallFunnelFired();
            router.push(url as any);
          }, 800);
        }
      } catch (e) {}
    })();

    // Foreground: notification response received while app is open
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data: any = response.notification.request.content.data;
      if (data?.url) {
        if (data.type === 'incoming_message') markMessageFunnelFired();
        if (data.type === 'missed_call') markCallFunnelFired();
        router.push(data.url as any);
      }
    });

    // If user already has organic threads, end the funnel
    (async () => {
      try {
        const mod = await import('@react-native-async-storage/async-storage');
        const AsyncStorage = (mod as any).default ?? mod;
        const raw = await AsyncStorage.getItem('@dreamdate_active_chat_threads_v5');
        const ids: string[] = raw ? JSON.parse(raw) : [];
        if (ids.length > 0) {
          await markEngagementDone();
        }
      } catch (e) {}
    })();

    return () => {
      try {
        sub.remove();
      } catch (e) {}
    };
  }, []);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
    if (!user) {
      router.replace('/login' as any);
    } else {
      router.replace('/(tabs)' as any);
    }
  };

  return (
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppBackground>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="login"
            options={{
              headerShown: false,
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="call/[id]"
            options={{
              headerShown: false,
              presentation: 'fullScreenModal',
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="chat/[id]"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="profile/[id]"
            options={{
              headerShown: false,
              animation: 'none',
              presentation: 'transparentModal',
            }}
          />
        </Stack>

        {showSplash && (
          <SplashScreenView
            isLoading={isLoading}
            onFinish={handleSplashFinish}
          />
        )}

        <PermissionsPrimerModal
          visible={showPrimer}
          onClose={closePrimer}
          onEnable={requestAllPermissions}
        />
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
