import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  SocialProofEvent,
  generateSocialProofEvent,
  socialProofManager,
} from '../services/socialProofService';

interface Props {
  onPress?: () => void;
  style?: any;
}

export default function SocialProofTicker({ onPress, style }: Props) {
  const router = useRouter();
  const [event, setEvent] = useState<SocialProofEvent | null>(null);

  const translateY = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const dismissTimer = useRef<any>(null);

  useEffect(() => {
    // Show first event after 2.5 seconds
    const initialTimer = setTimeout(() => {
      displayEvent(generateSocialProofEvent());
    }, 2500);

    const unsubscribe = socialProofManager.subscribe((newEvent) => {
      displayEvent(newEvent);
    });

    return () => {
      clearTimeout(initialTimer);
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      unsubscribe();
    };
  }, []);

  const displayEvent = (evt: SocialProofEvent) => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }

    setEvent(evt);
    translateY.setValue(16);
    opacity.setValue(0);
    scale.setValue(0.92);

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 85,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 85,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss after 7.0 seconds (extended reading duration)
    dismissTimer.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -12,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setEvent(null);
      });
    }, 7000);
  };

  if (!event) return null;

  const isVip = event.type === 'vip';

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/vip' as any);
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handlePress}
        style={[
          styles.pillTouch,
          {
            shadowColor: isVip ? '#F59E0B' : '#F65592',
          },
        ]}
      >
        <LinearGradient
          colors={
            isVip
              ? ['#F59E0B', '#D97706', '#B45309']
              : ['#F65592', '#E11D48', '#BE185D']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.pillGradient}
        >
          {/* Micro Icon Circle */}
          <View style={styles.iconCircle}>
            <Ionicons
              name={isVip ? 'sparkles' : 'flash'}
              size={16}
              color="#FFFFFF"
            />
          </View>

          {/* Text Content */}
          <View style={styles.textWrap}>
            <Text style={styles.mainText} numberOfLines={1}>
              <Text style={styles.boldName}>{event.userName}</Text>{' '}
              <Text style={styles.cityText}>
                ({event.phone || event.city})
              </Text>{' '}
              •{' '}
              <Text style={styles.actionText}>
                {isVip ? 'VIP All-Access 👑' : `Recharged ${event.packageName}`}
              </Text>
            </Text>
          </View>

          {/* Time Badge */}
          <View style={styles.timeBadge}>
            <Text style={styles.timeText}>{event.timeAgo}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 76, // Floats cleanly above the bottom tab bar
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillTouch: {
    borderRadius: 26,
    maxWidth: 382,
    width: '94%',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.40,
    shadowRadius: 12,
    elevation: 9,
  },
  pillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 13,
    borderRadius: 26,
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  mainText: {
    color: '#FFFFFF',
    fontSize: 13,
    letterSpacing: -0.15,
  },
  boldName: {
    fontWeight: '900',
    fontSize: 13.5,
  },
  cityText: {
    fontSize: 12,
    opacity: 0.92,
    fontWeight: '600',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '800',
  },
  timeBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
