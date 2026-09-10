import { Ionicons } from '@expo/vector-icons';
import { BlurTargetView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppBackground from '../../components/AppBackground';
import AppHeader from '../../components/AppHeader';
import AppModal from '../../components/AppModal';
import CoinIcon from '../../components/CoinIcon';
import DailyCheckInModal from '../../components/DailyCheckInModal';
import LegalViewerModal from '../../components/LegalViewerModal';
import RechargeModal from '../../components/RechargeModal';
import { useAuth } from '../../context/AuthContext';
import { useTabBlur } from '../../context/TabBlurContext';
import { useTheme } from '../../context/ThemeContext';
import { useWallet } from '../../services/wallet';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function UserProfileTab() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { coins } = useWallet();
  const { theme, isDark, toggleTheme } = useTheme();
  const { targets, notifyTargetMounted } = useTabBlur();

  // Modals state
  const [rechargeVisible, setRechargeVisible] = useState(false);
  const [checkInVisible, setCheckInVisible] = useState(false);
  const [policyModal, setPolicyModal] = useState<'agreement' | 'privacy' | null>(null);

  // AppModal dialogs state
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [loggedOutNoticeVisible, setLoggedOutNoticeVisible] = useState(false);
  const [rateModalVisible, setRateModalVisible] = useState(false);
  const [rateThanksVisible, setRateThanksVisible] = useState(false);
  const [userRating, setUserRating] = useState(5);

  // Entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    notifyTargetMounted();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRateSubmit = () => {
    setRateModalVisible(false);
    setTimeout(() => {
      setRateThanksVisible(true);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
    }, 250);
  };

  const handleConfirmLogout = async () => {
    setLogoutModalVisible(false);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      await logout();
    } catch (e) {
      console.error('Logout error', e);
    }
  };

  const handleThemeToggle = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    toggleTheme();
  };

  return (
    <BlurTargetView
      ref={targets.profile}
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
          {/* Standardized AppHeader (Consistent with Female Details Page) */}
          <AppHeader title="Profile" showCoins={true} />

          <View style={{ flex: 1 }}>
            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
            >
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                gap: 20,
              }}
            >
              {/* Hero Identity Presentation (Quiet Luxury Dribbble Style) */}
              <View
                style={[
                  styles.heroCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: isDark
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(0, 0, 0, 0.06)',
                  },
                ]}
              >
            {/* Top Row: Avatar & Identity */}
            <View style={styles.heroIdentityRow}>
              <View style={styles.avatarWrap}>
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatarCircle} />
                ) : (
                  <View
                    style={[
                      styles.avatarCircle,
                      {
                        backgroundColor: isDark
                          ? 'rgba(246, 85, 146, 0.16)'
                          : 'rgba(246, 85, 146, 0.12)',
                      },
                    ]}
                  >
                    <Text style={styles.avatarMonogram}>
                      {user?.name
                        ? user.name
                            .split(' ')
                            .map((w) => w[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()
                        : 'AM'}
                    </Text>
                  </View>
                )}
                <View style={styles.verifiedDot}>
                  <Ionicons name="checkmark-circle" size={18} color="#4ADE80" />
                </View>
              </View>

              <View style={styles.heroTextCol}>
                <View style={styles.heroNameRow}>
                  <Text
                    style={[
                      styles.heroName,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    {user?.name || 'Alex Morgan'}
                  </Text>
                  <View style={styles.vipPillBadge}>
                    <Text style={styles.vipPillBadgeText}>VIP ELITE</Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.heroHandle,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {user?.email ? `${user.email} · ID DD-782910` : '@alex · ID DD-782910'}
                </Text>
              </View>
            </View>

            {/* Subtle Divider */}
            <View
              style={[
                styles.cardInnerDivider,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
            />

            {/* Editorial Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text
                  style={[
                    styles.statValue,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  12
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  Matches
                </Text>
              </View>

              <View
                style={[
                  styles.statDivider,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.08)',
                  },
                ]}
              />

              <View style={styles.statCol}>
                <Text
                  style={[
                    styles.statValue,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  48
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  Calls
                </Text>
              </View>

              <View
                style={[
                  styles.statDivider,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.08)',
                  },
                ]}
              />

              <View style={styles.statCol}>
                <Text
                  style={[
                    styles.statValue,
                    { color: '#F65592' },
                  ]}
                >
                  98%
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  Rating
                </Text>
              </View>
            </View>
          </View>

          {/* Luxury Card: Wallet / Balance Tile */}
          <View
            style={[
              styles.walletCard,
              {
                backgroundColor: isDark ? '#191B1D' : '#FFFFFF',
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.06)'
                  : 'rgba(0, 0, 0, 0.06)',
              },
            ]}
          >
            <View style={styles.walletHeaderRow}>
              <View style={styles.walletTagRow}>
                <CoinIcon size={14} color="#FFD700" />
                <Text
                  style={[
                    styles.walletCardTag,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  DREAMDATE COIN BALANCE
                </Text>
              </View>
            </View>

            <View style={styles.walletMainRow}>
              <View style={styles.balanceCol}>
                <View style={styles.balanceNumberRow}>
                  <Text
                    style={[
                      styles.balanceAmount,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    {coins.toLocaleString()}
                  </Text>
                  <Text
                    style={[
                      styles.balanceUnit,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    Coins
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.rechargeBtn}
                onPress={() => setRechargeVisible(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.rechargeBtnText}>Recharge</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Section: Settings & Extras */}
          <View style={styles.sectionWrap}>
            <Text
              style={[
                styles.sectionHeaderLabel,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Membership & Perks
            </Text>

            <View
              style={[
                styles.menuGroupCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(0, 0, 0, 0.06)',
                },
              ]}
            >
              {/* Appearance / Theme Switcher */}
              <View style={styles.menuItem}>
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.05)',
                    },
                  ]}
                >
                  <Ionicons
                    name={isDark ? 'moon' : 'sunny'}
                    size={18}
                    color={isDark ? '#FFB1C6' : '#F65592'}
                  />
                </View>
                <View style={styles.menuItemTextCol}>
                  <Text
                    style={[
                      styles.menuItemTitle,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    Appearance
                  </Text>
                  <Text
                    style={[
                      styles.menuItemSubtitle,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {isDark ? 'Obsidian Dark' : 'Pearl Light'}
                  </Text>
                </View>
                <Switch
                  value={isDark}
                  onValueChange={handleThemeToggle}
                  trackColor={{
                    false: 'rgba(160, 160, 160, 0.3)',
                    true: '#F65592',
                  }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View
                style={[
                  styles.menuDivider,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.05)',
                  },
                ]}
              />

              {/* VIP Membership */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/vip' as any)}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: isDark
                        ? 'rgba(246, 85, 146, 0.14)'
                        : 'rgba(246, 85, 146, 0.1)',
                    },
                  ]}
                >
                  <Ionicons name="diamond" size={18} color="#F65592" />
                </View>
                <View style={styles.menuItemTextCol}>
                  <Text
                    style={[
                      styles.menuItemTitle,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    VIP Privileges
                  </Text>
                  <Text
                    style={[
                      styles.menuItemSubtitle,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    Unlimited HD calls & priority matching
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={theme.colors.onSurfaceVariant}
                />
              </TouchableOpacity>

              <View
                style={[
                  styles.menuDivider,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.05)',
                  },
                ]}
              />

              {/* Daily Streak Rewards */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setCheckInVisible(true)}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 184, 0, 0.14)'
                        : 'rgba(255, 184, 0, 0.1)',
                    },
                  ]}
                >
                  <Ionicons name="calendar" size={18} color="#EAB308" />
                </View>
                <View style={styles.menuItemTextCol}>
                  <Text
                    style={[
                      styles.menuItemTitle,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    Daily Check-In
                  </Text>
                  <Text
                    style={[
                      styles.menuItemSubtitle,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    Claim up to +500 free bonus coins
                  </Text>
                </View>
                <View style={styles.claimBadge}>
                  <Text style={styles.claimBadgeText}>CLAIM</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Section 2: Preferences & Support */}
          <View style={styles.sectionWrap}>
            <Text
              style={[
                styles.sectionHeaderLabel,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Preferences & Support
            </Text>

            <View
              style={[
                styles.menuGroupCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(0, 0, 0, 0.06)',
                },
              ]}
            >
              {/* Rate App */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setRateModalVisible(true)}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.05)',
                    },
                  ]}
                >
                  <Ionicons
                    name="star"
                    size={18}
                    color={isDark ? '#E2E2E2' : '#333333'}
                  />
                </View>
                <View style={styles.menuItemTextCol}>
                  <Text
                    style={[
                      styles.menuItemTitle,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    Rate Experience
                  </Text>
                  <Text
                    style={[
                      styles.menuItemSubtitle,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    Help us shape the future of companion AI
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={theme.colors.onSurfaceVariant}
                />
              </TouchableOpacity>

              <View
                style={[
                  styles.menuDivider,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.05)',
                  },
                ]}
              />

              {/* User Agreement */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setPolicyModal('agreement')}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.05)',
                    },
                  ]}
                >
                  <Ionicons
                    name="document-text"
                    size={18}
                    color={isDark ? '#E2E2E2' : '#333333'}
                  />
                </View>
                <View style={styles.menuItemTextCol}>
                  <Text
                    style={[
                      styles.menuItemTitle,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    Terms of Service
                  </Text>
                  <Text
                    style={[
                      styles.menuItemSubtitle,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    Usage guidelines and platform rules
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={theme.colors.onSurfaceVariant}
                />
              </TouchableOpacity>

              <View
                style={[
                  styles.menuDivider,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.05)',
                  },
                ]}
              />

              {/* Privacy Policy */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setPolicyModal('privacy')}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.05)',
                    },
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark"
                    size={18}
                    color={isDark ? '#E2E2E2' : '#333333'}
                  />
                </View>
                <View style={styles.menuItemTextCol}>
                  <Text
                    style={[
                      styles.menuItemTitle,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    Privacy & Security
                  </Text>
                  <Text
                    style={[
                      styles.menuItemSubtitle,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    Encrypted conversations and private storage
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={theme.colors.onSurfaceVariant}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Out (Quiet Luxury Clean Action) */}
          <TouchableOpacity
            style={[
              styles.signOutButton,
              {
                backgroundColor: theme.colors.surface,
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.06)'
                  : 'rgba(0, 0, 0, 0.06)',
              },
            ]}
            onPress={() => setLogoutModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={18} color="#E11D48" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          <Text
            style={[
              styles.appVersionText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            DreamDate · v1.0.0
          </Text>
        </Animated.View>
      </ScrollView>
    </View>

      {/* Global Reusable AppModals */}
      <RechargeModal
        visible={rechargeVisible}
        onClose={() => setRechargeVisible(false)}
      />

      <DailyCheckInModal
        visible={checkInVisible}
        onClose={() => setCheckInVisible(false)}
      />

      {/* Sign Out Confirmation Modal */}
      <AppModal
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
        title="Sign Out"
        description="Are you sure you want to sign out of your DreamDate account?"
        icon="log-out-outline"
        iconColor="#E11D48"
        primaryAction={{
          label: 'Sign Out',
          variant: 'destructive',
          onPress: handleConfirmLogout,
        }}
        secondaryAction={{
          label: 'Cancel',
          onPress: () => setLogoutModalVisible(false),
        }}
      />

      {/* Signed Out Notice Modal */}
      <AppModal
        visible={loggedOutNoticeVisible}
        onClose={() => setLoggedOutNoticeVisible(false)}
        title="Signed Out"
        description="You have been signed out safely. Come back anytime!"
        icon="checkmark-circle-outline"
        iconColor="#4ADE80"
        primaryAction={{
          label: 'OK',
          onPress: () => setLoggedOutNoticeVisible(false),
        }}
      />

      {/* Rate Us Modal */}
      <AppModal
        visible={rateModalVisible}
        onClose={() => setRateModalVisible(false)}
        title="Rate Experience"
        description="Tap a star to rate your companion connection quality."
        icon="star-outline"
        iconColor="#F65592"
        primaryAction={{
          label: 'Submit Rating',
          onPress: handleRateSubmit,
        }}
        secondaryAction={{
          label: 'Cancel',
          onPress: () => setRateModalVisible(false),
        }}
      >
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
                size={34}
                color="#F65592"
              />
            </TouchableOpacity>
          ))}
        </View>
      </AppModal>

      {/* Rating Thank You Modal */}
      <AppModal
        visible={rateThanksVisible}
        onClose={() => setRateThanksVisible(false)}
        title="Thank You"
        description={`You rated DreamDate ${userRating} stars! Your feedback helps us make every connection magical.`}
        icon="star"
        iconColor="#F65592"
        primaryAction={{
          label: 'Close',
          onPress: () => setRateThanksVisible(false),
        }}
      />

      {/* Full Legally-Protective User Agreement & Privacy Policy Modal */}
      <LegalViewerModal
        visible={policyModal !== null}
        initialTab={policyModal === 'agreement' ? 'terms' : 'privacy'}
        onClose={() => setPolicyModal(null)}
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 110,
  },

  // Hero Card
  heroCard: {
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
  },
  heroIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(246, 85, 146, 0.4)',
  },
  avatarMonogram: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F65592',
    letterSpacing: 0.5,
  },
  verifiedDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#000',
    borderRadius: 10,
  },
  heroTextCol: {
    flex: 1,
    gap: 4,
  },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  vipPillBadge: {
    backgroundColor: 'rgba(246, 85, 146, 0.16)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  vipPillBadgeText: {
    color: '#F65592',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroHandle: {
    fontSize: 13,
    fontWeight: '500',
  },
  cardInnerDivider: {
    height: 1,
    marginVertical: 18,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
  },

  // Wallet Card
  walletCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
  },
  walletHeaderRow: {
    marginBottom: 12,
  },
  walletTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  walletCardTag: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  walletMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceCol: {
    flex: 1,
  },
  balanceNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  balanceUnit: {
    fontSize: 14,
    fontWeight: '500',
  },
  rechargeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F65592',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 22,
  },
  rechargeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Sections
  sectionWrap: {
    gap: 8,
  },
  sectionHeaderLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  menuGroupCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 18,
    gap: 14,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTextCol: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  menuItemSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  claimBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.16)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  claimBadgeText: {
    color: '#EAB308',
    fontSize: 10,
    fontWeight: '700',
  },
  menuDivider: {
    height: 1,
    marginLeft: 70,
  },

  // Sign Out
  signOutButton: {
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderWidth: 1,
    marginTop: 6,
  },
  signOutText: {
    color: '#E11D48',
    fontSize: 15,
    fontWeight: '700',
  },
  appVersionText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 4,
  },

  // Stars in Rate Modal
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 8,
  },

  // Policy Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  policyCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    borderRadius: 24,
    padding: 20,
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.15)',
  },
  policyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  policyCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  policyScroll: {
    marginTop: 14,
  },
  policyTextWrap: {
    gap: 14,
    paddingBottom: 10,
  },
  policyHeading: {
    fontSize: 14,
    fontWeight: '700',
  },
  policyBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  topScrollFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 18,
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
