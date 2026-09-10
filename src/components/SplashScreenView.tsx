import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SplashScreenViewProps {
  isLoading: boolean;
  onFinish: () => void;
}

export default function SplashScreenView({
  isLoading,
  onFinish,
}: SplashScreenViewProps) {
  const { isDark } = useTheme();

  // Animation values
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.75)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const badgesOpacity = useRef(new Animated.Value(0)).current;
  const badgesTranslateY = useRef(new Animated.Value(15)).current;

  // Continuous pulsating ripple animations
  const ripple1 = useRef(new Animated.Value(0)).current;
  const ripple2 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    // Stage 1: Reveal logo, text, and badges
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(badgesTranslateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(badgesOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Progress line animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1800,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();

    // Breathing pulse for the central logo
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // Ripple loops to simulate live incoming call signals
    const createRipple = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const r1 = createRipple(ripple1, 0);
    const r2 = createRipple(ripple2, 1000);
    r1.start();
    r2.start();

    // Ensure splash remains visible long enough for a luxury first impression
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 1800);

    return () => {
      clearTimeout(timer);
      pulseLoop.stop();
      r1.stop();
      r2.stop();
    };
  }, []);

  // Dismiss splash smoothly
  useEffect(() => {
    if (minTimeElapsed && !isLoading) {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }
  }, [minTimeElapsed, isLoading]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: containerOpacity,
          backgroundColor: isDark ? '#09070C' : '#FFF5F8',
        },
      ]}
      pointerEvents="box-none"
    >
      {/* Dynamic Background Gradient */}
      <LinearGradient
        colors={
          isDark
            ? ['#200818', '#110912', '#09070C']
            : ['#FFE4EC', '#FFF0F5', '#FFFFFF']
        }
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Center Content */}
      <View style={styles.centerContent}>
        {/* Animated Ripple Waves */}
        <Animated.View
          style={[
            styles.rippleRing,
            {
              borderColor: isDark ? 'rgba(246, 85, 146, 0.4)' : 'rgba(246, 85, 146, 0.35)',
              transform: [
                {
                  scale: ripple1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 2.4],
                  }),
                },
              ],
              opacity: ripple1.interpolate({
                inputRange: [0, 0.8, 1],
                outputRange: [0.6, 0.2, 0],
              }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.rippleRing,
            {
              borderColor: isDark ? 'rgba(255, 112, 160, 0.35)' : 'rgba(255, 112, 160, 0.3)',
              transform: [
                {
                  scale: ripple2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 2.4],
                  }),
                },
              ],
              opacity: ripple2.interpolate({
                inputRange: [0, 0.8, 1],
                outputRange: [0.6, 0.2, 0],
              }),
            },
          ]}
        />

        {/* Ambient Glow Orb */}
        <View
          style={[
            styles.glowOrb,
            {
              backgroundColor: isDark
                ? 'rgba(246, 85, 146, 0.25)'
                : 'rgba(246, 85, 146, 0.18)',
            },
          ]}
        />

        {/* Logo Badge */}
        <Animated.View
          style={[
            styles.logoWrap,
            {
              opacity: logoOpacity,
              transform: [{ scale: Animated.multiply(logoScale, pulseAnim) }],
            },
          ]}
        >
          <LinearGradient
            colors={['#FF2A7A', '#F65592', '#FF70A0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoGradient}
          >
            <Ionicons name="videocam" size={46} color="#FFFFFF" />
            <View style={styles.floatingHeart}>
              <Ionicons name="heart" size={20} color="#FFFFFF" />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Title & Seductive Taglines */}
        <Animated.View
          style={[
            styles.titleCol,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          <View style={styles.titleRow}>
            <Text style={[styles.brandTitle, { color: isDark ? '#FFFFFF' : '#1F2937' }]}>
              Dream
            </Text>
            <Text style={[styles.brandTitle, styles.brandTitleAccent]}>Date</Text>
          </View>
          <Text style={[styles.brandSubtitle, { color: isDark ? '#F65592' : '#E11D48' }]}>
            1-on-1 Private Live Video Calls
          </Text>
          <Text style={[styles.brandCaption, { color: isDark ? '#DFBEC6' : '#6B7280' }]}>
            Connect instantly with beautiful female companions
          </Text>
        </Animated.View>

        {/* Feature Badges Row */}
        <Animated.View
          style={[
            styles.badgesRow,
            {
              opacity: badgesOpacity,
              transform: [{ translateY: badgesTranslateY }],
            },
          ]}
        >
          <View
            style={[
              styles.badgePill,
              {
                backgroundColor: isDark ? 'rgba(246, 85, 146, 0.16)' : 'rgba(246, 85, 146, 0.1)',
                borderColor: isDark ? 'rgba(246, 85, 146, 0.3)' : 'rgba(246, 85, 146, 0.25)',
              },
            ]}
          >
            <Text style={styles.badgeFire}>🔥</Text>
            <Text style={[styles.badgeText, { color: isDark ? '#FFFFFF' : '#9D174D' }]}>
              3,500+ Online
            </Text>
          </View>

          <View
            style={[
              styles.badgePill,
              {
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.16)' : 'rgba(16, 185, 129, 0.1)',
                borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.25)',
              },
            ]}
          >
            <Ionicons name="flash" size={12} color="#10B981" />
            <Text style={[styles.badgeText, { color: isDark ? '#A7F3D0' : '#065F46' }]}>
              Instant Connect
            </Text>
          </View>

          <View
            style={[
              styles.badgePill,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <Ionicons name="shield-checkmark" size={12} color="#F65592" />
            <Text style={[styles.badgeText, { color: isDark ? '#E5E7EB' : '#374151' }]}>
              100% Private
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Bottom Loading Progress Bar */}
      <View style={styles.bottomFooter}>
        <View
          style={[
            styles.progressBarTrack,
            { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' },
          ]}
        >
          <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
        </View>
        <Text style={[styles.secureText, { color: isDark ? 'rgba(223, 190, 198, 0.65)' : '#9CA3AF' }]}>
          Encrypted HD Video · Discreet Billing · 18+ Only
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999999,
    elevation: 999999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 24,
  },
  rippleRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    top: -15,
  },
  glowOrb: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -80,
  },
  logoWrap: {
    width: 104,
    height: 104,
    borderRadius: 34,
    shadowColor: '#F65592',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 28,
    elevation: 16,
    marginBottom: 24,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  floatingHeart: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#E11D48',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  titleCol: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandTitleAccent: {
    color: '#F65592',
  },
  brandSubtitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  brandCaption: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 5,
    borderWidth: 1,
  },
  badgeFire: {
    fontSize: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bottomFooter: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
    gap: 12,
  },
  progressBarTrack: {
    width: 140,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F65592',
    borderRadius: 2,
  },
  secureText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.4,
  },
});
