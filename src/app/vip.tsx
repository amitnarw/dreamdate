import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AppBackground from '../components/AppBackground';
import AppBlurView from '../components/AppBlurView';
import AppHeader from '../components/AppHeader';
import AppModal from '../components/AppModal';
import CoinIcon from '../components/CoinIcon';
import RechargeModal from '../components/RechargeModal';
import { useTheme } from '../context/ThemeContext';
import { addCoins, deductCoins, useWallet } from '../services/wallet';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VipPerk {
  id: string;
  ionIcon: any;
  title: string;
  highlight: string;
  description: string;
  color: string;
}

const VIP_PERKS: VipPerk[] = [
  {
    id: 'monthly-coins',
    ionIcon: 'trophy',
    title: 'Coins Each Month',
    highlight: '2,500 Coins / Month',
    description: 'Instant 2,500 coins credited immediately upon activation and every month thereafter.',
    color: '#FFD700',
  },
  {
    id: 'coin-bonus',
    ionIcon: 'flash',
    title: 'Coin Bonus',
    highlight: '+20% Extra Coins',
    description: 'Receive 20% bonus coins on all coin pack recharges in your wallet forever.',
    color: '#FFA500',
  },
  {
    id: 'video-discount',
    ionIcon: 'videocam',
    title: 'Video Call Discount',
    highlight: '30% OFF Calls',
    description: 'Enjoy a 30% coin rate discount on all 1-on-1 private video calls with companions.',
    color: '#F65592',
  },
  {
    id: 'free-chat',
    ionIcon: 'chatbubble-ellipses',
    title: 'Free Text Chat',
    highlight: '100% Unlimited',
    description: 'Send unlimited text messages and media to all companions without coin deductions.',
    color: '#4ADE80',
  },
  {
    id: 'vip-status',
    ionIcon: 'ribbon',
    title: 'Exclusive VIP Status',
    highlight: 'Gold Elite Badge',
    description: 'Distinctive gold crown halo on your profile, priority queue, and VIP badge in chat.',
    color: '#FFB800',
  },
  {
    id: 'vip-outfit',
    ionIcon: 'shirt',
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
  const { theme, isDark } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<'1mo' | '3mo'>('1mo');
  const [rechargeVisible, setRechargeVisible] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [insufficientModal, setInsufficientModal] = useState(false);
  const [vipSuccessModal, setVipSuccessModal] = useState(false);
  const [purchaseErrorModal, setPurchaseErrorModal] = useState<string | null>(null);

  const planCost = selectedPlan === '1mo' ? 1499 : 3699;

  const handleBuyVip = async () => {
    if (coins < planCost) {
      setInsufficientModal(true);
      return;
    }

    try {
      setIsPurchasing(true);
      const success = await deductCoins(planCost);
      if (success) {
        // Also grant monthly bonus immediately
        const bonusCoins = selectedPlan === '1mo' ? 2500 : 7500;
        await addCoins(bonusCoins);
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {}
        setVipSuccessModal(true);
      } else {
        setInsufficientModal(true);
      }
    } catch (err) {
      setPurchaseErrorModal('Unable to complete VIP subscription. Please verify your coin balance and try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        {/* Top Header with Back Button */}
        <AppHeader
          title="VIP Explorer"
          showCoins={true}
          showBack={true}
        />

        <View style={{ flex: 1 }}>
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
              <Ionicons name="ribbon" size={36} color="#FFD700" />
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
              <CoinIcon size={24} style={{ marginRight: 8 }} />
              <View>
                <Text style={styles.monthlyCoinsTitle}>2,500 Coins Every Month</Text>
                <Text style={styles.monthlyCoinsSub}>Automatically credited to your balance</Text>
              </View>
            </LinearGradient>
          </LinearGradient>

          {/* Section Title */}
          <View style={styles.sectionHeader}>
            <Text
              style={[
                styles.sectionTitle,
                { color: isDark ? '#FFFFFF' : '#191C1D' },
              ]}
            >
              All VIP Perks & Benefits
            </Text>
            <Text style={styles.sectionCount}>6 Privileges</Text>
          </View>

          {/* Perks List */}
          <View style={styles.perksList}>
            {VIP_PERKS.map((perk) => (
              <View
                key={perk.id}
                style={[
                  styles.perkCard,
                  {
                    backgroundColor: isDark
                      ? 'rgba(28, 18, 22, 0.75)'
                      : '#FFFFFF',
                    borderColor: isDark
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.06)',
                    borderWidth: 1,
                  },
                ]}
              >
                <View style={[styles.perkIconWrap, { backgroundColor: `${perk.color}18` }]}>
                  <Ionicons name={perk.ionIcon} size={22} color={perk.color} />
                </View>
                <View style={styles.perkInfo}>
                  <View style={styles.perkHeaderRow}>
                    <Text
                      style={[
                        styles.perkTitle,
                        { color: isDark ? '#FFFFFF' : '#191C1D' },
                      ]}
                    >
                      {perk.title}
                    </Text>
                    <View style={[styles.highlightBadge, { backgroundColor: `${perk.color}25` }]}>
                      <Text style={[styles.highlightText, { color: perk.color }]}>
                        {perk.highlight}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.perkDescription,
                      { color: isDark ? 'rgba(241, 224, 228, 0.65)' : '#5A5F66' },
                    ]}
                  >
                    {perk.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Plan Selectors */}
          <View style={styles.planSelectRow}>
            <TouchableOpacity
              style={[
                styles.planCard,
                {
                  backgroundColor: isDark
                    ? 'rgba(30, 32, 32, 0.65)'
                    : '#FFFFFF',
                  borderColor: selectedPlan === '1mo'
                    ? '#F65592'
                    : isDark
                    ? 'rgba(166, 137, 144, 0.2)'
                    : 'rgba(0, 0, 0, 0.08)',
                },
                selectedPlan === '1mo' && styles.planCardActive,
              ]}
              onPress={() => {
                setSelectedPlan('1mo');
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch (e) {}
              }}
              activeOpacity={0.85}
            >
              {selectedPlan === '1mo' && <View style={styles.planActiveGlow} />}
              <Text
                style={[
                  styles.planDuration,
                  { color: isDark ? '#FFFFFF' : '#191C1D' },
                ]}
              >
                1 Month
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginVertical: 3 }}>
                <CoinIcon size={14} color={isDark ? '#FFD700' : '#D97706'} />
                <Text style={[styles.planPrice, { color: isDark ? '#FFD700' : '#D97706' }]}>1,499 Coins</Text>
              </View>
              <Text style={[styles.planPerMonth, { color: isDark ? 'rgba(241, 224, 228, 0.70)' : '#6B7280' }]}>+ 2,500 Free Coins</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.planCard,
                {
                  backgroundColor: isDark
                    ? 'rgba(30, 32, 32, 0.65)'
                    : selectedPlan === '3mo'
                    ? 'rgba(246, 85, 146, 0.10)'
                    : '#FFFFFF',
                  borderColor: selectedPlan === '3mo'
                    ? '#F65592'
                    : isDark
                    ? 'rgba(166, 137, 144, 0.2)'
                    : 'rgba(0, 0, 0, 0.08)',
                },
                selectedPlan === '3mo' && styles.planCardActive,
              ]}
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
              <Text
                style={[
                  styles.planDuration,
                  { color: isDark ? '#FFFFFF' : '#191C1D' },
                ]}
              >
                3 Months
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginVertical: 3 }}>
                <CoinIcon size={14} color={isDark ? '#FFD700' : '#D97706'} />
                <Text style={[styles.planPrice, { color: isDark ? '#FFD700' : '#D97706' }]}>3,699 Coins</Text>
              </View>
              <Text style={[styles.planPerMonth, { color: isDark ? 'rgba(241, 224, 228, 0.70)' : '#6B7280' }]}>+ 7,500 Free Coins</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

        {/* Floating Bottom Purchase Bar */}
        <View
          style={[
            styles.bottomBar,
            {
              paddingBottom: Math.max(insets.bottom, 14) + 6,
              backgroundColor: 'transparent',
              borderTopWidth: 0,
            },
          ]}
        >
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
              <Ionicons name="ribbon" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.buyBtnText}>
                Unlock VIP Explorer ({planCost.toLocaleString()} Coins)
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <RechargeModal visible={rechargeVisible} onClose={() => setRechargeVisible(false)} />

        {/* Insufficient Coins Modal */}
        <AppModal
          visible={insufficientModal}
          onClose={() => setInsufficientModal(false)}
          title="Insufficient Coins"
          description={`You need ${planCost.toLocaleString()} coins to unlock VIP Membership. Would you like to recharge now?`}
          icon="wallet"
          iconColor="#F65592"
          primaryAction={{
            label: 'Recharge Now',
            onPress: () => {
              setInsufficientModal(false);
              setRechargeVisible(true);
            },
          }}
          secondaryAction={{
            label: 'Cancel',
            onPress: () => setInsufficientModal(false),
          }}
        />

        {/* VIP Welcome Modal */}
        <AppModal
          visible={vipSuccessModal}
          onClose={() => {
            setVipSuccessModal(false);
            router.back();
          }}
          title="Welcome to VIP Elite!"
          description="Congratulations! You have unlocked VIP Membership. 2,500 VIP Monthly Bonus Coins have been credited to your wallet!"
          icon="diamond"
          iconColor="#F65592"
          primaryAction={{
            label: 'Continue',
            onPress: () => {
              setVipSuccessModal(false);
              router.back();
            },
          }}
        />

        {/* Purchase Error / Notice Modal */}
        <AppModal
          visible={purchaseErrorModal !== null}
          onClose={() => setPurchaseErrorModal(null)}
          title="Subscription Notice"
          description={purchaseErrorModal || ''}
          icon="alert-circle-outline"
          iconColor="#F65592"
          primaryAction={{
            label: 'OK',
            onPress: () => setPurchaseErrorModal(null),
          }}
        />
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    color: '#F65592',
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
    backgroundColor: 'transparent',
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
  topScrollFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 20,
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
