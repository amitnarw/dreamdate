import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  AppState,
  AppStateStatus,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppBackground from './AppBackground';
import { useTheme } from '../context/ThemeContext';

interface OfflineNoticeProps {
  children?: React.ReactNode;
}

export default function OfflineNotice({ children }: OfflineNoticeProps) {
  const { isDark } = useTheme();
  const [isOffline, setIsOffline] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const checkConnectivity = useCallback(async () => {
    try {
      // Fast lightweight HEAD / 204 ping
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch('https://clients3.google.com/generate_204', {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      // If status is 204 or 200, we are online
      if (response.status >= 200 && response.status < 400) {
        setIsOffline(false);
        return true;
      } else {
        setIsOffline(true);
        return false;
      }
    } catch (e) {
      // Network error or timeout -> offline
      setIsOffline(true);
      return false;
    }
  }, []);

  const handleManualRetry = async () => {
    setIsChecking(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    const online = await checkConnectivity();
    setIsChecking(false);

    if (online) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
    } else {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch (e) {}
    }
  };

  useEffect(() => {
    checkConnectivity();

    // Check on app state change (foregrounding)
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        checkConnectivity();
      }
    });

    // Periodic connectivity check every 15s
    const interval = setInterval(() => {
      checkConnectivity();
    }, 15000);

    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [checkConnectivity]);

  useEffect(() => {
    if (isOffline) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isOffline]);

  if (!isOffline) {
    return <>{children}</>;
  }

  return (
    <AppBackground>
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.centerCard}>
          {/* Animated Offline Icon */}
          <Animated.View
            style={[
              styles.iconCircle,
              {
                backgroundColor: isDark
                  ? 'rgba(246, 85, 146, 0.16)'
                  : 'rgba(246, 85, 146, 0.12)',
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Ionicons name="cloud-offline-outline" size={54} color="#F65592" />
          </Animated.View>

          <Text
            style={[
              styles.title,
              { color: isDark ? '#FFFFFF' : '#191C1D' },
            ]}
          >
            No Internet Connection
          </Text>

          <Text
            style={[
              styles.subtitle,
              { color: isDark ? 'rgba(241, 224, 228, 0.70)' : '#6B7280' },
            ]}
          >
            Please check your Wi-Fi or mobile data settings and reconnect to enjoy DreamDate.
          </Text>

          {/* Retry Button */}
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={handleManualRetry}
            disabled={isChecking}
            activeOpacity={0.85}
          >
            {isChecking ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.btnContent}>
                <Ionicons name="refresh" size={18} color="#FFFFFF" />
                <Text style={styles.retryBtnText}>Retry Connection</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  centerCard: {
    alignItems: 'center',
    maxWidth: 340,
  },
  iconCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 28,
  },
  retryBtn: {
    backgroundColor: '#F65592',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
    minWidth: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
