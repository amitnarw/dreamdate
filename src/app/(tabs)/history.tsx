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
  Image,
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppBackground from '../../components/AppBackground';
import AppBlurView from '../../components/AppBlurView';
import AppHeader from '../../components/AppHeader';
import CoinIcon from '../../components/CoinIcon';
import RechargeModal from '../../components/RechargeModal';
import { StitchTheme } from '../../constants/theme';
import { useTabBlur } from '../../context/TabBlurContext';
import { useTheme } from '../../context/ThemeContext';
import { ARCHETYPE_META } from '../../data/mockProfiles';
import {
  CallLogItem,
  clearCallLogs,
  getLocalCallLogs,
} from '../../services/callHistoryService';
import {
  ChatThreadItem,
  getActiveChatThreads,
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
  const { coins } = useWallet();
  const [activeTab, setActiveTab] = useState<TabType>('chats');
  const [rechargeVisible, setRechargeVisible] = useState(false);
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
              <View style={{ width: SCREEN_WIDTH }}>
                {chatThreads.length === 0 ? (
                  <View style={styles.emptyContainer}>
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
                      const archetypeMeta = ARCHETYPE_META[item.archetype] || ARCHETYPE_META.playful_tease;
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
                          onPress={() => router.push(`/chat/${item.profileId}` as any)}
                          activeOpacity={0.8}
                        >
                          {/* Story Ring Avatar + Online Dot */}
                          <View style={styles.avatarWrap}>
                            <View
                              style={[
                                styles.storyRing,
                                item.unread ? styles.storyRingActive : styles.storyRingInactive,
                              ]}
                            >
                              <Image source={{ uri: item.avatar }} style={styles.avatarImg} />
                            </View>
                            <View style={styles.onlineBadgeDot} />
                          </View>

                          {/* Name, Archetype Tag, Time, Preview */}
                          <View style={styles.chatInfo}>
                            <View style={styles.chatHeaderRow}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text
                                  style={[
                                    styles.chatName,
                                    { color: isDark ? '#FFFFFF' : '#191C1D' },
                                  ]}
                                >
                                  {item.name.split(' ')[0]}
                                </Text>
                                <View style={[styles.chatArchetypeTag, { backgroundColor: archetypeMeta.badgeColor + '2A' }]}>
                                  <Text style={styles.chatArchetypeTagEmoji}>{archetypeMeta.emoji}</Text>
                                  <Text style={[styles.chatArchetypeTagLabel, { color: archetypeMeta.badgeColor }]}>
                                    {archetypeMeta.label.split(' ')[0]}
                                  </Text>
                                </View>
                              </View>
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
              <View style={{ width: SCREEN_WIDTH }}>
                {callLogs.length === 0 ? (
                  <View style={styles.emptyContainer}>
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
                            onPress={() => router.push(`/call/${item.profileId}` as any)}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
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
    borderRadius: 18,
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  storyRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyRingActive: {
    borderWidth: 2,
    borderColor: '#F65592',
  },
  storyRingInactive: {
    borderWidth: 0,
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  onlineBadgeDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#1E2020',
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
  chatArchetypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
    gap: 2,
  },
  chatArchetypeTagEmoji: {
    fontSize: 9,
  },
  chatArchetypeTagLabel: {
    fontSize: 9,
    fontWeight: '800',
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
    borderRadius: 18,
    gap: 12,
  },
  callAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
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
    shadowColor: '#F65592',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingTop: 80,
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
    shadowColor: '#F65592',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  emptyCTAText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
