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
import AppHeader from '../components/AppHeader';
import AppModal from '../components/AppModal';
import CoinIcon from '../components/CoinIcon';
import PaymentSelectorSheet from '../components/PaymentSelectorSheet';
import RechargeModal from '../components/RechargeModal';
import { useTheme } from '../context/ThemeContext';
import { VIP_WEEKLY_PACKAGE, PaymentPackage } from '../services/paymentService';
import { useWallet } from '../services/wallet';

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
    id: 'weekly-coins',
    ionIcon: 'trophy',
    title: 'Weekly Coin Grant',
    highlight: '1,500 Coins / Week',
    description: 'Instant 1,500 coins credited immediately upon activation and every week thereafter.',
    color: '#FFD700',
  },
  {
    id: 'video-discount',
    ionIcon: 'videocam',
    title: 'Video Call Discount',
    highlight: '50% OFF Calls',
    description: 'Enjoy a massive 50% coin rate discount on all 1-on-1 private simulated video calls.',
    color: '#F65592',
  },
  {
    id: 'free-chat',
    ionIcon: 'chatbubble-ellipses',
    title: 'Free Unlimited Chat',
    highlight: '100% Free',
    description: 'Send unlimited messages to all female companions without any coin deductions.',
    color: '#4ADE80',
  },
  {
    id: 'vip-status',
    ionIcon: 'ribbon',
    title: 'Elite Gold Badge',
    highlight: 'VIP Crown Halo',
    description: 'Distinctive gold crown halo on your profile and elite VIP status across the app.',
    color: '#FFB800',
  },
  {
    id: 'vip-outfit',
    ionIcon: 'shirt',
    title: 'Exclusive Wardrobe',
    highlight: 'Private Photos & Videos',
    description: 'Unlock exclusive glamour photo sets and video call scenes available only to VIPs.',
    color: '#E056FD',
  },
  {
    id: 'coin-bonus',
    ionIcon: 'flash',
    title: 'Extra Coin Bonus',
    highlight: '+30% Recharge Bonus',
    description: 'Get 30% additional bonus coins on every coin pack recharge in your wallet.',
    color: '#FFA500',
  },
];

export default function VipMembershipScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { coins, isVip } = useWallet();
  const { theme, isDark } = useTheme();

  const [paymentSheetVisible, setPaymentSheetVisible] = useState(false);
  const [rechargeVisible, setRechargeVisible] = useState(false);
  const [vipSuccessModal, setVipSuccessModal] = useState(false);

  const handleOpenVipPayment = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    setPaymentSheetVisible(true);
  };

  const handleVipSuccess = (pkg: PaymentPackage) => {
    setVipSuccessModal(true);
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        {/* Top Header */}
        <AppHeader
          title="VIP Club"
          showCoins={true}
          showBack={true}
        />

        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={[
              styles.content,
              { paddingBottom: Math.max(insets.bottom, 16) + 100 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* VIP Hero Card */}
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
                <Text style={styles.heroBadgeText}>DREAMDATE VIP CLUB</Text>
              </View>
              <Text style={styles.heroTitle}>Weekly VIP Membership</Text>
              <Text style={styles.heroSubtitle}>
                Unlock all female companions, 1,500 weekly coins, and 50% discount on video calls.
              </Text>

              {/* Weekly coins highlight box */}
              <LinearGradient
                colors={['rgba(255, 215, 0, 0.22)', 'rgba(255, 105, 180, 0.15)']}
                style={styles.weeklyCoinsBox}
              >
                <CoinIcon size={24} style={{ marginRight: 8 }} />
                <View>
                  <Text style={styles.weeklyCoinsTitle}>1,500 Coins Every Week</Text>
                  <Text style={styles.weeklyCoinsSub}>
                    Directly added to your offline wallet balance
                  </Text>
                </View>
              </LinearGradient>
            </LinearGradient>

            {/* Pricing Card */}
            <View
              style={[
                styles.planHighlightCard,
                {
                  backgroundColor: isDark ? 'rgba(30, 32, 32, 0.75)' : '#FFFFFF',
                  borderColor: '#F65592',
                },
              ]}
            >
              <View style={styles.planBadgeRow}>
                <View style={styles.popularBadge}>
                  <Ionicons name="flame" size={12} color="#FFFFFF" />
                  <Text style={styles.popularBadgeText}>LIMITED TIME OFFER</Text>
                </View>
                <Text style={styles.struckPrice}>₹999</Text>
              </View>

              <View style={styles.planPricingRow}>
                <View>
                  <Text style={[styles.planPeriodText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                    Weekly All-Access VIP
                  </Text>
                  <Text style={[styles.planPeriodSub, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                    7 Days Access + 1,500 Coins Included
                  </Text>
                </View>
                <View style={styles.netPriceWrap}>
                  <Text style={styles.netPriceAmount}>₹500</Text>
                  <Text style={styles.netPriceDuration}>/ week</Text>
                </View>
              </View>
            </View>

            {/* Section Title */}
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDark ? '#FFFFFF' : '#191C1D' },
                ]}
              >
                All VIP Member Privileges
              </Text>
              <Text style={styles.sectionCount}>6 Benefits</Text>
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
            onPress={handleOpenVipPayment}
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
                {isVip ? 'Renew Weekly VIP (₹500 / week)' : 'Unlock Weekly VIP (₹500 / week)'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Dual Payment Selector Sheet */}
        <PaymentSelectorSheet
          visible={paymentSheetVisible}
          packageItem={VIP_WEEKLY_PACKAGE}
          onClose={() => setPaymentSheetVisible(false)}
          onSuccess={handleVipSuccess}
        />

        {/* VIP Success Modal */}
        <AppModal
          visible={vipSuccessModal}
          useModalHost={false}
          onClose={() => setVipSuccessModal(false)}
          title="VIP Activated Successfully!"
          description="Congratulations! You are now a DreamDate VIP Member. 1,500 Coins have been added to your offline wallet and all VIP privileges are unlocked for the week."
          icon="ribbon"
          iconColor="#FFD700"
          primaryAction={{
            label: 'Enjoy VIP Access',
            onPress: () => {
              setVipSuccessModal(false);
              router.replace('/(tabs)');
            },
          }}
        />

        {/* Recharge Modal if needed */}
        <RechargeModal
          visible={rechargeVisible}
          onClose={() => setRechargeVisible(false)}
        />
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  heroCard: {
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
  },
  heroCrownCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  heroBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  heroBadgeText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  weeklyCoinsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
  },
  weeklyCoinsTitle: {
    color: '#FFD700',
    fontSize: 15,
    fontWeight: '800',
  },
  weeklyCoinsSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    marginTop: 2,
  },
  planHighlightCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 2,
    marginBottom: 20,
    shadowColor: '#F65592',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  planBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F65592',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  struckPrice: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    fontSize: 14,
    fontWeight: '600',
  },
  planPricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planPeriodText: {
    fontSize: 17,
    fontWeight: '800',
  },
  planPeriodSub: {
    fontSize: 12,
    marginTop: 2,
  },
  netPriceWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  netPriceAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: '#F65592',
  },
  netPriceDuration: {
    fontSize: 13,
    color: '#9CA3AF',
    marginLeft: 3,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  sectionCount: {
    fontSize: 12,
    color: '#F65592',
    fontWeight: '700',
  },
  perksList: {
    gap: 10,
  },
  perkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  perkIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkInfo: {
    flex: 1,
  },
  perkHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  perkTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  highlightBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  highlightText: {
    fontSize: 11,
    fontWeight: '700',
  },
  perkDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  buyBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#F65592',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  buyBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  buyBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
