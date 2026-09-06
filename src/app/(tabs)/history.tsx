import { Ionicons } from '@expo/vector-icons';
import { BlurTargetView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import AppBackground from '../../components/AppBackground';
import AppBlurView from '../../components/AppBlurView';
import AppHeader from '../../components/AppHeader';
import CoinIcon from '../../components/CoinIcon';
import {
    Animated,
    Dimensions,
    FlatList,
    Image,
    LayoutChangeEvent,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RechargeModal from '../../components/RechargeModal';
import { StitchTheme } from '../../constants/theme';
import { useTabBlur } from '../../context/TabBlurContext';
import { useTheme } from '../../context/ThemeContext';
import { MOCK_PROFILES } from '../../data/mockProfiles';
import { useWallet } from '../../services/wallet';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabType = 'chats' | 'calls';

interface CallRecord {
  id: string;
  profileId: string;
  name: string;
  avatar: string;
  type: 'incoming' | 'outgoing' | 'missed';
  minutesAgo: number;
  duration: string;
  coins: number;
}

const MOCK_CALL_LOGS: CallRecord[] = [
  {
    id: 'c1',
    profileId: 'priya-1',
    name: 'Sophia',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    type: 'outgoing',
    minutesAgo: 25, // under 1 hour -> '25m ago'
    duration: '03:42',
    coins: 180,
  },
  {
    id: 'c2',
    profileId: 'ananya-2',
    name: 'Zara',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    type: 'incoming',
    minutesAgo: 180, // >= 1 hour -> '3h ago'
    duration: '02:10',
    coins: 100,
  },
  {
    id: 'c3',
    profileId: 'pooja-4',
    name: 'Amelia',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
    type: 'missed',
    minutesAgo: 1600, // >= 24 hours -> '1d ago'
    duration: '00:00',
    coins: 0,
  },
  {
    id: 'c4',
    profileId: 'julia-12',
    name: 'Elena',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
    type: 'outgoing',
    minutesAgo: 14400, // >= 7 days -> '1w ago'
    duration: '05:15',
    coins: 250,
  },
  {
    id: 'c5',
    profileId: 'kavya-6',
    name: 'Chloe',
    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=800&q=80',
    type: 'incoming',
    minutesAgo: 50000, // >= 30 days -> '1mo ago'
    duration: '01:50',
    coins: 45,
  },
];

/**
 * Formats elapsed time into relative human-readable string:
 * - Under 1 hour (< 60m): only in minutes (e.g. 'Just now', '14m ago')
 * - Hours: e.g. '2h ago', '18h ago'
 * - Days: e.g. '1d ago', '3d ago'
 * - Weeks: e.g. '1w ago', '2w ago'
 * - Months: e.g. '1mo ago', '4mo ago'
 * - Years: e.g. '1y ago', '2y ago'
 */
function formatHistoryTime(minutesAgo: number): string {
  if (minutesAgo <= 0) return 'Just now';
  if (minutesAgo < 60) return `${minutesAgo}m ago`;

  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

// Relative timestamps for mock chat items demonstrating minutes, hours, days, weeks, months, years
const CHAT_MINUTES_AGO = [0, 14, 38, 150, 420, 2880, 7200, 14400, 28800, 50000, 150000, 600000];

export default function MessageCenterHistory() {
  const router = useRouter();
  const { coins } = useWallet();
  const [activeTab, setActiveTab] = useState<TabType>('chats');
  const [rechargeVisible, setRechargeVisible] = useState(false);
  const [tabBarWidth, setTabBarWidth] = useState(SCREEN_WIDTH - 40);

  // Horizontal scroll tracking for swipeable tabs
  const scrollX = useRef(new Animated.Value(0)).current;
  const pagerRef = useRef<ScrollView>(null);

  const handleTabPress = (tab: TabType) => {
    setActiveTab(tab);
    pagerRef.current?.scrollTo({
      x: tab === 'chats' ? 0 : SCREEN_WIDTH,
      animated: true,
    });
  };

  const handleScrollEnd = (e: any) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveTab(page === 0 ? 'chats' : 'calls');
  };

  const { theme, isDark } = useTheme();
  const { targets, notifyTargetMounted } = useTabBlur();

  useEffect(() => {
    notifyTargetMounted();
  }, []);

  const segmentWidth = Math.max(0, (tabBarWidth - 8) / 2);

  const pillTranslateX = scrollX.interpolate({
    inputRange: [0, SCREEN_WIDTH],
    outputRange: [4, 4 + segmentWidth],
    extrapolate: 'clamp',
  });

  return (
    <BlurTargetView
      ref={targets.history}
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
            {/* Standardized AppHeader (Consistent with Female Details Page) */}
            <AppHeader title="Chats & Calls" showCoins={true} />

            {/* Tabs Pill Switcher with Animated Sliding Indicator */}
            <View style={styles.tabBarWrap}>
        <AppBlurView
          style={[
            styles.glassTabContainer,
            {
              backgroundColor: isDark
                ? 'rgba(30, 32, 32, 0.45)'
                : 'rgba(0, 0, 0, 0.05)',
            },
          ]}
          tint={isDark ? 'dark' : 'light'}
          onLayout={(e: LayoutChangeEvent) => {
            const w = e.nativeEvent.layout.width;
            if (w > 0 && Math.abs(w - tabBarWidth) > 2) {
              setTabBarWidth(w);
            }
          }}
        >
          {/* Sliding Animated Pill Background */}
          <Animated.View
            style={[
              styles.slidingSegmentPill,
              {
                width: segmentWidth,
                transform: [{ translateX: pillTranslateX }],
                backgroundColor: isDark ? '#333535' : '#FFFFFF',
              },
            ]}
          />

          <TouchableOpacity
            style={styles.tabSegment}
            onPress={() => handleTabPress('chats')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabSegmentText,
                {
                  color:
                    activeTab === 'chats'
                      ? isDark
                        ? '#FFFFFF'
                        : '#191C1D'
                      : theme.colors.onSurfaceVariant,
                  fontWeight: activeTab === 'chats' ? '700' : '500',
                },
              ]}
            >
              Chats
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabSegment}
            onPress={() => handleTabPress('calls')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabSegmentText,
                {
                  color:
                    activeTab === 'calls'
                      ? isDark
                        ? '#FFFFFF'
                        : '#191C1D'
                      : theme.colors.onSurfaceVariant,
                  fontWeight: activeTab === 'calls' ? '700' : '500',
                },
              ]}
            >
              Video Calls
            </Text>
          </TouchableOpacity>
        </AppBlurView>
      </View>

      {/* Horizontal Swipeable Tabs Pager with Seamless Background */}
      <View style={{ flex: 1 }}>
        <Animated.ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        onMomentumScrollEnd={handleScrollEnd}
        style={styles.screensContainer}
        contentContainerStyle={{ width: SCREEN_WIDTH * 2 }}
      >
        {/* Page 1: Chats */}
        <View style={{ width: SCREEN_WIDTH }}>
          <FlatList
            data={MOCK_PROFILES}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item, index }) => {
              const isUnread = index < 3;
              const minutesAgo = CHAT_MINUTES_AGO[index] ?? (index * 120);
              const displayTime = formatHistoryTime(minutesAgo);
              return (
                <TouchableOpacity
                  style={[
                    styles.chatRow,
                    {
                      backgroundColor: isDark
                        ? 'rgba(30, 32, 32, 0.45)'
                        : '#FFFFFF',
                      borderColor: isDark
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.06)',
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => router.push(`/chat/${item.id}` as any)}
                  activeOpacity={0.8}
                >
                  {/* Story Ring Avatar + Online Dot */}
                  <View style={styles.avatarWrap}>
                    <View
                      style={[
                        styles.storyRing,
                        isUnread ? styles.storyRingActive : styles.storyRingInactive,
                      ]}
                    >
                      <Image source={{ uri: item.avatar }} style={styles.avatarImg} />
                    </View>
                    <View style={styles.onlineBadgeDot} />
                  </View>

                  {/* Name, Time, Preview */}
                  <View style={styles.chatInfo}>
                    <View style={styles.chatHeaderRow}>
                      <Text
                        style={[
                          styles.chatName,
                          { color: isDark ? '#FFFFFF' : '#191C1D' },
                        ]}
                      >
                        {item.name.split(' ')[0]}
                      </Text>
                      <Text
                        style={[
                          styles.chatTime,
                          {
                            color: isUnread
                              ? '#F65592'
                              : theme.colors.onSurfaceVariant,
                            fontWeight: isUnread ? '600' : '400',
                          },
                        ]}
                      >
                        {displayTime}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.chatPreview,
                        {
                          color: isUnread
                            ? isDark
                              ? '#FFFFFF'
                              : '#191C1D'
                            : theme.colors.onSurfaceVariant,
                          fontWeight: isUnread ? '500' : '400',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {index === 0
                        ? "I'd love to go there! Free to call now?"
                        : `Hii dear! Main ${item.name}. Kaise ho?`}
                    </Text>
                  </View>

                  {/* Pink Glowing Dot for Unread */}
                  {isUnread && <View style={styles.unreadGlowDot} />}
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Page 2: Video Calls */}
        <View style={{ width: SCREEN_WIDTH }}>
          <FlatList
            data={MOCK_CALL_LOGS}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const displayTime = formatHistoryTime(item.minutesAgo);
              return (
                <TouchableOpacity
                  style={[
                    styles.callRow,
                    {
                      backgroundColor: isDark
                        ? 'rgba(30, 32, 32, 0.45)'
                        : '#FFFFFF',
                      borderColor: isDark
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.06)',
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => router.push(`/call/${item.profileId}` as any)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: item.avatar }} style={styles.callAvatar} />

                  <View style={styles.callInfo}>
                    <Text
                      style={[
                        styles.callName,
                        { color: isDark ? '#FFFFFF' : '#191C1D' },
                      ]}
                    >
                      {item.name}
                    </Text>
                    <View style={styles.callMetaRow}>
                      {item.type === 'incoming' && (
                        <Ionicons name="arrow-down" size={13} color="#4ADE80" />
                      )}
                      {item.type === 'outgoing' && (
                        <Ionicons name="arrow-up" size={13} color="#F65592" />
                      )}
                      {item.type === 'missed' && (
                        <Ionicons name="close" size={13} color="#FF6B6B" />
                      )}
                      <Text
                        style={[
                          styles.callTime,
                          { color: theme.colors.onSurfaceVariant },
                        ]}
                      >
                        {displayTime}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Text
                        style={[
                          styles.callDuration,
                          { color: theme.colors.onSurfaceVariant },
                        ]}
                      >
                        Duration: {item.duration}
                      </Text>
                      {item.coins > 0 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 11 }}>•</Text>
                          <CoinIcon size={10} color="#FFD700" />
                          <Text style={[styles.callDuration, { color: theme.colors.onSurfaceVariant }]}>
                            {item.coins}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.reCallBtn}
                    onPress={() => router.push(`/call/${item.profileId}` as any)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="videocam" size={18} color="#FFF" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Animated.ScrollView>
    </View>

    <RechargeModal visible={rechargeVisible} onClose={() => setRechargeVisible(false)} />
    </SafeAreaView>
  </AppBackground>
</BlurTargetView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: 'rgba(18, 20, 20, 0.85)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: StitchTheme.colors.primaryContainer,
    letterSpacing: -0.6,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(246, 85, 146, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  coinEmoji: {
    fontSize: 14,
  },
  coinAmount: {
    color: StitchTheme.colors.goldCoin,
    fontWeight: '700',
    fontSize: 13,
  },
  glassCircleWrap: {
    borderRadius: 19,
    overflow: 'hidden',
  },
  glassCircleBtn: {
    width: 38,
    height: 38,
    backgroundColor: 'rgba(30, 32, 32, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarWrap: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  glassTabContainer: {
    flexDirection: 'row',
    borderRadius: 28,
    overflow: 'hidden',
    padding: 4,
    position: 'relative',
  },
  slidingSegmentPill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: 24,
    backgroundColor: StitchTheme.colors.surfaceVariant,
  },
  tabSegment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 24,
    zIndex: 2,
  },
  tabSegmentActive: {},
  tabSegmentText: {
    fontSize: 13,
    color: StitchTheme.colors.onSurfaceVariant,
    fontWeight: '600',
  },
  tabSegmentTextActive: {
    color: StitchTheme.colors.onSurface,
    fontWeight: '700',
  },
  screensContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
    gap: 12,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 32, 32, 0.35)',
    gap: 14,
  },
  avatarWrap: {
    position: 'relative',
  },
  storyRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    padding: 2,
  },
  storyRingActive: {
    backgroundColor: StitchTheme.colors.primaryContainer,
  },
  storyRingInactive: {
    backgroundColor: 'rgba(166, 137, 144, 0.2)',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 27,
  },
  onlineBadgeDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: StitchTheme.colors.liveGreen,
  },
  chatInfo: {
    flex: 1,
    gap: 3,
  },
  chatHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    fontSize: 16,
    fontWeight: '700',
    color: StitchTheme.colors.onSurface,
  },
  chatTime: {
    fontSize: 11,
    color: StitchTheme.colors.onSurfaceVariant,
  },
  chatPreview: {
    fontSize: 13,
  },
  unreadGlowDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: StitchTheme.colors.primaryContainer,
  },

  // Calls tab styles
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 32, 32, 0.35)',
    gap: 14,
  },
  callAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  callInfo: {
    flex: 1,
    gap: 3,
  },
  callName: {
    fontSize: 16,
    fontWeight: '700',
    color: StitchTheme.colors.onSurface,
  },
  callMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  callTime: {
    fontSize: 12,
    color: StitchTheme.colors.onSurfaceVariant,
  },
  callDuration: {
    fontSize: 11,
    color: StitchTheme.colors.secondary,
  },
  reCallBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: StitchTheme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topScrollFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 18,
    zIndex: 15,
  },
  bottomScrollFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 28,
    zIndex: 15,
  },
});
