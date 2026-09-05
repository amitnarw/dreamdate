import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VIRTUAL_GIFTS, VirtualGift } from '../data/mockProfiles';
import { deductCoins, useWallet } from '../services/wallet';

interface Props {
  visible: boolean;
  onClose: () => void;
  onGiftSent: (gift: { name: string; icon: string; coins: number }) => void;
  onNeedRecharge: () => void;
}

const CATEGORIES: Array<VirtualGift['category']> = ['Popular', 'Romance', 'Luxury', 'VIP'];

const GIFT_GROUPS: Array<{
  category: VirtualGift['category'];
  label: string;
  badge: string;
}> = [
  { category: 'Popular', label: 'Popular Treats', badge: '🔥 Trending' },
  { category: 'Romance', label: 'Romance & Love', badge: '💖 Romantic' },
  { category: 'Luxury', label: 'Luxury & Glamour', badge: '💎 High Roller' },
  { category: 'VIP', label: 'Ultra VIP Exclusives', badge: '👑 VIP Only' },
];

export default function GiftModal({ visible, onClose, onGiftSent, onNeedRecharge }: Props) {
  const { coins } = useWallet();
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState<VirtualGift['category']>('Popular');
  const [selectedGift, setSelectedGift] = useState<VirtualGift>(VIRTUAL_GIFTS[0]);

  const scrollRef = React.useRef<ScrollView>(null);
  const groupPositions = React.useRef<{ [key: string]: number }>({}).current;

  const scrollToGroup = (cat: VirtualGift['category']) => {
    setActiveCategory(cat);
    const y = groupPositions[cat] ?? 0;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 6), animated: true });
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
  };

  const handleSelectGift = (gift: VirtualGift) => {
    setSelectedGift(gift);
    setActiveCategory(gift.category);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
  };

  const handleSendGift = async (giftToSend: VirtualGift) => {
    const success = await deductCoins(giftToSend.coins);
    if (!success) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch (e) {}
      Alert.alert(
        'Insufficient Coins! 🪙',
        `You need ${giftToSend.coins.toLocaleString()} coins to send ${giftToSend.name}. Would you like to recharge your wallet?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Recharge Now',
            onPress: () => {
              onClose();
              onNeedRecharge();
            },
          },
        ]
      );
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    onGiftSent(giftToSend);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetWrap}>
          <BlurView
            intensity={85}
            tint="dark"
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 10 }]}
          >
            {/* Header: Title + Coin Balance + Recharge Button */}
            <View style={styles.header}>
              <View style={styles.headerTitleCol}>
                <Text style={styles.title}>Send Virtual Gift 🎁</Text>
                <Text style={styles.subtitle}>Make her feel extra special</Text>
              </View>

              <View style={styles.headerRightRow}>
                {/* Balance Pill */}
                <TouchableOpacity
                  style={styles.balancePill}
                  onPress={() => {
                    onClose();
                    onNeedRecharge();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.balanceIcon}>🪙</Text>
                  <Text style={styles.balanceText}>{coins.toLocaleString()}</Text>
                  <View style={styles.addMiniBadge}>
                    <Ionicons name="add" size={12} color="#FFF" />
                  </View>
                </TouchableOpacity>

                {/* Close Button */}
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
                  <Ionicons name="close" size={20} color="#F1E0E4" />
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
                    style={[styles.categoryTab, isActive && styles.categoryTabActive]}
                    onPress={() => scrollToGroup(cat)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Single Scrollable List with All Gift Groups */}
            <ScrollView
              ref={scrollRef}
              style={styles.giftScroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
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
                      <Text style={styles.groupHeaderTitle}>{group.label}</Text>
                      <View style={styles.groupBadge}>
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
                            style={[styles.giftCard, isSelected && styles.giftCardSelected]}
                            onPress={() => handleSelectGift(gift)}
                            activeOpacity={0.85}
                          >
                            {/* Icon Container */}
                            <View style={styles.iconWrap}>
                              <Text style={styles.giftIcon}>{gift.icon}</Text>
                            </View>

                            {/* Gift Name */}
                            <Text style={styles.giftName} numberOfLines={1}>
                              {gift.name}
                            </Text>

                            {/* Price Pill */}
                            <View style={[styles.pricePill, isSelected && styles.pricePillSelected]}>
                              <Text style={styles.priceCoinIcon}>🪙</Text>
                              <Text style={styles.priceAmount}>{gift.coins.toLocaleString()}</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* Action Footer: Send Button for Selected Gift */}
            <View style={styles.footerRow}>
              <View style={styles.selectedGiftInfo}>
                <Text style={styles.selectedGiftLabel}>Selected Gift:</Text>
                <Text style={styles.selectedGiftName} numberOfLines={1}>
                  {selectedGift.icon} {selectedGift.name}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.sendBigBtn}
                onPress={() => handleSendGift(selectedGift)}
                activeOpacity={0.85}
              >
                <Ionicons name="sparkles" size={18} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.sendBigBtnText}>
                  Send ({selectedGift.coins.toLocaleString()} 🪙)
                </Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
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
  },
  sheet: {
    paddingHorizontal: 18,
    paddingTop: 18,
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
    backgroundColor: 'rgba(39, 29, 32, 0.7)',
    borderRadius: 16,
    padding: 3,
    marginBottom: 14,
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
    shadowColor: '#FF69B4',
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 3,
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
  giftScroll: {
    maxHeight: 360,
  },
  scrollContent: {
    paddingBottom: 14,
  },
  groupSection: {
    marginBottom: 20,
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
    color: '#F1E0E4',
    letterSpacing: 0.2,
  },
  groupBadge: {
    backgroundColor: 'rgba(255, 105, 180, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  groupBadgeText: {
    color: '#FF69B4',
    fontSize: 11,
    fontWeight: '700',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-start',
  },
  giftCard: {
    width: '31%',
    backgroundColor: 'rgba(39, 29, 32, 0.7)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
  },
  giftCardSelected: {
    backgroundColor: 'rgba(255, 105, 180, 0.22)',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 4,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  giftIcon: {
    fontSize: 28,
  },
  giftName: {
    color: '#F1E0E4',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  pricePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 14,
    elevation: 8,
  },
  sendBigBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
