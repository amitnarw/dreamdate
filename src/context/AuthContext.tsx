import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useRouter, useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { addCoins } from '../services/wallet';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isGoogleUser: boolean;
  joinedAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AUTH_STORAGE_KEY = '@dreamdate_auth_user_v1';
const WELCOME_BONUS_AWARDED_KEY = '@dreamdate_welcome_bonus_v1';

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  loginWithGoogle: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // Load existing session on boot
  useEffect(() => {
    async function loadStoredUser() {
      try {
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to load user auth session', e);
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

  const loginWithGoogle = async () => {
    try {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}

      // High-resolution Google User Profile
      const mockGoogleUser: AuthUser = {
        id: `google_${Date.now()}`,
        name: 'Alex Vance',
        email: 'alex.vance@gmail.com',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
        isGoogleUser: true,
        joinedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockGoogleUser));

      // Award 100 Welcome Bonus Coins on first Google sign-in
      const alreadyAwarded = await AsyncStorage.getItem(WELCOME_BONUS_AWARDED_KEY);
      if (!alreadyAwarded) {
        await addCoins(100);
        await AsyncStorage.setItem(WELCOME_BONUS_AWARDED_KEY, 'true');
      }

      setUser(mockGoogleUser);

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}

      router.replace('/(tabs)' as any);
    } catch (error) {
      console.error('Google Sign-in failed', error);
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
    <AuthContext.Provider value={{ user, isLoading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
