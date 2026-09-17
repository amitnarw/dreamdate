import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Props {
  onPress: () => void;
  style?: any;
}

export default function AnimatedVipBadge({ onPress, style }: Props) {
  // 1. Subtle breathing scale pulse
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // 2. Shimmer sweep across the gold surface
  const shimmerAnim = useRef(new Animated.Value(-100)).current;

  // 3. Sparkle micro-pulse
  const sparkleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Breathing pulse
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.04,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    pulseLoop.start();

    // Shimmer sweep every 2.6 seconds
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 140,
          duration: 1100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
      ]),
    );
    shimmerLoop.start();

    // Sparkle star wink
    const sparkleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1.3,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.delay(1600),
      ]),
    );
    sparkleLoop.start();

    return () => {
      pulseLoop.stop();
      shimmerLoop.stop();
      sparkleLoop.stop();
    };
  }, []);

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    onPress();
  };

  return (
    <Animated.View
      style={[
        styles.wrap,
        style,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        style={styles.touchArea}
      >
        <LinearGradient
          colors={['#FFE082', '#FFB300', '#FF8F00', '#E65100']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientPill}
        >
          {/* Animated Sheen Sweep */}
          <Animated.View
            style={[
              styles.shimmerBar,
              {
                transform: [{ translateX: shimmerAnim }, { rotate: '25deg' }],
              },
            ]}
          />

          {/* Left Icon with Animated Sparkle */}
          <Animated.View
            style={[
              styles.sparkleWrap,
              {
                transform: [{ scale: sparkleAnim }],
              },
            ]}
          >
            <Ionicons name="sparkles" size={13} color="#000000" />
          </Animated.View>

          {/* Text Content */}
          <View style={styles.textCol}>
            <Text style={styles.vipLabel}>VIP ALL-ACCESS</Text>
            <Text style={styles.coinsText}>1,500/week coins</Text>
          </View>

          {/* Arrow indicator */}
          <View style={styles.arrowCircle}>
            <Ionicons name="chevron-forward" size={11} color="#FFE082" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    shadowColor: '#FFA000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 8,
  },
  touchArea: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradientPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 7,
    position: 'relative',
    overflow: 'hidden',
  },
  shimmerBar: {
    position: 'absolute',
    top: -20,
    bottom: -20,
    width: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  sparkleWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    justifyContent: 'center',
  },
  vipLabel: {
    color: '#000000',
    opacity: 0.78,
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  coinsText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  arrowCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
});
