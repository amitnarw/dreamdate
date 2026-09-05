import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppBlurView from '../../components/AppBlurView';
import { StitchTheme } from '../../constants/theme';
import { TabBlurProvider, useTabBlur } from '../../context/TabBlurContext';

function FloatingGlassTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const [tabBarWidth, setTabBarWidth] = useState(340);

  // Animated sliding indicator position
  const indicatorAnim = useRef(new Animated.Value(state.index)).current;
  const numTabs = state.routes.length;
  const containerPadding = 12;
  const usableWidth = Math.max(0, tabBarWidth - containerPadding);
  const slotWidth = numTabs > 0 ? usableWidth / numTabs : 100;
  const indicatorPillWidth = Math.max(48, slotWidth - 6);

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: state.index,
      friction: 8,
      tension: 65,
      useNativeDriver: true,
    }).start();
  }, [state.index]);

  const onPillLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - tabBarWidth) > 2) {
      setTabBarWidth(w);
    }
  };

  const translateX = indicatorAnim.interpolate({
    inputRange: state.routes.map((_: any, i: number) => i),
    outputRange: state.routes.map((_: any, i: number) => {
      // Center the wide indicator pill inside each slot
      const slotCenter = i * slotWidth + slotWidth / 2;
      return slotCenter - indicatorPillWidth / 2;
    }),
  });

  const TAB_LABELS: Record<string, { label: string; icon: any; iconOutline: any }> = {
    index: { label: 'Discover', icon: 'heart', iconOutline: 'heart-outline' },
    history: { label: 'Messages', icon: 'chatbubbles', iconOutline: 'chatbubbles-outline' },
    profile: { label: 'Profile', icon: 'person', iconOutline: 'person-outline' },
  };

  return (
    <View
      style={[
        styles.navContainer,
        {
          bottom: Math.max(insets.bottom, 16) + 4,
        },
      ]}
      pointerEvents="box-none"
    >
      <AppBlurView
        style={styles.floatingGlassPill}
        onLayout={onPillLayout}
      >
        {/* Animated Sliding Wide Pill */}
        <Animated.View
          style={[
            styles.slidingGlowPill,
            {
              width: indicatorPillWidth,
              transform: [{ translateX }],
            },
          ]}
        />

        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const meta = TAB_LABELS[route.name] || {
            label: route.name,
            icon: 'ellipse',
            iconOutline: 'ellipse-outline',
          };

          const onPress = () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch (e) {}

            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.85}
              style={[styles.tabSlot, { width: slotWidth }]}
            >
              <View style={styles.tabPillContent}>
                <Ionicons
                  name={isFocused ? meta.icon : meta.iconOutline}
                  size={19}
                  color={isFocused ? '#FFFFFF' : 'rgba(241, 224, 228, 0.65)'}
                />
                <Animated.Text
                  style={[
                    styles.tabLabelText,
                    isFocused ? styles.tabLabelTextActive : styles.tabLabelTextInactive,
                  ]}
                  numberOfLines={1}
                >
                  {meta.label}
                </Animated.Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </AppBlurView>
    </View>
  );
}

export default function TabLayout() {
  return (
    <TabBlurProvider>
      <Tabs
        tabBar={(props) => <FloatingGlassTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          animation: 'shift', // Moving animation when changing tabs
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Discover' }} />
        <Tabs.Screen name="history" options={{ title: 'History' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </TabBlurProvider>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  floatingGlassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '94%',
    maxWidth: 420,
    height: 58,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: 'rgba(28, 18, 22, 0.72)',
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
    position: 'relative',
  },
  slidingGlowPill: {
    position: 'absolute',
    left: 6,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F65592',
    shadowColor: '#F65592',
    shadowOpacity: 0.75,
    shadowRadius: 14,
    elevation: 8,
  },
  tabSlot: {
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  tabPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 6,
  },
  tabLabelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabLabelTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabLabelTextInactive: {
    color: 'rgba(241, 224, 228, 0.65)',
  },
});
