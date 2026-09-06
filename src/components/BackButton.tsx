import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import AppBlurView from './AppBlurView';
import { useTheme } from '../context/ThemeContext';

interface BackButtonProps {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  iconColor?: string;
  size?: number;
}

/**
 * Standard Stitch-Style Back Button used across the entire app
 * Circular frosted button with chevron-back icon powered by centralized AppBlurView
 * Fully adaptive to light and dark modes.
 */
export default function BackButton({
  onPress,
  style,
  iconColor,
  size = 20,
}: BackButtonProps) {
  const router = useRouter();
  const { isDark } = useTheme();

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}

    if (onPress) {
      onPress();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const effectiveIconColor = iconColor || (isDark ? '#FFFFFF' : '#191C1D');

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        styles.wrap,
        {
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
          borderWidth: 1,
        },
        style,
      ]}
      activeOpacity={0.8}
      accessibilityLabel="Back"
    >
      <AppBlurView
        style={[
          styles.circleBtn,
          {
            backgroundColor: isDark
              ? 'rgba(28, 18, 22, 0.50)'
              : 'rgba(255, 255, 255, 0.85)',
          },
        ]}
        tint={isDark ? 'dark' : 'light'}
      >
        <Ionicons name="chevron-back" size={size} color={effectiveIconColor} />
      </AppBlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
