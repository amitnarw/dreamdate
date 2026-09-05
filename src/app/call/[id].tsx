import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import BackButton from '../../components/BackButton';
import GiftModal from '../../components/GiftModal';
import RechargeModal from '../../components/RechargeModal';
import { StitchTheme } from '../../constants/theme';
import { MOCK_PROFILES, Profile } from '../../data/mockProfiles';
import { deductCoins, useWallet } from '../../services/wallet';

type CallState = 'ringing' | 'connected' | 'ended';

interface FloatingItem {
  id: string;
  icon: string;
  anim: Animated.Value;
  xOffset: number;
}

export default function VideoCallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile: Profile = MOCK_PROFILES.find((p) => p.id === id) || MOCK_PROFILES[0];

  const { coins } = useWallet();
  const [callState, setCallState] = useState<CallState>('ringing');
  const [callSeconds, setCallSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front');
  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [rechargeModalVisible, setRechargeModalVisible] = useState(false);
  const [floatingGifts, setFloatingGifts] = useState<FloatingItem[]>([]);

  const [permission, requestPermission] = useCameraPermissions();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Video player setup
  const player = useVideoPlayer(profile.videoUrl, (p) => {
    p.loop = true;
    p.muted = false;
  });

  // Camera permissions
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  // Ringing phase logic
  useEffect(() => {
    let timer: any;
    if (callState === 'ringing') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      timer = setTimeout(() => {
        setCallState('connected');
        try {
          player.play();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {}
      }, 2400);
    }
    return () => clearTimeout(timer);
  }, [callState]);

  // Timer & Coin deduction
  useEffect(() => {
    let interval: any;
    if (callState === 'connected') {
      interval = setInterval(async () => {
        setCallSeconds((prev) => {
          const next = prev + 1;
          if (next > 0 && next % 60 === 0) {
            deductCoins(profile.callRate).then((success) => {
              if (!success) {
                Alert.alert(
                  'Call Ended',
                  'Your coin balance is empty! Please recharge to continue calling.',
                  [{ text: 'OK', onPress: () => handleEndCall() }]
                );
              }
            });
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState, profile.callRate]);

  const handleEndCall = () => {
    try {
      player.pause();
    } catch (e) {}
    setCallState('ended');
  };

  const handleGiftSent = (gift: { name: string; icon: string; coins: number }) => {
    const anim = new Animated.Value(0);
    const newGift: FloatingItem = {
      id: Math.random().toString(),
      icon: gift.icon,
      anim,
      xOffset: (Math.random() - 0.5) * 140,
    };
    setFloatingGifts((prev) => [...prev, newGift]);

    Animated.timing(anim, {
      toValue: 1,
      duration: 1800,
      useNativeDriver: true,
    }).start(() => {
      setFloatingGifts((prev) => prev.filter((g) => g.id !== newGift.id));
    });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  // -------------------------------------------------------------
  // RINGING SCREEN
  // -------------------------------------------------------------
  if (callState === 'ringing') {
    return (
      <View style={styles.ringingContainer}>
        <Image source={{ uri: profile.avatar }} style={StyleSheet.absoluteFill} blurRadius={30} />
        <View style={styles.ringingOverlay}>
          <SafeAreaView style={styles.ringingContent} edges={['top', 'bottom']}>
            <View style={styles.ringingTop}>
              <Text style={styles.connectingTitle}>CONNECTING CALL...</Text>
              <Text style={styles.ringingName}>{profile.name}</Text>
              <Text style={styles.ringingLocation}>
                {profile.city}, {profile.country}
              </Text>
              <View style={styles.rateChip}>
                <Text style={styles.rateChipText}>🪙 {profile.callRate} Coins / Min</Text>
              </View>
            </View>

            <Animated.View style={[styles.avatarPulseRing, { transform: [{ scale: pulseAnim }] }]}>
              <Image source={{ uri: profile.avatar }} style={styles.ringingAvatar} />
            </Animated.View>

            <View style={styles.ringingBottom}>
              <TouchableOpacity
                style={styles.hangupButtonLarge}
                onPress={() => router.back()}
                activeOpacity={0.8}
              >
                <Ionicons name="call" size={32} color="#FFF" style={{ transform: [{ rotate: '135deg' }] }} />
              </TouchableOpacity>
              <Text style={styles.cancelCallText}>Cancel</Text>
            </View>
          </SafeAreaView>
        </View>
      </View>
    );
  }

  // -------------------------------------------------------------
  // CALL ENDED SUMMARY
  // -------------------------------------------------------------
  if (callState === 'ended') {
    const totalSpent = Math.max(1, Math.ceil(callSeconds / 60)) * profile.callRate;
    return (
      <View style={styles.endedContainer}>
        <SafeAreaView style={styles.endedContent} edges={['top', 'bottom']}>
          <Image source={{ uri: profile.avatar }} style={styles.endedAvatar} />
          <Text style={styles.endedTitle}>Call Ended</Text>
          <Text style={styles.endedName}>with {profile.name}</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryValue}>{formatTime(callSeconds)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Coins Spent</Text>
              <Text style={styles.summaryValueCoins}>🪙 {callSeconds > 0 ? totalSpent : 0}</Text>
            </View>
          </View>

          <View style={styles.endedBtnCol}>
            <TouchableOpacity
              style={styles.chatCTA}
              onPress={() => {
                router.replace(`/chat/${profile.id}` as any);
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="chatbubble-ellipses" size={20} color="#FFF" />
              <Text style={styles.chatCTAText}>Message {profile.name}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Text style={styles.doneBtnText}>Back to Discover</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // -------------------------------------------------------------
  // LIVE VIDEO CALL (1:1 STITCH EXACT)
  // -------------------------------------------------------------
  return (
    <View style={styles.container}>
      {/* Full Screen Video Canvas */}
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        allowsPictureInPicture={false}
        contentFit="cover"
        nativeControls={false}
      />

      {/* Dark Vignettes */}
      <View style={styles.topVignette} />
      <View style={styles.bottomVignette} />

      {/* Top Header & Timer (Stitch Exact) with native BlurView */}
      <SafeAreaView style={styles.callHeader} edges={['top']}>
        <BackButton onPress={handleEndCall} />

        {/* Timer / Credit Display */}
        <BlurView intensity={70} tint="dark" style={styles.timerCreditDisplay}>
          <View style={styles.pulsingNeonDot} />
          <Text style={styles.timerDisplayText}>{formatTime(callSeconds)}</Text>
          <Text style={styles.tokenIcon}>🪙</Text>
        </BlurView>

        <TouchableOpacity
          style={styles.glassHeaderWrap}
          onPress={() => setRechargeModalVisible(true)}
          activeOpacity={0.8}
        >
          <BlurView intensity={60} tint="dark" style={styles.glassHeaderBtn}>
            <Ionicons name="ellipsis-horizontal" size={22} color={StitchTheme.colors.onSurface} />
          </BlurView>
        </TouchableOpacity>
      </SafeAreaView>

      {/* Self View (Picture-in-Picture) Stitch Exact */}
      <View style={styles.pipContainer}>
        {permission?.granted ? (
          <CameraView style={styles.pipCamera} facing={cameraFacing} />
        ) : (
          <View style={styles.pipFallback}>
            <Ionicons name="person" size={28} color="#FFF" />
            <Text style={styles.pipFallbackText}>You</Text>
          </View>
        )}
      </View>

      {/* Floating Gift Animations */}
      <View style={styles.floatingContainer} pointerEvents="none">
        {floatingGifts.map((gift) => {
          const translateY = gift.anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -320],
          });
          const opacity = gift.anim.interpolate({
            inputRange: [0, 0.2, 0.8, 1],
            outputRange: [0, 1, 1, 0],
          });
          const scale = gift.anim.interpolate({
            inputRange: [0, 0.3, 1],
            outputRange: [0.6, 1.3, 1],
          });

          return (
            <Animated.View
              key={gift.id}
              style={[
                styles.floatingGift,
                {
                  transform: [{ translateY }, { translateX: gift.xOffset }, { scale }],
                  opacity,
                },
              ]}
            >
              <Text style={styles.floatingGiftIcon}>{gift.icon}</Text>
            </Animated.View>
          );
        })}
      </View>

      {/* User Info Overlay (Stitch Exact: Name, Age, Location, Tags) */}
      <View style={[styles.userInfoOverlay, { bottom: Math.max(insets.bottom, 16) + 95 }]}>
        <Text style={styles.userNameDisplay}>
          {profile.name} <Text style={styles.userAgeDisplay}>{profile.age}</Text>
        </Text>

        <View style={styles.userLocationRow}>
          <Ionicons name="location-sharp" size={15} color={StitchTheme.colors.onSurfaceVariant} />
          <Text style={styles.userLocationText}>
            {profile.city}, {profile.country}
          </Text>
        </View>

        {/* Tags */}
        <View style={styles.callTagsRow}>
          {profile.interests.map((tag, idx) => (
            <View key={idx} style={styles.callTagChip}>
              <Text style={styles.callTagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bottom Controls (1:1 Stitch Exact: Like | Chat | Send Gift (Emphasized) | Flip Camera | End Call) */}
      <View style={[styles.bottomControlsBar, { bottom: Math.max(insets.bottom, 16) + 12 }]}>
        {/* Like */}
        <TouchableOpacity style={styles.glassControlWrap} activeOpacity={0.8}>
          <BlurView intensity={65} tint="dark" style={styles.glassControlBtn}>
            <Ionicons name="heart" size={24} color={StitchTheme.colors.onSurface} />
          </BlurView>
        </TouchableOpacity>

        {/* Chat */}
        <TouchableOpacity
          style={styles.glassControlWrap}
          onPress={() => router.push(`/chat/${profile.id}` as any)}
          activeOpacity={0.8}
        >
          <BlurView intensity={65} tint="dark" style={styles.glassControlBtn}>
            <Ionicons name="chatbubble" size={22} color={StitchTheme.colors.onSurface} />
            <View style={styles.chatBadgeDot} />
          </BlurView>
        </TouchableOpacity>

        {/* Send Gift - Emphasized with Neon Magenta */}
        <TouchableOpacity
          style={styles.neonGiftBtn}
          onPress={() => setGiftModalVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: 28 }}>🎁</Text>
        </TouchableOpacity>

        {/* Flip Camera */}
        <TouchableOpacity
          style={styles.glassControlWrap}
          onPress={() => setCameraFacing(cameraFacing === 'front' ? 'back' : 'front')}
          activeOpacity={0.8}
        >
          <BlurView intensity={65} tint="dark" style={styles.glassControlBtn}>
            <Ionicons name="camera-reverse" size={24} color={StitchTheme.colors.onSurface} />
          </BlurView>
        </TouchableOpacity>

        {/* End Call */}
        <TouchableOpacity
          style={styles.endCallRedBtn}
          onPress={handleEndCall}
          activeOpacity={0.85}
        >
          <Ionicons name="close" size={26} color="#FFF" />
        </TouchableOpacity>
      </View>

      <GiftModal
        visible={giftModalVisible}
        onClose={() => setGiftModalVisible(false)}
        onGiftSent={handleGiftSent}
        onNeedRecharge={() => setRechargeModalVisible(true)}
      />

      <RechargeModal
        visible={rechargeModalVisible}
        onClose={() => setRechargeModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: StitchTheme.colors.midnightVoid,
  },
  topVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    backgroundColor: 'rgba(5, 5, 10, 0.65)',
  },
  bottomVignette: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 240,
    backgroundColor: 'rgba(5, 5, 10, 0.75)',
  },
  callHeader: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },
  glassHeaderWrap: {
    borderRadius: 21,
    overflow: 'hidden',
  },
  glassHeaderBtn: {
    width: 42,
    height: 42,
    backgroundColor: 'rgba(30, 32, 32, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCreditDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 32, 32, 0.65)',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 24,
    overflow: 'hidden',
    gap: 8,
    shadowColor: StitchTheme.colors.neonMagenta,
    shadowOpacity: 0.35,
    shadowRadius: 15,
  },
  pulsingNeonDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: StitchTheme.colors.neonMagenta,
  },
  timerDisplayText: {
    color: StitchTheme.colors.onSurface,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tokenIcon: {
    fontSize: 14,
  },
  pipContainer: {
    position: 'absolute',
    top: 90,
    right: 20,
    width: 112,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: StitchTheme.colors.surfaceContainer,
    zIndex: 20,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  pipCamera: {
    flex: 1,
  },
  pipFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: StitchTheme.colors.surfaceContainerHighest,
  },
  pipFallbackText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  floatingContainer: {
    position: 'absolute',
    bottom: 150,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 30,
  },
  floatingGift: {
    position: 'absolute',
  },
  floatingGiftIcon: {
    fontSize: 48,
  },
  userInfoOverlay: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    zIndex: 20,
    gap: 6,
  },
  userNameDisplay: {
    fontSize: 32,
    fontWeight: '800',
    color: StitchTheme.colors.onSurface,
    letterSpacing: -0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  userAgeDisplay: {
    fontSize: 24,
    fontWeight: '600',
    color: StitchTheme.colors.onSurfaceVariant,
  },
  userLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  userLocationText: {
    color: StitchTheme.colors.onSurfaceVariant,
    fontSize: 14,
  },
  callTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  callTagChip: {
    backgroundColor: 'rgba(12, 15, 15, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  callTagText: {
    color: StitchTheme.colors.onSurface,
    fontSize: 12,
    fontWeight: '600',
  },
  bottomControlsBar: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    zIndex: 30,
    paddingHorizontal: 20,
  },
  glassControlWrap: {
    borderRadius: 27,
    overflow: 'hidden',
  },
  glassControlBtn: {
    width: 54,
    height: 54,
    backgroundColor: 'rgba(30, 32, 32, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  chatBadgeDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: StitchTheme.colors.error,
  },
  neonGiftBtn: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: StitchTheme.colors.neonMagenta,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: StitchTheme.colors.neonMagenta,
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 8,
  },
  endCallRedBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E74C3C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E74C3C',
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },

  // Ringing & ended
  ringingContainer: {
    flex: 1,
    backgroundColor: StitchTheme.colors.midnightVoid,
  },
  ringingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 10, 0.85)',
  },
  ringingContent: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 30,
  },
  ringingTop: {
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
  },
  connectingTitle: {
    color: StitchTheme.colors.neonMagenta,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  ringingName: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '800',
  },
  ringingLocation: {
    color: StitchTheme.colors.onSurfaceVariant,
    fontSize: 14,
  },
  rateChip: {
    marginTop: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  rateChipText: {
    color: '#FFD700',
    fontWeight: '700',
    fontSize: 12,
  },
  avatarPulseRing: {
    width: 170,
    height: 170,
    borderRadius: 85,
    padding: 6,
    backgroundColor: 'rgba(246, 85, 146, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringingAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 85,
  },
  ringingBottom: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  hangupButtonLarge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E74C3C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E74C3C',
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
  cancelCallText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  endedContainer: {
    flex: 1,
    backgroundColor: StitchTheme.colors.surface,
    justifyContent: 'center',
  },
  endedContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  endedAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 16,
  },
  endedTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  endedName: {
    fontSize: 15,
    color: StitchTheme.colors.onSurfaceVariant,
    marginBottom: 26,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: StitchTheme.colors.surfaceContainer,
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: {
    color: StitchTheme.colors.onSurfaceVariant,
    fontSize: 14,
  },
  summaryValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  summaryValueCoins: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 10,
  },
  endedBtnCol: {
    width: '100%',
    gap: 12,
  },
  chatCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: StitchTheme.colors.primaryContainer,
    borderRadius: 16,
    paddingVertical: 14,
    gap: 8,
  },
  chatCTAText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  doneBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  doneBtnText: {
    color: StitchTheme.colors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '600',
  },
});
