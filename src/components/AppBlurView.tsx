import React from 'react';
import { BlurView, BlurViewProps } from 'expo-blur';
import { Platform, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { AppBlurConfig } from '../constants/blurConfig';

export interface AppBlurViewProps extends BlurViewProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * AppBlurView - Centralized Frosted Glass Blur Component
 * Adheres to AppBlurConfig so changing intensity, tint, or blur method
 * centrally in blurConfig.ts updates everywhere immediately.
 */
export default function AppBlurView({
  intensity = AppBlurConfig.intensity,
  tint = AppBlurConfig.tint,
  blurMethod = AppBlurConfig.blurMethod,
  blurReductionFactor = AppBlurConfig.blurReductionFactor,
  style,
  children,
  ...restProps
}: AppBlurViewProps) {
  // Automatically fallback to 'none' if blurTarget is not configured to avoid Android missing blurTarget warning
  const effectiveBlurMethod = restProps.blurTarget ? blurMethod : 'none';

  return (
    <BlurView
      intensity={intensity}
      tint={tint}
      blurMethod={effectiveBlurMethod}
      blurReductionFactor={blurReductionFactor}
      style={[
        styles.defaultGlass,
        style,
        Platform.OS === 'web' && ({
          backdropFilter: AppBlurConfig.webBackdropFilter,
          WebkitBackdropFilter: AppBlurConfig.webBackdropFilter,
        } as any),
      ]}
      {...restProps}
    >
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  defaultGlass: {
    backgroundColor: AppBlurConfig.backgroundColor,
  },
});
