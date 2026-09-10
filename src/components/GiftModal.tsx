import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Dimensions,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AppModal from './AppModal';
import CoinIcon from './CoinIcon';
import { useTheme } from '../context/ThemeContext';
import { VIRTUAL_GIFTS, VirtualGift } from '../data/mockProfiles';
import { deductCoins, useWallet } from '../services/wallet';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// 3 columns: total horizontal padding is 36 (18 each side), 2 gaps of 8 each = 16
const CARD_WIDTH = Math.floor((SCREEN_WIDTH - 36 - 16) / 3);

interface Props {
  visible: boolean;
  onClose: () => void;
  onGiftSent: (gift: { name: string; icon: string; emoji?: string; coins: number; accentColor?: string }) => void;
  onNeedRecharge: () => void;
}

const CATEGORIES: Array<VirtualGift['category']> = ['Popular', 'Romantic', 'Luxury', 'VIP'];

const GIFT_GROUPS: Array<{
  category: VirtualGift['category'];
  label: string;
  badge: string;
  badgeIcon: keyof typeof Ionicons.glyphMap;
}> = [
  { category: 'Popular', label: 'Popular Treats', badge: 'Trending', badgeIcon: 'flame' },
  { category: 'Romantic', label: 'Romance & Love', badge: 'Romantic', badgeIcon: 'heart' },
  { category: 'Luxury', label: 'Luxury & Glamour', badge: 'High Roller', badgeIcon: 'diamond' },
  { category: 'VIP', label: 'Ultra VIP Exclusives', badge: 'VIP Only', badgeIcon: 'ribbon' },
];

export default function GiftModal({ visible, onClose, onGiftSent, onNeedRecharge }: Props) {
  const { coins } = useWallet();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const [activeCategory, setActiveCategory] = useState<VirtualGift['category']>('Popular');
  const [selectedGift, setSelectedGift] = useState<VirtualGift>(VIRTUAL_GIFTS[0]);
  const [insufficientModalVisible, setInsufficientModalVisible] = useState(false);
  const [pendingGift, setPendingGift] = useState<VirtualGift | null>(null);

  const scrollRef = React.useRef<ScrollView>(null);
  const groupPositions = React.useRef<{ [key: string]: number }>({}).current;
  const isProgrammaticScroll = React.useRef(false);

  const scrollToGroup = (cat: VirtualGift['category']) => {
    setActiveCategory(cat);
    isProgrammaticScroll.current = true;
    const y = groupPositions[cat] ?? 0;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 6), animated: true });
    setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 450);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isProgrammaticScroll.current) return;
    const scrollY = e.nativeEvent.contentOffset.y;
    let currentCat: VirtualGift['category'] = 'Popular';
    for (const group of GIFT_GROUPS) {
      const pos = groupPositions[group.category];
      if (pos !== undefined && scrollY >= pos - 30) {
        currentCat = group.category;
      }
    }
    if (currentCat !== activeCategory) {
      setActiveCategory(currentCat);
    }
  };

  const handleSelectGift = (gift: VirtualGift) => {
    setSelectedGift(gift);
    setActiveCategory(gift.category);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
  };

  const handleSendGift = async (giftToSend: VirtualGift) => {
    if (coins < giftToSend.coins) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch (e) {}
      setPendingGift(giftToSend);
      setInsufficientModalVisible(true);
      return;
    }

    const success = await deductCoins(giftToSend.coins);
    if (!success) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch (e) {}
      setPendingGift(giftToSend);
      setInsufficientModalVisible(true);
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    onGiftSent(giftToSend);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheetWrap,
            {
              backgroundColor: isDark
                ? 'rgba(24, 18, 20, 0.98)'
                : 'rgba(255, 255, 255, 0.98)',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        >
          <BlurView
            intensity={85}
            tint={isDark ? 'dark' : 'light'}
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 10 }]}
          >
            {/* Header: Title + Coin Balance + Recharge Button */}
            <View style={styles.header}>
              <View style={styles.headerTitleCol}>
                <Text
                  style={[
                    styles.title,
                    { color: isDark ? '#F1E0E4' : '#191C1D' },
                  ]}
                >
                  Send Virtual Gift
                </Text>
                <Text
                  style={[
                    styles.subtitle,
                    { color: isDark ? 'rgba(241, 224, 228, 0.65)' : '#6B7280' },
                  ]}
                >
                  Make her feel extra special
                </Text>
              </View>

              <View style={styles.headerRightRow}>
                {/* Balance Pill */}
                <TouchableOpacity
                  style={[
                    styles.balancePill,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 215, 0, 0.15)'
                        : 'rgba(245, 158, 11, 0.12)',
                    },
                  ]}
                  onPress={() => {
                    onClose();
                    setTimeout(() => {
                      onNeedRecharge();
                    }, 220);
                  }}
                  activeOpacity={0.8}
                >
                  <CoinIcon size={14} color={isDark ? '#FFD700' : '#D97706'} />
                  <Text
                    style={[
                      styles.balanceText,
                      { color: isDark ? '#FFD700' : '#D97706' },
                    ]}
                  >
                    {coins.toLocaleString()}
                  </Text>
                  <View style={styles.addMiniBadge}>
                    <Ionicons name="add" size={12} color="#FFF" />
                  </View>
                </TouchableOpacity>

                {/* Close Button */}
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
                  <Ionicons
                    name="close"
                    size={20}
                    color={isDark ? '#F1E0E4' : '#191C1D'}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Category Quick Jump Tabs */}
            <View style={styles.categoryTabsRow}>
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryTab,
                      {
                        backgroundColor: isActive
                          ? '#F65592'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.06)'
                          : 'rgba(0, 0, 0, 0.05)',
                      },
                    ]}
                    onPress={() => scrollToGroup(cat)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.categoryTabText,
                        {
                          color: isActive
                            ? '#FFFFFF'
                            : isDark
                            ? 'rgba(241, 224, 228, 0.7)'
                            : '#5A606B',
                          fontWeight: isActive ? '700' : '600',
                        },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Scrollable Container with Fixed Bounded Height */}
            <View style={styles.giftScrollWrapper}>
              <ScrollView
                ref={scrollRef}
                style={styles.giftScroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
                onScroll={handleScroll}
                scrollEventThrottle={16}
              >
                {GIFT_GROUPS.map((group) => {
                  const groupGifts = VIRTUAL_GIFTS.filter((g) => g.category === group.category);
                  return (
                    <View
                      key={group.category}
                      style={styles.groupSection}
                      onLayout={(e) => {
                        groupPositions[group.category] = e.nativeEvent.layout.y;
                      }}
                    >
                      {/* Group Header */}
                      <View style={styles.groupHeaderRow}>
                        <Text
                          style={[
                            styles.groupHeaderTitle,
                            { color: isDark ? '#F1E0E4' : '#191C1D' },
                          ]}
                        >
                          {group.label}
                        </Text>
                        <View style={styles.groupBadge}>
                          <Ionicons name={group.badgeIcon} size={11} color="#F65592" style={{ marginRight: 4 }} />
                          <Text style={styles.groupBadgeText}>{group.badge}</Text>
                        </View>
                      </View>

                      {/* Group Gifts Grid */}
                      <View style={styles.gridContainer}>
                        {groupGifts.map((gift) => {
                          const isSelected = selectedGift.id === gift.id;
                          return (
                            <TouchableOpacity
                              key={gift.id}
                              style={[
                                styles.giftCard,
                                {
                                  backgroundColor: isSelected
                                    ? isDark
                                      ? 'rgba(246, 85, 146, 0.22)'
                                      : 'rgba(246, 85, 146, 0.14)'
                                    : isDark
                                    ? 'rgba(39, 29, 32, 0.70)'
                                    : 'rgba(0, 0, 0, 0.04)',
                                },
                              ]}
                              onPress={() => handleSelectGift(gift)}
                              activeOpacity={0.85}
                            >
                              {/* Emoji Container */}
                              <View
                                style={[
                                  styles.iconWrap,
                                  {
                                    backgroundColor: isSelected
                                      ? `${gift.accentColor}40`
                                      : isDark
                                      ? 'rgba(255, 255, 255, 0.08)'
                                      : 'rgba(0, 0, 0, 0.05)',
                                  },
                                ]}
                              >
                                <Text style={{ fontSize: 28 }}>{gift.emoji}</Text>
                              </View>

                              {/* Gift Name */}
                              <Text
                                style={[
                                  styles.giftName,
                                  { color: isDark ? '#F1E0E4' : '#191C1D' },
                                ]}
                                numberOfLines={1}
                              >
                                {gift.name}
                              </Text>

                              {/* Price Pill */}
                              <View
                                style={[
                                  styles.pricePill,
                                  {
                                    backgroundColor: isSelected
                                      ? isDark
                                        ? 'rgba(246, 85, 146, 0.35)'
                                        : 'rgba(246, 85, 146, 0.20)'
                                      : isDark
                                      ? 'rgba(255, 255, 255, 0.08)'
                                      : 'rgba(0, 0, 0, 0.05)',
                                  },
                                ]}
                              >
                                <CoinIcon size={11} color={isDark ? '#FFD700' : '#D97706'} />
                                <Text style={[styles.priceAmount, { color: isDark ? '#FFD700' : '#D97706' }]}>
                                  {gift.coins.toLocaleString()}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>

            {/* Action Footer: Send Button for Selected Gift */}
            <View style={styles.footerRow}>
              <View style={styles.selectedGiftInfo}>
                <Text
                  style={[
                    styles.selectedGiftLabel,
                    { color: isDark ? 'rgba(241, 224, 228, 0.6)' : '#6B7280' },
                  ]}
                >
                  Selected Gift:
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 20 }}>{selectedGift.emoji}</Text>
                  <Text
                    style={[
                      styles.selectedGiftName,
                      { color: isDark ? '#F1E0E4' : '#191C1D' },
                    ]}
                    numberOfLines={1}
                  >
                    {selectedGift.name}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.sendBigBtn}
                onPress={() => handleSendGift(selectedGift)}
                activeOpacity={0.85}
              >
                <Ionicons name="gift" size={16} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.sendBigBtnText}>
                  Send ({selectedGift.coins.toLocaleString()} Coins)
                </Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>

        {/* In-Sheet Custom Modal for Insufficient Coins (no modal-on-modal conflict) */}
        <AppModal
          visible={insufficientModalVisible}
          useModalHost={false}
          onClose={() => setInsufficientModalVisible(false)}
          title="Insufficient Coins"
          description={`You have ${coins.toLocaleString()} coins, but ${pendingGift?.name || 'this gift'} costs ${pendingGift?.coins.toLocaleString() || ''} coins.\n\nRecharge your wallet to send this gift!`}
          icon="wallet-outline"
          iconColor="#FFD700"
          primaryAction={{
            label: 'Recharge Now',
            onPress: () => {
              setInsufficientModalVisible(false);
              onClose();
              setTimeout(() => {
                onNeedRecharge();
              }, 220);
            },
          }}
          secondaryAction={{
            label: 'Cancel',
            onPress: () => setInsufficientModalVisible(false),
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(26, 17, 20, 0.96)',
    width: '100%',
  },
  sheet: {
    paddingHorizontal: 18,
    paddingTop: 18,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitleCol: {
    gap: 2,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#F1E0E4',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(241, 224, 228, 0.65)',
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 18,
    gap: 5,
  },
  balanceIcon: {
    fontSize: 13,
  },
  balanceText: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '700',
  },
  addMiniBadge: {
    backgroundColor: '#FF69B4',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(61, 50, 53, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Category Tabs
  categoryTabsRow: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 3,
    marginBottom: 14,
    gap: 6,
  },
  categoryTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
  },
  categoryTabActive: {
    backgroundColor: '#FF69B4',
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(241, 224, 228, 0.7)',
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  // Gifts Single Scroll & Groups
  giftScrollWrapper: {
    height: Math.min(380, Math.floor(SCREEN_HEIGHT * 0.46)),
    width: '100%',
  },
  giftScroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 16,
    gap: 20,
  },
  groupSection: {
    gap: 10,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  groupHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  groupBadge: {
    backgroundColor: 'rgba(246, 85, 146, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupBadgeText: {
    color: '#F65592',
    fontSize: 11,
    fontWeight: '700',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
  },
  giftCard: {
    width: CARD_WIDTH,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  sheetTopFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 16,
    zIndex: 10,
  },
  sheetBottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    zIndex: 10,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  giftName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  pricePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
    marginTop: 2,
  },
  pricePillSelected: {
    backgroundColor: 'rgba(255, 105, 180, 0.4)',
  },
  priceCoinIcon: {
    fontSize: 10,
  },
  priceAmount: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '700',
  },
  // Footer Row
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    gap: 12,
  },
  selectedGiftInfo: {
    flex: 1,
    gap: 2,
  },
  selectedGiftLabel: {
    fontSize: 11,
    color: 'rgba(241, 224, 228, 0.6)',
  },
  selectedGiftName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F1E0E4',
  },
  sendBigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF69B4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 22,
  },
  sendBigBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
