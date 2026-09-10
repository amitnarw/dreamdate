import { Ionicons } from '@expo/vector-icons';
import { BlurTargetView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppBackground from '../../components/AppBackground';
import AppHeader from '../../components/AppHeader';
import AppModal from '../../components/AppModal';
import { useTabBlur } from '../../context/TabBlurContext';
import { useTheme } from '../../context/ThemeContext';
import { ARCHETYPE_META, CharacterArchetype, MOCK_PROFILES, Profile } from '../../data/mockProfiles';

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

      {/* Archetype Personality Badge (Top Right) */}
      {(() => {
        const meta = ARCHETYPE_META[item.archetype] || ARCHETYPE_META.playful_tease;
        return (
          <View
            style={[
              styles.cardArchetypeBadge,
              {
                borderColor: meta.badgeColor + '80',
              },
            ]}
          >
            <Text style={styles.cardArchetypeEmoji}>{meta.emoji}</Text>
            <Text style={styles.cardArchetypeText} numberOfLines={1}>
              {meta.label.split(' ')[0]}
            </Text>
          </View>
        );
      })()}

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
        {/* Top Button: Circular Chat Button */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            router.push(`/chat/${item.id.split('_p')[0]}` as any);
          }}
          style={[
            styles.actionCircleBlurBtn,
            {
              backgroundColor: isDark
                ? 'rgba(28, 18, 22, 0.85)'
                : '#FFFFFF',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.15)'
                : 'rgba(0, 0, 0, 0.10)',
            },
          ]}
          activeOpacity={0.8}
        >
          <Ionicons
            name="chatbubble-ellipses"
            size={16}
            color={isDark ? '#F65592' : '#E11D48'}
          />
        </TouchableOpacity>

        {/* Bottom Button: Circular Video Call Button */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            router.push(`/call/${item.id.split('_p')[0]}` as any);
          }}
          style={[
            styles.actionCircleBlurBtn,
            {
              backgroundColor: isDark
                ? 'rgba(28, 18, 22, 0.85)'
                : '#FFFFFF',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.15)'
                : 'rgba(0, 0, 0, 0.10)',
            },
          ]}
          activeOpacity={0.8}
        >
          <Ionicons
            name="videocam"
            size={16}
            color={isDark ? '#FFD700' : '#D97706'}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const FILTER_TABS: { key: 'all' | CharacterArchetype; label: string; emoji: string }[] = [
  { key: 'all', label: 'All', emoji: '✨' },
  { key: 'playful_tease', label: 'Playful', emoji: '😜' },
  { key: 'sweet_romantic', label: 'Romantic', emoji: '🌸' },
  { key: 'bold_alluring', label: 'Bold', emoji: '🔥' },
  { key: 'mysterious_sensual', label: 'Mysterious', emoji: '✨' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { targets, notifyTargetMounted } = useTabBlur();
  const [exitModalVisible, setExitModalVisible] = useState(false);

  // Endless Profile List State
  const [profilesList, setProfilesList] = useState<Profile[]>(MOCK_PROFILES);
  const [selectedFilter, setSelectedFilter] = useState<'all' | CharacterArchetype>('all');
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const filteredProfiles = React.useMemo(() => {
    if (selectedFilter === 'all') return profilesList;
    return profilesList.filter((p) => p.archetype === selectedFilter);
  }, [profilesList, selectedFilter]);

  useEffect(() => {
    notifyTargetMounted();
  }, []);

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
            data={filteredProfiles}
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

                {/* Personality Archetype Filter Chips */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterScroll}
                >
                  {FILTER_TABS.map((tab) => {
                    const isSelected = selectedFilter === tab.key;
                    return (
                      <TouchableOpacity
                        key={tab.key}
                        style={[
                          styles.filterChip,
                          isSelected && styles.filterChipActive,
                          {
                            backgroundColor: isSelected
                              ? '#F65592'
                              : isDark
                              ? 'rgba(255, 255, 255, 0.08)'
                              : 'rgba(0, 0, 0, 0.06)',
                            borderColor: isSelected
                              ? '#F65592'
                              : isDark
                              ? 'rgba(255, 255, 255, 0.10)'
                              : 'rgba(0, 0, 0, 0.08)',
                          },
                        ]}
                        onPress={() => setSelectedFilter(tab.key)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.filterEmoji}>{tab.emoji}</Text>
                        <Text
                          style={[
                            styles.filterLabel,
                            {
                              color: isSelected ? '#FFFFFF' : isDark ? '#E5E7EB' : '#374151',
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {tab.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            }
            ListFooterComponent={
              isLoadingMore ? (
                <View style={styles.loadingMoreWrap}>
                  <ActivityIndicator size="small" color="#F65592" />
                  <Text style={[styles.loadingMoreText, { color: isDark ? '#DFBEC6' : '#6B7280' }]}>
                    Discovering more female companions...
                  </Text>
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
    borderRadius: 18,
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
  cardArchetypeBadge: {
    position: 'absolute',
    top: 9,
    right: 9,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    gap: 3,
    zIndex: 10,
  },
  cardArchetypeEmoji: {
    fontSize: 10,
  },
  cardArchetypeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  filterScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    gap: 5,
  },
  filterChipActive: {
    shadowColor: '#F65592',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
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
  actionCircleBlurBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingMoreWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
