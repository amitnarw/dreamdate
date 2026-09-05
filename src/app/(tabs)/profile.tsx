import { Ionicons } from '@expo/vector-icons';
import { BlurTargetView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import AppBlurView from '../../components/AppBlurView';
import DailyCheckInModal from '../../components/DailyCheckInModal';
import RechargeModal from '../../components/RechargeModal';
import { StitchTheme } from '../../constants/theme';
import { useTabBlur } from '../../context/TabBlurContext';
import { useWallet } from '../../services/wallet';

export default function UserProfileTab() {
  const router = useRouter();
  const { coins } = useWallet();
  const { tabTargetRef } = useTabBlur();
  const [rechargeVisible, setRechargeVisible] = useState(false);
  const [checkInVisible, setCheckInVisible] = useState(false);
  const [policyModal, setPolicyModal] = useState<'agreement' | 'privacy' | null>(null);
  const [rateModalVisible, setRateModalVisible] = useState(false);
  const [userRating, setUserRating] = useState(5);

  const handleRateSubmit = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
    setRateModalVisible(false);
    Alert.alert(
      'Thank You! ⭐',
      `You rated DreamDate ${userRating} stars! Your feedback helps us make companion talks even more magical.`,
      [{ text: 'Close' }]
    );
  };

  const handleLogout = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) {}
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of your DreamDate account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch (e) {}
            Alert.alert('Logged Out', 'You have been logged out.');
          },
        },
      ]
    );
  };

  return (
    <BlurTargetView ref={tabTargetRef} style={{ flex: 1, backgroundColor: '#1A1114' }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Top Header */}
        <AppBlurView style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
        </AppBlurView>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* User Card */}
          <TouchableOpacity
            style={styles.userCard}
            onPress={() => router.push('/vip' as any)}
            activeOpacity={0.85}
          >
            <View style={styles.userAvatarWrap}>
              <Text style={{ fontSize: 32 }}>👑</Text>
            </View>
            <View style={styles.userInfo}>
              <View style={styles.userNameRow}>
                <Text style={styles.userName}>VIP Explorer</Text>
                <View style={styles.vipTag}>
                  <Text style={styles.vipTagText}>VIP ELITE</Text>
                </View>
              </View>
              <Text style={styles.userId}>ID: DD-782910</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#F65592" />
          </TouchableOpacity>

          {/* Coin Balance Card */}
          <LinearGradient
            colors={['#2D1C24', '#3A1E2B', '#26141D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <View style={styles.balanceLeft}>
              <Text style={styles.balanceTitle}>Available Balance</Text>
              <View style={styles.coinDisplayRow}>
                <Text style={styles.coinBigIcon}>🪙</Text>
                <Text style={styles.coinBigAmount}>{coins.toLocaleString()}</Text>
                <Text style={styles.coinUnit}>Coins</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.rechargeBtn}
              onPress={() => setRechargeVisible(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle" size={18} color="#FFF" />
              <Text style={styles.rechargeBtnText}>Recharge</Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* Quick Dual Highlight Cards: Daily Check-in & VIP Explorer */}
          <View style={styles.dualCardsRow}>
            {/* Daily Check-In Card */}
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => {
                setCheckInVisible(true);
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch (e) {}
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.featureIconWrap, { backgroundColor: 'rgba(246, 85, 146, 0.18)' }]}>
                <Text style={{ fontSize: 24 }}>🎁</Text>
              </View>
              <View style={styles.featureCardContent}>
                <Text style={styles.featureCardTitle}>Daily Check-In</Text>
                <Text style={styles.featureCardSub}>Up to +500 🪙 free</Text>
              </View>
              <View style={styles.featureCardBadge}>
                <Text style={styles.featureCardBadgeText}>CLAIM</Text>
              </View>
            </TouchableOpacity>

            {/* VIP Membership Card */}
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => {
                router.push('/vip' as any);
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch (e) {}
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.featureIconWrap, { backgroundColor: 'rgba(255, 215, 0, 0.18)' }]}>
                <Text style={{ fontSize: 24 }}>👑</Text>
              </View>
              <View style={styles.featureCardContent}>
                <Text style={styles.featureCardTitle}>VIP Explorer</Text>
                <Text style={styles.featureCardSub}>6 Elite Privileges</Text>
              </View>
              <View style={[styles.featureCardBadge, { backgroundColor: 'rgba(255, 215, 0, 0.22)' }]}>
                <Text style={[styles.featureCardBadgeText, { color: '#FFD700' }]}>EXPLORE</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Section: Rewards & Privileges */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeaderTitle}>Privileges & Rewards</Text>
            <View style={styles.menuGroup}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/vip' as any)}
                activeOpacity={0.75}
              >
                <View style={[styles.menuIconBox, { backgroundColor: 'rgba(255, 215, 0, 0.15)' }]}>
                  <Ionicons name="diamond" size={18} color="#FFD700" />
                </View>
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemTitle}>VIP Explorer Privileges</Text>
                  <Text style={styles.menuItemSub}>Monthly coins, video discounts & outfits</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(241, 224, 228, 0.4)" />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setCheckInVisible(true)}
                activeOpacity={0.75}
              >
                <View style={[styles.menuIconBox, { backgroundColor: 'rgba(246, 85, 146, 0.15)' }]}>
                  <Ionicons name="calendar" size={18} color="#F65592" />
                </View>
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemTitle}>7-Day Daily Streak Rewards</Text>
                  <Text style={styles.menuItemSub}>Check in every day to earn more coins</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(241, 224, 228, 0.4)" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Section: General & Legal */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeaderTitle}>App & Support</Text>
            <View style={styles.menuGroup}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setRateModalVisible(true)}
                activeOpacity={0.75}
              >
                <View style={[styles.menuIconBox, { backgroundColor: 'rgba(255, 184, 0, 0.15)' }]}>
                  <Ionicons name="star" size={18} color="#FFB800" />
                </View>
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemTitle}>Rate Us</Text>
                  <Text style={styles.menuItemSub}>Share your experience on App Store</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(241, 224, 228, 0.4)" />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setPolicyModal('agreement')}
                activeOpacity={0.75}
              >
                <View style={[styles.menuIconBox, { backgroundColor: 'rgba(74, 222, 128, 0.15)' }]}>
                  <Ionicons name="document-text" size={18} color="#4ADE80" />
                </View>
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemTitle}>User Agreement</Text>
                  <Text style={styles.menuItemSub}>Terms of service and platform rules</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(241, 224, 228, 0.4)" />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setPolicyModal('privacy')}
                activeOpacity={0.75}
              >
                <View style={[styles.menuIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                  <Ionicons name="shield-checkmark" size={18} color="#38BDF8" />
                </View>
                <View style={styles.menuItemInfo}>
                  <Text style={styles.menuItemTitle}>Privacy Policy</Text>
                  <Text style={styles.menuItemSub}>Data protection & safety standards</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(241, 224, 228, 0.4)" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Section: Logout */}
          <View style={styles.sectionWrap}>
            <View style={styles.menuGroup}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleLogout}
                activeOpacity={0.75}
              >
                <View style={[styles.menuIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                  <Ionicons name="log-out" size={18} color="#EF4444" />
                </View>
                <View style={styles.menuItemInfo}>
                  <Text style={[styles.menuItemTitle, { color: '#EF4444' }]}>Log Out</Text>
                  <Text style={styles.menuItemSub}>Sign out of this session</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(239, 68, 68, 0.4)" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Disclaimer */}
          <View style={styles.disclaimerBox}>
            <Ionicons name="shield-checkmark" size={16} color="#8A899C" />
            <Text style={styles.disclaimerText}>
              DreamDate is a private entertainment simulation. All companion calls and messages are virtual simulations for entertainment purposes only.
            </Text>
          </View>
        </ScrollView>

        {/* Recharge Modal */}
        <RechargeModal visible={rechargeVisible} onClose={() => setRechargeVisible(false)} />

        {/* Daily Check-In 7-Day Rewards Modal */}
        <DailyCheckInModal visible={checkInVisible} onClose={() => setCheckInVisible(false)} />

        {/* Rate Us Modal */}
        <Modal
          visible={rateModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setRateModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.rateCard}>
              <Text style={{ fontSize: 36, textAlign: 'center', marginBottom: 8 }}>⭐</Text>
              <Text style={styles.rateTitle}>Enjoying DreamDate?</Text>
              <Text style={styles.rateSubtitle}>
                Tap the stars below to rate your experience with companions!
              </Text>

              {/* Star rating selector */}
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => {
                      setUserRating(star);
                      try {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      } catch (e) {}
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={star <= userRating ? 'star' : 'star-outline'}
                      size={36}
                      color="#FFD700"
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.rateActionsRow}>
                <TouchableOpacity
                  style={styles.rateCancelBtn}
                  onPress={() => setRateModalVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.rateCancelText}>Not Now</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rateSubmitBtn}
                  onPress={handleRateSubmit}
                  activeOpacity={0.85}
                >
                  <Text style={styles.rateSubmitText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* User Agreement & Privacy Policy Modal */}
        <Modal
          visible={policyModal !== null}
          transparent
          animationType="slide"
          onRequestClose={() => setPolicyModal(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.policyCard}>
              <View style={styles.policyHeader}>
                <Text style={styles.policyTitle}>
                  {policyModal === 'agreement' ? 'User Agreement' : 'Privacy Policy'}
                </Text>
                <TouchableOpacity
                  onPress={() => setPolicyModal(null)}
                  style={styles.policyCloseBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.policyScroll} showsVerticalScrollIndicator={false}>
                {policyModal === 'agreement' ? (
                  <View style={styles.policyTextWrap}>
                    <Text style={styles.policyHeading}>1. Acceptance of Terms</Text>
                    <Text style={styles.policyBody}>
                      By accessing DreamDate, you agree to be bound by these Terms of Service. DreamDate provides virtual companion interactions designed strictly for entertainment and social simulation.
                    </Text>

                    <Text style={styles.policyHeading}>2. Age Requirement</Text>
                    <Text style={styles.policyBody}>
                      You must be at least 18 years of age or the age of legal majority in your jurisdiction to use DreamDate.
                    </Text>

                    <Text style={styles.policyHeading}>3. Virtual Currencies & Coins</Text>
                    <Text style={styles.policyBody}>
                      Coins and virtual gifts purchased or granted within DreamDate have no real-world monetary value and cannot be redeemed for fiat currency.
                    </Text>

                    <Text style={styles.policyHeading}>4. Code of Conduct</Text>
                    <Text style={styles.policyBody}>
                      Users agree to maintain respectful communications. Harassment, illegal content, and offensive behavior will result in permanent account termination.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.policyTextWrap}>
                    <Text style={styles.policyHeading}>1. Information We Collect</Text>
                    <Text style={styles.policyBody}>
                      We collect basic usage diagnostics, coin transaction history, and local preferences to provide personalized virtual companion recommendations.
                    </Text>

                    <Text style={styles.policyHeading}>2. Security & Data Protection</Text>
                    <Text style={styles.policyBody}>
                      Your private chats and call histories are stored safely on your device and encrypted during network transmission. We do not sell user data to third parties.
                    </Text>

                    <Text style={styles.policyHeading}>3. Data Retention</Text>
                    <Text style={styles.policyBody}>
                      You can delete your chat histories and clear cached companion data at any time directly through the app settings or by contacting support.
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </BlurTargetView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1114',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(26, 17, 20, 0.85)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.3,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 110,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 20, 24, 0.75)',
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  userAvatarWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(246, 85, 146, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  vipTag: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  vipTagText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '900',
  },
  userId: {
    color: 'rgba(241, 224, 228, 0.65)',
    fontSize: 12,
  },
  balanceCard: {
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#F65592',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  balanceLeft: {
    gap: 4,
  },
  balanceTitle: {
    color: 'rgba(241, 224, 228, 0.75)',
    fontSize: 12,
    fontWeight: '600',
  },
  coinDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coinBigIcon: {
    fontSize: 22,
  },
  coinBigAmount: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: '800',
  },
  coinUnit: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 2,
  },
  rechargeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F65592',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    gap: 6,
    shadowColor: '#F65592',
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  rechargeBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  dualCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  featureCard: {
    flex: 1,
    backgroundColor: 'rgba(30, 20, 24, 0.75)',
    borderRadius: 18,
    padding: 14,
    gap: 8,
    position: 'relative',
  },
  featureIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCardContent: {
    gap: 2,
  },
  featureCardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  featureCardSub: {
    color: 'rgba(241, 224, 228, 0.65)',
    fontSize: 11,
  },
  featureCardBadge: {
    backgroundColor: 'rgba(246, 85, 146, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  featureCardBadgeText: {
    color: '#F65592',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionWrap: {
    gap: 8,
  },
  sectionHeaderTitle: {
    color: 'rgba(241, 224, 228, 0.65)',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginLeft: 4,
  },
  menuGroup: {
    backgroundColor: 'rgba(30, 20, 24, 0.75)',
    borderRadius: 18,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemInfo: {
    flex: 1,
    gap: 2,
  },
  menuItemTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  menuItemSub: {
    color: 'rgba(241, 224, 228, 0.55)',
    fontSize: 11,
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginLeft: 64,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 12,
    gap: 8,
    marginTop: 6,
  },
  disclaimerText: {
    color: 'rgba(241, 224, 228, 0.55)',
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  rateCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(28, 18, 22, 0.98)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  rateTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  rateSubtitle: {
    color: 'rgba(241, 224, 228, 0.7)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  rateActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  rateCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  rateCancelText: {
    color: 'rgba(241, 224, 228, 0.7)',
    fontSize: 13,
    fontWeight: '700',
  },
  rateSubmitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#F65592',
    alignItems: 'center',
  },
  rateSubmitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  policyCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '80%',
    backgroundColor: 'rgba(26, 17, 20, 0.98)',
    borderRadius: 24,
    overflow: 'hidden',
  },
  policyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(38, 26, 30, 0.9)',
  },
  policyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  policyCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  policyScroll: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  policyTextWrap: {
    gap: 12,
    paddingBottom: 24,
  },
  policyHeading: {
    color: '#F65592',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  policyBody: {
    color: 'rgba(241, 224, 228, 0.75)',
    fontSize: 12,
    lineHeight: 18,
  },
});
