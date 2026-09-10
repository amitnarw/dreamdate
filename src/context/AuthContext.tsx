import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useRouter, useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { initFirstRunEngagement } from '../services/engagementService';
import { addCoins } from '../services/wallet';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isGoogleUser: boolean;
  termsAccepted: boolean;
  joinedAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  fastLogin: (acceptTerms: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const AUTH_STORAGE_KEY = '@dreamdate_auth_user_v1';
const WELCOME_BONUS_AWARDED_KEY = '@dreamdate_welcome_bonus_v1';

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  fastLogin: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // Load existing local session on boot
  useEffect(() => {
    async function loadStoredUser() {
      try {
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to load local user auth session', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadStoredUser();
  }, []);

  // Route-guarding: redirect to login if unauthenticated, or to tabs if authenticated
  useEffect(() => {
    if (isLoading) return;

    const inLoginScreen = segments[0] === 'login';

    if (!user && !inLoginScreen) {
      router.replace('/login' as any);
    } else if (user && inLoginScreen) {
      router.replace('/(tabs)' as any);
    }
  }, [user, isLoading, segments]);

  const fastLogin = async (acceptTerms: boolean) => {
    if (!acceptTerms) {
      throw new Error('You must accept the User Agreement and Privacy Policy to continue.');
    }

    try {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}

      // Fast Anonymous Local Guest Profile (100% Offline, no tracking)
      const guestId = `guest_${Date.now().toString(36)}`;
      const localGuestUser: AuthUser = {
        id: guestId,
        name: 'Guest User',
        email: '',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
        isGoogleUser: false,
        termsAccepted: true,
        joinedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(localGuestUser));

      // Award 100 Welcome Bonus Coins on first fast login
      const alreadyAwarded = await AsyncStorage.getItem(WELCOME_BONUS_AWARDED_KEY);
      if (!alreadyAwarded) {
        await addCoins(100);
        await AsyncStorage.setItem(WELCOME_BONUS_AWARDED_KEY, 'true');
      }

      setUser(localGuestUser);

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}

      // Kick off the first-run engagement funnel (pre-seed thread, schedule
      // the first-message + missed-call notifications).
      try {
        await initFirstRunEngagement();
      } catch (e) {}

      router.replace('/(tabs)' as any);
    } catch (error) {
      console.error('Fast Login failed', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}

      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
      router.replace('/login' as any);
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, fastLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
