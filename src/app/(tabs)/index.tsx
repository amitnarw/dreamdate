import { Ionicons } from '@expo/vector-icons';
import { BlurTargetView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import AppBlurView from '../../components/AppBlurView';
import {
  BackHandler,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ExitConfirmationModal from '../../components/ExitConfirmationModal';
import RechargeModal from '../../components/RechargeModal';
import { StitchTheme } from '../../constants/theme';
import { useTabBlur } from '../../context/TabBlurContext';
import { MOCK_PROFILES, Profile } from '../../data/mockProfiles';
import { useWallet } from '../../services/wallet';

function GridProfileCard({ item, index, router }: { item: Profile; index: number; router: any }) {
  const isBusy = index === 1;
  const [cardBlurKey, setCardBlurKey] = useState(0);

  const cardTargetRef = useMemo<React.RefObject<View | null>>(() => {
    let inner: View | null = null;
    return {
      get current() {
        return inner;
      },
      set current(node: View | null) {
        if (node && node !== inner) {
          inner = node;
          setCardBlurKey((k) => k + 1);
        } else if (!node) {
          inner = null;
        }
      },
    };
  }, []);

  return (
    <TouchableOpacity
      style={styles.gridCard}
      onPress={() => router.push(`/profile/${item.id}` as any)}
      activeOpacity={0.9}
    >
      <BlurTargetView ref={cardTargetRef} style={StyleSheet.absoluteFill}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#271D20' }]} />
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={StyleSheet.absoluteFill} />
        ) : null}
        <View style={styles.cardGradient} />
      </BlurTargetView>

      {/* Status Badge (Online / Busy) with centralized AppBlurView */}
      <View style={styles.statusBadgeWrap}>
        <AppBlurView
          key={`badge-blur-${cardBlurKey}`}
          blurTarget={cardTargetRef}
          style={styles.statusBadge}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: isBusy
                  ? StitchTheme.colors.surfaceVariant
                  : StitchTheme.colors.liveGreen,
              },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              isBusy && { color: StitchTheme.colors.onSurfaceVariant },
            ]}
          >
            {isBusy ? 'Busy' : 'Online'}
          </Text>
        </AppBlurView>
      </View>

      {/* Bottom Glass Panel (Details) with centralized AppBlurView */}
      <View style={styles.cardBottomWrap}>
        <AppBlurView
          key={`card-blur-${cardBlurKey}`}
          blurTarget={cardTargetRef}
          style={styles.cardGlassPanel}
        >
          <Text style={styles.cardName} numberOfLines={1}>
            {item.name.split(' ')[0]}, {item.age}
          </Text>
          <Text style={styles.cardCity} numberOfLines={1}>
            {item.city}
          </Text>

          {/* Chat & Video Call Quick Actions */}
          <View style={styles.cardActionsRow}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                router.push(`/chat/${item.id}` as any);
              }}
              style={styles.actionBtnIcon}
              activeOpacity={0.75}
            >
              <Ionicons
                name="chatbubble"
                size={15}
                color={StitchTheme.colors.primaryContainer}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                router.push(`/call/${item.id}` as any);
              }}
              style={styles.actionBtnIcon}
              activeOpacity={0.75}
            >
              <Ionicons
                name="videocam"
                size={16}
                color={StitchTheme.colors.primaryContainer}
              />
            </TouchableOpacity>
          </View>
        </AppBlurView>
      </View>
    </TouchableOpacity>
  );
}

export default function FollowingHomepageGrid() {
  const router = useRouter();
  const { coins } = useWallet();
  const { tabTargetRef } = useTabBlur();
  const [rechargeVisible, setRechargeVisible] = useState(false);
  const [exitModalVisible, setExitModalVisible] = useState(false);

  // When on homescreen and user presses back, show confirmation modal to close or not the app
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        setExitModalVisible(true);
        return true; // Prevent default app exit, show confirmation modal
      };

      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [])
  );

  return (
    <BlurTargetView ref={tabTargetRef} style={{ flex: 1, backgroundColor: '#1A1114' }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* TopAppBar 100% exact to Stitch with centralized AppBlurView */}
        <AppBlurView style={styles.header}>
        <View style={styles.brandRow}>
          <Ionicons name="heart" size={24} color={StitchTheme.colors.primaryContainer} />
          <Text style={styles.brandTitle}>DreamDate</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.coinPill}
            onPress={() => setRechargeVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.coinEmoji}>🪙</Text>
            <Text style={styles.coinAmount}>{coins}</Text>
          </TouchableOpacity>
        </View>
      </AppBlurView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Following / Discover Title Bar */}
        <View style={styles.titleRow}>
          <Text style={styles.headlineText}>Discover</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* Following Grid (1:1 Stitch Layout) */}
        <FlatList
          data={MOCK_PROFILES}
          keyExtractor={(item) => item.id}
          numColumns={2}
          scrollEnabled={false}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item, index }: { item: Profile; index: number }) => (
            <GridProfileCard item={item} index={index} router={router} />
          )}
        />
      </ScrollView>

      <RechargeModal visible={rechargeVisible} onClose={() => setRechargeVisible(false)} />

      <ExitConfirmationModal
        visible={exitModalVisible}
        onClose={() => setExitModalVisible(false)}
        onExit={() => BackHandler.exitApp()}
      />
    </SafeAreaView>
  </BlurTargetView>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1114', // Exact background color from detail screen (#1A1114)
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: 'rgba(26, 17, 20, 0.85)',
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 110,
    gap: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headlineText: {
    fontSize: 22,
    fontWeight: '700',
    color: StitchTheme.colors.onSurface,
    letterSpacing: -0.3,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: StitchTheme.colors.secondary,
  },
  storiesScroll: {
    gap: 16,
    paddingVertical: 6,
  },
  storyItem: {
    alignItems: 'center',
    gap: 6,
    width: 66,
  },
  storyRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyRingActive: {
    backgroundColor: StitchTheme.colors.primaryContainer,
    shadowColor: StitchTheme.colors.primaryContainer,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 4,
  },
  storyRingInactive: {
    backgroundColor: StitchTheme.colors.surfaceVariant,
  },
  storyImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  storyName: {
    fontSize: 12,
    fontWeight: '600',
    color: StitchTheme.colors.onSurface,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridCard: {
    width: '48%',
    height: 260,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#271D20',
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  statusBadgeWrap: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(28, 18, 22, 0.40)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: StitchTheme.colors.onSurface,
  },
  cardBottomWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  cardGlassPanel: {
    backgroundColor: 'rgba(28, 18, 22, 0.70)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: StitchTheme.colors.onSurface,
  },
  cardCity: {
    fontSize: 10,
    color: StitchTheme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionBtnIcon: {
    padding: 2,
  },
});
