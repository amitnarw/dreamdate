import { Ionicons } from '@expo/vector-icons';
import { BlurTargetView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AppBackground from '../../components/AppBackground';
import AppBlurView from '../../components/AppBlurView';
import AppHeader from '../../components/AppHeader';
import AppModal from '../../components/AppModal';
import CoinIcon from '../../components/CoinIcon';
import RechargeModal from '../../components/RechargeModal';
import SkeletonImage from '../../components/SkeletonImage';
import { MOCK_PROFILES } from '../../data/mockProfiles';
import { StitchTheme } from '../../constants/theme';
import { useTabBlur } from '../../context/TabBlurContext';
import { useTheme } from '../../context/ThemeContext';
import {
  CallLogItem,
  clearCallLogs,
  getLocalCallLogs,
} from '../../services/callHistoryService';
import {
  ChatThreadItem,
  getActiveChatThreads,
  markChatAsRead,
  subscribeNewMessages,
} from '../../services/chatEngine';
import { useWallet } from '../../services/wallet';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabType = 'chats' | 'calls';

function formatTimestampRelative(timestamp: number): string {
  const elapsedMs = Date.now() - timestamp;
  const minutesAgo = Math.floor(elapsedMs / (1000 * 60));

  if (minutesAgo <= 0) return 'Just now';
  if (minutesAgo < 60) return `${minutesAgo}m ago`;

  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function formatCallDuration(seconds: number): string {
  if (seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins < 10 ? '0' + mins : mins}:${secs < 10 ? '0' + secs : secs}`;
}

export default function MessageCenterHistory() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const emptyBottomPadding = Math.max(insets.bottom, 16) + 72;
  const { coins } = useWallet();
  const [activeTab, setActiveTab] = useState<TabType>('chats');
  const [rechargeVisible, setRechargeVisible] = useState(false);
  const [lowBalanceAlert, setLowBalanceAlert] = useState<{ visible: boolean; name: string; rate: number }>({ visible: false, name: '', rate: 0 });

  const handleCallPress = (profileId: string, name: string) => {
    const profile = MOCK_PROFILES.find((p) => p.id === profileId);
    const rate = profile?.callRate ?? 50;
    if (coins < rate) {
      setLowBalanceAlert({ visible: true, name, rate });
      return;
    }
    router.push(`/call/${profileId}` as any);
  };
  const [tabBarWidth, setTabBarWidth] = useState(SCREEN_WIDTH - 40);

  // Dynamic Real Storage State (Zero hardcoded fake logs)
  const [chatThreads, setChatThreads] = useState<ChatThreadItem[]>([]);
  const [callLogs, setCallLogs] = useState<CallLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Horizontal scroll tracking for swipeable tabs
  const scrollX = useRef(new Animated.Value(0)).current;
  const pagerRef = useRef<ScrollView>(null);

  const loadRealData = async () => {
    try {
      const [threads, logs] = await Promise.all([
        getActiveChatThreads(),
        getLocalCallLogs(),
      ]);
      setChatThreads(threads);
      setCallLogs(logs);
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRealData();
    }, [])
  );

  // Live-update: any girl-sent message delivered while history is open
  // triggers a re-read so the list reflects the new preview + unread state.
  useEffect(() => {
    const unsub = subscribeNewMessages((_profileId, msg) => {
      if (msg.sender !== "profile") return;
      loadRealData();
    });
    return unsub;
  }, []);

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
          {/* AppHeader */}
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
                  Chats {chatThreads.length > 0 ? `(${chatThreads.length})` : ''}
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
                  Video Calls {callLogs.length > 0 ? `(${callLogs.length})` : ''}
                </Text>
              </TouchableOpacity>
            </AppBlurView>
          </View>

          {/* Horizontal Swipeable Tabs Pager */}
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
              {/* Page 1: Real Chat Conversations */}
              <View style={{ width: SCREEN_WIDTH, height: '100%' }}>
                {chatThreads.length === 0 ? (
                  <View style={[styles.emptyContainer, { paddingBottom: emptyBottomPadding }]}>
                    <View style={styles.emptyIconCircle}>
                      <Ionicons name="chatbubble-ellipses-outline" size={42} color="#F65592" />
                    </View>
                    <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#191C1D' }]}>
                      No Conversations Yet
                    </Text>
                    <Text style={[styles.emptySub, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                      Explore beautiful companions and send your first message to start talking.
                    </Text>
                    <TouchableOpacity
                      style={styles.emptyCTA}
                      onPress={() => router.push('/(tabs)')}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.emptyCTAText}>Explore Companions</Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <FlatList
                    data={chatThreads}
                    keyExtractor={(item) => item.profileId}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => {
                      const displayTime = formatTimestampRelative(item.timestamp);
                      return (
                        <TouchableOpacity
                          style={[
                            styles.chatRow,
                            {
                              backgroundColor: isDark
                                ? 'rgba(30, 32, 32, 0.55)'
                                : '#FFFFFF',
                            },
                          ]}
                          onPress={() => {
                            markChatAsRead(item.profileId);
                            setChatThreads((prev) =>
                              prev.map((t) =>
                                t.profileId === item.profileId
                                  ? { ...t, unread: false }
                                  : t
                              )
                            );
                            router.push(`/chat/${item.profileId}` as any);
                          }}
                          activeOpacity={0.8}
                        >
                          {/* Story Ring Avatar + Online Dot */}
                          <View style={styles.avatarWrap}>
                            {item.unread ? (
                              <View style={styles.storyRingActive}>
                                <SkeletonImage uri={item.avatar} style={styles.avatarImg} recyclingKey={item.avatar} />
                              </View>
                            ) : (
                              <SkeletonImage uri={item.avatar} style={styles.avatarImgPlain} recyclingKey={item.avatar} />
                            )}
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
                                    color: item.unread
                                      ? '#F65592'
                                      : theme.colors.onSurfaceVariant,
                                    fontWeight: item.unread ? '700' : '400',
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
                                  color: item.unread
                                    ? isDark
                                      ? '#FFFFFF'
                                      : '#191C1D'
                                    : theme.colors.onSurfaceVariant,
                                  fontWeight: item.unread ? '600' : '400',
                                },
                              ]}
                              numberOfLines={1}
                            >
                              {item.lastMessage}
                            </Text>
                          </View>

                          {/* Pink Dot for Unread */}
                          {item.unread && <View style={styles.unreadGlowDot} />}
                        </TouchableOpacity>
                      );
                    }}
                  />
                )}
              </View>

              {/* Page 2: Real Video Calls Log */}
              <View style={{ width: SCREEN_WIDTH, height: '100%' }}>
                {callLogs.length === 0 ? (
                  <View style={[styles.emptyContainer, { paddingBottom: emptyBottomPadding }]}>
                    <View style={styles.emptyIconCircle}>
                      <Ionicons name="videocam-outline" size={42} color="#F65592" />
                    </View>
                    <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#191C1D' }]}>
                      No Call Records Yet
                    </Text>
                    <Text style={[styles.emptySub, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                      Your private 1-on-1 video calls with companions will appear securely here on your device.
                    </Text>
                    <TouchableOpacity
                      style={styles.emptyCTA}
                      onPress={() => router.push('/(tabs)')}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.emptyCTAText}>Make Your First Call</Text>
                      <Ionicons name="videocam" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <FlatList
                    data={callLogs}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => {
                      const displayTime = formatTimestampRelative(item.timestamp);
                      const durationStr = formatCallDuration(item.durationSeconds);
                      return (
                        <TouchableOpacity
                          style={[
                            styles.callRow,
                            {
                              backgroundColor: isDark
                                ? 'rgba(30, 32, 32, 0.55)'
                                : '#FFFFFF',
                            },
                          ]}
                          onPress={() => handleCallPress(item.profileId, item.name)}
                          activeOpacity={0.8}
                        >
                          <SkeletonImage uri={item.avatar} style={styles.callAvatar} recyclingKey={item.avatar} />

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
                                Duration: {durationStr}
                              </Text>
                              {item.coinsSpent > 0 && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                  <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 11 }}>•</Text>
                                  <CoinIcon size={10} color="#FFD700" />
                                  <Text style={[styles.callDuration, { color: theme.colors.onSurfaceVariant }]}>
                                    {item.coinsSpent}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>

                          <TouchableOpacity
                            style={styles.reCallBtn}
                            onPress={() => handleCallPress(item.profileId, item.name)}
                            activeOpacity={0.85}
                          >
                            <Ionicons name="videocam" size={18} color="#FFF" />
                          </TouchableOpacity>
                        </TouchableOpacity>
                      );
                    }}
                  />
                )}
              </View>
            </Animated.ScrollView>
          </View>

          <RechargeModal visible={rechargeVisible} onClose={() => setRechargeVisible(false)} />

          {/* Low Balance Alert */}
          <AppModal
            visible={lowBalanceAlert.visible}
            onClose={() => setLowBalanceAlert({ visible: false, name: '', rate: 0 })}
            title="Insufficient Coins"
            description={`${lowBalanceAlert.name}'s video call rate is ${lowBalanceAlert.rate} coins/min. You have ${coins} coins. Please recharge to call!`}
            icon="videocam-outline"
            primaryAction={{
              label: 'Recharge Now',
              onPress: () => {
                setLowBalanceAlert({ visible: false, name: '', rate: 0 });
                setRechargeVisible(true);
              },
            }}
            secondaryAction={{
              label: 'Cancel',
              onPress: () => setLowBalanceAlert({ visible: false, name: '', rate: 0 }),
            }}
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
  tabBarWrap: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  glassTabContainer: {
    flexDirection: 'row',
    height: 44,
    borderRadius: 22,
    padding: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  slidingSegmentPill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: 18,
  },
  tabSegment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  tabSegmentText: {
    fontSize: 14,
    letterSpacing: -0.2,
  },
  screensContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 110,
    gap: 8,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  storyRingActive: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F65592',
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarImgPlain: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineBadgeDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#0C0F10',
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
  },
  chatTime: {
    fontSize: 12,
  },
  chatPreview: {
    fontSize: 13,
  },
  unreadGlowDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#F65592',
  },
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    gap: 12,
  },
  callAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  callInfo: {
    flex: 1,
    gap: 3,
  },
  callName: {
    fontSize: 15,
    fontWeight: '700',
  },
  callMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  callTime: {
    fontSize: 12,
  },
  callDuration: {
    fontSize: 12,
  },
  reCallBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F65592',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(246, 85, 146, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F65592',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 22,
    gap: 8,
  },
  emptyCTAText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
