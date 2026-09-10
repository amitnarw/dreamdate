import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { incomingCallService } from '../services/incomingCallService';
import { Profile } from '../data/mockProfiles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Full-screen overlay shown when the in-app incoming-call service fires.
 * Listens via subscribe(); renders ringing UI; Accept routes to /call/[id],
 * Decline dismisses (service retries up to MAX_RETRIES).
 */
export default function IncomingCallOverlay() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;
  const sonar1 = useRef(new Animated.Value(0)).current;
  const sonar2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsub = incomingCallService.subscribe((p) => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (e) {}
      setProfile(p);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!profile) return;

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 750, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 750, useNativeDriver: true }),
      ])
    ).start();

    const mkSonar = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 2200, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    mkSonar(sonar1, 0);
    mkSonar(sonar2, 800);

    return () => {
      pulse.setValue(1);
      sonar1.setValue(0);
      sonar2.setValue(0);
    };
  }, [profile?.id]);

  if (!profile) return null;

  const handleAccept = () => {
    incomingCallService.accepted(profile.id);
    setProfile(null);
    router.push(`/call/${profile.id}` as any);
  };

  const handleDecline = () => {
    incomingCallService.declined(profile.id);
    setProfile(null);
  };

  return (
    <View style={styles.overlay}>
      <BlurView
        intensity={85}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        style={[
          styles.avatarWrap,
          { transform: [{ scale: pulse }] },
        ]}
      >
        <ExpoImage
          source={{ uri: profile.avatar }}
          style={styles.avatar}
          contentFit="cover"
          transition={200}
        />
        <Animated.View
          style={[
            styles.sonar,
            {
              opacity: sonar1.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
              transform: [
                {
                  scale: sonar1.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.sonar,
            {
              opacity: sonar2.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
              transform: [
                {
                  scale: sonar2.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }),
                },
              ],
            },
          ]}
        />
      </Animated.View>

      <Text style={styles.callerName}>{profile.name}</Text>
      <Text style={styles.callType}>Private video call · Encrypted</Text>

      <View style={styles.actionsRow}>
        <View style={styles.actionCol}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.declineBtn]}
            onPress={handleDecline}
            activeOpacity={0.85}
          >
            <Ionicons name="call" size={28} color="#FFF" style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>
          <Text style={styles.actionLabel}>Decline</Text>
        </View>

        <View style={styles.actionCol}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.acceptBtn]}
            onPress={handleAccept}
            activeOpacity={0.9}
          >
            <Ionicons name="videocam" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={[styles.actionLabel, { color: '#F65592' }]}>Accept</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  avatarWrap: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  sonar: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(246, 85, 146, 0.4)',
  },
  callerName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 28,
    letterSpacing: -0.4,
  },
  callType: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: SCREEN_WIDTH * 0.7,
    marginTop: 56,
  },
  actionCol: {
    alignItems: 'center',
    gap: 10,
  },
  actionBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtn: {
    backgroundColor: '#93000a',
  },
  acceptBtn: {
    backgroundColor: '#F65592',
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
