import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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
import PaymentSelectorSheet from '../components/PaymentSelectorSheet';
import RechargeModal from '../components/RechargeModal';
import { useTheme } from '../context/ThemeContext';
import { VIP_WEEKLY_PACKAGE, PaymentPackage } from '../services/paymentService';
import { useWallet } from '../services/wallet';

interface VipPerk {
  id: string;
  ionIcon: any;
  title: string;
  description: string;
  color: string;
}

const VIP_PERKS: VipPerk[] = [
  {
    id: 'unlimited-photos',
    ionIcon: 'images',
    title: 'Unlimited image unlock',
    description: 'Instant free access to all private & blurred photos',
    color: '#38BDF8',
  },
  {
    id: 'weekly-coins',
    ionIcon: 'trophy',
    title: '1,500 coins every week',
    description: 'Credited automatically to your wallet',
    color: '#FFD700',
  },
  {
    id: 'video-discount',
    ionIcon: 'videocam',
    title: '50% off video calls',
    description: 'Half the coin rate on every private call',
    color: '#F65592',
  },
  {
    id: 'free-chat',
    ionIcon: 'chatbubble-ellipses',
    title: 'Unlimited free chat',
    description: 'Message every companion, no coin cost',
    color: '#4ADE80',
  },
  {
    id: 'vip-status',
    ionIcon: 'ribbon',
    title: 'Elite gold badge',
    description: 'Crown halo across the app',
    color: '#FFB800',
  },
  {
    id: 'vip-outfit',
    ionIcon: 'shirt',
    title: 'Exclusive wardrobe',
    description: 'Private photos and call scenes',
    color: '#E056FD',
  },
  {
    id: 'coin-bonus',
    ionIcon: 'flash',
    title: '+30% recharge bonus',
    description: 'On every coin pack purchase',
    color: '#FFA500',
  },
];

export default function VipMembershipScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isVip } = useWallet();
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

  const handleVipSuccess = (_pkg: PaymentPackage) => {
    setVipSuccessModal(true);
  };

  const text = isDark ? '#FFFFFF' : '#191C1D';
  const subtle = isDark ? 'rgba(241, 224, 228, 0.65)' : '#5A5F66';
  const dividerColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const panelFill = isDark ? 'rgba(30, 32, 32, 0.55)' : '#FFFFFF';

  return (
    <AppBackground>
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <AppHeader
          title="VIP Membership"
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
            {/* Header */}
            <View style={styles.headerBlock}>
              <View
                style={[
                  styles.crownBadge,
                  { backgroundColor: isDark ? 'rgba(255, 215, 0, 0.14)' : 'rgba(255, 215, 0, 0.12)' },
                ]}
              >
                <Ionicons name="ribbon" size={22} color="#FFD700" />
              </View>
              <Text style={[styles.title, { color: text }]}>BoloNa VIP</Text>
              <Text style={[styles.subtitle, { color: subtle }]}>
                Unlimited photos, free chat, weekly coins, and 50% off calls.
              </Text>
            </View>

            {/* Plan Card */}
            <View
              style={[
                styles.planCard,
                { backgroundColor: panelFill },
              ]}
            >
              <View style={styles.planTopRow}>
                <View>
                  <Text style={[styles.planName, { color: text }]}>
                    Weekly All-Access
                  </Text>
                  <Text style={[styles.planSub, { color: subtle }]}>
                    7 days · 1,500 coins included
                  </Text>
                </View>
                <View
                  style={[
                    styles.saveBadge,
                    { backgroundColor: isDark ? 'rgba(246, 85, 146, 0.22)' : 'rgba(246, 85, 146, 0.12)' },
                  ]}
                >
                  <Text style={styles.saveBadgeText}>SAVE 50%</Text>
                </View>
              </View>

              <View style={[styles.planDivider, { backgroundColor: dividerColor }]} />

              <View style={styles.priceRow}>
                <View style={styles.priceWrap}>
                  <Text style={[styles.struck, { color: subtle }]}>₹999</Text>
                  <Text style={[styles.price, { color: text }]}>
                    ₹499<Text style={[styles.priceUnit, { color: subtle }]}> / week</Text>
                  </Text>
                </View>
                <View style={styles.priceMeta}>
                  <Text style={[styles.priceMetaLabel, { color: subtle }]}>
                    RENEWABLE WEEKLY
                  </Text>
                </View>
              </View>
            </View>

            {/* Perks List */}
            <Text style={[styles.sectionLabel, { color: subtle }]}>
              WHAT'S INCLUDED
            </Text>

            <View
              style={[
                styles.perksList,
                { backgroundColor: panelFill },
              ]}
            >
              {VIP_PERKS.map((perk, idx) => (
                <React.Fragment key={perk.id}>
                  <View style={styles.perkRow}>
                    <View
                      style={[
                        styles.perkIcon,
                        { backgroundColor: perk.color + '22' },
                      ]}
                    >
                      <Ionicons name={perk.ionIcon} size={20} color={perk.color} />
                    </View>
                    <View style={styles.perkText}>
                      <Text style={[styles.perkTitle, { color: text }]}>
                        {perk.title}
                      </Text>
                      <Text style={[styles.perkDesc, { color: subtle }]}>
                        {perk.description}
                      </Text>
                    </View>
                  </View>
                  {idx < VIP_PERKS.length - 1 && (
                    <View style={[styles.perkDivider, { backgroundColor: dividerColor }]} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Bottom CTA */}
        <View
          style={[
            styles.bottomBar,
            { paddingBottom: Math.max(insets.bottom, 14) + 6 },
          ]}
        >
          <TouchableOpacity
            style={styles.buyBtn}
            onPress={handleOpenVipPayment}
            activeOpacity={0.88}
          >
            <Ionicons
              name={isVip ? 'refresh' : 'ribbon'}
              size={20}
              color="#FFF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.buyBtnText}>
              {isVip ? 'Renew VIP · ₹499 / week' : 'Unlock VIP · ₹499 / week'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Payment Selector Sheet */}
        <PaymentSelectorSheet
          visible={paymentSheetVisible}
          packageItem={VIP_WEEKLY_PACKAGE}
          onClose={() => setPaymentSheetVisible(false)}
          onSuccess={handleVipSuccess}
        />

        {/* Success Modal */}
        <AppModal
          visible={vipSuccessModal}
          useModalHost={false}
          onClose={() => setVipSuccessModal(false)}
          title="VIP Activated"
          description="1,500 coins added. Unlimited photo unlocks, free chat, and all VIP privileges are now live."
          icon="ribbon"
          iconColor="#FFD700"
          primaryAction={{
            label: 'Continue',
            onPress: () => {
              setVipSuccessModal(false);
              router.replace('/(tabs)');
            },
          }}
        />

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
    paddingTop: 8,
  },

  // Header block (no card)
  headerBlock: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  crownBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 20,
  },

  // Plan card
  planCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 28,
  },
  planTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  planName: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  planSub: {
    fontSize: 12,
    marginTop: 3,
  },
  saveBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  saveBadgeText: {
    color: '#F65592',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  planDivider: {
    height: 1,
    marginVertical: 14,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  struck: {
    fontSize: 14,
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  price: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  priceUnit: {
    fontSize: 13,
    fontWeight: '600',
  },
  priceMeta: {
    alignItems: 'flex-end',
  },
  priceMetaLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
    paddingHorizontal: 4,
  },

  // Perks list (single tonal panel)
  perksList: {
    borderRadius: 22,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  perkIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkText: {
    flex: 1,
  },
  perkTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  perkDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  perkDivider: {
    height: 1,
    marginLeft: 52,
  },

  // Bottom CTA
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  buyBtn: {
    backgroundColor: '#F65592',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  buyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
