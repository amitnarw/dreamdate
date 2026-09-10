import { Ionicons } from '@expo/vector-icons';
import { BlurTargetView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppBackground from '../../components/AppBackground';
import AppHeader from '../../components/AppHeader';
import AppModal from '../../components/AppModal';
import IncomingCallOverlay from '../../components/IncomingCallOverlay';
import { useTabBlur } from '../../context/TabBlurContext';
import { useTheme } from '../../context/ThemeContext';
import { MOCK_PROFILES, Profile } from '../../data/mockProfiles';
import { incomingCallService } from '../../services/incomingCallService';
import { useWallet } from '../../services/wallet';

function GridProfileCard({
  item,
  index,
  router,
}: {
  item: Profile;
  index: number;
  router: any;
}) {
  const isBusy = !item.isOnline || index % 5 === 1;
  const { theme, isDark } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.gridCard,
        {
          backgroundColor: isDark ? '#1C1618' : '#FFFFFF',
        },
      ]}
      onPress={() => router.push(`/profile/${item.id.split('_p')[0]}` as any)}
      activeOpacity={0.9}
    >
      {/* Background & Avatar Image */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: isDark ? '#271D20' : '#E9ECEF' },
        ]}
      />
      {item.avatar ? (
        <Image source={{ uri: item.avatar }} style={StyleSheet.absoluteFill} />
      ) : null}

      {/* Smooth Vertical Gradient Fade */}
      <LinearGradient
        colors={
          isDark
            ? [
                'transparent',
                'rgba(14, 10, 12, 0.0)',
                'rgba(14, 10, 12, 0.60)',
                'rgba(14, 10, 12, 0.95)',
              ]
            : [
                'transparent',
                'rgba(255, 255, 255, 0.0)',
                'rgba(255, 255, 255, 0.72)',
                'rgba(255, 255, 255, 0.98)',
              ]
        }
        locations={[0, 0.40, 0.72, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Status Badge (Online / Busy) */}
      <View
        style={[
          styles.statusBadge,
          {
            backgroundColor: isBusy ? '#E11D48' : '#10B981',
          },
        ]}
      >
        <Text style={styles.statusText}>
          {isBusy ? 'Busy' : 'Online'}
        </Text>
      </View>

      {/* Archetype badge removed */}

      {/* Companion Details at Bottom */}
      <View style={styles.cardGlassPanel} pointerEvents="none">
        {/* Name and Age: Name truncates if long, Age is ALWAYS visible */}
        <View style={styles.cardNameRow}>
          <Text
            style={[
              styles.cardName,
              { color: isDark ? '#FFFFFF' : '#191C1D' },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.name}
          </Text>
          <Text
            style={[
              styles.cardAge,
              { color: isDark ? '#FFFFFF' : '#191C1D' },
            ]}
          >
            , {item.age}
          </Text>
        </View>

        <View style={styles.cardLocationRow}>
          <Ionicons
            name="location-sharp"
            size={11}
            color={isDark ? 'rgba(223, 190, 198, 0.90)' : '#5A606B'}
          />
          <Text
            style={[
              styles.cardCity,
              { color: isDark ? 'rgba(223, 190, 198, 0.90)' : '#5A606B' },
            ]}
            numberOfLines={1}
          >
            {item.city}
          </Text>
        </View>
      </View>

      {/* Vertical Action Column on the Right Side */}
      <View style={styles.cardVerticalActionsCol}>
        {/* Top Button: Frosted Chat (secondary) */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            router.push(`/chat/${item.id.split('_p')[0]}` as any);
          }}
          style={[
            styles.actionCircleChat,
            {
              backgroundColor: isDark
                ? 'rgba(28, 18, 22, 0.85)'
                : '#FFFFFF',
            },
          ]}
          activeOpacity={0.8}
        >
          <Ionicons
            name="chatbubble-ellipses"
            size={17}
            color={isDark ? '#FF70A0' : '#E11D48'}
          />
        </TouchableOpacity>

        {/* Bottom Button: Solid Pink Video Call (primary) */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            router.push(`/call/${item.id.split('_p')[0]}` as any);
          }}
          style={styles.actionCircleCall}
          activeOpacity={0.85}
        >
          <Ionicons name="videocam" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function SkeletonCard({ isDark }: { isDark: boolean }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 750, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const baseBg = isDark ? '#1E1418' : '#F1F3F5';
  const overlayBg = isDark ? '#2A1C20' : '#E5E7EB';

  return (
    <Animated.View
      style={[
        styles.gridCard,
        { backgroundColor: baseBg, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] }) },
      ]}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: overlayBg }]} />
    </Animated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { targets, notifyTargetMounted } = useTabBlur();
  const [exitModalVisible, setExitModalVisible] = useState(false);

  // Endless Profile List State
  const [profilesList, setProfilesList] = useState<Profile[]>(MOCK_PROFILES);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // VIP teaser strip — shown from 2nd session onward if not VIP, dismissible
  const { isVip } = useWallet();
  const [showVipTeaser, setShowVipTeaser] = useState(false);
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
          const seen = await AsyncStorage.getItem('@dreamdate_vip_teaser_seen_v1');
          const launchCountRaw = await AsyncStorage.getItem('@dreamdate_launch_count_v1');
          const launchCount = launchCountRaw ? parseInt(launchCountRaw, 10) : 0;
          if (!cancelled && !isVip && seen !== '1' && launchCount >= 1) {
            // Show on 2nd session onwards (launchCount >= 1 means they've opened at least once)
            setShowVipTeaser(true);
            await AsyncStorage.setItem('@dreamdate_vip_teaser_seen_v1', '1');
          }
        } catch (e) {}
      })();
      return () => {
        cancelled = true;
      };
    }, [isVip])
  );

  useEffect(() => {
    notifyTargetMounted();
  }, []);

  // Schedule first incoming call while user is browsing Discover
  useFocusEffect(
    useCallback(() => {
      incomingCallService.scheduleFirstIfEligible().catch(() => {});
      return () => {
        // Don't cancel here — if it fires the overlay handles it
      };
    }, [])
  );

  const handleLoadMore = () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);

    setTimeout(() => {
      const nextPage = page + 1;
      const moreProfiles: Profile[] = MOCK_PROFILES.map((p, idx) => ({
        ...p,
        id: `${p.id}_p${nextPage}_${idx}`,
        isOnline: Math.random() > 0.2,
        totalCalls: p.totalCalls + Math.floor(Math.random() * 120) + 15,
      }));
      setProfilesList((prev) => [...prev, ...moreProfiles]);
      setPage(nextPage);
      setIsLoadingMore(false);
    }, 400);
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        setExitModalVisible(true);
        return true;
      };

      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [])
  );

  return (
    <BlurTargetView
      ref={targets.index}
      style={[
        styles.container,
        { overflow: 'hidden' },
      ]}
    >
      <AppBackground>
        <SafeAreaView
          style={styles.container}
          edges={['left', 'right']}
        >
          {/* AppHeader */}
          <AppHeader
            title="DreamDate"
            showCoins={true}
            leftElement={
              <View style={styles.brandCircle}>
                <Ionicons name="heart" size={18} color="#F65592" />
              </View>
            }
          />

          {/* Endless Grid List with Native Infinite Scroll */}
          <FlatList
            data={profilesList}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListHeaderComponent={
              <View>
                <View style={styles.titleRow}>
                  <View>
                    <Text
                      style={[
                        styles.headlineText,
                        { color: isDark ? '#FFFFFF' : '#191C1D' },
                      ]}
                    >
                      Discover
                    </Text>
                    <Text
                      style={[
                        styles.headlineSub,
                        { color: isDark ? '#DFBEC6' : '#6B7280' },
                      ]}
                    >
                      🔥 4,280 Female Companions Online Now
                    </Text>
                  </View>
                </View>

                {showVipTeaser && (
                  <TouchableOpacity
                    style={styles.vipTeaser}
                    onPress={() => router.push('/vip' as any)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.vipTeaserIcon}>
                      <Ionicons name="ribbon" size={18} color="#FFD700" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.vipTeaserTitle}>Go VIP · ₹500/week</Text>
                      <Text style={styles.vipTeaserSub}>
                        Unlimited free chat + 50% off calls + 1,500 coins/week
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setShowVipTeaser(false)}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Ionicons name="close" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
              </View>
            }
            ListFooterComponent={
              isLoadingMore ? (
                <View style={styles.gridRow}>
                  <SkeletonCard isDark={isDark} />
                  <SkeletonCard isDark={isDark} />
                </View>
              ) : null
            }
            renderItem={({ item, index }) => (
              <GridProfileCard
                item={item}
                index={index}
                router={router}
              />
            )}
          />

          {/* Exit Confirmation Dialog */}
          <AppModal
            visible={exitModalVisible}
            onClose={() => setExitModalVisible(false)}
            title="Exit DreamDate?"
            description="Are you sure you want to exit the app? Your conversations and coins will be saved."
            icon="log-out"
            primaryAction={{
              label: 'Exit App',
              onPress: () => BackHandler.exitApp(),
              variant: 'destructive',
            }}
            secondaryAction={{
              label: 'Stay',
              onPress: () => setExitModalVisible(false),
            }}
          />

          {/* In-app simulated incoming call overlay */}
          <IncomingCallOverlay />
        </SafeAreaView>
      </AppBackground>
    </BlurTargetView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  brandCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(246, 85, 146, 0.12)',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 110,
  },
  titleRow: {
    marginBottom: 16,
  },
  vipTeaser: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    gap: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.10)',
    marginBottom: 12,
  },
  vipTeaserIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 215, 0, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vipTeaserTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFD700',
  },
  vipTeaserSub: {
    fontSize: 11,
    marginTop: 2,
    color: 'rgba(241, 224, 228, 0.70)',
  },
  headlineText: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headlineSub: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridCard: {
    width: '48%',
    height: 260,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
  },
  statusBadge: {
    position: 'absolute',
    top: 9,
    left: 9,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    zIndex: 10,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  filterEmoji: {
    fontSize: 13,
  },
  filterLabel: {
    fontSize: 12,
  },
  cardGlassPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingRight: 48,
    gap: 2,
    zIndex: 5,
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  cardName: {
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  cardAge: {
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 0,
  },
  cardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardCity: {
    fontSize: 10,
    fontWeight: '500',
  },
  cardVerticalActionsCol: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    gap: 8,
    zIndex: 10,
  },
  actionCircleChat: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCircleCall: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F65592',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
