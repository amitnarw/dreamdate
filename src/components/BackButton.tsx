import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleProp, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import AppBlurView from './AppBlurView';

interface BackButtonProps {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  iconColor?: string;
  size?: number;
}

/**
 * Standard Stitch-Style Back Button used across the entire app
 * Circular frosted button with chevron-back icon powered by centralized AppBlurView
 */
export default function BackButton({
  onPress,
  style,
  iconColor = '#F1E0E4',
  size = 20,
}: BackButtonProps) {
  const router = useRouter();

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

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.wrap, style]}
      activeOpacity={0.8}
      accessibilityLabel="Back"
    >
      <AppBlurView style={styles.circleBtn}>
        <Ionicons name="chevron-back" size={size} color={iconColor} />
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
