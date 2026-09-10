import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurTargetView, BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppBlurView from '../../components/AppBlurView';
import BackButton from '../../components/BackButton';
import GiftModal from '../../components/GiftModal';
import RechargeModal from '../../components/RechargeModal';
import { useTheme } from '../../context/ThemeContext';
import { MOCK_PROFILES, Profile, VIRTUAL_GIFTS } from '../../data/mockProfiles';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function UserProfileDetail1to1() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile: Profile = MOCK_PROFILES.find((p) => p.id === id) || MOCK_PROFILES[0];

  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [rechargeModalVisible, setRechargeModalVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Active photo gallery state isolated strictly to this companion
  const photoList = [
    profile.avatar,
    ...(profile.photos && profile.photos.length > 0
      ? profile.photos
      : [profile.coverImage || profile.avatar]),
  ].filter((v, i, a) => !!v && a.indexOf(v) === i);
  const [selectedPhoto, setSelectedPhoto] = useState(profile.avatar);

  // Prefetch gallery photos into memory for instant, buttery smooth switching
  useEffect(() => {
    photoList.forEach((uri) => {
      if (uri) {
        ExpoImage.prefetch(uri);
      }
    });
  }, [profile.id]);

  const handleSelectPhoto = (uri: string) => {
    if (uri === selectedPhoto) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) { }
    setSelectedPhoto(uri);
  };

  // Photo blur target ref for Android BlurView support
  const imageTargetRef = useRef<View | null>(null);

  // Gift celebration unboxing animation state (matching video call)
  const [activeCelebration, setActiveCelebration] = useState<{
    id: string;
    name: string;
    emoji: string;
    coins: number;
    accentColor: string;
  } | null>(null);
  const giftTravelAnim = useRef(new Animated.Value(0)).current;
  const boxOpenAnim = useRef(new Animated.Value(0)).current;
  const giftRevealAnim = useRef(new Animated.Value(0)).current;
  const giftExitAnim = useRef(new Animated.Value(1)).current;
  const celebrationTimerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
    };
  }, []);

  // Open animation: Bottom to Top (320ms)
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  // Close animation: Fade out (220ms)
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Open animation: Bottom to Top
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) { }

    // Close animation: Fade out from top to bottom
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT * 0.5,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.back();
    });
  };

  // Intercept Android hardware back button for fade out exit
  useEffect(() => {
    const onBackPress = () => {
      handleClose();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [isClosing]);

  // Handle gift sent animation
  const handleGiftSent = (gift: { name: string; icon: string; emoji?: string; coins: number; accentColor?: string }) => {
    // Determine visual details
    const matched = VIRTUAL_GIFTS.find(g => g.name.toLowerCase() === gift.name.toLowerCase()) || VIRTUAL_GIFTS[0];
    const giftName = gift.name || matched.name;
    const giftEmoji = gift.emoji || matched.emoji || '🎁';
    const giftCoins = gift.coins || matched.coins;
    const giftColor = gift.accentColor || matched.accentColor || '#F65592';

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) {}

    setActiveCelebration({
      id: Math.random().toString(),
      name: giftName,
      emoji: giftEmoji,
      coins: giftCoins,
      accentColor: giftColor,
    });

    // Reset unboxing animations
    giftTravelAnim.setValue(0);
    boxOpenAnim.setValue(0);
    giftRevealAnim.setValue(0);
    giftExitAnim.setValue(1);

    if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);

    // Stage 1: Gift box flies smoothly up from bottom to center (small -> 50% size)
    Animated.timing(giftTravelAnim, {
      toValue: 1,
      duration: 460,
      useNativeDriver: true,
    }).start(() => {
      // Stage 2: Box pops open & inner gift reveals to 100% size with energetic spring
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}

      Animated.parallel([
        Animated.timing(boxOpenAnim, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.spring(giftRevealAnim, {
          toValue: 1,
          friction: 4.5,
          tension: 48,
          useNativeDriver: true,
        }),
      ]).start();

      // Stage 3: Hold in center for 2.8s, then graceful fade out
      celebrationTimerRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(giftRevealAnim, {
            toValue: 1.15,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(giftExitAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setActiveCelebration(null);
        });
      }, 2800);
    });
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Dimmed Backdrop */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: '#000', opacity: backdropOpacity },
        ]}
      />

      {/* Animated Sliding/Fading Container */}
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.background,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* BEGIN: TopAppBar */}
        <View style={[styles.topHeaderBar, { paddingTop: insets.top + 8 }]}>
          <BackButton onPress={handleClose} />

          <Text
            style={[
              styles.topNavTitle,
              { color: isDark ? '#FFFFFF' : '#191C1D' },
            ]}
          >
            Near You
          </Text>

          {/* Spacer to keep title centered */}
          <View style={{ width: 40 }} />
        </View>
        {/* END: TopAppBar */}

        {/* BEGIN: Main Content Area (Profile Card Container) */}
        <View
          style={[
            styles.mainContentArea,
            {
              paddingTop: insets.top + 58,
              paddingBottom: Math.max(insets.bottom, 16) + 158, // Space for thumbnail gallery + action buttons
            },
          ]}
        >
          {/* Borderless Rounded Profile Card */}
          <View style={styles.profileCard}>
            {/* Model Image - Wrapped in BlurTargetView with native hardware-accelerated cross-dissolve */}
            <BlurTargetView ref={imageTargetRef} style={StyleSheet.absoluteFill}>
              <ExpoImage
                source={{ uri: selectedPhoto }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                cachePolicy="memory-disk"
                priority="high"
                transition={{ duration: 350, effect: 'cross-dissolve', timing: 'ease-in-out' }}
              />
            </BlurTargetView>

            {/* Status Badge on Top Right of Card (Online / Busy) */}
            <View
              style={[
                styles.cardStatusBadge,
                { backgroundColor: profile.isOnline ? '#10B981' : '#E11D48' },
              ]}
            >
              <Text style={styles.cardStatusText}>
                {profile.isOnline ? 'Online' : 'Busy'}
              </Text>
            </View>

            {/* BEGIN: Exact Stitch Glassmorphic Information Overlay */}
            {/* absolute bottom-0 w-full p-6 glass-overlay z-10 flex flex-col justify-end text-white */}
            <View style={styles.glassOverlayWrap}>
              {/* Native Rich Frosted Blur Fading from Bottom to Top matching the LinearGradient */}
              {Platform.OS === 'web' ? (
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.45) 60%, transparent 100%)',
                      maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.45) 60%, transparent 100%)',
                    } as any,
                  ]}
                >
                  <BlurView
                    blurTarget={imageTargetRef}
                    intensity={85}
                    tint="dark"
                    style={[
                      StyleSheet.absoluteFill,
                      { backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any,
                    ]}
                  />
                </View>
              ) : (
                <MaskedView
                  style={StyleSheet.absoluteFill}
                  maskElement={
                    <LinearGradient
                      colors={['rgba(0,0,0,1)', 'rgba(0,0,0,0.45)', 'transparent']}
                      locations={[0, 0.6, 1]}
                      start={{ x: 0, y: 1 }}
                      end={{ x: 0, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                  }
                >
                  <BlurView
                    blurTarget={imageTargetRef}
                    intensity={85}
                    tint="dark"
                    blurMethod="dimezisBlurView"
                    blurReductionFactor={2}
                    style={StyleSheet.absoluteFill}
                  />
                </MaskedView>
              )}

              {/* background: linear-gradient(to top, rgba(234, 76, 137, 0.9) 0%, rgba(234, 76, 137, 0.4) 60%, transparent 100%) */}
              <LinearGradient
                colors={['rgba(234, 76, 137, 0.9)', 'rgba(234, 76, 137, 0.4)', 'transparent']}
                locations={[0, 0.6, 1]}
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
                style={StyleSheet.absoluteFill}
              />

              {/* Overlay Inner Content (p-6 flex flex-col justify-end text-white) */}
              <View style={styles.overlayInnerContent}>
                {/* Name, Age & Location (Categories/Badges removed as requested) */}
                <View style={styles.metaRow}>
                  <View style={styles.metaInfoLeft}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[styles.nameHeading, { flexShrink: 1 }]} numberOfLines={1} ellipsizeMode="tail">
                        {profile.name}
                      </Text>
                      <Text style={[styles.nameHeading, { flexShrink: 0 }]}>
                        , {profile.age}
                      </Text>
                    </View>

                    <View style={styles.statusLocationLine}>
                      {/* Location */}
                      <View style={styles.locationBadge}>
                        <Ionicons name="location-sharp" size={15} color="#FFF" />
                        <Text style={styles.locationLabel}>
                          {profile.city}, {profile.country}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Bio Text */}
                <Text style={styles.bioText} numberOfLines={3}>
                  {profile.bio}
                </Text>
              </View>
            </View>
            {/* END: Exact Stitch Glassmorphic Information Overlay */}
          </View>
        </View>
        {/* END: Main Content Area */}

        {/* BEGIN: Horizontal List of Images Above Bottom 3 Options */}
        <View style={[styles.thumbnailGalleryWrap, { bottom: Math.max(insets.bottom, 16) + 84 }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailScrollContent}
          >
            {photoList.map((uri, idx) => {
              const isSelected = selectedPhoto === uri;
              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.thumbnailItem}
                  onPress={() => handleSelectPhoto(uri)}
                  activeOpacity={0.85}
                >
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      isSelected ? styles.thumbnailItemActive : styles.thumbnailItemInactive,
                    ]}
                  >
                    <ExpoImage
                      source={{ uri }}
                      style={styles.thumbnailImg}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  </View>
                  {isSelected && <View style={styles.thumbnailActiveDot} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
        {/* END: Horizontal List of Images */}

        {/* BEGIN: Primary Action Row: Chat | Video Call (Center Glow) | Gift */}
        <View style={[styles.primaryActionRow, { bottom: Math.max(insets.bottom, 16) + 12 }]}>
          {/* Chat Button (Left) */}
          <View style={styles.actionBtnShadow}>
            <TouchableOpacity
              style={styles.actionBtnWrap}
              onPress={() => router.push(`/chat/${profile.id}` as any)}
              activeOpacity={0.8}
              accessibilityLabel="Chat"
            >
              <AppBlurView
                blurTarget={imageTargetRef}
                style={[
                  styles.actionBtnBlur,
                  {
                    backgroundColor: isDark
                      ? 'rgba(28, 18, 22, 0.50)'
                      : 'rgba(255, 255, 255, 0.85)',
                  },
                ]}
                tint={isDark ? 'dark' : 'light'}
              >
                <Ionicons
                  name="chatbubble"
                  size={24}
                  color={isDark ? '#FFFFFF' : '#191C1D'}
                />
              </AppBlurView>
            </TouchableOpacity>
          </View>

          {/* Video Call Button (Center - Prominent Neon Glow Button) */}
          <TouchableOpacity
            style={styles.centerCallBtn}
            onPress={() => router.push(`/call/${profile.id}` as any)}
            activeOpacity={0.9}
            accessibilityLabel="Video Call"
          >
            <Ionicons name="videocam" size={36} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Gift Button (Right) */}
          <View style={styles.actionBtnShadow}>
            <TouchableOpacity
              style={styles.actionBtnWrap}
              onPress={() => setGiftModalVisible(true)}
              activeOpacity={0.85}
              accessibilityLabel="Send Gift"
            >
              <AppBlurView
                blurTarget={imageTargetRef}
                style={[
                  styles.actionBtnBlur,
                  {
                    backgroundColor: isDark
                      ? 'rgba(28, 18, 22, 0.50)'
                      : 'rgba(255, 255, 255, 0.85)',
                  },
                ]}
                tint={isDark ? 'dark' : 'light'}
              >
                <Ionicons
                  name="gift"
                  size={24}
                  color={isDark ? '#FFFFFF' : '#191C1D'}
                />
              </AppBlurView>
            </TouchableOpacity>
          </View>
        </View>
        {/* END: Primary Action Row */}

        {/* Gift Celebration Overlay: Travel from Bottom, Box Opens & Reveals Gift */}
        {activeCelebration && (
          <View style={styles.celebrationOverlay} pointerEvents="none">
            {/* Animated Container Traveling from Bottom to Center */}
            <Animated.View
              style={[
                styles.justTheGiftWrap,
                {
                  transform: [
                    {
                      translateY: giftTravelAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [420, 0],
                      }),
                    },
                  ],
                  opacity: giftExitAnim,
                },
              ]}
            >
              {/* STAGE 1: The Gift Box (travels up small -> 50% at center with gentle tilt) */}
              <Animated.View
                style={[
                  styles.giftBoxLayer,
                  {
                    transform: [
                      {
                        scale: giftTravelAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.22, 0.5],
                        }),
                      },
                      {
                        rotate: giftTravelAnim.interpolate({
                          inputRange: [0, 0.4, 0.8, 1],
                          outputRange: ['-12deg', '10deg', '-4deg', '0deg'],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {/* STAGE 2: Gift box bursts open & fades out when opening */}
                <Animated.View
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: [
                      {
                        scale: boxOpenAnim.interpolate({
                          inputRange: [0, 0.6, 1],
                          outputRange: [1, 1.25, 1.5],
                        }),
                      },
                    ],
                    opacity: boxOpenAnim.interpolate({
                      inputRange: [0, 0.45, 1],
                      outputRange: [1, 0.85, 0],
                    }),
                  }}
                >
                  <Text style={styles.giftBoxEmoji}>🎁</Text>
                </Animated.View>
              </Animated.View>

              {/* STAGE 2: The Inner Revealed Gift (springs from 50% to full 100% size upon opening) */}
              <Animated.View
                style={[
                  styles.revealedGiftLayer,
                  {
                    transform: [
                      {
                        scale: giftRevealAnim.interpolate({
                          inputRange: [0, 0.7, 1, 1.15],
                          outputRange: [0.5, 1.15, 1.0, 1.12],
                        }),
                      },
                      {
                        translateY: giftRevealAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [14, 0],
                        }),
                      },
                    ],
                    opacity: boxOpenAnim.interpolate({
                      inputRange: [0, 0.25, 1],
                      outputRange: [0, 0.9, 1],
                    }),
                  },
                ]}
              >
                {/* Back ambient colored glow */}
                <View
                  style={[
                    styles.giftGlowCircle,
                    {
                      backgroundColor: activeCelebration.accentColor
                        ? `${activeCelebration.accentColor}40`
                        : 'rgba(246, 85, 146, 0.40)',
                    },
                  ]}
                />
                <Text style={styles.justTheGiftEmoji}>{activeCelebration.emoji}</Text>
              </Animated.View>
            </Animated.View>
          </View>
        )}

        {/* Modals */}
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
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1114',
  },
  // TopAppBar
  topHeaderBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: 'transparent',
  },
  topNavTitle: {
    color: '#F1E0E4',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  // Main Content Area
  mainContentArea: {
    flex: 1,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  // Profile Card - rounded-[2rem] overflow-hidden shadow-xl (borderless)
  profileCard: {
    flex: 1,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#271D20',
    position: 'relative',
  },
  // Status Badge on Top Right of Card
  cardStatusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 25,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardStatusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // Gradient + Glass effect overlay directly at the bottom of the card
  glassOverlayWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    zIndex: 10,
  },
  overlayInnerContent: {
    paddingHorizontal: 24, // p-6
    paddingTop: 48,
    paddingBottom: 20,
    justifyContent: 'flex-end',
    gap: 10,
  },
  // Name & Age Row
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  metaInfoLeft: {
    flex: 1,
    gap: 4,
  },
  nameHeading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.4,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  statusLocationLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 2,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  onlineGreenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#4ADE80',
  },
  onlineLabel: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '500',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationLabel: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 13,
    fontWeight: '400',
  },
  // Bio (text-sm text-white/90 leading-relaxed font-light)
  bioText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.88)',
    lineHeight: 18,
    fontWeight: '300',
  },
  // Thumbnail Gallery List Above Action Row
  thumbnailGalleryWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 35,
    paddingVertical: 6,
    marginBottom: 10
  },
  thumbnailScrollContent: {
    paddingHorizontal: 20,
    gap: 10,
    alignItems: 'center',
  },
  thumbnailItem: {
    width: 52,
    height: 66,
    borderRadius: 14,
    overflow: 'visible',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  thumbnailItemActive: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1E1418',
    opacity: 1,
  },
  thumbnailItemInactive: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1E1418',
    opacity: 0.5,
  },
  thumbnailActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F65592',
    marginTop: 4,
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
  },
  // Primary Action Row: Chat | Video Call (Center Glow) | Gift
  primaryActionRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 22,
    zIndex: 40,
  },
  actionBtnShadow: {
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  actionBtnWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  actionBtnBlur: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Prominent Center Video Call Button with Neon Glow
  centerCallBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ff69b4',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 50,
  },
  // Celebration Gift Animation Overlay (Unboxing experience matching video call)
  celebrationOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  justTheGiftWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 240,
    height: 240,
  },
  giftBoxLayer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 170,
    height: 170,
  },
  giftBoxEmoji: {
    fontSize: 112,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 10 },
    textShadowRadius: 26,
  },
  revealedGiftLayer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 230,
    height: 230,
  },
  giftGlowCircle: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
  },
  justTheGiftEmoji: {
    fontSize: 130,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 10 },
    textShadowRadius: 28,
  },
});
