import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface AppBackgroundProps extends ViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * AppBackground - Universal App Background Component
 * 
 * Provides base theme canvas (#0C0F10 Dark / #F6F7F9 Light) overlaid with
 * a vertical linear gradient from transparent at the top to primary color at 30% opacity at the bottom.
 */
export default function AppBackground({ children, style, ...restProps }: AppBackgroundProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
        style,
      ]}
      {...restProps}
    >
      <LinearGradient
        colors={['transparent', 'rgba(246, 85, 146, 0.10)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
});
