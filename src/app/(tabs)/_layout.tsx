import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  LayoutChangeEvent,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppBlurView from '../../components/AppBlurView';
import { AppBlurConfig } from '../../constants/blurConfig';
import { TabBlurProvider, useTabBlur } from '../../context/TabBlurContext';
import { useTheme } from '../../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function FloatingGlassTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { targets, tabVersion } = useTabBlur();

  // Compute exact geometry so from frame 0 there is never a width mismatch
  const defaultBarWidth = Math.min(390, SCREEN_WIDTH * 0.92);
  const [tabBarWidth, setTabBarWidth] = useState(defaultBarWidth);

  const numTabs = state.routes.length;
  const containerPadding = 12; // 6px each side
  const usableWidth = Math.max(0, tabBarWidth - containerPadding);
  const slotWidth = numTabs > 0 ? usableWidth / numTabs : 100;
  const indicatorPillWidth = Math.max(48, slotWidth - 6);

  const indicatorAnim = useRef(new Animated.Value(state.index)).current;

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: state.index,
      friction: 9,
      tension: 70,
      useNativeDriver: true,
    }).start();
  }, [state.index]);

  const onPillLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - tabBarWidth) > 1) {
      setTabBarWidth(w);
    }
  };

  const translateX = indicatorAnim.interpolate({
    inputRange: state.routes.map((_: any, i: number) => i),
    outputRange: state.routes.map((_: any, i: number) => {
      const slotCenter = i * slotWidth + slotWidth / 2;
      return slotCenter - indicatorPillWidth / 2;
    }),
  });

  const TAB_ICONS: Record<string, { icon: any; iconOutline: any }> = {
    index: { icon: 'heart', iconOutline: 'heart-outline' },
    history: { icon: 'chatbubbles', iconOutline: 'chatbubbles-outline' },
    profile: { icon: 'person', iconOutline: 'person-outline' },
  };

  const currentRouteName = (state.routes[state.index]?.name || 'index') as keyof typeof targets;
  const currentBlurTarget = targets[currentRouteName] || targets.index;

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
        key={`bottom-tab-blur-${isDark ? 'dark' : 'light'}`}
        style={[
          styles.floatingGlassPill,
          {
            backgroundColor: isDark
              ? 'rgba(20, 14, 18, 0.55)'
              : 'rgba(255, 255, 255, 0.75)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 6,
          },
        ]}
        blurTarget={currentBlurTarget}
        intensity={AppBlurConfig.intensity}
        tint={isDark ? 'dark' : 'light'}
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

        {/* Tab Items with flex: 1 for perfectly symmetrical edge-to-edge layout */}
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const meta = TAB_ICONS[route.name] || {
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
              style={styles.tabSlot}
            >
              <View style={styles.tabPillContent}>
                <Ionicons
                  name={isFocused ? meta.icon : meta.iconOutline}
                  size={23}
                  color={
                    isFocused
                      ? '#FFFFFF'
                      : isDark
                      ? 'rgba(241, 224, 228, 0.70)'
                      : 'rgba(50, 50, 55, 0.75)'
                  }
                />
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
          animation: 'none',
          lazy: false,
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
    width: '92%',
    maxWidth: 390,
    height: 58,
    borderRadius: 30,
    overflow: 'hidden',
    paddingHorizontal: 6,
    position: 'relative',
  },
  slidingGlowPill: {
    position: 'absolute',
    left: 6,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F65592',
  },
  tabSlot: {
    flex: 1,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  tabPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
