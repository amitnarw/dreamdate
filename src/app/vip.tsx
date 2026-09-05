import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AppBlurView from '../components/AppBlurView';
import BackButton from '../components/BackButton';
import RechargeModal from '../components/RechargeModal';
import { StitchTheme } from '../constants/theme';
import { addCoins, deductCoins, useWallet } from '../services/wallet';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VipPerk {
  id: string;
  icon: string;
  ionIcon?: any;
  title: string;
  highlight: string;
  description: string;
  color: string;
}

const VIP_PERKS: VipPerk[] = [
  {
    id: 'monthly-coins',
    icon: '🪙',
    title: 'Coins Each Month',
    highlight: '2,500 🪙 / Month',
    description: 'Instant 2,500 coins credited immediately upon activation and every month thereafter.',
    color: '#FFD700',
  },
  {
    id: 'coin-bonus',
    icon: '⚡',
    title: 'Coin Bonus',
    highlight: '+20% Extra Coins',
    description: 'Receive 20% bonus coins on all coin pack recharges in your wallet forever.',
    color: '#FFA500',
  },
  {
    id: 'video-discount',
    icon: '📹',
    title: 'Video Call Discount',
    highlight: '30% OFF Calls',
    description: 'Enjoy a 30% coin rate discount on all 1-on-1 private video calls with companions.',
    color: '#F65592',
  },
  {
    id: 'free-chat',
    icon: '💬',
    title: 'Free Text Chat',
    highlight: '100% Unlimited',
    description: 'Send unlimited text messages and media to all companions without coin deductions.',
    color: '#4ADE80',
  },
  {
    id: 'vip-status',
    icon: '👑',
    title: 'Exclusive VIP Status',
    highlight: 'Gold Crown Badge',
    description: 'Distinctive gold crown halo on your profile, priority queue, and VIP badge in chat.',
    color: '#FFB800',
  },
  {
    id: 'vip-outfit',
    icon: '👗',
    title: 'Exclusive VIP Outfit',
    highlight: 'Private Glamour Wardrobe',
    description: 'Unlock exclusive model photo sets and video call glamour outfits available only to VIPs.',
    color: '#E056FD',
  },
];

export default function VipMembershipScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { coins } = useWallet();
  const [selectedPlan, setSelectedPlan] = useState<'1mo' | '3mo'>('1mo');
  const [rechargeVisible, setRechargeVisible] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const planCost = selectedPlan === '1mo' ? 1499 : 3699;

  const handleBuyVip = async () => {
    if (coins < planCost) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch (e) {}
      Alert.alert(
        'Insufficient Coins! 🪙',
        `You need ${planCost.toLocaleString()} coins to unlock VIP Membership. Would you like to recharge?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Recharge Now',
            onPress: () => setRechargeVisible(true),
          },
        ]
      );
      return;
    }

    setIsPurchasing(true);
    const success = await deductCoins(planCost);
    if (success) {
      // Award monthly 2,500 VIP bonus coins immediately
      await addCoins(2500);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}

      Alert.alert(
        '👑 Welcome to VIP Elite!',
        `Congratulations! You have unlocked VIP Membership.\n\n✨ 2,500 VIP Monthly Bonus Coins have been credited to your wallet!`,
        [{ text: 'Awesome!', onPress: () => router.back() }]
      );
    }
    setIsPurchasing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <AppBlurView style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>VIP Explorer</Text>
        <TouchableOpacity
          style={styles.coinPill}
          onPress={() => setRechargeVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.coinEmoji}>🪙</Text>
          <Text style={styles.coinAmount}>{coins.toLocaleString()}</Text>
        </TouchableOpacity>
      </AppBlurView>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* VIP Hero Golden Card */}
        <LinearGradient
          colors={['#2E1D24', '#3E1928', '#26131C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroCrownCircle}>
            <Text style={{ fontSize: 36 }}>👑</Text>
          </View>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>DREAMDATE VIP PASS</Text>
          </View>
          <Text style={styles.heroTitle}>Elite VIP Explorer</Text>
          <Text style={styles.heroSubtitle}>
            Unlock premium companion privileges, video discounts, and monthly coin grants.
          </Text>

          {/* Monthly coins highlight box */}
          <LinearGradient
            colors={['rgba(255, 215, 0, 0.22)', 'rgba(255, 105, 180, 0.15)']}
            style={styles.monthlyCoinsBox}
          >
            <Text style={styles.monthlyCoinIcon}>🪙</Text>
            <View>
              <Text style={styles.monthlyCoinsTitle}>2,500 Coins Every Month</Text>
              <Text style={styles.monthlyCoinsSub}>Automatically credited to your balance</Text>
            </View>
          </LinearGradient>
        </LinearGradient>

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>All VIP Perks & Benefits</Text>
          <Text style={styles.sectionCount}>6 Privileges</Text>
        </View>

        {/* Perks List */}
        <View style={styles.perksList}>
          {VIP_PERKS.map((perk) => (
            <View key={perk.id} style={styles.perkCard}>
              <View style={[styles.perkIconWrap, { backgroundColor: `${perk.color}18` }]}>
                <Text style={styles.perkIconText}>{perk.icon}</Text>
              </View>
              <View style={styles.perkInfo}>
                <View style={styles.perkHeaderRow}>
                  <Text style={styles.perkTitle}>{perk.title}</Text>
                  <View style={[styles.highlightBadge, { backgroundColor: `${perk.color}25` }]}>
                    <Text style={[styles.highlightText, { color: perk.color }]}>
                      {perk.highlight}
                    </Text>
                  </View>
                </View>
                <Text style={styles.perkDescription}>{perk.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Plan Selectors */}
        <View style={styles.planSelectRow}>
          <TouchableOpacity
            style={[styles.planCard, selectedPlan === '1mo' && styles.planCardActive]}
            onPress={() => {
              setSelectedPlan('1mo');
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch (e) {}
            }}
            activeOpacity={0.85}
          >
            {selectedPlan === '1mo' && <View style={styles.planActiveGlow} />}
            <Text style={styles.planDuration}>1 Month</Text>
            <Text style={styles.planPrice}>1,499 🪙</Text>
            <Text style={styles.planPerMonth}>+ 2,500 Free Coins</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.planCard, selectedPlan === '3mo' && styles.planCardActive]}
            onPress={() => {
              setSelectedPlan('3mo');
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch (e) {}
            }}
            activeOpacity={0.85}
          >
            <View style={styles.saveTag}>
              <Text style={styles.saveTagText}>POPULAR • 20% OFF</Text>
            </View>
            {selectedPlan === '3mo' && <View style={styles.planActiveGlow} />}
            <Text style={styles.planDuration}>3 Months</Text>
            <Text style={styles.planPrice}>3,699 🪙</Text>
            <Text style={styles.planPerMonth}>+ 7,500 Free Coins</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Bottom Purchase Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) + 6 }]}>
        <TouchableOpacity
          style={styles.buyBtn}
          onPress={handleBuyVip}
          disabled={isPurchasing}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#FF2A7A', '#FF69B4', '#FF416C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buyBtnGradient}
          >
            <Ionicons name="sparkles" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.buyBtnText}>
              Unlock VIP Explorer ({planCost.toLocaleString()} 🪙)
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <RechargeModal visible={rechargeVisible} onClose={() => setRechargeVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C0F10',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(26, 17, 20, 0.85)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.2,
  },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 5,
  },
  coinEmoji: {
    fontSize: 13,
  },
  coinAmount: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#FF69B4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  heroCrownCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 215, 0, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  heroBadgeText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  heroSubtitle: {
    color: 'rgba(241, 224, 228, 0.75)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  monthlyCoinsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
  },
  monthlyCoinIcon: {
    fontSize: 28,
  },
  monthlyCoinsTitle: {
    color: '#FFD700',
    fontSize: 15,
    fontWeight: '800',
  },
  monthlyCoinsSub: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionCount: {
    color: StitchTheme.colors.primaryContainer,
    fontSize: 12,
    fontWeight: '700',
  },
  perksList: {
    gap: 10,
  },
  perkCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(28, 18, 22, 0.75)',
    borderRadius: 18,
    padding: 14,
    gap: 12,
  },
  perkIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkIconText: {
    fontSize: 22,
  },
  perkInfo: {
    flex: 1,
    gap: 4,
  },
  perkHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  perkTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  highlightBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  highlightText: {
    fontSize: 10,
    fontWeight: '800',
  },
  perkDescription: {
    color: 'rgba(241, 224, 228, 0.65)',
    fontSize: 12,
    lineHeight: 16,
  },
  planSelectRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  planCard: {
    flex: 1,
    backgroundColor: 'rgba(28, 18, 22, 0.75)',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    gap: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  planCardActive: {
    backgroundColor: 'rgba(246, 85, 146, 0.16)',
    shadowColor: '#F65592',
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 4,
  },
  planActiveGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#F65592',
  },
  saveTag: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#F65592',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderBottomLeftRadius: 10,
  },
  saveTagText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  planDuration: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  planPrice: {
    color: '#FFD700',
    fontSize: 17,
    fontWeight: '800',
  },
  planPerMonth: {
    color: 'rgba(241, 224, 228, 0.65)',
    fontSize: 11,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: 'rgba(12, 15, 16, 0.92)',
  },
  buyBtn: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  buyBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  buyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
