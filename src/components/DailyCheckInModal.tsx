import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppModal from './AppModal';
import CoinIcon from './CoinIcon';
import RechargeModal from './RechargeModal';
import { useTheme } from '../context/ThemeContext';
import { addCoins, useWallet } from '../services/wallet';

interface Props {
  visible: boolean;
  onClose: () => void;
}

interface DayReward {
  day: number;
  coins: number;
  label: string;
  isCoinReward: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
}

const CHECKIN_REWARDS: DayReward[] = [
  { day: 1, coins: 50, label: 'Day 1', isCoinReward: true },
  { day: 2, coins: 75, label: 'Day 2', isCoinReward: true },
  { day: 3, coins: 100, label: 'Day 3', isCoinReward: true },
  { day: 4, coins: 150, label: 'Day 4', isCoinReward: true },
  { day: 5, coins: 200, label: 'Day 5', isCoinReward: false, iconName: 'diamond' },
  { day: 6, coins: 300, label: 'Day 6', isCoinReward: false, iconName: 'diamond' },
  { day: 7, coins: 500, label: 'Day 7', isCoinReward: false, iconName: 'gift' },
];

const STORAGE_DAY_KEY = '@dreamdate_checkin_current_day_v2';
const STORAGE_DATE_KEY = '@dreamdate_last_checkin_timestamp_v2';

export default function DailyCheckInModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { hasPurchased } = useWallet();
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [alreadyClaimedToday, setAlreadyClaimedToday] = useState(false);
  const [justClaimedAmount, setJustClaimedAmount] = useState<number | null>(null);
  const [claimSuccessModalVisible, setClaimSuccessModalVisible] = useState(false);
  const [rechargeModalVisible, setRechargeModalVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      loadCheckInState();
    }
  }, [visible]);

  const loadCheckInState = async () => {
    try {
      const storedDay = await AsyncStorage.getItem(STORAGE_DAY_KEY);
      const storedDate = await AsyncStorage.getItem(STORAGE_DATE_KEY);

      const todayStr = new Date().toDateString();
      let dayIdx = storedDay ? parseInt(storedDay, 10) : 0;

      if (storedDate === todayStr) {
        setAlreadyClaimedToday(true);
      } else {
        setAlreadyClaimedToday(false);
        // If yesterday was missed (more than 1 day difference), reset streak
        if (storedDate) {
          const lastDate = new Date(storedDate);
          const now = new Date();
          const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
          if (diffDays > 1) {
            dayIdx = 0; // Reset streak if missed a day
            await AsyncStorage.setItem(STORAGE_DAY_KEY, '0');
          }
        }
      }

      setCurrentDayIndex(Math.min(dayIdx, 6));
    } catch (e) {
      setCurrentDayIndex(0);
    }
  };

  const handleClaim = async () => {
    if (alreadyClaimedToday) return;

    const reward = CHECKIN_REWARDS[currentDayIndex];
    await addCoins(reward.coins);

    const todayStr = new Date().toDateString();
    const nextDay = (currentDayIndex + 1) % 7;

    await AsyncStorage.setItem(STORAGE_DAY_KEY, nextDay.toString());
    await AsyncStorage.setItem(STORAGE_DATE_KEY, todayStr);

    setAlreadyClaimedToday(true);
    setJustClaimedAmount(reward.coins);

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    setClaimSuccessModalVisible(true);
  };

  const todayReward = CHECKIN_REWARDS[currentDayIndex];

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheetWrap,
            {
              backgroundColor: isDark
                ? 'rgba(26, 17, 20, 0.98)'
                : 'rgba(255, 255, 255, 0.98)',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        >
          <BlurView
            intensity={90}
            tint={isDark ? 'dark' : 'light'}
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 14 }]}
          >
            {/* Header: Title + Streak Pill + Close Button */}
            <View style={styles.header}>
              <View style={styles.headerTitleCol}>
                <View style={styles.titleRow}>
                  <Text
                    style={[
                      styles.title,
                      { color: isDark ? '#F1E0E4' : '#191C1D' },
                    ]}
                  >
                    Daily Check-In
                  </Text>
                  <View style={styles.streakBadge}>
                    <Ionicons name="flame" size={12} color="#F65592" />
                    <Text style={styles.streakBadgeText}>
                      Day {currentDayIndex + 1} of 7
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.subtitle,
                    { color: isDark ? 'rgba(241, 224, 228, 0.65)' : '#6B7280' },
                  ]}
                >
                  Check in daily to increase your rewards. Missing a day resets the streak!
                </Text>
              </View>

              <TouchableOpacity
                onPress={onClose}
                style={[
                  styles.closeBtn,
                  {
                    backgroundColor: isDark
                      ? 'rgba(61, 50, 53, 0.85)'
                      : 'rgba(0, 0, 0, 0.06)',
                  },
                ]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={isDark ? '#F1E0E4' : '#191C1D'}
                />
              </TouchableOpacity>
            </View>

            {/* 7 Days Rewards Grid */}
            <View style={styles.daysGrid}>
              {CHECKIN_REWARDS.slice(0, 6).map((reward, index) => {
                const isClaimed = index < currentDayIndex;
                const isToday = index === currentDayIndex && !alreadyClaimedToday;

                return (
                  <View
                    key={reward.day}
                    style={[
                      styles.dayCard,
                      {
                        backgroundColor: isToday
                          ? isDark
                            ? 'rgba(246, 85, 146, 0.22)'
                            : 'rgba(246, 85, 146, 0.14)'
                          : isClaimed
                          ? isDark
                            ? 'rgba(20, 30, 24, 0.50)'
                            : 'rgba(74, 222, 128, 0.12)'
                          : isDark
                          ? 'rgba(39, 29, 32, 0.70)'
                          : 'rgba(0, 0, 0, 0.04)',
                        borderColor: isToday
                          ? '#F65592'
                          : isClaimed
                          ? '#4ADE80'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.06)'
                          : 'rgba(0, 0, 0, 0.06)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        {
                          color: isToday
                            ? isDark ? '#FFFFFF' : '#191C1D'
                            : isDark ? 'rgba(241, 224, 228, 0.6)' : '#6B7280',
                          fontWeight: isToday ? '800' : '600',
                        },
                      ]}
                    >
                      {reward.label}
                    </Text>

                    <View style={styles.dayIconBox}>
                      {reward.isCoinReward ? (
                        <CoinIcon
                          size={22}
                          color={isToday ? '#FFD700' : isClaimed ? '#4ADE80' : '#F65592'}
                        />
                      ) : (
                        <Ionicons
                          name={reward.iconName || 'gift'}
                          size={20}
                          color={isToday ? '#FFD700' : isClaimed ? '#4ADE80' : '#F65592'}
                        />
                      )}
                    </View>

                    <Text
                      style={[
                        styles.dayCoinsText,
                        { color: isDark ? '#FFD700' : '#D97706' },
                      ]}
                    >
                      +{reward.coins}
                    </Text>

                    {isClaimed ? (
                      <View style={styles.claimedBadge}>
                        <Ionicons name="checkmark" size={12} color="#FFF" />
                      </View>
                    ) : isToday ? (
                      <View style={styles.todayIndicatorPill}>
                        <Text style={styles.todayIndicatorText}>TODAY</Text>
                      </View>
                    ) : (
                      <View style={styles.lockedBadge}>
                        <Ionicons
                          name="lock-closed"
                          size={10}
                          color={isDark ? 'rgba(241, 224, 228, 0.4)' : '#9CA3AF'}
                        />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Day 7 Highlight Card (Premium Mystery Chest) */}
            {(() => {
              const day7 = CHECKIN_REWARDS[6];
              const isClaimed7 = currentDayIndex === 6 && alreadyClaimedToday;
              const isToday7 = currentDayIndex === 6 && !alreadyClaimedToday;

              const day7Colors = isDark
                ? (isToday7 ? ['#54360B', '#8C5A12', '#452A05'] : ['#2E1F0E', '#3D2A14', '#241608'])
                : (isToday7 ? ['#FFF8E1', '#FEEFC3', '#FDE49E'] : ['#FAF5EB', '#F5EBD7', '#EDE0C4']);

              return (
                <LinearGradient
                  colors={day7Colors as [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.day7Card,
                    isToday7 && styles.day7CardToday,
                    {
                      borderColor: isToday7
                        ? '#FFD700'
                        : isDark
                        ? 'rgba(255, 215, 0, 0.25)'
                        : 'rgba(217, 119, 6, 0.25)',
                    },
                  ]}
                >
                  <View style={styles.day7Left}>
                    <View style={styles.day7BadgeRow}>
                      <View style={[styles.day7GoldBadge, { backgroundColor: isDark ? 'rgba(255, 215, 0, 0.20)' : 'rgba(217, 119, 6, 0.15)' }]}>
                        <Ionicons name="sparkles" size={11} color={isDark ? '#FFD700' : '#D97706'} />
                        <Text style={[styles.day7GoldBadgeText, { color: isDark ? '#FFD700' : '#D97706' }]}>
                          GRAND PRIZE
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.day7Title,
                        { color: isDark ? '#FFF4CC' : '#451A03' },
                      ]}
                    >
                      Day 7 • Royal Mystery Chest
                    </Text>
                    <Text
                      style={[
                        styles.day7Sub,
                        { color: isDark ? 'rgba(255, 235, 170, 0.75)' : '#78350F' },
                      ]}
                    >
                      Consecutive check-in ultimate treasure
                    </Text>
                    <View
                      style={[
                        styles.day7CoinsPill,
                        {
                          backgroundColor: isDark
                            ? 'rgba(255, 215, 0, 0.22)'
                            : 'rgba(217, 119, 6, 0.18)',
                          borderColor: isDark
                            ? 'rgba(255, 215, 0, 0.40)'
                            : 'rgba(217, 119, 6, 0.30)',
                        },
                      ]}
                    >
                      <CoinIcon size={16} color={isDark ? '#FFD700' : '#D97706'} />
                      <Text
                        style={[
                          styles.day7CoinsText,
                          { color: isDark ? '#FFD700' : '#B45309' },
                        ]}
                      >
                        +{day7.coins} Free Coins
                      </Text>
                    </View>
                  </View>
                  <View style={styles.day7Right}>
                    <Ionicons name="gift" size={42} color={isDark ? '#FFD700' : '#D97706'} />
                    {isClaimed7 ? (
                      <View style={styles.claimedBadge}>
                        <Ionicons name="checkmark" size={14} color="#FFF" />
                      </View>
                    ) : null}
                  </View>
                </LinearGradient>
              );
            })()}

            {/* If user hasn't made a recharge or VIP purchase, show locked banner and unlock button */}
            {!hasPurchased ? (
              <View
                style={[
                  styles.lockedMemberCard,
                  {
                    backgroundColor: isDark
                      ? 'rgba(239, 68, 68, 0.16)'
                      : 'rgba(239, 68, 68, 0.08)',
                  },
                ]}
              >
                <Ionicons name="lock-closed" size={20} color="#EF4444" />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.lockedMemberTitle,
                      { color: isDark ? '#FFFFFF' : '#991B1B' },
                    ]}
                  >
                    Members-Only Exclusive Perk
                  </Text>
                  <Text
                    style={[
                      styles.lockedMemberSub,
                      { color: isDark ? '#FCA5A5' : '#B91C1C' },
                    ]}
                  >
                    Daily Check-In is unlocked after at least 1 recharge or VIP pass. Complete a recharge to start claiming 7 days of daily free coins!
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Claim Action Button or Recharge Button */}
            {!hasPurchased ? (
              <TouchableOpacity
                style={styles.claimBtn}
                onPress={() => setRechargeModalVisible(true)}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={['#F65592', '#E11D48']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.claimBtnGradient}
                >
                  <Ionicons name="flash" size={20} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.claimBtnText}>
                    Recharge to Unlock Daily Rewards
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.claimBtn,
                  alreadyClaimedToday && styles.claimBtnDisabled,
                ]}
                onPress={handleClaim}
                disabled={alreadyClaimedToday}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={
                    alreadyClaimedToday
                      ? ['#3D3538', '#2D282A']
                      : ['#FF2A7A', '#FF69B4', '#FF416C']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.claimBtnGradient}
                >
                  <Ionicons
                    name={alreadyClaimedToday ? 'checkmark-circle' : 'gift'}
                    size={20}
                    color="#FFF"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.claimBtnText}>
                    {alreadyClaimedToday
                      ? 'Checked In Today • Come Back Tomorrow'
                      : `Claim Day ${todayReward.day} Bonus (+${todayReward.coins} Coins)`}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </BlurView>
        </View>

        {/* Recharge Modal to unlock daily check in */}
        <RechargeModal
          visible={rechargeModalVisible}
          onClose={() => setRechargeModalVisible(false)}
        />

        {/* Daily Bonus Claimed Custom Modal */}
        <AppModal
          visible={claimSuccessModalVisible}
          useModalHost={false}
          onClose={() => setClaimSuccessModalVisible(false)}
          title="Daily Bonus Claimed!"
          description={`You received +${justClaimedAmount || todayReward.coins} Coins!\n\nConsistency Streak: Day ${todayReward.day} Completed! Keep checking in daily for bigger rewards.`}
          icon="gift-outline"
          iconColor="#FFD700"
          primaryAction={{
            label: 'Awesome!',
            onPress: () => setClaimSuccessModalVisible(false),
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(26, 17, 20, 0.98)',
  },
  sheet: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitleCol: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F1E0E4',
    letterSpacing: -0.3,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(246, 85, 146, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  streakBadgeText: {
    color: '#F65592',
    fontSize: 11,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(241, 224, 228, 0.65)',
    lineHeight: 16,
    paddingRight: 10,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(61, 50, 53, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayCard: {
    width: '31%',
    backgroundColor: 'rgba(39, 29, 32, 0.75)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
    position: 'relative',
  },
  dayCardToday: {
    backgroundColor: 'rgba(246, 85, 146, 0.22)',
  },
  dayCardClaimed: {
    opacity: 0.6,
  },
  dayNumber: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(241, 224, 228, 0.6)',
  },
  dayIconBox: {
    marginVertical: 2,
  },
  dayCoinsText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFD700',
  },
  claimedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4ADE80',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  todayIndicatorPill: {
    backgroundColor: '#F65592',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
  },
  todayIndicatorText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  lockedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  day7Card: {
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  day7CardToday: {},
  day7Left: {
    gap: 4,
  },
  day7Title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  day7Sub: {
    color: 'rgba(241, 224, 228, 0.7)',
    fontSize: 11,
  },
  day7BadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  day7GoldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  day7GoldBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  day7CoinsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  day7CoinsText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '800',
  },
  day7Right: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimBtn: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  claimBtnDisabled: {
    opacity: 0.7,
  },
  claimBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  claimBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  lockedMemberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 12,
    gap: 10,
    marginBottom: 14,
  },
  lockedMemberTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  lockedMemberSub: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
});
