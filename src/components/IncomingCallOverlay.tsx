import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  allowScreenCaptureAsync,
  preventScreenCaptureAsync,
} from 'expo-screen-capture';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { incomingCallService } from '../services/incomingCallService';
import { startRinging, stopRinging } from '../services/soundService';
import { Profile } from '../data/mockProfiles';
import { useAuth } from '../context/AuthContext';
import { MEDIA_HEADERS } from '../services/videoService';
import { getCoins, useWallet } from '../services/wallet';
import LimitedOfferModal from './LimitedOfferModal';
import RechargeModal from './RechargeModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** Max time the incoming-call request rings before auto-cut (missed call). */
const RING_TIMEOUT_MS = 30 * 1000;

/** Classic phone vibration cadence while ringing (loops until stopped). */
const RING_VIBRATION_PATTERN = [0, 700, 800];

/**
 * Full-screen incoming-call request. Mounted at the app root so it renders
 * above every screen (tabs, tab bar, modals) via a native Modal, which
 * blocks all touch behind it like a real incoming call.
 *
 * Accept routes to /call/[id]?dir=incoming. Decline, Android-back, or the
 * 2-minute timeout all go through the service (retry x2, then missed log).
 */
export default function IncomingCallOverlay() {
  const router = useRouter();
  const { user } = useAuth();
  const { hasPurchased, isVip } = useWallet();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rechargeModalVisible, setRechargeModalVisible] = useState(false);
  const [limitedOfferVisible, setLimitedOfferVisible] = useState(false);
  const [pendingProfile, setPendingProfile] = useState<Profile | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;
  const sonar1 = useRef(new Animated.Value(0)).current;
  const sonar2 = useRef(new Animated.Value(0)).current;
  const ringTimer = useRef<any>(null);
  const profileRef = useRef<Profile | null>(null);
  profileRef.current = profile;

  // The incoming-call overlay renders inside a native Modal window on
  // Android, which can bypass the main window's FLAG_SECURE. Re-apply
  // protection with its own key while the overlay is mounted.
  useEffect(() => {
    preventScreenCaptureAsync('incoming-call-overlay').catch(() => {});
    return () => {
      allowScreenCaptureAsync('incoming-call-overlay').catch(() => {});
    };
  }, []);

  const stopRing = () => {
    if (ringTimer.current) {
      clearTimeout(ringTimer.current);
      ringTimer.current = null;
    }
    try {
      Vibration.cancel();
    } catch (e) {}
    stopRinging().catch(() => {});
  };

  useEffect(() => {
    const unsub = incomingCallService.subscribe((p) => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (e) {}
      setProfile(p);
    });
    return () => {
      unsub();
      stopRing();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      stopRing();
      setProfile(null);
    }
  }, [user]);

  useEffect(() => {
    if (!profile || !user) return;

    // Real call behavior: looping ringtone + repeating vibration
    startRinging().catch(() => {});
    try {
      Vibration.vibrate(RING_VIBRATION_PATTERN, true);
    } catch (e) {}

    // Auto-cut after 2 minutes: missed call, normal retry/missed-log path
    ringTimer.current = setTimeout(() => {
      const p = profileRef.current;
      stopRing();
      setProfile(null);
      if (p) incomingCallService.dismissed();
    }, RING_TIMEOUT_MS);

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

  // Android hardware back while ringing = decline (never dismiss silently)
  useEffect(() => {
    if (!profile) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const p = profileRef.current;
      stopRing();
      setProfile(null);
      if (p) incomingCallService.declined(p.id);
      return true;
    });
    return () => sub.remove();
  }, [profile?.id]);

  useEffect(() => {
    const unsub = incomingCallService.subscribeFirstCallConcluded(() => {
      if (!hasPurchased && !isVip) {
        setTimeout(() => {
          setLimitedOfferVisible(true);
        }, 500);
      }
    });
    return unsub;
  }, [hasPurchased, isVip]);

  const handleAccept = () => {
    const p = profileRef.current;
    if (!p) return;
    const currentCoins = getCoins();
    if (currentCoins < p.callRate) {
      stopRing();
      setPendingProfile(p);
      setProfile(null);
      setRechargeModalVisible(true);
      return;
    }
    stopRing();
    incomingCallService.accepted(p.id);
    setProfile(null);
    router.push(`/call/${p.id}?dir=incoming` as any);
  };

  const handleDecline = () => {
    const p = profileRef.current;
    stopRing();
    setProfile(null);
    if (p) incomingCallService.declined(p.id);
  };

  // Never show incoming call if user is not logged in
  if (!user) return null;

  return (
    <>
      <Modal
        visible={!!profile}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleDecline}
      >
        {profile ? (
          <View style={styles.overlay}>
            {/* Full-screen background image of the female caller */}
            <ExpoImage
              source={{
                uri:
                  profile.lockedPhotos?.[0]?.url ||
                  profile.coverImage ||
                  profile.avatar,
                headers: MEDIA_HEADERS,
              }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={300}
            />

            {/* Dark gradient overlay so text and controls are clearly visible */}
            <LinearGradient
              colors={[
                'rgba(0,0,0,0.65)',
                'rgba(0,0,0,0.3)',
                'rgba(0,0,0,0.85)',
              ]}
              style={StyleSheet.absoluteFill}
            />
            <BlurView
              intensity={25}
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
                source={{ uri: profile.avatar, headers: MEDIA_HEADERS }}
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
            <Text style={styles.callType}>Incoming private video call</Text>

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
        ) : (
          <View />
        )}
      </Modal>

      <RechargeModal
        visible={rechargeModalVisible}
        onClose={() => {
          setRechargeModalVisible(false);
          if (pendingProfile) {
            const current = getCoins();
            if (current >= pendingProfile.callRate) {
              incomingCallService.accepted(pendingProfile.id);
              const pid = pendingProfile.id;
              setPendingProfile(null);
              router.push(`/call/${pid}?dir=incoming` as any);
              return;
            } else {
              incomingCallService.declined(pendingProfile.id);
            }
          }
          setPendingProfile(null);
        }}
      />

      <LimitedOfferModal
        visible={limitedOfferVisible}
        onClose={() => setLimitedOfferVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
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
