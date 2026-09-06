import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppBackground from '../components/AppBackground';
import OfflineNotice from '../components/OfflineNotice';
import SplashScreenView from '../components/SplashScreenView';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider as AppThemeProvider, useTheme } from '../context/ThemeContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { isDark } = useTheme();
  const { user, isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const router = useRouter();

  // Hide the native OS splash screen once our animated in-app splash is ready
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

        {/* Dedicated In-App Animated Splash Scene */}
        {showSplash && (
          <SplashScreenView
            isLoading={isLoading}
            onFinish={handleSplashFinish}
          />
        )}
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

