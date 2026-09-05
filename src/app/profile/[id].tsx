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
import { MOCK_PROFILES, Profile } from '../../data/mockProfiles';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Female Profile Details Screen
 *
 * Updates:
 * - Bottom-to-top opening slide animation (320ms)
 * - Smooth FADE OUT animation on exit (220ms)
 * - Online / Busy status badge on top-right of the card
 * - Removed categories / badges above the name
 * - Horizontal gallery list of images above the bottom 3 options
 * - Tap thumbnail to update displayed preview photo
 * - Prominent celebration floating animation when gift is sent
 * - Modernized GiftModal with 24 gifts across 4 categories
 */
export default function UserProfileDetail1to1() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile: Profile = MOCK_PROFILES.find((p) => p.id === id) || MOCK_PROFILES[0];

  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [rechargeModalVisible, setRechargeModalVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Active photo gallery state with native smooth transition
  const photoList = [
    profile.avatar,
    ...(profile.photos && profile.photos.length > 0
      ? profile.photos
      : MOCK_PROFILES.filter((p) => p.id !== profile.id)
        .slice(0, 5)
        .map((p) => p.avatar)),
  ];
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

  // Gift celebration animation state
  const [sentGiftAnim, setSentGiftAnim] = useState<{ icon: string; name: string } | null>(null);
  const giftScaleAnim = useRef(new Animated.Value(0.2)).current;
  const giftTranslateY = useRef(new Animated.Value(40)).current;
  const giftOpacityAnim = useRef(new Animated.Value(0)).current;

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
  const handleGiftSent = (gift: { name: string; icon: string; coins: number }) => {
    setSentGiftAnim(gift);
    giftScaleAnim.setValue(0.3);
    giftTranslateY.setValue(40);
    giftOpacityAnim.setValue(0);

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) { }

    Animated.parallel([
      Animated.spring(giftScaleAnim, {
        toValue: 1.25,
        friction: 4,
        tension: 45,
        useNativeDriver: true,
      }),
      Animated.timing(giftTranslateY, {
        toValue: -90,
        duration: 1400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(giftOpacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.delay(1200),
        Animated.timing(giftOpacityAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setSentGiftAnim(null);
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
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* BEGIN: TopAppBar */}
        <View style={[styles.topHeaderBar, { paddingTop: insets.top + 8 }]}>
          <BackButton onPress={handleClose} />

          <Text style={styles.topNavTitle}>Near You</Text>

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
            <View style={styles.cardStatusBadgeWrap}>
              <AppBlurView
                blurTarget={imageTargetRef}
                style={styles.cardStatusBadge}
              >
                <View
                  style={[
                    styles.cardStatusDot,
                    { backgroundColor: profile.isOnline ? '#4ADE80' : '#FFB1C7' },
                  ]}
                />
                <Text style={styles.cardStatusText}>
                  {profile.isOnline ? 'Online' : 'Busy'}
                </Text>
              </AppBlurView>
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
                    <Text style={styles.nameHeading}>
                      {profile.name}, {profile.age}
                    </Text>

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
                  style={[
                    styles.thumbnailItem,
                    isSelected ? styles.thumbnailItemActive : styles.thumbnailItemInactive,
                  ]}
                  onPress={() => handleSelectPhoto(uri)}
                  activeOpacity={0.85}
                >
                  <ExpoImage
                    source={{ uri }}
                    style={styles.thumbnailImg}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
        {/* END: Horizontal List of Images */}

        {/* BEGIN: Primary Action Row: Chat | Video Call (Center Glow) | Gift */}
        <View style={[styles.primaryActionRow, { bottom: Math.max(insets.bottom, 16) + 12 }]}>
          {/* Chat Button (Left) */}
          <TouchableOpacity
            style={styles.actionBtnWrap}
            onPress={() => router.push(`/chat/${profile.id}` as any)}
            activeOpacity={0.8}
            accessibilityLabel="Chat"
          >
            <AppBlurView style={styles.actionBtnBlur}>
              <Ionicons name="chatbubble" size={24} color="#FFF" />
            </AppBlurView>
          </TouchableOpacity>

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
          <TouchableOpacity
            style={styles.actionBtnWrap}
            onPress={() => setGiftModalVisible(true)}
            activeOpacity={0.85}
            accessibilityLabel="Send Gift"
          >
            <AppBlurView style={styles.actionBtnBlur}>
              <Ionicons name="gift" size={24} color="#FFF" />
            </AppBlurView>
          </TouchableOpacity>
        </View>
        {/* END: Primary Action Row */}

        {/* Gift Celebration Pop Animation Overlay */}
        {sentGiftAnim && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.celebrationOverlay,
              {
                opacity: giftOpacityAnim,
                transform: [{ scale: giftScaleAnim }, { translateY: giftTranslateY }],
              },
            ]}
          >
            <View style={styles.celebrationGlowBack}>
              <Text style={styles.celebrationBigEmoji}>{sentGiftAnim.icon}</Text>
            </View>
            <View style={styles.celebrationBanner}>
              <Text style={styles.celebrationBannerText}>
                ✨ Sent {sentGiftAnim.name} to {profile.name}! 💖
              </Text>
            </View>
          </Animated.View>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8
  },
  // Status Badge on Top Right of Card
  cardStatusBadgeWrap: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 25,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  cardStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  cardStatusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
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
    overflow: 'hidden',
    backgroundColor: '#1E1418',
    borderWidth: 2.5,
  },
  thumbnailItemActive: {
    borderColor: '#F65592',
    opacity: 1,
  },
  thumbnailItemInactive: {
    borderColor: 'transparent',
    opacity: 0.55,
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
  actionBtnWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
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
    shadowColor: '#ff69b4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 20,
    elevation: 15,
  },
  // Celebration Gift Animation Overlay
  celebrationOverlay: {
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 60,
  },
  celebrationGlowBack: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 105, 180, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 30,
    elevation: 12,
  },
  celebrationBigEmoji: {
    fontSize: 64,
  },
  celebrationBanner: {
    marginTop: 14,
    backgroundColor: 'rgba(30, 20, 24, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  celebrationBannerText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
