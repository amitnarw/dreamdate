import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={DarkTheme}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0C0F10' } }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
