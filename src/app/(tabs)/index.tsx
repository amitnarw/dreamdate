import { Ionicons } from "@expo/vector-icons";
import { BlurTargetView } from "expo-blur";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppBackground from "../../components/AppBackground";
import AppHeader from "../../components/AppHeader";
import AppModal from "../../components/AppModal";
import RechargeModal from "../../components/RechargeModal";
import SkeletonImage from "../../components/SkeletonImage";
import { useAuth } from "../../context/AuthContext";
import { useTabBlur } from "../../context/TabBlurContext";
import { useTheme } from "../../context/ThemeContext";
import { MOCK_PROFILES, Profile } from "../../data/mockProfiles";
import { incomingCallService } from "../../services/incomingCallService";
import { MEDIA_HEADERS } from "../../services/videoService";
import { useWallet } from "../../services/wallet";

function shuffleProfiles(input: Profile[]): Profile[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const FIRST_LAUNCH_TOP_IDS = [
  "girl-18", // img_18
  "girl-23", // img_23
  "girl-2",  // img_2
  "girl-24", // img_24
  "girl-8",  // img_8
  "girl-29", // img_29
  "girl-13", // img_13
  "girl-25", // img_25
  "girl-38", // img_38
  "girl-26", // img_26
];

function getFirstLaunchProfiles(): Profile[] {
  const topProfiles: Profile[] = [];
  const topIdSet = new Set(FIRST_LAUNCH_TOP_IDS);
  const remainingProfiles = MOCK_PROFILES.filter((p) => !topIdSet.has(p.id));

  FIRST_LAUNCH_TOP_IDS.forEach((id) => {
    const found = MOCK_PROFILES.find((p) => p.id === id);
    if (found) topProfiles.push(found);
  });

  return [...topProfiles, ...shuffleProfiles(remainingProfiles)];
}

/**
 * Staggered disk-cache warm-up so the first viewport of the Discover grid is
 * already loaded off disk by the time you scroll. Runs once per app open;
 * expo-image prefetches are idempotent and free if the URL is already cached.
 */
function warmAvatarCache(profiles: Profile[], firstN: number, intervalMs: number): void {
  const subset = profiles.slice(0, firstN);
  const uris = Array.from(
    new Set(subset.map((p) => p.avatar).filter(Boolean) as string[]),
  );
  uris.forEach((uri, i) => {
    setTimeout(() => {
      ExpoImage.prefetch([uri], { cachePolicy: "disk", headers: MEDIA_HEADERS }).catch(() => {});
    }, i * intervalMs);
  });
}

function GridProfileCard({
  item,
  index,
  router,
  coins,
  onNeedRecharge,
}: {
  item: Profile;
  index: number;
  router: any;
  coins: number;
  onNeedRecharge: (profile: Profile) => void;
}) {
  const isBusy = !item.isOnline || index % 5 === 1;
  const { theme, isDark } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.gridCard,
        {
          backgroundColor: isDark ? "#1C1618" : "#FFFFFF",
        },
      ]}
      onPress={() => router.push(`/profile/${item.id.split("_p")[0]}` as any)}
      activeOpacity={0.9}
    >
      {/* Background & Avatar Image */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: isDark ? "#271D20" : "#E9ECEF" },
        ]}
      />
      {item.avatar ? (
        <SkeletonImage
          uri={item.avatar}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="disk"
          recyclingKey={item.avatar}
          transition={120}
        />
      ) : null}

      {/* Smooth Vertical Gradient Fade */}
      <LinearGradient
        colors={
          isDark
            ? [
                "transparent",
                "rgba(14, 10, 12, 0.0)",
                "rgba(14, 10, 12, 0.60)",
                "rgba(14, 10, 12, 0.95)",
              ]
            : [
                "transparent",
                "rgba(255, 255, 255, 0.0)",
                "rgba(255, 255, 255, 0.72)",
                "rgba(255, 255, 255, 0.98)",
              ]
        }
        locations={[0, 0.4, 0.72, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Status Badge (Online / Busy) */}
      <View
        style={[
          styles.statusBadge,
          {
            backgroundColor: isBusy ? "#E11D48" : "#10B981",
          },
        ]}
      >
        <Text style={styles.statusText}>{isBusy ? "Busy" : "Online"}</Text>
      </View>

      {/* Archetype badge removed */}

      {/* Companion Details at Bottom */}
      <View style={styles.cardGlassPanel} pointerEvents="none">
        {/* Name and Age: Name truncates if long, Age is ALWAYS visible */}
        <View style={styles.cardNameRow}>
          <Text
            style={[styles.cardName, { color: isDark ? "#FFFFFF" : "#191C1D" }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.name}
          </Text>
          <Text
            style={[styles.cardAge, { color: isDark ? "#FFFFFF" : "#191C1D" }]}
          >
            , {item.age}
          </Text>
        </View>

        <View style={styles.cardLocationRow}>
          <Ionicons
            name="location-sharp"
            size={11}
            color={isDark ? "rgba(223, 190, 198, 0.90)" : "#5A606B"}
          />
          <Text
            style={[
              styles.cardCity,
              { color: isDark ? "rgba(223, 190, 198, 0.90)" : "#5A606B" },
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
            router.push(`/chat/${item.id.split("_p")[0]}` as any);
          }}
          style={[
            styles.actionCircleChat,
            {
              backgroundColor: isDark ? "rgba(28, 18, 22, 0.85)" : "#FFFFFF",
            },
          ]}
          activeOpacity={0.8}
        >
          <Ionicons
            name="chatbubble-ellipses"
            size={17}
            color={isDark ? "#FF70A0" : "#E11D48"}
          />
        </TouchableOpacity>

        {/* Bottom Button: Solid Pink Video Call (primary) */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            if (coins < item.callRate) {
              onNeedRecharge(item);
              return;
            }
            router.push(`/call/${item.id.split("_p")[0]}` as any);
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

/** Fixed-height load-more footer: spinner + pulsing "Loading" text.
 *  Always mounted (empty when idle) so the list never jumps when the
 *  loader appears/disappears ,  new cards simply fill the space below. */
function LoadMoreFooter({
  isDark,
  loading,
}: {
  isDark: boolean;
  loading: boolean;
}) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [loading]);

  return (
    <View style={styles.loadMoreFooter}>
      {loading ? (
        <View style={styles.loadMoreRow}>
          <ActivityIndicator size="small" color="#F65592" />
          <Animated.Text
            style={[
              styles.loadMoreText,
              {
                color: isDark ? "rgba(241, 224, 228, 0.70)" : "#6B7280",
                opacity: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.45, 1],
                }),
              },
            ]}
          >
            Loading more...
          </Animated.Text>
        </View>
      ) : null}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const { targets, notifyTargetMounted } = useTabBlur();
  const [exitModalVisible, setExitModalVisible] = useState(false);

  const PAGE_SIZE = 10;
  // 1st time on homepage: top 10 profiles are strictly curated (img_18, img_23, img_2, etc.)
  // Subsequent app opens: randomized order. Only 10 loaded initially.
  const [baseProfiles, setBaseProfiles] = useState<Profile[]>(() => getFirstLaunchProfiles());
  const [profilesList, setProfilesList] = useState<Profile[]>(() => getFirstLaunchProfiles().slice(0, PAGE_SIZE));
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // VIP teaser strip ,  shown from 2nd session onward if not VIP, dismissible
  const { coins, isVip } = useWallet();
  const [showVipTeaser, setShowVipTeaser] = useState(false);
  const [rechargeModalVisible, setRechargeModalVisible] = useState(false);
  const [lowBalanceAlert, setLowBalanceAlert] = useState<{
    visible: boolean;
    profile?: Profile;
  }>({ visible: false });
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const AsyncStorage = (
            await import("@react-native-async-storage/async-storage")
          ).default;
          const seen = await AsyncStorage.getItem(
            "@dreamdate_vip_teaser_seen_v1",
          );
          const launchCountRaw = await AsyncStorage.getItem(
            "@dreamdate_launch_count_v1",
          );
          const launchCount = launchCountRaw ? parseInt(launchCountRaw, 10) : 0;
          if (!cancelled && !isVip && seen !== "1" && launchCount >= 1) {
            // Show on 2nd session onwards (launchCount >= 1 means they've opened at least once)
            setShowVipTeaser(true);
            await AsyncStorage.setItem("@dreamdate_vip_teaser_seen_v1", "1");
          }
        } catch (e) {}
      })();
      return () => {
        cancelled = true;
      };
    }, [isVip]),
  );

  // Check if first time opening home screen: keep curated order on 1st open, randomize afterwards
  useEffect(() => {
    (async () => {
      try {
        const AsyncStorage = (
          await import("@react-native-async-storage/async-storage")
        ).default;
        const seen = await AsyncStorage.getItem("@dreamdate_first_home_seen_v1");
        if (!seen) {
          // 1st time opening homepage: keep the curated top 10 order and mark seen
          await AsyncStorage.setItem("@dreamdate_first_home_seen_v1", "1");
        } else {
          // Subsequent app opens: randomize
          const randomized = shuffleProfiles(MOCK_PROFILES);
          setBaseProfiles(randomized);
          setProfilesList(randomized.slice(0, PAGE_SIZE));
          setPage(1);
        }
      } catch (e) {}
    })();
  }, []);

  useEffect(() => {
    notifyTargetMounted();
    // Staggered prefetch: prefetch the first 12 visible avatars to disk so
    // grid items render instantly from disk cache.
    warmAvatarCache(baseProfiles, 12, 150);
  }, [baseProfiles]);

  // Schedule incoming call only when user is logged in and browsing Discover
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      incomingCallService.scheduleFirstIfEligible().catch(() => {});
      return () => {
        // Don't cancel here ,  if it fires the overlay handles it
      };
    }, [user]),
  );

  const handleLoadMore = () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);

    setTimeout(() => {
      const nextPage = page + 1;
      const currentCount = profilesList.length;

      // If we haven't shown all baseProfiles yet, take next 10 from baseProfiles
      if (currentCount < baseProfiles.length) {
        const nextBatch = baseProfiles.slice(currentCount, currentCount + PAGE_SIZE);
        setProfilesList((prev) => [...prev, ...nextBatch]);
      } else {
        // Beyond initial list: loop back and generate next 10 with page suffix
        const startIndex = ((nextPage - 1) * PAGE_SIZE) % baseProfiles.length;
        const pool = [...baseProfiles, ...baseProfiles];
        const nextBatch: Profile[] = pool
          .slice(startIndex, startIndex + PAGE_SIZE)
          .map((p, idx) => ({
            ...p,
            id: `${p.id}_p${nextPage}_${idx}`,
            isOnline: Math.random() > 0.2,
            totalCalls: p.totalCalls + Math.floor(Math.random() * 120) + 15,
          }));
        setProfilesList((prev) => [...prev, ...nextBatch]);
      }

      setPage(nextPage);
      setIsLoadingMore(false);
    }, 600);
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        setExitModalVisible(true);
        return true;
      };

      const sub = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => sub.remove();
    }, []),
  );

  return (
    <BlurTargetView
      ref={targets.index}
      style={[styles.container, { overflow: "hidden" }]}
    >
      <AppBackground>
        <SafeAreaView style={styles.container} edges={["left", "right"]}>
          {/* AppHeader */}
          <AppHeader
            title="BoloNa"
            showCoins={true}
            leftElement={
              <Image
                source={require("../../../assets/images/logo.png")}
                style={{ width: 30, height: 30, borderRadius: 9 }}
                resizeMode="cover"
              />
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
            windowSize={7}
            initialNumToRender={8}
            maxToRenderPerBatch={6}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews={true}
            ListHeaderComponent={
              <View>
                <View style={styles.titleRow}>
                  <View>
                    <Text
                      style={[
                        styles.headlineText,
                        { color: isDark ? "#FFFFFF" : "#191C1D" },
                      ]}
                    >
                      Discover
                    </Text>
                    <Text
                      style={[
                        styles.headlineSub,
                        { color: isDark ? "#DFBEC6" : "#6B7280" },
                      ]}
                    >
                      🔥 4,280 Female Companions Online Now
                    </Text>
                  </View>
                </View>

                {showVipTeaser && (
                  <TouchableOpacity
                    style={styles.vipCardWrap}
                    onPress={() => router.push("/vip" as any)}
                    activeOpacity={0.92}
                  >
                    <LinearGradient
                      colors={
                        isDark
                          ? ["#2A1420", "#180B13"]
                          : ["#FFF2F6", "#FFE6EE"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.vipCardGradient}
                    >
                      {/* Ambient background glow */}
                      <View
                        style={[
                          styles.vipAmbientOrb1,
                          {
                            backgroundColor: isDark
                              ? "rgba(246, 85, 146, 0.14)"
                              : "rgba(255, 215, 0, 0.15)",
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.vipAmbientOrb2,
                          {
                            backgroundColor: isDark
                              ? "rgba(255, 215, 0, 0.08)"
                              : "rgba(246, 85, 146, 0.10)",
                          },
                        ]}
                      />

                      {/* Row 1: VIP Badge Pill & Dismiss */}
                      <View style={styles.vipTopRow}>
                        <View
                          style={[
                            styles.vipBadgePill,
                            {
                              backgroundColor: isDark
                                ? "rgba(255, 215, 0, 0.16)"
                                : "rgba(245, 158, 11, 0.14)",
                            },
                          ]}
                        >
                          <Ionicons
                            name="sparkles"
                            size={11}
                            color={isDark ? "#FFD700" : "#D97706"}
                          />
                          <Text
                            style={[
                              styles.vipBadgeText,
                              { color: isDark ? "#FFD700" : "#92400E" },
                            ]}
                          >
                            VIP ALL-ACCESS
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            setShowVipTeaser(false);
                          }}
                          style={[
                            styles.vipDismissBtn,
                            {
                              backgroundColor: isDark
                                ? "rgba(255, 255, 255, 0.08)"
                                : "rgba(0, 0, 0, 0.05)",
                            },
                          ]}
                          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name="close"
                            size={14}
                            color={isDark ? "rgba(255,255,255,0.7)" : "#6B4556"}
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Row 2: Headline & CTA inline */}
                      <View style={styles.vipMainRow}>
                        <View style={styles.vipTextCol}>
                          <Text
                            style={[
                              styles.vipHeadline,
                              { color: isDark ? "#FFFFFF" : "#1E0C18" },
                            ]}
                            numberOfLines={1}
                          >
                            Unlock VIP Privileges
                          </Text>
                          <Text
                            style={[
                              styles.vipSubheadline,
                              {
                                color: isDark
                                  ? "rgba(241, 224, 228, 0.75)"
                                  : "#6B4556",
                              },
                            ]}
                            numberOfLines={1}
                          >
                            Unlimited photos, free chat & 50% off
                          </Text>
                        </View>

                        <View style={styles.vipCtaBtn}>
                          <Text style={styles.vipCtaText}>Get VIP • ₹499</Text>
                          <Ionicons
                            name="arrow-forward"
                            size={13}
                            color="#FFFFFF"
                          />
                        </View>
                      </View>

                      {/* Row 3: Micro Perk Chips */}
                      <View style={styles.vipPerksRow}>
                        <View
                          style={[
                            styles.vipPerkChip,
                            {
                              backgroundColor: isDark
                                ? "rgba(255, 255, 255, 0.06)"
                                : "rgba(255, 255, 255, 0.85)",
                            },
                          ]}
                        >
                          <Ionicons
                            name="images"
                            size={11}
                            color="#38BDF8"
                          />
                          <Text
                            style={[
                              styles.vipPerkText,
                              { color: isDark ? "#FFFFFF" : "#1E0C18" },
                            ]}
                          >
                            Unlimited Photos
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.vipPerkChip,
                            {
                              backgroundColor: isDark
                                ? "rgba(255, 255, 255, 0.06)"
                                : "rgba(255, 255, 255, 0.85)",
                            },
                          ]}
                        >
                          <Ionicons
                            name="chatbubble-ellipses"
                            size={11}
                            color={isDark ? "#4ADE80" : "#16A34A"}
                          />
                          <Text
                            style={[
                              styles.vipPerkText,
                              { color: isDark ? "#FFFFFF" : "#1E0C18" },
                            ]}
                          >
                            Free Chat
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.vipPerkChip,
                            {
                              backgroundColor: isDark
                                ? "rgba(255, 255, 255, 0.06)"
                                : "rgba(255, 255, 255, 0.85)",
                            },
                          ]}
                        >
                          <Ionicons
                            name="videocam"
                            size={11}
                            color="#F65592"
                          />
                          <Text
                            style={[
                              styles.vipPerkText,
                              { color: isDark ? "#FFFFFF" : "#1E0C18" },
                            ]}
                          >
                            50% Off
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.vipPerkChip,
                            {
                              backgroundColor: isDark
                                ? "rgba(255, 255, 255, 0.06)"
                                : "rgba(255, 255, 255, 0.85)",
                            },
                          ]}
                        >
                          <Ionicons
                            name="trophy"
                            size={11}
                            color={isDark ? "#FFD700" : "#D97706"}
                          />
                          <Text
                            style={[
                              styles.vipPerkText,
                              { color: isDark ? "#FFFFFF" : "#1E0C18" },
                            ]}
                          >
                            +1,500 Coins
                          </Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            }
            ListFooterComponent={
              <LoadMoreFooter isDark={isDark} loading={isLoadingMore} />
            }
            renderItem={({ item, index }) => (
              <GridProfileCard
                item={item}
                index={index}
                router={router}
                coins={coins}
                onNeedRecharge={(profile) =>
                  setLowBalanceAlert({ visible: true, profile })
                }
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
              label: "Exit App",
              onPress: () => BackHandler.exitApp(),
              variant: "destructive",
            }}
            secondaryAction={{
              label: "Stay",
              onPress: () => setExitModalVisible(false),
            }}
          />

          {/* Low Balance Video Call Notice */}
          <AppModal
            visible={lowBalanceAlert.visible}
            onClose={() => setLowBalanceAlert({ visible: false })}
            title="Insufficient Coins"
            description={
              lowBalanceAlert.profile
                ? `${lowBalanceAlert.profile.name}'s video call rate is ${lowBalanceAlert.profile.callRate} coins/min. You have ${coins} coins. Please recharge to start calling!`
                : "You do not have enough coins to start this video call."
            }
            icon="videocam-outline"
            primaryAction={{
              label: "Recharge Now",
              onPress: () => {
                setLowBalanceAlert({ visible: false });
                setRechargeModalVisible(true);
              },
            }}
            secondaryAction={{
              label: "Cancel",
              onPress: () => setLowBalanceAlert({ visible: false }),
            }}
          />

          <RechargeModal
            visible={rechargeModalVisible}
            onClose={() => setRechargeModalVisible(false)}
          />
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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(246, 85, 146, 0.12)",
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 110,
  },
  loadMoreFooter: {
    height: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  loadMoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: "600",
  },
  titleRow: {
    marginBottom: 16,
  },
  vipCardWrap: {
    borderRadius: 18,
    marginBottom: 14,
    overflow: "hidden",
  },
  vipCardGradient: {
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    position: "relative",
    overflow: "hidden",
  },
  vipAmbientOrb1: {
    position: "absolute",
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  vipAmbientOrb2: {
    position: "absolute",
    bottom: -50,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  vipTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    zIndex: 2,
  },
  vipBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 16,
  },
  vipBadgeText: {
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  vipDismissBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  vipMainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    zIndex: 2,
  },
  vipTextCol: {
    flex: 1,
  },
  vipHeadline: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  vipSubheadline: {
    fontSize: 11.5,
    fontWeight: "500",
    marginTop: 2,
  },
  vipCtaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F65592",
    paddingHorizontal: 12,
    paddingVertical: 7.5,
    borderRadius: 16,
  },
  vipCtaText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  vipPerksRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 9,
    zIndex: 2,
  },
  vipPerkChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  vipPerkText: {
    fontSize: 9.5,
    fontWeight: "700",
  },
  headlineText: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  headlineSub: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  gridRow: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  gridCard: {
    width: "48%",
    height: 260,
    borderRadius: 22,
    overflow: "hidden",
    position: "relative",
  },
  statusBadge: {
    position: "absolute",
    top: 9,
    left: 9,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    zIndex: 10,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  filterEmoji: {
    fontSize: 13,
  },
  filterLabel: {
    fontSize: 12,
  },
  cardGlassPanel: {
    position: "absolute",
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
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  cardName: {
    fontSize: 13,
    fontWeight: "700",
    flexShrink: 1,
  },
  cardAge: {
    fontSize: 13,
    fontWeight: "700",
    flexShrink: 0,
  },
  cardLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  cardCity: {
    fontSize: 10,
    fontWeight: "500",
  },
  cardVerticalActionsCol: {
    position: "absolute",
    bottom: 10,
    right: 10,
    gap: 8,
    zIndex: 10,
  },
  actionCircleChat: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  actionCircleCall: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F65592",
    alignItems: "center",
    justifyContent: "center",
  },
});
