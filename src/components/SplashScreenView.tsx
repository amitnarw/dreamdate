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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SplashScreenViewProps {
  isLoading: boolean;
  onFinish: () => void;
}

export default function SplashScreenView({
  isLoading,
  onFinish,
}: SplashScreenViewProps) {
  // Animation values
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(15)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowScale = useRef(new Animated.Value(0.9)).current;

  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  // Initial reveal animation & pulsing glow
  useEffect(() => {
    // Stage 1: Reveal logo with energetic spring & text fade-up
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(textTranslateY, {
        toValue: 0,
        duration: 500,
        delay: 150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 500,
        delay: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // Stage 2: Continuous ambient breathing pulse
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1100,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(glowScale, {
            toValue: 1.2,
            duration: 1100,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1100,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(glowScale, {
            toValue: 0.9,
            duration: 1100,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulseLoop.start();

    // Ensure splash is visible for at least 1500ms for branded luxury experience
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 1500);

    return () => {
      clearTimeout(timer);
      pulseLoop.stop();
    };
  }, []);

  // When minimum time has elapsed and auth is done loading, smoothly dismiss
  useEffect(() => {
    if (minTimeElapsed && !isLoading) {
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 380,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }
  }, [minTimeElapsed, isLoading]);

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: containerOpacity },
      ]}
      pointerEvents="box-none"
    >
      <LinearGradient
        colors={['#180812', '#0C0F10', '#060708']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Center Content */}
      <View style={styles.centerContent}>
        {/* Ambient Glow Orb */}
        <Animated.View
          style={[
            styles.glowOrb,
            {
              transform: [{ scale: glowScale }],
            },
          ]}
        />

        {/* App Logo Badge */}
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
            colors={['#FF2A7A', '#F65592', '#FF69B4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoGradient}
          >
            <Ionicons name="heart" size={44} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>

        {/* Title & Tagline */}
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
            <Text style={styles.brandTitle}>Dream</Text>
            <Text style={[styles.brandTitle, styles.brandTitleAccent]}>Date</Text>
          </View>
          <Text style={styles.brandSubtitle}>Curated 1-on-1 Companionship</Text>
        </Animated.View>
      </View>

      {/* Subtle Bottom Footer */}
      <View style={styles.bottomFooter}>
        <View style={styles.loadingDotsRow}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <Text style={styles.secureText}>100% Private & Encrypted</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 999999,
    elevation: 999999,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0C0F10',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowOrb: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(246, 85, 146, 0.22)',
  },
  logoWrap: {
    width: 96,
    height: 96,
    borderRadius: 30,
    shadowColor: '#F65592',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 12,
    marginBottom: 22,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    alignItems: 'center',
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  brandTitleAccent: {
    color: '#F65592',
  },
  brandSubtitle: {
    fontSize: 13,
    color: 'rgba(223, 190, 198, 0.75)',
    fontWeight: '500',
    letterSpacing: 0.8,
  },
  bottomFooter: {
    position: 'absolute',
    bottom: 48,
    alignItems: 'center',
    gap: 12,
  },
  loadingDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  dotActive: {
    backgroundColor: '#F65592',
    width: 16,
    borderRadius: 8,
  },
  secureText: {
    fontSize: 11,
    color: 'rgba(223, 190, 198, 0.5)',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
